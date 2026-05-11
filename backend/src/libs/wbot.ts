import * as Sentry from "@sentry/node";
import axios from "axios";
import makeWASocket, {
  WASocket,
  Browsers,
  WAMessage,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  isJidBroadcast,
  WAMessageKey,
  jidNormalizedUser,
  GroupMetadata,
  proto
} from "whaileys";
import { Op } from "sequelize";
import { FindOptions } from "sequelize/types";
import Whatsapp from "../models/Whatsapp";
import { logger } from "../utils/logger";
import MAIN_LOGGER from "whaileys/lib/Utils/logger";
import authState from "../helpers/authState";
import { Boom } from "@hapi/boom";
import AppError from "../errors/AppError";
import { getIO } from "./socket";
import { Store } from "./store";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";
import DeleteBaileysService from "../services/BaileysServices/DeleteBaileysService";
import { wbotMessageListener } from "../services/WbotServices/wbotMessageListener";
import wbotMonitor from "../services/WbotServices/wbotMonitor";
import NodeCache from 'node-cache';
import Contact from "../models/Contact";
import Ticket from "../models/Ticket";
import GroupEncryptionService from "../services/BaileysServices/GroupEncryptionService";

const KEY_MAP: any = {
  "pre-key": "preKeys",
  session: "sessions",
  "sender-key": "senderKeys",
  "app-state-sync-key": "appStateSyncKeys",
  "app-state-sync-version": "appStateVersions",
  "sender-key-memory": "senderKeyMemory",
  "contacts-tc-token": "tctoken"
};

const extractPhoneNumber = (jid: string): string => {
  if (!jid || typeof jid !== 'string') return '';
  const cleanNumber = jid.replace(/[^0-9]/g, "");
  return cleanNumber.slice(0, 15);
};

const loggerBaileys = MAIN_LOGGER.child({});
loggerBaileys.level = "error";

const msgRetryCounterCache = new NodeCache({ stdTTL: 600, maxKeys: 1000, checkperiod: 300, useClones: false });
const msgCache = new NodeCache({ stdTTL: 60, maxKeys: 1000, checkperiod: 300, useClones: false });

type Session = WASocket & { id?: number; store?: Store; };

export default function msg() {
  return {
    get: (key: WAMessageKey) => {
      const { id } = key;
      if (!id) return;
      let data = msgCache.get(id);
      if (data) {
        try {
          let msg = JSON.parse(data as string);
          return msg?.message;
        } catch (error) {
          logger.error(error);
        }
      }
    },
    save: (msg: WAMessage) => {
      const { id } = msg.key;
      const msgtxt = JSON.stringify(msg);
      try {
        msgCache.set(id as string, msgtxt);
      } catch (error) {
        logger.error(error);
      }
    }
  }
}

const sessions: Session[] = [];
const retriesQrCodeMap = new Map<number, number>();
const reconnectAttempts = new Map<number, number>();
const lastReconnectTime = new Map<number, number>();
const MIN_RECONNECT_INTERVAL = 5000;

// ==============================================================================
// AUTO-UPDATE BLINDADO: A URL da Meta é uma armadilha que retorna "isBelowHard" 
// e causa Erro 405. Usamos apenas WPPConnect ou Fallback seguro.
// ==============================================================================
const getLatestWaVersion = async (): Promise<number[]> => {
  try {
    const { data } = await axios.get("https://raw.githubusercontent.com/wppconnect-team/wa-version/main/versions.json");
    const versionsMatches = JSON.stringify(data).match(/2\.\d+\.\d+(?:-[a-zA-Z0-9]+)?/g);
    
    if (versionsMatches && versionsMatches.length > 0) {
        let latestVersion = versionsMatches[versionsMatches.length - 1];
        latestVersion = latestVersion.split('-')[0]; // Remove sufixos como -alpha
        logger.info(`[AUTO-UPDATE] Versão WPPConnect encontrada: ${latestVersion}`);
        return latestVersion.split('.').map(x => parseInt(x));
    }
  } catch (err) {
    logger.warn("[AUTO-UPDATE] Falha ao buscar JSON WPPConnect. Pulando armadilha da Meta e usando fallback...");
  }

  // Fallback Seguro com a versão Multi-Device (MD) validada
  logger.info("[AUTO-UPDATE] Usando versão de segurança hardcoded.");
  return [2, 3000, 1035370989]; 
};

