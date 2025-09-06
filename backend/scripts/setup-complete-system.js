/**
 * Complete System Setup Script
 * 
 * This script handles ALL the recurring setup issues:
 * 1. Keycloak realm and client setup
 * 2. Database setup and user creation
 * 3. User synchronization between database and Keycloak
 * 4. Environment validation
 * 5. End-to-end testing
 * 
 * Usage: node scripts/setup-complete-system.js
 */

const axios = require('axios');
const { Sequelize } = require('sequelize');
require('dotenv').config({ path: './config.env' });

// Configure axios for HTTPS (ignore SSL in development)
const httpsAgent = new (require('https').Agent)({
  rejectUnauthorized: false
});

axios.defaults.httpsAgent = httpsAgent;

// Configuration
const KEYCLOAK_BASE_URL = '${KEYCLOAK_URL:-https://localhost:8443}';
const KEYCLOAK_REALM = 'contract-management';
const KEYCLOAK_ADMIN_USERNAME = 'admin';
const KEYCLOAK_ADMIN_PASSWORD = '***REMOVED-KEYCLOAK_ADMIN_PASSWORD***';
const BACKEND_URL = '${BACKEND_URL:-http://localhost:5001}';

// Test users configuration
const testUsers = [
  {
    name: 'MedData Solutions Inc.',
    email: 'tdp.medical@example.com',
    partyType: 'TDP',
    password: 'password123'
  },
  {
    name: 'NLP Research Foundation',
    email: 'tdp.nlp@example.com',
    partyType: 'TDP',
    password: 'password123'
  },
  {
    name: 'AutoDrive Technologies',
    email: 'tdp.autodrive@example.com',
    partyType: 'TDP',
    password: 'password123'
  },
  {
    name: 'AI Healthcare Innovations',
    email: 'tdc.healthcare@example.com',
    partyType: 'TDC',
    password: 'password123'
  },
  {
    name: 'FinTech Analytics Corp',
    email: 'tdc.fintech@example.com',
    partyType: 'TDC',
    password: 'password123'
  },
  {
    name: 'Language AI Labs',
    email: 'tdc.language@example.com',
    partyType: 'TDC',
    password: 'password123'
  },
  {
    name: 'SecureCloud Confidential Computing',
    email: 'ccrp.securecloud@example.com',
    partyType: 'CCRP',
    password: 'password123'
  },
  {
    name: 'TrustedAI Environment Provider',
    email: 'ccrp.trustedai@example.com',
    partyType: 'CCRP',
    password: 'password123'
  },
  {
    name: 'PrivacyFirst Computing Solutions',
    email: 'ccrp.privacyfirst@example.com',
    partyType: 'CCRP',
    password: 'password123'
  }
];

// Step 1: Check system prerequisites
async function checkPrerequisites() {
  console.log('🔍 Checking system prerequisites...');
  
  try {
    // Check if backend is running
    const backendResponse = await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 });
    console.log('✅ Backend is running');
  } catch (error) {
    console.error('❌ Backend is not running. Please start the backend first.');
    console.log('💡 Start backend with: npm start');
    process.exit(1);
  }
  
  console.log('✅ Backend prerequisite met, proceeding with Keycloak setup...');
}

