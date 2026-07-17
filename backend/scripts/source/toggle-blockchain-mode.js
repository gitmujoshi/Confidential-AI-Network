/**
 * Toggle Blockchain Mode for Testing
 * 
 * This script allows you to easily toggle between blockchain-enabled and database-only modes
 * for testing purposes.
 */

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../../config.env');

function readConfig() {
  try {
    const config = fs.readFileSync(CONFIG_PATH, 'utf8');
    const lines = config.split('\n');
    const configObj = {};
    
    lines.forEach(line => {
      if (line.includes('=') && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        configObj[key.trim()] = value.trim();
      }
    });
    
    return configObj;
  } catch (error) {
    console.error('Error reading config file:', error.message);
    return {};
  }
}

function writeConfig(configObj) {
  try {
    const lines = [];
    
    // Add blockchain configuration
    lines.push('# Blockchain Configuration');
    lines.push(`BLOCKCHAIN_ENABLED=${configObj.BLOCKCHAIN_ENABLED || 'true'}`);
    lines.push(`BLOCKCHAIN_URL=${configObj.BLOCKCHAIN_URL || 'http://localhost:8545'}`);
    lines.push(`CONTRACT_ADDRESS=${configObj.CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3'}`);
    lines.push('');
    
    // Add other configurations
    lines.push('# Database Configuration');
    lines.push(`DB_HOST=${configObj.DB_HOST || 'localhost'}`);
    lines.push(`DB_PORT=${configObj.DB_PORT || '5432'}`);
    lines.push(`DB_NAME=${configObj.DB_NAME || 'contract_management'}`);
    lines.push(`DB_USER=${configObj.DB_USER || 'mukeshjoshi'}`);
    lines.push(`DB_PASSWORD=${configObj.DB_PASSWORD || ''}`);
    lines.push('');
    
    lines.push('# JWT Configuration');
    lines.push(`JWT_SECRET=${configObj.JWT_SECRET || '<jwt-secret>'}`);
    lines.push('');
    
    lines.push('# IAM (Keycloak) Configuration');
    lines.push(`KEYCLOAK_URL=${configObj.KEYCLOAK_URL || 'http://localhost:8080'}`);
    lines.push(`KEYCLOAK_REALM=${configObj.KEYCLOAK_REALM || 'contract-management'}`);
    lines.push(`KEYCLOAK_CLIENT_ID=${configObj.KEYCLOAK_CLIENT_ID || 'contract-management-frontend'}`);
    lines.push(`KEYCLOAK_CLIENT_SECRET=${configObj.KEYCLOAK_CLIENT_SECRET || 'your_client_secret_here'}`);
    lines.push(`KEYCLOAK_ADMIN_USERNAME=${configObj.KEYCLOAK_ADMIN_USERNAME || 'admin'}`);
    lines.push(`KEYCLOAK_ADMIN_PASSWORD=${configObj.KEYCLOAK_ADMIN_PASSWORD || 'admin'}`);
    lines.push('');
    
    lines.push('# Email Configuration (Optional)');
    lines.push(`SMTP_HOST=${configObj.SMTP_HOST || 'smtp.gmail.com'}`);
    lines.push(`SMTP_PORT=${configObj.SMTP_PORT || '587'}`);
    lines.push(`SMTP_USER=${configObj.SMTP_USER || 'your_email@gmail.com'}`);
    lines.push(`SMTP_PASS=${configObj.SMTP_PASS || 'your_app_password_here'}`);
    lines.push('');
    
    lines.push('# Server Configuration');
    lines.push(`PORT=${configObj.PORT || '5001'}`);
    lines.push(`NODE_ENV=${configObj.NODE_ENV || 'development'}`);
    lines.push('');
    
    lines.push('# Security');
    lines.push(`CORS_ORIGIN=${configObj.CORS_ORIGIN || 'http://localhost:3000'}`);
    lines.push(`SESSION_SECRET=${configObj.SESSION_SECRET || '<jwt-secret>'}`);
    lines.push('');
    
    lines.push('# Blockchain Deployment');
    lines.push(`PRIVATE_KEY=${configObj.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'}`);
    lines.push('');
    
    lines.push('# Frontend Environment Variables (for development)');
    lines.push(`REACT_APP_TDP_PRIVATE_KEY=${configObj.REACT_APP_TDP_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'}`);
    lines.push(`REACT_APP_TDC_PRIVATE_KEY=${configObj.REACT_APP_TDC_PRIVATE_KEY || '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'}`);
    lines.push(`REACT_APP_CCRP_PRIVATE_KEY=${configObj.REACT_APP_CCRP_PRIVATE_KEY || '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a'}`);
    lines.push('');
    
    lines.push('# Keycloak Database Password');
    lines.push(`KEYCLOAK_DB_PASSWORD=${configObj.KEYCLOAK_DB_PASSWORD || 'IWC3fqFn75ANvfbiujlKyR54qPXOaG2EoPxbFXWAkjI='}`);
    
    fs.writeFileSync(CONFIG_PATH, lines.join('\n'));
    console.log('✅ Configuration file updated successfully');
  } catch (error) {
    console.error('Error writing config file:', error.message);
  }
}

