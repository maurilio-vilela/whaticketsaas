import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // 1. Tabela de Oportunidades (Deals)
    await queryInterface.createTable("Deals", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "Nome da Oportunidade (ex: Venda de Site Institucional)"
      },
      totalValue: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        allowNull: false
      },
      probability: {
        type: DataTypes.INTEGER,
        defaultValue: 0, // 0 a 100
        allowNull: false
      },
      expectedCloseDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      status: {
        type: DataTypes.STRING, // 'open', 'won', 'lost'
        defaultValue: 'open',
        allowNull: false
      },
      temperature: {
        type: DataTypes.STRING, // 'cold', 'warm', 'hot'
        defaultValue: 'cold'
      },
      lossReason: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      notes: { // Informações adicionais
        type: DataTypes.TEXT,
        allowNull: true
      },
      extraFields: { // Campos personalizados em JSON
        type: DataTypes.JSONB,
        defaultValue: [],
        allowNull: true
      },
      contactId: {
        type: DataTypes.INTEGER,
        references: { model: "Contacts", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      ticketId: { // Opcional: Vínculo com o atendimento atual
        type: DataTypes.INTEGER,
        references: { model: "Tickets", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      companyId: {
        type: DataTypes.INTEGER,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      userId: { // Responsável pela oportunidade
        type: DataTypes.INTEGER,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      pipelineStageId: { // Etapa do Funil (Tag com kanban=1)
        type: DataTypes.INTEGER,
        references: { model: "Tags", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });

    // 2. Tabela de Itens da Oportunidade (DealItems)
    await queryInterface.createTable("DealItems", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      dealId: {
        type: DataTypes.INTEGER,
        references: { model: "Deals", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      name: { // Nome do produto/serviço
        type: DataTypes.STRING,
        allowNull: false
      },
      quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: false
      },
      unitValue: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      total: { // unitValue * quantity
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("DealItems");
    await queryInterface.dropTable("Deals");
  }
};