const axios = require('axios');

async function updateRealm() {
  try {
    console.log('🔐 Getting admin token...');
    
    // Get admin token
    const tokenResponse = await axios.post('http://localhost:8080/realms/master/protocol/openid-connect/token', 
      new URLSearchParams({
        username: 'admin',
        password: '***REMOVED-KEYCLOAK_ADMIN_PASSWORD***',
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
        frontendUrl: 'http://localhost:8080',
        backendUrl: 'http://localhost:5001'
      }
    };
    
    console.log('🔄 Updating realm configuration...');
    await axios.put('http://localhost:8080/admin/realms/contract-management', realmUpdate, {
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