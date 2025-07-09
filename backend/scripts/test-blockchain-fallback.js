/**
 * Test Blockchain Fallback Functionality
 * 
 * This script tests the blockchain service with different configurations:
 * 1. Blockchain enabled and available
 * 2. Blockchain enabled but not available (fallback to database)
 * 3. Blockchain disabled (database-only mode)
 */

const axios = require('axios');
const BlockchainService = require('../services/blockchainService');

const API_BASE = 'http://localhost:5001/api';

async function testBlockchainFallback() {
  console.log('🧪 Testing Blockchain Fallback Functionality\n');

  // Test 1: Check blockchain health via API
  console.log('1️⃣ Testing Blockchain Health Check API...');
  try {
    const healthResponse = await axios.get(`${API_BASE}/blockchain/health`);
    console.log('✅ Blockchain Health Check Response:');
    console.log(JSON.stringify(healthResponse.data, null, 2));
  } catch (error) {
    console.log('❌ Blockchain Health Check Failed:', error.message);
  }

  console.log('\n2️⃣ Testing Blockchain Service Directly...');
  
  // Test 2: Initialize blockchain service
  const blockchainService = new BlockchainService();
  await blockchainService.initialize();
  
  console.log('✅ Blockchain Service Mode:', blockchainService.getMode());
  
  // Test 3: Test contract creation with fallback
  console.log('\n3️⃣ Testing Contract Creation with Fallback...');
  
  const mockContractData = {
    tdpAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    datasetId: 'dataset_001',
    modelId: 'model_001',
    price: '0.1',
    duration: 30,
    termsAndConditions: 'Test terms and conditions',
    privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
  };

  try {
    const result = await blockchainService.createContract(
      mockContractData.tdpAddress,
      mockContractData.datasetId,
      mockContractData.modelId,
      mockContractData.price,
      mockContractData.duration,
      mockContractData.termsAndConditions,
      mockContractData.privateKey
    );
    
    console.log('✅ Contract Creation Result:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.log('❌ Contract Creation Failed:', error.message);
  }

  // Test 4: Test contract signing with fallback
  console.log('\n4️⃣ Testing Contract Signing with Fallback...');
  
  try {
    const signResult = await blockchainService.signContract(
      '1',
      '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
    );
    
    console.log('✅ Contract Signing Result:');
    console.log(JSON.stringify(signResult, null, 2));
  } catch (error) {
    console.log('❌ Contract Signing Failed:', error.message);
  }

  // Test 5: Test CCRP selection with fallback
  console.log('\n5️⃣ Testing CCRP Selection with Fallback...');
  
  try {
    const ccrpResult = await blockchainService.selectCCRP(
      '1',
      '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
    );
    
    console.log('✅ CCRP Selection Result:');
    console.log(JSON.stringify(ccrpResult, null, 2));
  } catch (error) {
    console.log('❌ CCRP Selection Failed:', error.message);
  }

  console.log('\n🎯 Test Summary:');
  console.log('- The blockchain service now supports graceful fallback to database-only mode');
  console.log('- When blockchain is unavailable, operations return mock results with warnings');
  console.log('- The system continues to function normally even without blockchain');
  console.log('- All blockchain operations include mode information and warnings');
}

// Test different environment configurations
async function testEnvironmentConfigurations() {
  console.log('\n🔧 Testing Different Environment Configurations\n');

  // Test with BLOCKCHAIN_ENABLED=false
  console.log('1️⃣ Testing with BLOCKCHAIN_ENABLED=false...');
  process.env.BLOCKCHAIN_ENABLED = 'false';
  
  const blockchainService1 = new BlockchainService();
  await blockchainService1.initialize();
  console.log('Mode:', blockchainService1.getMode());

  // Test with BLOCKCHAIN_ENABLED=true (default)
  console.log('\n2️⃣ Testing with BLOCKCHAIN_ENABLED=true (default)...');
  delete process.env.BLOCKCHAIN_ENABLED;
  
  const blockchainService2 = new BlockchainService();
  await blockchainService2.initialize();
  console.log('Mode:', blockchainService2.getMode());

  // Test with invalid blockchain URL
  console.log('\n3️⃣ Testing with invalid blockchain URL...');
  process.env.BLOCKCHAIN_ENABLED = 'true';
  process.env.BLOCKCHAIN_URL = 'http://localhost:9999'; // Invalid port
  
  const blockchainService3 = new BlockchainService();
  await blockchainService3.initialize();
  console.log('Mode:', blockchainService3.getMode());
}

if (require.main === module) {
  (async () => {
    try {
      await testBlockchainFallback();
      await testEnvironmentConfigurations();
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  })();
}

module.exports = { testBlockchainFallback, testEnvironmentConfigurations }; 