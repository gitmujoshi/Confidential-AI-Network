const { User } = require('../models');
const { Sequelize } = require('sequelize');

/**
 * Add Cloud Provider Support for CCRP Users
 * 
 * This script adds cloud provider support to the User model and updates
 * existing CCRP users with different cloud service providers.
 * 
 * Cloud Providers:
 * - AWS (Amazon Web Services)
 * - Azure (Microsoft Azure)
 * - GCP (Google Cloud Platform)
 * - OCI (Oracle Cloud Infrastructure)
 */

async function addCloudProviderSupport() {
  try {
    console.log('☁️ Adding cloud provider support for CCRP users...\n');

    // Step 1: Add cloudProvider column to users table
    console.log('📊 Step 1: Adding cloudProvider column to users table...');
    
    const queryInterface = User.sequelize.getQueryInterface();
    
    try {
      await queryInterface.addColumn('users', 'cloudProvider', {
        type: Sequelize.ENUM('AWS', 'Azure', 'GCP', 'OCI'),
        allowNull: true,
        comment: 'Cloud service provider for CCRP users'
      });
      console.log('✅ cloudProvider column added successfully');
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError' || error.message.includes('already exists')) {
        console.log('ℹ️ cloudProvider column already exists');
      } else {
        throw error;
      }
    }

    // Step 2: Update CCRP users with different cloud providers
    console.log('\n📝 Step 2: Updating CCRP users with cloud providers...');

    const ccrpUpdates = [
      {
        email: 'secure-compute@example.com',
        cloudProvider: 'AWS',
        description: 'Leading AWS-based confidential computing provider with Nitro Enclaves'
      },
      {
        email: 'privacy-first@example.com',
        cloudProvider: 'Azure',
        description: 'Microsoft Azure Confidential Computing specialist with SGX enclaves'
      },
      {
        email: 'confidential-lab@example.com',
        cloudProvider: 'GCP',
        description: 'Google Cloud Platform confidential computing with Confidential VMs'
      },
      {
        email: 'enterprise-security@example.com',
        cloudProvider: 'OCI',
        description: 'Oracle Cloud Infrastructure confidential computing provider'
      },
      {
        email: 'cloud-security@example.com',
        cloudProvider: 'AWS',
        description: 'Multi-cloud security provider with AWS Nitro Enclaves expertise'
      }
    ];

    for (const update of ccrpUpdates) {
      try {
        const user = await User.findOne({ where: { email: update.email } });
        if (user) {
          await user.update({
            cloudProvider: update.cloudProvider,
            description: update.description
          });
          console.log(`✅ Updated ${user.name} (${update.email}) with ${update.cloudProvider}`);
        } else {
          console.log(`❌ User not found: ${update.email}`);
        }
      } catch (error) {
        console.log(`❌ Error updating ${update.email}:`, error.message);
      }
    }

    // Step 3: Verify the updates
    console.log('\n🔍 Step 3: Verifying CCRP users with cloud providers...');
    
    const ccrpUsers = await User.findAll({ 
      where: { partyType: 'CCRP' },
      attributes: ['id', 'name', 'email', 'cloudProvider', 'description']
    });

    console.log('\n📋 CCRP Users with Cloud Providers:');
    ccrpUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email})`);
      console.log(`  Cloud Provider: ${user.cloudProvider || 'Not set'}`);
      console.log(`  Description: ${user.description}`);
      console.log('');
    });

    console.log('🎉 Cloud provider support added successfully!');
    console.log('\n📚 Available Cloud Providers:');
    console.log('- AWS: Amazon Web Services (Nitro Enclaves)');
    console.log('- Azure: Microsoft Azure (SGX Enclaves)');
    console.log('- GCP: Google Cloud Platform (Confidential VMs)');
    console.log('- OCI: Oracle Cloud Infrastructure (Confidential Computing)');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  addCloudProviderSupport().then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { addCloudProviderSupport }; 