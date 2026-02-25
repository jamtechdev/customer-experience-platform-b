'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await queryInterface.bulkInsert('users', [
      {
        email: 'admin@example.com',
        password: hashedPassword,
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        email: 'analyst@example.com',
        password: hashedPassword,
        first_name: 'Analyst',
        last_name: 'User',
        role: 'analyst',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  }
};
