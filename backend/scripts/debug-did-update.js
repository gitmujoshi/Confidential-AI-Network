/**
 * Debug DID Update for TDC User
 *
 * This script fetches the TDC user, updates the DID, and prints before/after states.
 */

const db = require('../models');

async function debugDIDUpdate() {
  try {
    const email = 'tdcuser@example.com';
    const newDID = 'did:web:mukeshjoshidpi.github.io';

    // Fetch user before update
    const userBefore = await db.User.findOne({ where: { email } });
    if (!userBefore) {
      console.log('❌ User not found');
      return;
    }
    console.log('Before update:');
    console.log({ id: userBefore.id, email: userBefore.email, did: userBefore.did, didVerified: userBefore.didVerified });

    // Update DID
    await userBefore.update({
      did: newDID,
      didVerified: true,
      didVerificationMethod: 'DEBUG_SCRIPT'
    });

    // Fetch user after update
    const userAfter = await db.User.findOne({ where: { email } });
    console.log('After update:');
    console.log({ id: userAfter.id, email: userAfter.email, did: userAfter.did, didVerified: userAfter.didVerified });

    if (userAfter.did === newDID && userAfter.didVerified) {
      console.log('✅ DID update successful!');
    } else {
      console.log('❌ DID update failed!');
    }
  } catch (error) {
    console.error('❌ Error during debug:', error);
  } finally {
    await db.sequelize.close();
  }
}

debugDIDUpdate(); 