import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Tasks", "ticket_id", {
      type: DataTypes.INTEGER,
      references: { model: "Tickets", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
      allowNull: true
    });
    
    await queryInterface.addColumn("Tasks", "contact_id", {
      type: DataTypes.INTEGER,
      references: { model: "Contacts", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
      allowNull: true
    });
    
    await queryInterface.addColumn("Tasks", "deal_id", {
      type: DataTypes.INTEGER,
      references: { model: "Deals", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Tasks", "ticket_id");
    await queryInterface.removeColumn("Tasks", "contact_id");
    await queryInterface.removeColumn("Tasks", "deal_id");
  }
};
