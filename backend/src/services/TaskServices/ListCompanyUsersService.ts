// /backend/src/services/TaskServices/ListCompanyUsersService.ts
import User from '../../models/User';
import { logger } from '../../utils/logger';

export const ListCompanyUsersService = async (companyId: number): Promise<User[]> => {
  logger.info('ListCompanyUsersService - Iniciando:', { companyId });

  try {
    const users = await User.findAll({
      where: { companyId }, // Usar companyId conforme modelo Users.ts
      attributes: ['id', 'name'],
    });
    logger.info('ListCompanyUsersService - Sucesso:', { usersCount: users.length });
    return users;
  } catch (error) {
    logger.error('Erro em ListCompanyUsersService:', { message: error.message, stack: error.stack });
    throw error;
  }
};

export default ListCompanyUsersService;