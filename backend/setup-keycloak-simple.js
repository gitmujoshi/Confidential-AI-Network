const axios = require('axios');

// Configure axios to ignore SSL certificate verification
const httpsAgent = new (require('https').Agent)({
  rejectUnauthorized: false
});

const axiosInstance = axios.create({
  httpsAgent: httpsAgent
});

const KEYCLOAK_BASE_URL = 'https://localhost:8443';

async function setupKeycloak() {
  try {
    console.log('🔑 Getting admin token...');
    
    // Get admin token
    const tokenResponse = await axiosInstance.post(`${KEYCLOAK_BASE_URL}/realms/master/protocol/openid-connect/token`, 
      new URLSearchParams({
        username: 'admin',
        password: 'admin123',
        grant_type: 'password',
        client_id: 'admin-cli'
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    const adminToken = tokenResponse.data.access_token;
    console.log('✅ Admin token obtained');
    
    // Create realm
    console.log('📝 Creating realm...');
    try {
      await axiosInstance.post(`${KEYCLOAK_BASE_URL}/admin/realms`, {
        realm: 'contract-management',
        enabled: true,
        displayName: 'Contract Management System',
        displayNameHtml: '<div class="kc-logo-text"><span>Contract Management</span></div>'
      }, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Realm created');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️ Realm already exists');
      } else {
        throw error;
      }
    }
    
    // Create roles
    console.log('👥 Creating roles...');
    const roles = ['TDP', 'TDC', 'CCRP', 'ADMIN'];
    for (const role of roles) {
      try {
        await axiosInstance.post(`${KEYCLOAK_BASE_URL}/admin/realms/contract-management/roles`, {
          name: role,
          description: `${role} role`
        }, {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        });
        console.log(`   ✅ Role ${role} created`);
      } catch (error) {
        if (error.response?.status === 409) {
          console.log(`   ℹ️ Role ${role} already exists`);
        } else {
          console.log(`   ⚠️ Failed to create role ${role}: ${error.message}`);
        }
      }
    }
    
    // Create frontend client
    console.log('🌐 Creating frontend client...');
    try {
      await axiosInstance.post(`${KEYCLOAK_BASE_URL}/admin/realms/contract-management/clients`, {
        clientId: 'contract-management-frontend',
        enabled: true,
        publicClient: true,
        standardFlowEnabled: true,
        directAccessGrantsEnabled: true,
        redirectUris: ['http://localhost:3000/callback', 'http://localhost:3000/*', 'http://localhost:3000'],
        webOrigins: ['http://localhost:3000'],
        fullScopeAllowed: true
      }, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Frontend client created');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️ Frontend client already exists');
      } else {
        console.log(`⚠️ Failed to create frontend client: ${error.message}`);
      }
    }
    
    console.log('🎉 Keycloak setup completed!');
    
  } catch (error) {
    console.error('❌ Keycloak setup failed:', error.message);
    throw error;
  }
}

setupKeycloak();
