import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.createTable('Tasks', { // Ajustado para "Tasks"
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      text: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      due_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      priority: {
        type: DataTypes.ENUM('High', 'Medium', 'Low'),
        allowNull: false,
        defaultValue: 'Medium',
      },
      completed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      status: {
        type: DataTypes.ENUM('todo', 'doing', 'done'),
        allowNull: false,
        defaultValue: 'todo',
      },
      company_id: {
        type: DataTypes.INTEGER,
        references: { model: 'Companies', key: 'id' }, // Ajustado para "Companies"
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        references: { model: 'Users', key: 'id' }, // Ajustado para "Users"
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: false,
      },
      assigned_user_id: {
        type: DataTypes.INTEGER,
        references: { model: 'Users', key: 'id' }, // Ajustado para "Users"
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.dropTable('Tasks'); // Ajustado para "Tasks"
  },
};