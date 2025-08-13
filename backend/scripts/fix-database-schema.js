/**
 * Fix Database Schema Script
 * 
 * This script ensures all database tables are in sync with their Sequelize models.
 * It fixes column mismatches, adds missing columns, and ensures proper data types.
 */

const { Sequelize } = require('sequelize');
const db = require('../models');

async function fixDatabaseSchema() {
  console.log('🔧 Starting database schema synchronization...\n');

  try {
    // Step 1: Fix notifications table
    console.log('📋 Step 1: Fixing notifications table...');
    await fixNotificationsTable();
    
    // Step 2: Verify users table
    console.log('👥 Step 2: Verifying users table...');
    await verifyUsersTable();
    
    // Step 3: Check other tables
    console.log('📊 Step 3: Checking other tables...');
    await checkOtherTables();
    
    console.log('\n🎉 Database schema synchronization completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during schema synchronization:', error);
    throw error;
  }
}

async function fixNotificationsTable() {
  const sequelize = db.sequelize;
  
  // Add missing metadata column
  try {
    await sequelize.query(`
      ALTER TABLE notifications 
      ADD COLUMN IF NOT EXISTS metadata JSONB
    `);
    console.log('  ✅ Added metadata column to notifications');
  } catch (error) {
    console.log('  ⚠️ metadata column already exists or error:', error.message);
  }
  
  // Fix type column to match ENUM values
  try {
    await sequelize.query(`
      ALTER TABLE notifications 
      ALTER COLUMN type TYPE VARCHAR(50)
    `);
    console.log('  ✅ Fixed type column in notifications');
  } catch (error) {
    console.log('  ⚠️ type column fix error:', error.message);
  }
  
  // Add missing indexes
  try {
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications("isRead");
      CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
    `);
    console.log('  ✅ Added missing indexes to notifications');
  } catch (error) {
    console.log('  ⚠️ Index creation error:', error.message);
  }
}

async function verifyUsersTable() {
  const sequelize = db.sequelize;
  
  // Check if all required columns exist
  const requiredColumns = [
    'public_key', 'iam_username', 'did', 'last_login_at', 'description',
    'registration_date', 'iam_user_id', 'did_source', 'did_verified',
    'onboarding_status', 'profile_completed', 'password_reset_token',
    'password_reset_expires', 'cloud_providers', 'did_verification_method',
    'email_verification_token', 'email_verification_expires', 'phone_number',
    'website', 'location'
  ];
  
  for (const column of requiredColumns) {
    try {
      const result = await sequelize.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = $1
      `, { bind: [column] });
      
      if (result[0].length === 0) {
        console.log(`  ❌ Missing column: ${column}`);
      } else {
        console.log(`  ✅ Column exists: ${column}`);
      }
    } catch (error) {
      console.log(`  ⚠️ Error checking column ${column}:`, error.message);
    }
  }
  
  // Add missing indexes
  try {
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_users_party_type ON users(party_type);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_depa_id ON users(depa_id);
    `);
    console.log('  ✅ Added missing indexes to users');
  } catch (error) {
    console.log('  ⚠️ Index creation error:', error.message);
  }
}

async function checkOtherTables() {
  const sequelize = db.sequelize;
  
  // Check datasets table
  try {
    const result = await sequelize.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name = 'datasets'
    `);
    
    if (result[0].length > 0) {
      console.log('  ✅ datasets table exists');
    } else {
      console.log('  ❌ datasets table missing');
    }
  } catch (error) {
    console.log('  ⚠️ Error checking datasets table:', error.message);
  }
  
  // Check contracts table
  try {
    const result = await sequelize.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name = 'contracts'
    `);
    
    if (result[0].length > 0) {
      console.log('  ✅ contracts table exists');
    } else {
      console.log('  ❌ contracts table missing');
    }
  } catch (error) {
    console.log('  ⚠️ Error checking contracts table:', error.message);
  }
  
  // Check ai_models table
  try {
    const result = await sequelize.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name = 'ai_models'
    `);
    
    if (result[0].length > 0) {
      console.log('  ✅ ai_models table exists');
    } else {
      console.log('  ❌ ai_models table missing');
    }
  } catch (error) {
    console.log('  ⚠️ Error checking ai_models table:', error.message);
  }
}

// Run the fix if this script is executed directly
if (require.main === module) {
  fixDatabaseSchema()
    .then(() => {
      console.log('\n✅ Database schema fix completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Database schema fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixDatabaseSchema };
