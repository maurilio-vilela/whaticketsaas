import { DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn("Users", "profileImage", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn("Users", "profileImage");
  },
};
