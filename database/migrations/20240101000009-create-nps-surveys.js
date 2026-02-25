'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('nps_surveys', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      score: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
          max: 10
        }
      },
      comment: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      customerId: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'customer_id'
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

    await queryInterface.addIndex('nps_surveys', ['company_id']);
    await queryInterface.addIndex('nps_surveys', ['date']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('nps_surveys');
  }
};
