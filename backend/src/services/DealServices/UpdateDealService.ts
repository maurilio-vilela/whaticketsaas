import Deal from "../../models/Deal";
import DealItem from "../../models/DealItem";
import AppError from "../../errors/AppError";

interface ItemData {
  id?: number; // Se tiver ID, atualiza. Se não, cria.
  name: string;
  quantity: number;
  unitValue: number;
  _destroy?: boolean; // Flag para deletar item no frontend
}

interface Request {
  dealId: number;
  companyId: number;
  dealData: {
    name?: string;
    status?: string; // open, won, lost
    lossReason?: string;
    probability?: number;
    expectedCloseDate?: string;
    temperature?: string;
    pipelineStageId?: number;
    notes?: string;
    userId?: number; // Mudar responsável
    items?: ItemData[];
  };
}

const UpdateDealService = async ({ dealId, companyId, dealData }: Request): Promise<Deal> => {
  const deal = await Deal.findOne({
    where: { id: dealId, companyId },
    include: ["items"]
  });

  if (!deal) {
    throw new AppError("ERR_NO_DEAL_FOUND", 404);
  }

  const { items, ...mainData } = dealData;

  // 1. Atualiza dados principais
  await deal.update(mainData);

  // 2. Gerencia Itens (Criar, Atualizar, Deletar) e Recalcula Total
  if (items) {
    let newTotalValue = 0;

    for (const item of items) {
      if (item._destroy && item.id) {
        // Deletar item
        await DealItem.destroy({ where: { id: item.id, dealId } });
      } else if (item.id) {
        // Atualizar item existente
        const itemTotal = item.quantity * item.unitValue;
        await DealItem.update(
          { ...item, total: itemTotal },
          { where: { id: item.id, dealId } }
        );
        newTotalValue += itemTotal;
      } else if (!item._destroy) {
        // Criar novo item
        const itemTotal = item.quantity * item.unitValue;
        await DealItem.create({
          ...item,
          total: itemTotal,
          dealId
        });
        newTotalValue += itemTotal;
      }
    }

    // Se não enviou items para deletar, precisamos somar os que ficaram no banco
    // A lógica acima é simplificada. Para garantir integridade, re-somamos tudo do banco:
    const remainingItems = await DealItem.findAll({ where: { dealId } });
    const finalTotal = remainingItems.reduce((acc, curr) => acc + Number(curr.total), 0);
    
    await deal.update({ totalValue: finalTotal });
  }

  await deal.reload({
    include: ["items", "contact", "user", "stage"]
  });

  return deal;
};

export default UpdateDealService;