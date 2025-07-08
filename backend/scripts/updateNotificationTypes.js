/**
 * Update Notification Types Migration
 * 
 * This script adds password reset notification types to the notifications table enum
 */

const db = require('../models');

async function updateNotificationTypes() {
  try {
    console.log('🔧 Updating notification types enum...\n');

    // Add new notification types to the enum
    const newTypes = [
      'PASSWORD_RESET_REQUESTED',
      'PASSWORD_RESET_COMPLETED'
    ];

    console.log('1️⃣ Adding new notification types to enum...');
    
    for (const type of newTypes) {
      try {
        await db.sequelize.query(
          `ALTER TYPE enum_notifications_type ADD VALUE '${type}'`,
          { type: db.sequelize.QueryTypes.RAW }
        );
        console.log(`   ✅ Added: ${type}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`   ⚠️  Already exists: ${type}`);
        } else {
          console.error(`   ❌ Failed to add ${type}:`, error.message);
        }
      }
    }

    // Verify the enum values
    console.log('\n2️⃣ Verifying enum values...');
    const enumValues = await db.sequelize.query(
      "SELECT unnest(enum_range(NULL::enum_notifications_type)) as enum_value",
      { type: db.sequelize.QueryTypes.SELECT }
    );

    console.log('📋 Current notification types:');
    enumValues.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.enum_value}`);
    });

    console.log('\n🎉 Notification types migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('   Error details:', error);
  } finally {
    // Close database connection
    await db.sequelize.close();
  }
}

// Run the migration
updateNotificationTypes(); 