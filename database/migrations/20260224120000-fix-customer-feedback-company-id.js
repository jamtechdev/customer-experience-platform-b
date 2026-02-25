'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if company_id column exists
    const tableDescription = await queryInterface.describeTable('customer_feedback');
    
    if (!tableDescription.company_id) {
      // Add company_id column if it doesn't exist
      await queryInterface.addColumn('customer_feedback', 'company_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'companies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        after: 'date'
      });

      // Set default company_id for existing records (use company with id 1, or create one)
      const [companies] = await queryInterface.sequelize.query(
        "SELECT id FROM companies LIMIT 1"
      );
      
      if (companies.length > 0) {
        await queryInterface.sequelize.query(
          `UPDATE customer_feedback SET company_id = ${companies[0].id} WHERE company_id IS NULL`
        );
      } else {
        // Create a default company if none exists
        await queryInterface.bulkInsert('companies', [{
          id: 1,
          name: 'Default Company',
          industry: 'Banking',
          country: 'Turkey',
          created_at: new Date(),
          updated_at: new Date()
        }]);
        
        await queryInterface.sequelize.query(
          "UPDATE customer_feedback SET company_id = 1 WHERE company_id IS NULL"
        );
      }

      // Add index
      await queryInterface.addIndex('customer_feedback', ['company_id']);
    }

    // Ensure competitor_id exists
    if (!tableDescription.competitor_id) {
      await queryInterface.addColumn('customer_feedback', 'competitor_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'competitors',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        after: 'company_id'
      });
    }

    // Ensure touchpoint_id exists
    if (!tableDescription.touchpoint_id) {
      await queryInterface.addColumn('customer_feedback', 'touchpoint_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'touchpoints',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        after: 'competitor_id'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove columns if they exist
    const tableDescription = await queryInterface.describeTable('customer_feedback');
    
    if (tableDescription.touchpoint_id) {
      await queryInterface.removeIndex('customer_feedback', ['touchpoint_id']);
      await queryInterface.removeColumn('customer_feedback', 'touchpoint_id');
    }
    
    if (tableDescription.competitor_id) {
      await queryInterface.removeIndex('customer_feedback', ['competitor_id']);
      await queryInterface.removeColumn('customer_feedback', 'competitor_id');
    }
    
    if (tableDescription.company_id) {
      await queryInterface.removeIndex('customer_feedback', ['company_id']);
      await queryInterface.removeColumn('customer_feedback', 'company_id');
    }
  }
};
