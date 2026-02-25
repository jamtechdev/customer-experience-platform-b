'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('csv_mappings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      csvImportId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'csv_import_id',
        references: {
          model: 'csv_imports',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      mappings: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {}
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        field: 'created_at',
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        field: 'updated_at',
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('csv_mappings', ['csv_import_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('csv_mappings');
  }
};
