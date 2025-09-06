/**
 * Update TDP DID as AppAdmin
 * 
 * This script logs in as AppAdmin and updates the TDP user's DID.
 */

const axios = require('axios');

const API_BASE = '${BACKEND_URL:-http://localhost:5001}/api';

async function updateTDPDIDAsAppAdmin() {
  try {
    console.log('🔧 Updating TDP DID as AppAdmin...\n');

    // Step 1: Login as AppAdmin
    console.log('1️⃣ Logging in as AppAdmin...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@contractmanagement.com',
      password: 'Admin123!'
    });

    const appAdminToken = loginResponse.data.accessToken;
    const appAdminUser = loginResponse.data.user;
    
    console.log(`✅ AppAdmin login successful: ${appAdminUser.name}`);
    console.log(`   Party Type: ${appAdminUser.partyType}`);
    console.log(`   Token: ${appAdminToken ? 'Received' : 'Not received'}`);

    // Step 2: Find TDP user
    console.log('\n2️⃣ Finding TDP user...');
    const tdpUser = await axios.get(`${API_BASE}/users`, {
      headers: { Authorization: `Bearer ${appAdminToken}` }
    });

    const tdpUserData = tdpUser.data.find(user => 
      user.email === 'tdpuser@example.com' && user.partyType === 'TDP'
    );

    if (!tdpUserData) {
      console.log('❌ TDP user not found');
      return;
    }

    console.log(`✅ Found TDP user: ${tdpUserData.name} (ID: ${tdpUserData.id})`);
    console.log(`   Current DID: ${tdpUserData.did || 'None'}`);

    // Step 3: Update TDP user's DID
    console.log('\n3️⃣ Updating TDP user\'s DID...');
    const newDID = 'did:web:mukeshjoshidpi.io';
    
    const updateResponse = await axios.put(`${API_BASE}/users/${tdpUserData.id}`, {
      did: newDID,
      didSource: 'USER_PROVIDED',
      didVerified: true,
      didVerificationMethod: 'ADMIN_UPDATED'
    }, {
      headers: { Authorization: `Bearer ${appAdminToken}` }
    });

    console.log('✅ TDP user DID updated successfully!');
    console.log(`   New DID: ${updateResponse.data.user.did}`);
    console.log(`   DID Source: ${updateResponse.data.user.didSource}`);
    console.log(`   DID Verified: ${updateResponse.data.user.didVerified}`);

    // Step 4: Verify the update
    console.log('\n4️⃣ Verifying the update...');
    const verifyResponse = await axios.get(`${API_BASE}/users/${tdpUserData.id}`, {
      headers: { Authorization: `Bearer ${appAdminToken}` }
    });

    const updatedUser = verifyResponse.data;
    console.log(`✅ Verification successful:`);
    console.log(`   User ID: ${updatedUser.id}`);
    console.log(`   Name: ${updatedUser.name}`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   DID: ${updatedUser.did}`);
    console.log(`   DID Source: ${updatedUser.didSource}`);
    console.log(`   DID Verified: ${updatedUser.didVerified}`);

    if (updatedUser.did === newDID) {
      console.log('\n🎉 TDP DID update completed successfully!');
      console.log(`   New DID: ${newDID}`);
    } else {
      console.log('\n❌ DID update verification failed!');
      console.log(`   Expected: ${newDID}`);
      console.log(`   Actual: ${updatedUser.did}`);
    }

  } catch (error) {
    console.error('❌ Update failed:', error.response?.data?.error || error.message);
    
    if (error.response?.data) {
      console.error('   Response data:', error.response.data);
    }
  }
}

updateTDPDIDAsAppAdmin()
  .then(() => {
    console.log('\n🏁 Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  }); 