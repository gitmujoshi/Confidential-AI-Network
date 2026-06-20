#!/usr/bin/env node

/**
 * Create Seed Users Script
 * 
 * This script creates essential test users and admin users using the API
 * to ensure proper synchronization between Keycloak and the database.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Load configuration
function loadConfig() {
  const configPath = path.join(__dirname, '..', 'config.env');
  const secretsPath = path.join(__dirname, '..', 'secrets.env');
  
  if (fs.existsSync(configPath)) {
    const configContent = fs.readFileSync(configPath, 'utf8');
    configContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    });
  }
  
  if (fs.existsSync(secretsPath)) {
    const secretsContent = fs.readFileSync(secretsPath, 'utf8');
    secretsContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    });
  }
}

// Load configuration
loadConfig();

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';

// Test users to create
const testUsers = [
  {
    name: 'Alice Johnson',
    email: 'alice@tdp.com',
    password: 'password123',
    partyType: 'TDP',
    role: 'TDP'
  },
  {
    name: 'Bob Smith',
    email: 'bob@tdc.com',
    password: 'password123',
    partyType: 'TDC',
    role: 'TDC'
  },
  {
    name: 'Carol Williams',
    email: 'carol@tsp.com',
    password: 'password123',
    partyType: 'TSP',
    role: 'TSP'
  },
  {
    name: 'David Admin',
    email: 'david@admin.com',
    password: 'password123',
    partyType: 'TDP',
    role: 'AppAdmin'
  },
  {
    name: 'Eve Brown',
    email: 'eve@tdp2.com',
    password: 'password123',
    partyType: 'TDP',
    role: 'TDP'
  },
  {
    name: 'Frank Davis',
    email: 'frank@tdc2.com',
    password: 'password123',
    partyType: 'TDC',
    role: 'TDC'
  }
];

async function createUser(userData) {
  try {
    console.log(`👤 Creating user: ${userData.name} (${userData.email})`);
    
    const response = await axios.post(`${BACKEND_URL}/api/auth/register`, {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      partyType: userData.partyType
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    if (response.data.success) {
      console.log(`✅ User created successfully: ${userData.email}`);
      return response.data;
    } else {
      console.log(`⚠️ User creation response: ${JSON.stringify(response.data)}`);
      return response.data;
    }
  } catch (error) {
    if (error.response) {
      console.log(`❌ Failed to create user ${userData.email}: ${error.response.data.message || error.response.data.error}`);
      if (error.response.data.details) {
        console.log(`   Details: ${JSON.stringify(error.response.data.details)}`);
      }
    } else {
      console.log(`❌ Failed to create user ${userData.email}: ${error.message}`);
    }
    return null;
  }
}

async function testLogin(email, password) {
  try {
    console.log(`🔐 Testing login for: ${email}`);
    
    const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: email,
      password: password
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    if (response.data.accessToken) {
      console.log(`✅ Login successful for: ${email}`);
      return response.data;
    } else {
      console.log(`❌ Login failed for: ${email}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Login test failed for ${email}: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

async function main() {
  console.log('🚀 Creating seed users...');
  console.log(`📡 Backend URL: ${BACKEND_URL}`);
  
  // Test backend connectivity
  try {
    await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 });
    console.log('✅ Backend is accessible');
  } catch (error) {
    console.log('❌ Backend is not accessible:', error.message);
    process.exit(1);
  }
  
  const createdUsers = [];
  
  // Create users
  for (const user of testUsers) {
    const result = await createUser(user);
    if (result) {
      createdUsers.push({ ...user, result });
    }
    // Small delay between user creations
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n📊 Summary: ${createdUsers.length}/${testUsers.length} users created`);
  
  // Test login for created users
  console.log('\n🔐 Testing logins...');
  const loginResults = [];
  
  for (const user of createdUsers) {
    const loginResult = await testLogin(user.email, user.password);
    if (loginResult) {
      loginResults.push({ email: user.email, success: true });
    } else {
      loginResults.push({ email: user.email, success: false });
    }
    // Small delay between login tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  const successfulLogins = loginResults.filter(r => r.success).length;
  console.log(`\n📊 Login Test Results: ${successfulLogins}/${loginResults.length} successful`);
  
  if (successfulLogins === loginResults.length) {
    console.log('🎉 All users created and login tests passed!');
  } else {
    console.log('⚠️ Some users failed login tests. Check the logs above.');
  }
  
  // Save user data for reference
  const userData = {
    created: createdUsers.length,
    total: testUsers.length,
    users: createdUsers.map(u => ({
      name: u.name,
      email: u.email,
      partyType: u.partyType,
      role: u.role
    })),
    loginResults: loginResults
  };
  
  fs.writeFileSync(
    path.join(__dirname, '..', 'fixtures', 'test-data', 'seed-users-data.json'),
    JSON.stringify(userData, null, 2)
  );
  
  console.log('💾 User data saved to fixtures/test-data/seed-users-data.json');
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = { createUser, testLogin, testUsers };
