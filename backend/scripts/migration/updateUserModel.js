/**
 * Migration Script: Update User Model
 * 
 * This script updates the User model to allow null values for walletAddress and publicKey
 * to support enterprise users who don't need blockchain wallets.
 * 
 * Usage:
 * node scripts/updateUserModel.js
 */

const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Database configuration
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'contract_management',
  username: process.env.DB_USER || 'mukeshjoshi',
  password: process.env.DB_PASSWORD || '',
  logging: false
});

async function updateUserModel() {
  try {
    console.log('🔄 Starting User model migration...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Update walletAddress column to allow null
    console.log('📝 Updating walletAddress column...');
    await sequelize.query(`
      ALTER TABLE users 
      ALTER COLUMN "walletAddress" DROP NOT NULL;
    `);
    console.log('✅ walletAddress column updated');
    
    // Update publicKey column to allow null
    console.log('📝 Updating publicKey column...');
    await sequelize.query(`
      ALTER TABLE users 
      ALTER COLUMN "publicKey" DROP NOT NULL;
    `);
    console.log('✅ publicKey column updated');
    
    // Drop existing unique constraints that might conflict
    console.log('🔧 Dropping existing unique constraints...');
    try {
      await sequelize.query(`
        ALTER TABLE users 
        DROP CONSTRAINT IF EXISTS "users_walletAddress_key";
      `);
      console.log('✅ Dropped walletAddress unique constraint');
    } catch (error) {
      console.log('ℹ️ No walletAddress unique constraint to drop');
    }
    
    try {
      await sequelize.query(`
        ALTER TABLE users 
        DROP CONSTRAINT IF EXISTS "users_publicKey_key";
      `);
      console.log('✅ Dropped publicKey unique constraint');
    } catch (error) {
      console.log('ℹ️ No publicKey unique constraint to drop');
    }
    
    // Create new partial unique indexes
    console.log('🔧 Creating partial unique indexes...');
    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "users_walletAddress_unique" 
      ON users ("walletAddress") 
      WHERE "walletAddress" IS NOT NULL;
    `);
    console.log('✅ Created walletAddress partial unique index');
    
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS "users_publicKey_index" 
      ON users ("publicKey") 
      WHERE "publicKey" IS NOT NULL;
    `);
    console.log('✅ Created publicKey partial index');
    
    console.log('✅ User model migration completed successfully!');
    console.log('');
    console.log('📋 Changes made:');
    console.log('- walletAddress: Now allows NULL values');
    console.log('- publicKey: Now allows NULL values');
    console.log('- Added partial unique index for walletAddress (non-null values only)');
    console.log('- Added partial index for publicKey (non-null values only)');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run migration
updateUserModel(); 