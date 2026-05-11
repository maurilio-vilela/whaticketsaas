import { Sequelize, Op } from "sequelize";
import { startOfDay, endOfDay, parseISO, startOfMonth, endOfMonth, subDays } from "date-fns";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import Tag from "../../models/Tag";
import ContactCustomField from "../../models/ContactCustomField";

interface Request {
  searchParam?: string;
  pageNumber?: string;
  companyId: number;
  filterDate?: string;
  tags?: string | string[];
}

interface Response {
  contacts: Contact[];
  count: number;
  hasMore: boolean;
}

const ListContactsService = async ({
  searchParam = "",
  pageNumber = "1",
  companyId,
  filterDate,
  tags
}: Request): Promise<Response> => {
  
  // 1. Construção do WHERE principal
  let whereCondition: any = {
    companyId,
    [Op.or]: [
      {
        name: Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("Contact.name")),
          "LIKE",
          `%${searchParam.toLowerCase().trim()}%`
        )
      },
      { number: { [Op.like]: `%${searchParam.toLowerCase().trim()}%` } }
    ]
  };

  // 2. Filtro de Data (KPIs)
  const now = new Date();
  if (filterDate === "today") {
    whereCondition = { ...whereCondition, createdAt: { [Op.between]: [startOfDay(now), endOfDay(now)] } };
  } else if (filterDate === "week") {
    whereCondition = { ...whereCondition, createdAt: { [Op.between]: [subDays(now, 7), endOfDay(now)] } };
  } else if (filterDate === "month") {
    whereCondition = { ...whereCondition, createdAt: { [Op.between]: [startOfMonth(now), endOfMonth(now)] } };
  }

  // 3. Filtro de Tags Híbrido (Contatos + Tickets)
  if (tags) {
    const tagIds = Array.isArray(tags) ? tags : [tags];
    const parsedTagIds = tagIds.map(t => Number(t)).filter(t => t > 0);

    if (parsedTagIds.length > 0) {
      // Esta query busca o ID do contato tanto na tabela de Tags do Contato quanto nas Tags dos Tickets
      const tagsString = parsedTagIds.join(",");
      
      whereCondition.id = {
        [Op.in]: Sequelize.literal(`(
          SELECT "contactId" 
          FROM "ContactTags" 
          WHERE "tagId" IN (${tagsString})
          
          UNION
          
          SELECT t."contactId" 
          FROM "TicketTags" tt
          INNER JOIN "Tickets" t ON t.id = tt."ticketId"
          WHERE tt."tagId" IN (${tagsString})
        )`)
      };
    }
  }

  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  // 4. Execução da Query
  const { count, rows: contacts } = await Contact.findAndCountAll({
    where: whereCondition,
    limit,
    offset,
    order: [["name", "ASC"]],
    include: [
      {
        model: Tag,
        as: "tags",
        attributes: ["id", "name", "color"],
        required: false
      },
      {
        model: ContactCustomField,
        as: "extraInfo"
      },
      {
        model: Ticket,
        as: "tickets",
        attributes: ["id", "status", "createdAt", "updatedAt", "lastMessage", "uuid"],
        order: [["updatedAt", "DESC"]],
        include: [
            {
                model: Tag,
                as: "tags",
                attributes: ["id", "name", "color"]
            }
        ]
      }
    ],
    distinct: true
  });

  const hasMore = count > offset + contacts.length;

  return {
    contacts,
    count,
    hasMore
  };
};

export default ListContactsService;