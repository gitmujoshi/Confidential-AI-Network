/**
 * Create Sample CCRP Users
 * 
 * This script creates sample Confidential Clean Room Provider users
 * that can be selected by TDC users for contracts.
 */

const db = require('../models');
const bcrypt = require('bcryptjs');

const sampleCCRPs = [
  {
    name: 'SecureData Clean Room Services',
    email: 'ccrp1@securedata.com',
    description: 'Enterprise-grade confidential computing environment with ISO 27001 certification',
    organization: 'SecureData Technologies',
    phoneNumber: '+1-555-0101',
    website: 'https://securedata.com/cleanroom',
    location: 'San Francisco, CA',
    did: 'did:web:securedata.com:ccrp:cleanroom',
    partyType: 'CCRP',
    walletAddress: '0x1234567890123456789012345678901234567890'
  },
  {
    name: 'PrivacyFirst Computing',
    email: 'ccrp2@privacyfirst.com',
    description: 'GDPR-compliant confidential computing with zero-knowledge proofs',
    organization: 'PrivacyFirst Computing Inc.',
    phoneNumber: '+1-555-0102',
    website: 'https://privacyfirst.com/confidential',
    location: 'New York, NY',
    did: 'did:web:privacyfirst.com:ccrp:confidential',
    partyType: 'CCRP',
    walletAddress: '0x2345678901234567890123456789012345678901'
  },
  {
    name: 'TrustedCompute Solutions',
    email: 'ccrp3@trustedcompute.com',
    description: 'Intel SGX and AMD SEV enabled secure enclaves for AI training',
    organization: 'TrustedCompute Solutions Ltd.',
    phoneNumber: '+1-555-0103',
    website: 'https://trustedcompute.com/enclaves',
    location: 'Austin, TX',
    did: 'did:web:trustedcompute.com:ccrp:enclaves',
    partyType: 'CCRP',
    walletAddress: '0x3456789012345678901234567890123456789012'
  },
  {
    name: 'ConfidentialAI Platform',
    email: 'ccrp4@confidentialai.com',
    description: 'Specialized in confidential AI model training with federated learning support',
    organization: 'ConfidentialAI Platform Corp.',
    phoneNumber: '+1-555-0104',
    website: 'https://confidentialai.com/platform',
    location: 'Seattle, WA',
    did: 'did:web:confidentialai.com:ccrp:platform',
    partyType: 'CCRP',
    walletAddress: '0x4567890123456789012345678901234567890123'
  },
  {
    name: 'SecureEnclave Services',
    email: 'ccrp5@secureenclave.com',
    description: 'Hardware-backed secure enclaves with attestation and verification',
    organization: 'SecureEnclave Services LLC',
    phoneNumber: '+1-555-0105',
    website: 'https://secureenclave.com/services',
    location: 'Boston, MA',
    did: 'did:web:secureenclave.com:ccrp:services',
    partyType: 'CCRP',
    walletAddress: '0x5678901234567890123456789012345678901234'
  }
];

async function createSampleCCRPs() {
  try {
    console.log('🏗️ Creating sample CCRP users...\n');

    const createdCCRPs = [];
    const password = 'CCRP123!';

    for (const ccrpData of sampleCCRPs) {
      console.log(`Creating CCRP: ${ccrpData.name} (${ccrpData.email})`);
      
      // Check if user already exists
      const existingUser = await db.User.findOne({
        where: { email: ccrpData.email }
      });

      if (existingUser) {
        console.log(`   ⚠️ User already exists: ${ccrpData.email}`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create CCRP user
      const ccrpUser = await db.User.create({
        ...ccrpData,
        password: hashedPassword,
        didSource: 'SYSTEM_GENERATED',
        didVerified: true,
        didVerificationMethod: 'SYSTEM_GENERATED',
        isRegistered: true,
        registrationDate: new Date(),
        isActive: true,
        onboardingStatus: 'COMPLETED',
        profileCompleted: true,
        emailVerified: true,
        iamUserId: null,
        iamUsername: ccrpData.email
      });

      createdCCRPs.push(ccrpUser);
      console.log(`   ✅ Created: ${ccrpUser.name} (ID: ${ccrpUser.id})`);
    }

    console.log(`\n🎉 Successfully created ${createdCCRPs.length} CCRP users!`);
    
    console.log('\n📋 CCRP User Credentials:');
    console.log('All CCRPs use the same password: CCRP123!');
    console.log('\nAvailable CCRPs:');
    createdCCRPs.forEach((ccrp, index) => {
      console.log(`${index + 1}. ${ccrp.name}`);
      console.log(`   Email: ${ccrp.email}`);
      console.log(`   Organization: ${ccrp.organization}`);
      console.log(`   DID: ${ccrp.did}`);
      console.log(`   Description: ${ccrp.description}`);
      console.log('');
    });

    console.log('🔗 These CCRPs can now be selected by TDC users when creating contracts.');

  } catch (error) {
    console.error('❌ Error creating CCRP users:', error);
  }
}

createSampleCCRPs()
  .then(() => {
    console.log('\n🏁 Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  }); 