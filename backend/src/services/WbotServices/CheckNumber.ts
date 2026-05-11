import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getWbot } from "../../libs/wbot";
import { logger } from "../../utils/logger";

interface IOnWhatsapp {
  jid: string;
  exists: boolean;
}

const checker = async (number: string, wbot: any) => {
  try {
    const [validNumber] = await wbot.onWhatsApp(`${number}@s.whatsapp.net`);
    return validNumber;
  } catch (err) {
    logger.error(`[CheckNumber] Falha na comunicação com o WhatsApp ao checar o número ${number}: ${err}`);
    return undefined; // Retorna undefined de forma segura se a rede oscilar
  }
};

const CheckContactNumber = async (
  number: string,
  companyId: number
): Promise<IOnWhatsapp> => {
  const defaultWhatsapp = await GetDefaultWhatsApp(companyId);

  const wbot = getWbot(defaultWhatsapp.id);
  const isNumberExit = await checker(number, wbot);

  // =========================================================================
  // BLINDAGEM MESTRA: Verifica se a variável existe ANTES de ler o .exists
  // =========================================================================
  if (!isNumberExit || !isNumberExit.exists) {
    logger.warn(`[CheckNumber] O número ${number} é inválido, não possui WhatsApp ou a API da Meta rejeitou o formato.`);
    throw new Error("ERR_CHECK_NUMBER");
  }

  return isNumberExit;
};

export default CheckContactNumber;