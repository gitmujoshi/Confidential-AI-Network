const axios = require('axios');
const https = require('https');

// HTTPS agent for self-signed certificates
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const KEYCLOAK_URL = 'https://localhost:8443';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '***REMOVED-KEYCLOAK_ADMIN_PASSWORD***';
const REALM_NAME = 'contract-management';
const CLIENT_ID = 'contract-management-client';

async function configureKeycloak() {
    try {
        console.log('🔐 Configuring Keycloak IAM with HTTPS...');
        
        // Get admin token
        console.log('📝 Getting admin token...');
        const tokenResponse = await axios.post(`${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`, 
            `username=${ADMIN_USERNAME}&password=${ADMIN_PASSWORD}&grant_type=password&client_id=admin-cli`,
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                httpsAgent
            }
        );
        
        const adminToken = tokenResponse.data.access_token;
        console.log('✅ Admin token obtained');
        
        // Create realm
        console.log('📝 Creating realm...');
        try {
            await axios.post(`${KEYCLOAK_URL}/admin/realms`, {
                realm: REALM_NAME,
                enabled: true,
                displayName: 'Contract Management System',
                displayNameHtml: '<div class="kc-logo-text"><span>Contract Management</span></div>'
            }, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                },
                httpsAgent
            });
            console.log('✅ Realm created');
        } catch (error) {
            if (error.response?.status === 409) {
                console.log('ℹ️ Realm already exists');
            } else {
                throw error;
            }
        }
        
        // Create client
        console.log('📝 Creating client...');
        try {
            await axios.post(`${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients`, {
                clientId: CLIENT_ID,
                name: 'Contract Management Client',
                enabled: true,
                publicClient: false,
                standardFlowEnabled: true,
                directAccessGrantsEnabled: true,
                serviceAccountsEnabled: true,
                redirectUris: ['http://localhost:3000/*', 'http://localhost:3000'],
                webOrigins: ['http://localhost:3000'],
                protocol: 'openid-connect'
            }, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                },
                httpsAgent
            });
            console.log('✅ Client created');
        } catch (error) {
            if (error.response?.status === 409) {
                console.log('ℹ️ Client already exists');
            } else {
                throw error;
            }
        }
        
        // Create roles
        console.log('📝 Creating roles...');
        const roles = ['TDP', 'TDC', 'CCRP', 'AppAdmin'];
        
        for (const roleName of roles) {
            try {
                await axios.post(`${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/roles`, {
                    name: roleName,
                    description: `${roleName} role for Contract Management System`
                }, {
                    headers: {
                        'Authorization': `Bearer ${adminToken}`,
                        'Content-Type': 'application/json'
                    },
                    httpsAgent
                });
                console.log(`✅ Role ${roleName} created`);
            } catch (error) {
                if (error.response?.status === 409) {
                    console.log(`ℹ️ Role ${roleName} already exists`);
                } else {
                    console.log(`⚠️ Failed to create role ${roleName}:`, error.message);
                }
            }
        }
        
        // Create admin user
        console.log('📝 Creating admin user...');
        try {
            await axios.post(`${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users`, {
                username: 'admin',
                email: 'admin@contractmanagement.com',
                firstName: 'System',
                lastName: 'Administrator',
                enabled: true,
                emailVerified: true,
                credentials: [{
                    type: 'password',
                    value: '***REMOVED-KEYCLOAK_ADMIN_PASSWORD***',
                    temporary: false
                }]
            }, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                },
                httpsAgent
            });
            console.log('✅ Admin user created');
            
            // Get user ID and assign admin role
            const usersResponse = await axios.get(`${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users?username=admin`, {
                headers: { 'Authorization': `Bearer ${adminToken}` },
                httpsAgent
            });
            
            if (usersResponse.data.length > 0) {
                const userId = usersResponse.data[0].id;
                const roleResponse = await axios.get(`${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/roles/AppAdmin`, {
                    headers: { 'Authorization': `Bearer ${adminToken}` },
                    httpsAgent
                });
                
                await axios.post(`${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users/${userId}/role-mappings/realm`, [roleResponse.data], {
                    headers: {
                        'Authorization': `Bearer ${adminToken}`,
                        'Content-Type': 'application/json'
                    },
                    httpsAgent
                });
                console.log('✅ Admin role assigned to admin user');
            }
        } catch (error) {
            if (error.response?.status === 409) {
                console.log('ℹ️ Admin user already exists');
            } else {
                console.log('⚠️ Failed to create admin user:', error.message);
            }
        }
        
        console.log('🎉 Keycloak HTTPS configuration completed successfully!');
        
    } catch (error) {
        console.error('❌ Keycloak configuration failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        process.exit(1);
    }
}

configureKeycloak();