// Step 2: Setup Keycloak realm and client
async function setupKeycloak() {
  console.log('\n🔧 Setting up Keycloak...');
  
  // Get admin token
  const adminTokenResponse = await axios.post(`${KEYCLOAK_BASE_URL}/realms/master/protocol/openid-connect/token`, 
    new URLSearchParams({
      username: KEYCLOAK_ADMIN_USERNAME,
      password: KEYCLOAK_ADMIN_PASSWORD,
      grant_type: 'password',
      client_id: 'admin-cli'
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }
  );
  
  const adminToken = adminTokenResponse.data.access_token;
  console.log('✅ Admin token obtained');
  
  // Create realm
  try {
    await axios.post(`${KEYCLOAK_BASE_URL}/admin/realms`, {
      realm: KEYCLOAK_REALM,
      enabled: true,
      displayName: 'Contract Management System'
    }, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Realm created');
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('ℹ️ Realm already exists');
    } else {
      throw error;
    }
  }
  
  // Create client
  try {
    await axios.post(`${KEYCLOAK_BASE_URL}/admin/realms/${KEYCLOAK_REALM}/clients`, {
      clientId: 'contract-management-client',
      name: 'Contract Management Client',
      enabled: true,
      publicClient: true,
      standardFlowEnabled: true,
      directAccessGrantsEnabled: true,
      redirectUris: ['${FRONTEND_URL:-http://localhost:3000}/*'],
      webOrigins: ['${FRONTEND_URL:-http://localhost:3000}']
    }, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Client created');
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('ℹ️ Client already exists');
    } else {
      throw error;
    }
  }
  
  // Create roles
  const roles = ['TDP', 'TDC', 'CCRP', 'AppAdmin'];
  for (const role of roles) {
    try {
      await axios.post(`${KEYCLOAK_BASE_URL}/admin/realms/${KEYCLOAK_REALM}/roles`, {
        name: role,
        description: `${role} role`
      }, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(`✅ Role ${role} created`);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log(`ℹ️ Role ${role} already exists`);
      } else {
        throw error;
      }
    }
  }
  
  console.log('✅ Keycloak setup completed');
}

// Step 3: Create users in database and Keycloak
async function createUsers() {
  console.log('\n👥 Creating users...');
  
  const { User } = require('../models');
  
  // Get admin token for Keycloak
  const adminTokenResponse = await axios.post(`${KEYCLOAK_BASE_URL}/realms/master/protocol/openid-connect/token`, 
    new URLSearchParams({
      username: KEYCLOAK_ADMIN_USERNAME,
      password: KEYCLOAK_ADMIN_PASSWORD,
      grant_type: 'password',
      client_id: 'admin-cli'
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }
  );
  
  const adminToken = adminTokenResponse.data.access_token;
  
  for (const userData of testUsers) {
    try {
      console.log(`👤 Creating user: ${userData.email}`);
      
      // Create user in database
      const dbUser = await User.create({
        name: userData.name,
        email: userData.email,
        partyType: userData.partyType,
        isActive: true,
        emailVerified: true,
        profileCompleted: true,
        onboardingStatus: 'COMPLETED'
      });
      
      // Create user in Keycloak
      const ***REMOVED-KEYCLOAK_DB_PASSWORD***UserResponse = await axios.post(`${KEYCLOAK_BASE_URL}/admin/realms/${KEYCLOAK_REALM}/users`, {
        username: userData.email,
        email: userData.email,
        firstName: userData.name.split(' ')[0],
        lastName: userData.name.split(' ').slice(1).join(' ') || '',
        enabled: true,
        emailVerified: true,
        credentials: [{
          type: 'password',
          value: userData.password,
          temporary: false
        }],
        attributes: {
          partyType: [userData.partyType]
        }
      }, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const ***REMOVED-KEYCLOAK_DB_PASSWORD***UserId = ***REMOVED-KEYCLOAK_DB_PASSWORD***UserResponse.headers.location.split('/').pop();
      
      // Assign role in Keycloak
      const roleResponse = await axios.get(
        `${KEYCLOAK_BASE_URL}/admin/realms/${KEYCLOAK_REALM}/roles/${userData.partyType}`,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      await axios.post(
        `${KEYCLOAK_BASE_URL}/admin/realms/${KEYCLOAK_REALM}/users/${***REMOVED-KEYCLOAK_DB_PASSWORD***UserId}/role-mappings/realm`,
        [roleResponse.data],
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Update database user with Keycloak info
      await dbUser.update({
        iamUserId: ***REMOVED-KEYCLOAK_DB_PASSWORD***UserId,
        iamUsername: userData.email
      });
      
      console.log(`✅ User ${userData.email} created successfully`);
      
    } catch (error) {
      console.error(`❌ Failed to create user ${userData.email}:`, error.message);
    }
  }
  
  console.log('✅ User creation completed');
}

// Step 4: Test authentication
async function testAuthentication() {
  console.log('\n🧪 Testing authentication...');
  
  let successCount = 0;
  let totalCount = testUsers.length;
  
  for (const userData of testUsers) {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        email: userData.email,
        password: userData.password
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.data.accessToken) {
        console.log(`✅ ${userData.email} - Authentication successful`);
        successCount++;
      } else {
        console.log(`❌ ${userData.email} - Authentication failed`);
      }
    } catch (error) {
      console.log(`❌ ${userData.email} - Authentication failed: ${error.response?.data?.error || error.message}`);
    }
  }
  
  console.log(`\n📊 Authentication Test Results:`);
  console.log(`✅ Successful: ${successCount}/${totalCount}`);
  console.log(`❌ Failed: ${totalCount - successCount}/${totalCount}`);
  
  if (successCount === totalCount) {
    console.log('🎉 All authentication tests passed!');
  } else {
    console.log('⚠️ Some authentication tests failed');
  }
}

// Step 5: Generate setup summary
async function generateSummary() {
  console.log('\n📋 Setup Summary:');
  console.log('==================');
  console.log('🔧 Keycloak Configuration:');
  console.log(`   Realm: ${KEYCLOAK_REALM}`);
  console.log(`   Client ID: contract-management-client`);
  console.log(`   Client Type: Public (no secret)`);
  console.log(`   Admin Console: http://localhost:8080`);
  console.log(`   Admin Username: ${KEYCLOAK_ADMIN_USERNAME}`);
  console.log(`   Admin Password: ${KEYCLOAK_ADMIN_PASSWORD}`);
  
  console.log('\n👥 Test Users:');
  testUsers.forEach(user => {
    console.log(`   ${user.email} (${user.partyType}) - password: ${user.password}`);
  });
  
  console.log('\n🔗 Backend Configuration:');
  console.log(`   URL: ${BACKEND_URL}`);
  console.log(`   Health Check: ${BACKEND_URL}/health`);
  console.log(`   Login Endpoint: ${BACKEND_URL}/api/auth/login`);
  
  console.log('\n📝 Next Steps:');
  console.log('1. Start the frontend: cd ../frontend && npm start');
  console.log('2. Test login with any of the test users above');
  console.log('3. Check role-based dashboards work correctly');
}

// Main execution
async function setupCompleteSystem() {
  try {
    console.log('🚀 Starting Complete System Setup...\n');
    
    await checkPrerequisites();
    await setupKeycloak();
    await createUsers();
    await testAuthentication();
    await generateSummary();
    
    console.log('\n🎉 Complete system setup finished successfully!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  setupCompleteSystem();
}

module.exports = { setupCompleteSystem }; 