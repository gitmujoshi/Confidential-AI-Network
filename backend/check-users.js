/**
 * Check Users Script
 * 
 * This script lists all users in the database to help identify conflicts
 */

const db = require('./models');

async function checkUsers() {
  try {
    console.log('🔍 Checking existing users in database...\n');
    
    const users = await db.User.findAll({
      attributes: ['id', 'name', 'email', 'partyType', 'isRegistered', 'emailVerified', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    if (users.length === 0) {
      console.log('📭 No users found in database');
      return;
    }

    console.log(`📊 Found ${users.length} user(s) in database:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. User ID: ${user.id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Party Type: ${user.partyType}`);
      console.log(`   Registered: ${user.isRegistered}`);
      console.log(`   Email Verified: ${user.emailVerified}`);
      console.log(`   Created: ${user.createdAt.toISOString()}`);
      console.log('');
    });

    // Check for duplicate emails
    const emailCounts = {};
    users.forEach(user => {
      emailCounts[user.email] = (emailCounts[user.email] || 0) + 1;
    });

    const duplicates = Object.entries(emailCounts).filter(([email, count]) => count > 1);
    
    if (duplicates.length > 0) {
      console.log('⚠️  Duplicate emails found:');
      duplicates.forEach(([email, count]) => {
        console.log(`   ${email}: ${count} occurrences`);
      });
    } else {
      console.log('✅ No duplicate emails found');
    }

  } catch (error) {
    console.error('❌ Error checking users:', error.message);
  } finally {
    await db.sequelize.close();
  }
}

// Run the check
checkUsers(); 