function showCurrentMode() {
  const config = readConfig();
  const blockchainEnabled = config.BLOCKCHAIN_ENABLED === 'true';
  
  console.log('🔧 Current Blockchain Configuration:');
  console.log(`   BLOCKCHAIN_ENABLED: ${blockchainEnabled ? '✅ true' : '❌ false'}`);
  console.log(`   BLOCKCHAIN_URL: ${config.BLOCKCHAIN_URL || 'http://localhost:8545'}`);
  console.log(`   Mode: ${blockchainEnabled ? 'BLOCKCHAIN_ENABLED' : 'DATABASE_ONLY'}`);
  console.log('');
}

function enableBlockchain() {
  console.log('🔗 Enabling blockchain mode...');
  const config = readConfig();
  config.BLOCKCHAIN_ENABLED = 'true';
  writeConfig(config);
  console.log('✅ Blockchain mode enabled');
  console.log('   The system will attempt to use blockchain when available');
  console.log('   If blockchain is unavailable, it will fall back to database-only mode');
}

function disableBlockchain() {
  console.log('🗄️  Disabling blockchain mode...');
  const config = readConfig();
  config.BLOCKCHAIN_ENABLED = 'false';
  writeConfig(config);
  console.log('✅ Blockchain mode disabled');
  console.log('   The system will use database-only mode');
  console.log('   All blockchain operations will return mock results');
}

function showUsage() {
  console.log('🔧 Blockchain Mode Toggle Script');
  console.log('');
  console.log('Usage:');
  console.log('  node scripts/toggle-blockchain-mode.js [command]');
  console.log('');
  console.log('Commands:');
  console.log('  status    - Show current blockchain configuration');
  console.log('  enable    - Enable blockchain mode (with fallback)');
  console.log('  disable   - Disable blockchain mode (database-only)');
  console.log('  help      - Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/toggle-blockchain-mode.js status');
  console.log('  node scripts/toggle-blockchain-mode.js enable');
  console.log('  node scripts/toggle-blockchain-mode.js disable');
  console.log('');
  console.log('Note: After changing the mode, restart the backend server for changes to take effect.');
}

// Main execution
if (require.main === module) {
  const command = process.argv[2] || 'status';
  
  switch (command.toLowerCase()) {
    case 'status':
      showCurrentMode();
      break;
    case 'enable':
      enableBlockchain();
      break;
    case 'disable':
      disableBlockchain();
      break;
    case 'help':
      showUsage();
      break;
    default:
      console.log(`❌ Unknown command: ${command}`);
      console.log('');
      showUsage();
      break;
  }
}

module.exports = {
  readConfig,
  writeConfig,
  showCurrentMode,
  enableBlockchain,
  disableBlockchain
}; 