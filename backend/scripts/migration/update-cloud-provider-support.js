const { User } = require('../models');
const { Sequelize } = require('sequelize');

/**
 * Update Cloud Provider Support for Multiple Providers
 * 
 * This script updates the cloud provider support to allow CCRP users
 * to support multiple cloud providers simultaneously.
 * 
 * Changes:
 * - Replace single cloudProvider field with cloudProviders array
 * - Update existing CCRP users with multiple providers
 * - Add cloud provider management capabilities
 */

async function updateCloudProviderSupport() {
  try {
    console.log('☁️ Updating cloud provider support for multiple providers...\n');

    // Step 1: Add cloudProviders column to users table
    console.log('📊 Step 1: Adding cloudProviders column to users table...');
    
    const queryInterface = User.sequelize.getQueryInterface();
    
    try {
      // Add cloudProviders column as JSON array
      await queryInterface.addColumn('users', 'cloudProviders', {
        type: Sequelize.DataTypes.JSON,
        allowNull: true,
        comment: 'Array of cloud providers supported by CCRP users (AWS, Azure, GCP, OCI)'
      });
      console.log('✅ cloudProviders column added successfully');
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError' || error.message.includes('already exists')) {
        console.log('ℹ️ cloudProviders column already exists');
      } else {
        throw error;
      }
    }

    // Step 2: Migrate existing single cloudProvider to cloudProviders array
    console.log('\n📝 Step 2: Migrating existing cloud providers to array format...');
    
    const ccrpUsers = await User.findAll({ 
      where: { partyType: 'CCRP' },
      attributes: ['id', 'name', 'email', 'cloudProvider', 'cloudProviders', 'description']
    });

    for (const user of ccrpUsers) {
      try {
        let cloudProviders = [];
        
        // If user has cloudProvider but no cloudProviders array, migrate it
        if (user.cloudProvider && (!user.cloudProviders || user.cloudProviders.length === 0)) {
          cloudProviders = [user.cloudProvider];
          console.log(`✅ Migrated ${user.name} from single provider to array: [${cloudProviders.join(', ')}]`);
        } else if (user.cloudProviders) {
          cloudProviders = user.cloudProviders;
          console.log(`ℹ️ ${user.name} already has cloud providers: [${cloudProviders.join(', ')}]`);
        }

        await user.update({ cloudProviders });
      } catch (error) {
        console.log(`❌ Error updating ${user.email}:`, error.message);
      }
    }

    // Step 3: Update CCRP users with multiple cloud providers
    console.log('\n📝 Step 3: Updating CCRP users with multiple cloud providers...');

    const ccrpUpdates = [
      {
        email: 'secure-compute@example.com',
        cloudProviders: ['AWS', 'Azure'],
        description: 'Leading confidential computing provider with AWS Nitro Enclaves and Azure SGX expertise'
      },
      {
        email: 'privacy-first@example.com',
        cloudProviders: ['Azure', 'GCP'],
        description: 'Microsoft Azure and Google Cloud Platform confidential computing specialist'
      },
      {
        email: 'confidential-lab@example.com',
        cloudProviders: ['GCP', 'OCI'],
        description: 'Google Cloud Platform and Oracle Cloud Infrastructure confidential computing provider'
      },
      {
        email: 'enterprise-security@example.com',
        cloudProviders: ['OCI', 'AWS'],
        description: 'Oracle Cloud Infrastructure and AWS confidential computing provider'
      },
      {
        email: 'cloud-security@example.com',
        cloudProviders: ['AWS', 'Azure', 'GCP'],
        description: 'Multi-cloud security provider with expertise across AWS, Azure, and GCP'
      }
    ];

    for (const update of ccrpUpdates) {
      try {
        const user = await User.findOne({ where: { email: update.email } });
        if (user) {
          await user.update({
            cloudProviders: update.cloudProviders,
            description: update.description
          });
          console.log(`✅ Updated ${user.name} (${update.email}) with providers: [${update.cloudProviders.join(', ')}]`);
        } else {
          console.log(`❌ User not found: ${update.email}`);
        }
      } catch (error) {
        console.log(`❌ Error updating ${update.email}:`, error.message);
      }
    }

    // Step 4: Verify the updates
    console.log('\n🔍 Step 4: Verifying CCRP users with multiple cloud providers...');
    
    const updatedCcrpUsers = await User.findAll({ 
      where: { partyType: 'CCRP' },
      attributes: ['id', 'name', 'email', 'cloudProviders', 'description']
    });

    console.log('\n📋 CCRP Users with Cloud Providers:');
    updatedCcrpUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email})`);
      console.log(`  Cloud Providers: [${user.cloudProviders?.join(', ') || 'None'}]`);
      console.log(`  Description: ${user.description}`);
      console.log('');
    });

    console.log('🎉 Multiple cloud provider support added successfully!');
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
  updateCloudProviderSupport().then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { updateCloudProviderSupport }; 