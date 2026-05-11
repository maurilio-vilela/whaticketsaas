// Função para carregar dinamicamente os utilitários do Baileys
const loadBaileysUtils = async () => {
  const baileys = await import("whaileys");
  return {
    proto: baileys.proto
  };
};

// Função para extrair informações de mensagens de texto
export const getTextMessage = (msg: any) => {
  return msg.message?.conversation;
};

// Função para extrair informações de mensagens de imagem
export const getImageMessage = (msg: any) => {
  return msg.message?.imageMessage?.caption || "Imagem";
};

// Função para extrair informações de mensagens de vídeo
export const getVideoMessage = (msg: any) => {
  return msg.message?.videoMessage?.caption || "Vídeo";
};

// Função para extrair informações de mensagens de áudio
export const getAudioMessage = (msg: any) => {
  return "Áudio";
};

// Função para extrair informações de mensagens de documento
export const getDocumentMessage = (msg: any) => {
  return msg.message?.documentMessage?.fileName || "Documento";
};

// Função para extrair informações de mensagens de localização
export const getLocationMessage = (msg: any) => {
  return {
    latitude: msg.message?.locationMessage?.degreesLatitude,
    longitude: msg.message?.locationMessage?.degreesLongitude
  };
};

// Função para extrair informações de mensagens de contato
export const getContactMessage = (msg: any) => {
  return msg.message?.contactMessage?.displayName;
};

// Função para extrair informações de mensagens de botão
export const getButtonsMessage = (msg: any) => {
  return msg.message?.buttonsResponseMessage?.selectedButtonId;
};

// Função para extrair informações de mensagens de lista
export const getListMessage = (msg: any) => {
  return msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId;
};

// Função para extrair informações de mensagens de reação
export const getReactionMessage = (msg: any) => {
  return msg.message?.reactionMessage?.text;
};

// Função para extrair informações de mensagens de visualização única
export const getViewOnceMessage = (msg: any) => {
  return msg.message?.viewOnceMessage?.message;
};

// Função para extrair informações de mensagens de produto
export const getProductMessage = (msg: any) => {
  return msg.message?.productMessage?.product?.title;
};

// Função para extrair informações de mensagens de catálogo de produtos
export const getProductCatalogMessage = (msg: any) => {
  return msg.message?.productMessage?.product?.catalogId;
};

// Função para extrair informações de mensagens de pedido
export const getOrderMessage = (msg: any) => {
  return msg.message?.orderMessage?.orderId;
};

// Função para extrair informações de mensagens de pagamento
export const getPaymentMessage = (msg: any) => {
  return msg.message?.paymentInfo?.transactionId;
};

// Função para extrair informações de mensagens de grupo
export const getGroupMessage = (msg: any) => {
  return msg.message?.groupInviteMessage?.groupJid;
};

// Função para extrair informações de mensagens de enquete
export const getPollMessage = (msg: any) => {
  return msg.message?.pollCreationMessage?.name;
};

// Função para extrair informações de mensagens de enquete atualizada
export const getPollUpdateMessage = (msg: any) => {
  return msg.message?.pollUpdateMessage?.pollCreationMessageKey;
};

// Função para extrair informações de mensagens de enquete vote
export const getPollVoteMessage = (msg: any) => {
  return msg.message?.pollUpdateMessage?.vote;
};

// Função para extrair informações de mensagens de enquete creation
export const getPollCreationMessage = (msg: any) => {
  return msg.message?.pollCreationMessage?.name;
};

// Função para extrair informações de mensagens de enquete update
export const getPollUpdate = (msg: any) => {
  return msg.message?.pollUpdateMessage?.pollCreationMessageKey;
};

// Função para extrair informações de mensagens de enquete vote update
export const getPollVoteUpdate = (msg: any) => {
  return msg.message?.pollUpdateMessage?.vote;
};

