import * as Sentry from "@sentry/node";
import Queue from "bull";
import { addSeconds, differenceInSeconds } from "date-fns";
import { isArray, isEmpty, isNil } from "lodash";
import moment from "moment";
import path from "path";
import { Op, QueryTypes } from "sequelize";
import sequelize from "./database";
import GetDefaultWhatsApp from "./helpers/GetDefaultWhatsApp";
import GetWhatsappWbot from "./helpers/GetWhatsappWbot";
import formatBody from "./helpers/Mustache";
import { MessageData, SendMessage } from "./helpers/SendMessage";
import { getIO } from "./libs/socket";
import { getWbot } from "./libs/wbot";
import Campaign from "./models/Campaign";
import CampaignSetting from "./models/CampaignSetting";
import CampaignShipping from "./models/CampaignShipping";
import Company from "./models/Company";
import Contact from "./models/Contact";
import ContactList from "./models/ContactList";
import ContactListItem from "./models/ContactListItem";
import Plan from "./models/Plan";
import Schedule from "./models/Schedule";
import User from "./models/User";
import Whatsapp from "./models/Whatsapp";
import ShowFileService from "./services/FileServices/ShowService";
import { getMessageOptions } from "./services/WbotServices/SendWhatsAppMedia";
import { ClosedAllOpenTickets } from "./services/WbotServices/wbotClosedTickets";
import FindOrCreateTicketService from "./services/TicketServices/FindOrCreateTicketService";
import { logger } from "./utils/logger";
import heapdump from "heapdump";

const nodemailer = require('nodemailer');
const CronJob = require('cron').CronJob;
const fs = require('fs');
const mime = require('mime-types');

const connection = process.env.REDIS_URI || "";
const limiterMax = process.env.REDIS_OPT_LIMITER_MAX || 5;
const limiterDuration = process.env.REDIS_OPT_LIMITER_DURATION || 1000;

interface ProcessCampaignData {
  id: number;
  delay: number;
}

interface PrepareContactData {
  contactId: number;
  campaignId: number;
  delay: number;
  variables: any[];
}

interface DispatchCampaignData {
  campaignId: number;
  campaignShippingId: number;
  contactListItemId: number;
}

export const userMonitor = new Queue("UserMonitor", connection, {
  limiter: { max: 1, duration: 5000 }
});

export const queueMonitor = new Queue("QueueMonitor", connection, {
  limiter: { max: 1, duration: 5000 }
});

export const scheduleMonitor = new Queue("ScheduleMonitor", connection, {
  limiter: { max: 1, duration: 5000 }
});

export const sendScheduledMessages = new Queue("SendSacheduledMessages", connection, {
  limiter: { max: limiterMax as number, duration: limiterDuration as number }
});

export const schedulesRecorrenci = new Queue("schedulesRecorrenci", connection, {
  limiter: { max: 1, duration: 5000 }
});

export const messageQueue = new Queue("MessageQueue", connection, {
  limiter: { max: limiterMax as number, duration: limiterDuration as number }
});

export const campaignQueue = new Queue("CampaignQueue", connection, {
  limiter: { max: 1, duration: 5000 }
});

export const ticketCloseQueue = new Queue("TicketCloseQueue", connection, {
  limiter: { max: 1, duration: 10000 }
});

async function handleSendMessage(job) {
  try {
    const { data } = job;
    const whatsapp = await Whatsapp.findByPk(data.whatsappId);
    if (!whatsapp) {
      throw new Error("Whatsapp não identificado");
    }
    const messageData: MessageData = data.data;
    await SendMessage(whatsapp, messageData);
  } catch (e: any) {
    Sentry.captureException(e);
    logger.error(`MessageQueue -> SendMessage: error: ${e.message}`);
    throw e;
  }
}

