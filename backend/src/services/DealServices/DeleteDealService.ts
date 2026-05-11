import Deal from "../../models/Deal";
import AppError from "../../errors/AppError";

const DeleteDealService = async (id: string | number, companyId: number): Promise<void> => {
  const deal = await Deal.findOne({
    where: { id, companyId }
  });

  if (!deal) {
    throw new AppError("ERR_NO_DEAL_FOUND", 404);
  }

  await deal.destroy();
};

export default DeleteDealService;