import cron from 'node-cron';
import { Op } from 'sequelize';
import moment from 'moment';
import Task from '../../models/Task';
import { getIO } from '../../libs/socket';
import { logger } from '../../utils/logger';

export const startTaskScheduler = () => {
  // Roda a cada 30 minutos
  cron.schedule('*/30 * * * *', async () => {
    logger.info('Executando verificação de Lembretes de Tarefas (Todolist)');
    try {
      const now = moment();
      const in24Hours = moment().add(24, 'hours');

      // Buscar tarefas que não estão concluídas, e que vencem nas próximas 24 horas
      const tasks = await Task.findAll({
        where: {
          completed: false,
          status: { [Op.ne]: 'done' },
          dueDate: {
            [Op.between]: [now.toDate(), in24Hours.toDate()],
          },
        },
      });

      if (tasks.length === 0) return;

      const io = getIO();
      tasks.forEach((task) => {
        // Envia evento socket para a empresa
        io.to(`company-${task.companyId}-mainchannel`).emit(`company-${task.companyId}-task`, {
          action: 'reminder',
          task: task,
          message: `Lembrete: Tarefa "${task.text}" está próxima do vencimento!`,
        });
        
        logger.info(`Lembrete de Tarefa emitido via socket: TaskID ${task.id} - CompanyID ${task.companyId}`);
      });
    } catch (err) {
      logger.error('Erro na rotina de Lembrete de Tarefas (TaskScheduler):', err);
    }
  });
};
