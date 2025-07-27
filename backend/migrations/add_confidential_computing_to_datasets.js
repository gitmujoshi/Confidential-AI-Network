'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('datasets', 'confidentialComputingRequired', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Indicates if this dataset requires confidential computing for processing'
    });

    // Add index for better query performance
    await queryInterface.addIndex('datasets', ['confidentialComputingRequired'], {
      name: 'idx_datasets_confidential_computing'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove index first
    await queryInterface.removeIndex('datasets', 'idx_datasets_confidential_computing');
    
    // Remove column
    await queryInterface.removeColumn('datasets', 'confidentialComputingRequired');
  }
}; 