/**
 * Complete Functionality Test Script
 * 
 * This script tests all the major functionality we've implemented:
 * 1. User authentication (email/password)
 * 2. Contract creation without wallet connection
 * 3. Forgot password flow
 * 4. Development reset token retrieval
 * 5. Password reset functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';
const TEST_EMAIL = 'tdc1751902280921@example.com';
const TEST_PASSWORD = 'password123';

async function testCompleteFunctionality() {
  console.log('🔄 Testing Complete Contract Management Functionality\n');

  let authToken = null;

  try {
    // Test 1: User Authentication
    console.log('🔐 Test 1: User Authentication');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    authToken = loginResponse.data.accessToken;
    console.log('✅ Login successful');
    console.log(`   User: ${loginResponse.data.user.name}`);
    console.log(`   Party Type: ${loginResponse.data.user.partyType}`);
    console.log(`   Authentication: ${loginResponse.data.message}\n`);

    // Test 2: Contract Creation (without wallet)
    console.log('📋 Test 2: Contract Creation (No Wallet Required)');
    const contractResponse = await axios.post(`${BASE_URL}/contracts`, {
      tdpId: 8,
      datasetId: 'ECOMM_BEHAV_001',
      modelId: 'GPT-4-Ecommerce-v2',
      price: 4500,
      duration: 45,
      termsAndConditions: 'Enhanced terms for e-commerce model training with improved features'
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    console.log('✅ Contract created successfully');
    console.log(`   Contract ID: ${contractResponse.data.contract.contractId}`);
    console.log(`   Status: ${contractResponse.data.contract.status}`);
    console.log(`   TDP: ${contractResponse.data.contract.tdp.name}`);
    console.log(`   Dataset: ${contractResponse.data.contract.dataset.name}`);
    console.log(`   Price: $${contractResponse.data.contract.price}`);
    console.log(`   Duration: ${contractResponse.data.contract.duration} days\n`);

    // Test 3: Forgot Password Flow
    console.log('🔑 Test 3: Forgot Password Flow');
    const forgotPasswordResponse = await axios.post(`${BASE_URL}/auth/forgot-password`, {
      email: TEST_EMAIL
    });
    
    console.log('✅ Password reset request successful');
    console.log(`   Message: ${forgotPasswordResponse.data.message}`);
    console.log(`   Note: ${forgotPasswordResponse.data.note}\n`);

    // Test 4: Development Reset Token Retrieval
    console.log('🛠️ Test 4: Development Reset Token Retrieval');
    const tokenResponse = await axios.get(`${BASE_URL}/auth/dev/reset-token/${TEST_EMAIL}`);
    
    const { token, minutesRemaining } = tokenResponse.data;
    console.log('✅ Reset token retrieved');
    console.log(`   Token: ${token.substring(0, 20)}...`);
    console.log(`   Expires in: ${minutesRemaining} minutes`);
    console.log(`   Complete Reset Link: http://localhost:3000/reset-password?token=${token}\n`);

    // Test 5: Password Reset
    console.log('🔐 Test 5: Password Reset');
    const newPassword = 'newpassword123_' + Date.now();
    const resetResponse = await axios.post(`${BASE_URL}/auth/reset-password`, {
      token: token,
      newPassword: newPassword
    });
    
    console.log('✅ Password reset successful');
    console.log(`   Message: ${resetResponse.data.message}`);
    console.log(`   Note: ${resetResponse.data.note}\n`);

    // Test 6: Login with New Password
    console.log('🚪 Test 6: Login with New Password');
    const newLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: newPassword
    });
    
    console.log('✅ Login with new password successful');
    console.log(`   User: ${newLoginResponse.data.user.name}`);
    console.log(`   Party Type: ${newLoginResponse.data.user.partyType}\n`);

    // Test 7: Verify Contract Access
    console.log('📊 Test 7: Verify Contract Access');
    const contractsResponse = await axios.get(`${BASE_URL}/contracts/user/9`, {
      headers: { 'Authorization': `Bearer ${newLoginResponse.data.accessToken}` }
    });
    
    console.log('✅ Contract access verified');
    console.log(`   Total contracts: ${contractsResponse.data.total}`);
    console.log(`   Contracts found: ${contractsResponse.data.contracts.length}\n`);

    console.log('🎉 All tests passed! The system is working correctly.');
    console.log('\n📋 Summary of Functionality:');
    console.log('   ✅ Email/password authentication works');
    console.log('   ✅ Contract creation without wallet connection works');
    console.log('   ✅ Forgot password flow works');
    console.log('   ✅ Development reset token retrieval works');
    console.log('   ✅ Password reset functionality works');
    console.log('   ✅ Login with new password works');
    console.log('   ✅ Contract access verification works');
    console.log('\n💡 Key Improvements Implemented:');
    console.log('   • No wallet connection required for enterprise users');
    console.log('   • Complete reset links shown in development mode');
    console.log('   • User ID-based contract creation');
    console.log('   • Proper authentication middleware');
    console.log('   • Enhanced user experience');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`   Status: ${error.response.status}`);
    }
    process.exit(1);
  }
}

// Run the test
testCompleteFunctionality(); 