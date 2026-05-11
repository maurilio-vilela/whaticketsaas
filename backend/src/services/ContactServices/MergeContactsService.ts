import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import ContactCustomField from "../../models/ContactCustomField";
import AppError from "../../errors/AppError";
import { Op } from "sequelize";

interface Request {
  originId: number;
  targetId: number;
  companyId: number;
}

const MergeContactsService = async ({
  originId,
  targetId,
  companyId
}: Request): Promise<Contact> => {
  if (originId === targetId) {
    throw new AppError("Origem e destino não podem ser iguais.");
  }

  const originContact = await Contact.findOne({
    where: { id: originId, companyId }
  });

  const targetContact = await Contact.findOne({
    where: { id: targetId, companyId },
    include: ["extraInfo", "tags"]
  });

  if (!originContact || !targetContact) {
    throw new AppError("Contatos não encontrados.");
  }

  const connection = Contact.sequelize;
  const t = await connection?.transaction();

  try {
    // 1. Atualiza secondaryNumber
    await targetContact.update({
        secondaryNumber: originContact.number
    }, { transaction: t });

    // 2. MIGRAÇÃO DE TICKETS INTELIGENTE (CORREÇÃO DO ERRO)
    const originTickets = await Ticket.findAll({
      where: { contactId: originId, companyId }
    });

    for (const ticket of originTickets) {
      // Verifica se o destino já tem um ticket com este whatsappId e status
      // A restrição unique geralmente é (contactId, companyId, whatsappId) para tickets abertos ou algo similar dependendo da sua migration
      
      const ticketExists = await Ticket.findOne({
        where: { 
          contactId: targetId, 
          companyId,
          whatsappId: ticket.whatsappId
          // status: ticket.status (Depende da sua regra unique, se for global ou só para abertos)
        },
        transaction: t
      });

      if (ticketExists) {
        // COLISÃO DETECTADA: O destino já tem um ticket.
        // Solução: Atualizamos o ticket antigo para um status 'closed' antigo ou deletamos se for duplicado vazio.
        // Aqui vamos optar por mover mas forçar o status para 'closed' se estiver 'open', 
        // ou se a restrição for rígida, teremos que mesclar as mensagens (Message.update ticketId) e deletar o ticket velho.
        
        // ESTRATÉGIA SEGURA: Mover as MENSAGENS do ticket velho para o ticket novo e apagar o ticket velho.
        
        const Message = require("../../models/Message").default; // Importação dinâmica para evitar ciclo se houver
        
        await Message.update(
          { ticketId: ticketExists.id },
          { where: { ticketId: ticket.id }, transaction: t }
        );

        await ticket.destroy({ transaction: t }); // Deleta o ticket velho (casca vazia)
        
      } else {
        // SEM COLISÃO: Pode mover o ticket tranquilamente
        await ticket.update({ contactId: targetId }, { transaction: t });
      }
    }

    // 3. Mover Campos Extras
    const originExtras = await ContactCustomField.findAll({
      where: { contactId: originId }
    });

    for (const extra of originExtras) {
        const exists = targetContact.extraInfo?.find(e => e.name === extra.name);
        if (!exists) {
            await extra.update({ contactId: targetId }, { transaction: t });
        }
    }

    // 4. Mover Tags (Manual para garantir)
    // Se a tabela pivô ContactTags tiver unique constraint, isso pode dar erro se usarmos update direto.
    // O ideal é buscar as tags da origem e adicionar no destino se não tiver.
    const ContactTag = require("../../models/ContactTag").default;
    const originTags = await ContactTag.findAll({ where: { contactId: originId }});
    
    for (const contactTag of originTags) {
        const tagExists = await ContactTag.findOne({
            where: { contactId: targetId, tagId: contactTag.tagId },
            transaction: t
        });
        
        if (!tagExists) {
            await ContactTag.create({
                contactId: targetId,
                tagId: contactTag.tagId
            }, { transaction: t });
        }
    }

    // 5. Deletar Origem
    await originContact.destroy({ transaction: t });

    await t?.commit();
    return targetContact;

  } catch (error) {
    await t?.rollback();
    console.error(error);
    throw new AppError("Erro ao mesclar contatos.");
  }
};

export default MergeContactsService;