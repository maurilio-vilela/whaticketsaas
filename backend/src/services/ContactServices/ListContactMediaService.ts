import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import { Op, Sequelize } from "sequelize";
import AppError from "../../errors/AppError";

interface Request {
  contactId: number;
  companyId: number;
  pageNumber?: string;
  limit?: string;
  filterDate?: string; // Adicionado para manter padrão com o sistema
}

const ListContactMediaService = async ({
  contactId,
  companyId,
  pageNumber = "1",
  limit = "20",
  filterDate
}: Request) => {
  const LIMIT = 20;
  const OFFSET = LIMIT * (+pageNumber - 1);

  // 1. Configuração Base das Condições (Sua configuração original preservada)
  let whereCondition: any = {
    companyId,
    mediaUrl: { [Op.ne]: null }, // Garante que tem URL
    isDeleted: false, // Não traz mensagens apagadas
    [Op.or]: [
      { mediaType: "image" },
      { mediaType: "video" },
      { mediaType: "audio" },
      { mediaType: "document" },
      { mediaType: "application" },
      { mediaType: { [Op.like]: "application/%" } },
      { mediaType: { [Op.like]: "image/%" } }
    ]
  };

  // 2. Adição do Filtro de Data (Compatibilidade com Dashboard/KPIs)
  // Se não vier filterDate, ele ignora e traz tudo (comportamento original)
  if (filterDate === "today") {
    whereCondition = {
      ...whereCondition,
      createdAt: { [Op.gte]: Sequelize.literal("CURRENT_DATE") }
    };
  } else if (filterDate === "week") {
    whereCondition = {
      ...whereCondition,
      createdAt: { [Op.gte]: Sequelize.literal("CURRENT_DATE - INTERVAL '7 days'") }
    };
  } else if (filterDate === "month") {
    whereCondition = {
      ...whereCondition,
      createdAt: { [Op.gte]: Sequelize.literal("date_trunc('month', CURRENT_DATE)") }
    };
  }

  try {
    const { count, rows: messages } = await Message.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Ticket,
          as: "ticket",
          where: {
            companyId: companyId,
            contactId: contactId // Mantido: Filtra pelo dono do ticket (correção de merge)
          },
          required: true,
          attributes: ["id", "status", "createdAt", "uuid"]
        }
      ],
      limit: LIMIT,
      offset: OFFSET,
      order: [["createdAt", "DESC"]]
    });

    const hasMore = count > OFFSET + messages.length;

    return {
      messages,
      hasMore,
      count
    };
  } catch (error) {
    console.error("Erro ao listar mídias:", error);
    throw new AppError("Erro ao listar arquivos do contato (GED).", 500);
  }
};

export default ListContactMediaService;