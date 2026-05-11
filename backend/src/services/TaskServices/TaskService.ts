import Task from '../../models/Task';
import User from '../../models/User';
import AppError from '../../errors/AppError';
import { Op } from 'sequelize';

interface TaskData {
  text: string;
  description?: string; // Adicionado, opcional
  dueDate: Date;
  priority?: 'High' | 'Medium' | 'Low';
  completed?: boolean;
  status?: 'todo' | 'doing' | 'done';
  companyId: number;
  userId: number;
  assignedUserId?: number; // Adicionado
}

interface ListTasksParams {
  searchParam?: string;
  pageNumber?: string;
  companyId: number;
  userId: number;
}

export const ListTasksService = async ({
  searchParam = '',
  pageNumber = '1',
  companyId,
  userId,
}: ListTasksParams): Promise<{ tasks: Task[]; count: number; hasMore: boolean }> => {
  const limit = 20;
  const offset = limit * (parseInt(pageNumber) - 1);

  const whereClause: any = {
    companyId,
    [Op.or]: [
      { userId }, // Tarefas criadas pelo usuário
      { assignedUserId: userId }, // Tarefas atribuídas ao usuário
    ],
  };
  if (searchParam) {
    whereClause.text = { [Op.iLike]: `%${searchParam}%` };
  }

  const { rows: tasks, count } = await Task.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    order: [['dueDate', 'ASC']],
    include: [
      { model: User, as: 'user', attributes: ['id', 'name'] }, // Inclui o criador
      { model: User, as: 'assignedUser', attributes: ['id', 'name'] }, // Inclui o designado
    ],
  });

  const hasMore = offset + tasks.length < count;

  return { tasks, count, hasMore };
};

export const CreateTaskService = async (taskData: TaskData): Promise<Task> => {
  const task = await Task.create(taskData);
  return task;
};

export const ShowTaskService = async (taskId: string, companyId: number, userId: number): Promise<Task> => {
  const task = await Task.findOne({
    where: {
      id: taskId,
      companyId,
      [Op.or]: [{ userId }, { assignedUserId: userId }],
    },
    include: [
      { model: User, as: 'user', attributes: ['id', 'name'] },
      { model: User, as: 'assignedUser', attributes: ['id', 'name'] },
    ],
  });
  if (!task) {
    throw new AppError('ERR_TASK_NOT_FOUND', 404);
  }
  return task;
};

export const UpdateTaskService = async ({
  taskData,
  taskId,
  companyId,
  userId,
}: {
  taskData: Partial<TaskData>;
  taskId: string;
  companyId: number;
  userId: number;
}): Promise<Task> => {
  const task = await Task.findOne({
    where: {
      id: taskId,
      companyId,
      userId, // Apenas o criador pode editar
    },
  });
  if (!task) {
    throw new AppError('ERR_TASK_NOT_FOUND', 404);
  }

  await task.update(taskData);
  return task;
};

export const DeleteTaskService = async (taskId: string, companyId: number, userId: number): Promise<void> => {
  const task = await Task.findOne({
    where: {
      id: taskId,
      companyId,
      userId, // Apenas o criador pode deletar
    },
  });
  if (!task) {
    throw new AppError('ERR_TASK_NOT_FOUND', 404);
  }

  await task.destroy();
};

// Novo serviço para listar usuários da empresa
export const ListCompanyUsersService = async (companyId: number): Promise<User[]> => {
  const users = await User.findAll({
    where: { companyId },
    attributes: ['id', 'name'],
  });
  return users;
};