// Função otimizada para fechar tickets
async function handleCloseTicketsAutomatic(): Promise<void> {
  const job = new CronJob("*/5 * * * *", async () => {
    try {
      const BATCH_SIZE_COMPANIES = 10; // Processar 10 empresas por vez
      let offset = 0;
      let totalProcessed = 0;

      while (true) {
        const companies = await Company.findAll({
          attributes: ["id"],
          limit: BATCH_SIZE_COMPANIES,
          offset,
        });

        if (companies.length === 0) break;

        for (const company of companies) {
          try {
            await ticketCloseQueue.add("CloseTickets", { companyId: company.id }, { removeOnComplete: true });
            totalProcessed++;
            logger.info(`Empresa ${company.id} enfileirada para fechar tickets`);
          } catch (error: any) {
            logger.error(`Erro ao enfileirar empresa ${company.id}: ${error.message}`);
            Sentry.captureException(error);
          }
        }

        offset += BATCH_SIZE_COMPANIES;
      }

      logger.info(`Fechamento automático enfileirado: ${totalProcessed} empresas`);
    } catch (error: any) {
      Sentry.captureException(error);
      logger.error(`handleCloseTicketsAutomatic -> erro: ${error.message}`);
    }
  });

  job.start();
}

// Monitora uso de memória a cada 30 segundos
setInterval(() => {
  const memoryUsage = process.memoryUsage();
  logger.info("Uso de Memória:", {
    rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
    heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
    heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
    external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`,
    timestamp: new Date().toISOString(),
  });
}, 30 * 1000);

// Monitoramento de heapdump (opcional, ativado apenas em debug)
if (process.env.ENABLE_HEAPDUMP === "true") {
  setInterval(() => {
    const snapshotPath = path.join(__dirname, `heapdump-${Date.now()}.heapsnapshot`);
    heapdump.writeSnapshot(snapshotPath, (err) => {
      if (err) {
        logger.error(`Falha ao gravar snapshot de heap: ${err.message}`);
      } else {
        logger.info(`Snapshot de heap gravado em ${snapshotPath}`);
      }
    });
  }, 4 * 60 * 1000);
}

async function handleVerifySchedulesRecorrenci(job) {
  try {
    const { count, rows: schedules } = await Schedule.findAndCountAll({
      where: {
        status: "ENVIADA",
        repeatEvery: { [Op.not]: null },
        selectDaysRecorrenci: { [Op.not]: '' }
      },
      include: [{ model: Contact, as: "contact", attributes: ['id', 'name', 'number'] }],
      limit: 100
    });

    if (count > 0) {
      for (const schedule of schedules) {
        if (schedule.repeatCount >= schedule.repeatEvery) {
          await schedule.update({
            repeatEvery: null,
            selectDaysRecorrenci: null
          });
        } else {
          await VerifyRecorrenciDate(schedule);
        }
      }
    }
  } catch (e: any) {
    Sentry.captureException(e);
    logger.error(`SendScheduledMessage -> VerifyRecorrenci: error: ${e.message}`);
  }
}

async function VerifyRecorrenciDate(schedule) {
  try {
    const { sendAt, selectDaysRecorrenci } = schedule;
    const originalDate = moment(sendAt);
    const diasSelecionados = selectDaysRecorrenci.split(', ');
    let dateFound = false;
    let i = 1;

    while (!dateFound && i <= 30) {
      let nextDate = moment(originalDate).add(i, "days").set({
        hour: originalDate.hours(),
        minute: originalDate.minutes(),
        second: originalDate.seconds()
      });

      if (diasSelecionados.includes(nextDate.format('dddd'))) {
        await schedule.update({
          status: 'PENDENTE',
          sendAt: nextDate.format("YYYY-MM-DD HH:mm:ssZ"),
          repeatCount: schedule.repeatCount + 1
        });
        logger.info(`Recorrência agendada para: ${schedule.contact.name}`);
        dateFound = true;
      }
      i++;
    }
  } catch (e: any) {
    Sentry.captureException(e);
    logger.error(`VerifyRecorrenciDate -> error: ${e.message}`);
  }
}

async function handleVerifySchedules(job) {
  try {
    const BATCH_SIZE = 100;
    let offset = 0;

    while (true) {
      const schedules = await Schedule.findAll({
        where: {
          status: "PENDENTE",
          sentAt: null,
          sendAt: {
            [Op.gte]: moment().format("YYYY-MM-DD HH:mm:ss"),
            [Op.lte]: moment().add("30", "seconds").format("YYYY-MM-DD HH:mm:ss"),
          },
        },
        include: [{ model: Contact, as: "contact", attributes: ["id", "name", "number"] }],
        limit: BATCH_SIZE,
        offset,
      });

      if (schedules.length === 0) break;

      for (const schedule of schedules) {
        await schedule.update({ status: "AGENDADA" });
        await sendScheduledMessages.add(
          "SendMessage",
          { schedule },
          { delay: 40000, removeOnComplete: true }
        );
        logger.info(`Disparo agendado para: ${schedule.contact.name}`);
      }

      offset += BATCH_SIZE;
    }
  } catch (e: any) {
    Sentry.captureException(e);
    logger.error(`SendScheduledMessage -> Verify: error: ${e.message}`);
  }
}

async function handleSendScheduledMessage(job) {
  const { data: { schedule } } = job;
  let scheduleRecord: Schedule | null = null;

  try {
    scheduleRecord = await Schedule.findByPk(schedule.id);
    if (!scheduleRecord) {
      throw new Error(`Agendamento não encontrado: ${schedule.id}`);
    }

    const whatsapp = await Whatsapp.findByPk(schedule.whatsappId);
    if (!whatsapp) {
      throw new Error(`Whatsapp não encontrado: ${schedule.whatsappId}`);
    }

    const prepareMediaMessage = async (schedule: any) => {
      const url = path.resolve(`public/company${schedule.companyId}`, schedule.mediaPath);
      const fileName = path.basename(url);
      const mimeType = mime.lookup(url);
      const buffer = fs.readFileSync(url);

      if (!buffer || buffer.length === 0) {
        throw new Error(`Buffer da mídia está vazio para o arquivo: ${url}`);
      }

      const fileType = mimeType.split('/')[0];
      const baseMessage = {
        caption: schedule.body || '',
        fileName: fileName,
        mimetype: mimeType
      };

      switch(fileType) {
        case 'image': return { image: buffer, ...baseMessage };
        case 'video': return { video: buffer, ...baseMessage };
        case 'audio': return { audio: buffer, ptt: false, ...baseMessage };
        default: return { document: buffer, ...baseMessage };
      }
    };

    const wbot = await getWbot(whatsapp.id);
    const contactNumber = schedule.contact.number;
    const chatId = `${contactNumber}@s.whatsapp.net`;

    if (schedule.geral === true) {
      const ticket = await FindOrCreateTicketService(
        schedule.contact,
        schedule.whatsappId,
        0,
        schedule.companyId,
        schedule.contact,
        true
      );

      await ticket.update({
        queueId: schedule.queueId ?? null,
        whatsappId: schedule.whatsappId,
        userId: schedule.userId ?? null,
        isGroup: false,
        status: schedule.userId ? "open" : "pending"
      });

      if (schedule.mediaPath) {
        const mediaMessage = await prepareMediaMessage(schedule);
        await wbot.sendMessage(chatId, mediaMessage);
      } else {
        await wbot.sendMessage(chatId, { text: schedule.body });
      }
    } else {
      if (schedule.mediaPath) {
        const mediaMessage = await prepareMediaMessage(schedule);
        await wbot.sendMessage(chatId, mediaMessage);
      } else {
        await wbot.sendMessage(chatId, { text: schedule.body });
      }
    }

    await scheduleRecord.update({
      sentAt: moment().format("YYYY-MM-DD HH:mm"),
      status: "ENVIADA"
    });

    logger.info(`Mensagem agendada enviada para: ${schedule.contact.name}`);
    await sendScheduledMessages.clean(15000, "completed");
  } catch (err: any) {
    Sentry.captureException(err);
    if (scheduleRecord) {
      await scheduleRecord.update({ status: "ERRO" });
    }
    logger.error(`SendScheduledMessage -> SendMessage: error: ${err.message}`);
  }
}

async function handleVerifyCampaigns(job) {
  try {
    const campaigns: { id: number; scheduledAt: string }[] = await sequelize.query(
      `SELECT id, "scheduledAt" FROM "Campaigns" WHERE "scheduledAt" BETWEEN NOW() AND NOW() + '1 hour'::INTERVAL AND status = 'PROGRAMADA'`,
      { type: QueryTypes.SELECT }
    );

    if (campaigns.length > 0) {
      logger.info(`Campanhas encontradas: ${campaigns.length}`);
    }

    for (const campaign of campaigns) {
      const now = moment();
      const scheduledAt = moment(campaign.scheduledAt);
      const delay = Math.max(scheduledAt.diff(now, "milliseconds"), 0);
      logger.info(`Campanha enviada para a fila de processamento: Campanha=${campaign.id}, Delay Inicial=${delay}`);
      await campaignQueue.add(
        "ProcessCampaign",
        { id: campaign.id, delay },
        { removeOnComplete: true }
      );
    }
  } catch (err: any) {
    Sentry.captureException(err);
    logger.error(`VerifyCampaigns -> error: ${err.message}`);
  }
}

async function getCampaign(id) {
  return await Campaign.findByPk(id, {
    include: [
      {
        model: ContactList,
        as: "contactList",
        attributes: ["id", "name"],
        include: [
          {
            model: ContactListItem,
            as: "contacts",
            attributes: ["id", "name", "number", "email", "isWhatsappValid"],
            where: { isWhatsappValid: true }
          }
        ]
      },
      {
        model: Whatsapp,
        as: "whatsapp",
        attributes: ["id", "name"]
      },
      {
        model: CampaignShipping,
        as: "shipping",
        include: [{ model: ContactListItem, as: "contact" }]
      }
    ]
  });
}

async function getContact(id) {
  return await ContactListItem.findByPk(id, {
    attributes: ["id", "name", "number", "email"]
  });
}

async function getSettings(campaign) {
  const settings = await CampaignSetting.findAll({
    where: { companyId: campaign.companyId },
    attributes: ["key", "value"]
  });

  let messageInterval: number = 20;
  let longerIntervalAfter: number = 20;
  let greaterInterval: number = 60;
  let variables: any[] = [];

  settings.forEach(setting => {
    if (setting.key === "messageInterval") {
      messageInterval = JSON.parse(setting.value);
    }
    if (setting.key === "longerIntervalAfter") {
      longerIntervalAfter = JSON.parse(setting.value);
    }
    if (setting.key === "greaterInterval") {
      greaterInterval = JSON.parse(setting.value);
    }
    if (setting.key === "variables") {
      variables = JSON.parse(setting.value);
    }
  });

  return { messageInterval, longerIntervalAfter, greaterInterval, variables };
}

export function parseToMilliseconds(seconds) {
  return seconds * 1000;
}

async function sleep(seconds) {
  logger.info(`Sleep de ${seconds} segundos iniciado: ${moment().format("HH:mm:ss")}`);
  return new Promise(resolve => {
    setTimeout(() => {
      logger.info(`Sleep de ${seconds} segundos finalizado: ${moment().format("HH:mm:ss")}`);
      resolve(true);
    }, parseToMilliseconds(seconds));
  });
}

function getCampaignValidMessages(campaign) {
  const messages = [];
  if (!isEmpty(campaign.message1) && !isNil(campaign.message1)) messages.push(campaign.message1);
  if (!isEmpty(campaign.message2) && !isNil(campaign.message2)) messages.push(campaign.message2);
  if (!isEmpty(campaign.message3) && !isNil(campaign.message3)) messages.push(campaign.message3);
  if (!isEmpty(campaign.message4) && !isNil(campaign.message4)) messages.push(campaign.message4);
  if (!isEmpty(campaign.message5) && !isNil(campaign.message5)) messages.push(campaign.message5);
  return messages;
}

function getCampaignValidConfirmationMessages(campaign) {
  const messages = [];
  if (!isEmpty(campaign.confirmationMessage1) && !isNil(campaign.confirmationMessage1)) messages.push(campaign.confirmationMessage1);
  if (!isEmpty(campaign.confirmationMessage2) && !isNil(campaign.confirmationMessage2)) messages.push(campaign.confirmationMessage2);
  if (!isEmpty(campaign.confirmationMessage3) && !isNil(campaign.confirmationMessage3)) messages.push(campaign.confirmationMessage3);
  if (!isEmpty(campaign.confirmationMessage4) && !isNil(campaign.confirmationMessage4)) messages.push(campaign.confirmationMessage4);
  if (!isEmpty(campaign.confirmationMessage5) && !isNil(campaign.confirmationMessage5)) messages.push(campaign.confirmationMessage5);
  return messages;
}

function getProcessedMessage(msg: string, variables: any[], contact: any) {
  let finalMessage = msg;
  if (finalMessage.includes("{nome}")) finalMessage = finalMessage.replace(/{nome}/g, contact.name);
  if (finalMessage.includes("{email}")) finalMessage = finalMessage.replace(/{email}/g, contact.email);
  if (finalMessage.includes("{numero}")) finalMessage = finalMessage.replace(/{numero}/g, contact.number);
  variables.forEach(variable => {
    if (finalMessage.includes(`{${variable.key}}`)) {
      const regex = new RegExp(`{${variable.key}}`, "g");
      finalMessage = finalMessage.replace(regex, variable.value);
    }
  });
  return finalMessage;
}

export function randomValue(min, max) {
  return Math.floor(Math.random() * max) + min;
}

async function verifyAndFinalizeCampaign(campaign) {
  try {
    const { contacts } = campaign.contactList;
    const count1 = contacts.length;
    const count2 = await CampaignShipping.count({
      where: { campaignId: campaign.id, deliveredAt: { [Op.not]: null } }
    });

    if (count1 === count2) {
      await campaign.update({ status: "FINALIZADA", completedAt: moment() });
      const io = getIO();
      io.to(`company-${campaign.companyId}-mainchannel`).emit(`company-${campaign.companyId}-campaign`, {
        action: "update",
        record: campaign
      });
    }
  } catch (err: any) {
    Sentry.captureException(err);
    logger.error(`verifyAndFinalizeCampaign -> error: ${err.message}`);
  }
}

function calculateDelay(index, baseDelay, longerIntervalAfter, greaterInterval, messageInterval) {
  const diffSeconds = differenceInSeconds(baseDelay, new Date());
  return diffSeconds * 1000 + (index > longerIntervalAfter ? greaterInterval : messageInterval);
}

async function handleProcessCampaign(job) {
  try {
    const { id }: ProcessCampaignData = job.data;
    const campaign = await getCampaign(id);
    if (!campaign) return;

    const settings = await getSettings(campaign);
    const { contacts } = campaign.contactList;
    if (!isArray(contacts)) return;

    const contactData = contacts.map(contact => ({
      contactId: contact.id,
      campaignId: campaign.id,
      variables: settings.variables
    }));

    const longerIntervalAfter = parseToMilliseconds(settings.longerIntervalAfter);
    const greaterInterval = parseToMilliseconds(settings.greaterInterval);
    const messageInterval = settings.messageInterval;
    let baseDelay = campaign.scheduledAt;

    const queuePromises = [];
    for (let i = 0; i < contactData.length; i++) {
      baseDelay = addSeconds(baseDelay, i > longerIntervalAfter ? greaterInterval : messageInterval);
      const { contactId, campaignId, variables } = contactData[i];
      const delay = calculateDelay(i, baseDelay, longerIntervalAfter, greaterInterval, messageInterval);
      queuePromises.push(
        campaignQueue.add(
          "PrepareContact",
          { contactId, campaignId, variables, delay },
          { removeOnComplete: true }
        )
      );
      logger.info(`Registro enviado pra fila de disparo: Campanha=${campaign.id};Contato=${contacts[i].name};delay=${delay}`);
    }

    await Promise.all(queuePromises);
    await campaign.update({ status: "EM_ANDAMENTO" });
  } catch (err: any) {
    Sentry.captureException(err);
    logger.error(`handleProcessCampaign -> error: ${err.message}`);
  }
}

async function handlePrepareContact(job) {
  try {
    const { contactId, campaignId, delay, variables }: PrepareContactData = job.data;
    const campaign = await getCampaign(campaignId);
    if (!campaign) return;

    const contact = await getContact(contactId);
    if (!contact) return;

    const campaignShipping: any = {
      number: contact.number,
      contactId: contactId,
      campaignId: campaignId
    };

    const messages = getCampaignValidMessages(campaign);
    if (messages.length) {
      const radomIndex = randomValue(0, messages.length);
      const message = getProcessedMessage(messages[radomIndex], variables, contact);
      campaignShipping.message = `\u200c ${message}`;
    }

    if (campaign.confirmation) {
      const confirmationMessages = getCampaignValidConfirmationMessages(campaign);
      if (confirmationMessages.length) {
        const radomIndex = randomValue(0, confirmationMessages.length);
        const message = getProcessedMessage(confirmationMessages[radomIndex], variables, contact);
        campaignShipping.confirmationMessage = `\u200c ${message}`;
      }
    }

    const [record, created] = await CampaignShipping.findOrCreate({
      where: { campaignId: campaignShipping.campaignId, contactId: campaignShipping.contactId },
      defaults: campaignShipping
    });

    if (!created && record.deliveredAt === null && record.confirmationRequestedAt === null) {
      await record.update(campaignShipping);
    }

    if (record.deliveredAt === null && record.confirmationRequestedAt === null) {
      const nextJob = await campaignQueue.add(
        "DispatchCampaign",
        { campaignId: campaign.id, campaignShippingId: record.id, contactListItemId: contactId },
        { delay, removeOnComplete: true }
      );
      await record.update({ jobId: nextJob.id });
    }

    await verifyAndFinalizeCampaign(campaign);
  } catch (err: any) {
    Sentry.captureException(err);
    logger.error(`campaignQueue -> PrepareContact -> error: ${err.message}`);
  }
}

async function handleDispatchCampaign(job) {
  try {
    const { campaignShippingId, campaignId }: DispatchCampaignData = job.data;
    const campaign = await getCampaign(campaignId);
    if (!campaign || !campaign.whatsapp) return;

    const wbot = await GetWhatsappWbot(campaign.whatsapp);
    if (!wbot || !wbot.user?.id) {
      logger.error(`campaignQueue -> DispatchCampaign -> error: wbot or wbot user not found`);
      return;
    }

    const campaignShipping = await CampaignShipping.findByPk(campaignShippingId, {
      include: [{ model: ContactListItem, as: "contact" }]
    });
    if (!campaignShipping) return;

    const chatId = `${campaignShipping.number}@s.whatsapp.net`;

    if (campaign.confirmation && campaignShipping.confirmation === null) {
      await wbot.sendMessage(chatId, { text: campaignShipping.confirmationMessage });
      await campaignShipping.update({ confirmationRequestedAt: moment() });
    } else {
      await wbot.sendMessage(chatId, { text: campaignShipping.message });

      if (!isNil(campaign.fileListId)) {
        const publicFolder = path.resolve(__dirname, "..", "public", `company${campaign.companyId}`);
        const files = await ShowFileService(campaign.fileListId, campaign.companyId);
        const folder = path.resolve(publicFolder, "fileList", String(files.id));

        for (const file of files.options) {
          const options = await getMessageOptions(file.path, path.resolve(folder, file.path), file.name);
          await wbot.sendMessage(chatId, { ...options });
        }
      }

      if (campaign.mediaPath) {
        const filePath = path.resolve(`public/company${campaign.companyId}`, campaign.mediaPath);
        const options = await getMessageOptions(campaign.mediaName, filePath);
        if (Object.keys(options).length) {
          const stream = fs.createReadStream(filePath);
          await wbot.sendMessage(chatId, { ...options, media: stream });
        }
      }
      await campaignShipping.update({ deliveredAt: moment() });
    }

    await verifyAndFinalizeCampaign(campaign);
    const io = getIO();
    io.to(`company-${campaign.companyId}-mainchannel`).emit(`company-${campaign.companyId}-campaign`, {
      action: "update",
      record: campaign
    });

    logger.info(`Campanha enviada para: Campanha=${campaignId};Contato=${campaignShipping.contact.name}`);
  } catch (err: any) {
    Sentry.captureException(err);
    logger.error(`campaignQueue -> DispatchCampaign -> error: ${err.message}`);
  }
}

async function handleLoginStatus(job) {
  try {
    const users: { id: number }[] = await sequelize.query(
      `SELECT id FROM "Users" WHERE "updatedAt" < NOW() - '5 minutes'::INTERVAL AND online = true`,
      { type: QueryTypes.SELECT }
    );

    for (const item of users) {
      const user = await User.findByPk(item.id);
      if (user) {
        await user.update({ online: false });
        logger.info(`Usuário passado para offline: ${item.id}`);
      }
    }
  } catch (e: any) {
    Sentry.captureException(e);
    logger.error(`handleLoginStatus -> error: ${e.message}`);
  }
}

async function handleInvoiceCreate() {
  const job = new CronJob('*/5 * * * *', async () => {
    try {
      const companies = await Company.findAll({ attributes: ['id', 'status', 'dueDate', 'planId'] });
      for (const c of companies) {
        if (!c.status) continue;

        const dueDate = moment(c.dueDate);
        const hoje = moment();
        const vencimento = dueDate.format("DD/MM/yyyy");
        const dias = moment.duration(dueDate.diff(hoje)).asDays();

        if (dias <= -3) {
          logger.info(`EMPRESA: ${c.id} está VENCIDA A MAIS DE 3 DIAS... INATIVANDO... ${dias}`);
          await c.update({ status: false });
          logger.info(`EMPRESA: ${c.id} foi INATIVADA.`);

          const whatsapps = await Whatsapp.findAll({
            where: { companyId: c.id },
            attributes: ['id', 'status', 'session']
          });

          for (const whatsapp of whatsapps) {
            if (whatsapp.session) {
              await whatsapp.update({ status: "DISCONNECTED", session: "" });
              const wbot = getWbot(whatsapp.id);
              await wbot.logout();
              logger.info(`EMPRESA: ${c.id} teve o WhatsApp ${whatsapp.id} desconectado...`);
            }
          }
        } else {
          const plan = await Plan.findByPk(c.planId);
          if (!plan) continue;

          const openInvoices = await sequelize.query(
            `SELECT * FROM "Invoices" WHERE "companyId" = ${c.id} AND "status" = 'open'`,
            { type: QueryTypes.SELECT }
          ) as { id: number, dueDate: Date }[];

          const existingInvoice = openInvoices.find(invoice => moment(invoice.dueDate).format("DD/MM/yyyy") === vencimento);
          const timestamp = moment().format();

          if (!existingInvoice && openInvoices.length > 0) {
            await sequelize.query(
              `UPDATE "Invoices" SET "dueDate" = '${dueDate.format()}', "updatedAt" = '${timestamp}' WHERE "id" = ${openInvoices[0].id}`,
              { type: QueryTypes.UPDATE }
            );
            logger.info(`Fatura Atualizada ID: ${openInvoices[0].id}`);
          } else if (!existingInvoice) {
            await sequelize.query(
              `INSERT INTO "Invoices" (detail, status, value, "updatedAt", "createdAt", "dueDate", "companyId")
              VALUES ('${plan.name}', 'open', '${plan.value}', '${timestamp}', '${timestamp}', '${dueDate.format()}', ${c.id})`,
              { type: QueryTypes.INSERT }
            );
            logger.info(`Fatura Gerada para o cliente: ${c.id}`);
          }
        }
      }
    } catch (err: any) {
      Sentry.captureException(err);
      logger.error(`handleInvoiceCreate -> error: ${err.message}`);
    }
  });
  job.start();
}

export async function startQueueProcess() {
  logger.info("Iniciando processamento de filas");

  messageQueue.process("SendMessage", 1, handleSendMessage);
  scheduleMonitor.process("Verify", 1, handleVerifySchedules);
  schedulesRecorrenci.process("VerifyRecorrenci", 1, handleVerifySchedulesRecorrenci);
  sendScheduledMessages.process("SendMessage", 1, handleSendScheduledMessage);
  campaignQueue.process("VerifyCampaigns", 1, handleVerifyCampaigns);
  campaignQueue.process("ProcessCampaign", 1, handleProcessCampaign);
  campaignQueue.process("PrepareContact", 1, handlePrepareContact);
  campaignQueue.process("DispatchCampaign", 1, handleDispatchCampaign);
  userMonitor.process("VerifyLoginStatus", 1, handleLoginStatus);
  ticketCloseQueue.process("CloseTickets", 1, async (job) => {
    await ClosedAllOpenTickets(job.data.companyId);
  });

  scheduleMonitor.add("Verify", {}, {
    repeat: { cron: "*/30 * * * * *" },
    removeOnComplete: true
  });

  schedulesRecorrenci.add("VerifyRecorrenci", {}, {
    repeat: { cron: "*/30 * * * * *" },
    removeOnComplete: true
  });

  campaignQueue.add("VerifyCampaigns", {}, {
    repeat: { cron: "*/5 * * * *" },
    removeOnComplete: true
  });

  userMonitor.add("VerifyLoginStatus", {}, {
    repeat: { cron: "*/5 * * * *" },
    removeOnComplete: true
  });

  handleCloseTicketsAutomatic();
  handleInvoiceCreate();
}