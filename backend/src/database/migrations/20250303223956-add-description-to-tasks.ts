import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface, Sequelize: any): Promise<void> => {
    return queryInterface.addColumn('Tasks', 'description', {
      type: DataTypes.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    return queryInterface.removeColumn('Tasks', 'description');
  },
};