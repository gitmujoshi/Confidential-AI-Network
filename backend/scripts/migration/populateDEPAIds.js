/**
 * Migration Script: Populate DEPA IDs for Existing Records
 * 
 * This script generates DEPA IDs for existing users and contracts that don't have them yet.
 * 
 * DEPA ID Format: [ENTITY_TYPE]-[GUID]
 * Examples: 
 * - TDC-8f4e2a1b-3c4d-5e6f-7a8b-9c0d1e2f3a4b
 * - TDP-1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d
 * - CCRP-2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e
 * - CONTRACT-3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f
 * 
 * Run this script after addDEPAIdFields.js to populate existing records.
 * 
 * ⚠️ WARNING: Always backup your database before running migrations!
 */

const { Sequelize } = require('sequelize');
require('dotenv').config({ path: './config.env' });

// Import DEPA ID service
const DEPAIdService = require('../../services/depaIdService');

// Use the same database configuration as the main application
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: '***REMOVED-DB_PASSWORD***',
    logging: false
  }
);

async function populateDEPAIds() {
  try {
    console.log('🔄 Starting DEPA ID population for existing records...');
    console.log('📊 Database config:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER
    });

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');

    // Initialize DEPA ID service
    const depaIdService = new DEPAIdService();

    // Check if depaId columns exist
    const usersTableDescription = await sequelize.getQueryInterface().describeTable('users');
    const contractsTableDescription = await sequelize.getQueryInterface().describeTable('contracts');

    if (!usersTableDescription.depaId) {
      console.log('❌ depaId column does not exist in users table. Run addDEPAIdFields.js first.');
      return;
    }

    if (!contractsTableDescription.depaId) {
      console.log('❌ depaId column does not exist in contracts table. Run addDEPAIdFields.js first.');
      return;
    }

    console.log('✅ DEPA ID columns exist in both tables');

    // Populate DEPA IDs for users
    console.log('\n📝 Populating DEPA IDs for users...');
    const usersWithoutDEPAId = await sequelize.query(`
      SELECT id, name, email, "partyType", "depaId"
      FROM users 
      WHERE "depaId" IS NULL
      ORDER BY id
    `, {
      type: Sequelize.QueryTypes.SELECT
    });

    console.log(`Found ${usersWithoutDEPAId.length} users without DEPA IDs`);

    let usersUpdated = 0;
    let usersErrors = 0;

    for (const user of usersWithoutDEPAId) {
      try {
        // Generate DEPA ID based on party type
        const depaId = depaIdService.generateUserDEPAId(user.partyType);
        
        // Update user with DEPA ID
        await sequelize.query(`
          UPDATE users 
          SET "depaId" = :depaId, "updatedAt" = NOW()
          WHERE id = :userId
        `, {
          replacements: { depaId, userId: user.id },
          type: Sequelize.QueryTypes.UPDATE
        });

        console.log(`✅ Updated user ${user.name} (${user.email}) with DEPA ID: ${depaId}`);
        usersUpdated++;
      } catch (error) {
        console.error(`❌ Failed to update user ${user.name} (${user.email}):`, error.message);
        usersErrors++;
      }
    }

    // Populate DEPA IDs for contracts
    console.log('\n📝 Populating DEPA IDs for contracts...');
    const contractsWithoutDEPAId = await sequelize.query(`
      SELECT id, "contractId", "depaId"
      FROM contracts 
      WHERE "depaId" IS NULL
      ORDER BY id
    `, {
      type: Sequelize.QueryTypes.SELECT
    });

    console.log(`Found ${contractsWithoutDEPAId.length} contracts without DEPA IDs`);

    let contractsUpdated = 0;
    let contractsErrors = 0;

    for (const contract of contractsWithoutDEPAId) {
      try {
        // Generate DEPA ID for contract
        const depaId = depaIdService.generateContractDEPAId();
        
        // Update contract with DEPA ID
        await sequelize.query(`
          UPDATE contracts 
          SET "depaId" = :depaId, "updatedAt" = NOW()
          WHERE id = :contractId
        `, {
          replacements: { depaId, contractId: contract.id },
          type: Sequelize.QueryTypes.UPDATE
        });

        console.log(`✅ Updated contract ${contract.contractId} with DEPA ID: ${depaId}`);
        contractsUpdated++;
      } catch (error) {
        console.error(`❌ Failed to update contract ${contract.contractId}:`, error.message);
        contractsErrors++;
      }
    }

    // Verify population
    console.log('\n🔍 Verifying DEPA ID population...');
    
    const totalUsers = await sequelize.query('SELECT COUNT(*) as count FROM users', {
      type: Sequelize.QueryTypes.SELECT
    });
    
    const usersWithDEPAId = await sequelize.query('SELECT COUNT(*) as count FROM users WHERE "depaId" IS NOT NULL', {
      type: Sequelize.QueryTypes.SELECT
    });

    const totalContracts = await sequelize.query('SELECT COUNT(*) as count FROM contracts', {
      type: Sequelize.QueryTypes.SELECT
    });

    const contractsWithDEPAId = await sequelize.query('SELECT COUNT(*) as count FROM contracts WHERE "depaId" IS NOT NULL', {
      type: Sequelize.QueryTypes.SELECT
    });

    // Show summary by party type
    const usersByPartyType = await sequelize.query(`
      SELECT "partyType", COUNT(*) as count, COUNT("depaId") as with_depa_id
      FROM users 
      GROUP BY "partyType"
      ORDER BY "partyType"
    `, {
      type: Sequelize.QueryTypes.SELECT
    });

    console.log('\n📊 Population Summary:');
    console.log(`Users:`);
    console.log(`  Total: ${totalUsers[0].count}`);
    console.log(`  With DEPA ID: ${usersWithDEPAId[0].count}`);
    console.log(`  Updated in this run: ${usersUpdated}`);
    console.log(`  Errors: ${usersErrors}`);
    
    console.log(`\nContracts:`);
    console.log(`  Total: ${totalContracts[0].count}`);
    console.log(`  With DEPA ID: ${contractsWithDEPAId[0].count}`);
    console.log(`  Updated in this run: ${contractsUpdated}`);
    console.log(`  Errors: ${contractsErrors}`);

    console.log(`\nUsers by Party Type:`);
    usersByPartyType.forEach(row => {
      console.log(`  ${row.partyType}: ${row.count} total, ${row.with_depa_id} with DEPA ID`);
    });

    // Test DEPA ID validation
    console.log('\n🧪 Testing DEPA ID validation...');
    const testResults = depaIdService.testGeneration();
    let validationErrors = 0;
    
    for (const [entityType, result] of Object.entries(testResults)) {
      if (result.success) {
        console.log(`✅ ${entityType}: ${result.generated} - Valid`);
      } else {
        console.log(`❌ ${entityType}: ${result.error || 'Invalid'} - Failed`);
        validationErrors++;
      }
    }

    if (validationErrors === 0) {
      console.log('✅ All DEPA ID validation tests passed');
    } else {
      console.log(`❌ ${validationErrors} DEPA ID validation tests failed`);
    }

    console.log('\n🎉 DEPA ID population completed successfully!');
    
    if (usersWithDEPAId[0].count === totalUsers[0].count && 
        contractsWithDEPAId[0].count === totalContracts[0].count) {
      console.log('✅ All records now have DEPA IDs');
      console.log('\n💡 Next steps:');
      console.log('1. Set NOT NULL constraints on depaId columns');
      console.log('2. Update application models to include DEPA ID fields');
      console.log('3. Update services to auto-generate DEPA IDs for new records');
    } else {
      console.log('⚠️  Some records still missing DEPA IDs');
      console.log('   Check the errors above and re-run if needed');
    }

  } catch (error) {
    console.error('❌ Population failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the population if this script is executed directly
if (require.main === module) {
  populateDEPAIds()
    .then(() => {
      console.log('✅ Population completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Population failed:', error);
      process.exit(1);
    });
}

module.exports = { populateDEPAIds }; 