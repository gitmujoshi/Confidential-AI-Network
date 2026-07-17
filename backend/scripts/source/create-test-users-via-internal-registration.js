/**
 * Create Test Users via Internal Registration Logic
 * 
 * This script creates test users using the internal registration logic
 * to ensure consistency with the real registration flow, including:
 * - Proper validation
 * - Keycloak integration (if available)
 * - Database operations
 * - DID generation
 * - Notification creation
 */

const db = require('../models');
const KeycloakService = require('../services/keycloakService');
const keycloakService = new KeycloakService();
const bcrypt = require('bcryptjs');

const testUsers = [
  // Training Data Providers (TDP)
  {
    name: 'tdp.medical@example.com',
    email: 'tdp.medical@example.com',
    partyType: 'TDP',
    organization: 'MedData Solutions Inc.',
    description: 'Leading provider of medical imaging datasets for AI healthcare applications',
    walletAddress: '0x340b30dc59b4cfb2f7ec80178ddd06ab1763b079',
    publicKey: '0x' + '0'.repeat(64),
    phoneNumber: '+1-555-1001',
    website: 'https://meddata-solutions.com',
    location: 'Boston, MA'
  },
  {
    name: 'tdp.nlp@example.com',
    email: 'tdp.nlp@example.com',
    partyType: 'TDP',
    organization: 'NLP Research Foundation',
    description: 'Specialized in natural language processing datasets and language models',
    walletAddress: '0xf5efa74782aca84e5ec32d3452efc064e3ada2ea',
    publicKey: '0x' + '0'.repeat(64),
    phoneNumber: '+1-555-1002',
    website: 'https://nlp-research.org',
    location: 'San Francisco, CA'
  },
  {
    name: 'tdp.autodrive@example.com',
    email: 'tdp.autodrive@example.com',
    partyType: 'TDP',
    organization: 'AutoDrive Technologies',
    description: 'Pioneering autonomous vehicle sensor data for safe AI training',
    walletAddress: '0xf06a58760e41531a5614080ae615454a9a0412f3',
    publicKey: '0x' + '0'.repeat(64),
    phoneNumber: '+1-555-1003',
    website: 'https://autodrive-tech.com',
    location: 'Palo Alto, CA'
  },

  // Training Data Consumers (TDC)
  {
    name: 'tdc.healthcare@example.com',
    email: 'tdc.healthcare@example.com',
    partyType: 'TDC',
    organization: 'AI Healthcare Innovations',
    description: 'AI research organization developing healthcare machine learning models',
    walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    publicKey: '0x' + '0'.repeat(64),
    phoneNumber: '+1-555-2001',
    website: 'https://ai-healthcare.com',
    location: 'New York, NY'
  },
  {
    name: 'tdc.fintech@example.com',
    email: 'tdc.fintech@example.com',
    partyType: 'TDC',
    organization: 'FinTech AI Labs',
    description: 'Financial technology company developing AI-powered trading algorithms',
    walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    publicKey: '0x' + '0'.repeat(64),
    phoneNumber: '+1-555-2002',
    website: 'https://fintech-ai.com',
    location: 'Chicago, IL'
  },
  {
    name: 'tdc.language@example.com',
    email: 'tdc.language@example.com',
    partyType: 'TDC',
    organization: 'Language AI Corp',
    description: 'Natural language processing company developing conversational AI',
    walletAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    publicKey: '0x' + '0'.repeat(64),
    phoneNumber: '+1-555-2003',
    website: 'https://language-ai.com',
    location: 'Seattle, WA'
  },

  // Confidential Clean Room Providers (CCRP)
  {
    name: 'ccrp.securecloud@example.com',
    email: 'ccrp.securecloud@example.com',
    partyType: 'CCRP',
    organization: 'SecureCloud Computing',
    description: 'Secure cloud infrastructure for confidential data processing',
    walletAddress: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    publicKey: '0x' + '0'.repeat(64),
    phoneNumber: '+1-555-3001',
    website: 'https://securecloud.com',
    location: 'Austin, TX'
  },
  {
    name: 'ccrp.trustedai@example.com',
    email: 'ccrp.trustedai@example.com',
    partyType: 'CCRP',
    organization: 'TrustedAI Computing',
    description: 'Trusted computing environment for AI model training',
    walletAddress: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
    publicKey: '0x' + '0'.repeat(64),
    phoneNumber: '+1-555-3002',
    website: 'https://trustedai.com',
    location: 'Denver, CO'
  },
  {
    name: 'ccrp.privacyfirst@example.com',
    email: 'ccrp.privacyfirst@example.com',
    partyType: 'CCRP',
    organization: 'PrivacyFirst Labs',
    description: 'Privacy-first confidential computing for sensitive data',
    walletAddress: '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
    publicKey: '0x' + '0'.repeat(64),
    phoneNumber: '+1-555-3003',
    website: 'https://privacyfirst.com',
    location: 'Portland, OR'
  },

  // Admin Users
  {
    name: 'admin@contractmanagement.com',
    email: 'admin@contractmanagement.com',
    partyType: 'AppAdmin',
    organization: 'Contract Management System',
    description: 'System administrator with full access to all features',
    walletAddress: null,
    publicKey: null,
    phoneNumber: '+1-555-0001',
    website: 'https://contractmanagement.com',
    location: 'System Headquarters'
  },
  {
    name: 'manager@contractmanagement.com',
    email: 'manager@contractmanagement.com',
    partyType: 'AppAdmin',
    organization: 'Contract Management System',
    description: 'Platform manager with administrative privileges',
    walletAddress: null,
    publicKey: null,
    phoneNumber: '+1-555-0002',
    website: 'https://contractmanagement.com',
    location: 'Platform Operations'
  }
];

