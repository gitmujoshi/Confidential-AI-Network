/**
 * Simple Migration: Create Cloud Credentials Table
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

async function createCloudCredentialsTable() {
  try {
    console.log('🔧 Creating cloud credentials table...');

    // Create the new table
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

    // Create unique constraint
    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_ccrp_cloud_credentials_unique 
      ON ccrp_cloud_credentials("ccrpUserId", "cloudProvider");
    `);

    // Create indexes
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_ccrp_cloud_credentials_provider 
      ON ccrp_cloud_credentials("cloudProvider");
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_ccrp_cloud_credentials_active 
      ON ccrp_cloud_credentials("isActive");
    `);

    console.log('✅ Cloud credentials table created successfully!');

    // Verify table exists
    const [result] = await sequelize.query(`
      SELECT COUNT(*) as count FROM ccrp_cloud_credentials;
    `);

    console.log(`📊 Table has ${result[0].count} records.`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run migration if called directly
if (require.main === module) {
  createCloudCredentialsTable()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { createCloudCredentialsTable }; 