/**
 * Migration Script: Add DEPA ID Fields to Users and Contracts Tables
 * 
 * This script adds the following fields:
 * - depaId: VARCHAR(255) UNIQUE for users table
 * - depaId: VARCHAR(255) UNIQUE for contracts table
 * 
 * DEPA ID Format: [ENTITY_TYPE]-[GUID]
 * Examples: TDC-8f4e2a1b-3c4d-5e6f-7a8b-9c0d1e2f3a4b
 * 
 * Run this script to update the database schema for DEPA ID support.
 * 
 * ⚠️ WARNING: Always backup your database before running migrations!
 */

const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config({ path: './config.env' });

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

async function addDEPAIdFields() {
  try {
    console.log('🔄 Starting DEPA ID fields migration...');
    console.log('📊 Database config:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER
    });

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');

    // Check if the users table exists
    const tables = await sequelize.getQueryInterface().showAllTables();
    if (!tables.includes('users')) {
      console.log('❌ Users table does not exist. Please run the initial setup first.');
      return;
    }

    if (!tables.includes('contracts')) {
      console.log('❌ Contracts table does not exist. Please run the initial setup first.');
      return;
    }

    // Check if depaId column already exists in users table
    const usersTableDescription = await sequelize.getQueryInterface().describeTable('users');
    
    if (!usersTableDescription.depaId) {
      console.log('📝 Adding depaId column to users table...');
      await sequelize.getQueryInterface().addColumn('users', 'depaId', {
        type: DataTypes.STRING,
        allowNull: true, // Allow NULL initially for existing records
        unique: true,
        comment: 'System-generated DEPA ID (TDP-<GUID>, TDC-<GUID>, CCRP-<GUID>)'
      });
      console.log('✅ depaId column added to users table successfully');
    } else {
      console.log('ℹ️  depaId column already exists in users table');
    }

    // Check if depaId column already exists in contracts table
    const contractsTableDescription = await sequelize.getQueryInterface().describeTable('contracts');
    
    if (!contractsTableDescription.depaId) {
      console.log('📝 Adding depaId column to contracts table...');
      await sequelize.getQueryInterface().addColumn('contracts', 'depaId', {
        type: DataTypes.STRING,
        allowNull: true, // Allow NULL initially for existing records
        unique: true,
        comment: 'System-generated DEPA ID (CONTRACT-<GUID>)'
      });
      console.log('✅ depaId column added to contracts table successfully');
    } else {
      console.log('ℹ️  depaId column already exists in contracts table');
    }

    // Create indexes for performance
    console.log('📝 Creating indexes for DEPA ID fields...');
    
    try {
      await sequelize.getQueryInterface().addIndex('users', ['depaId'], {
        name: 'idx_users_depa_id'
      });
      console.log('✅ Index on users.depaId created');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Index on users.depaId already exists');
      } else {
        throw error;
      }
    }

    try {
      await sequelize.getQueryInterface().addIndex('contracts', ['depaId'], {
        name: 'idx_contracts_depa_id'
      });
      console.log('✅ Index on contracts.depaId created');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Index on contracts.depaId already exists');
      } else {
        throw error;
      }
    }

    console.log('🎉 DEPA ID fields migration completed successfully!');
    
    // Show summary
    const userCount = await sequelize.query('SELECT COUNT(*) as count FROM users', {
      type: Sequelize.QueryTypes.SELECT
    });
    
    const contractCount = await sequelize.query('SELECT COUNT(*) as count FROM contracts', {
      type: Sequelize.QueryTypes.SELECT
    });

    const usersWithDEPAId = await sequelize.query('SELECT COUNT(*) as count FROM users WHERE "depaId" IS NOT NULL', {
      type: Sequelize.QueryTypes.SELECT
    });

    const contractsWithDEPAId = await sequelize.query('SELECT COUNT(*) as count FROM contracts WHERE "depaId" IS NOT NULL', {
      type: Sequelize.QueryTypes.SELECT
    });

    console.log('\n📊 Migration Summary:');
    console.log(`Total users: ${userCount[0].count}`);
    console.log(`Users with DEPA ID: ${usersWithDEPAId[0].count}`);
    console.log(`Total contracts: ${contractCount[0].count}`);
    console.log(`Contracts with DEPA ID: ${contractsWithDEPAId[0].count}`);
    
    if (usersWithDEPAId[0].count === 0) {
      console.log('\n⚠️  Note: No existing users have DEPA IDs yet.');
      console.log('   Run the populateDEPAIds.js script to generate DEPA IDs for existing records.');
    }
    
    if (contractsWithDEPAId[0].count === 0) {
      console.log('\n⚠️  Note: No existing contracts have DEPA IDs yet.');
      console.log('   Run the populateDEPAIds.js script to generate DEPA IDs for existing records.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  addDEPAIdFields()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addDEPAIdFields }; 