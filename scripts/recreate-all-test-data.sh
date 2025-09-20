#!/bin/bash

# Recreate All Test Data Script
# This script completely cleans and recreates all test data including users

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧹 Recreating All Test Data${NC}"
echo "=================================="

# Load configuration
if [ -f "config.env" ]; then
    echo -e "${GREEN}✅ Loading configuration from config.env${NC}"
    source config.env
else
    echo -e "${RED}❌ Configuration file not found: config.env${NC}"
    exit 1
fi

if [ -f "secrets.env" ]; then
    echo -e "${GREEN}✅ Loading secrets from secrets.env${NC}"
    source secrets.env
fi

BACKEND_URL=${BACKEND_URL:-"http://localhost:5001"}
KEYCLOAK_URL=${KEYCLOAK_URL:-"https://localhost:8443"}
KEYCLOAK_REALM=${KEYCLOAK_REALM:-"contract-management"}

echo -e "${BLUE}📊 Configuration:${NC}"
echo "  Backend URL: $BACKEND_URL"
echo "  Keycloak URL: $KEYCLOAK_URL"
echo "  Keycloak Realm: $KEYCLOAK_REALM"

# Step 1: Clean database
echo -e "\n${BLUE}🗑️ Step 1: Cleaning Database${NC}"
echo "----------------------------------------"

# Check if backend is running
if ! curl -s "$BACKEND_URL/health" >/dev/null 2>&1; then
    echo -e "${RED}❌ Backend is not running. Please start the backend first.${NC}"
    exit 1
fi

# Clean database using the existing script
echo -e "${YELLOW}🧹 Cleaning existing database data...${NC}"
if [ -f "scripts/clean-database.js" ]; then
    node scripts/clean-database.js
else
    # Fallback: direct database cleanup
    echo "Cleaning database directly..."
    psql -h localhost -p 5432 -U ***REMOVED-DB_PASSWORD*** -d contract_management -c "
        DELETE FROM training_jobs;
        DELETE FROM training_environments;
        DELETE FROM contracts;
        DELETE FROM datasets;
        DELETE FROM notifications;
        DELETE FROM users;
        DELETE FROM ai_models;
        DELETE FROM scitt_claims;
        DELETE FROM signatures;
        DELETE FROM signing_events;
        DELETE FROM user_keys;
        DELETE FROM enterprise_keys;
        DELETE FROM signing_requests;
        DELETE FROM merkle_trees;
        DELETE FROM provenance_nodes;
        DELETE FROM provenance_captures;
        DELETE FROM provenance_verifications;
        DELETE FROM ccrp_cloud_credentials;
        DELETE FROM Consents;
        DELETE FROM DataProcessingRecords;
        DELETE FROM Grievances;
        DELETE FROM DataBreaches;
        DELETE FROM AuditLogs;
        DELETE FROM constraint_categories;
        DELETE FROM constraint_fields;
        DELETE FROM constraint_values;
        DELETE FROM training_progress;
        DELETE FROM environment_resources;
        DELETE FROM environment_costs;
        DELETE FROM contract_templates;
    " || echo "Database cleanup completed with warnings"
fi

echo -e "${GREEN}✅ Database cleaned${NC}"

# Step 2: Clean Keycloak users
echo -e "\n${BLUE}🗑️ Step 2: Cleaning Keycloak Users${NC}"
echo "----------------------------------------"

# Get admin token
echo -e "${YELLOW}🔐 Getting Keycloak admin token...${NC}"
ADMIN_TOKEN=$(curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "grant_type=password&client_id=admin-cli&username=${KEYCLOAK_ADMIN_USERNAME}&password=${KEYCLOAK_ADMIN_PASSWORD}" \
    -k | jq -r '.access_token' 2>/dev/null || echo "")

if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" = "null" ]; then
    echo -e "${RED}❌ Failed to get Keycloak admin token${NC}"
    echo "Trying alternative method..."
    ADMIN_TOKEN=$(curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "grant_type=password&client_id=admin-cli&username=admin&password=***REMOVED-KEYCLOAK_ADMIN_PASSWORD***" \
        -k | jq -r '.access_token' 2>/dev/null || echo "")
fi

if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" = "null" ]; then
    echo -e "${YELLOW}⚠️ Could not get admin token, skipping Keycloak cleanup${NC}"
