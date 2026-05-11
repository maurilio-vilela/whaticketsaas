import { getIO } from "../../libs/socket";
import Contact from "../../models/Contact";
import ContactCustomField from "../../models/ContactCustomField";
import { isNil } from "lodash";
import { Op } from "sequelize";

interface ExtraInfo extends ContactCustomField {
  name: string;
  value: string;
}

interface Request {
  name: string;
  number: string;
  isGroup: boolean;
  email?: string;
  profilePicUrl?: string;
  companyId: number;
  extraInfo?: ExtraInfo[];
  whatsappId?: number;
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
  remoteJid?: string;
  pushName?: string;
  lid?: string;
}

const CreateOrUpdateContactService = async ({
  name,
  number: rawNumber,
  profilePicUrl,
  isGroup,
  email = "",
  companyId,
  extraInfo = [],
  whatsappId,
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
  reference,
  remoteJid,
  pushName,
  lid
}: Request): Promise<Contact> => {
  const number = isGroup ? rawNumber : rawNumber.replace(/[^0-9]/g, "");
  const validBirthdayDate = birthdayDate ? birthdayDate : null;
  const io = getIO();
  let contact: Contact | null = null;

  // 1. Busca o contato pelo número
  if (number) {
    contact = await Contact.findOne({
      where: {
        companyId,
        [Op.or]: [{ number: number }, { secondaryNumber: number }],
      },
    });
  }

  // 2. Se não achar pelo número, tenta pelo LID (remoteJid / lid) se existir
  const queryLid = lid || remoteJid;
  if (!contact && queryLid && queryLid.includes("@lid")) {
    contact = await Contact.findOne({
      where: { companyId, remoteJid: queryLid }
    });
  }

  // Função validadora: Verifica se a string é apenas número de telefone ou JID
  const isJustNumberOrJid = (str: string | undefined) => {
    if (!str) return true;
    if (str.includes("@s.whatsapp.net") || str.includes("@lid") || str.includes("@g.us")) return true;
    if (/^[\d\s\-\+\(\)]+$/.test(str)) return true;
    const justDigits = str.replace(/\D/g, "");
    if (justDigits === number) return true;
    return false;
  };

  if (contact) {
    const updateData: any = {};

    // =========================================================================
    // REGRA DE OURO (TRAVA DE NOME)
    // =========================================================================
    // O sistema verifica se o nome atual salvo no banco é "apenas um número".
    const currentNameIsJustNumber = isJustNumberOrJid(contact.name);

    // Só autoriza a atualização automática do nome se o nome atual for um número.
    // Se já for um nome real (ex: "Maurílio"), ele ignora esse bloco completamente.
    if (currentNameIsJustNumber) {
      if (name && !isJustNumberOrJid(name)) {
        updateData.name = name;
      } else if (pushName && !isJustNumberOrJid(pushName)) {
        updateData.name = pushName;
      }
    }

    if (profilePicUrl) updateData.profilePicUrl = profilePicUrl;
    if (gender) updateData.gender = gender;
    if (personType) updateData.personType = personType;
    if (cpf) updateData.cpf = cpf;
    if (cnpj) updateData.cnpj = cnpj;
    if (businessName) updateData.businessName = businessName;
    if (validBirthdayDate) updateData.birthdayDate = validBirthdayDate;
    if (state) updateData.state = state;
    if (city) updateData.city = city;
    if (address) updateData.address = address;
    if (reference) updateData.reference = reference;

    // Atualiza o LID se descobrimos ele só agora
    if (queryLid && contact.remoteJid !== queryLid) {
      updateData.remoteJid = queryLid;
    }
    
    // Garante que o number substitua qualquer LID que tenha ficado salvo erroneamente no campo number
    if (number && contact.number !== number && !number.includes("@lid")) {
      updateData.number = number;
    }

    if (isNil(contact.whatsappId)) {
      updateData.whatsappId = whatsappId;
    }

    if (Object.keys(updateData).length > 0) {
      await contact.update(updateData);
      io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-contact`, {
        action: "update",
        contact,
      });
    }
  } else {
    // === TRATAMENTO PARA NOVOS CONTATOS ===
    let finalName = name;
    
    // Se o nome vier apenas com número, usa o pushName. Se não tiver pushName, fica o número mesmo.
    if (isJustNumberOrJid(name)) {
      finalName = !isJustNumberOrJid(pushName) ? pushName! : number;
    }

    contact = await Contact.create({
      name: finalName,
      number,
      profilePicUrl,
      email,
      isGroup,
      extraInfo,
      companyId,
      whatsappId,
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
      remoteJid: queryLid
    });

    io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-contact`, {
      action: "create",
      contact,
    });
  }

  return contact;
};

export default CreateOrUpdateContactService;