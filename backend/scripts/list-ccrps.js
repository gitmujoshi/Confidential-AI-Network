/**
 * List CCRP Users
 * 
 * This script lists all CCRP users in the database.
 */

const db = require('../models');

async function listCCRPs() {
  try {
    console.log('📋 Listing all CCRP users...\n');

    const ccrpUsers = await db.User.findAll({
      where: { partyType: 'CCRP' },
      attributes: ['id', 'name', 'email', 'organization', 'did', 'description', 'website', 'location', 'isActive']
    });

    console.log(`✅ Found ${ccrpUsers.length} CCRP users:\n`);

    ccrpUsers.forEach((ccrp, index) => {
      console.log(`${index + 1}. ${ccrp.name}`);
      console.log(`   ID: ${ccrp.id}`);
      console.log(`   Email: ${ccrp.email}`);
      console.log(`   Organization: ${ccrp.organization}`);
      console.log(`   DID: ${ccrp.did}`);
      console.log(`   Website: ${ccrp.website}`);
      console.log(`   Location: ${ccrp.location}`);
      console.log(`   Active: ${ccrp.isActive ? 'Yes' : 'No'}`);
      console.log(`   Description: ${ccrp.description}`);
      console.log('');
    });

    console.log('🔗 These CCRPs can be selected by TDC users when creating contracts.');
    console.log('📝 All CCRPs use password: CCRP123!');

  } catch (error) {
    console.error('❌ Error listing CCRPs:', error);
  }
}

listCCRPs()
  .then(() => {
    console.log('\n🏁 Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  }); 