// Função para extrair informações de mensagens de enquete vote update
export const getPollVoteUpdateMessage = (msg: any) => {
  return msg.message?.pollUpdateMessage?.vote;
};

// Função para extrair informações de mensagens de enquete vote update
export const getPollVoteUpdateMessageKey = (msg: any) => {
  return msg.message?.pollUpdateMessage?.pollCreationMessageKey;
};

// Função para extrair informações de mensagens de enquete vote update
export const getPollVoteUpdateSenderKey = (msg: any) => {
  return msg.message?.pollUpdateMessage?.senderTimestampMs;
};

// Função para extrair informações de mensagens de enquete vote update
export const getPollVoteUpdateSenderKeyDistributionMessage = (msg: any) => {
  return msg.message?.pollUpdateMessage?.senderKeyDistributionMessage;
};

// Função para extrair informações de mensagens de enquete vote update
export const getPollVoteUpdateSenderKeyDistributionMessageGroupId = (msg: any) => {
  return msg.message?.pollUpdateMessage?.senderKeyDistributionMessage?.groupId;
};

// Função para extrair informações de mensagens de enquete vote update
export const getPollVoteUpdateSenderKeyDistributionMessageAxolotlSenderKeyDistributionMessage = (msg: any) => {
  return msg.message?.pollUpdateMessage?.senderKeyDistributionMessage?.axolotlSenderKeyDistributionMessage;
};

// Função para extrair informações de mensagens de enquete vote update
export const getPollVoteUpdateSenderKeyDistributionMessageAxolotlSenderKeyDistributionMessageSenderKeyId = (msg: any) => {
  return msg.message?.pollUpdateMessage?.senderKeyDistributionMessage?.axolotlSenderKeyDistributionMessage?.senderKeyId;
};

// Função para extrair informações de mensagens de enquete vote update
export const getPollVoteUpdateSenderKeyDistributionMessageAxolotlSenderKeyDistributionMessageSenderKey = (msg: any) => {
  return msg.message?.pollUpdateMessage?.senderKeyDistributionMessage?.axolotlSenderKeyDistributionMessage?.senderKey;
};

// Função para extrair informações de mensagens de enquete vote update
export const getPollVoteUpdateSenderKeyDistributionMessageAxolotlSenderKeyDistributionMessageSenderKeyPublic = (msg: any) => {
  return msg.message?.pollUpdateMessage?.senderKeyDistributionMessage?.axolotlSenderKeyDistributionMessage?.senderKeyPublic;
};

// Função para extrair informações de mensagens de enquete vote update
export const getPollVoteUpdateSenderKeyDistributionMessageAxolotlSenderKeyDistributionMessageSenderKeyPrivate = (msg: any) => {
  return msg.message?.pollUpdateMessage?.senderKeyDistributionMessage?.axolotlSenderKeyDistributionMessage?.senderKeyPrivate;
};

// Função para extrair informações de mensagens de enquete vote update
export const getPollVoteUpdateSenderKeyDistributionMessageAxolotlSenderKeyDistributionMessageSenderKeySignature = (msg: any) => {
  return msg.message?.pollUpdateMessage?.senderKeyDistributionMessage?.axolotlSenderKeyDistributionMessage?.senderKeySignature;
};

// Função para extrair informações de mensagens de enquete vote update
export const getPollVoteUpdateSenderKeyDistributionMessageAxolotlSenderKeyDistributionMessageSenderKeySignaturePublic = (msg: any) => {
  return msg.message?.pollUpdateMessage?.senderKeyDistributionMessage?.axolotlSenderKeyDistributionMessage?.senderKeySignaturePublic;
};

// Função para extrair informações de mensagens de enquete vote update
export const getPollVoteUpdateSenderKeyDistributionMessageAxolotlSenderKeyDistributionMessageSenderKeySignaturePrivate = (msg: any) => {
  return msg.message?.pollUpdateMessage?.senderKeyDistributionMessage?.axolotlSenderKeyDistributionMessage?.senderKeySignaturePrivate;
};