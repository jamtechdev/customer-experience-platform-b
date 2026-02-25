'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('journey_analysis', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      stageId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'stage_id',
        references: {
          model: 'journey_stages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      satisfactionScore: {
        type: Sequelize.FLOAT,
        allowNull: false,
        field: 'satisfaction_score',
        validate: {
          min: 0,
          max: 10
        }
      },
      feedbackCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'feedback_count'
      },
      date: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex('journey_analysis', ['stage_id']);
    await queryInterface.addIndex('journey_analysis', ['date']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('journey_analysis');
  }
};