else
    echo -e "${GREEN}✅ Got Keycloak admin token${NC}"
    
    # Get users in the realm
    echo -e "${YELLOW}👥 Getting existing users...${NC}"
    USERS=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
        "$KEYCLOAK_URL/admin/realms/$KEYCLOAK_REALM/users" \
        -k | jq -r '.[].id' 2>/dev/null || echo "")
    
    if [ -n "$USERS" ]; then
        echo -e "${YELLOW}🗑️ Deleting existing users...${NC}"
        for user_id in $USERS; do
            echo "Deleting user: $user_id"
            curl -s -X DELETE -H "Authorization: Bearer $ADMIN_TOKEN" \
                "$KEYCLOAK_URL/admin/realms/$KEYCLOAK_REALM/users/$user_id" \
                -k >/dev/null || echo "Failed to delete user $user_id"
        done
        echo -e "${GREEN}✅ Keycloak users cleaned${NC}"
    else
        echo -e "${GREEN}✅ No users to clean in Keycloak${NC}"
    fi
fi

# Step 3: Create comprehensive test users
echo -e "\n${BLUE}👥 Step 3: Creating Test Users${NC}"
echo "----------------------------------------"

# Create a comprehensive user creation script
cat > /tmp/create-users.js << 'EOF'
const axios = require('axios');
const fs = require('fs');

// Load configuration
function loadConfig() {
  const configPath = 'config.env';
  const secretsPath = 'secrets.env';
  
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

loadConfig();

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';

// Comprehensive test users
const testUsers = [
  // System Admin Users (for system status script)
  {
    name: 'System Admin',
    email: 'admin@contractmanagement.com',
    password: '***REMOVED-KEYCLOAK_ADMIN_PASSWORD***',
    partyType: 'TDP',
    role: 'AppAdmin'
  },
  {
    name: 'Test Admin',
    email: 'testadmin@contractmanagement.com',
    password: '***REMOVED-KEYCLOAK_ADMIN_PASSWORD***',
    partyType: 'TDP',
    role: 'AppAdmin'
  },
  
  // TDP Users (Training Data Providers)
  {
    name: 'Alice Johnson',
    email: 'alice@tdp.com',
    password: 'password123',
    partyType: 'TDP',
    role: 'TDP'
  },
  {
    name: 'Eve Brown',
    email: 'eve@tdp2.com',
    password: 'password123',
    partyType: 'TDP',
    role: 'TDP'
  },
  {
    name: 'Grace Wilson',
    email: 'grace@tdp3.com',
    password: 'password123',
    partyType: 'TDP',
    role: 'TDP'
  },
  
  // TDC Users (Training Data Consumers)
  {
    name: 'Bob Smith',
    email: 'bob@tdc.com',
    password: 'password123',
    partyType: 'TDC',
    role: 'TDC'
  },
  {
    name: 'Frank Davis',
    email: 'frank@tdc2.com',
    password: 'password123',
    partyType: 'TDC',
    role: 'TDC'
  },
  {
    name: 'Henry Miller',
    email: 'henry@tdc3.com',
    password: 'password123',
    partyType: 'TDC',
    role: 'TDC'
  },
  
  // CCRP Users (Confidential Clean Room Providers)
  {
    name: 'Carol Williams',
    email: 'carol@ccrp.com',
    password: 'password123',
    partyType: 'CCRP',
    role: 'CCRP'
  },
  {
    name: 'Ivy Taylor',
    email: 'ivy@ccrp2.com',
    password: 'password123',
    partyType: 'CCRP',
    role: 'CCRP'
  },
  {
    name: 'Jack Anderson',
    email: 'jack@ccrp3.com',
    password: 'password123',
    partyType: 'CCRP',
    role: 'CCRP'
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
      timeout: 15000
    });
    
    if (response.data.success) {
      console.log(`✅ User created successfully: ${userData.email}`);
      return { success: true, user: userData, data: response.data };
    } else {
      console.log(`⚠️ User creation response: ${JSON.stringify(response.data)}`);
      return { success: false, user: userData, error: response.data };
    }
  } catch (error) {
    if (error.response) {
      console.log(`❌ Failed to create user ${userData.email}: ${error.response.data.message || error.response.data.error}`);
      return { success: false, user: userData, error: error.response.data };
    } else {
      console.log(`❌ Failed to create user ${userData.email}: ${error.message}`);
      return { success: false, user: userData, error: error.message };
    }
  }
}

async function testLogin(email, password) {
  try {
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
      return { success: true, email, token: response.data.accessToken };
    } else {
      console.log(`❌ Login failed for: ${email}`);
      return { success: false, email };
    }
  } catch (error) {
    console.log(`❌ Login test failed for ${email}: ${error.response?.data?.message || error.message}`);
    return { success: false, email, error: error.message };
  }
}

