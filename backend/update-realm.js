const axios = require('axios');

// Load environment variables
require('dotenv').config({ path: '../config.env' });

async function updateRealm() {
  try {
    console.log('🔐 Getting admin token...');
    
    const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'https://localhost:8443';
    
    // Get admin token
    const tokenResponse = await axios.post(`${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`, 
      new URLSearchParams({
        username: 'admin',
        password: 'admin123',
        grant_type: 'password',
        client_id: 'admin-cli'
      }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );
    
    const adminToken = tokenResponse.data.access_token;
    console.log('✅ Admin token obtained');
    
    // Update realm configuration
    const realmUpdate = {
      realm: 'contract-management',
      enabled: true,
      displayName: 'Contract Management System',
      displayNameHtml: '<div class="kc-logo-text"><span>Contract Management</span></div>',
      attributes: {
        frontendUrl: KEYCLOAK_URL,
        backendUrl: 'http://localhost:5001'
      }
    };
    
    console.log('🔄 Updating realm configuration...');
    await axios.put(`${KEYCLOAK_URL}/admin/realms/contract-management`, realmUpdate, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Realm configuration updated successfully');
    console.log('🔄 Please restart Keycloak to apply changes');
    
  } catch (error) {
    console.error('❌ Failed to update realm:', error.response?.data || error.message);
  }
}

updateRealm(); 