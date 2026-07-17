/**
 * Update Notification Enum Script
 * 
 * This script updates the notifications table enum to include USER_REGISTERED
 * which is needed for user registration notifications.
 */

const { Sequelize } = require('sequelize');
require('dotenv').config({ path: './config.env' });

async function updateNotificationEnum() {
  const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: 'postgres',
      logging: false
    }
  );

  try {
    console.log('🔄 Updating notification enum...');

    // Add USER_REGISTERED to the enum
    await sequelize.query(`
      ALTER TYPE enum_notifications_type ADD VALUE IF NOT EXISTS 'USER_REGISTERED';
    `);

    console.log('✅ Notification enum updated successfully!');
    console.log('✅ USER_REGISTERED is now a valid notification type');

  } catch (error) {
    console.error('❌ Error updating notification enum:', error.message);
    
    if (error.message.includes('already exists')) {
      console.log('ℹ️ USER_REGISTERED already exists in enum, no changes needed');
    } else {
      throw error;
    }
  } finally {
    await sequelize.close();
  }
}

// Run the script
updateNotificationEnum()
  .then(() => {
    console.log('🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }); 