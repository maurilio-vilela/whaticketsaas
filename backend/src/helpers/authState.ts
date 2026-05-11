import Whatsapp from "../models/Whatsapp";
import AppError from "../errors/AppError";
import { logger } from "../utils/logger";

// Função para carregar dinamicamente os utilitários do Baileys
const loadBaileysUtils = async () => {
  try {
    const baileys = await eval('import("whaileys")');
    logger.info("Baileys auth utilities carregado dinamicamente com sucesso");
    return {
      BufferJSON: baileys.BufferJSON,
      initAuthCreds: baileys.initAuthCreds,
      proto: baileys.proto
    };
  } catch (error) {
    logger.error(`Erro ao carregar Baileys auth utilities dinamicamente: ${error}`);
    throw error;
  }
};

const KEY_MAP: { [key: string]: string } = {
  "pre-key": "preKeys",
  session: "sessions",
  "sender-key": "senderKeys",
  "app-state-sync-key": "appStateSyncKeys",
  "app-state-sync-version": "appStateVersions",
  "sender-key-memory": "senderKeyMemory"
};

export default async function authState(
  whatsapp: Whatsapp
): Promise<{ state: any; saveState: () => Promise<void> }> {
  try {
    const { BufferJSON, initAuthCreds, proto } = await loadBaileysUtils();
    let creds: any;
    let keys: any = {};
    const saveState = async () => {
      try {
        await whatsapp.update({
          session: JSON.stringify({ creds, keys }, BufferJSON.replacer, 0)
        });
      } catch (error) {
        throw new AppError(
          `Erro ao salvar estado de autenticação: ${error}`,
          500
        );
      }
    };
    if (whatsapp.session && whatsapp.session !== null) {
      try {
        const result = JSON.parse(whatsapp.session, BufferJSON.reviver);
        creds = result.creds;
        keys = result.keys;
      } catch (error) {
        throw new AppError(
          `Erro ao parsear estado de autenticação: ${error}`,
          500
        );
      }
    } else {
      creds = initAuthCreds();
      keys = {};
    }
    return {
      state: {
        creds,
        keys: {
          get: (type: string, ids: string[]) => {
            const key = KEY_MAP[type];
            return ids.reduce((dict: any, id) => {
              let value = keys[key]?.[id];
              if (value) {
                if (type === "app-state-sync-key") {
                  value = proto.Message.AppStateSyncKeyData.fromObject(value);
                }
                dict[id] = value;
              }
              return dict;
            }, {});
          },
          set: (data: any) => {
            for (const i in data) {
              const key = KEY_MAP[i];
              keys[key] = keys[key] || {};
              Object.assign(keys[key], data[i]);
            }
            saveState();
          }
        }
      },
      saveState
    };
  } catch (error) {
    logger.error(`Falha ao inicializar estado de autenticação: ${error}`);
    throw new AppError(
      `Falha ao inicializar estado de autenticação: ${error}`,
      500
    );
  }
}