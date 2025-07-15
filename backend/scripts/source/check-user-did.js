/**
 * Check User DID in Database
 * 
 * This script queries the database to check if a user's DID is properly stored.
 */

const { Sequelize } = require('sequelize');
require('dotenv').config({ path: '../config.env' });

class UserDIDChecker {
  constructor() {
    this.sequelize = new Sequelize(
      process.env.DB_NAME || 'contract_management',
      process.env.DB_USER || 'mukeshjoshi',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false
      }
    );
  }

  async checkUserDID(email) {
    try {
      console.log(`🔍 Checking DID for user: ${email}`);
      console.log('=' * 50);

      // Test database connection
      await this.sequelize.authenticate();
      console.log('✅ Database connection successful');

      // Query the user
      const [results] = await this.sequelize.query(`
        SELECT 
          id,
          email,
          name,
          did,
          "didSource",
          "didVerified",
          "didVerificationMethod",
          "partyType",
          "isRegistered",
          "registrationDate"
        FROM users 
        WHERE email = :email
      `, {
        replacements: { email: email.toLowerCase() },
        type: Sequelize.QueryTypes.SELECT
      });

      if (results && results.length > 0) {
        const user = results[0];
        console.log('✅ User found in database:');
        console.log(`   ID: ${user.id}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Party Type: ${user.partyType}`);
        console.log(`   DID: ${user.did || 'NOT ASSIGNED'}`);
        console.log(`   DID Source: ${user.didSource || 'NOT SET'}`);
        console.log(`   DID Verified: ${user.didVerified}`);
        console.log(`   DID Verification Method: ${user.didVerificationMethod || 'NOT SET'}`);
        console.log(`   Is Registered: ${user.isRegistered}`);
        console.log(`   Registration Date: ${user.registrationDate}`);

        if (!user.did) {
          console.log('\n❌ ISSUE FOUND: DID is not assigned in database');
          console.log('   This means the DID was not saved during registration.');
          console.log('   Possible causes:');
          console.log('   1. DID was not provided during registration');
          console.log('   2. Backend registration logic has a bug');
          console.log('   3. Database transaction failed');
        } else {
          console.log('\n✅ DID is properly stored in database');
          console.log(`   DID: ${user.did}`);
          console.log(`   Source: ${user.didSource}`);
          console.log(`   Verified: ${user.didVerified}`);
        }
      } else {
        console.log('❌ User not found in database');
        console.log('   This could mean:');
        console.log('   1. User was not registered successfully');
        console.log('   2. Email address is different');
        console.log('   3. Database connection issue');
      }

      // Check all users with DIDs for comparison
      console.log('\n📊 All users with DIDs:');
      const [allUsersWithDID] = await this.sequelize.query(`
        SELECT 
          id,
          email,
          name,
          did,
          "didSource",
          "didVerified"
        FROM users 
        WHERE did IS NOT NULL AND did != ''
        ORDER BY "registrationDate" DESC
      `, {
        type: Sequelize.QueryTypes.SELECT
      });

      if (allUsersWithDID && allUsersWithDID.length > 0) {
        allUsersWithDID.forEach(user => {
          console.log(`   ${user.email}: ${user.did} (${user.didSource})`);
        });
      } else {
        console.log('   No users with DIDs found');
      }

    } catch (error) {
      console.error('❌ Error checking user DID:', error.message);
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

// Run the check if this script is executed directly
if (require.main === module) {
  const email = process.argv[2] || 'joshi.mukesh078@gmail.com';
  const checker = new UserDIDChecker();
  
  checker.checkUserDID(email)
    .then(() => {
      console.log('\n✅ DID check completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ DID check failed:', error.message);
      process.exit(1);
    });
}

module.exports = UserDIDChecker; 