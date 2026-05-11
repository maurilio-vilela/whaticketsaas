import Deal from "../../models/Deal";
import DealItem from "../../models/DealItem";

interface ItemData {
  name: string;
  quantity: number;
  unitValue: number;
}

interface Request {
  name: string;
  contactId: number;
  ticketId?: number;
  companyId: number;
  userId?: number;
  pipelineStageId?: number; // Tag ID
  probability?: number;
  expectedCloseDate?: string;
  temperature?: string;
  notes?: string;
  items?: ItemData[];
}

const CreateDealService = async (dealData: Request): Promise<Deal> => {
  const { items, ...data } = dealData;

  // 1. Criar o Deal
  const deal = await Deal.create(data);

  // 2. Se houver itens, cria e calcula o total
  let totalValue = 0;
  if (items && items.length > 0) {
    const itemsToCreate = items.map(item => {
      const total = item.quantity * item.unitValue;
      totalValue += total;
      return {
        ...item,
        total,
        dealId: deal.id
      };
    });

    await DealItem.bulkCreate(itemsToCreate);
    
    // Atualiza o valor total no cabeçalho
    await deal.update({ totalValue });
  }

  // 3. Recarrega com associações
  const createdDeal = await Deal.findByPk(deal.id, {
    include: ["items", "contact", "user", "stage"]
  });

  return createdDeal;
};

export default CreateDealService;