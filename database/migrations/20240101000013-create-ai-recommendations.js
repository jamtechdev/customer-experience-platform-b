'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ai_recommendations', {
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
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
        defaultValue: 'medium'
      },
      category: {
        type: Sequelize.STRING,
        allowNull: false
      },
      rootCauseId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        field: 'root_cause_id',
        references: {
          model: 'root_causes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      impact: {
        type: Sequelize.STRING,
        allowNull: false
      },
      effort: {
        type: Sequelize.STRING,
        allowNull: false
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

    await queryInterface.addIndex('ai_recommendations', ['root_cause_id']);
    await queryInterface.addIndex('ai_recommendations', ['priority']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ai_recommendations');
  }
};
