import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.addColumn("Contacts", "gender", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.addColumn("Contacts", "personType", {
        type: DataTypes.STRING, // 'F' (Física) ou 'J' (Jurídica)
        allowNull: true,
        defaultValue: "F"
      }),
      queryInterface.addColumn("Contacts", "cpf", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.addColumn("Contacts", "cnpj", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.addColumn("Contacts", "businessName", { // Razão Social
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.addColumn("Contacts", "birthdayDate", {
        type: DataTypes.DATEONLY,
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.addColumn("Contacts", "state", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.addColumn("Contacts", "city", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.addColumn("Contacts", "address", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.addColumn("Contacts", "reference", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      })
    ]);
  },

  down: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.removeColumn("Contacts", "gender"),
      queryInterface.removeColumn("Contacts", "personType"),
      queryInterface.removeColumn("Contacts", "cpf"),
      queryInterface.removeColumn("Contacts", "cnpj"),
      queryInterface.removeColumn("Contacts", "businessName"),
      queryInterface.removeColumn("Contacts", "birthdayDate"),
      queryInterface.removeColumn("Contacts", "state"),
      queryInterface.removeColumn("Contacts", "city"),
      queryInterface.removeColumn("Contacts", "address"),
      queryInterface.removeColumn("Contacts", "reference")
    ]);
  }
};