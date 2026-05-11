import { DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Tickets', 'dealValue', {
      type: Sequelize.DECIMAL(10, 2), // 10 dígitos no total, 2 casas decimais
      allowNull: true,
      defaultValue: 0.00
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Tickets', 'dealValue');
  }
};