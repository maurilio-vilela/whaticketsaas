import * as Sentry from "@sentry/node";
import { promises as fsPromises } from "fs";
import { head, isNil } from "lodash";
import path, { join } from "path";
import { promisify } from "util";
import {
  map_msg,
  getJidFromMessage,
  getLidFromMessage,
} from "../../utils/global";
import type { proto, WAMessage, WAMessageUpdate, WASocket } from "whaileys";
import Contact from "../../models/Contact";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import { Mutex } from "async-mutex";
import {
  AudioConfig,
  SpeechConfig,
  SpeechSynthesizer,
} from "microsoft-cognitiveservices-speech-sdk";
import moment from "moment";
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
import { Op } from "sequelize";
import formatBody from "../../helpers/Mustache";
import ffmpeg from "fluent-ffmpeg";
import { cacheLayer } from "../../libs/cache";
import { getIO } from "../../libs/socket";
import { Store } from "../../libs/store";
import MarkDeleteWhatsAppMessage from "./MarkDeleteWhatsAppMessage";
import Campaign from "../../models/Campaign";
import * as MessageUtils from "./wbotGetMessageFromType";
import CampaignShipping from "../../models/CampaignShipping";
import Queue from "../../models/Queue";
import QueueIntegrations from "../../models/QueueIntegrations";
import QueueOption from "../../models/QueueOption";
import Setting from "../../models/Setting";
import TicketTraking from "../../models/TicketTraking";
import User from "../../models/User";
import UserRating from "../../models/UserRating";
import { campaignQueue, parseToMilliseconds, randomValue } from "../../queues";
import { logger } from "../../utils/logger";
import VerifyCurrentSchedule from "../CompanyService/VerifyCurrentSchedule";
import CreateOrUpdateContactService from "../ContactServices/CreateOrUpdateContactService";
import CreateMessageService from "../MessageServices/CreateMessageService";
import ShowQueueIntegrationService from "../QueueIntegrationServices/ShowQueueIntegrationService";
import FindOrCreateATicketTrakingService from "../TicketServices/FindOrCreateATicketTrakingService";
import FindOrCreateTicketService from "../TicketServices/FindOrCreateTicketService";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import typebotListener from "../TypebotServices/typebotListener";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import { provider } from "./providers";
import { SimpleObjectCache } from "../../helpers/simpleObjectCache";
import SendWhatsAppMessage from "./SendWhatsAppMessage";
import { getMessageOptions } from "./SendWhatsAppMedia";
import { addMsgAckJob } from "./BullAckService";
import { CreateOrUpdateBaileysChatService } from "../BaileysChatServices/CreateOrUpdateBaileysChatService";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import axios from "axios";

ffmpeg.setFfmpegPath(ffmpegPath.path);
const request = require("request");
const fs = require("fs");

const debugLog = (msg: string) => {
  logger.info(`[DEBUG ${new Date().toLocaleTimeString()}] ${msg}`);
};

// =========================================================================
// CACHE DA BIBLIOTECA WHAILEYS (Resolve alto uso de CPU)
// =========================================================================
let baileysCachePromise: Promise<any> | null = null;
const loadBaileysUtils = async () => {
  if (!baileysCachePromise) {
    baileysCachePromise = eval('import("whaileys")')
      .then((baileys: any) => {
        const base = baileys.makeWASocket ? baileys : baileys.default;
        return {
          downloadMediaMessage: base.downloadMediaMessage,
          extractMessageContent: base.extractMessageContent,
          getContentType: base.getContentType,
          jidNormalizedUser: base.jidNormalizedUser,
          MessageUpsertType: base.MessageUpsertType,
          proto: base.proto,
          WAMessage: base.WAMessage,
          WAMessageStubType: base.WAMessageStubType,
          WAMessageUpdate: base.WAMessageUpdate,
          delay: base.delay,
          Chat: base.Chat,
          WASocket: base.WASocket,
        };
      })
      .catch((err: any) => {
        baileysCachePromise = null;
        throw err;
      });
  }
  return baileysCachePromise;
};

const getStubType = async () => {
  const { WAMessageStubType } = await loadBaileysUtils();
  return WAMessageStubType;
};

type Session = WASocket & { id?: number; store?: Store };
interface SessionOpenAi extends OpenAIApi {
  id?: number;
}
const sessionsOpenAi: SessionOpenAi[] = [];

interface ImessageUpsert {
  messages: proto.IWebMessageInfo[];
  type: any;
}

interface IMe {
  name: string | undefined;
  id: string;
  lid?: string;
}

interface IMessage {
  messages: WAMessage[];
  isLatest: boolean;
}

export const isNumeric = (value: string) => /^-?\d+$/.test(value);
const writeFileAsync = fsPromises.writeFile;
const wbotMutex = new Mutex();
const ticketMutex = new Mutex();
const groupContactCache = new SimpleObjectCache(1000 * 30, logger);

const normalizeJid = (jid: string): string => {
  if (!jid) return "";
  return jid.replace(/@[^.]+\.whatsapp\.net$/, "@s.whatsapp.net");
};

const unifyDuplicateContacts = async (companyId: number): Promise<void> => {
  try {
    const contacts = await Contact.findAll({
      where: { companyId },
      order: [["createdAt", "ASC"]],
    });
    const jidMap = new Map<string, Contact>();
    for (const contact of contacts) {
      const normalizedJid = normalizeJid(contact.number);
      if (jidMap.has(normalizedJid)) {
        const existingContact = jidMap.get(normalizedJid)!;
        await Ticket.update(
          { contactId: existingContact.id },
          { where: { contactId: contact.id, companyId } },
        );
        await Message.update(
          { contactId: existingContact.id },
          { where: { contactId: contact.id, companyId } },
        );
        await contact.destroy();
      } else {
        jidMap.set(normalizedJid, contact);
      }
    }
  } catch (error) {
    logger.error(`Erro unificando contatos: ${error}`);
  }
};

const multVecardGet = function (param: any) {
  let output = " ";
  let name = param
    .split("\n")[2]
    .replace(";;;", "\n")
    .replace("N:", "")
    .replace(";", "")
    .replace(";", " ")
    .replace(";;", " ")
    .replace("\n", "");
  let inicio = param.split("\n")[4].indexOf("=");
  let fim = param.split("\n")[4].indexOf(":");
  let contact = param
    .split("\n")[4]
    .substring(inicio + 1, fim)
    .replace(";", "");
  let contactSemWhats = param.split("\n")[4].replace("item1.TEL:", "");
  if (contact != "item1.TEL")
    output = output + name + ": 📞" + contact + "" + "\n";
  else output = output + name + ": 📞" + contactSemWhats + "" + "\n";
  return output;
};

const contactsArrayMessageGet = (msg: any) => {
  let contactsArray = msg.message?.contactsArrayMessage?.contacts;
  let vcardMulti = contactsArray.map(function (item: any, indice: number) {
    return item.vcard;
  });
  let bodymessage = ``;
  vcardMulti.forEach(function (vcard: any, indice: number) {
    bodymessage += vcard + "\n\n" + "";
  });
  let contacts = bodymessage.split("BEGIN:");
  contacts.shift();
  let finalContacts = "";
  for (let contact of contacts) {
    finalContacts = finalContacts + multVecardGet(contact);
  }
  return finalContacts;
};

export const getTypeMessage = async (
  msg: proto.IWebMessageInfo,
): Promise<string> => {
  try {
    if (!msg?.message) return "";
    const { getContentType } = await loadBaileysUtils();
    return getContentType(msg.message) || "";
  } catch (err) {
    return "";
  }
};

export function validaCpfCnpj(val: any) {
  if (val.length == 11) {
    var cpf = val.trim();
    cpf = cpf.replace(/\./g, "");
    cpf = cpf.replace("-", "");
    cpf = cpf.split("");
    var v1 = 0;
    var v2 = 0;
    var aux = false;
    for (var i = 1; cpf.length > i; i++) {
      if (cpf[i - 1] != cpf[i]) {
        aux = true;
      }
    }
    if (aux == false) {
      return false;
    }
    for (var i = 0, p = 10; cpf.length - 2 > i; i++, p--) {
      v1 += cpf[i] * p;
    }
    v1 = (v1 * 10) % 11;
    if (v1 == 10) {
      v1 = 0;
    }
    if (v1 != cpf[9]) {
      return false;
    }
    for (var i = 0, p = 11; cpf.length - 1 > i; i++, p--) {
      v2 += cpf[i] * p;
    }
    v2 = (v2 * 10) % 11;
    if (v2 == 10) {
      v2 = 0;
    }
    if (v2 != cpf[10]) {
      return false;
    } else {
      return true;
    }
  } else if (val.length == 14) {
    var cnpj = val.trim();
    cnpj = cnpj.replace(/\./g, "");
    cnpj = cnpj.replace("-", "");
    cnpj = cnpj.replace("/", "");
    cnpj = cnpj.split("");
    var v1 = 0;
    var v2 = 0;
    var aux = false;
    for (var i = 1; cnpj.length > i; i++) {
      if (cnpj[i - 1] != cnpj[i]) {
        aux = true;
      }
    }
    if (aux == false) {
      return false;
    }
    for (var i = 0, p1 = 5, p2 = 13; cnpj.length - 2 > i; i++, p1--, p2--) {
      if (p1 >= 2) {
        v1 += cnpj[i] * p1;
      } else {
        v1 += cnpj[i] * p2;
      }
    }
    v1 = v1 % 11;
    if (v1 < 2) {
      v1 = 0;
    } else {
      v1 = 11 - v1;
    }
    if (v1 != cnpj[12]) {
      return false;
    }
    for (var i = 0, p1 = 6, p2 = 14; cnpj.length - 1 > i; i++, p1--, p2--) {
      if (p1 >= 2) {
        v2 += cnpj[i] * p1;
      } else {
        v2 += cnpj[i] * p2;
      }
    }
    v2 = v2 % 11;
    if (v2 < 2) {
      v2 = 0;
    } else {
      v2 = 11 - v2;
    }
    if (v2 != cnpj[13]) {
      return false;
    } else {
      return true;
    }
  } else {
    return false;
  }
}

