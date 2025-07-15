/**
 * Migration Script: Add Email Verification Token Fields
 * 
 * This script adds email verification token fields to the User model
 * for fallback email verification when Keycloak is not available.
 */

const db = require('../models');

async function addEmailVerificationFields() {
  try {
    console.log('🔄 Adding email verification token fields to User model...');
    
    // Add emailVerificationToken column
    await db.sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS "emailVerificationToken" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "emailVerificationExpires" TIMESTAMP
    `);
    
    console.log('✅ Email verification token fields added successfully');
    
    // Verify the columns were added
    const [results] = await db.sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('emailVerificationToken', 'emailVerificationExpires')
    `);
    
    console.log('📋 Verification - Added columns:');
    results.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });
    
  } catch (error) {
    console.error('❌ Error adding email verification fields:', error.message);
    throw error;
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  addEmailVerificationFields()
    .then(() => {
      console.log('🎉 Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = addEmailVerificationFields; 