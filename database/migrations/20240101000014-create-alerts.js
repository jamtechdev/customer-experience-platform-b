'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('alerts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
        defaultValue: 'medium'
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      acknowledged: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      acknowledgedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        field: 'acknowledged_by',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      acknowledgedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'acknowledged_at'
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

    await queryInterface.addIndex('alerts', ['acknowledged_by']);
    await queryInterface.addIndex('alerts', ['priority']);
    await queryInterface.addIndex('alerts', ['acknowledged']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('alerts');
  }
};