function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
export async function sleep(time: number) {
  await timeout(time);
}

export const sendMessageImage = async (
  wbot: Session,
  contact: any,
  ticket: Ticket,
  url: string,
  caption: string,
) => {
  let sentMessage;
  try {
    sentMessage = await wbot.sendMessage(
      `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
      {
        image: url
          ? { url }
          : fs.readFileSync(`public/temp/${caption}-${makeid(10)}`),
        fileName: caption,
        caption: caption,
        mimetype: "image/jpeg",
      },
    );
  } catch (error) {
    sentMessage = await wbot.sendMessage(
      `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
      {
        text: formatBody(
          "Não consegui enviar o PDF, tente novamente!",
          contact,
        ),
      },
    );
  }
  verifyMessage(sentMessage as any, ticket, contact);
};

export const sendMessageLink = async (
  wbot: Session,
  contact: Contact,
  ticket: Ticket,
  url: string,
  caption: string,
) => {
  let sentMessage;
  try {
    sentMessage = await wbot.sendMessage(
      `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
      {
        document: url
          ? { url }
          : fs.readFileSync(`public/temp/${caption}-${makeid(10)}`),
        fileName: caption,
        caption: caption,
        mimetype: "application/pdf",
      },
    );
  } catch (error) {
    sentMessage = await wbot.sendMessage(
      `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
      {
        text: formatBody(
          "Não consegui enviar o PDF, tente novamente!",
          contact,
        ),
      },
    );
  }
  verifyMessage(sentMessage as any, ticket, contact);
};

export function makeid(length: number) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const getBodyButton = (msg: proto.IWebMessageInfo): string => {
  if (
    msg.key.fromMe &&
    msg?.message?.viewOnceMessage?.message?.buttonsMessage?.contentText
  ) {
    let bodyMessage = `*${msg?.message?.viewOnceMessage?.message?.buttonsMessage?.contentText}*`;
    for (const buton of msg.message?.viewOnceMessage?.message?.buttonsMessage
      ?.buttons) {
      bodyMessage += `\n\n${buton.buttonText?.displayText}`;
    }
    return bodyMessage;
  }
  if (msg.key.fromMe && msg?.message?.viewOnceMessage?.message?.listMessage) {
    let bodyMessage = `*${msg?.message?.viewOnceMessage?.message?.listMessage?.description}*`;
    for (const buton of msg.message?.viewOnceMessage?.message?.listMessage
      ?.sections) {
      for (const rows of buton.rows) {
        bodyMessage += `\n\n${rows.title}`;
      }
    }
    return bodyMessage;
  }
  return "";
};

const msgLocation = (image: any, latitude: number, longitude: number) => {
  if (image) {
    var b64 = Buffer.from(image).toString("base64");
    return `data:image/png;base64,${b64}| https://maps.google.com/maps?q=${latitude}%2C${longitude}&z=17&hl=pt-BR|${latitude},${longitude}`;
  }
  return null;
};

export const getBodyMessage = async (
  msg: proto.IWebMessageInfo,
): Promise<string | null> => {
  try {
    const type = await getTypeMessage(msg);
    if (!type) return null;

    const types: { [key: string]: any } = {
      conversation: msg?.message?.conversation,
      editedMessage:
        msg?.message?.editedMessage?.message?.protocolMessage?.editedMessage
          ?.conversation,
      imageMessage: msg.message?.imageMessage?.caption,
      videoMessage: msg.message?.videoMessage?.caption,
      extendedTextMessage: msg.message?.extendedTextMessage?.text,
      buttonsResponseMessage:
        msg.message?.buttonsResponseMessage?.selectedButtonId,
      templateButtonReplyMessage:
        msg.message?.templateButtonReplyMessage?.selectedId,
      messageContextInfo:
        msg.message?.buttonsResponseMessage?.selectedButtonId ||
        msg.message?.listResponseMessage?.title,
      buttonsMessage:
        getBodyButton(msg) ||
        msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId,
      viewOnceMessage:
        getBodyButton(msg) ||
        msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId,
      stickerMessage: "sticker",
      reactionMessage: MessageUtils.getReactionMessage(msg) || "reaction",
      contactMessage: msg.message?.contactMessage?.vcard,
      contactsArrayMessage:
        msg.message?.contactsArrayMessage?.contacts &&
        contactsArrayMessageGet(msg),
      locationMessage: msgLocation(
        msg.message?.locationMessage?.jpegThumbnail,
        msg.message?.locationMessage?.degreesLatitude,
        msg.message?.locationMessage?.degreesLongitude,
      ),
      liveLocationMessage: `Latitude: ${msg.message?.liveLocationMessage?.degreesLatitude} - Longitude: ${msg.message?.liveLocationMessage?.degreesLongitude}`,
      documentMessage: msg.message?.documentMessage?.title,
      documentWithCaptionMessage:
        msg.message?.documentWithCaptionMessage?.message?.documentMessage
          ?.caption,
      audioMessage: "Áudio",
      listMessage:
        getBodyButton(msg) || msg.message?.listResponseMessage?.title,
      listResponseMessage:
        msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId,
    };
    return types[type] || null;
  } catch (error) {
    return null;
  }
};

export const getQuotedMessageId = async (msg: proto.IWebMessageInfo) => {
  if (!msg?.message) return null;
  const { extractMessageContent } = await loadBaileysUtils();
  const body = extractMessageContent(msg.message)[
    Object.keys(msg?.message).values().next().value
  ];
  let reaction = msg?.message?.reactionMessage
    ? msg?.message?.reactionMessage?.key?.id
    : "";
  return reaction ? reaction : body?.contextInfo?.stanzaId;
};

const verifyQuotedMessage = async (
  msg: proto.IWebMessageInfo,
): Promise<Message | null> => {
  if (!msg) return null;
  const quoted = await getQuotedMessageId(msg);
  if (!quoted) return null;
  const quotedMsg = await Message.findOne({ where: { id: quoted } });
  if (!quotedMsg) return null;
  return quotedMsg;
};

const getMeSocket = async (wbot: Session): Promise<IMe> => {
  const { jidNormalizedUser } = await loadBaileysUtils();
  return { id: jidNormalizedUser(wbot.user.id!), name: wbot.user.name || "" };
};

const getSenderMessage = async (
  msg: proto.IWebMessageInfo,
  wbot: Session,
): Promise<string> => {
  const me = await getMeSocket(wbot);
  if (msg.key.fromMe) return me.id;
  const sender =
    msg.key.participant || msg.participant || msg.key.remoteJid || "";
  return sender;
};

// =========================================================================
// CORREÇÃO CRÍTICA 1: NÃO FORÇAR O NUMERO COMO NOME EM MENSAGENS OUTBOUND
// =========================================================================
const getContactMessage = async (
  msg: proto.IWebMessageInfo,
  wbot: Session,
): Promise<IMe> => {
  try {
    const isGroup = msg.key.remoteJid?.includes("g.us");
    const rawJid = msg.key.remoteJid || "";
    const msgAny = msg as any;
    const keyAny = msg.key as any;

    if (isGroup) {
      const senderId = await getSenderMessage(msg, wbot);
      return { id: senderId, name: msg.pushName || rawJid };
    }

    let jid = rawJid;
    let lid = rawJid.includes("@lid") ? rawJid : undefined;

    try {
      const extractedJid = await getJidFromMessage(msg, wbot as any);
      const extractedLid = await getLidFromMessage(msg, wbot as any);
      if (extractedJid) jid = extractedJid;
      if (extractedLid) lid = extractedLid;
    } catch (e) {
      logger.warn(`Fallback de extração JID/LID acionado: ${e}`);
      if (msgAny.remoteJidAlt && msgAny.remoteJidAlt.includes("@lid")) {
        lid = msgAny.remoteJidAlt;
      } else if (rawJid.includes("@lid") && keyAny.senderPn) {
        jid = `${keyAny.senderPn.replace(/\D/g, "")}@s.whatsapp.net`;
      }
    }

    // AQUI ESTAVA O PROBLEMA: Se for `fromMe`, enviamos undefined.
    // Assim não sobrescrevemos o nome verdadeiro do cliente com o número formatado.
    return {
      id: jid,
      name: msg.key.fromMe ? undefined : msg.pushName,
      originalLid: lid,
    } as IMe;
  } catch (error) {
    logger.error(`Erro em getContactMessage: ${error}`);
    return { id: msg.key.remoteJid || "", name: msg.pushName || "" };
  }
};

const downloadMedia = async (msg: proto.IWebMessageInfo) => {
  let buffer;
  try {
    const { downloadMediaMessage } = await loadBaileysUtils();
    buffer = await downloadMediaMessage(msg as WAMessage, "buffer", {});
  } catch (err) {
    return null;
  }
  let filename = msg.message?.documentMessage?.fileName || "";
  const mineType =
    msg.message?.imageMessage ||
    msg.message?.audioMessage ||
    msg.message?.videoMessage ||
    msg.message?.stickerMessage ||
    msg.message?.documentMessage ||
    msg.message?.documentWithCaptionMessage?.message?.documentMessage ||
    msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
      ?.imageMessage ||
    msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage;

  if (!mineType) return null;

  if (!filename) {
    const ext = mineType.mimetype.split("/")[1].split(";")[0];
    filename = `${new Date().getTime()}.${ext}`;
  } else {
    filename = `${new Date().getTime()}_${filename}`;
  }
  const media = { data: buffer, mimetype: mineType.mimetype, filename };
  return media;
};

