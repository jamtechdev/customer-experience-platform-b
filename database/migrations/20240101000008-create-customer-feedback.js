'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('customer_feedback', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      source: {
        type: Sequelize.STRING,
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      author: {
        type: Sequelize.STRING,
        allowNull: true
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 5
        }
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      companyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'company_id',
        references: {
          model: 'companies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      competitorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        field: 'competitor_id',
        references: {
          model: 'competitors',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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

    await queryInterface.addIndex('customer_feedback', ['company_id']);
    await queryInterface.addIndex('customer_feedback', ['competitor_id']);
    await queryInterface.addIndex('customer_feedback', ['touchpoint_id']);
    await queryInterface.addIndex('customer_feedback', ['date']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('customer_feedback');
  }
};
