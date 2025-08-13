/**
 * Direct SCITT CCF Integration Test
 * Tests the SCITT CCF service directly without going through the complex contract model
 */

const ScittCcfService = require('./services/scittCcfService');

async function testScittCcfIntegration() {
  console.log('🚀 Testing SCITT CCF Integration...\n');
  
  try {
    // Initialize SCITT CCF service
    console.log('🔧 Initializing SCITT CCF service...');
    const scittService = new ScittCcfService();
    await scittService.initialize();
    console.log('✅ SCITT CCF service initialized successfully\n');
    
    // Test connection
    console.log('🔗 Testing SCITT CCF connection...');
    const connectionTest = await scittService.testConnection();
    console.log('✅ Connection test successful\n');
    
    // Test creating a simple contract claim
    console.log('📜 Testing contract creation...');
    const testContractData = {
      name: 'Test Healthcare Contract',
      description: 'Test contract for SCITT CCF integration',
      tdpId: 2, // Healthcare Data Corp
      tdcId: 5, // AI Research Institute
      ccrpId: 7, // Secure Compute Solutions
      datasetId: 1, // Medical Imaging Dataset
      price: 5000.00,
      duration: 90,
      terms: 'Test terms and conditions'
    };
    
    const contractResult = await scittService.createContract(testContractData);
    console.log('✅ Contract creation successful:', contractResult);
    
    // Test getting contract status
    console.log('\n📊 Testing contract status retrieval...');
    const statusResult = await scittService.getContractStatus(contractResult.claimId);
    console.log('✅ Status retrieval successful:', statusResult);
    
    // Test TEE attestation
    console.log('\n🔒 Testing TEE attestation...');
    const attestationResult = await scittService.verifyTeeAttestation(contractResult.claimId);
    console.log('✅ TEE attestation successful:', attestationResult);
    
    console.log('\n🎉 All SCITT CCF integration tests passed!');
    
  } catch (error) {
    console.error('❌ SCITT CCF integration test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Main execution
if (require.main === module) {
  testScittCcfIntegration()
    .then(() => {
      console.log('🎉 SCITT CCF integration test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 SCITT CCF integration test failed:', error);
      process.exit(1);
    });
}

module.exports = {
  testScittCcfIntegration
};
