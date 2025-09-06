#!/usr/bin/env node

/**
 * Create Test Users - Working Version
 * This script creates test users using the working Keycloak admin CLI approach
 * and then creates the corresponding database records
 */

const axios = require('axios');
const { User } = require('../models');

// Configuration
const CONFIG = {
  keycloakUrl: '${KEYCLOAK_URL:-https://localhost:8443}',
  keycloakRealm: 'contract-management',
  backendUrl: '${BACKEND_URL:-http://localhost:5001}',
  adminUsername: 'admin',
  adminPassword: 'admin123'
};

// Test users configuration
const testUsers = [
  {
    name: 'MedData Solutions Inc.',
    email: 'tdp.medical@example.com',
    partyType: 'TDP',
    organization: 'MedData Solutions Inc.',
    description: 'Healthcare data provider specializing in medical imaging datasets'
  },
  {
    name: 'NLP Research Foundation',
    email: 'tdp.nlp@example.com',
    partyType: 'TDP',
    organization: 'NLP Research Foundation',
    description: 'Natural language processing datasets for research and development'
  },
  {
    name: 'AutoDrive Technologies',
    email: 'tdp.autodrive@example.com',
    partyType: 'TDP',
    organization: 'AutoDrive Technologies',
    description: 'Autonomous vehicle training data and sensor datasets'
  },
  {
    name: 'AI Healthcare Innovations',
    email: 'tdc.healthcare@example.com',
    partyType: 'TDC',
    organization: 'AI Healthcare Innovations',
    description: 'AI-powered healthcare solutions company'
  },
  {
    name: 'FinTech Analytics Corp',
    email: 'tdc.fintech@example.com',
    partyType: 'TDC',
    organization: 'FinTech Analytics Corp',
    description: 'Financial technology and analytics solutions'
  },
  {
    name: 'Language AI Labs',
    email: 'tdc.language@example.com',
    partyType: 'TDC',
    organization: 'Language AI Labs',
    description: 'Advanced language AI research and development'
  },
  {
    name: 'SecureCloud Confidential Computing',
    email: 'ccrp.securecloud@example.com',
    partyType: 'CCRP',
    organization: 'SecureCloud Confidential Computing',
    description: 'Secure cloud infrastructure for confidential computing'
  },
  {
    name: 'TrustedAI Environment Provider',
    email: 'ccrp.trustedai@example.com',
    partyType: 'CCRP',
    organization: 'TrustedAI Environment Provider',
    description: 'Trusted AI training environments with security guarantees'
  },
  {
    name: 'PrivacyFirst Computing Solutions',
    email: 'ccrp.privacyfirst@example.com',
    partyType: 'CCRP',
    organization: 'PrivacyFirst Computing Solutions',
    description: 'Privacy-first computing infrastructure and services'
  }
];

/**
 * Get admin token from Keycloak
 */
async function getAdminToken() {
  try {
    const response = await axios.post(
      `${CONFIG.keycloakUrl}/realms/master/protocol/openid-connect/token`,
      `grant_type=password&client_id=admin-cli&username=${CONFIG.adminUsername}&password=${CONFIG.adminPassword}`,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
      }
    );
    return response.data.access_token;
  } catch (error) {
    throw new Error(`Failed to get admin token: ${error.message}`);
  }
}

/**
 * Create user in Keycloak
 */
async function createKeycloakUser(userData, adminToken) {
  try {
    const keycloakUserData = {
      username: userData.email,
      email: userData.email,
      firstName: userData.name.split(' ')[0] || '',
      lastName: userData.name.split(' ').slice(1).join(' ') || '',
      enabled: true,
      emailVerified: false,
      credentials: [{
        type: 'password',
        value: 'password123',
        temporary: false
      }],
      attributes: {
        partyType: [userData.partyType],
        organization: [userData.organization || ''],
        description: [userData.description || '']
      }
    };

    const response = await axios.post(
      `${CONFIG.keycloakUrl}/admin/realms/${CONFIG.keycloakRealm}/users`,
      keycloakUserData,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
      }
    );

    // Get the created user ID from the Location header
    const locationHeader = response.headers.location;
    const userId = locationHeader.split('/').pop();

    return userId;
  } catch (error) {
    throw new Error(`Failed to create Keycloak user: ${error.message}`);
  }
}

/**
 * Create user in database
 */
