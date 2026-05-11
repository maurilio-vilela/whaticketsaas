import * as Sentry from "@sentry/node";
import { getIO } from "../libs/socket";
import Message from "../models/Message";
import Ticket from "../models/Ticket";
import { logger } from "../utils/logger";
import GetTicketWbot from "./GetTicketWbot";
import type { proto, WASocket } from "whaileys";

// Interface personalizada para estender IMessageKey e incluir timestamp
interface ExtendedMessageKey extends proto.IMessageKey {
  timestamp?: number;
}

// Função para carregar dinamicamente os utilitários do Baileys
const loadBaileysUtils = async () => {
  try {
    const baileysModule = await (eval('import("whaileys")') as Promise<any>);
    logger.info("Baileys carregado dinamicamente com sucesso");
    console.log("Caminho do módulo Baileys:", require.resolve("baileys"));
    return {
      proto: baileysModule.proto,
      getContentType: baileysModule.getContentType
    };
  } catch (err) {
    logger.error(`Erro ao carregar módulo Baileys: ${err}`);
    throw new Error(`Falha ao carregar baileys: ${err}`);
  }
};

const SetTicketMessagesAsRead = async (ticket: Ticket): Promise<void> => {
  try {
    // Verificar se o ticket é válido
    if (!ticket || !ticket.id || !ticket.contact?.number) {
      throw new Error("Ticket inválido ou sem contato associado");
    }

    logger.debug(`Iniciando SetTicketMessagesAsRead para o ticket ${ticket.id}`);

    // Atualizar o contador de mensagens não lidas no ticket
    await ticket.update({ unreadMessages: 0 });
    logger.debug(`Contador de mensagens não lidas zerado para o ticket ${ticket.id}`);

    // Obter a instância do WhatsApp
    const wbot = await GetTicketWbot(ticket);

    // Verificar se a sessão do WhatsApp está ativa
    if (!wbot.user) {
      throw new Error("Sessão do WhatsApp não está ativa");
    }

    // Buscar todas as mensagens não lidas do ticket
    const messages = await Message.findAll({
      where: {
        ticketId: ticket.id,
        fromMe: false,
        read: false
      },
      order: [["createdAt", "DESC"]]
    });

    if (messages.length === 0) {
      logger.info(`Nenhuma mensagem não lida encontrada para o ticket ${ticket.id}`);
      return;
    }

    logger.debug(`Encontradas ${messages.length} mensagens não lidas para o ticket ${ticket.id}: ${JSON.stringify(messages.map(m => ({ id: m.id, dataJson: m.dataJson })), null, 2)}`);

    const { proto, getContentType } = await loadBaileysUtils();
    const messageKeys: ExtendedMessageKey[] = [];

    // Processar todas as mensagens não lidas
    for (const message of messages) {
      try {
        const parsedMessage: proto.IWebMessageInfo = JSON.parse(message.dataJson);
        const msgType = getContentType(parsedMessage.message);

        // Ignorar mensagens do tipo protocolMessage
        if (msgType === "protocolMessage") {
          logger.debug(`Mensagem ${message.id} ignorada (tipo protocolMessage)`);
          continue;
        }

        if (parsedMessage.key && !parsedMessage.key.fromMe) {
          // Adicionar timestamp ao key, usando messageTimestamp ou o timestamp atual como fallback
          const timestamp = parsedMessage.messageTimestamp
            ? Number(parsedMessage.messageTimestamp)
            : Math.floor(Date.now() / 1000); // Timestamp atual em segundos
          messageKeys.push({
            ...parsedMessage.key,
            timestamp
          });
          logger.debug(`Mensagem ${message.id} processada: ${JSON.stringify(parsedMessage.key)} com timestamp ${timestamp}`);
        } else {
          logger.debug(`Mensagem ${message.id} ignorada: key inválido ou fromMe=true`);
        }
      } catch (parseError) {
        logger.warn(`Erro ao parsear mensagem ${message.id}: ${parseError}`);
        continue;
      }
    }

    logger.debug(`messageKeys para ticket ${ticket.id}: ${JSON.stringify(messageKeys, null, 2)}`);

    if (messageKeys.length > 0) {
      // Marcar todas as mensagens como lidas no WhatsApp
      await (wbot as WASocket).chatModify(
        {
          markRead: true,
          lastMessages: messageKeys.map(key => ({
            key: {
              id: key.id,
              remoteJid: key.remoteJid,
              fromMe: key.fromMe,
              participant: key.participant,
              timestamp: key.timestamp || Math.floor(Date.now() / 1000) // Garantir timestamp
            }
          }))
        },
        `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`
      );
      logger.info(`Mensagens marcadas como lidas no WhatsApp para o ticket ${ticket.id}`);
    } else {
      logger.info(`Nenhuma mensagem válida para marcar como lida no ticket ${ticket.id}`);
    }

    // Atualizar o status de leitura no banco de dados
    const updatedRows = await Message.update(
      { read: true },
      {
        where: {
          ticketId: ticket.id,
          read: false
        }
      }
    );
    logger.debug(`Atualizadas ${updatedRows} mensagens como lidas no banco de dados para o ticket ${ticket.id}`);

    // Emitir evento de atualização via Socket.IO
    const io = getIO();
    io.to(`company-${ticket.companyId}-mainchannel`).emit(`company-${ticket.companyId}-ticket`, {
      action: "updateUnread",
      ticketId: ticket.id
    });
    logger.debug(`Evento Socket.IO 'updateUnread' emitido para o ticket ${ticket.id}`);

  } catch (err) {
    logger.error(`Erro ao marcar mensagens como lidas para o ticket ${ticket.id}: ${err}`);
    Sentry.captureException(err);

    // Tentar reconectar caso a sessão esteja desconectada
    if (String(err).includes("Sessão do WhatsApp não está ativa")) {
      logger.warn("Tentando reconectar a sessão do WhatsApp...");
      setTimeout(async () => {
        try {
          await SetTicketMessagesAsRead(ticket);
        } catch (retryErr) {
          logger.error(`Erro ao tentar reconectar e marcar mensagens como lidas: ${retryErr}`);
          Sentry.captureException(retryErr);
        }
      }, 5000);
    }
  }
};

export default SetTicketMessagesAsRead;