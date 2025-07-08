/**
 * Quick Keycloak Fix Script
 * 
 * This script quickly fixes common Keycloak integration issues:
 * - Updates configuration
 * - Runs setup script
 * - Restarts services
 * - Tests connectivity
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class QuickKeycloakFix {
  constructor() {
    this.configPath = path.join(__dirname, '..', '..', 'config.env');
    this.backendPath = path.join(__dirname, '..');
  }

  log(message, type = 'info') {
    const prefix = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      fix: '🔧'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} ${message}`);
  }

  async updateConfiguration() {
    this.log('Updating Keycloak configuration...', 'fix');
    
    try {
      // Read current config
      let configContent = fs.readFileSync(this.configPath, 'utf8');
      
      // Update Keycloak settings
      const updates = {
        'KEYCLOAK_URL=http://localhost:8080': 'KEYCLOAK_URL=http://localhost:8080',
        'KEYCLOAK_REALM=contract-management': 'KEYCLOAK_REALM=contract-management',
        'KEYCLOAK_CLIENT_ID=contract-management-client': 'KEYCLOAK_CLIENT_ID=contract-management-frontend',
        'KEYCLOAK_ADMIN_USERNAME=admin': 'KEYCLOAK_ADMIN_USERNAME=admin',
        'KEYCLOAK_ADMIN_PASSWORD=dzV7lxdpZ78d9yl8xw0ADg==': 'KEYCLOAK_ADMIN_PASSWORD=admin'
      };
      
      let updated = false;
      for (const [oldValue, newValue] of Object.entries(updates)) {
        if (configContent.includes(oldValue.split('=')[0])) {
          configContent = configContent.replace(new RegExp(`${oldValue.split('=')[0]}=.*`), newValue);
          updated = true;
        }
      }
      
      if (updated) {
        fs.writeFileSync(this.configPath, configContent);
        this.log('Configuration updated successfully', 'success');
      } else {
        this.log('Configuration already up to date', 'info');
      }
    } catch (error) {
      this.log(`Failed to update configuration: ${error.message}`, 'error');
    }
  }

  async runSetupScript() {
    this.log('Running Keycloak setup script...', 'fix');
    
    try {
      const setupScript = path.join(this.backendPath, 'setup-***REMOVED-KEYCLOAK_DB_PASSWORD***.js');
      if (fs.existsSync(setupScript)) {
        execSync(`node ${setupScript}`, { 
          cwd: this.backendPath,
          stdio: 'inherit'
        });
        this.log('Setup script completed successfully', 'success');
      } else {
        this.log('Setup script not found', 'error');
      }
    } catch (error) {
      this.log(`Setup script failed: ${error.message}`, 'error');
    }
  }

  async testKeycloakConnection() {
    this.log('Testing Keycloak connection...', 'info');
    
    try {
      const axios = require('axios');
      const response = await axios.get('http://localhost:8080/realms/master', {
        timeout: 5000
      });
      
      if (response.status === 200) {
        this.log('Keycloak server is accessible', 'success');
        return true;
      }
    } catch (error) {
      this.log(`Keycloak server not accessible: ${error.message}`, 'error');
      return false;
    }
  }

  async restartServices() {
    this.log('Restarting services...', 'fix');
    
    try {
      // Stop any running backend processes
      try {
        execSync('pkill -f "node.*server.js"', { stdio: 'ignore' });
        this.log('Stopped existing backend processes', 'info');
      } catch (error) {
        // Ignore if no processes found
      }
      
      // Start backend
      this.log('Starting backend server...', 'fix');
      execSync('npm start', { 
        cwd: this.backendPath,
        stdio: 'inherit',
        detached: true
      });
      
      this.log('Services restarted successfully', 'success');
    } catch (error) {
      this.log(`Failed to restart services: ${error.message}`, 'error');
    }
  }

  async runQuickFix() {
    this.log('🚀 Starting Quick Keycloak Fix...', 'info');
    this.log('', 'info');
    
    // Step 1: Test current connection
    const isConnected = await this.testKeycloakConnection();
    if (!isConnected) {
      this.log('Keycloak server is not running. Please start Keycloak first.', 'warning');
      this.log('To start Keycloak with Docker:', 'fix');
      this.log('docker run -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/***REMOVED-KEYCLOAK_DB_PASSWORD***/***REMOVED-KEYCLOAK_DB_PASSWORD***:latest start-dev', 'fix');
      return;
    }
    
    // Step 2: Update configuration
    await this.updateConfiguration();
    
    // Step 3: Run setup script
    await this.runSetupScript();
    
    // Step 4: Restart services
    await this.restartServices();
    
    this.log('', 'info');
    this.log('🎉 Quick fix completed!', 'success');
    this.log('', 'info');
    this.log('📋 Next steps:', 'info');
    this.log('1. Test user registration at: http://localhost:3000/register', 'fix');
    this.log('2. Test user login at: http://localhost:3000/login', 'fix');
    this.log('3. Check Keycloak admin console at: http://localhost:8080/admin/', 'fix');
    this.log('', 'info');
    this.log('🔧 If issues persist, run the diagnostic script:', 'fix');
    this.log('   node backend/scripts/fix-***REMOVED-KEYCLOAK_DB_PASSWORD***-integration.js', 'fix');
  }
}

// Run quick fix if this script is executed directly
if (require.main === module) {
  const quickFix = new QuickKeycloakFix();
  
  quickFix.runQuickFix()
    .then(() => {
      console.log('\n✅ Quick fix completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Quick fix failed:', error.message);
      process.exit(1);
    });
}

module.exports = QuickKeycloakFix; 