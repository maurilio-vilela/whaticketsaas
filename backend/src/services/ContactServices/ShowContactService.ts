import Contact from "../../models/Contact";
import AppError from "../../errors/AppError";
import Ticket from "../../models/Ticket";
import Queue from "../../models/Queue";
import User from "../../models/User";
import Tag from "../../models/Tag";

const ShowContactService = async (
  id: string | number,
  companyId: number
): Promise<Contact> => {
  const contact = await Contact.findOne({
    where: { id, companyId },
    include: [
      "extraInfo",
      {
        model: Tag,
        as: "tags",
        attributes: ["id", "name", "color"]
      },
      // Removido 'wallets' pois não existe a relação no Model
      {
        model: Ticket,
        as: "tickets",
        // Traz apenas o ticket mais recente para pegar o responsável (User) e as Tags do atendimento
        limit: 1,
        order: [["updatedAt", "DESC"]],
        include: [
          {
            model: Queue,
            as: "queue",
            attributes: ["id", "name", "color"]
          },
          {
            model: User,
            as: "user",
            attributes: ["id", "name"]
          },
          {
            model: Tag,
            as: "tags",
            attributes: ["id", "name", "color"]
          }
        ]
      }
    ]
  });

  if (!contact) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }

  return contact;
};

export default ShowContactService;