import Bull, { Queue, QueueOptions } from 'bull';
import { WAMessage, WAMessageUpdate, Contact as BContact } from 'whaileys';
import { handleMsgAck } from './wbotMessageListener';
import configLoader from '../ConfigLoaderService/configLoaderService';
import createOrUpdateBaileysService from '../BaileysServices/CreateOrUpdateBaileysService';
import { logger } from '../../utils/logger';

// Configuração da fila usando REDIS_URI
const redisConfig: QueueOptions = {
  redis: process.env.REDIS_URI || 'redis://127.0.0.1:6379',
  defaultJobOptions: {
    attempts: configLoader().webhook.attempts, // Número de tentativas em caso de falha
    backoff: {
      type: configLoader().webhook.backoff.type, // Tipo de atraso entre tentativas, pode ser 'fixed' ou 'exponential'
      delay: configLoader().webhook.backoff.delay, // Tempo em milissegundos antes de tentar novamente
    },
    removeOnFail: true, // Remove o job da fila quando falha
    removeOnComplete: true, // Remove o job da fila quando completado com sucesso
  },
  limiter: {
    max: configLoader().webhook.limiter.max, // Define o número máximo de jobs processados por unidade de tempo
    duration: configLoader().webhook.limiter.duration, // Define a duração em milissegundos durante a qual o limite máximo é aplicado
  },
};

// Inicialização da fila
const contactsUpdateQueue = new Bull('contactsUpdateQueue', redisConfig);

// Processamento da fila
contactsUpdateQueue.process(async (job) => {
  const { whatsappId, contacts } = job.data;
  logger.info('Inserindo contatos via Redis');
  await createOrUpdateBaileysService({ whatsappId, contacts });
});

// Exportação da função para adicionar jobs
export const addContactsUpdateJob = async (whatsappId: number, contacts: BContact[]) => {
  await contactsUpdateQueue.add({ whatsappId, contacts });
};