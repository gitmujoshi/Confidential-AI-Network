/**
 * Run Privacy Budget Migration
 * Simple script to execute the privacy budget tables migration
 */

const { Sequelize } = require('sequelize');
const path = require('path');

async function runMigration() {
  console.log('🔐 Running Privacy Budget Migration...');
  
  try {
    // Load environment variables
    require('dotenv').config({ path: path.join(__dirname, 'config.env') });
    
    // Create database connection
    const sequelize = new Sequelize(
      process.env.DB_NAME || 'contract_management',
      process.env.DB_USER || '***REMOVED-DB_PASSWORD***',
      process.env.DB_PASSWORD || 'password',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: '***REMOVED-DB_PASSWORD***',
        logging: false
      }
    );
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Load and run migration
    const migration = require('./migrations/add-privacy-budget-tables');
    
    console.log('📊 Executing migration...');
    await migration.up(sequelize.getQueryInterface(), Sequelize);
    
    console.log('✅ Privacy budget migration completed successfully');
    
    // Close connection
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
runMigration(); 