// =========================================================================
// CORREÇÃO CRÍTICA 2: TRAVA INTERNA DO WBOTMESSAGELISTENER (BYPASS)
// =========================================================================
const verifyContact = async (
  msgContact: any,
  wbot: Session,
  companyId: number,
): Promise<Contact> => {
  let profilePicUrl: string = `${process.env.FRONTEND_URL}/nopicture.png`;
  const contactIdStr = msgContact.id || "";
  const cleanNumber = contactIdStr.replace(/\D/g, "");

  try {
    const ppJid = cleanNumber ? `${cleanNumber}@s.whatsapp.net` : msgContact.id;
    if (ppJid) {
      let timeoutId: NodeJS.Timeout;
      const timeout = new Promise<string>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Timeout Foto")), 2000);
      });
      const res = await Promise.race([
        wbot.profilePictureUrl(ppJid),
        timeout,
      ]).catch(() => null);
      if (res) profilePicUrl = res as string;
      clearTimeout(timeoutId!);
    }
  } catch (e) {}

  let existingContact: Contact | null = null;
  if (contactIdStr && !contactIdStr.includes("g.us") && cleanNumber) {
    existingContact = await Contact.findOne({
      where: { companyId, number: cleanNumber, isGroup: false },
    });
  }
  if (!existingContact && msgContact.originalLid) {
    existingContact = await Contact.findOne({
      where: { companyId, remoteJid: msgContact.originalLid, isGroup: false },
    });
  }

  // ATALHO INTERNO DE ATUALIZAÇÃO BLINDADO
  if (existingContact) {
    const updateData: any = {};

    // Regra de validação: Verifica se a string parece ser um nome real ou apenas um número/JID
    const isJustNumber = (str: string | undefined) =>
      !str || /^[\d\s\-\+\(\)]+$/.test(str) || str.includes("@");

    if (existingContact.isGroup) {
      // Se for grupo, permite atualizar o nome da tabela sempre
      if (msgContact.name && msgContact.name !== existingContact.name) {
        updateData.name = msgContact.name;
      }
    } else {
      // Se for contato individual, só atualiza se tiver um NOME NOVO VALIDO e o nome atual for SÓ NÚMERO
      if (
        msgContact.name &&
        !isJustNumber(msgContact.name) &&
        isJustNumber(existingContact.name)
      ) {
        updateData.name = msgContact.name;
      }
    }

    if (profilePicUrl && profilePicUrl !== existingContact.profilePicUrl)
      updateData.profilePicUrl = profilePicUrl;

    if (
      contactIdStr &&
      !contactIdStr.includes("g.us") &&
      cleanNumber &&
      cleanNumber !== existingContact.number
    )
      updateData.number = cleanNumber;

    if (
      msgContact.originalLid &&
      existingContact.remoteJid !== msgContact.originalLid
    )
      updateData.remoteJid = msgContact.originalLid;

    if (Object.keys(updateData).length > 0) {
      try {
        await existingContact.update(updateData);
      } catch (e) {}
    }
    return existingContact;
  }

  // Se não existir, define o Payload para criar. Se o nome vier em branco (outbound), usa o número no banco.
  const isJustNumberCreate = (str: string | undefined) =>
    !str || /^[\d\s\-\+\(\)]+$/.test(str) || str.includes("@");
  const contactData = {
    name:
      msgContact?.name && !isJustNumberCreate(msgContact.name)
        ? msgContact.name
        : cleanNumber,
    number: cleanNumber,
    profilePicUrl,
    isGroup: contactIdStr ? contactIdStr.includes("g.us") : false,
    companyId,
    whatsappId: wbot.id,
    remoteJid: msgContact.originalLid || msgContact.id,
  };

  const contact = await CreateOrUpdateContactService(contactData);
  return contact;
};

const sanitizeName = (name: string): string => {
  let sanitized = name.split(" ")[0];
  sanitized = sanitized.replace(/[^a-zA-Z0-9]/g, "");
  return sanitized.substring(0, 60);
};

const convertTextToSpeechAndSaveToFile = (
  text: string,
  filename: string,
  subscriptionKey: string,
  serviceRegion: string,
  voice: string = "pt-BR-FabioNeural",
  audioToFormat: string = "mp3",
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const speechConfig = SpeechConfig.fromSubscription(
      subscriptionKey,
      serviceRegion,
    );
    speechConfig.speechSynthesisVoiceName = voice;
    const audioConfig = AudioConfig.fromAudioFileOutput(`${filename}.wav`);
    const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);
    synthesizer.speakTextAsync(
      text,
      (result) => {
        if (result) {
          convertWavToAnotherFormat(
            `${filename}.wav`,
            `${filename}.${audioToFormat}`,
            audioToFormat,
          )
            .then(() => resolve())
            .catch((error) => reject(error));
        } else {
          reject(new Error("No result from synthesizer"));
        }
        synthesizer.close();
      },
      (error) => {
        synthesizer.close();
        reject(error);
      },
    );
  });
};

const convertWavToAnotherFormat = (
  inputPath: string,
  outputPath: string,
  toFormat: string,
) => {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(inputPath)
      .toFormat(toFormat)
      .on("end", () => resolve(outputPath))
      .on("error", (err: { message: any }) =>
        reject(new Error(`Error converting file: ${err.message}`)),
      )
      .save(outputPath);
  });
};

const deleteFileSync = (path: string): void => {
  try {
    fs.unlinkSync(path);
  } catch (error) {}
};

const keepOnlySpecifiedChars = (str: string) => {
  return str.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚâêîôûÂÊÎÔÛãõÃÕçÇ!?.,;:\s]/g, "");
};

const handleOpenAi = async (
  msg: proto.IWebMessageInfo,
  wbot: Session,
  ticket: Ticket,
  contact: Contact,
  mediaSent: Message | undefined,
): Promise<void> => {
  const bodyMessage = await getBodyMessage(msg);
  if (!bodyMessage) return;
  let { prompt } = await ShowWhatsAppService(wbot.id!, ticket.companyId);
  if (!prompt && !isNil(ticket?.queue?.prompt)) {
    prompt = ticket.queue.prompt;
  }
  if (!prompt) return;
  if (msg.messageStubType) return;

  const publicFolder: string = path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "public",
  );
  let openai: SessionOpenAi;
  const openAiIndex = sessionsOpenAi.findIndex((s) => s.id === wbot.id);
  if (openAiIndex === -1) {
    const configuration = new Configuration({ apiKey: prompt.apiKey });
    openai = new OpenAIApi(configuration);
    openai.id = wbot.id;
    sessionsOpenAi.push(openai);
  } else {
    openai = sessionsOpenAi[openAiIndex];
  }

  const messages = await Message.findAll({
    where: { ticketId: ticket.id },
    order: [["createdAt", "ASC"]],
    limit: prompt.maxMessages,
  });
  const promptSystem = `Nas respostas utilize o nome ${sanitizeName(contact.name || "Amigo(a)")} para identificar o cliente.\nSua resposta deve usar no máximo ${prompt.maxTokens} tokens e cuide para não truncar o final.\nSempre que possível, mencione o nome dele para ser mais personalizado o atendimento e mais educado. Quando a resposta requer uma transferência para o setor de atendimento, comece sua resposta com 'Ação: Transferir para o setor de atendimento'.\n${prompt.prompt}\n`;

  let messagesOpenAi: ChatCompletionRequestMessage[] = [];
  if (msg.message?.conversation || msg.message?.extendedTextMessage?.text) {
    messagesOpenAi.push({ role: "system", content: promptSystem });
    for (let i = 0; i < Math.min(prompt.maxMessages, messages.length); i++) {
      const message = messages[i];
      if (message.mediaType === "chat") {
        messagesOpenAi.push({
          role: message.fromMe ? "assistant" : "user",
          content: message.body,
        });
      }
    }
    messagesOpenAi.push({ role: "user", content: bodyMessage! });
    const chat = await openai.createChatCompletion({
      model: "gpt-3.5-turbo-1106",
      messages: messagesOpenAi,
      max_tokens: prompt.maxTokens,
      temperature: prompt.temperature,
    });
    let response = chat.data.choices[0].message?.content;
    if (response?.includes("Ação: Transferir para o setor de atendimento")) {
      await transferQueue(prompt.queueId, ticket, contact);
      response = response
        .replace("Ação: Transferir para o setor de atendimento", "")
        .trim();
    }
    if (prompt.voice === "texto") {
      const sentMessage = await wbot.sendMessage(msg.key.remoteJid!, {
        text: response!,
      });
      await verifyMessage(sentMessage as any, ticket, contact);
    } else {
      const fileNameWithOutExtension = `${ticket.id}_${Date.now()}`;
      convertTextToSpeechAndSaveToFile(
        keepOnlySpecifiedChars(response!),
        `${publicFolder}/${fileNameWithOutExtension}`,
        prompt.voiceKey,
        prompt.voiceRegion,
        prompt.voice,
        "mp3",
      ).then(async () => {
        try {
          const sendMessage = await wbot.sendMessage(msg.key.remoteJid!, {
            audio: { url: `${publicFolder}/${fileNameWithOutExtension}.mp3` },
            mimetype: "audio/mpeg",
            ptt: true,
          });
          await verifyMediaMessage(sendMessage as any, ticket, contact);
          deleteFileSync(`${publicFolder}/${fileNameWithOutExtension}.mp3`);
          deleteFileSync(`${publicFolder}/${fileNameWithOutExtension}.wav`);
        } catch (error) {}
      });
    }
  } else if (msg.message?.audioMessage) {
    const mediaUrl = mediaSent!.mediaUrl!.split("/").pop();
    const file = fs.createReadStream(`${publicFolder}/${mediaUrl}`) as any;
    const transcription = await openai.createTranscription(file, "whisper-1");
    messagesOpenAi.push({ role: "system", content: promptSystem });
    for (let i = 0; i < Math.min(prompt.maxMessages, messages.length); i++) {
      const message = messages[i];
      if (message.mediaType === "chat") {
        messagesOpenAi.push({
          role: message.fromMe ? "assistant" : "user",
          content: message.body,
        });
      }
    }
    messagesOpenAi.push({ role: "user", content: transcription.data.text });
    const chat = await openai.createChatCompletion({
      model: "gpt-3.5-turbo-1106",
      messages: messagesOpenAi,
      max_tokens: prompt.maxTokens,
      temperature: prompt.temperature,
    });
    let response = chat.data.choices[0].message?.content;
    if (response?.includes("Ação: Transferir para o setor de atendimento")) {
      await transferQueue(prompt.queueId, ticket, contact);
      response = response
        .replace("Ação: Transferir para o setor de atendimento", "")
        .trim();
    }
    if (prompt.voice === "texto") {
      const sentMessage = await wbot.sendMessage(msg.key.remoteJid!, {
        text: response!,
      });
      await verifyMessage(sentMessage as any, ticket, contact);
    } else {
      const fileNameWithOutExtension = `${ticket.id}_${Date.now()}`;
      convertTextToSpeechAndSaveToFile(
        keepOnlySpecifiedChars(response!),
        `${publicFolder}/${fileNameWithOutExtension}`,
        prompt.voiceKey,
        prompt.voiceRegion,
        prompt.voice,
        "mp3",
      ).then(async () => {
        try {
          const sendMessage = await wbot.sendMessage(msg.key.remoteJid!, {
            audio: { url: `${publicFolder}/${fileNameWithOutExtension}.mp3` },
            mimetype: "audio/mpeg",
            ptt: true,
          });
          await verifyMediaMessage(sendMessage as any, ticket, contact);
          deleteFileSync(`${publicFolder}/${fileNameWithOutExtension}.mp3`);
          deleteFileSync(`${publicFolder}/${fileNameWithOutExtension}.wav`);
        } catch (error) {}
      });
    }
  }
};

const transferQueue = async (
  queueId: number,
  ticket: Ticket,
  contact: Contact,
): Promise<void> => {
  await UpdateTicketService({
    ticketData: { queueId: queueId, useIntegration: false, promptId: null },
    ticketId: ticket.id,
    companyId: ticket.companyId,
  });
};

const verifyMediaMessage = async (
  msg: proto.IWebMessageInfo,
  ticket: Ticket,
  contact: Contact,
): Promise<Message> => {
  const io = getIO();
  const quotedMsg = await verifyQuotedMessage(msg);
  const media = await downloadMedia(msg);
  if (!media) {
    throw new Error("ERR_WAPP_DOWNLOAD_MEDIA");
  }
  if (!media.filename) {
    const ext = media.mimetype.split("/")[1]?.split(";")[0] || "dat";
    media.filename = `${new Date().getTime()}.${ext}`;
  }
  try {
    const folder = `public/company${ticket.companyId}`;
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
      fs.chmodSync(folder, 0o777);
    }
    await writeFileAsync(
      join(__dirname, "..", "..", "..", folder, media.filename),
      media.data,
      "base64",
    );
    await new Promise<void>((resolve, reject) => {
      if (media.filename.includes(".ogg")) {
        ffmpeg(folder + "/" + media.filename)
          .toFormat("mp3")
          .save((folder + "/" + media.filename).replace(".ogg", ".mp3"))
          .on("end", () => resolve())
          .on("error", (err) => reject(err));
      } else {
        resolve();
      }
    });
  } catch (err) {
    Sentry.captureException(err);
  }

  const body = await getBodyMessage(msg);
  let mediaType = media.mimetype.split("/")[0];
  if (mediaType === "application") {
    mediaType = "document";
  }
  let safeBody = body ? formatBody(body, ticket.contact) : media.filename;
  if (!safeBody || safeBody.length > 255) {
    safeBody = media.filename
      ? media.filename.substring(0, 250)
      : `[Arquivo: ${mediaType}]`;
  }
  const messageData = {
    id: msg.key.id,
    ticketId: ticket.id,
    contactId: msg.key.fromMe ? undefined : contact.id,
    body: safeBody,
    fromMe: msg.key.fromMe,
    read: msg.key.fromMe,
    mediaUrl: media.filename,
    mediaType: mediaType,
    quotedMsgId: quotedMsg?.id,
    ack: msg.status ?? 0,
    remoteJid: msg.key.remoteJid,
    participant: msg.key.participant,
    dataJson: JSON.stringify(msg),
  };

  await ticket.update({ lastMessage: safeBody });
  const newMessage = await CreateMessageService({
    messageData,
    companyId: ticket.companyId,
  });
  if (msg.key.fromMe) {
    io.to(ticket.id.toString()).emit(`company-${ticket.companyId}-appMessage`, {
      action: "create",
      message: newMessage,
    });
  }
  if (!msg.key.fromMe && ticket.status === "closed") {
    await ticket.update({ status: "pending" });
    await ticket.reload({
      include: [
        { model: Queue, as: "queue" },
        { model: User, as: "user" },
        { model: Contact, as: "contact" },
      ],
    });
    io.to(`company-${ticket.companyId}-closed`)
      .to(`queue-${ticket.queueId}-closed`)
      .emit(`company-${ticket.companyId}-ticket`, {
        action: "delete",
        ticket,
        ticketId: ticket.id,
      });
    io.to(`company-${ticket.companyId}-${ticket.status}`)
      .to(`queue-${ticket.queueId}-${ticket.status}`)
      .to(ticket.id.toString())
      .emit(`company-${ticket.companyId}-ticket`, {
        action: "update",
        ticket,
        ticketId: ticket.id,
      });
  }
  return newMessage;
};

export const verifyMessage = async (
  msg: proto.IWebMessageInfo,
  ticket: Ticket,
  contact: Contact,
) => {
  const io = getIO();
  const quotedMsg = await verifyQuotedMessage(msg);
  const body = (await getBodyMessage(msg)) || "";
  const msgType = await getTypeMessage(msg);
  const isEdited = msgType === "editedMessage";
  const messageId = isEdited
    ? msg?.message?.editedMessage?.message?.protocolMessage?.key?.id
    : msg.key.id;

  const messageData = {
    id: messageId,
    ticketId: ticket.id,
    contactId: msg.key.fromMe ? undefined : contact.id,
    body,
    fromMe: msg.key.fromMe,
    mediaType: msgType,
    read: msg.key.fromMe,
    quotedMsgId: quotedMsg?.id,
    ack: msg.status || 0,
    remoteJid: msg.key.remoteJid,
    participant: msg.key.participant,
    dataJson: JSON.stringify(msg),
    isEdited: isEdited,
  };

  await ticket.update({ lastMessage: body });
  await CreateMessageService({ messageData, companyId: ticket.companyId });
  if (!msg.key.fromMe && ticket.status === "closed") {
    await ticket.update({ status: "pending" });
    await ticket.reload({
      include: [
        { model: Queue, as: "queue" },
        { model: User, as: "user" },
        { model: Contact, as: "contact" },
      ],
    });
    io.to(`company-${ticket.companyId}-closed`)
      .to(`queue-${ticket.queueId}-closed`)
      .emit(`company-${ticket.companyId}-ticket`, {
        action: "delete",
        ticket,
        ticketId: ticket.id,
      });
    io.to(`company-${ticket.companyId}-${ticket.status}`)
      .to(`queue-${ticket.queueId}-${ticket.status}`)
      .emit(`company-${ticket.companyId}-ticket`, {
        action: "update",
        ticket,
        ticketId: ticket.id,
      });
  }
};

export const isValidMsg = async (
  msg: proto.IWebMessageInfo,
): Promise<boolean> => {
  if (msg.key.remoteJid === "status@broadcast") return false;
  try {
    const msgType = await getTypeMessage(msg);
    if (!msgType) return false;

    const ifType =
      msgType === "conversation" ||
      msgType === "extendedTextMessage" ||
      msgType === "editedMessage" ||
      msgType === "audioMessage" ||
      msgType === "videoMessage" ||
      msgType === "imageMessage" ||
      msgType === "documentMessage" ||
      msgType === "documentWithCaptionMessage" ||
      msgType === "stickerMessage" ||
      msgType === "buttonsResponseMessage" ||
      msgType === "buttonsMessage" ||
      msgType === "messageContextInfo" ||
      msgType === "locationMessage" ||
      msgType === "liveLocationMessage" ||
      msgType === "contactMessage" ||
      msgType === "voiceMessage" ||
      msgType === "mediaMessage" ||
      msgType === "contactsArrayMessage" ||
      msgType === "reactionMessage" ||
      msgType === "ephemeralMessage" ||
      msgType === "protocolMessage" ||
      msgType === "listResponseMessage" ||
      msgType === "listMessage" ||
      msgType === "viewOnceMessage";

    if (!ifType) {
      logger.warn(
        `[DEBUG-MSG] Mensagem ignorada por tipo não reconhecido: ${msgType}`,
      );
    }
    return !!ifType;
  } catch (error) {
    return false;
  }
};

