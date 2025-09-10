#!/usr/bin/env node

/**
 * Run Constraint Tables Migration
 * 
 * This script runs the constraint tables migration using the existing database connection.
 */

const db = require('../models');
const migration = require('../migrations/create-constraint-tables');

async function runMigration() {
  try {
    console.log('🔄 Running constraint tables migration...');
    
    // Run the migration
    await migration.up(db.sequelize.getQueryInterface(), db.Sequelize);
    
    console.log('✅ Constraint tables migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration if this script is called directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('🎉 Migration completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };
