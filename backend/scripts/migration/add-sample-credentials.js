/**
 * Add Sample Cloud Credentials for Testing
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
    dialect: 'postgres',
    logging: false
  }
);

async function addSampleCredentials() {
  try {
    console.log('🧪 Adding sample cloud credentials...');

    // Get a CCRP user
    const [ccrpUsers] = await sequelize.query(`
      SELECT id FROM users WHERE "partyType" = 'CCRP' LIMIT 1;
    `);

    if (ccrpUsers.length === 0) {
      console.log('❌ No CCRP users found. Creating a test CCRP user...');
      
      // Create a test CCRP user
      await sequelize.query(`
        INSERT INTO users (name, email, "partyType", "isActive", "createdAt", "updatedAt")
        VALUES ('Test CCRP', 'test-ccrp@example.com', 'CCRP', true, NOW(), NOW())
        ON CONFLICT (email) DO NOTHING;
      `);
      
      const [newUser] = await sequelize.query(`
        SELECT id FROM users WHERE email = 'test-ccrp@example.com';
      `);
      
      if (newUser.length > 0) {
        ccrpUsers[0] = newUser[0];
      }
    }

    if (ccrpUsers.length > 0) {
      const ccrpUserId = ccrpUsers[0].id;
      console.log(`📝 Adding sample credentials for CCRP user ${ccrpUserId}...`);

      // Add Azure sample credentials
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

      // Add AWS sample credentials
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

      // Add GCP sample credentials
      await sequelize.query(`
        INSERT INTO ccrp_cloud_credentials (
          "ccrpUserId", "cloudProvider", "projectId",
          "secretName", "secretManager", "authMethod", "defaultLocation",
          "isActive", "validationStatus"
        ) VALUES (
          $1, 'GCP', 'sample-project-id',
          $2, 'VAULT', 'API_KEY', 'us-central1',
          true, 'PENDING'
        ) ON CONFLICT ("ccrpUserId", "cloudProvider") DO NOTHING;
      `, { replacements: [ccrpUserId, `ccrp-${ccrpUserId}-gcp-sample`] });

      console.log(`✅ Added sample credentials for CCRP user ${ccrpUserId}`);
    } else {
      console.log('❌ Could not create or find CCRP user');
    }

    // Verify the data
    const [credentials] = await sequelize.query(`
      SELECT "ccrpUserId", "cloudProvider", "secretName", "secretManager" 
      FROM ccrp_cloud_credentials;
    `);

    console.log(`📊 Total credentials in database: ${credentials.length}`);
    credentials.forEach(cred => {
      console.log(`   - ${cred.cloudProvider}: ${cred.secretName} (${cred.secretManager})`);
    });

  } catch (error) {
    console.error('❌ Error adding sample credentials:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run if called directly
if (require.main === module) {
  addSampleCredentials()
    .then(() => {
      console.log('✅ Sample credentials added successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed to add sample credentials:', error);
      process.exit(1);
    });
}

module.exports = { addSampleCredentials }; 