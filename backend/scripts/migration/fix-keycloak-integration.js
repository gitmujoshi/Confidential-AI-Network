/**
 * Keycloak Integration Diagnostic and Fix Script
 * 
 * This script diagnoses and fixes common Keycloak integration issues:
 * - Checks Keycloak server connectivity
 * - Validates configuration
 * - Tests admin authentication
 * - Verifies realm and client setup
 * - Fixes common configuration issues
 * - Provides detailed error reporting
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class KeycloakDiagnostic {
  constructor() {
    this.config = this.loadConfig();
    this.baseURL = this.config.keycloakUrl;
    this.realm = this.config.realm;
    this.adminToken = null;
    this.issues = [];
    this.fixes = [];
  }

  loadConfig() {
    return {
      keycloakUrl: process.env.KEYCLOAK_URL || 'http://localhost:8080',
      realm: process.env.KEYCLOAK_REALM || 'contract-management',
      frontendClient: process.env.KEYCLOAK_CLIENT_ID || 'contract-management-frontend',
      backendClient: 'contract-management-backend',
      adminUser: {
        username: process.env.KEYCLOAK_ADMIN_USERNAME || 'admin',
        password: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin'
      }
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      fix: '🔧'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async checkKeycloakConnectivity() {
    this.log('Checking Keycloak server connectivity...');
    
    try {
      // Try the realms endpoint which is more reliable
      const response = await axios.get(`${this.baseURL}/realms/master`, {
        timeout: 5000
      });
      
      if (response.status === 200) {
        this.log('Keycloak server is running and accessible', 'success');
        return true;
      }
    } catch (error) {
      this.log(`Keycloak server connectivity failed: ${error.message}`, 'error');
      this.issues.push({
        type: 'connectivity',
        message: 'Keycloak server is not accessible',
        error: error.message,
        fix: 'Ensure Keycloak is running on http://localhost:8080'
      });
      return false;
    }
  }

  async checkAdminAuthentication() {
    this.log('Testing admin authentication...');
    
    try {
      const response = await axios.post(`${this.baseURL}/realms/master/protocol/openid-connect/token`, 
        new URLSearchParams({
          username: this.config.adminUser.username,
          password: this.config.adminUser.password,
          grant_type: 'password',
          client_id: 'admin-cli'
        }), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 10000
        }
      );

      this.adminToken = response.data.access_token;
      this.log('Admin authentication successful', 'success');
      return true;
    } catch (error) {
      this.log(`Admin authentication failed: ${error.response?.data?.error_description || error.message}`, 'error');
      this.issues.push({
        type: 'authentication',
        message: 'Admin authentication failed',
        error: error.response?.data?.error_description || error.message,
        fix: 'Check admin username/password in config.env'
      });
      return false;
    }
  }

  async checkRealmExists() {
    this.log('Checking if realm exists...');
    
    try {
      const response = await axios.get(`${this.baseURL}/admin/realms/${this.realm}`, {
        headers: {
          'Authorization': `Bearer ${this.adminToken}`
        },
        timeout: 5000
      });
      
      if (response.status === 200) {
        this.log(`Realm '${this.realm}' exists`, 'success');
        return true;
      }
    } catch (error) {
      if (error.response?.status === 404) {
        this.log(`Realm '${this.realm}' does not exist`, 'warning');
        this.issues.push({
          type: 'realm',
          message: `Realm '${this.realm}' not found`,
          fix: 'Create the realm using setup-keycloak.js'
        });
      } else {
        this.log(`Error checking realm: ${error.message}`, 'error');
        this.issues.push({
          type: 'realm',
          message: 'Error checking realm',
          error: error.message
        });
      }
      return false;
    }
  }

  async checkClientExists(clientId) {
    this.log(`Checking if client '${clientId}' exists...`);
    
    try {
      const response = await axios.get(`${this.baseURL}/admin/realms/${this.realm}/clients?clientId=${clientId}`, {
        headers: {
          'Authorization': `Bearer ${this.adminToken}`
        },
        timeout: 5000
      });
      
      if (response.data && response.data.length > 0) {
        this.log(`Client '${clientId}' exists`, 'success');
        return response.data[0];
      } else {
        this.log(`Client '${clientId}' does not exist`, 'warning');
        this.issues.push({
          type: 'client',
          message: `Client '${clientId}' not found`,
          fix: 'Create the client using setup-keycloak.js'
        });
        return null;
      }
    } catch (error) {
      this.log(`Error checking client '${clientId}': ${error.message}`, 'error');
      this.issues.push({
        type: 'client',
        message: `Error checking client '${clientId}'`,
        error: error.message
      });
      return null;
    }
  }

  async checkRolesExist() {
    this.log('Checking if required roles exist...');
    
    const requiredRoles = ['TDP', 'TDC', 'CCRP', 'ADMIN'];
    const missingRoles = [];
    
    for (const role of requiredRoles) {
      try {
        const response = await axios.get(`${this.baseURL}/admin/realms/${this.realm}/roles/${role}`, {
          headers: {
            'Authorization': `Bearer ${this.adminToken}`
          },
          timeout: 5000
        });
        
        if (response.status === 200) {
          this.log(`Role '${role}' exists`, 'success');
        }
      } catch (error) {
        if (error.response?.status === 404) {
          this.log(`Role '${role}' does not exist`, 'warning');
          missingRoles.push(role);
        } else {
          this.log(`Error checking role '${role}': ${error.message}`, 'error');
        }
      }
    }
    
    if (missingRoles.length > 0) {
      this.issues.push({
        type: 'roles',
        message: `Missing roles: ${missingRoles.join(', ')}`,
        fix: 'Create missing roles using setup-keycloak.js'
      });
    }
    
    return missingRoles.length === 0;
  }

  async checkConfiguration() {
    this.log('Checking configuration...');
    
    const configIssues = [];
    
    // Check required environment variables
    if (!process.env.KEYCLOAK_URL) {
      configIssues.push('KEYCLOAK_URL not set');
    }
    
    if (!process.env.KEYCLOAK_REALM) {
      configIssues.push('KEYCLOAK_REALM not set');
    }
    
    if (!process.env.KEYCLOAK_ADMIN_USERNAME) {
      configIssues.push('KEYCLOAK_ADMIN_USERNAME not set');
    }
    
    if (!process.env.KEYCLOAK_ADMIN_PASSWORD) {
      configIssues.push('KEYCLOAK_ADMIN_PASSWORD not set');
    }
    
    if (configIssues.length > 0) {
      this.log(`Configuration issues found: ${configIssues.join(', ')}`, 'warning');
      this.issues.push({
        type: 'configuration',
        message: 'Missing environment variables',
        details: configIssues,
        fix: 'Update config.env with required Keycloak settings'
      });
    } else {
      this.log('Configuration looks good', 'success');
    }
  }

  async runDiagnostics() {
    this.log('🔍 Starting Keycloak integration diagnostics...', 'info');
    this.log('', 'info');
    
    // Step 1: Check connectivity
    const isConnected = await this.checkKeycloakConnectivity();
    if (!isConnected) {
      this.log('Cannot proceed with diagnostics - Keycloak server not accessible', 'error');
      return;
    }
    
    // Step 2: Check configuration
    await this.checkConfiguration();
    
    // Step 3: Check admin authentication
    const isAuthenticated = await this.checkAdminAuthentication();
    if (!isAuthenticated) {
      this.log('Cannot proceed with realm/client checks - admin authentication failed', 'error');
      return;
    }
    
    // Step 4: Check realm
    await this.checkRealmExists();
    
    // Step 5: Check clients
    await this.checkClientExists(this.config.frontendClient);
    await this.checkClientExists(this.config.backendClient);
    
    // Step 6: Check roles
    await this.checkRolesExist();
    
    this.log('', 'info');
    this.generateReport();
  }

  generateReport() {
    this.log('📊 DIAGNOSTIC REPORT', 'info');
    this.log('=' * 50, 'info');
    
    if (this.issues.length === 0) {
      this.log('🎉 No issues found! Keycloak integration appears to be working correctly.', 'success');
    } else {
      this.log(`Found ${this.issues.length} issue(s):`, 'warning');
      this.log('', 'info');
      
      this.issues.forEach((issue, index) => {
        this.log(`${index + 1}. ${issue.type.toUpperCase()}: ${issue.message}`, 'error');
        if (issue.error) {
          this.log(`   Error: ${issue.error}`, 'error');
        }
        if (issue.details) {
          issue.details.forEach(detail => {
            this.log(`   - ${detail}`, 'error');
          });
        }
        if (issue.fix) {
          this.log(`   🔧 Fix: ${issue.fix}`, 'fix');
        }
        this.log('', 'info');
      });
      
      this.log('🔧 RECOMMENDED ACTIONS:', 'info');
      this.log('1. Run: node backend/setup-keycloak.js', 'fix');
      this.log('2. Restart the backend server', 'fix');
      this.log('3. Test user registration/login', 'fix');
    }
  }

  async applyFixes() {
    this.log('🔧 Applying automatic fixes...', 'info');
    
    for (const issue of this.issues) {
      if (issue.type === 'realm' || issue.type === 'client' || issue.type === 'roles') {
        this.log(`Applying fix for ${issue.type} issue...`, 'fix');
        
        try {
          // Import and run the setup script
          const setupPath = path.join(__dirname, '..', 'setup-keycloak.js');
          if (fs.existsSync(setupPath)) {
            const KeycloakSetup = require(setupPath);
            const setup = new KeycloakSetup();
            await setup.setup();
            this.log(`✅ Fixed ${issue.type} issue`, 'success');
          } else {
            this.log(`❌ Setup script not found at ${setupPath}`, 'error');
          }
        } catch (error) {
          this.log(`❌ Failed to apply fix for ${issue.type}: ${error.message}`, 'error');
        }
      }
    }
  }
}

// Run diagnostics if this script is executed directly
if (require.main === module) {
  const diagnostic = new KeycloakDiagnostic();
  
  diagnostic.runDiagnostics()
    .then(async () => {
      if (diagnostic.issues.length > 0) {
        console.log('\n🔧 Would you like to apply automatic fixes? (y/n)');
        // For now, just show the report
        console.log('\n📋 To apply fixes, run: node backend/setup-keycloak.js');
      }
    })
    .catch((error) => {
      console.error('\n💥 Diagnostic failed:', error.message);
      process.exit(1);
    });
}

module.exports = KeycloakDiagnostic; 