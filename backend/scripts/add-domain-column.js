#!/usr/bin/env node

/**
 * Add domain column to datasets table
 * 
 * This script adds a domain column to the datasets table to support
 * domain-based filtering of datasets by industry/domain category.
 */

const db = require('../models');

async function addDomainColumn() {
  try {
    console.log('🔄 Adding domain column to datasets table...');

    // Get the sequelize instance
    const sequelize = db.sequelize;

    // Add domain column to datasets table
    await sequelize.query(`
      ALTER TABLE datasets 
      ADD COLUMN IF NOT EXISTS domain VARCHAR(255) NULL;
    `);

    console.log('✅ Domain column added to datasets table');

    // Update existing datasets with default domain if they don't have one
    await sequelize.query(`
      UPDATE datasets 
      SET domain = 'Other' 
      WHERE domain IS NULL AND is_active = true;
    `);

    console.log('✅ Updated existing datasets with default domain');

    console.log('🎉 Domain column addition completed successfully!');

  } catch (error) {
    console.error('❌ Failed to add domain column:', error);
    throw error;
  }
}

// Run the script if called directly
if (require.main === module) {
  addDomainColumn()
    .then(() => {
      console.log('🎉 Domain column addition completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Domain column addition failed:', error);
      process.exit(1);
    });
}

module.exports = { addDomainColumn };
