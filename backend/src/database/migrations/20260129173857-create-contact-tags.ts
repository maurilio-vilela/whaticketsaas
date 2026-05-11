import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface) => {
    return queryInterface.createTable("ContactTags", {
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      contactId: {
        type: DataTypes.INTEGER,
        references: { model: "Contacts", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false,
        primaryKey: true
      },
      tagId: {
        type: DataTypes.INTEGER,
        references: { model: "Tags", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false,
        primaryKey: true
      }
    });
  },

  down: (queryInterface) => {
    return queryInterface.dropTable("ContactTags");
  }
};