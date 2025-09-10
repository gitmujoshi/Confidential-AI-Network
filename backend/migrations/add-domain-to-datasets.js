#!/usr/bin/env node

/**
 * Migration: Add domain field to datasets table
 * 
 * This migration adds a domain column to the datasets table to support
 * domain-based filtering of datasets by industry/domain category.
 */

const { Sequelize } = require('sequelize');

// Load configuration
const config = require('../config/database');

async function addDomainToDatasets() {
  console.log('🔄 Starting migration: Add domain field to datasets table...');

  const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: false
  });

  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');

    // Add domain column to datasets table
    await sequelize.query(`
      ALTER TABLE datasets 
      ADD COLUMN IF NOT EXISTS domain VARCHAR(255) NULL 
      COMMENT 'Domain or industry category (e.g., Healthcare, Finance, Retail)';
    `);

    console.log('✅ Domain column added to datasets table');

    // Update existing datasets with default domain if they don't have one
    await sequelize.query(`
      UPDATE datasets 
      SET domain = 'Other' 
      WHERE domain IS NULL AND is_active = true;
    `);

    console.log('✅ Updated existing datasets with default domain');

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run migration if this script is called directly
if (require.main === module) {
  addDomainToDatasets()
    .then(() => {
      console.log('🎉 Domain field migration completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Domain field migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addDomainToDatasets };
