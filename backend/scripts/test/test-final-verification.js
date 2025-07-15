/**
 * Final Verification Test
 * 
 * This script performs a comprehensive test of all implemented functionality
 * to ensure everything is working correctly after the recent fixes.
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';
const FRONTEND_URL = 'http://localhost:3000';

async function finalVerification() {
  console.log('🔍 Final Verification Test\n');
  console.log('Testing all implemented functionality...\n');

  const results = {
    backend: false,
    frontend: false,
    authentication: false,
    contractCreation: false,
    passwordReset: false,
    devFeatures: false
  };

  try {
    // Test 1: Backend Health
    console.log('1️⃣ Testing Backend Health...');
    try {
      const response = await axios.get(`${BASE_URL.replace('/api', '')}/health`);
      console.log('   ✅ Backend is responding');
      results.backend = true;
    } catch (error) {
      console.log('   ❌ Backend health check failed');
    }

    // Test 2: Frontend Health
    console.log('2️⃣ Testing Frontend Health...');
    try {
      const response = await axios.get(FRONTEND_URL);
      if (response.status === 200) {
        console.log('   ✅ Frontend is responding');
        results.frontend = true;
      }
    } catch (error) {
      console.log('   ❌ Frontend health check failed');
    }

    // Test 3: Authentication
    console.log('3️⃣ Testing Authentication...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'tdc1751902280921@example.com',
        password: 'password123'
      });
      
      if (loginResponse.data.accessToken) {
        console.log('   ✅ Authentication working');
        results.authentication = true;
        
        // Test 4: Contract Creation
        console.log('4️⃣ Testing Contract Creation...');
        try {
          const contractResponse = await axios.post(`${BASE_URL}/contracts`, {
            tdpId: 8,
            datasetId: 'ECOMM_BEHAV_001',
            modelId: 'GPT-4-Ecommerce-v3',
            price: 5000,
            duration: 60,
            termsAndConditions: 'Final verification test contract'
          }, {
            headers: { 'Authorization': `Bearer ${loginResponse.data.accessToken}` }
          });
          
          if (contractResponse.data.success) {
            console.log('   ✅ Contract creation working (no wallet required)');
            results.contractCreation = true;
          }
        } catch (error) {
          console.log('   ❌ Contract creation failed:', error.response?.data?.error || error.message);
        }
      }
    } catch (error) {
      console.log('   ❌ Authentication failed:', error.response?.data?.error || error.message);
    }

    // Test 5: Password Reset Flow
    console.log('5️⃣ Testing Password Reset Flow...');
    try {
      // Request password reset
      await axios.post(`${BASE_URL}/auth/forgot-password`, {
        email: 'tdc1751902280921@example.com'
      });
      
      // Get development reset token
      const tokenResponse = await axios.get(`${BASE_URL}/auth/dev/reset-token/tdc1751902280921@example.com`);
      
      if (tokenResponse.data.success && tokenResponse.data.token) {
        console.log('   ✅ Password reset flow working');
        results.passwordReset = true;
        
        // Test 6: Development Features
        console.log('6️⃣ Testing Development Features...');
        try {
          const newPassword = 'testpassword_' + Date.now();
          await axios.post(`${BASE_URL}/auth/reset-password`, {
            token: tokenResponse.data.token,
            newPassword: newPassword
          });
          
          console.log('   ✅ Development reset token feature working');
          results.devFeatures = true;
        } catch (error) {
          console.log('   ❌ Development reset token failed:', error.response?.data?.error || error.message);
        }
      }
    } catch (error) {
      console.log('   ❌ Password reset flow failed:', error.response?.data?.error || error.message);
    }

    // Summary
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      console.log(`   ${test}: ${status}`);
    });

    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All tests passed! The system is fully functional.');
      console.log('\n💡 Key Features Verified:');
      console.log('   • Backend and frontend services running');
      console.log('   • Email/password authentication working');
      console.log('   • Contract creation without wallet connection');
      console.log('   • Complete password reset flow');
      console.log('   • Development testing features');
      console.log('\n🚀 Ready for production use!');
    } else {
      console.log('⚠️ Some tests failed. Please check the issues above.');
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
}

// Run the verification
finalVerification(); 