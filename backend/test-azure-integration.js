/**
 * Test Azure Integration
 * 
 * This script tests the real Azure infrastructure provisioning
 * Make sure to set up Azure credentials before running this test
 */

require('dotenv').config();
const AzureProvider = require('./services/providers/azureProvider');
const db = require('./models');

async function testAzureIntegration() {
  console.log('🧪 Testing Azure Integration...\n');

  try {
    // Check environment variables
    console.log('📋 Checking Azure Configuration:');
    console.log(`- AZURE_SUBSCRIPTION_ID: ${process.env.AZURE_SUBSCRIPTION_ID ? '✅ Set' : '❌ Missing'}`);
    console.log(`- AZURE_TENANT_ID: ${process.env.AZURE_TENANT_ID ? '✅ Set' : '❌ Missing'}`);
    console.log(`- AZURE_CLIENT_ID: ${process.env.AZURE_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
    console.log(`- AZURE_CLIENT_SECRET: ${process.env.AZURE_CLIENT_SECRET ? '✅ Set' : '❌ Missing'}\n`);

    if (!process.env.AZURE_SUBSCRIPTION_ID) {
      console.log('❌ Azure credentials not configured. Please set the required environment variables.');
      console.log('See config/azure-config.example.js for setup instructions.');
      return;
    }

    // Initialize Azure provider
    console.log('🔧 Initializing Azure Provider...');
    const azureProvider = new AzureProvider();
    console.log('✅ Azure Provider initialized successfully\n');

    // Test configuration
    const testEnvironmentId = `test-env-${Date.now()}`;
    const testConfig = {
      location: 'eastus',
      networking: {
        privateSubnet: true,
        publicSubnet: true
      },
      compute: {
        instanceCount: 1,
        instanceType: 'Standard_D2s_v3'
      },
      storage: {
        type: 'SSD',
        sizeGB: 100,
        encrypted: true
      },
      database: {
        enabled: false // Skip database for quick test
      },
      mlServices: {
        gpuEnabled: false // Skip ML services for quick test
      }
    };

    const securityConfig = {
      networkSecurity: {
        allowSSH: true,
        allowHTTP: true,
        allowHTTPS: true
      },
      encryption: {
        enabled: true,
        keySource: 'Microsoft.Keyvault'
      }
    };

    const monitoringConfig = {
      logging: {
        retentionDays: 30
      }
    };

    console.log('🏗️ Testing Infrastructure Provisioning...');
    console.log(`- Environment ID: ${testEnvironmentId}`);
    console.log(`- Location: ${testConfig.location}`);
    console.log(`- VM Size: ${testConfig.compute.instanceType}`);
    console.log(`- Instance Count: ${testConfig.compute.instanceCount}\n`);

    // Provision infrastructure
    const result = await azureProvider.provisionInfrastructure(
      testEnvironmentId,
      testConfig,
      securityConfig,
      monitoringConfig
    );

    console.log('✅ Infrastructure Provisioning Results:');
    console.log(`- Environment URL: ${result.environmentUrl}`);
    console.log(`- Resources Created: ${result.resources.length}`);
    console.log(`- Estimated Cost: $${result.estimatedCost.toFixed(2)}/month`);
    console.log('\n📋 Created Resources:');
    
    result.resources.forEach((resource, index) => {
      console.log(`  ${index + 1}. ${resource.type}: ${resource.name} (${resource.status})`);
    });

    console.log('\n📝 Provisioning Logs:');
    console.log(result.logs);

    // Test environment status
    console.log('\n🔍 Testing Environment Status...');
    const status = await azureProvider.getEnvironmentStatus(testEnvironmentId);
    console.log(`- Status: ${status}`);

    // Wait a bit before cleanup
    console.log('\n⏳ Waiting 30 seconds before cleanup...');
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Cleanup
    console.log('\n🗑️ Testing Infrastructure Cleanup...');
    await azureProvider.destroyInfrastructure(testEnvironmentId);
    console.log('✅ Infrastructure cleanup completed');

    console.log('\n🎉 Azure Integration Test Completed Successfully!');

  } catch (error) {
    console.error('\n❌ Azure Integration Test Failed:');
    console.error(error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.error('\n💡 Troubleshooting Tips:');
      console.error('1. Check your internet connection');
      console.error('2. Verify Azure credentials are correct');
      console.error('3. Ensure Azure CLI is installed and logged in');
    } else if (error.code === 'Unauthorized') {
      console.error('\n💡 Authentication Issues:');
      console.error('1. Check AZURE_CLIENT_ID and AZURE_CLIENT_SECRET');
      console.error('2. Verify service principal has proper permissions');
      console.error('3. Ensure subscription is active');
    } else if (error.code === 'ResourceGroupNotFound') {
      console.error('\n💡 Resource Issues:');
      console.error('1. Check AZURE_SUBSCRIPTION_ID is correct');
      console.error('2. Verify you have permissions to create resource groups');
      console.error('3. Ensure required Azure providers are registered');
    }
  }
}

// Run the test
if (require.main === module) {
  testAzureIntegration().catch(console.error);
}

module.exports = { testAzureIntegration }; 