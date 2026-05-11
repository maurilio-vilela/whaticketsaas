import { QueryInterface } from 'sequelize';

module.exports = {
  up: function(queryInterface: QueryInterface) {
    return queryInterface.bulkInsert('Tasks', [
      {
        text: 'Reunião com equipe',
        due_date: new Date('2025-03-01T10:00:00'),
        priority: 'High',
        completed: false,
        status: 'todo',
        company_id: 1,
        user_id: 1,
        assigned_user_id: 2,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        text: 'Revisar relatório',
        due_date: new Date('2025-03-02T15:00:00'),
        priority: 'Medium',
        completed: false,
        status: 'todo',
        company_id: 1,
        user_id: 8,
        assigned_user_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ], {});
  },

  down: function(queryInterface: QueryInterface) {
    return queryInterface.bulkDelete('Tasks', null, {});
  },
}; 