#!/usr/bin/env node

/**
 * Auto-Fix Keycloak Issues
 * 
 * This script automatically detects and fixes common Keycloak configuration issues
 * that cause authentication failures. It's designed to be run whenever you
 * encounter authentication problems.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './config.env' });

class KeycloakAutoFix {
  constructor() {
    this.baseUrl = process.env.KEYCLOAK_URL || 'http://localhost:8080';
    this.realm = process.env.KEYCLOAK_REALM || 'contract-management';
    this.adminUsername = process.env.KEYCLOAK_ADMIN_USER || 'admin';
    this.adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD || '***REMOVED-KEYCLOAK_ADMIN_PASSWORD***';
    this.clientId = process.env.KEYCLOAK_CLIENT_ID || 'contract-management-frontend';
  }

  async getAdminToken() {
    try {
      const response = await axios.post(`${this.baseUrl}/realms/master/protocol/openid-connect/token`,
        `grant_type=password&client_id=admin-cli&username=${this.adminUsername}&password=${this.adminPassword}`,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      return response.data.access_token;
    } catch (error) {
      throw new Error(`Failed to get admin token: ${error.response?.data?.error_description || error.message}`);
    }
  }

  async checkRealmExists(token) {
    try {
      const response = await axios.get(`${this.baseUrl}/admin/realms/${this.realm}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async createRealm(token) {
    console.log('📝 Creating realm...');
    await axios.post(`${this.baseUrl}/admin/realms`, {
      realm: this.realm,
      enabled: true,
      displayName: 'Contract Management System'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Realm created');
  }

  async checkClientExists(token, clientId) {
    try {
      const response = await axios.get(`${this.baseUrl}/admin/realms/${this.realm}/clients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data.some(client => client.clientId === clientId);
    } catch (error) {
      return false;
    }
  }

  async createFrontendClient(token) {
    console.log('🌐 Creating frontend client...');
    await axios.post(`${this.baseUrl}/admin/realms/${this.realm}/clients`, {
      clientId: 'contract-management-frontend',
      enabled: true,
      publicClient: true,
      standardFlowEnabled: true,
      directAccessGrantsEnabled: true,
      redirectUris: ['http://localhost:3000/callback', 'http://localhost:3000/*', 'http://localhost:3000'],
      webOrigins: ['http://localhost:3000'],
      fullScopeAllowed: true
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Frontend client created');
  }

  async createBackendClient(token) {
    console.log('🔧 Creating backend client...');
    await axios.post(`${this.baseUrl}/admin/realms/${this.realm}/clients`, {
      clientId: 'contract-management-backend',
      enabled: true,
      publicClient: false,
      clientAuthenticatorType: 'client-secret',
      serviceAccountsEnabled: true,
      directAccessGrantsEnabled: true,
      fullScopeAllowed: true
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Backend client created');
  }

  async createRoles(token) {
    console.log('👥 Creating roles...');
    const roles = ['TDP', 'TDC', 'CCRP', 'ADMIN'];
    
    for (const role of roles) {
      try {
        await axios.post(`${this.baseUrl}/admin/realms/${this.realm}/roles`, {
          name: role,
          description: `${role} role`
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(`   ✅ Role '${role}' created`);
      } catch (error) {
        if (error.response?.status === 409) {
          console.log(`   ✅ Role '${role}' already exists`);
        } else {
          console.log(`   ❌ Failed to create role '${role}': ${error.message}`);
        }
      }
    }
  }

  async syncEnvironmentFiles() {
    console.log('📝 Syncing environment files...');
    
    const configEnvPath = path.join(__dirname, 'config.env');
    const envPath = path.join(__dirname, '.env');
    
    // Read config.env
    let configEnv = fs.readFileSync(configEnvPath, 'utf8');
    
    // Update Keycloak settings
    configEnv = configEnv.replace(/KEYCLOAK_CLIENT_ID=.*/g, 'KEYCLOAK_CLIENT_ID=contract-management-frontend');
    configEnv = configEnv.replace(/KEYCLOAK_CLIENT_SECRET=.*/g, 'KEYCLOAK_CLIENT_SECRET=');
    
    // Write back to config.env
    fs.writeFileSync(configEnvPath, configEnv);
    
    // Copy to .env
    fs.writeFileSync(envPath, configEnv);
    
    console.log('✅ Environment files synced');
  }

  async testAuthentication() {
    console.log('🔐 Testing authentication...');
    try {
      const response = await axios.post('http://localhost:5001/api/auth/login', {
        email: 'tdc-test@example.com',
        password: 'password123'
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.data.message === 'Login successful') {
        console.log('✅ Authentication test passed!');
        return true;
      } else {
        console.log('❌ Authentication test failed');
        return false;
      }
    } catch (error) {
      console.log('❌ Authentication test failed:', error.response?.data?.error || error.message);
      return false;
    }
  }

  async run() {
    console.log('🔧 Auto-Fixing Keycloak Issues...\n');
    
    try {
      // Step 1: Get admin token
      console.log('🔑 Getting admin token...');
      const token = await this.getAdminToken();
      console.log('✅ Admin token obtained\n');
      
      // Step 2: Check and create realm
      console.log('🏛️ Checking realm...');
      const realmExists = await this.checkRealmExists(token);
      if (!realmExists) {
        await this.createRealm(token);
      } else {
        console.log('✅ Realm exists');
      }
      console.log('');
      
      // Step 3: Check and create clients
      console.log('🔐 Checking clients...');
      const frontendExists = await this.checkClientExists(token, 'contract-management-frontend');
      const backendExists = await this.checkClientExists(token, 'contract-management-backend');
      
      if (!frontendExists) {
        await this.createFrontendClient(token);
      } else {
        console.log('✅ Frontend client exists');
      }
      
      if (!backendExists) {
        await this.createBackendClient(token);
      } else {
        console.log('✅ Backend client exists');
      }
      console.log('');
      
      // Step 4: Create roles
      await this.createRoles(token);
      console.log('');
      
      // Step 5: Sync environment files
      await this.syncEnvironmentFiles();
      console.log('');
      
      // Step 6: Test authentication
      const authSuccess = await this.testAuthentication();
      
      console.log('\n🎉 Auto-fix completed!');
      if (authSuccess) {
        console.log('✅ All issues resolved - authentication is working!');
      } else {
        console.log('⚠️ Authentication still failing - may need to restart backend');
        console.log('   Run: pkill -f "node server.js" && cd backend && node server.js &');
      }
      
    } catch (error) {
      console.error('❌ Auto-fix failed:', error.message);
      console.log('\n💡 Try running: npm run reset:***REMOVED-KEYCLOAK_DB_PASSWORD***');
    }
  }
}

// Run the auto-fix
const autoFix = new KeycloakAutoFix();
autoFix.run().catch(console.error); 