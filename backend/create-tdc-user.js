/**
 * Create TDC User
 * 
 * This script creates a TDC (Training Data Consumer) user for testing purposes.
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function createTDCUser() {
  try {
    console.log('🚀 Creating TDC User...\n');

    // Create TDC User
    console.log('1️⃣ Creating TDC user...');
    const timestamp = Date.now();
    const tdcEmail = `tdc${timestamp}@example.com`;
    
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'AI Model Training Corp',
      email: tdcEmail,
      partyType: 'TDC',
      organization: 'AI Model Training Corporation',
      description: 'Leading AI model training company specializing in computer vision and NLP',
      phoneNumber: '+1-555-5678',
      website: 'https://aimodeltraining.com',
      location: 'Seattle, WA'
    });

    console.log('✅ TDC user created successfully!');
    console.log('   User ID:', registerResponse.data.user.id);
    console.log('   Email:', registerResponse.data.user.email);
    console.log('   Party Type:', registerResponse.data.user.partyType);
    console.log('   Organization:', registerResponse.data.user.organization);
    console.log('   Login credentials:', registerResponse.data.loginCredentials);

    // Test login
    console.log('\n2️⃣ Testing login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: tdcEmail,
      password: registerResponse.data.loginCredentials.password
    });

    console.log('✅ Login successful!');
    console.log('   Access Token:', loginResponse.data.accessToken ? 'Received' : 'Not received');

    console.log('\n🎉 TDC User Setup Completed!');
    console.log('\n📋 Summary:');
    console.log(`   TDC User: ${tdcEmail}`);
    console.log(`   Password: ${registerResponse.data.loginCredentials.password}`);
    console.log(`   User ID: ${registerResponse.data.user.id}`);
    console.log(`   Party Type: ${registerResponse.data.user.partyType}`);
    
    console.log('\n🔗 Test Commands:');
    console.log(`   Login: curl -X POST ${BASE_URL}/auth/login \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(`     -d '{"email": "${tdcEmail}", "password": "${registerResponse.data.loginCredentials.password}"}'`);
    
    console.log('\n   Get Profile: curl -X GET ${BASE_URL}/auth/profile \\');
    console.log(`     -H "Authorization: Bearer YOUR_TOKEN"`);

    console.log('\n   List Available Datasets: curl -X GET ${BASE_URL}/datasets \\');
    console.log(`     -H "Authorization: Bearer YOUR_TOKEN"`);

  } catch (error) {
    console.error('❌ Setup failed:', error.response?.data || error.message);
    
    if (error.response?.data) {
      console.error('   Error details:', error.response.data);
    }
  }
}

// Run the setup
createTDCUser(); 