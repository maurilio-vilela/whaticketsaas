import { Server as SocketIO } from "socket.io";
import { Server } from "http";
import { verify } from "jsonwebtoken";

import AppError from "../errors/AppError";
import { logger } from "../utils/logger";
import User from "../models/User";
import Queue from "../models/Queue";
import Ticket from "../models/Ticket";
import authConfig from "../config/auth";
import { CounterManager } from "./counter";
import { SocketRateLimiter } from "./rateLimiter";
import { PayloadValidator } from "./validators";
import { SocketCrypto } from "./socketCrypto";

interface TokenPayload {
  id: string;
  iat: number;
  exp: number;
}

let io: SocketIO;

// Criar instância do limitador de taxa global
const rateLimiter = new SocketRateLimiter(1000, 20); // 20 eventos por segundo por usuário

// Criar instância de criptografia
const socketCrypto = new SocketCrypto();

export const initIO = (httpServer: Server): SocketIO => {
  io = new SocketIO(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL
    },
    path: "/socket.io/",
    connectTimeout: 10000,
    allowUpgrades: true,
    transports: ["websocket"]
  });

  // Registrar log adicional se estiver em produção e não usar HTTPS
  if (process.env.NODE_ENV === "production" && !process.env.BACKEND_URL?.startsWith("https")) {
    logger.warn(
      "O servidor está em produção, mas não está usando HTTPS. Recomendamos configurar SSL para maior segurança."
    );
  }

  io.use((socket, next) => {
    try {
      const { token } = socket.handshake.query;

      if (!token || typeof token !== "string") {
        logger.warn("[libs/socket.ts] Missing or invalid token");
        return next(new Error("Authentication error"));
      }

      const decoded = verify(token, authConfig.secret);
      const tokenData = decoded as TokenPayload;

      if (!tokenData || !tokenData.id) {
        logger.warn("[libs/socket.ts] Invalid token data");
        return next(new Error("Authentication error"));
      }

      // Verificar expiração do token
      const now = Math.floor(Date.now() / 1000);
      if (tokenData.exp && tokenData.exp < now) {
        logger.warn(`[libs/socket.ts] Token expired for user ${tokenData.id}`);
        return next(new Error("Token expired"));
      }

      socket.data.tokenData = tokenData;
      next();
    } catch (error: any) {
      logger.warn(`[libs/socket.ts] Error during socket authentication: ${error?.message}`);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", async socket => {
    logger.info(`Client connected: ${socket.id} from ${socket.handshake.address}`);

    const tokenData = socket.data.tokenData as TokenPayload;
    const counters = new CounterManager();

    let user: User | null = null;
    const userId = tokenData?.id;

    if (!userId || userId === "undefined" || userId === "null") {
      logger.info("onConnect: Missing or invalid userId");
      socket.disconnect();
      return;
    }

    try {
      user = await User.findByPk(userId, { include: [Queue] });

      if (!user) {
        logger.info(`onConnect: User ${userId} not found`);
        socket.disconnect();
        return;
      }

      user.online = true;
      await user.save();
    } catch (error: any) {
      logger.error(`Error fetching user data: ${error.message}`);
      socket.disconnect();
      return;
    }

    socket.join(`company-${user.companyId}-mainchannel`);
    socket.join(`user-${user.id}`);

    // Middleware de rate limiting + validação para eventos
    socket.use((packet, next) => {
      try {
        const [eventName, packetData] = packet;
        const currentUserId = user?.id?.toString();

        if (!currentUserId) {
          return next(new Error("User not authenticated"));
        }

        // Rate limiting
        if (rateLimiter.isRateLimited(currentUserId, eventName)) {
          logger.warn(`Rate limit exceeded for user ${currentUserId} on event ${eventName}`);
          return next(new Error(`Rate limit exceeded for event ${eventName}`));
        }

        // IGNORAR payload vazio em join/leave chatbox (evita erro ruidoso no log)
        if (
          (eventName === "joinChatBox" || eventName === "leaveChatBox") &&
          (packetData === undefined ||
            packetData === null ||
            packetData === "" ||
            packetData === "undefined" ||
            packetData === "null")
        ) {
          return next();
        }

        // Pacote criptografado
        if (
          eventName.startsWith("encrypted:") &&
          packetData &&
          typeof packetData === "object" &&
          "encrypted" in packetData &&
          "iv" in packetData
        ) {
          try {
            const originalEvent = eventName.replace("encrypted:", "");
            const { payload } = socketCrypto.decryptPacket({
              event: originalEvent,
              encrypted: (packetData as any).encrypted,
              iv: (packetData as any).iv
            });

            // substitui pelo pacote descriptografado
            packet[0] = originalEvent;
            packet[1] = payload;

            // IGNORAR vazio após decrypt para join/leave
            if (
              (originalEvent === "joinChatBox" || originalEvent === "leaveChatBox") &&
              (payload === undefined ||
                payload === null ||
                payload === "" ||
                payload === "undefined" ||
                payload === "null")
            ) {
              return next();
            }

            PayloadValidator.validateEventPayload(originalEvent, payload);
            return next();
          } catch (cryptoError: any) {
            logger.warn(`Falha ao descriptografar pacote de ${currentUserId}: ${cryptoError.message}`);
            return next(new Error("Erro na descriptografia: formato inválido"));
          }
        }

        // Pacote não criptografado
        try {
          PayloadValidator.validateEventPayload(eventName, packetData);
        } catch (validationError: any) {
          logger.warn(
            `Payload validation failed for user ${currentUserId} on event ${eventName}: ${validationError.message}`
          );
          return next(new Error(`Invalid payload for event ${eventName}: ${validationError.message}`));
        }

        return next();
      } catch (error: any) {
        logger.error(`Error in socket middleware: ${error.message}`);
        return next(new Error("Error processing request"));
      }
    });

    // Modificar emit padrão para criptografar dados de saída
    const originalEmit = socket.emit.bind(socket);
    socket.emit = function (event: string, ...args: any[]): any {
      // eventos internos do Socket.IO não criptografar
      if (event.startsWith("socket.") || event === "error" || event === "ready") {
        return originalEmit(event, ...args);
      }

      try {
        const payload = args[0];
        const encryptedPacket = socketCrypto.encryptPacket(event, payload);
        return originalEmit(`encrypted:${event}`, encryptedPacket);
      } catch (error: any) {
        logger.error(`Error encrypting packet for event ${event}: ${error.message}`);
        return originalEmit(event, ...args);
      }
    };

    socket.on("joinChatBox", async (ticketId: string) => {
      if (!ticketId || ticketId === "undefined" || ticketId === "null") {
        return;
      }

      try {
        const ticket = await Ticket.findByPk(ticketId);

        if (!ticket) {
          logger.warn(`Attempt to join non-existent ticket channel: ${ticketId} by user ${user!.id}`);
          return;
        }

        if (ticket.companyId !== user!.companyId) {
          logger.warn(
            `Unauthorized attempt to access ticket from another company: ${ticketId} by user ${user!.id}`
          );
          return;
        }

        if (ticket.userId !== user!.id && user!.profile !== "admin") {
          logger.warn(
            `Unauthorized attempt to access ticket assigned to another user: ${ticketId} by user ${user!.id}`
          );
          return;
        }

        let c: number;
        if ((c = counters.incrementCounter(`ticket-${ticketId}`)) === 1) {
          socket.join(ticketId);
        }

        logger.debug(`joinChatbox[${c}]: Channel: ${ticketId} by user ${user!.id}`);
      } catch (error: any) {
        logger.error(`Error in joinChatBox: ${error.message}`);
      }
    });

    socket.on("leaveChatBox", async (ticketId: string) => {
      if (!ticketId || ticketId === "undefined" || ticketId === "null") {
        return;
      }

      let c: number;
      if ((c = counters.decrementCounter(`ticket-${ticketId}`)) === 0) {
        socket.leave(ticketId);
      }

      logger.debug(`leaveChatbox[${c}]: Channel: ${ticketId} by user ${user!.id}`);
    });

    socket.on("joinNotification", async () => {
      try {
        let c: number;
        if ((c = counters.incrementCounter("notification")) === 1) {
          if (user!.profile === "admin") {
            socket.join(`company-${user!.companyId}-notification`);
          } else {
            user!.queues.forEach(queue => {
              logger.debug(`User ${user!.id} of company ${user!.companyId} joined queue ${queue.id} channel.`);
              socket.join(`queue-${queue.id}-notification`);
            });

            if (user!.allTicket === "enabled") {
              socket.join("queue-null-notification");
            }
          }
        }

        logger.debug(`joinNotification[${c}]: User: ${user!.id}`);
      } catch (error: any) {
        logger.error(`Error in joinNotification: ${error.message}`);
      }
    });

    socket.on("leaveNotification", async () => {
      let c: number;
      if ((c = counters.decrementCounter("notification")) === 0) {
        if (user!.profile === "admin") {
          socket.leave(`company-${user!.companyId}-notification`);
        } else {
          user!.queues.forEach(queue => {
            logger.debug(`User ${user!.id} of company ${user!.companyId} leaved queue ${queue.id} channel.`);
            socket.leave(`queue-${queue.id}-notification`);
          });

          if (user!.allTicket === "enabled") {
            socket.leave("queue-null-notification");
          }
        }
      }

      logger.debug(`leaveNotification[${c}]: User: ${user!.id}`);
    });

    socket.on("joinTickets", (status: string) => {
      // Nota: validação do payload já foi feita no middleware
      if (counters.incrementCounter(`status-${status}`) === 1) {
        if (user!.profile === "admin") {
          logger.debug(`Admin ${user!.id} of company ${user!.companyId} joined ${status} tickets channel.`);
          socket.join(`company-${user!.companyId}-${status}`);
        } else if (status === "pending") {
          user!.queues.forEach(queue => {
            logger.debug(
              `User ${user!.id} of company ${user!.companyId} joined queue ${queue.id} pending tickets channel.`
            );
            socket.join(`queue-${queue.id}-pending`);
          });

          if (user!.allTicket === "enabled") {
            socket.join("queue-null-pending");
          }
        } else {
          logger.debug(`User ${user!.id} cannot subscribe to ${status}`);
        }
      }
    });

    socket.on("leaveTickets", (status: string) => {
      // Nota: validação do payload já foi feita no middleware
      if (counters.decrementCounter(`status-${status}`) === 0) {
        if (user!.profile === "admin") {
          logger.debug(`Admin ${user!.id} of company ${user!.companyId} leaved ${status} tickets channel.`);
          socket.leave(`company-${user!.companyId}-${status}`);
        } else if (status === "pending") {
          user!.queues.forEach(queue => {
            logger.debug(
              `User ${user!.id} of company ${user!.companyId} leaved queue ${queue.id} pending tickets channel.`
            );
            socket.leave(`queue-${queue.id}-pending`);
          });

          if (user!.allTicket === "enabled") {
            socket.leave("queue-null-pending");
          }
        }
      }
    });

    socket.on("disconnect", async () => {
      logger.info(`User ${user?.id} disconnected`);
      try {
        if (user) {
          user.online = false;
          await user.save();
        }
      } catch (error: any) {
        logger.error(`Error updating user status on disconnect: ${error.message}`);
      }
    });

    socket.on("error", (err: any) => {
      logger.error(`Socket error for user ${user?.id}: ${err.message}`);
    });

    socket.emit("ready");
  });

  // Limpeza ao desligar o servidor
  process.on("SIGTERM", () => {
    logger.info("SIGTERM signal received: closing socket connections");
    io.close(() => {
      logger.info("Socket.IO server closed");
    });
    rateLimiter.dispose();
  });

  return io;
};

export const getIO = (): SocketIO => {
  if (!io) {
    throw new AppError("Socket IO not initialized");
  }
  return io;
};