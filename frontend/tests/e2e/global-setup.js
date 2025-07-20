const { execSync } = require('child_process');
const path = require('path');

async function globalSetup() {
  console.log('🔧 Setting up E2E test environment with Keycloak...');
  
  try {
    // Run the backend E2E setup script (Keycloak registration approach)
    const backendPath = path.join(__dirname, '../../../backend');
    const setupScript = path.join(backendPath, 'setup-e2e-users.js');
    
    console.log('📝 Running backend E2E setup script (Keycloak registration)...');
    execSync(`node ${setupScript}`, { 
      cwd: backendPath,
      stdio: 'inherit'
    });
    
    console.log('✅ E2E test environment setup complete with Keycloak');
  } catch (error) {
    console.error('❌ E2E setup failed:', error);
    throw error;
  }
}

module.exports = globalSetup; 