const { Pool } = require('pg');
const axios = require('axios');

async function getKeycloakToken() {
    try {
        const response = await axios.post('http://localhost:8080/realms/master/protocol/openid-connect/token', 
            'grant_type=password&client_id=admin-cli&username=admin&password=admin123',
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }
        );
        return response.data.access_token;
    } catch (error) {
        console.error('Error getting Keycloak token:', error.message);
        return null;
    }
}

async function getKeycloakUsers(token) {
    try {
        const response = await axios.get('http://localhost:8080/admin/realms/contract-management/users', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error getting Keycloak users:', error.message);
        return [];
    }
}

async function getDatabaseUsers() {
    const pool = new Pool({
        host: 'localhost',
        port: 5432,
        database: 'contract_management',
        user: 'mukeshjoshi',
        password: ''
    });

    try {
        const result = await pool.query('SELECT id, email, name, "partyType", "iamUserId", "iamUsername" FROM users ORDER BY id');
        return result.rows;
    } catch (error) {
        console.error('Error getting database users:', error.message);
        return [];
    } finally {
        await pool.end();
    }
}

async function checkUserSync() {
    console.log('=== User Sync Status ===\n');

    // Get users from both sources
    const token = await getKeycloakToken();
    if (!token) {
        console.log('❌ Could not get Keycloak token');
        return;
    }

    const keycloakUsers = await getKeycloakUsers(token);
    const databaseUsers = await getDatabaseUsers();

    console.log(`📊 Keycloak users: ${keycloakUsers.length}`);
    console.log(`📊 Database users: ${databaseUsers.length}\n`);

    // Create maps for easy comparison
    const keycloakMap = new Map();
    keycloakUsers.forEach(user => {
        keycloakMap.set(user.email, user);
    });

    const databaseMap = new Map();
    databaseUsers.forEach(user => {
        databaseMap.set(user.email, user);
    });

    // Find users in sync
    const inSync = [];
    const onlyInKeycloak = [];
    const onlyInDatabase = [];
    const outOfSync = [];

    // Check database users against Keycloak
    databaseUsers.forEach(dbUser => {
        const keycloakUser = keycloakMap.get(dbUser.email);
        if (keycloakUser) {
            // Check if iamUserId is set correctly
            if (dbUser.iamUserId === keycloakUser.id) {
                inSync.push({
                    email: dbUser.email,
                    name: dbUser.name,
                    partyType: dbUser.partyType,
                    keycloakId: keycloakUser.id,
                    databaseId: dbUser.id
                });
            } else {
                outOfSync.push({
                    email: dbUser.email,
                    name: dbUser.name,
                    partyType: dbUser.partyType,
                    keycloakId: keycloakUser.id,
                    databaseId: dbUser.id,
                    databaseIamUserId: dbUser.iamUserId
                });
            }
        } else {
            onlyInDatabase.push(dbUser);
        }
    });

    // Check for users only in Keycloak
    keycloakUsers.forEach(keycloakUser => {
        if (!databaseMap.has(keycloakUser.email)) {
            onlyInKeycloak.push(keycloakUser);
        }
    });

    // Display results
    console.log('✅ Users in sync:');
    if (inSync.length === 0) {
        console.log('   None');
    } else {
        inSync.forEach(user => {
            console.log(`   - ${user.email} (${user.partyType}) - DB:${user.databaseId}, KC:${user.keycloakId}`);
        });
    }

    console.log('\n⚠️  Users out of sync (database iamUserId mismatch):');
    if (outOfSync.length === 0) {
        console.log('   None');
    } else {
        outOfSync.forEach(user => {
            console.log(`   - ${user.email} (${user.partyType}) - DB:${user.databaseId}, KC:${user.keycloakId}, DB iamUserId: ${user.databaseIamUserId}`);
        });
    }

    console.log('\n🔴 Users only in Keycloak:');
    if (onlyInKeycloak.length === 0) {
        console.log('   None');
    } else {
        onlyInKeycloak.forEach(user => {
            console.log(`   - ${user.email} (${user.username})`);
        });
    }

    console.log('\n🔴 Users only in Database:');
    if (onlyInDatabase.length === 0) {
        console.log('   None');
    } else {
        onlyInDatabase.forEach(user => {
            console.log(`   - ${user.email} (${user.name}) - ${user.partyType}`);
        });
    }

    console.log('\n📈 Summary:');
    console.log(`   Total in sync: ${inSync.length}`);
    console.log(`   Total out of sync: ${outOfSync.length}`);
    console.log(`   Only in Keycloak: ${onlyInKeycloak.length}`);
    console.log(`   Only in Database: ${onlyInDatabase.length}`);
    console.log(`   Sync percentage: ${((inSync.length / (inSync.length + outOfSync.length + onlyInDatabase.length)) * 100).toFixed(1)}%`);
}

checkUserSync().catch(console.error); 