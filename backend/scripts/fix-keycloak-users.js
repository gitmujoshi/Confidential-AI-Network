const axios = require('axios');

const KEYCLOAK_URL = 'http://localhost:8080';
const REALM = 'contract-management';

async function fixKeycloakUsers() {
  try {
    console.log('🔧 Fixing Keycloak user accounts...');
    
    // Get admin token
    const adminResponse = await axios.post(`${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`, 
      new URLSearchParams({
        grant_type: 'password',
        client_id: 'admin-cli',
        username: 'admin',
        password: 'admin123'
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    const adminToken = adminResponse.data.access_token;
    console.log('✅ Admin token obtained');
    
    // Get all users
    const usersResponse = await axios.get(`${KEYCLOAK_URL}/admin/realms/${REALM}/users`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    console.log(`📊 Found ${usersResponse.data.length} users`);
    
    for (const user of usersResponse.data) {
      console.log(`\n👤 Processing user: ${user.username}`);
      
      // Update user to be fully set up
      const updatedUser = {
        ...user,
        enabled: true,
        emailVerified: true,
        requiredActions: [], // Remove any required actions
        attributes: {
          ...user.attributes,
          walletAddress: user.attributes?.walletAddress || [''],
          partyType: user.attributes?.partyType || ['TDC'],
          publicKey: user.attributes?.publicKey || [''],
          organization: user.attributes?.organization || ['Contract Management System']
        }
      };
      
      // Update user
      await axios.put(`${KEYCLOAK_URL}/admin/realms/${REALM}/users/${user.id}`, updatedUser, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ User updated: ${user.username}`);
      
      // Set password
      const passwordUpdate = {
        type: 'password',
        value: 'password123',
        temporary: false
      };
      
      await axios.put(`${KEYCLOAK_URL}/admin/realms/${REALM}/users/${user.id}/reset-password`, passwordUpdate, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ Password set for: ${user.username}`);
    }
    
    console.log('\n🎉 All users fixed successfully!');
    console.log('📝 All users now have password: password123');
    
  } catch (error) {
    console.error('❌ Failed to fix users:', error.response?.data || error.message);
  }
}

fixKeycloakUsers(); 