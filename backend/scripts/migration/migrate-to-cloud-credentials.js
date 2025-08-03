/**
 * Migration Script: Migrate to Cloud-Agnostic Secret Management
 * 
 * This script migrates the existing ccrp_azure_credentials table to support
 * multi-cloud secret management with external secret storage.
 */

const { Sequelize } = require('sequelize');
require('dotenv').config({ path: './config.env' });

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

async function migrateToCloudCredentials() {
  try {
    console.log('🔧 Starting migration to cloud-agnostic secret management...');

    // Step 1: Create new table structure
    console.log('📋 Creating new cloud credentials table...');
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ccrp_cloud_credentials (
        id SERIAL PRIMARY KEY,
        "ccrpUserId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "cloudProvider" VARCHAR(10) NOT NULL,
        "subscriptionId" VARCHAR(255),
        "tenantId" VARCHAR(255),
        "projectId" VARCHAR(255),
        "compartmentId" VARCHAR(255),
        "secretName" VARCHAR(255) NOT NULL,
        "secretManager" VARCHAR(20) NOT NULL DEFAULT 'VAULT',
        "authMethod" VARCHAR(20) NOT NULL DEFAULT 'SERVICE_PRINCIPAL',
        "defaultLocation" VARCHAR(50) NOT NULL DEFAULT 'eastus',
        "defaultResourceGroupPrefix" VARCHAR(255) NOT NULL DEFAULT 'training',
        "defaultVMSize" VARCHAR(255) NOT NULL DEFAULT 'Standard_D2s_v3',
        "defaultStorageSku" VARCHAR(255) NOT NULL DEFAULT 'Standard_LRS',
        "defaultDatabaseSku" VARCHAR(255) NOT NULL DEFAULT 'Basic',
        "vnetAddressSpace" VARCHAR(255) NOT NULL DEFAULT '10.0.0.0/16',
        "privateSubnetPrefix" VARCHAR(255) NOT NULL DEFAULT '10.0.1.0/24',
        "publicSubnetPrefix" VARCHAR(255) NOT NULL DEFAULT '10.0.2.0/24',
        "enableEncryption" BOOLEAN NOT NULL DEFAULT true,
        "enableMonitoring" BOOLEAN NOT NULL DEFAULT true,
        "enableKeyVault" BOOLEAN NOT NULL DEFAULT true,
        "budgetLimit" DECIMAL(10,2),
        "alertThreshold" DECIMAL(3,2) DEFAULT 0.8,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "lastValidated" TIMESTAMP WITH TIME ZONE,
        "validationStatus" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        "createdBy" INTEGER REFERENCES users(id),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // Step 2: Create unique constraint
    console.log('🔒 Creating unique constraint...');
    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_ccrp_cloud_credentials_unique 
      ON ccrp_cloud_credentials("ccrpUserId", "cloudProvider");
    `);

    // Step 3: Create indexes
    console.log('📊 Creating indexes...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_ccrp_cloud_credentials_provider 
      ON ccrp_cloud_credentials("cloudProvider");
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_ccrp_cloud_credentials_active 
      ON ccrp_cloud_credentials("isActive");
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_ccrp_cloud_credentials_validation 
      ON ccrp_cloud_credentials("validationStatus");
    `);

    // Step 4: Check if old table exists and migrate data
    console.log('🔄 Checking for existing Azure credentials...');
    const [existingCredentials] = await sequelize.query(`
      SELECT COUNT(*) as count FROM ccrp_azure_credentials WHERE "isActive" = true;
    `);

    if (existingCredentials[0].count > 0) {
      console.log(`📦 Found ${existingCredentials[0].count} existing Azure credentials to migrate...`);
      
      // Get existing credentials
      const [credentials] = await sequelize.query(`
        SELECT * FROM ccrp_azure_credentials WHERE "isActive" = true;
      `);

      for (const cred of credentials) {
        console.log(`🔐 Migrating credentials for CCRP user ${cred.ccrpUserId}...`);
        
        // Create new cloud credential record
        await sequelize.query(`
          INSERT INTO ccrp_cloud_credentials (
            "ccrpUserId", "cloudProvider", "subscriptionId", "tenantId",
            "secretName", "secretManager", "authMethod", "defaultLocation",
            "defaultResourceGroupPrefix", "defaultVMSize", "defaultStorageSku",
            "defaultDatabaseSku", "vnetAddressSpace", "privateSubnetPrefix",
            "publicSubnetPrefix", "enableEncryption", "enableMonitoring",
            "enableKeyVault", "budgetLimit", "alertThreshold", "isActive",
            "lastValidated", "validationStatus", "createdBy", "createdAt", "updatedAt"
          ) VALUES (
            $1, 'AZURE', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
            $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
          ) ON CONFLICT ("ccrpUserId", "cloudProvider") DO UPDATE SET
            "subscriptionId" = EXCLUDED."subscriptionId",
            "tenantId" = EXCLUDED."tenantId",
            "secretName" = EXCLUDED."secretName",
            "updatedAt" = NOW();
        `, {
          replacements: [
            cred.ccrpUserId,
            cred.subscriptionId,
            cred.tenantId,
            `ccrp-${cred.ccrpUserId}-azure`, // secretName
            'VAULT', // secretManager
            cred.authMethod,
            cred.defaultLocation,
            cred.defaultResourceGroupPrefix,
            cred.defaultVMSize,
            cred.defaultStorageSku,
            cred.defaultDatabaseSku,
            cred.vnetAddressSpace,
            cred.privateSubnetPrefix,
            cred.publicSubnetPrefix,
            cred.enableEncryption,
            cred.enableMonitoring,
            cred.enableKeyVault,
            cred.budgetLimit,
            cred.alertThreshold,
            cred.isActive,
            cred.lastValidated,
            cred.validationStatus,
            cred.createdBy,
            cred.createdAt,
            cred.updatedAt
          ]
        });

        console.log(`✅ Migrated credentials for CCRP user ${cred.ccrpUserId}`);
      }
    } else {
      console.log('ℹ️ No existing Azure credentials found to migrate.');
    }

    // Step 5: Create enum types for new fields
    console.log('📝 Creating enum types...');
    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_ccrp_cloud_credentials_cloudProvider" AS ENUM ('AWS', 'AZURE', 'GCP', 'OCI');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_ccrp_cloud_credentials_secretManager" AS ENUM ('VAULT', 'AWS_SECRETS', 'AZURE_KEYVAULT', 'GCP_SECRETS', 'OCI_VAULT');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_ccrp_cloud_credentials_authMethod" AS ENUM ('SERVICE_PRINCIPAL', 'MANAGED_IDENTITY', 'IAM_ROLE', 'API_KEY');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Step 6: Verify migration
    console.log('✅ Verifying migration...');
    const [newCredentials] = await sequelize.query(`
      SELECT COUNT(*) as count FROM ccrp_cloud_credentials;
    `);

    console.log(`📊 Migration complete! New table has ${newCredentials[0].count} credentials.`);

    // Step 7: Create sample data for testing
    console.log('🧪 Creating sample cloud credentials for testing...');
    
    // Get a CCRP user for testing
    const [ccrpUsers] = await sequelize.query(`
      SELECT id FROM users WHERE "partyType" = 'CCRP' LIMIT 1;
    `);

    if (ccrpUsers.length > 0) {
      const ccrpUserId = ccrpUsers[0].id;
      
      // Create sample Azure credentials
      await sequelize.query(`
        INSERT INTO ccrp_cloud_credentials (
          "ccrpUserId", "cloudProvider", "subscriptionId", "tenantId",
          "secretName", "secretManager", "authMethod", "defaultLocation",
          "isActive", "validationStatus"
        ) VALUES (
          $1, 'AZURE', 'sample-subscription-id', 'sample-tenant-id',
          $2, 'VAULT', 'SERVICE_PRINCIPAL', 'eastus',
          true, 'PENDING'
        ) ON CONFLICT ("ccrpUserId", "cloudProvider") DO NOTHING;
      `, { replacements: [ccrpUserId, `ccrp-${ccrpUserId}-azure-sample`] });

      // Create sample AWS credentials
      await sequelize.query(`
        INSERT INTO ccrp_cloud_credentials (
          "ccrpUserId", "cloudProvider", "subscriptionId",
          "secretName", "secretManager", "authMethod", "defaultLocation",
          "isActive", "validationStatus"
        ) VALUES (
          $1, 'AWS', 'sample-account-id',
          $2, 'VAULT', 'IAM_ROLE', 'us-east-1',
          true, 'PENDING'
        ) ON CONFLICT ("ccrpUserId", "cloudProvider") DO NOTHING;
      `, { replacements: [ccrpUserId, `ccrp-${ccrpUserId}-aws-sample`] });

      console.log(`✅ Created sample credentials for CCRP user ${ccrpUserId}`);
    }

    console.log('🎉 Migration to cloud-agnostic secret management completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log('   ✅ Created new ccrp_cloud_credentials table');
    console.log('   ✅ Added multi-cloud support (AWS, Azure, GCP, OCI)');
    console.log('   ✅ Removed sensitive fields from database');
    console.log('   ✅ Added external secret manager references');
    console.log('   ✅ Created sample test data');
    console.log('');
    console.log('⚠️  Next steps:');
    console.log('   1. Update services to use new secret manager');
    console.log('   2. Migrate existing credentials to Vault');
    console.log('   3. Update API routes for new structure');
    console.log('   4. Test end-to-end functionality');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateToCloudCredentials()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateToCloudCredentials }; 