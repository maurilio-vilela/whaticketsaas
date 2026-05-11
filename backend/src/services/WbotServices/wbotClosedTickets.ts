import { Op, literal } from "sequelize";
import * as Sentry from "@sentry/node";
import { subMinutes } from "date-fns";
import Ticket from "../../models/Ticket";
import Whatsapp from "../../models/Whatsapp";
import Contact from "../../models/Contact";
import TicketTraking from "../../models/TicketTraking";
import { getIO } from "../../libs/socket";
import formatBody from "../../helpers/Mustache";
import SendWhatsAppMessage from "./SendWhatsAppMessage";
import ShowTicketService from "../TicketServices/ShowTicketService";
import { verifyMessage } from "./wbotMessageListener";
import { logger } from "../../utils/logger";

export const ClosedAllOpenTickets = async (companyId: number): Promise<void> => {
  const BATCH_SIZE = 50; // Processar 50 tickets por vez
  let offset = 0;
  let totalClosed = 0;
  const io = getIO();

  try {
    while (true) {
      // Busca tickets abertos que atendem ao critério de inatividade
      const tickets = await Ticket.findAll({
        where: {
          companyId,
          status: { [Op.in]: ["open"] },
          isGroup: false,
          fromMe: true,
          updatedAt: { [Op.lte]: literal(`NOW() - INTERVAL '${60} MINUTE'`) }, // Exemplo: 60 minutos
        },
        attributes: ["id", "status", "whatsappId", "contactId", "updatedAt", "fromMe", "isGroup"],
        include: [
          { model: Contact, as: "contact", attributes: ["id", "name", "number"] },
          { model: Whatsapp, as: "whatsapp", attributes: ["id", "expiresTicket", "expiresInactiveMessage"] },
        ],
        limit: BATCH_SIZE,
        offset,
        order: [["updatedAt", "DESC"]],
      });

      if (tickets.length === 0) break;

      // Processa tickets em lote
      const ticketIds = tickets.map(ticket => ticket.id);
      const ticketsToClose = [];
      const ticketTrakingsToUpdate = [];
      const messagesToSend = [];

      for (const ticket of tickets) {
        try {
          const whatsapp = ticket.whatsapp;
          if (!whatsapp || !whatsapp.expiresTicket || whatsapp.expiresTicket === 0) continue;

          // Verifica se expiresTicket é um número válido
          const expiresTicket = Number(whatsapp.expiresTicket);
          if (isNaN(expiresTicket) || expiresTicket <= 0) {
            logger.warn(`expiresTicket inválido para whatsapp ${whatsapp.id}: ${whatsapp.expiresTicket}`);
            continue;
          }

          const expiresInactiveMessage = whatsapp.expiresInactiveMessage || "";
          const dataLimite = subMinutes(new Date(), expiresTicket);

          // Verifica se o ticket está inativo
          if (ticket.updatedAt <= dataLimite && ticket.fromMe && !ticket.isGroup) {
            const showTicket = await ShowTicketService(ticket.id, companyId);
            const bodyExpiresMessageInactive = formatBody(`\u200e ${expiresInactiveMessage}`, showTicket.contact);

            // Prepara atualização do ticket
            ticketsToClose.push({
              id: ticket.id,
              status: "closed",
              lastMessage: ticket.status === "open" || ticket.status === "nps" ? bodyExpiresMessageInactive : undefined,
              unreadMessages: 0,
              amountUseBotQueues: 0,
              updatedAt: new Date(),
            });

            // Prepara mensagem, se aplicável
            if (expiresInactiveMessage && expiresInactiveMessage !== "") {
              messagesToSend.push({ ticket: showTicket, body: bodyExpiresMessageInactive });
            }

            // Prepara atualização do TicketTraking
            const ticketTraking = await TicketTraking.findOne({
              where: { ticketId: ticket.id, finishedAt: null },
            });
            if (ticketTraking) {
              ticketTrakingsToUpdate.push({
                id: ticketTraking.id,
                finishedAt: new Date(),
                closedAt: new Date(),
                whatsappId: ticket.whatsappId,
                userId: ticket.userId,
              });
            }

            // Emite evento de socket
            io.to("open").emit(`company-${companyId}-ticket`, {
              action: "delete",
              ticketId: ticket.id,
            });

            totalClosed++;
            logger.info(`Ticket ${ticket.id} preparado para fechamento: empresa ${companyId}`);
          }
        } catch (error: any) {
          logger.error(`Erro ao processar ticket ${ticket.id}: ${error.message}`);
          Sentry.captureException(error);
        }
      }

      // Executa atualizações em lote
      if (ticketsToClose.length > 0) {
        await Ticket.bulkCreate(ticketsToClose, {
          updateOnDuplicate: ["status", "lastMessage", "unreadMessages", "amountUseBotQueues", "updatedAt"],
        });
        logger.info(`Atualizados ${ticketsToClose.length} tickets em lote para empresa ${companyId}`);
      }

      if (ticketTrakingsToUpdate.length > 0) {
        await TicketTraking.bulkCreate(ticketTrakingsToUpdate, {
          updateOnDuplicate: ["finishedAt", "closedAt", "whatsappId", "userId"],
        });
        logger.info(`Atualizados ${ticketTrakingsToUpdate.length} ticket trakings em lote para empresa ${companyId}`);
      }

      // Envia mensagens em sequência
      for (const { ticket, body } of messagesToSend) {
        try {
          const sentMessage = await SendWhatsAppMessage({ body, ticket });
          await verifyMessage(sentMessage, ticket, ticket.contact);
          logger.info(`Mensagem de inatividade enviada para ticket ${ticket.id}`);
        } catch (error: any) {
          logger.error(`Erro ao enviar mensagem para ticket ${ticket.id}: ${error.message}`);
          Sentry.captureException(error);
        }
      }

      offset += BATCH_SIZE;

      // Força coleta de lixo
      if (global.gc) {
        global.gc();
        logger.debug(`GC executado após lote de tickets para empresa ${companyId}`);
      }
    }

    logger.info(`Fechados ${totalClosed} tickets para empresa ${companyId}`);
  } catch (error: any) {
    logger.error(`Erro em ClosedAllOpenTickets para empresa ${companyId}: ${error.message}`);
    Sentry.captureException(error);
    throw error;
  }
};