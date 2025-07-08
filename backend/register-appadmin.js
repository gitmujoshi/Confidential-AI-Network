/**
 * Register AppAdmin User Script
 * 
 * This script registers the AppAdmin user in the local database
 * so it can be used for login via the API.
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function registerAppAdmin() {
  try {
    console.log('🚀 Registering AppAdmin user in local database...\n');

    // Register the AppAdmin user
    console.log('1️⃣ Registering AppAdmin user...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Application Administrator',
      email: 'appadmin@contractmanagement.com',
      partyType: 'AppAdmin',
      organization: 'Contract Management System',
      description: 'Application Administrator with full access to all functions',
      phoneNumber: '+1-555-0000',
      website: 'https://contractmanagement.com',
      location: 'System'
    });

    console.log('✅ AppAdmin user registered successfully!');
    console.log('   User ID:', registerResponse.data.user.id);
    console.log('   Email:', registerResponse.data.user.email);
    console.log('   Party Type:', registerResponse.data.user.partyType);
    console.log('   Login credentials:', registerResponse.data.loginCredentials);

    // Test login with the registered user
    console.log('\n2️⃣ Testing login with AppAdmin user...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'appadmin@contractmanagement.com',
      password: registerResponse.data.loginCredentials.password
    });

    console.log('✅ Login successful!');
    console.log('   Access Token:', loginResponse.data.accessToken ? 'Present' : 'Missing');
    console.log('   User Info:', loginResponse.data.user.name);

    // Test profile access
    console.log('\n3️⃣ Testing profile access...');
    const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${loginResponse.data.accessToken}`
      }
    });

    console.log('✅ Profile access successful!');
    console.log('   User Role:', profileResponse.data.user.partyType);
    console.log('   Email Verified:', profileResponse.data.user.emailVerified);

    console.log('\n🎉 AppAdmin user setup completed successfully!');
    console.log('\n📋 AppAdmin User Summary:');
    console.log('   Email: appadmin@contractmanagement.com');
    console.log('   Password: (use the temporary password from registration)');
    console.log('   Party Type: AppAdmin');
    console.log('   Status: Active and ready for use');

    console.log('\n🔗 Test Commands:');
    console.log('   Login: curl -X POST http://localhost:5001/api/auth/login \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"email": "appadmin@contractmanagement.com", "password": "TEMP_PASSWORD"}\'');

  } catch (error) {
    console.error('❌ AppAdmin registration failed:', error.response?.data || error.message);
    
    if (error.response?.data) {
      console.error('   Error details:', error.response.data);
    }
  }
}

// Run the registration
registerAppAdmin(); 