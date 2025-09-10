'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add contractDatasets JSON field to contracts table
    await queryInterface.addColumn('contracts', 'contract_datasets', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'JSON array storing dataset information for multi-dataset contracts'
    });
    
    console.log('✅ Added contract_datasets column to contracts table');
  },

  down: async (queryInterface, Sequelize) => {
    // Remove contractDatasets field
    await queryInterface.removeColumn('contracts', 'contract_datasets');
    
    console.log('⚠️ Removed contract_datasets column from contracts table');
  }
};