const loadBaileys = async () => {
  try {
    const baileysModule = await (eval('import("whaileys")') as Promise<any>);
    const base = baileysModule.makeWASocket ? baileysModule : baileysModule.default;
    return {
      makeWASocket: base.makeWASocket || base.default,
      Browsers: base.Browsers,
      DisconnectReason: base.DisconnectReason,
      makeCacheableSignalKeyStore: base.makeCacheableSignalKeyStore,
      isJidBroadcast: base.isJidBroadcast,
      jidNormalizedUser: base.jidNormalizedUser
    };
  } catch (error) {
    logger.error(`Erro ao carregar Baileys dinamicamente: ${error}`);
    throw error;
  }
};

const scheduleReconnect = (whatsapp: Whatsapp, delay: number, reason: string) => {
  const now = Date.now();
  const lastTime = lastReconnectTime.get(whatsapp.id) || 0;
  const timeSinceLastReconnect = now - lastTime;
  
  if (timeSinceLastReconnect < MIN_RECONNECT_INTERVAL) {
    const adjustedDelay = MIN_RECONNECT_INTERVAL - timeSinceLastReconnect + delay;
    delay = adjustedDelay;
  }
  
  lastReconnectTime.set(whatsapp.id, now + delay);
  
  setTimeout(() => {
    logger.info(`Iniciando reconexão para ${whatsapp.name} (${reason})`);
    StartWhatsAppSession(whatsapp, whatsapp.companyId);
  }, delay);
};

export const getWbot = (whatsappId: number): Session => {
  const sessionIndex = sessions.findIndex(s => s.id === whatsappId);
  if (sessionIndex === -1) {
    throw new AppError("ERR_WAPP_NOT_INITIALIZED");
  }
  return sessions[sessionIndex];
};

export const removeWbot = async (whatsappId: number, isLogout = true): Promise<void> => {
  try {
    const sessionIndex = sessions.findIndex(s => s.id === whatsappId);
    if (sessionIndex !== -1) {
      if (isLogout) {
        sessions[sessionIndex].logout();
        sessions[sessionIndex].ws?.close();
      }
      sessions.splice(sessionIndex, 1);
    }
  } catch (err) {
    logger.error(err);
  }
};

export const restartWbot = async (companyId: number, session?: any): Promise<void> => {
  try {
    const options: FindOptions = { where: { companyId }, attributes: ["id"] };
    const whatsapp = await Whatsapp.findAll(options);
    whatsapp.map(async c => {
      const sessionIndex = sessions.findIndex(s => s.id === c.id);
      if (sessionIndex !== -1) {
        sessions[sessionIndex].ws?.close();
      }
    });
  } catch (err) {
    logger.error(err);
  }
};

export const msgDB = msg();