const verifyQueue = async (
  wbot: Session,
  msg: proto.IWebMessageInfo,
  ticket: Ticket,
  contact: Contact,
  mediaSent?: Message | undefined,
) => {
  const companyId = ticket.companyId;
  const { queues, greetingMessage, maxUseBotQueues, timeUseBotQueues } =
    await ShowWhatsAppService(wbot.id!, ticket.companyId);
  if (queues.length === 1) {
    const sendGreetingMessageOneQueues = await Setting.findOne({
      where: {
        key: "sendGreetingMessageOneQueues",
        companyId: ticket.companyId,
      },
    });
    if (
      greetingMessage &&
      greetingMessage.length > 1 &&
      sendGreetingMessageOneQueues?.value === "enabled"
    ) {
      const body = formatBody(`${greetingMessage}`, contact);
      await wbot.sendMessage(
        `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
        { text: body },
      );
    }
    const firstQueue = head(queues);
    let chatbot = false;
    if (firstQueue?.options) {
      chatbot = firstQueue.options.length > 0;
    }
    const ticketData: any = {
      queueId: firstQueue!.id,
      chatbot,
      status: "pending",
    };
    if (
      !msg.key.fromMe &&
      !ticket.isGroup &&
      !isNil(queues[0]?.integrationId)
    ) {
      const integrations = await ShowQueueIntegrationService(
        queues[0].integrationId,
        companyId,
      );
      await handleMessageIntegration(msg, wbot, integrations, ticket);
      ticketData.useIntegration = true;
      ticketData.integrationId = integrations.id;
    }
    if (!msg.key.fromMe && !ticket.isGroup && !isNil(queues[0]?.promptId)) {
      await handleOpenAi(msg, wbot, ticket, contact, mediaSent);
      ticketData.useIntegration = true;
      ticketData.promptId = queues[0]?.promptId;
    }
    await UpdateTicketService({
      ticketData: ticketData,
      ticketId: ticket.id,
      companyId: ticket.companyId,
    });
    return;
  }
  const lastMessage = await Message.findOne({
    where: { ticketId: ticket.id, fromMe: true },
    order: [["createdAt", "DESC"]],
  });
  if (contact.disableBot) {
    return;
  }
  const selectedOption = await getBodyMessage(msg);
  const choosenQueue = /\*\[\s*\d+\s*\]\*\s*-\s*.*/g.test(
    lastMessage?.body || "",
  )
    ? queues[+(selectedOption || 0) - 1]
    : undefined;
  const buttonActive = await Setting.findOne({
    where: { key: "chatBotType", companyId },
  });

  const botText = async () => {
    let options = "";
    queues.forEach((queue, index) => {
      options += `*[ ${index + 1} ]* - ${queue.name}\n`;
    });
    const textMessage = {
      text: formatBody(`\u200e${greetingMessage}\n\n${options}`, contact),
    };
    let lastMsg = map_msg.get(contact.number);
    let invalidOption =
      "Opção inválida, por favor, escolha uma opção válida.\n\n";
    const body = await getBodyMessage(msg);
    const bodyIncludesHash = body ? body.includes("#") : false;
    if (
      !lastMsg?.msg ||
      bodyIncludesHash ||
      textMessage.text === "concluido" ||
      (lastMsg.msg !== textMessage.text && !lastMsg.invalid_option)
    ) {
      const sendMsg = await wbot.sendMessage(
        `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
        textMessage,
      );
      lastMsg ??= {};
      lastMsg.msg = textMessage.text;
      lastMsg.invalid_option = false;
      lastMsg.invalid_attempts = 0;
      map_msg.set(contact.number, lastMsg);
      await verifyMessage(sendMsg as any, ticket, ticket.contact);
    } else if (lastMsg.invalid_attempts < 2) {
      textMessage.text = invalidOption + textMessage.text;
      const sendMsg = await wbot.sendMessage(
        `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
        textMessage,
      );
      lastMsg.invalid_attempts = (lastMsg.invalid_attempts || 0) + 1;
      lastMsg.invalid_option = true;
      lastMsg.msg = textMessage.text;
      map_msg.set(contact.number, lastMsg);
      await verifyMessage(sendMsg as any, ticket, ticket.contact);
    } else {
      const firstQueue = head(queues);
      let chatbot = false;
      if (firstQueue?.options) {
        chatbot = firstQueue.options.length > 0;
      }
      await UpdateTicketService({
        ticketData: { queueId: firstQueue!.id, chatbot, status: "pending" },
        ticketId: ticket.id,
        companyId: ticket.companyId,
      });
      const autoSelectMessage = {
        text: formatBody(
          `Opção selecionada automaticamente: ${firstQueue!.name}`,
          contact,
        ),
      };
      await wbot.sendMessage(
        `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
        autoSelectMessage,
      );
    }
  };
  if (choosenQueue) {
    let chatbot = false;
    if (choosenQueue?.options) {
      chatbot = choosenQueue.options.length > 0;
    }
    const ticketData: any = { queueId: choosenQueue.id, chatbot };
    if (!msg.key.fromMe && !ticket.isGroup && choosenQueue.integrationId) {
      const integrations = await ShowQueueIntegrationService(
        choosenQueue.integrationId,
        companyId,
      );
      await handleMessageIntegration(msg, wbot, integrations, ticket);
      ticketData.useIntegration = true;
      ticketData.integrationId = integrations.id;
    }
    if (!msg.key.fromMe && !ticket.isGroup && !isNil(choosenQueue?.promptId)) {
      await handleOpenAi(msg, wbot, ticket, contact, mediaSent);
      ticketData.useIntegration = true;
      ticketData.promptId = choosenQueue?.promptId;
    }
    await UpdateTicketService({
      ticketData: ticketData,
      ticketId: ticket.id,
      companyId: ticket.companyId,
    });

    if (choosenQueue.options.length === 0) {
      const queue = await Queue.findByPk(choosenQueue.id);
      const { schedules }: any = queue;
      const now = moment();
      const weekday = now.format("dddd").toLowerCase();
      let schedule;
      if (Array.isArray(schedules) && schedules.length > 0) {
        schedule = schedules.find(
          (s) =>
            s.weekdayEn === weekday &&
            s.startTimeA !== "" &&
            s.startTimeA !== null &&
            s.endTimeA !== "" &&
            s.endTimeA !== null,
        );
      }
      if (
        queue!.outOfHoursMessage !== null &&
        queue!.outOfHoursMessage !== "" &&
        !isNil(schedule)
      ) {
        const startTimeA = moment(schedule.startTimeA, "HH:mm");
        const endTimeA = moment(schedule.endTimeA, "HH:mm");
        const startTimeB = schedule.startTimeB
          ? moment(schedule.startTimeB, "HH:mm")
          : null;
        const endTimeB = schedule.endTimeB
          ? moment(schedule.endTimeB, "HH:mm")
          : null;
        const isWithinBusinessHours =
          now.isBetween(startTimeA, endTimeA, null, "[]") ||
          (startTimeB &&
            endTimeB &&
            now.isBetween(startTimeB, endTimeB, null, "[]"));
        if (!isWithinBusinessHours) {
          if (
            ticket.status === "open" ||
            ticket.status === "pendent" ||
            ticket.status === "assigned"
          ) {
            const body = formatBody(
              `\u200e${queue!.outOfHoursMessage}`,
              ticket.contact,
            );
            const sentMessage = await wbot.sendMessage(
              `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
              { text: body },
            );
            await verifyMessage(sentMessage as any, ticket, contact);
            await UpdateTicketService({
              ticketData: { status: "closed", queueId: null, chatbot },
              ticketId: ticket.id,
              companyId: ticket.companyId,
            });
            const finalizationMessage =
              "Seu ticket foi finalizado porque estamos *Offline* no momento.";
            await wbot.sendMessage(
              `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
              { text: finalizationMessage },
            );
          }
        } else if (ticket.status === "assigned") {
          return;
        }
      }
    }
    if (choosenQueue.greetingMessage) {
      const body = formatBody(
        `\u200e${choosenQueue.greetingMessage}`,
        ticket.contact,
      );
      const sentMessage = await wbot.sendMessage(
        `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
        { text: body },
      );
      await verifyMessage(sentMessage as any, ticket, contact);
    }
    if (choosenQueue.mediaPath !== null && choosenQueue.mediaPath !== "") {
      const filePath = path.resolve(
        "public",
        `company${companyId}`,
        choosenQueue.mediaPath,
      );
      const optionsMsg = await getMessageOptions(
        choosenQueue.mediaName,
        filePath,
        null,
        ticket.companyId.toString(),
      );
      let sentMessage = await wbot.sendMessage(
        `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
        { ...optionsMsg },
      );
      await verifyMediaMessage(sentMessage as any, ticket, contact);
    }
  } else {
    if (
      maxUseBotQueues &&
      maxUseBotQueues !== 0 &&
      ticket.amountUsedBotQueues >= maxUseBotQueues
    ) {
      return;
    }
    const ticketTraking = await FindOrCreateATicketTrakingService({
      ticketId: ticket.id,
      companyId,
    });
    let dataLimite = new Date();
    let Agora = new Date();
    if (ticketTraking.chatbotAt !== null) {
      dataLimite.setMinutes(
        ticketTraking.chatbotAt.getMinutes() + Number(timeUseBotQueues),
      );
      if (
        ticketTraking.chatbotAt !== null &&
        Agora < dataLimite &&
        timeUseBotQueues !== "0" &&
        ticket.amountUsedBotQueues !== 0
      ) {
        return;
      }
    }
    await ticketTraking.update({ chatbotAt: null });
    if (buttonActive!.value === "text") {
      return botText();
    }
  }
};

export const verifyRating = (ticketTraking: TicketTraking) => {
  if (
    ticketTraking &&
    ticketTraking.finishedAt === null &&
    ticketTraking.userId !== null &&
    ticketTraking.ratingAt !== null
  ) {
    return true;
  }
  return false;
};

export const handleRating = async (
  rate: number,
  ticket: Ticket,
  ticketTraking: TicketTraking,
  contact: Contact,
) => {
  const io = getIO();
  const { complationMessage } = await ShowWhatsAppService(
    ticket.whatsappId,
    ticket.companyId,
  );
  let finalRate = rate;
  if (rate < 1) {
    finalRate = 1;
  }
  if (rate > 5) {
    finalRate = 5;
  }
  await UserRating.create({
    ticketId: ticketTraking.ticketId,
    companyId: ticketTraking.companyId,
    userId: ticketTraking.userId,
    rate: finalRate,
  });
  if (complationMessage) {
    const body = formatBody(`\u200e${complationMessage}`, ticket.contact);
    const msg = await SendWhatsAppMessage({ body, ticket });
    await verifyMessage(msg as any, ticket, contact);
  }
  await ticketTraking.update({ finishedAt: moment().toDate(), rated: true });
  await ticket.update({ queueOptionId: null, userId: null, status: "closed" });
  io.to(`company-${ticket.companyId}-open`)
    .to(`queue-${ticket.queueId}-open`)
    .emit(`company-${ticket.companyId}-ticket`, {
      action: "delete",
      ticket,
      ticketId: ticket.id,
    });
  io.to(`company-${ticket.companyId}-${ticket.status}`)
    .to(`queue-${ticket.queueId}-${ticket.status}`)
    .to(ticket.id.toString())
    .emit(`company-${ticket.companyId}-ticket`, {
      action: "update",
      ticket,
      ticketId: ticket.id,
    });
};

