'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sentiment_analysis', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      feedbackId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        field: 'feedback_id',
        references: {
          model: 'customer_feedback',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      sentiment: {
        type: Sequelize.ENUM('positive', 'negative', 'neutral'),
        allowNull: false
      },
      score: {
        type: Sequelize.FLOAT,
        allowNull: false,
        validate: {
          min: -1,
          max: 1
        }
      },
      keyPhrases: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
        field: 'key_phrases'
      },
      emotions: {
        type: Sequelize.JSON,
        allowNull: true
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

    await queryInterface.addIndex('sentiment_analysis', ['feedback_id']);
    await queryInterface.addIndex('sentiment_analysis', ['sentiment']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('sentiment_analysis');
  }
};
