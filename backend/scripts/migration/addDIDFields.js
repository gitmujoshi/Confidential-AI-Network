/**
 * Migration Script: Add DID Fields to Users Table
 * 
 * This script adds the following fields to the users table:
 * - didSource: ENUM('SYSTEM_GENERATED', 'USER_PROVIDED')
 * - didVerified: BOOLEAN
 * - didVerificationMethod: STRING
 * 
 * Run this script to update the database schema for DID support.
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

async function addDIDFields() {
  try {
    console.log('🔄 Starting DID fields migration...');
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
    const tableExists = await sequelize.getQueryInterface().showAllTables();
    if (!tableExists.includes('users')) {
      console.log('❌ Users table does not exist. Please run the initial setup first.');
      return;
    }

    // Check if didSource column already exists
    const tableDescription = await sequelize.getQueryInterface().describeTable('users');
    
    if (!tableDescription.didSource) {
      console.log('📝 Adding didSource column...');
      await sequelize.getQueryInterface().addColumn('users', 'didSource', {
        type: DataTypes.ENUM('SYSTEM_GENERATED', 'USER_PROVIDED'),
        allowNull: true,
        comment: 'Source of the DID - system generated or user provided'
      });
      console.log('✅ didSource column added successfully');
    } else {
      console.log('ℹ️  didSource column already exists');
    }

    if (!tableDescription.didVerified) {
      console.log('📝 Adding didVerified column...');
      await sequelize.getQueryInterface().addColumn('users', 'didVerified', {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether the user-provided DID has been verified'
      });
      console.log('✅ didVerified column added successfully');
    } else {
      console.log('ℹ️  didVerified column already exists');
    }

    if (!tableDescription.didVerificationMethod) {
      console.log('📝 Adding didVerificationMethod column...');
      await sequelize.getQueryInterface().addColumn('users', 'didVerificationMethod', {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Method used to verify the DID (e.g., signature, credential)'
      });
      console.log('✅ didVerificationMethod column added successfully');
    } else {
      console.log('ℹ️  didVerificationMethod column already exists');
    }

    // Update existing users to have SYSTEM_GENERATED as default
    console.log('🔄 Updating existing users with default DID source...');
    await sequelize.query(`
      UPDATE users 
      SET "didSource" = 'SYSTEM_GENERATED', 
          "didVerified" = false 
      WHERE "didSource" IS NULL
    `);
    console.log('✅ Existing users updated with default DID source');

    // Create indexes for performance
    console.log('📝 Creating indexes for DID fields...');
    
    try {
      await sequelize.getQueryInterface().addIndex('users', ['didSource'], {
        name: 'idx_users_did_source'
      });
      console.log('✅ Index on didSource created');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Index on didSource already exists');
      } else {
        throw error;
      }
    }

    try {
      await sequelize.getQueryInterface().addIndex('users', ['didVerified'], {
        name: 'idx_users_did_verified'
      });
      console.log('✅ Index on didVerified created');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Index on didVerified already exists');
      } else {
        throw error;
      }
    }

    console.log('🎉 DID fields migration completed successfully!');
    
    // Show summary
    const userCount = await sequelize.query('SELECT COUNT(*) as count FROM users', {
      type: Sequelize.QueryTypes.SELECT
    });
    
    const didStats = await sequelize.query(`
      SELECT 
        "didSource",
        COUNT(*) as count,
        COUNT(CASE WHEN "didVerified" = true THEN 1 END) as verified_count
      FROM users 
      GROUP BY "didSource"
    `, {
      type: Sequelize.QueryTypes.SELECT
    });

    console.log('\n📊 Migration Summary:');
    console.log(`Total users: ${userCount[0].count}`);
    console.log('DID Statistics:');
    didStats.forEach(stat => {
      console.log(`  ${stat.didSource}: ${stat.count} users (${stat.verified_count} verified)`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  addDIDFields()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addDIDFields }; 