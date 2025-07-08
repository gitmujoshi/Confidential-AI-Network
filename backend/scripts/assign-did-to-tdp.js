/**
 * Assign DID to TDP User
 * 
 * This script assigns a did:web DID to the TDP user for testing.
 */

const db = require('../models');

async function assignDIDToTDP() {
  try {
    console.log('🔧 Assigning DID to TDP user...\n');

    // Find TDP user
    const tdpUser = await db.User.findOne({
      where: { 
        email: 'tdpuser@example.com',
        partyType: 'TDP'
      }
    });

    if (!tdpUser) {
      console.log('❌ TDP user not found');
      return;
    }

    console.log(`✅ Found TDP user: ${tdpUser.name} (ID: ${tdpUser.id})`);
    console.log(`   Current DID: ${tdpUser.did || 'None'}`);

    // Assign a did:web DID
    const did = 'did:web:example.com:tdpuser';
    
    // Update user with DID
    await tdpUser.update({
      did: did,
      didVerified: true,
      didVerificationMethod: 'SYSTEM_ASSIGNED'
    });

    console.log(`✅ Assigned DID: ${did}`);
    console.log(`   DID Verified: ${tdpUser.didVerified}`);
    console.log(`   Verification Method: ${tdpUser.didVerificationMethod}`);

    // Verify the update
    const updatedUser = await db.User.findByPk(tdpUser.id);
    console.log(`\n🔍 Verification:`);
    console.log(`   User ID: ${updatedUser.id}`);
    console.log(`   Name: ${updatedUser.name}`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   DID: ${updatedUser.did}`);
    console.log(`   DID Verified: ${updatedUser.didVerified}`);

    console.log('\n🎉 DID assignment completed successfully!');

  } catch (error) {
    console.error('❌ Error assigning DID:', error);
  }
}

assignDIDToTDP()
  .then(() => {
    console.log('\n🏁 Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  }); 