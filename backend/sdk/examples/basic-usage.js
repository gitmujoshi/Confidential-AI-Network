#!/usr/bin/env node

/**
 * ContractFlow Pro SDK - Basic Usage Examples
 * Demonstrates common operations with the SDK
 */

const { ContractFlowProSDK, ContractManager, DatasetManager, InfrastructureManager } = require('../contractflow-pro-sdk');

// Configuration
const CONFIG = {
  baseURL: process.env.API_BASE_URL || 'http://localhost:5001',
  timeout: 30000
};

async function main() {
  console.log('🚀 ContractFlow Pro SDK - Basic Usage Examples\n');
  
  try {
    // Initialize SDK
    console.log('1. Initializing SDK...');
    const sdk = new ContractFlowProSDK(CONFIG);
    console.log(`   ✅ SDK initialized for: ${CONFIG.baseURL}\n`);
    
    // Test health check
    console.log('2. Testing API health...');
    const health = await sdk.getHealth();
    console.log(`   ✅ API Status: ${health.status}`);
    console.log(`   ✅ Version: ${health.version}`);
    console.log(`   ✅ Uptime: ${health.uptime.toFixed(2)}s\n`);
    
    // Test public endpoints (no auth required)
    console.log('3. Testing public endpoints...');
    
    // Get public datasets
    const datasets = await sdk.getPublicDatasets();
    console.log(`   ✅ Found ${datasets.datasets?.length || 0} public datasets`);
    
    // Search datasets
    const searchResults = await sdk.searchDatasets('customer');
    console.log(`   ✅ Search returned ${searchResults.datasets?.length || 0} results`);
    
    // Get cloud providers info
    const providers = await sdk.getCloudProviders();
    console.log(`   ✅ Available cloud providers: ${providers.providers?.map(p => p.name).join(', ') || 'None'}\n`);
    
    // Test contract preview (no auth required)
    console.log('4. Testing contract preview...');
    const previewData = {
      datasetSelections: [
        { datasetId: 'DS-001', individualPrice: 1000 }
      ],
      duration: 30,
      termsAndConditions: 'Example AI training contract terms',
      contractType: 'AI_TRAINING'
    };
    
    const preview = await sdk.previewContract(previewData);
    console.log(`   ✅ Contract preview generated: ${preview.legalDocument?.title || 'Unknown'}`);
    console.log(`   ✅ Contract type: ${preview.legalDocument?.metadata?.contractType || 'Unknown'}\n`);
    
    // Test cost estimation
    console.log('5. Testing cost estimation...');
    const estimationData = {
      cloudProvider: 'AZURE',
      region: 'eastus',
      duration: 30,
      resources: {
        compute: {
          vmSize: 'Standard_D2s_v3',
          vmCount: 2
        },
        storage: {
          type: 'Premium_LRS',
          sizeGB: 100
        }
      }
    };
    
    const costEstimate = await sdk.estimateCosts(estimationData);
    if (costEstimate.estimation) {
      console.log(`   ✅ Cost estimation: $${costEstimate.estimation.totalCost || 'Unknown'}`);
      console.log(`   ✅ Estimated monthly cost: $${costEstimate.estimation.finalCost || 'Unknown'}`);
    } else {
      console.log('   ⚠️  Cost estimation not available (may require authentication)');
    }
    
    console.log('\n6. Testing convenience classes...');
    
    // Dataset Manager
    const datasetManager = new DatasetManager(sdk);
    const affordableDatasets = await datasetManager.getAffordableDatasets(1500);
    console.log(`   ✅ Found ${affordableDatasets.datasets?.length || 0} datasets under $1500`);
    
    // Contract Manager
    const contractManager = new ContractManager(sdk);
    console.log('   ✅ Contract Manager initialized');
    
    // Infrastructure Manager
    const infraManager = new InfrastructureManager(sdk);
    console.log('   ✅ Infrastructure Manager initialized');
    
    console.log('\n🎉 Basic SDK functionality test completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   - Set up authentication to test protected endpoints');
    console.log('   - Create test users for different roles (TDC, TDP, CCRP)');
    console.log('   - Test contract creation and management');
    console.log('   - Test infrastructure provisioning');
    
  } catch (error) {
    console.error('\n❌ Error during SDK testing:');
    console.error(`   ${error.message}`);
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    process.exit(1);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = { main }; 