/**
 * Migration: Add templateId to contracts table
 * 
 * This migration adds a templateId field to the contracts table to link
 * contracts with the contract templates they were created from.
 */

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔧 Adding templateId field to contracts table...');
    
    await queryInterface.addColumn('contracts', 'templateId', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Reference to the contract template used for this contract'
    });

    console.log('✅ templateId field added successfully');
  },

  async down(queryInterface, Sequelize) {
    console.log('🗑️ Removing templateId field from contracts table...');
    
    await queryInterface.removeColumn('contracts', 'templateId');
    
    console.log('✅ templateId field removed successfully');
  }
}; 