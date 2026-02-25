'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove duplicate camelCase columns if they exist
    const tableDescription = await queryInterface.describeTable('users');
    
    if (tableDescription.firstName) {
      await queryInterface.removeColumn('users', 'firstName');
    }
    
    if (tableDescription.lastName) {
      await queryInterface.removeColumn('users', 'lastName');
    }
  },

  async down(queryInterface, Sequelize) {
    // Re-add the columns if needed (though we don't want them)
    await queryInterface.addColumn('users', 'firstName', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    
    await queryInterface.addColumn('users', 'lastName', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  }
};
