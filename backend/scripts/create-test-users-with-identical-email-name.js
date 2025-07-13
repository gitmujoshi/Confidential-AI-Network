/**
 * Create Test Users with Identical Email and Name
 * 
 * This script creates test users where the email and name are identical
 * for consistency across the system.
 */

const db = require('../models');
const bcrypt = require('bcryptjs');

const testUsers = [
  // Training Data Providers (TDP)
  {
    email: 'tdp.medical@example.com',
    name: 'tdp.medical@example.com',
    partyType: 'TDP',
    organization: 'MedData Solutions Inc.',
    description: 'Leading provider of medical imaging datasets for AI healthcare applications',
    walletAddress: '0x340b30dc59b4cfb2f7ec80178ddd06ab1763b079',
    did: 'did:web:meddata-solutions.com',
    password: 'password123'
  },
  {
    email: 'tdp.nlp@example.com',
    name: 'tdp.nlp@example.com',
    partyType: 'TDP',
    organization: 'NLP Research Foundation',
    description: 'Specialized in natural language processing datasets and language models',
    walletAddress: '0xf5efa74782aca84e5ec32d3452efc064e3ada2ea',
    did: 'did:web:nlp-research.org',
    password: 'password123'
  },
  {
    email: 'tdp.autodrive@example.com',
    name: 'tdp.autodrive@example.com',
    partyType: 'TDP',
    organization: 'AutoDrive Technologies',
    description: 'Pioneering autonomous vehicle sensor data for safe AI training',
    walletAddress: '0xf06a58760e41531a5614080ae615454a9a0412f3',
    did: 'did:web:autodrive-tech.com',
    password: 'password123'
  },

  // Training Data Consumers (TDC)
  {
    email: 'tdc.healthcare@example.com',
    name: 'tdc.healthcare@example.com',
    partyType: 'TDC',
    organization: 'AI Healthcare Innovations',
    description: 'AI research organization developing healthcare machine learning models',
    walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    did: 'did:web:ai-healthcare.com',
    password: 'password123'
  },
  {
    email: 'tdc.fintech@example.com',
    name: 'tdc.fintech@example.com',
    partyType: 'TDC',
    organization: 'FinTech AI Labs',
    description: 'Financial technology company developing AI-powered trading algorithms',
    walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    did: 'did:web:fintech-ai.com',
    password: 'password123'
  },
  {
    email: 'tdc.language@example.com',
    name: 'tdc.language@example.com',
    partyType: 'TDC',
    organization: 'Language AI Corp',
    description: 'Natural language processing company developing conversational AI',
    walletAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    did: 'did:web:language-ai.com',
    password: 'password123'
  },

  // Confidential Clean Room Providers (CCRP)
  {
    email: 'ccrp.securecloud@example.com',
    name: 'ccrp.securecloud@example.com',
    partyType: 'CCRP',
    organization: 'SecureCloud Computing',
    description: 'Secure cloud infrastructure for confidential data processing',
    walletAddress: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    did: 'did:web:securecloud.com',
    password: 'password123'
  },
  {
    email: 'ccrp.trustedai@example.com',
    name: 'ccrp.trustedai@example.com',
    partyType: 'CCRP',
    organization: 'TrustedAI Computing',
    description: 'Trusted computing environment for AI model training',
    walletAddress: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
    did: 'did:web:trustedai.com',
    password: 'password123'
  },
  {
    email: 'ccrp.privacyfirst@example.com',
    name: 'ccrp.privacyfirst@example.com',
    partyType: 'CCRP',
    organization: 'PrivacyFirst Labs',
    description: 'Privacy-first confidential computing for sensitive data',
    walletAddress: '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
    did: 'did:web:privacyfirst.com',
    password: 'password123'
  },

  // Admin Users
  {
    email: 'admin@contractmanagement.com',
    name: 'admin@contractmanagement.com',
    partyType: 'AppAdmin',
    organization: 'Contract Management System',
    description: 'System administrator with full access to all features',
    walletAddress: null,
    did: 'did:web:contractmanagement.com:admin:system',
    password: 'password123'
  },
  {
    email: 'manager@contractmanagement.com',
    name: 'manager@contractmanagement.com',
    partyType: 'AppAdmin',
    organization: 'Contract Management System',
    description: 'Platform manager with administrative privileges',
    walletAddress: null,
    did: 'did:web:contractmanagement.com:admin:manager',
    password: 'password123'
  }
];

async function createTestUsersWithIdenticalEmailName() {
  try {
    console.log('🔧 Creating test users with identical email and name...\n');

    const createdUsers = [];

    for (const userData of testUsers) {
      console.log(`Creating user: ${userData.email}`);
      
      // Check if user already exists
      const existingUser = await db.User.findOne({
        where: { email: userData.email }
      });

      if (existingUser) {
        console.log(`   ⚠️ User already exists: ${userData.email}`);
        // Update the name to match email if different
        if (existingUser.name !== userData.name) {
          await existingUser.update({ name: userData.name });
          console.log(`   ✅ Updated name to match email: ${userData.name}`);
        }
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user
      const user = await db.User.create({
        email: userData.email,
        name: userData.name, // Identical to email
        password: hashedPassword,
        partyType: userData.partyType,
        organization: userData.organization,
        description: userData.description,
        walletAddress: userData.walletAddress,
        publicKey: '0x' + '0'.repeat(64), // Default public key
        did: userData.did,
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
        iamUsername: userData.email
      });

      createdUsers.push(user);
      console.log(`   ✅ Created: ${user.name} (${user.partyType})`);
    }

    console.log(`\n🎉 Successfully created/updated ${createdUsers.length} test users!`);
    
    console.log('\n📋 Test User Credentials:');
    console.log('All users use password: password123');
    console.log('\nAvailable users:');
    testUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.partyType})`);
    });

    console.log('\n🔑 Login Information:');
    console.log('- Email/Username: Use the email address');
    console.log('- Password: password123');
    console.log('- All users have identical email and name for consistency');

  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    await db.sequelize.close();
  }
}

// Run the script
createTestUsersWithIdenticalEmailName(); 