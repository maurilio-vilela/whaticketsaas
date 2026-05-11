import { DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface) => {
    return queryInterface.addColumn("Contacts", "secondaryNumber", {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn("Contacts", "secondaryNumber");
  }
};