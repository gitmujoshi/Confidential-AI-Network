'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔄 Adding domain field to datasets table...');

    // Add domain column to datasets table
    await queryInterface.addColumn('datasets', 'domain', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Domain or industry category (e.g., Healthcare, Finance, Retail)'
    });

    console.log('✅ Domain column added to datasets table');

    // Update existing datasets with default domain if they don't have one
    await queryInterface.sequelize.query(`
      UPDATE datasets 
      SET domain = 'Other' 
      WHERE domain IS NULL AND is_active = true;
    `);

    console.log('✅ Updated existing datasets with default domain');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔄 Removing domain field from datasets table...');

    // Remove domain column from datasets table
    await queryInterface.removeColumn('datasets', 'domain');

    console.log('✅ Domain column removed from datasets table');
  }
};
