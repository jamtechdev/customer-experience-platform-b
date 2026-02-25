'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('csv_imports', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      filename: {
        type: Sequelize.STRING,
        allowNull: false
      },
      originalFilename: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'original_filename'
      },
      filePath: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'file_path'
      },
      rowCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'row_count'
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed'),
        allowNull: false,
        defaultValue: 'pending'
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'user_id',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      errorMessage: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'error_message'
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

    await queryInterface.addIndex('csv_imports', ['user_id']);
    await queryInterface.addIndex('csv_imports', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('csv_imports');
  }
};
