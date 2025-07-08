/**
 * List All Users in Database
 * 
 * This script lists all users in the database to see what users exist.
 */

const { Sequelize } = require('sequelize');
require('dotenv').config({ path: '../config.env' });

class UserLister {
  constructor() {
    this.sequelize = new Sequelize(
      process.env.DB_NAME || 'contract_management',
      process.env.DB_USER || 'mukeshjoshi',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: '***REMOVED-DB_PASSWORD***',
        logging: false
      }
    );
  }

  async listAllUsers() {
    try {
      console.log('🔍 Listing all users in database');
      console.log('=' * 50);

      // Test database connection
      await this.sequelize.authenticate();
      console.log('✅ Database connection successful');

      // Query all users
      const [results] = await this.sequelize.query(`
        SELECT 
          id,
          email,
          name,
          did,
          "didSource",
          "didVerified",
          "partyType",
          "isRegistered",
          "registrationDate",
          "isActive"
        FROM users 
        ORDER BY "registrationDate" DESC
      `, {
        type: Sequelize.QueryTypes.SELECT
      });

      if (results && results.length > 0) {
        console.log(`📊 Found ${results.length} user(s) in database:`);
        console.log('');
        
        results.forEach((user, index) => {
          console.log(`${index + 1}. User ID: ${user.id}`);
          console.log(`   Email: ${user.email}`);
          console.log(`   Name: ${user.name}`);
          console.log(`   Party Type: ${user.partyType}`);
          console.log(`   DID: ${user.did || 'NOT ASSIGNED'}`);
          console.log(`   DID Source: ${user.didSource || 'NOT SET'}`);
          console.log(`   DID Verified: ${user.didVerified}`);
          console.log(`   Is Registered: ${user.isRegistered}`);
          console.log(`   Is Active: ${user.isActive}`);
          console.log(`   Registration Date: ${user.registrationDate}`);
          console.log('');
        });

        // Summary
        const usersWithDID = results.filter(u => u.did);
        const activeUsers = results.filter(u => u.isActive);
        const registeredUsers = results.filter(u => u.isRegistered);

        console.log('📈 Summary:');
        console.log(`   Total users: ${results.length}`);
        console.log(`   Users with DID: ${usersWithDID.length}`);
        console.log(`   Active users: ${activeUsers.length}`);
        console.log(`   Registered users: ${registeredUsers.length}`);

      } else {
        console.log('❌ No users found in database');
        console.log('   This could mean:');
        console.log('   1. Database is empty');
        console.log('   2. User registration has never been successful');
        console.log('   3. Database connection issue');
      }

    } catch (error) {
      console.error('❌ Error listing users:', error.message);
      if (error.code === 'ECONNREFUSED') {
        console.log('   Database connection failed. Please check:');
        console.log('   1. PostgreSQL is running');
        console.log('   2. Database credentials in config.env');
        console.log('   3. Database exists');
      }
    } finally {
      await this.sequelize.close();
    }
  }
}

// Run the list if this script is executed directly
if (require.main === module) {
  const lister = new UserLister();
  
  lister.listAllUsers()
    .then(() => {
      console.log('\n✅ User listing completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ User listing failed:', error.message);
      process.exit(1);
    });
}

module.exports = UserLister; 