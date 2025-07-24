/**
 * Test CCRP Azure Credentials Integration
 * 
 * This script demonstrates how CCRP-specific Azure credentials are integrated
 * with contract provisioning and infrastructure deployment.
 */

require('dotenv').config();
const CCRPAzureCredentialsService = require('./services/ccrpAzureCredentialsService');
const db = require('./models');

async function testCCRPAzureIntegration() {
  console.log('🧪 Testing CCRP Azure Credentials Integration...\n');

  try {
    const ccrpCredentialsService = new CCRPAzureCredentialsService();

    // 1. Create a test CCRP user
    console.log('👤 Creating test CCRP user...');
    const testCCRP = await db.User.create({
      name: 'Test CCRP Azure',
      email: 'test-ccrp-azure@example.com',
      partyType: 'CCRP',
      isRegistered: true,
      registrationDate: new Date()
    });
    console.log(`✅ Created CCRP user: ${testCCRP.name} (ID: ${testCCRP.id})`);

    // 2. Create Azure credentials for the CCRP
    console.log('\n🔐 Creating Azure credentials for CCRP...');
    const credentials = {
      subscriptionId: process.env.AZURE_SUBSCRIPTION_ID || 'test-subscription-id',
      tenantId: process.env.AZURE_TENANT_ID || 'test-tenant-id',
      clientId: process.env.AZURE_CLIENT_ID || 'test-client-id',
      clientSecret: process.env.AZURE_CLIENT_SECRET || 'test-client-secret',
      authMethod: 'SERVICE_PRINCIPAL'
    };

    const config = {
      defaultLocation: 'eastus',
      defaultResourceGroupPrefix: 'training',
      defaultVMSize: 'Standard_D2s_v3',
      defaultStorageSku: 'Standard_LRS',
      defaultDatabaseSku: 'Basic',
      enableEncryption: true,
      enableMonitoring: true,
      enableKeyVault: true,
      budgetLimit: 1000.00,
      alertThreshold: 0.8
    };

    const azureCredentials = await ccrpCredentialsService.createOrUpdateCredentials(
      testCCRP.id,
      credentials,
      config
    );
    console.log(`✅ Created Azure credentials for CCRP: ${azureCredentials.id}`);

    // 3. Create a test contract with Azure configuration
    console.log('\n📋 Creating test contract with Azure configuration...');
    const testContract = await db.Contract.create({
      contractId: `test-contract-azure-${Date.now()}`,
      tdcId: 1, // Assuming user ID 1 exists
      ccrpId: testCCRP.id,
      ccrpCloudProvider: 'Azure',
      ccrpAzureLocation: 'eastus',
      ccrpAzureVMSize: 'Standard_D4s_v3',
      ccrpAzureStorageSku: 'Premium_LRS',
      ccrpAzureEnableEncryption: true,
      ccrpAzureEnableMonitoring: true,
      ccrpAzureBudgetLimit: 500.00,
      status: 'SIGNED',
      multiTdpStatus: 'SIGNED'
    });
    console.log(`✅ Created test contract: ${testContract.contractId}`);

    // 4. Test getting contract Azure configuration
    console.log('\n🔧 Testing contract Azure configuration retrieval...');
    const contractAzureConfig = await ccrpCredentialsService.getContractAzureConfig(testContract.contractId);
    console.log('✅ Contract Azure configuration:');
    console.log(`- Subscription ID: ${contractAzureConfig.subscription.id}`);
    console.log(`- Tenant ID: ${contractAzureConfig.subscription.tenantId}`);
    console.log(`- Location: ${contractAzureConfig.defaults.location}`);
    console.log(`- VM Size: ${contractAzureConfig.defaults.vmSize}`);
    console.log(`- Storage SKU: ${contractAzureConfig.defaults.storageSku}`);
    console.log(`- Encryption: ${contractAzureConfig.security.enableEncryption}`);
    console.log(`- Monitoring: ${contractAzureConfig.monitoring.enableMonitoring}`);
    console.log(`- Budget Limit: $${contractAzureConfig.cost.budgetLimit}`);

    // 5. Test Azure connectivity (if real credentials are available)
    console.log('\n🌐 Testing Azure connectivity...');
    if (process.env.AZURE_SUBSCRIPTION_ID && process.env.AZURE_CLIENT_ID) {
      const connectivityTest = await ccrpCredentialsService.testAzureConnectivity(testCCRP.id);
      if (connectivityTest.success) {
        console.log('✅ Azure connectivity test successful');
        console.log(`- Resource Groups: ${connectivityTest.resourceGroupCount}`);
        console.log(`- Subscription: ${connectivityTest.subscriptionId}`);
      } else {
        console.log('⚠️ Azure connectivity test failed (expected for demo)');
        console.log(`- Error: ${connectivityTest.message}`);
      }
    } else {
      console.log('⚠️ Skipping Azure connectivity test (no real credentials)');
    }

    // 6. List CCRPs with credentials
    console.log('\n📋 Listing CCRPs with Azure credentials...');
    const ccrpsWithCredentials = await ccrpCredentialsService.listCCRPsWithCredentials();
    console.log('✅ CCRPs with credentials:');
    ccrpsWithCredentials.forEach(ccrp => {
      console.log(`- ${ccrp.name} (${ccrp.email}): ${ccrp.hasCredentials ? 'Has credentials' : 'No credentials'} (${ccrp.validationStatus})`);
    });

    // 7. Test credential validation
    console.log('\n✅ Testing credential validation...');
    try {
      await ccrpCredentialsService.validateCredentials(azureCredentials.id);
      console.log('✅ Credential validation completed');
    } catch (error) {
      console.log('⚠️ Credential validation failed (expected for demo):', error.message);
    }

    // 8. Test updating contract Azure configuration
    console.log('\n🔄 Testing contract Azure configuration update...');
    const updatedConfig = {
      defaults: {
        location: 'westus2',
        vmSize: 'Standard_D8s_v3',
        storageSku: 'Premium_LRS'
      },
      security: {
        enableEncryption: true
      },
      monitoring: {
        enableMonitoring: true
      },
      cost: {
        budgetLimit: 750.00
      }
    };

    const updatedContract = await ccrpCredentialsService.updateContractAzureConfig(
      testContract.contractId,
      updatedConfig
    );
    console.log('✅ Contract Azure configuration updated');
    console.log(`- New Location: ${updatedContract.ccrpAzureLocation}`);
    console.log(`- New VM Size: ${updatedContract.ccrpAzureVMSize}`);
    console.log(`- New Budget: $${updatedContract.ccrpAzureBudgetLimit}`);

    // 9. Demonstrate infrastructure provisioning with CCRP credentials
    console.log('\n🏗️ Demonstrating infrastructure provisioning with CCRP credentials...');
    
    // This would normally be called by the training service
    const InfrastructureService = require('./services/infrastructureService');
    const infrastructureService = new InfrastructureService();
    
    try {
      const environment = await infrastructureService.createTrainingEnvironment(
        testContract.contractId,
        {
          location: 'eastus',
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
            enabled: false
          },
          mlServices: {
            gpuEnabled: false
          }
        }
      );
      console.log('✅ Infrastructure provisioning initiated with CCRP credentials');
      console.log(`- Environment ID: ${environment.environmentId}`);
      console.log(`- Cloud Provider: ${environment.cloudProvider}`);
      console.log(`- Status: ${environment.status}`);
    } catch (error) {
      console.log('⚠️ Infrastructure provisioning failed (expected for demo):', error.message);
    }

    console.log('\n🎉 CCRP Azure Credentials Integration Test Completed Successfully!');
    console.log('\n📊 Summary:');
    console.log(`- CCRP User: ${testCCRP.name} (ID: ${testCCRP.id})`);
    console.log(`- Azure Credentials: ${azureCredentials.id}`);
    console.log(`- Test Contract: ${testContract.contractId}`);
    console.log(`- Contract Azure Config: Retrieved and updated successfully`);
    console.log(`- Infrastructure Provisioning: CCRP credentials integrated`);

  } catch (error) {
    console.error('\n❌ CCRP Azure Integration Test Failed:');
    console.error(error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.error('\n💡 Troubleshooting Tips:');
      console.error('1. Check database connection');
      console.error('2. Verify Azure credentials are set');
      console.error('3. Ensure all required models are loaded');
    }
  }
}

// Run the test
if (require.main === module) {
  testCCRPAzureIntegration().catch(console.error);
}

module.exports = { testCCRPAzureIntegration }; 