async function createDatabaseUser(userData, keycloakUserId) {
  try {
    // Generate DEPA ID
    const DEPAIdService = require('../services/depaIdService');
    const depaIdService = new DEPAIdService();
    const depaId = depaIdService.generateUserDEPAId(userData.partyType);

    // Generate DID
    const domain = userData.email.split('@')[1] || 'example.com';
    const did = `did:web:${domain}:user:${userData.email.split('@')[0]}`;

    const user = await User.create({
      walletAddress: null,
      publicKey: null,
      partyType: userData.partyType,
      name: userData.name,
      email: userData.email.toLowerCase(),
      description: userData.description || '',
      organization: userData.organization || '',
      phoneNumber: null,
      website: null,
      location: null,
      did,
      didSource: 'SYSTEM_GENERATED',
      didVerified: true,
      didVerificationMethod: 'SYSTEM_GENERATED',
      depaId,
      isRegistered: true,
      registrationDate: new Date(),
      isActive: true,
      onboardingStatus: 'IN_PROGRESS',
      profileCompleted: false,
      emailVerified: false,
      iamUserId: keycloakUserId,
      iamUsername: userData.email
    });

    return user;
  } catch (error) {
    throw new Error(`Failed to create database user: ${error.message}`);
  }
}

/**
 * Test user login
 */
async function testUserLogin(email) {
  try {
    const response = await axios.post(
      `${CONFIG.backendUrl}/api/auth/login`,
      {
        email: email,
        password: 'password123'
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    return response.data;
  } catch (error) {
    return { error: error.response?.data || error.message };
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Starting Test User Creation (Working Version)...\n');
    
    // Get admin token
    console.log('🔑 Getting admin token...');
    const adminToken = await getAdminToken();
    console.log('✅ Admin token retrieved successfully\n');
    
    const results = {
      created: [],
      failed: [],
      total: testUsers.length
    };

    for (const userData of testUsers) {
      try {
        console.log(`👤 Creating user: ${userData.email}`);
        
        // Step 1: Create user in Keycloak
        console.log('   🔐 Creating in Keycloak...');
        const keycloakUserId = await createKeycloakUser(userData, adminToken);
        console.log(`   ✅ Keycloak user created: ${keycloakUserId}`);
        
        // Step 2: Create user in database
        console.log('   🗄️ Creating in database...');
        const dbUser = await createDatabaseUser(userData, keycloakUserId);
        console.log(`   ✅ Database user created: ${dbUser.id}`);
        
        // Step 3: Test login
        console.log('   🔐 Testing login...');
        const loginResult = await testUserLogin(userData.email);
        
        if (loginResult.token) {
          console.log('   ✅ Login successful');
          results.created.push({
            email: userData.email,
            partyType: userData.partyType,
            keycloakUserId,
            dbUserId: dbUser.id,
            loginWorking: true
          });
        } else {
          console.log('   ❌ Login failed:', loginResult.error);
          results.created.push({
            email: userData.email,
            partyType: userData.partyType,
            keycloakUserId,
            dbUserId: dbUser.id,
            loginWorking: false,
            loginError: loginResult.error
          });
        }
        
        console.log(`✅ User ${userData.email} completed successfully\n`);
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log(`❌ Failed to create user ${userData.email}: ${error.message}\n`);
        results.failed.push({
          email: userData.email,
          partyType: userData.partyType,
          error: error.message
        });
      }
    }

    // Print summary
    console.log('📊 Test User Creation Summary:');
    console.log('================================');
    console.log(`✅ Successfully created: ${results.created.length}/${results.total}`);
    console.log(`❌ Failed: ${results.failed.length}/${results.total}`);
    
    if (results.created.length > 0) {
      console.log('\n✅ Successfully Created Users:');
      results.created.forEach(user => {
        const status = user.loginWorking ? '🔐 LOGIN WORKING' : '⚠️ LOGIN ISSUE';
        console.log(`   - ${user.email} (${user.partyType}) - ${status}`);
        if (!user.loginWorking && user.loginError) {
          console.log(`     Login error: ${user.loginError}`);
        }
      });
    }
    
    if (results.failed.length > 0) {
      console.log('\n❌ Failed to Create Users:');
      results.failed.forEach(user => {
        console.log(`   - ${user.email} (${user.partyType}): ${user.error}`);
      });
    }

    // Final summary
    const workingLogins = results.created.filter(u => u.loginWorking).length;
    console.log('\n🎉 Test User Creation Complete!');
    console.log('===============================');
    console.log(`📝 Created ${results.created.length} test users`);
    console.log(`🔐 Working logins: ${workingLogins}/${results.created.length}`);
    console.log(`\n💡 Test users can now be used with password: password123`);
    
  } catch (error) {
    console.log(`❌ Script execution failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { createTestUsers: main };