const handleChartbot = async (
  ticket: Ticket,
  msg: proto.IWebMessageInfo,
  wbot: Session,
  dontReadTheFirstQuestion = false,
) => {
  const queue = await Queue.findByPk(ticket.queueId, {
    include: [{ model: QueueOption, as: "options", where: { parentId: null } }],
    order: [["options", "option", "ASC"]],
  });
  const messageBody = await getBodyMessage(msg);
  if (messageBody == "#") {
    await ticket.update({ queueOptionId: null, chatbot: false, queueId: null });
    await verifyQueue(wbot, msg, ticket, ticket.contact);
    return;
  }
  let option;
  if (!isNil(queue) && !isNil(ticket.queueOptionId) && messageBody == "0") {
    option = await QueueOption.findByPk(ticket.queueOptionId);
    await ticket.update({ queueOptionId: option?.parentId });
  } else if (!isNil(queue) && !isNil(ticket.queueOptionId)) {
    const count = await QueueOption.count({
      where: { parentId: ticket.queueOptionId },
    });
    if (count == 1) {
      option = await QueueOption.findOne({
        where: { parentId: ticket.queueOptionId },
      });
    } else {
      option = await QueueOption.findOne({
        where: { option: messageBody || "", parentId: ticket.queueOptionId },
      });
    }
    if (option) {
      await ticket.update({ queueOptionId: option?.id });
    }
  } else if (
    !isNil(queue) &&
    isNil(ticket.queueOptionId) &&
    !dontReadTheFirstQuestion
  ) {
    option = queue?.options.find((o) => o.option == messageBody);
    if (option) {
      await ticket.update({ queueOptionId: option?.id });
    }
  }
  await ticket.reload();
  if (!isNil(queue) && isNil(ticket.queueOptionId)) {
    const queueOptions = await QueueOption.findAll({
      where: { queueId: ticket.queueId, parentId: null },
      order: [
        ["option", "ASC"],
        ["createdAt", "ASC"],
      ],
    });
    const companyId = ticket.companyId;
    const buttonActive = await Setting.findOne({
      where: { key: "chatBotType", companyId },
    });
    const botButton = async () => {
      const buttons: any[] = [];
      queueOptions.forEach((option, i) => {
        buttons.push({
          buttonId: `${option.option}`,
          buttonText: { displayText: option.title },
          type: 4,
        });
      });
      buttons.push({
        buttonId: `#`,
        buttonText: { displayText: "Menu inicial *[ 0 ]* Menu anterior" },
        type: 4,
      });
      const buttonMessage = {
        text: formatBody(`\u200e${queue.greetingMessage}`, ticket.contact),
        buttons,
        headerType: 4,
      };
      const sendMsg = await wbot.sendMessage(
        `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
        buttonMessage,
      );
      await verifyMessage(sendMsg as any, ticket, ticket.contact);
    };
    const botText = async () => {
      let options = "";
      queueOptions.forEach((option, i) => {
        options += `*[ ${option.option} ]* - ${option.title}\n`;
      });
      options += `\n*[ # ]* - Menu inicial`;
      const textMessage = {
        text: formatBody(`\u200e${options}`, ticket.contact),
      };
      const sendMsg = await wbot.sendMessage(
        `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
        textMessage,
      );
      await verifyMessage(sendMsg as any, ticket, ticket.contact);
    };
    if (buttonActive!.value === "button" && QueueOption.length <= 4) {
      return botButton();
    }
    if (buttonActive!.value === "text") {
      return botText();
    }
    if (buttonActive!.value === "button" && QueueOption.length > 4) {
      return botText();
    }
  } else if (!isNil(queue) && !isNil(ticket.queueOptionId)) {
    const currentOption = await QueueOption.findByPk(ticket.queueOptionId);
    const queueOptions = await QueueOption.findAll({
      where: { parentId: ticket.queueOptionId },
      order: [
        ["option", "ASC"],
        ["createdAt", "ASC"],
      ],
    });
    if (queueOptions.length === 0) {
      const textMessage = {
        text: formatBody(`\u200e${currentOption!.message}`, ticket.contact),
      };
      const sendMsg = await wbot.sendMessage(
        `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
        textMessage,
      );
      await verifyMessage(sendMsg as any, ticket, ticket.contact);
      if (
        currentOption!.mediaPath !== null &&
        currentOption!.mediaPath !== ""
      ) {
        const filePath = path.resolve(
          "public",
          "company" + ticket.companyId,
          currentOption!.mediaPath,
        );
        const optionsMsg = await getMessageOptions(
          currentOption!.mediaName,
          filePath,
          textMessage.text,
          ticket.companyId.toString(),
        );
        let sentMessage = await wbot.sendMessage(
          `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
          { ...optionsMsg },
        );
        await verifyMediaMessage(sentMessage as any, ticket, ticket.contact);
      }
      await verifyMessage(sendMsg as any, ticket, ticket.contact);
      await ticket.update({ queueOptionId: null, chatbot: false });
      return;
    }
    if (queueOptions.length > -1) {
      const companyId = ticket.companyId;
      const buttonActive = await Setting.findOne({
        where: { key: "chatBotType", companyId },
      });
      const botList = async () => {
        const sectionsRows: any[] = [];
        queueOptions.forEach((option, i) => {
          sectionsRows.push({ title: option.title, rowId: `${option.option}` });
        });
        sectionsRows.push({
          title: "Menu inicial *[ 0 ]* Menu anterior",
          rowId: `#`,
        });
        const sections = [{ rows: sectionsRows }];
        const listMessage = {
          text: formatBody(`\u200e${currentOption!.message}`, ticket.contact),
          buttonText: "Escolha uma opção",
          sections,
        };
        const sendMsg = await wbot.sendMessage(
          `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
          listMessage,
        );
        await verifyMessage(sendMsg as any, ticket, ticket.contact);
      };
      const botButton = async () => {
        const buttons: any[] = [];
        queueOptions.forEach((option, i) => {
          buttons.push({
            buttonId: `${option.option}`,
            buttonText: { displayText: option.title },
            type: 4,
          });
        });
        buttons.push({
          buttonId: `#`,
          buttonText: { displayText: "Menu inicial *[ 0 ]* Menu anterior" },
          type: 4,
        });
        const buttonMessage = {
          text: formatBody(`\u200e${currentOption!.message}`, ticket.contact),
          buttons,
          headerType: 4,
        };
        const sendMsg = await wbot.sendMessage(
          `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
          buttonMessage,
        );
        await verifyMessage(sendMsg as any, ticket, ticket.contact);
      };
      const botText = async () => {
        let options = "";
        queueOptions.forEach((option, i) => {
          options += `*[ ${option.option} ]* - ${option.title}\n`;
        });
        options += `\n*[ 0 ]* - Menu anterior`;
        options += `\n*[ # ]* - Menu inicial`;
        const textMessage = {
          text: formatBody(
            `\u200e${currentOption!.message}\n\n${options}`,
            ticket.contact,
          ),
        };
        const sendMsg = await wbot.sendMessage(
          `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
          textMessage,
        );
        await verifyMessage(sendMsg as any, ticket, ticket.contact);
        if (
          currentOption!.mediaPath !== null &&
          currentOption!.mediaPath !== ""
        ) {
          const filePath = path.resolve(
            "public",
            "company" + ticket.companyId,
            currentOption!.mediaPath,
          );
          const optionsMsg = await getMessageOptions(
            currentOption!.mediaName,
            filePath,
            textMessage.text,
            ticket.companyId.toString(),
          );
          let sentMessage = await wbot.sendMessage(
            `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
            { ...optionsMsg },
          );
          await verifyMediaMessage(sentMessage as any, ticket, ticket.contact);
        }
      };
      if (buttonActive!.value === "list") {
        return botList();
      }
      if (buttonActive!.value === "button" && QueueOption.length <= 4) {
        return botButton();
      }
      if (buttonActive!.value === "text") {
        return botText();
      }
      if (buttonActive!.value === "button" && QueueOption.length > 4) {
        return botText();
      }
    }
  }
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const processedWebhooks = new Set<string>();
const markWebhookAsProcessed = (msgId: string) => {
  processedWebhooks.add(msgId);
  setTimeout(() => processedWebhooks.delete(msgId), 10000);
};

export const handleMessageIntegration = async (
  msg: proto.IWebMessageInfo,
  wbot: Session,
  queueIntegration: QueueIntegrations,
  ticket: Ticket,
): Promise<void> => {
  const bodyMessage = await getBodyMessage(msg);
  const msgType = await getTypeMessage(msg);
  const payloadMsg = { ...msg };
  if (msgType === "protocolMessage" && bodyMessage) {
    payloadMsg.message = { conversation: bodyMessage };
  }
  if (queueIntegration.type === "n8n" || queueIntegration.type === "webhook") {
    if (queueIntegration?.urlN8N) {
      const options = {
        method: "POST",
        url: queueIntegration?.urlN8N,
        headers: { "Content-Type": "application/json" },
        json: payloadMsg,
      };
      try {
        request(options, function (error: any, response: any) {
          if (error) {
            logger.error(`Error sending webhook: ${error.message}`);
          } else {
            logger.info(
              `[Webhook Sent] Ticket: ${ticket.id} | Status: ${response.statusCode}`,
            );
          }
        });
      } catch (error) {}
    }
  } else if (queueIntegration.type === "typebot") {
    await typebotListener({
      ticket,
      msg: payloadMsg,
      wbot,
      typebot: queueIntegration,
    });
  }
};

const handleMessage = async (
  msg: proto.IWebMessageInfo,
  wbot: Session,
  companyId: number,
): Promise<void> => {
  logger.info(`[DEBUG-MSG] Iniciando processamento handleMessage. ID: ${msg?.key?.id}`);

  try {
    if (msg.messageStubType) {
      const { WAMessageStubType } = await loadBaileysUtils();
      if (msg.messageStubType === WAMessageStubType.CIPHERTEXT) {
        logger.info(`[DEBUG-MSG] CIPHERTEXT recebido. Negociando chaves para um novo contato: ${msg.key.remoteJid}`);
        await wbot.assertSessions([msg.key.remoteJid!], true);
        return;
      }
    }
  } catch (err) {}

  try {
    const historySync = msg.message?.protocolMessage?.historySyncNotification;
    if (historySync && (historySync as any).conversations) {
      for (const conversation of (historySync as any).conversations) {
        const chatJid = conversation.id;
        if (conversation.messages) {
          for (const histMsg of conversation.messages) {
            if (!histMsg.message) continue;
            if (!histMsg.key.remoteJid) histMsg.key.remoteJid = chatJid;
            const exists = await Message.count({
              where: { id: histMsg.key.id },
            });
            if (exists > 0) continue;
            (histMsg as any).isHistory = true;
            await handleMessage(histMsg, wbot, companyId);
          }
        }
      }
      return;
    }
  } catch (e) {}

  const isValid = await isValidMsg(msg);
  if (!isValid) {
    logger.info(
      `[DEBUG-MSG] Mensagem ${msg?.key?.id} barrada pelo isValidMsg.`,
    );
    return;
  }

  try {
    let msgContact: any;
    let groupContact: Contact | undefined;
    let mediaSent: Message | undefined;
    let messageStored = false;

    const isGroup = msg.key.remoteJid?.endsWith("@g.us");
    const msgType = await getTypeMessage(msg);
    const bodyMessage = await getBodyMessage(msg);
    const isHistoryMsg =
      msgType === "protocolMessage" &&
      ((msg.message?.protocolMessage?.type as any) ===
        "PEER_DATA_OPERATION_REQUEST_RESPONSE_MESSAGE" ||
        (msg.message?.protocolMessage?.type as any) ===
          "PEER_DATA_OPERATION_REQUEST_MESSAGE");
    const isEdit =
      msgType === "protocolMessage" &&
      (msg.message?.protocolMessage?.type as any) === "MESSAGE_EDIT";

    if (
      msgType === "protocolMessage" &&
      !bodyMessage &&
      !isEdit &&
      !isHistoryMsg
    )
      return;
    if (bodyMessage === null && msgType !== "reactionMessage" && !isHistoryMsg)
      return;
    if (isHistoryMsg && bodyMessage) {
      msg.message = { conversation: bodyMessage };
    }

    const hasMedia =
      !!msg.message?.audioMessage ||
      !!msg.message?.imageMessage ||
      !!msg.message?.videoMessage ||
      !!msg.message?.documentMessage ||
      !!msg.message?.documentWithCaptionMessage ||
      !!msg.message?.stickerMessage;

    if (msg.key.fromMe) {
      if (/\u200e/.test(bodyMessage || "")) return;
      if (
        !hasMedia &&
        msgType !== "conversation" &&
        msgType !== "extendedTextMessage" &&
        msgType !== "vcard"
      )
        return;
      try {
        const meContact = await getContactMessage(msg, wbot);
        const contact = await verifyContact(meContact, wbot, companyId);
        const ticket = await FindOrCreateTicketService(
          contact,
          wbot.id!,
          0,
          companyId,
          groupContact,
        );
        if (hasMedia)
          mediaSent = await verifyMediaMessage(msg, ticket, contact);
        else await verifyMessage(msg, ticket, contact);
        messageStored = true;
        await ticket.update({ updatedAt: new Date() });
      } catch (e) {}
      return;
    }

    msgContact = await getContactMessage(msg, wbot);
    if (msgContact.id && msgContact.id.includes("@s.whatsapp.net")) {
      msg.key.remoteJid = msgContact.id;
    }

    if (isGroup) {
      groupContact = await wbotMutex.runExclusive(async () => {
        let result = groupContactCache.get(msg.key.remoteJid!);
        if (!result) {
          const groupMetadata = await wbot.groupMetadata(msg.key.remoteJid!);
          const msgGroupContact = {
            id: groupMetadata.id,
            name: groupMetadata.subject,
          };
          result = await verifyContact(msgGroupContact as any, wbot, companyId);
          groupContactCache.set(msg.key.remoteJid!, result);
        }
        return result;
      });
    }

    const whatsapp = await ShowWhatsAppService(wbot.id!, companyId);
    logger.info(
      `[DEBUG-MSG] Salvando/Buscando Contato ${msgContact.id} no DB...`,
    );
    const contact = await verifyContact(msgContact, wbot, companyId);
    logger.info(`[DEBUG-MSG] Contato validado no BD. ID: ${contact.id}`);

    const incomeLid =
      msgContact.originalLid ||
      (msg.key.remoteJid!.includes("@lid") ? msg.key.remoteJid : null);
    if (incomeLid && contact.remoteJid !== incomeLid) {
      try {
        await Contact.update(
          { remoteJid: incomeLid },
          { where: { id: contact.id } },
        );
        contact.remoteJid = incomeLid;
      } catch (e) {}
    }

    let unreadMessages = 0;
    const isHistoryImport = (msg as any).isHistory;
    if (!isHistoryImport) {
      try {
        const unreads = await cacheLayer.get(`contacts:${contact.id}:unreads`);
        unreadMessages = Number(unreads || 0) + 1;
        await cacheLayer.set(
          `contacts:${contact.id}:unreads`,
          `${unreadMessages}`,
        );
      } catch (e) {}
    }

    let ticket = await Ticket.findOne({
      where: {
        contactId: contact.id,
        companyId,
        status: { [Op.or]: ["open", "pending"] },
      },
      include: [
        { model: Queue, as: "queue" },
        { model: User, as: "user" },
        { model: Contact, as: "contact" },
      ],
    });

    if (!ticket) {
      ticket = await ticketMutex.runExclusive(async () => {
        return await FindOrCreateTicketService(
          contact,
          wbot.id!,
          unreadMessages,
          companyId,
          groupContact,
        );
      });
      logger.info(`[DEBUG-MSG] Ticket NOVO criado: ${ticket.id}`);
    }

    try {
      await ticket.reload({
        include: [
          { model: Queue, as: "queue" },
          { model: User, as: "user" },
          { model: Contact, as: "contact" },
        ],
      });
    } catch (e) {}

    const executeWebhooks = async () => {
      if (!isGroup && !ticket.userId && !isHistoryImport) {
        if (!processedWebhooks.has(msg.key.id!)) {
          markWebhookAsProcessed(msg.key.id!);
          if (ticket.queueId) {
            try {
              const queue = await Queue.findByPk(ticket.queueId);
              if (queue && queue.integrationId) {
                const integration = await ShowQueueIntegrationService(
                  queue.integrationId,
                  companyId,
                );
                if (integration) {
                  await handleMessageIntegration(
                    msg,
                    wbot,
                    integration,
                    ticket,
                  );
                  return;
                }
              }
            } catch (e) {}
          }
          if (!isNil(whatsapp.integrationId)) {
            try {
              const integrations = await ShowQueueIntegrationService(
                whatsapp.integrationId,
                companyId,
              );
              await handleMessageIntegration(msg, wbot, integrations, ticket);
            } catch (e) {}
          }
          if (!isNil(whatsapp.promptId) && !ticket.queueId) {
            try {
              try {
                if (hasMedia)
                  mediaSent = await verifyMediaMessage(msg, ticket, contact);
                else await verifyMessage(msg, ticket, contact);
                messageStored = true;
              } catch (e) {}
              await handleOpenAi(msg, wbot, ticket, contact, mediaSent);
            } catch (e) {}
          }
        }
      }
    };
    await executeWebhooks();

    try {
      await ticket.update({ fromMe: false });
    } catch (e) {}

    logger.info(`[DEBUG-MSG] Gravando mensagem do contato no banco.`);
    if (!messageStored) {
      try {
        if (hasMedia)
          mediaSent = await verifyMediaMessage(msg, ticket, contact);
        else await verifyMessage(msg, ticket, contact);
      } catch (saveErr) {}
    }

    try {
      await provider(ticket, msg, companyId, contact, wbot);
    } catch (e) {}

    if (bodyMessage == "#" && !isGroup) {
      await ticket.update({
        queueOptionId: null,
        chatbot: false,
        queueId: null,
      });
      await verifyQueue(wbot, msg, ticket, ticket.contact);
      return;
    }

    try {
      const ticketTraking = await FindOrCreateATicketTrakingService({
        ticketId: ticket.id,
        companyId,
        whatsappId: whatsapp?.id,
      });
      if (
        !contact.isGroup &&
        ticketTraking !== null &&
        isNumeric(bodyMessage!) &&
        verifyRating(ticketTraking)
      ) {
        await handleRating(
          parseFloat(bodyMessage!),
          ticket,
          ticketTraking,
          contact,
        );
        return;
      }
    } catch (e) {}

    if (isGroup || contact.disableBot) return;
    if (isHistoryImport) return;

    try {
      const currentSchedule = await VerifyCurrentSchedule(companyId);
      const scheduleType = await Setting.findOne({
        where: { companyId, key: "scheduleType" },
      });
      if (scheduleType && ticket.status !== "open") {
        if (
          scheduleType.value === "company" &&
          !isNil(currentSchedule) &&
          (!currentSchedule || currentSchedule.inActivity === false)
        ) {
          const body = `\u200e ${whatsapp.outOfHoursMessage}`;
          await delay(3000);
          await wbot.sendMessage(
            `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
            { text: body },
          );
          return;
        }
        if (scheduleType.value === "queue" && ticket.queueId !== null) {
          const queue = await Queue.findByPk(ticket.queueId);
          const { schedules }: any = queue;
          const now = moment();
          const weekday = now.format("dddd").toLowerCase();
          let schedule = null;
          if (Array.isArray(schedules) && schedules.length > 0) {
            schedule = schedules.find(
              (s) =>
                s.weekdayEn === weekday &&
                s.startTimeA !== "" &&
                s.startTimeA !== null &&
                s.endTimeA !== "" &&
                s.endTimeA !== null,
            );
          }
          if (
            scheduleType.value === "queue" &&
            queue!.outOfHoursMessage !== null &&
            queue!.outOfHoursMessage !== "" &&
            !isNil(schedule)
          ) {
            const startTimeA = moment(schedule.startTimeA, "HH:mm");
            const endTimeA = moment(schedule.endTimeA, "HH:mm");
            const startTimeB = moment(schedule.startTimeB, "HH:mm");
            const endTimeB = moment(schedule.endTimeB, "HH:mm");
            if (
              now.isBefore(startTimeA) ||
              (now.isAfter(endTimeA) &&
                (now.isBefore(startTimeB) || now.isAfter(endTimeB)))
            ) {
              const body = queue!.outOfHoursMessage;
              await delay(3000);
              await wbot.sendMessage(
                `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
                { text: body },
              );
              return;
            }
          }
        }
      }
    } catch (e) {}

    try {
      if (
        !ticket.queue &&
        !ticket.isGroup &&
        !ticket.userId &&
        whatsapp.queues.length >= 1 &&
        !ticket.useIntegration
      ) {
        await verifyQueue(wbot, msg, ticket, contact, mediaSent);
        const ticketTraking = await FindOrCreateATicketTrakingService({
          ticketId: ticket.id,
          companyId,
          whatsappId: whatsapp?.id,
        });
        if (ticketTraking && ticketTraking.chatbotAt === null) {
          await ticketTraking.update({ chatbotAt: moment().toDate() });
        }
      }
    } catch (e) {}

    const dontReadTheFirstQuestion = ticket.queue === null;
    try {
      await ticket.reload();
    } catch (e) {}

    try {
      if (
        !whatsapp?.queues?.length &&
        !ticket.userId &&
        !isGroup &&
        !msg.key.fromMe &&
        !ticket.useIntegration
      ) {
        const lastMessageFromMe = await Message.findOne({
          where: { ticketId: ticket.id, fromMe: true },
          order: [["createdAt", "DESC"]],
        });
        if (
          lastMessageFromMe &&
          lastMessageFromMe.body.includes(whatsapp.greetingMessage)
        ) {
          return;
        }
        if (whatsapp.greetingMessage) {
          await delay(1000);
          await wbot.sendMessage(
            `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
            { text: whatsapp.greetingMessage },
          );
          return;
        }
      }
    } catch (e) {}

    try {
      if (whatsapp.queues.length == 1 && ticket.queue) {
        if (ticket.chatbot && !msg.key.fromMe)
          await handleChartbot(ticket, msg, wbot);
      }
      if (whatsapp.queues.length > 1 && ticket.queue) {
        if (ticket.chatbot && !msg.key.fromMe)
          await handleChartbot(ticket, msg, wbot, dontReadTheFirstQuestion);
      }
    } catch (e) {}

    logger.info(
      `[DEBUG-MSG] Processamento finalizado com sucesso para ID: ${msg?.key?.id}`,
    );
  } catch (err) {
    logger.error(`FATAL Error handling message: ${err}`);
    Sentry.captureException(err);
  }
};

const verifyRecentCampaign = async (
  message: proto.IWebMessageInfo,
  companyId: number,
) => {
  if (!message.key.fromMe && message.key.remoteJid) {
    const number = message.key.remoteJid.replace(/\D/g, "");
    const campaigns = await Campaign.findAll({
      where: { companyId, status: "EM_ANDAMENTO", confirmation: true },
    });
    if (campaigns) {
      const ids = campaigns.map((c) => c.id);
      const campaignShipping = await CampaignShipping.findOne({
        where: { campaignId: { [Op.in]: ids }, number, confirmation: null },
      });
      if (campaignShipping) {
        await campaignShipping.update({
          confirmedAt: moment(),
          confirmation: true,
        });
        await campaignQueue.add(
          "DispatchCampaign",
          {
            campaignShippingId: campaignShipping.id,
            campaignId: campaignShipping.campaignId,
          },
          { delay: parseToMilliseconds(randomValue(0, 10)) },
        );
      }
    }
  }
};

const verifyCampaignMessageAndCloseTicket = async (
  message: proto.IWebMessageInfo,
  companyId: number,
) => {
  const io = getIO();
  const body = await getBodyMessage(message);
  const isCampaign = /\u200c/.test(body || "");
  if (message.key.fromMe && isCampaign) {
    const messageRecord = await Message.findOne({
      where: { id: message.key.id!, companyId },
    });
    if (!messageRecord) return;
    const ticket = await Ticket.findByPk(messageRecord.ticketId);
    if (!ticket) return;
    await ticket.update({ status: "closed" });
    io.to(`company-${ticket.companyId}-open`)
      .to(`queue-${ticket.queueId}-open`)
      .emit(`company-${ticket.companyId}-ticket`, {
        action: "delete",
        ticket,
        ticketId: ticket.id,
      });
    io.to(`company-${ticket.companyId}-${ticket.status}`)
      .to(`queue-${ticket.queueId}-${ticket.status}`)
      .to(ticket.id.toString())
      .emit(`company-${ticket.companyId}-ticket`, {
        action: "update",
        ticket,
        ticketId: ticket.id,
      });
  }
};

const handleMsgAck = async (msg: any, chat: number | null | undefined) => {
  await new Promise((r) => setTimeout(r, 500));
  const io = getIO();
  try {
    const messageToUpdate = await Message.findByPk(msg.key.id, {
      include: [
        "contact",
        { model: Message, as: "quotedMsg", include: ["contact"] },
      ],
    });
    if (!messageToUpdate) return;
    await messageToUpdate.update({ ack: chat });
    io.to(messageToUpdate.ticketId.toString()).emit(
      `company-${messageToUpdate.companyId}-appMessage`,
      { action: "update", message: messageToUpdate },
    );
  } catch (err) {}
};

const filterMessages = async (msg: any): Promise<boolean> => {
  try {
    const { WAMessageStubType } = await loadBaileysUtils();
    if (msg.message?.protocolMessage) {
      const type = msg.message.protocolMessage.type as any;
      if (type === "HISTORY_SYNC_NOTIFICATION" || type === 0 || type === 4)
        return false;
    }

    if (
      msg.messageStubType &&
      [
        WAMessageStubType.REVOKE,
        WAMessageStubType.E2E_DEVICE_CHANGED,
        WAMessageStubType.E2E_IDENTITY_CHANGED,
        // WAMessageStubType.CIPHERTEXT,
      ].includes(msg.messageStubType)
    ) {
      return false;
    }
    return true;
  } catch (e) {
    return true;
  }
};

// =========================================================================
// O OUVINTE SEGURO:
// - Sem remocao dos eventos nativos do wpp
// - Fila gerenciada com robustez
// =========================================================================
const globalUpsertSeen = new Set<string>();
const wbotQueueIntervals = new Map<string, NodeJS.Timeout>();

const wbotMessageListener = async (
  wbot: Session,
  companyId: number,
): Promise<void> => {
  logger.info(
    `[DEBUG-MSG] Ativando Ouvinte de Mensagens para Empresa ${companyId}`,
  );

  if ((wbot as any).isListenerAttached) return;
  (wbot as any).isListenerAttached = true;

  try {
    const messageQueue: any[] = [];
    let processingQueue = false;

    const processMessageQueue = async () => {
      if (processingQueue || messageQueue.length === 0) return;
      processingQueue = true;

      try {
        const messagesToProcess = [...messageQueue];
        messageQueue.length = 0;

        for (const message of messagesToProcess) {
          try {
            const messageId = message.key.id!;
            const messageExists = await Message.count({
              where: { id: messageId, companyId },
            });

            if (messageExists === 0) {
              await Promise.all([
                handleMessage(message, wbot, companyId),
                verifyRecentCampaign(message, companyId),
                verifyCampaignMessageAndCloseTicket(message, companyId),
              ]);
            }
          } catch (err) {
            logger.error(`Error processing message ${message?.key?.id}: ${err}`);
          }
        }
      } finally {
        processingQueue = false;
      }
    };

    const listenerKey = `${companyId}:${wbot?.id || "unknown"}`;
    if (wbotQueueIntervals.has(listenerKey)) {
      clearInterval(wbotQueueIntervals.get(listenerKey)!);
    }
    const intervalRef = setInterval(processMessageQueue, 100);
    wbotQueueIntervals.set(listenerKey, intervalRef);

    wbot.ev.on("messages.upsert", async (messageUpsert: any) => {
      try {
        if (!messageUpsert.messages || messageUpsert.messages.length === 0)
          return;

        logger.info(`[DEBUG-MSG] Novo Lote de Mensagens: ${messageUpsert.messages.length}`);

        const messages = [];
        for (const msg of messageUpsert.messages) {
          const id = msg.key.id;
          const isStub = !!msg.messageStubType;

          // CORREÇÃO: Não joga o ID na lista de bloqueados se for apenas um aviso de chaves.
          if (id && !isStub) {
            if (globalUpsertSeen.has(id)) continue;
            globalUpsertSeen.add(id);
            setTimeout(() => globalUpsertSeen.delete(id), 10000);
          }

          const isValid = await filterMessages(msg);
          if (isValid) {
            logger.info(`[DEBUG-MSG] Validou MSG: ${id}. Colocando na fila.`);
            messages.push(msg);
          }
        }

        if (!messages.length) return;
        messageQueue.push(...messages);
      } catch (err) {}
    });

    wbot.ev.on("messages.update", async (messageUpdate: any[]) => {
      if (!messageUpdate?.length) return;
      const updates = messageUpdate.map(async (message: any) => {
        try {
          if (
            message?.update?.messageStubType === 1 &&
            message?.key?.remoteJid !== "status@broadcast"
          ) {
            await MarkDeleteWhatsAppMessage(
              message.key.remoteJid,
              null,
              message.key.id,
              companyId,
            );
          }
          if (typeof message?.update?.status === "number") {
            await handleMsgAck(message, message.update.status);
          }
        } catch (err) {}
      });
      await Promise.all(updates);
    });
  } catch (error) {
    logger.error(`Error handling wbot message listener. Err: ${error}`);
  }
};

export { handleMessage, wbotMessageListener, handleMsgAck };