export const initWASocket = async (whatsapp: Whatsapp): Promise<Session> => {
  return new Promise((resolve, reject) => {
    const initializeSession = async () => {
      try {
        const io = getIO();
        const whatsappUpdate = await Whatsapp.findOne({ where: { id: whatsapp.id } });

        if (!whatsappUpdate) return reject(new Error("WhatsApp não encontrado"));

        const { id, name, provider, companyId } = whatsappUpdate;

        if (whatsappUpdate.status === "DISCONNECTED") {
            logger.info(`Conexão cancelada para ${name}.`);
            await removeWbot(id, false);
            return resolve(null as any);
        }

        if (whatsappUpdate.status === "PENDING" || whatsappUpdate.status === "qrcode" || !whatsappUpdate.session) {
            logger.info(`[QR CODE] Limpando chaves velhas para negociar novo QR Code para ${name}.`);
            await removeWbot(id, false);
            await DeleteBaileysService(id).catch(() => {});
            
            await whatsappUpdate.update({ status: "qrcode", session: "", qrcode: "", retries: 0 });
            whatsappUpdate.session = ""; 
            whatsappUpdate.status = "qrcode";
            
            retriesQrCodeMap.delete(id); 
            reconnectAttempts.delete(id);
            
            io.emit(`company-${companyId}-whatsappSession`, { action: "update", session: whatsappUpdate });
        } else if (whatsappUpdate.status === "CONNECTED") {
            const existingSessionIndex = sessions.findIndex(s => s.id === id);
            if (existingSessionIndex !== -1) {
              logger.info(`WhatsApp ${name} já conectado na memória. Reutilizando.`);
              return resolve(sessions[existingSessionIndex]);
            } else {
              await whatsappUpdate.update({ status: "DISCONNECTED" });
              return resolve(null as any);
            }
        }

        const { makeWASocket, Browsers, DisconnectReason, makeCacheableSignalKeyStore, isJidBroadcast, jidNormalizedUser } = await loadBaileys();

        const pino = require("pino");
        const loggerBaileys = pino({ level: "silent" });

        const version = await getLatestWaVersion();
        logger.info(`Starting session ${name} (WA v${version.join(".")})`);

        const { state, saveState } = await authState(whatsappUpdate);
        const userDevicesCache = new NodeCache();
        const signalKeyStore = makeCacheableSignalKeyStore(state.keys, logger, userDevicesCache);

        if (!state.keys) {
          state.keys = {
            get: (type, ids) => {
              const key = KEY_MAP[type];
              return ids.reduce((dict: any, keyId) => {
                let value = (state.keys as any)[key]?.[keyId];
                if (value) {
                  if (type === "app-state-sync-key") {
                    value = proto.Message.AppStateSyncKeyData.create(value);
                  }
                  dict[keyId] = value;
                }
                return dict;
              }, {});
            },
            set: (data: any) => {
              for (const i in data) {
                const key = KEY_MAP[i as keyof typeof KEY_MAP];
                (state.keys as any)[key] = (state.keys as any)[key] || {};
                Object.assign((state.keys as any)[key], data[i]);
              }
              saveState();
            }
          };
        }

        const groupCache = new NodeCache({ stdTTL: 3600, maxKeys: 10000, checkperiod: 600, useClones: false });

        const cachedGroupMetadata = async (jid: string): Promise<GroupMetadata> => {
            let data: GroupMetadata = groupCache.get(jid) as GroupMetadata;
            if (data) return data;
            const result = await wsocket.groupMetadata(jid);
            groupCache.set(jid, result);
            return result;
        };

        let wsocket = makeWASocket({
          logger: loggerBaileys,
          printQRInTerminal: false,
          auth: { creds: state.creds, keys: signalKeyStore },
          version, 
          browser: Browsers.ubuntu("Chrome"),
          msgRetryCounterMap: msgRetryCounterCache as any,
          markOnlineOnConnect: false,
          syncFullHistory: false,
          connectTimeoutMs: 25_000,
          retryRequestDelayMs: 500,
          getMessage: msgDB.get,
          emitOwnEvents: true,
          fireInitQueries: true,
          transactionOpts: { maxCommitRetries: 10, delayBetweenTriesMs: 3000 },
          shouldIgnoreJid: jid => isJidBroadcast(jid),
          cachedGroupMetadata,
        }) as any;

        resolve(wsocket);

        const originalBufferFrom = Buffer.from;
        Buffer.from = function(value: any, ...args: any[]) {
          try {
            if (typeof value === 'object' && value !== null && !Array.isArray(value) && !Buffer.isBuffer(value) && !(value instanceof Uint8Array) && !(value instanceof ArrayBuffer) && value.constructor === Object) {
              try {
                const keys = Object.keys(value);
                const isNumericKeys = keys.every(key => /^\d+$/.test(key));
                if (isNumericKeys && keys.length > 0) {
                  const maxIndex = Math.max(...keys.map(k => parseInt(k)));
                  const array = new Array(maxIndex + 1);
                  for (let i = 0; i <= maxIndex; i++) array[i] = value[i] || 0;
                  return Buffer.from(array);
                }
              } catch (e) { }
            }
            return originalBufferFrom.call(this, value, ...args);
          } catch (e) { return originalBufferFrom.call(this, value, ...args); }
        };

        const sessionIndex = sessions.findIndex(s => s.id === id);
        if (sessionIndex === -1) {
            wsocket.id = id;
            sessions.push(wsocket);
        } else {
            sessions[sessionIndex] = wsocket;
        }

        wsocket.ev.on("connection.update", async ({ connection, lastDisconnect, qr }: any) => {
            logger.info(`Socket ${name} Update: ${connection || "events"}`);
            
            const disconect = (lastDisconnect?.error as Boom)?.output?.statusCode;

            if (connection === "close") {
              
              if (disconect === 401 || disconect === DisconnectReason.loggedOut) {
                logger.warn(`Sessão ${name} foi revogada/deslogada (Erro ${disconect}).`);
                wsocket.ev.removeAllListeners("connection.update");
                try { wsocket.ws?.close(); } catch(e){}
                removeWbot(id, false);
                
                await whatsappUpdate.update({ status: "DISCONNECTED", session: "", number: "", qrcode: "", retries: 0 });
                await DeleteBaileysService(id).catch(() => {});
                io.emit(`company-${companyId}-whatsappSession`, { action: "update", session: whatsappUpdate });
                return; 
              }

              const attempts = reconnectAttempts.get(id) || 0;
              if (attempts >= 5) {
                 logger.error(`Muitas falhas na rede para ${name} (Erro ${disconect}). Desconectando.`);
                 wsocket.ev.removeAllListeners("connection.update");
                 try { wsocket.ws?.close(); } catch(e){}
                 removeWbot(id, false);
                 
                 await whatsappUpdate.update({ status: "DISCONNECTED", qrcode: "" });
                 io.emit(`company-${companyId}-whatsappSession`, { action: "update", session: whatsappUpdate });
                 reconnectAttempts.delete(id);
                 return;
              }

              reconnectAttempts.set(id, attempts + 1);
              const delay = disconect === 405 ? 10000 : 5000; 
              logger.warn(`WhatsApp bloqueando requisição para ${name} (Erro ${disconect}). Tentativa ${attempts+1}/5. Aguardando ${delay}ms.`);
              
              wsocket.ev.removeAllListeners("connection.update");
              try { wsocket.ws?.close(); } catch(e){}
              removeWbot(id, false);
              
              scheduleReconnect(whatsappUpdate, delay, `Falha ${disconect}`);
              return;
            }

            if (connection === "open") {
              reconnectAttempts.delete(id);
              lastReconnectTime.delete(id);
              
              await whatsappUpdate.update({
                status: "CONNECTED",
                qrcode: "",
                retries: 0,
                number: wsocket.type === "md" ? jidNormalizedUser(wsocket.user.id).split("@")[0] : "-"
              });

              io.emit(`company-${companyId}-whatsappSession`, { action: "update", session: whatsappUpdate });

              try {
                await wbotMessageListener(wsocket, companyId);
                await wbotMonitor(wsocket, whatsappUpdate, companyId);
              } catch (err) { logger.error(err); }
            }

            if (qr !== undefined) {
              let currentRetries = retriesQrCodeMap.get(id) || 0;
              
              if (currentRetries >= 4) {
                logger.warn(`QR Code expirado para ${name}. Desconectando sessão.`);
                wsocket.ev.removeAllListeners("connection.update");
                try { wsocket.ws?.close(); } catch(e){}
                wsocket = null as any;

                await whatsappUpdate.update({ status: "DISCONNECTED", qrcode: "", retries: 0 });
                io.emit(`company-${companyId}-whatsappSession`, { action: "update", session: whatsappUpdate });
                retriesQrCodeMap.delete(id);
              } else {
                logger.info(`Novo QR Code gerado para ${name} - Emitindo para o painel.`);
                retriesQrCodeMap.set(id, currentRetries + 1);

                await whatsappUpdate.update({ status: "qrcode", qrcode: qr, retries: 0 });
                io.emit(`company-${companyId}-whatsappSession`, { action: "update", session: whatsappUpdate });
              }
            }
        });
        
        wsocket.ev.on("creds.update", saveState);

        wsocket.ev.on("messages.upsert", async (m: any) => {
          try {
            if (m.messages && m.messages.length > 0) {
              const firstMsg = m.messages[0];
              if (firstMsg.key.remoteJid?.endsWith("@g.us")) {
                logger.debug(`Mensagem de grupo: ${firstMsg.key.remoteJid}`);
              }
            }
          } catch (error) {
            if (m.messages?.[0]?.key?.remoteJid?.endsWith("@g.us")) {
              await GroupEncryptionService.handleGroupEncryptionError(error, m.messages[0].key.remoteJid, wsocket);
            }
          }
        });

        const originalSendMessage = wsocket.sendMessage;
        wsocket.sendMessage = async (jid: string, content: any, options?: any) => {
          try {
            return await originalSendMessage.call(wsocket, jid, content, options);
          } catch (error) {
            if (jid.endsWith("@g.us")) {
              const handled = await GroupEncryptionService.handleGroupEncryptionError(error, jid, wsocket);
              if (handled) return await originalSendMessage.call(wsocket, jid, content, options);
            }
            throw error;
          }
        };

        wsocket.ev.on("presence.update", async ({ id: remoteJid, presences }: any) => {
            try {
              if (!presences[remoteJid]?.lastKnownPresence) return;
              const contact = await Contact.findOne({ where: { number: extractPhoneNumber(remoteJid), companyId } });
              if (!contact) return;
              
              const ticket = await Ticket.findOne({
                where: { contactId: contact.id, whatsappId: id, status: { [Op.or]: ["open", "pending"] } }
              });

              if (ticket) {
                io.to(ticket.id.toString())
                  .to(`company-${companyId}-${ticket.status}`)
                  .to(`queue-${ticket.queueId}-${ticket.status}`)
                  .emit(`company-${companyId}-presence`, { ticketId: ticket.id, presence: presences[remoteJid].lastKnownPresence });
              }
            } catch (error) {}
        });

      } catch (error) {
        logger.error(`Erro na rotina de inicialização do socket: ${error}`);
        reject(error);
      }
    };
    
    initializeSession().catch(err => {
      logger.error(`Erro crítico capturado na borda do initWASocket: ${err}`);
      reject(err);
    });
  });
};