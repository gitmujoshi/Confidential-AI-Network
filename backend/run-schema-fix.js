#!/usr/bin/env node

/**
 * Schema Fix Runner
 * 
 * This script runs the comprehensive schema fix migration to add all
 * missing columns and indexes for the new features.
 */

const { Sequelize } = require('sequelize');
const migration = require('./migrations/fix-new-features-schema');

// Load configuration
require('dotenv').config({ path: '../config.env' });
try {
  require('dotenv').config({ path: '../secrets.env' });
} catch (error) {
  console.log('⚠️ Secrets file not found, using config.env only');
}

// Create database connection
const sequelize = new Sequelize(
  process.env.DATABASE_URL || `***REMOVED-DB_PASSWORD***ql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  {
    logging: console.log,
    dialect: '***REMOVED-DB_PASSWORD***'
  }
);

async function runMigration() {
  try {
    console.log('🚀 Starting comprehensive schema fix...');
    console.log('📊 Database:', process.env.DB_NAME);
    console.log('🏠 Host:', process.env.DB_HOST);
    console.log('🔌 Port:', process.env.DB_PORT);
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    // Get query interface
    const queryInterface = sequelize.getQueryInterface();
    
    // Run the migration
    console.log('🔧 Running schema fix migration...');
    await migration.up(queryInterface);
    
    console.log('🎉 Schema fix completed successfully!');
    console.log('✅ All missing columns and indexes have been added');
    console.log('🚀 Backend should now start without schema errors');
    
  } catch (error) {
    console.error('❌ Schema fix failed:', error.message);
    console.error('📋 Error details:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the migration
runMigration();
