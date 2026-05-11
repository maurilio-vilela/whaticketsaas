import { Request, Response } from 'express';
import { getIO } from '../libs/socket';
import AppError from '../errors/AppError';
import { logger } from '../utils/logger';
import {
  ListTasksService,
  CreateTaskService,
  ShowTaskService,
  UpdateTaskService,
  DeleteTaskService,
  ListCompanyUsersService,
} from '../services/TaskServices/TaskService';

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;
  const { companyId, id: userId } = req.user;
  const parsedUserId = parseInt(userId);
  logger.info('GET /tasks - Iniciando:', { searchParam, pageNumber, companyId, userId: parsedUserId });

  try {
    const { tasks, count, hasMore } = await ListTasksService({
      searchParam,
      pageNumber,
      companyId,
      userId: parsedUserId,
    });
    logger.info('GET /tasks - Sucesso:', { tasksCount: tasks.length, count, hasMore });
    return res.json({ tasks, count, hasMore });
  } catch (error) {
    logger.error('Erro em GET /tasks:', { message: error.message, stack: error.stack });
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { text, description, dueDate, due_date, priority, completed, status, assignedUserId, ticketId, contactId, dealId } = req.body;
  const { companyId, id: userId } = req.user;
  const parsedUserId = parseInt(userId);
  const effectiveDueDate = dueDate || due_date; // Normalizar dueDate/due_date
  logger.info('POST /tasks - Dados recebidos:', { text, description, dueDate: effectiveDueDate, priority, completed, status, assignedUserId, companyId, userId: parsedUserId });

  try {
    if (!text || !effectiveDueDate) {
      logger.warn('POST /tasks - Dados inválidos:', { text, dueDate: effectiveDueDate });
      throw new AppError('Text and due_date are required', 400);
    }

    const task = await CreateTaskService({
      text,
      description, // Adicionado
      dueDate: effectiveDueDate,
      priority,
      completed,
      status,
      companyId,
      userId: parsedUserId,
      ticketId,
      contactId,
      dealId,
      assignedUserId,
    });
    logger.info('POST /tasks - Tarefa criada:', task);

    const io = getIO();
    io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-task`, {
      action: 'create',
      task,
    });

    return res.status(201).json(task);
  } catch (error) {
    logger.error('Erro em POST /tasks:', { message: error.message, stack: error.stack });
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { taskId } = req.params;
  const { companyId, id: userId } = req.user;
  const parsedUserId = parseInt(userId);
  logger.info('GET /tasks/:taskId - Iniciando:', { taskId, companyId, userId: parsedUserId });

  try {
    const task = await ShowTaskService(taskId, companyId, parsedUserId);
    logger.info('GET /tasks/:taskId - Sucesso:', task);
    return res.status(200).json(task);
  } catch (error) {
    logger.error('Erro em GET /tasks/:taskId:', { message: error.message, stack: error.stack });
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { taskId } = req.params;
  const { text, description, dueDate, due_date, priority, completed, status, assignedUserId, ticketId, contactId, dealId } = req.body;
  const effectiveDueDate = dueDate || due_date; // Normalizar dueDate/due_date
  const taskData = { text, description, dueDate: effectiveDueDate, priority, completed, status, assignedUserId, ticketId, contactId, dealId }; // Adicionado description
  const { companyId, id: userId } = req.user;
  const parsedUserId = parseInt(userId);
  logger.info('PUT /tasks/:taskId - Dados recebidos:', { taskId, taskData, companyId, userId: parsedUserId });

  try {
    const task = await UpdateTaskService({
      taskData,
      taskId,
      companyId,
      userId: parsedUserId,
    });
    logger.info('PUT /tasks/:taskId - Tarefa atualizada:', task);

    const io = getIO();
    io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-task`, {
      action: 'update',
      task,
    });

    return res.status(200).json(task);
  } catch (error) {
    logger.error('Erro em PUT /tasks/:taskId:', { message: error.message, stack: error.stack });
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { taskId } = req.params;
  const { companyId, id: userId } = req.user;
  const parsedUserId = parseInt(userId);
  logger.info('DELETE /tasks/:taskId - Iniciando:', { taskId, companyId, userId: parsedUserId });

  try {
    await DeleteTaskService(taskId, companyId, parsedUserId);
    logger.info('DELETE /tasks/:taskId - Tarefa excluída:', { taskId });

    const io = getIO();
    io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-task`, {
      action: 'delete',
      taskId,
    });

    return res.status(200).json({ message: 'Task deleted' });
  } catch (error) {
    logger.error('Erro em DELETE /tasks/:taskId:', { message: error.message, stack: error.stack });
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

export const listCompanyUsers = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  logger.info('GET /tasks/company-users - Iniciando:', { companyId, rawCompanyId: req.user.companyId });

  try {
    if (typeof companyId !== 'number' || isNaN(companyId)) {
      logger.warn('GET /tasks/company-users - companyId inválido:', { companyId });
      throw new AppError('Invalid companyId', 400);
    }

    const users = await ListCompanyUsersService(companyId);
    logger.info('GET /tasks/company-users - Sucesso:', { usersCount: users.length, users });
    if (!users || users.length === 0) {
      logger.warn('Nenhum usuário encontrado para companyId:', companyId);
    }
    return res.status(200).json(users);
  } catch (error) {
    logger.error('Erro em GET /tasks/company-users:', { message: error.message, stack: error.stack });
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};