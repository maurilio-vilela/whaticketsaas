import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // Adiciona coluna para armazenar o ID alternativo (LID)
    await queryInterface.addColumn("Contacts", "remoteJid", {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: ""
    });

    // Cria índice para busca ultrarrápida
    await queryInterface.addIndex("Contacts", ["remoteJid"], {
      name: "contact_remoteJid_index"
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeIndex("Contacts", "contact_remoteJid_index");
    await queryInterface.removeColumn("Contacts", "remoteJid");
  }
};