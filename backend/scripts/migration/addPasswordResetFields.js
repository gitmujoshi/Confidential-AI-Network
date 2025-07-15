/**
 * Add Password Reset Fields Migration
 * 
 * This script adds password reset functionality fields to the users table
 */

const db = require('../models');

async function addPasswordResetFields() {
  try {
    console.log('🔧 Adding password reset fields to users table...\n');

    // Check if columns already exist
    const tableInfo = await db.sequelize.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('passwordResetToken', 'passwordResetExpires')",
      { type: db.sequelize.QueryTypes.SELECT }
    );

    const existingColumns = tableInfo.map(row => row.column_name);
    console.log('Existing password reset columns:', existingColumns);

    // Add passwordResetToken column if it doesn't exist
    if (!existingColumns.includes('passwordResetToken')) {
      console.log('1️⃣ Adding passwordResetToken column...');
      await db.sequelize.query(
        'ALTER TABLE users ADD COLUMN "passwordResetToken" VARCHAR(255)',
        { type: db.sequelize.QueryTypes.RAW }
      );
      console.log('✅ passwordResetToken column added');
    } else {
      console.log('✅ passwordResetToken column already exists');
    }

    // Add passwordResetExpires column if it doesn't exist
    if (!existingColumns.includes('passwordResetExpires')) {
      console.log('2️⃣ Adding passwordResetExpires column...');
      await db.sequelize.query(
        'ALTER TABLE users ADD COLUMN "passwordResetExpires" TIMESTAMP',
        { type: db.sequelize.QueryTypes.RAW }
      );
      console.log('✅ passwordResetExpires column added');
    } else {
      console.log('✅ passwordResetExpires column already exists');
    }

    // Verify the columns were added
    const verifyTableInfo = await db.sequelize.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('passwordResetToken', 'passwordResetExpires')",
      { type: db.sequelize.QueryTypes.SELECT }
    );

    console.log('\n📋 Password reset fields verification:');
    verifyTableInfo.forEach(column => {
      console.log(`   ${column.column_name}: ${column.data_type}`);
    });

    console.log('\n🎉 Password reset fields migration completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   - passwordResetToken: VARCHAR(255) - for storing reset tokens');
    console.log('   - passwordResetExpires: TIMESTAMP - for token expiry tracking');
    console.log('   - Both fields are nullable for users who haven\'t requested password resets');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('   Error details:', error);
  } finally {
    // Close database connection
    await db.sequelize.close();
  }
}

// Run the migration
addPasswordResetFields(); 