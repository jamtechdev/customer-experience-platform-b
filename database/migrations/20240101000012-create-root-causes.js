'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('root_causes', {
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
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      category: {
        type: Sequelize.STRING,
        allowNull: false
      },
      feedbackIds: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
        field: 'feedback_ids'
      },
      touchpointId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        field: 'touchpoint_id',
        references: {
          model: 'touchpoints',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
        defaultValue: 'medium'
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

    await queryInterface.addIndex('root_causes', ['touchpoint_id']);
    await queryInterface.addIndex('root_causes', ['priority']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('root_causes');
  }
};
