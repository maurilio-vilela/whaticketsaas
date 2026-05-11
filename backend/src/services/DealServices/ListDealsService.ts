import { Op } from "sequelize";
import Deal from "../../models/Deal";
import Contact from "../../models/Contact";
import Tag from "../../models/Tag"; // Stages

interface Request {
  searchParam?: string;
  pageNumber?: string | number;
  companyId: number;
  contactId?: number; // Para filtrar deals de um contato específico
  status?: string; // Filtrar por status (open, won, lost)
}

interface Response {
  deals: Deal[];
  count: number;
  hasMore: boolean;
}

const ListDealsService = async ({
  searchParam = "",
  pageNumber = "1",
  companyId,
  contactId,
  status
}: Request): Promise<Response> => {
  let whereCondition: any = {
    companyId
  };

  if (searchParam) {
    whereCondition = {
      ...whereCondition,
      name: { [Op.iLike]: `%${searchParam}%` }
    };
  }

  if (contactId) {
    whereCondition.contactId = contactId;
  }

  if (status) {
    whereCondition.status = status;
  }

  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  const { count, rows: deals } = await Deal.findAndCountAll({
    where: whereCondition,
    limit,
    offset,
    order: [["updatedAt", "DESC"]],
    include: [
      { model: Contact, as: "contact", attributes: ["id", "name", "number", "profilePicUrl"] },
      { model: Tag, as: "stage", attributes: ["id", "name", "color"] }, // Pipeline Stage
      "items" // Traz os produtos
    ]
  });

  const hasMore = count > offset + deals.length;

  return {
    deals,
    count,
    hasMore
  };
};

export default ListDealsService;