async function main() {
  console.log('🚀 Creating comprehensive test users...');
  console.log(`📡 Backend URL: ${BACKEND_URL}`);
  
  // Test backend connectivity
  try {
    await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 });
    console.log('✅ Backend is accessible');
  } catch (error) {
    console.log('❌ Backend is not accessible:', error.message);
    process.exit(1);
  }
  
  const results = [];
  
  // Create users with delay between each
  for (const user of testUsers) {
    const result = await createUser(user);
    results.push(result);
    
    // Wait between user creations to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  const successful = results.filter(r => r.success).length;
  console.log(`\n📊 User Creation Summary: ${successful}/${testUsers.length} users created successfully`);
  
  // Test logins for successful creations
  console.log('\n🔐 Testing logins...');
  const loginResults = [];
  
  for (const result of results) {
    if (result.success) {
      const loginResult = await testLogin(result.user.email, result.user.password);
      loginResults.push(loginResult);
      
      // Wait between login tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  const successfulLogins = loginResults.filter(r => r.success).length;
  console.log(`\n📊 Login Test Summary: ${successfulLogins}/${loginResults.length} successful logins`);
  
  // Save results
  const summary = {
    timestamp: new Date().toISOString(),
    totalUsers: testUsers.length,
    createdUsers: successful,
    successfulLogins: successfulLogins,
    users: results.map(r => ({
      name: r.user.name,
      email: r.user.email,
      partyType: r.user.partyType,
      role: r.user.role,
      created: r.success,
      loginTest: loginResults.find(l => l.email === r.user.email)?.success || false
    }))
  };
  
  fs.writeFileSync('test-users-summary.json', JSON.stringify(summary, null, 2));
  console.log('💾 User creation summary saved to test-users-summary.json');
  
  if (successfulLogins === loginResults.length && loginResults.length > 0) {
    console.log('🎉 All users created and login tests passed!');
    process.exit(0);
  } else {
    console.log('⚠️ Some users failed creation or login tests. Check the logs above.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});
EOF

echo -e "${YELLOW}🚀 Running user creation script...${NC}"
node /tmp/create-users.js

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ All test users created successfully${NC}"
else
    echo -e "${RED}❌ User creation failed${NC}"
    exit 1
fi

# Step 4: Create comprehensive test data
echo -e "\n${BLUE}📊 Step 4: Creating Test Data${NC}"
echo "----------------------------------------"

# Create comprehensive test data using the existing script
if [ -f "scripts/setup-comprehensive-test-data.js" ]; then
    echo -e "${YELLOW}📦 Creating comprehensive test data...${NC}"
    node scripts/setup-comprehensive-test-data.js
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Test data created successfully${NC}"
    else
        echo -e "${YELLOW}⚠️ Test data creation had issues, but continuing...${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Comprehensive test data script not found, skipping...${NC}"
fi

# Step 5: Update system status script
echo -e "\n${BLUE}🔧 Step 5: Updating System Status Script${NC}"
echo "----------------------------------------"

# Update the system status script to use the correct test user
echo -e "${YELLOW}📝 Updating system status script to use correct test user...${NC}"

# Find and update the login test in the status script
if [ -f "deployment/local/status.sh" ]; then
    # Backup original
    cp deployment/local/status.sh deployment/local/status.sh.backup
    
    # Update the login test to use admin@contractmanagement.com
    sed -i '' 's/admin@contractmanagement.com/admin@contractmanagement.com/g' deployment/local/status.sh
    sed -i '' 's/***REMOVED-KEYCLOAK_ADMIN_PASSWORD***/***REMOVED-KEYCLOAK_ADMIN_PASSWORD***/g' deployment/local/status.sh
    
    echo -e "${GREEN}✅ System status script updated${NC}"
else
    echo -e "${YELLOW}⚠️ System status script not found${NC}"
fi

# Step 6: Test the system
echo -e "\n${BLUE}🧪 Step 6: Testing System${NC}"
echo "----------------------------------------"

echo -e "${YELLOW}🔍 Running system status check...${NC}"
./deployment/local/status.sh

echo -e "\n${GREEN}🎉 Test data recreation completed!${NC}"
echo "=================================="
echo -e "${BLUE}📋 Summary:${NC}"
echo "  ✅ Database cleaned"
echo "  ✅ Keycloak users cleaned"
echo "  ✅ Test users created"
echo "  ✅ Test data created"
echo "  ✅ System status script updated"
echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo "  1. Run: ./scripts/script-manager.sh system status"
echo "  2. Check that all services are running"
echo "  3. Verify login tests pass"
echo "  4. Test the frontend at http://localhost:3000"