async function createTestUsersViaInternalRegistration() {
  try {
    console.log('🔧 Creating test users via internal registration logic...\n');

    const createdUsers = [];
    const failedUsers = [];

    for (const userData of testUsers) {
      console.log(`Creating user: ${userData.email}`);
      
      try {
        // Check if user already exists
        const existingUser = await db.User.findOne({
          where: { email: userData.email.toLowerCase() }
        });

        if (existingUser) {
          console.log(`   ⚠️ User already exists: ${userData.email}`);
          // Update name to match email if different
          if (existingUser.name !== userData.name) {
            await existingUser.update({ name: userData.name });
            console.log(`   ✅ Updated name to match email: ${userData.name}`);
          }
          continue;
        }

        // Generate system DID
        const domain = userData.email.split('@')[1] || 'example.com';
        const did = `did:web:${domain}:user:${userData.email.split('@')[0]}`;

        // Generate temporary password
        const temporaryPassword = keycloakService.generateTemporaryPassword();

        // Start database transaction
        const transaction = await db.sequelize.transaction();

        try {
          // Try to create user in Keycloak first
          let keycloakResult = null;
          let keycloakSuccess = false;
          
          try {
            keycloakResult = await keycloakService.createUser({
              email: userData.email,
              name: userData.name,
              walletAddress: userData.walletAddress,
              partyType: userData.partyType,
              publicKey: userData.publicKey,
              organization: userData.organization,
              phoneNumber: userData.phoneNumber,
              website: userData.website,
              location: userData.location
            });
            keycloakSuccess = true;
            console.log('   ✅ Keycloak user created successfully');
          } catch (keycloakError) {
            console.log('   ⚠️ Failed to create user in Keycloak:', keycloakError.message);
            // Continue with database creation
          }

          // Create user in database
          const dbUser = await db.User.create({
            walletAddress: userData.walletAddress?.toLowerCase(),
            publicKey: userData.publicKey,
            partyType: userData.partyType,
            name: userData.name,
            email: userData.email.toLowerCase(),
            description: userData.description,
            organization: userData.organization,
            phoneNumber: userData.phoneNumber,
            website: userData.website,
            location: userData.location,
            did: did,
            didSource: 'SYSTEM_GENERATED',
            didVerified: true,
            didVerificationMethod: 'SYSTEM_GENERATED',
            isRegistered: true,
            registrationDate: new Date(),
            isActive: true,
            onboardingStatus: 'IN_PROGRESS',
            profileCompleted: false,
            emailVerified: false,
            iamUserId: keycloakResult?.keycloakUserId || null,
            iamUsername: userData.email
          }, { transaction });

          // Create notification
          await db.Notification.create({
            userId: dbUser.id,
            type: 'USER_REGISTERED',
            title: 'Welcome to Contract Management',
            message: `Welcome ${userData.name}! Your account has been successfully registered as a ${userData.partyType}. Please complete your profile and verify your email.`,
            isRead: false,
            metadata: {
              partyType: userData.partyType,
              registrationDate: new Date().toISOString(),
              onboardingStatus: 'IN_PROGRESS',
              did: did,
              didSource: 'SYSTEM_GENERATED',
              iamIntegrated: keycloakSuccess
            }
          }, { transaction });

          // Commit transaction
          await transaction.commit();

          createdUsers.push({
            email: userData.email,
            name: userData.name,
            partyType: userData.partyType,
            keycloakSuccess: keycloakSuccess,
            temporaryPassword: temporaryPassword
          });

          console.log(`   ✅ Created: ${userData.name} (${userData.partyType})`);
          console.log(`   🔑 Temporary password: ${temporaryPassword}`);

        } catch (error) {
          await transaction.rollback();
          throw error;
        }

      } catch (error) {
        failedUsers.push({
          email: userData.email,
          error: error.message
        });
        console.log(`   ❌ Failed: ${userData.email} - ${error.message}`);
      }
    }

    console.log(`\n🎉 Registration Summary:`);
    console.log(`✅ Successfully created: ${createdUsers.length} users`);
    console.log(`❌ Failed to create: ${failedUsers.length} users`);

    if (createdUsers.length > 0) {
      console.log('\n📋 Successfully Created Users:');
      createdUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.partyType})`);
        console.log(`   Password: ${user.temporaryPassword}`);
        console.log(`   Keycloak: ${user.keycloakSuccess ? '✅' : '❌'}`);
      });
    }

    if (failedUsers.length > 0) {
      console.log('\n❌ Failed Users:');
      failedUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} - ${user.error}`);
      });
    }

    console.log('\n🔑 Login Information:');
    console.log('- Use the email address for login');
    console.log('- Use the temporary passwords shown above');
    console.log('- All users have identical email and name for consistency');

  } catch (error) {
    console.error('❌ Error creating test users:', error.message);
  } finally {
    await db.sequelize.close();
  }
}

// Run the script
createTestUsersViaInternalRegistration(); 