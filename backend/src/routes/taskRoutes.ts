import { Router } from 'express';
import isAuth from '../middleware/isAuth';
import * as TaskController from '../controllers/TaskController';

const taskRoutes = Router();

taskRoutes.get('/tasks', isAuth, TaskController.index);
taskRoutes.post('/tasks', isAuth, TaskController.store);
taskRoutes.get('/tasks/:taskId', isAuth, TaskController.show);
taskRoutes.put('/tasks/:taskId', isAuth, TaskController.update);
taskRoutes.delete('/tasks/:taskId', isAuth, TaskController.remove);
taskRoutes.get('/tasks/company-users', isAuth, TaskController.listCompanyUsers); // Adicionado

export default taskRoutes;