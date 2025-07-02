/**
 * Database Migration Script: Add IAM Integration Fields
 * 
 * This script adds the new IAM integration fields to the existing User table:
 * - iamUserId: Keycloak user ID
 * - iamUsername: Keycloak username
 * - did: Decentralized Identifier
 * - onboardingStatus: User onboarding status
 * - profileCompleted: Profile completion flag
 * - emailVerified: Email verification status
 * - lastLoginAt: Last login timestamp
 * - organization: User organization
 * - phoneNumber: User phone number
 * - website: User website
 * - location: User location
 * 
 * Usage:
 * node scripts/migrateIAMFields.js
 */

const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config({ path: './config.env' });

// Database connection
const sequelize = new Sequelize(
  process.env.DB_NAME || 'contract_management',
  process.env.DB_USER || '***REMOVED-DB_PASSWORD***',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: '***REMOVED-DB_PASSWORD***',
    logging: false
  }
);

async function migrateIAMFields() {
  try {
    console.log('🚀 Starting IAM fields migration...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Check if columns already exist
    const tableInfo = await sequelize.getQueryInterface().describeTable('users');
    const existingColumns = Object.keys(tableInfo);
    
    console.log('📋 Existing columns:', existingColumns);

    const newColumns = [
      {
        name: 'iamUserId',
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
      },
      {
        name: 'iamUsername',
        type: DataTypes.STRING,
        allowNull: true
      },
      {
        name: 'did',
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
      },
      {
        name: 'onboardingStatus',
        type: DataTypes.ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED'),
        defaultValue: 'PENDING'
      },
      {
        name: 'profileCompleted',
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      {
        name: 'emailVerified',
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      {
        name: 'lastLoginAt',
        type: DataTypes.DATE,
        allowNull: true
      },
      {
        name: 'organization',
        type: DataTypes.STRING,
        allowNull: true
      },
      {
        name: 'phoneNumber',
        type: DataTypes.STRING,
        allowNull: true
      },
      {
        name: 'website',
        type: DataTypes.STRING,
        allowNull: true
      },
      {
        name: 'location',
        type: DataTypes.STRING,
        allowNull: true
      }
    ];

    let addedColumns = 0;
    let skippedColumns = 0;

    for (const column of newColumns) {
      if (existingColumns.includes(column.name)) {
        console.log(`ℹ️  Column '${column.name}' already exists, skipping`);
        skippedColumns++;
        continue;
      }

      try {
        console.log(`➕ Adding column '${column.name}'...`);
        
        if (column.type instanceof DataTypes.ENUM) {
          // Handle ENUM types specially
          await sequelize.getQueryInterface().addColumn('users', column.name, {
            type: column.type,
            allowNull: column.allowNull !== undefined ? column.allowNull : true,
            defaultValue: column.defaultValue
          });
        } else {
          await sequelize.getQueryInterface().addColumn('users', column.name, {
            type: column.type,
            allowNull: column.allowNull !== undefined ? column.allowNull : true,
            defaultValue: column.defaultValue,
            unique: column.unique || false
          });
        }

        console.log(`✅ Column '${column.name}' added successfully`);
        addedColumns++;

      } catch (error) {
        console.error(`❌ Failed to add column '${column.name}':`, error.message);
        
        // Continue with other columns even if one fails
        if (error.message.includes('already exists')) {
          console.log(`ℹ️  Column '${column.name}' already exists, skipping`);
          skippedColumns++;
        } else {
          throw error;
        }
      }
    }

    // Create indexes for new columns
    console.log('🔍 Creating indexes for new columns...');
    
    const indexesToCreate = [
      { name: 'idx_users_iam_user_id', columns: ['iamUserId'] },
      { name: 'idx_users_did', columns: ['did'] },
      { name: 'idx_users_onboarding_status', columns: ['onboardingStatus'] },
      { name: 'idx_users_profile_completed', columns: ['profileCompleted'] },
      { name: 'idx_users_last_login_at', columns: ['lastLoginAt'] }
    ];

    for (const index of indexesToCreate) {
      try {
        // Check if index already exists
        const indexExists = await sequelize.getQueryInterface().showIndex('users', {
          where: { name: index.name }
        });

        if (indexExists.length > 0) {
          console.log(`ℹ️  Index '${index.name}' already exists, skipping`);
          continue;
        }

        await sequelize.getQueryInterface().addIndex('users', index.columns, {
          name: index.name
        });
        console.log(`✅ Index '${index.name}' created successfully`);

      } catch (error) {
        console.error(`❌ Failed to create index '${index.name}':`, error.message);
        // Continue with other indexes
      }
    }

    // Update existing users with default values
    console.log('🔄 Updating existing users with default values...');
    
    try {
      const updateResult = await sequelize.query(`
        UPDATE users 
        SET 
          "onboardingStatus" = 'COMPLETED',
          "profileCompleted" = true,
          "emailVerified" = true
        WHERE "onboardingStatus" IS NULL
      `);

      console.log(`✅ Updated ${updateResult[1]} existing users with default values`);

    } catch (error) {
      console.error('❌ Failed to update existing users:', error.message);
    }

    // Verify migration
    console.log('🔍 Verifying migration...');
    const finalTableInfo = await sequelize.getQueryInterface().describeTable('users');
    const finalColumns = Object.keys(finalTableInfo);
    
    console.log('📋 Final columns:', finalColumns);

    // Check if all required columns exist
    const requiredColumns = newColumns.map(col => col.name);
    const missingColumns = requiredColumns.filter(col => !finalColumns.includes(col));

    if (missingColumns.length > 0) {
      console.error('❌ Missing columns after migration:', missingColumns);
      throw new Error('Migration incomplete');
    }

    console.log('');
    console.log('🎉 IAM fields migration completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   ✅ Added columns: ${addedColumns}`);
    console.log(`   ℹ️  Skipped columns: ${skippedColumns}`);
    console.log(`   📋 Total columns: ${finalColumns.length}`);
    console.log('');
    console.log('🔗 Next steps:');
    console.log('   1. Start Keycloak IAM server');
    console.log('   2. Run Keycloak setup script');
    console.log('   3. Update frontend to use IAM authentication');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateIAMFields();
}

module.exports = migrateIAMFields; 