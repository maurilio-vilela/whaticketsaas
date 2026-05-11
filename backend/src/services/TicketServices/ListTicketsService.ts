import {
  Op,
  fn,
  where,
  col,
  Filterable,
  Includeable,
  literal,
} from "sequelize";
import { startOfDay, endOfDay, parseISO } from "date-fns";

import Ticket from "../../models/Ticket";
import Contact from "../../models/Contact";
import Message from "../../models/Message";
import Queue from "../../models/Queue";
import User from "../../models/User";
import ShowUserService from "../UserServices/ShowUserService";
import Tag from "../../models/Tag";
import TicketTag from "../../models/TicketTag";
import { intersection } from "lodash";
import Whatsapp from "../../models/Whatsapp";

interface Request {
  searchParam?: string;
  pageNumber?: string;
  status?: string;
  date?: string;
  updatedAt?: string;
  showAll?: string;
  userId: string;
  withUnreadMessages?: string;
  queueIds: number[];
  tags: number[];
  users: number[];
  companyId: number;
  dateFrom?: string;
  dateTo?: string;
  includeMessages?: string;
}

interface Response {
  tickets: Ticket[];
  count: number;
  hasMore: boolean;
}

const ListTicketsService = async ({
  searchParam = "",
  pageNumber = "1",
  queueIds,
  tags,
  users,
  status,
  date,
  updatedAt,
  showAll,
  userId,
  withUnreadMessages,
  companyId,
  dateFrom,
  dateTo,
  includeMessages,
}: Request): Promise<Response> => {
  // LOG DE DEBUG
  console.log("🔍 [ListTicketsService] Parâmetros:", {
    searchParam,
    includeMessages,
    dateFrom,
    dateTo,
    status,
    companyId,
  });

  let whereCondition: Filterable["where"] = {
    [Op.or]: [{ userId }, { status: "pending" }],
    queueId: { [Op.or]: [queueIds, null] },
  };
  let includeCondition: Includeable[];

  includeCondition = [
    {
      model: Contact,
      as: "contact",
      attributes: ["id", "name", "number", "email", "profilePicUrl"],
    },
    {
      model: Queue,
      as: "queue",
      attributes: ["id", "name", "color"],
    },
    {
      model: User,
      as: "user",
      attributes: ["id", "name", "profileImage"],
    },
    {
      model: Tag,
      as: "tags",
      attributes: ["id", "name", "color"],
    },
    {
      model: Whatsapp,
      as: "whatsapp",
      attributes: ["name"],
    },
  ];

  if (showAll === "true") {
    whereCondition = { queueId: { [Op.or]: [queueIds, null] } };
  }

  if (status && status !== "all") {
    whereCondition = {
      ...whereCondition,
      status,
    };
  }

  if (searchParam) {
    const sanitizedSearchParam = searchParam.toLocaleLowerCase().trim();

    if (includeMessages === "true") {
      console.log("🔍 [ListTicketsService] Modo: Busca em Mensagens Ativo");

      includeCondition.push({
        model: Message,
        as: "messages",
        attributes: ["id", "body", "createdAt", "mediaType", "ticketId"],
        where: {
          body: where(
            fn("LOWER", col("messages.body")),
            "LIKE",
            `%${sanitizedSearchParam}%`,
          ),
        },
        required: true,
        duplicating: false,
      });
    } else {
      console.log("🔍 [ListTicketsService] Modo: Busca Padrão (Contato)");

      whereCondition = {
        ...whereCondition,
        [Op.or]: [
          {
            "$contact.name$": where(
              fn("LOWER", col("contact.name")),
              "LIKE",
              `%${sanitizedSearchParam}%`,
            ),
          },
          { "$contact.number$": { [Op.like]: `%${sanitizedSearchParam}%` } },
          where(literal('CAST("Ticket"."id" AS TEXT)'), {
            [Op.like]: `%${sanitizedSearchParam}%`,
          }),
        ],
      };
    }
  }

  if (dateFrom && dateTo) {
    const start = startOfDay(parseISO(dateFrom));
    const end = endOfDay(parseISO(dateTo));

    console.log("🔍 [ListTicketsService] Filtro Data:", { start, end });

    whereCondition = {
      ...whereCondition,
      updatedAt: {
        [Op.between]: [start, end],
      } as any, 
    };
  } else if (date) {
    whereCondition = {
      ...whereCondition,
      createdAt: {
        [Op.between]: [+startOfDay(parseISO(date)), +endOfDay(parseISO(date))],
      } as any, 
    };
  }

  if (updatedAt) {
    whereCondition = {
      ...whereCondition,
      updatedAt: {
        [Op.between]: [
          +startOfDay(parseISO(updatedAt)),
          +endOfDay(parseISO(updatedAt)),
        ],
      } as any, 
    };
  }

  if (withUnreadMessages === "true") {
    const user = await ShowUserService(userId);
    const userQueueIds = user.queues.map((queue) => queue.id);

    whereCondition = {
      [Op.or]: [{ userId }, { status: "pending" }],
      queueId: { [Op.or]: [userQueueIds, null] },
      unreadMessages: { [Op.gt]: 0 },
    };
  }

  if (Array.isArray(tags) && tags.length > 0) {
    const ticketsTagFilter: any[] | null = [];
    for (let tag of tags) {
      const ticketTags = await TicketTag.findAll({ where: { tagId: tag } });
      if (ticketTags) {
        ticketsTagFilter.push(ticketTags.map((t) => t.ticketId));
      }
    }
    const ticketsIntersection: number[] = intersection(...ticketsTagFilter);
    whereCondition = {
      ...whereCondition,
      id: { [Op.in]: ticketsIntersection },
    };
  }

  if (Array.isArray(users) && users.length > 0) {
    const ticketsUserFilter: any[] | null = [];
    for (let user of users) {
      const ticketUsers = await Ticket.findAll({ where: { userId: user } });
      if (ticketUsers) {
        ticketsUserFilter.push(ticketUsers.map((t) => t.id));
      }
    }
    const ticketsIntersection: number[] = intersection(...ticketsUserFilter);
    whereCondition = {
      ...whereCondition,
      id: { [Op.in]: ticketsIntersection },
    };
  }

  const limit = 40;
  const offset = limit * (+pageNumber - 1);

  whereCondition = {
    ...whereCondition,
    companyId,
  };

  const { count, rows: tickets } = await Ticket.findAndCountAll({
    where: whereCondition,
    include: includeCondition,
    distinct: includeMessages === "true" ? false : true,
    limit,
    offset,
    order: [["updatedAt", "DESC"]],
    subQuery: false,
    logging: console.log,
  });

  console.log(`🔍 [ListTicketsService] Encontrados: ${count} tickets.`);
  if (tickets.length > 0 && includeMessages === "true") {
    // @ts-ignore
    console.log(
      `🔍 [ListTicketsService] Messages no Ticket 0: ${tickets[0].messages?.length}`,
    );
  }

  const hasMore = count > offset + tickets.length;

  return {
    tickets,
    count,
    hasMore,
  };
};

export default ListTicketsService;