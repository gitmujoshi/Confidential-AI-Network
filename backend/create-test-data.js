#!/usr/bin/env node

const { setTestEnv } = require('../tests/test-env');
const { sequelize } = require('./models');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Set environment
setTestEnv('integration');

// Load configuration
const { getConfig } = require('../scripts/load-config');
const config = getConfig();

const { User, Contract, Dataset, Notification } = require('./models');

async function createTestData() {
  console.log('🚀 Creating test data...');
  
  try {
    // Create test users
    const users = [
      { name: 'Alice Johnson', email: 'alice@tdp.com', password: 'password123', partyType: 'TDP' },
      { name: 'Bob Smith', email: 'bob@tdc.com', password: 'password123', partyType: 'TDC' },
      { name: 'Carol Davis', email: 'carol@ccrp.com', password: 'password123', partyType: 'CCRP' },
      { name: 'David Wilson', email: 'david@admin.com', password: 'password123', partyType: 'AppAdmin' }
    ];

    const createdUsers = {};
    
    for (const userData of users) {
      try {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = await User.create({
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          partyType: userData.partyType,
          depaId: `${userData.partyType}-${crypto.randomUUID()}`,
          isRegistered: true,
          isActive: true,
          emailVerified: true,
          profileCompleted: true,
          firstLogin: false,
          onboardingStatus: 'COMPLETED',
          iamUserId: crypto.randomUUID(),
          iamUsername: userData.email,
          did: `did:web:example.com:user:${userData.email.split('@')[0]}`,
          didVerified: true,
          didSource: 'SYSTEM_GENERATED'
        });
        
        createdUsers[userData.partyType] = user;
        console.log(`✅ Created ${userData.partyType}: ${userData.name}`);
      } catch (error) {
        console.log(`⚠️ User ${userData.email} might already exist`);
      }
    }

    // Create test datasets
    if (createdUsers.TDP) {
      try {
        await Dataset.create({
          name: 'Healthcare Patient Records',
          description: 'Anonymized patient records from major hospitals',
          domain: 'Healthcare',
          dataType: 'TABULAR',
          size: '2.5TB',
          recordCount: 1500000,
          ownerId: createdUsers.TDP.id,
          dataClassification: 'CONFIDENTIAL',
          secureEnclaveRequired: true,
          tags: ['healthcare', 'patient-data'],
          isActive: true
        });
        console.log('✅ Created dataset: Healthcare Patient Records');
      } catch (error) {
        console.log('⚠️ Dataset creation failed');
      }
    }

    // Create test contract
    if (createdUsers.TDP && createdUsers.TDC && createdUsers.CCRP) {
      try {
        await Contract.create({
          title: 'Healthcare AI Model Training Agreement',
          description: 'Contract for training AI models on healthcare patient data',
          tdpId: createdUsers.TDP.id,
          tdcId: createdUsers.TDC.id,
          ccrpId: createdUsers.CCRP.id,
          status: 'ACTIVE',
          contractType: 'AI_TRAINING',
          dataUsage: 'MODEL_TRAINING',
          duration: 365,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31')
        });
        console.log('✅ Created contract: Healthcare AI Model Training Agreement');
      } catch (error) {
        console.log('⚠️ Contract creation failed');
      }
    }

    // Create test notifications
    if (createdUsers.TDP) {
      try {
        await Notification.create({
          type: 'INFO',
          title: 'Welcome to Contract Management System',
          message: 'Your account has been successfully created and is ready to use.',
          isRead: false,
          userId: createdUsers.TDP.id
        });
        console.log('✅ Created notification');
      } catch (error) {
        console.log('⚠️ Notification creation failed');
      }
    }

    console.log('\n🎉 Test data created successfully!');
    console.log('\n🔑 Test Login Credentials:');
    console.log('TDP User: alice@tdp.com / password123');
    console.log('TDC User: bob@tdc.com / password123');
    console.log('CCRP User: carol@ccrp.com / password123');
    console.log('Admin User: david@admin.com / password123');
    console.log('\n🚀 Ready to test the application!');
    
  } catch (error) {
    console.error('❌ Test data creation failed:', error.message);
    process.exit(1);
  }
}

createTestData();
