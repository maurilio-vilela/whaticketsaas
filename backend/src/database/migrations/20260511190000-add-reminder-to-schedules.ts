import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Schedules", "reminderBefore", {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true,
      comment: "Tempo em minutos para enviar lembrete antes da agenda principal",
    });
    await queryInterface.addColumn("Schedules", "reminderSent", {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Schedules", "reminderBefore");
    await queryInterface.removeColumn("Schedules", "reminderSent");
  }
};
