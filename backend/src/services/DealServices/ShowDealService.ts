import Deal from "../../models/Deal";
import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import User from "../../models/User";
import Tag from "../../models/Tag";
import DealItem from "../../models/DealItem";

const ShowDealService = async (id: number, companyId: number): Promise<Deal> => {
  const deal = await Deal.findOne({
    where: { id, companyId },
    include: [
      { model: Contact, as: "contact", attributes: ["id", "name", "number", "profilePicUrl"] },
      { model: User, as: "user", attributes: ["id", "name"] },
      { model: Tag, as: "stage", attributes: ["id", "name", "color"] },
      { model: DealItem, as: "items" }
    ]
  });

  if (!deal) {
    throw new AppError("ERR_NO_DEAL_FOUND", 404);
  }

  return deal;
};

export default ShowDealService;