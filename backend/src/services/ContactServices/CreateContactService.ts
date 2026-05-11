import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import ContactCustomField from "../../models/ContactCustomField";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp"; // <--- IMPORTANTE
import { getWbot } from "../../libs/wbot"; // <--- IMPORTANTE

interface ExtraInfo extends ContactCustomField {
  name: string;
  value: string;
}

interface Request {
  name: string;
  number: string;
  email?: string;
  profilePicUrl?: string;
  companyId: number;
  extraInfo?: ExtraInfo[];
  disableBot?: boolean;
  gender?: string;
  personType?: string;
  cpf?: string;
  cnpj?: string;
  businessName?: string;
  birthdayDate?: string;
  state?: string;
  city?: string;
  address?: string;
  reference?: string;
}

const CreateContactService = async ({
  name,
  number,
  email = "",
  companyId,
  extraInfo = [],
  disableBot = false,
  gender,
  personType,
  cpf,
  cnpj,
  businessName,
  birthdayDate,
  state,
  city,
  address,
  reference
}: Request): Promise<Contact> => {
  const numberExists = await Contact.findOne({
    where: { number, companyId }
  });

  if (numberExists) {
    throw new AppError("ERR_DUPLICATED_CONTACT");
  }

  // --- NOVA LÓGICA: Captura do LID (remoteJid) ---
  let remoteJid = "";

  try {
    const defaultWhatsapp = await GetDefaultWhatsApp(companyId);
    
    if (defaultWhatsapp && defaultWhatsapp.status === "CONNECTED") {
      const wbot = getWbot(defaultWhatsapp.id);
      // Garante o formato para checagem
      const numberToCheck = number.includes("@") ? number : `${number}@s.whatsapp.net`;
      
      const [result] = await wbot.onWhatsApp(numberToCheck);

      // Se existir e tiver LID, usa o LID. Se não, tenta o JID.
      if (result && result.exists) {
        remoteJid = result.lid || result.jid;
        // O log confirmou que result.lid vem como "número@lid", que é o padrão desejado.
      }
    }
  } catch (err) {
    // Falha silenciosa para não impedir o cadastro se o bot estiver offline
    console.warn("WARN: Não foi possível verificar o LID no WhatsApp:", err);
  }
  // ------------------------------------------------

  // Tratamento da data (correção anterior)
  const validBirthdayDate = birthdayDate ? birthdayDate : null;

  const contact = await Contact.create(
    {
      name,
      number,
      email,
      extraInfo,
      companyId,
      disableBot,
      gender,
      personType,
      cpf,
      cnpj,
      businessName,
      birthdayDate: validBirthdayDate,
      state,
      city,
      address,
      reference,
      remoteJid // Salva o ID@lid aqui
    },
    {
      include: ["extraInfo"]
    }
  );

  return contact;
};

export default CreateContactService;