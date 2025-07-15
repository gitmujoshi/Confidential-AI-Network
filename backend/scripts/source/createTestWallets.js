const { ethers } = require('ethers');
const db = require('../models');

const createTestWallets = async () => {
  try {
    console.log('Creating test wallets for different party types...\n');

    // Test wallet configurations
    const testWallets = [
      // Training Data Providers (TDP)
      {
        partyType: 'TDP',
        name: 'Test TDP Provider 1',
        email: 'tdp1@test.com',
        description: 'Test Training Data Provider for development'
      },
      {
        partyType: 'TDP',
        name: 'Test TDP Provider 2',
        email: 'tdp2@test.com',
        description: 'Another test TDP for contract testing'
      },
      {
        partyType: 'TDP',
        name: 'Test TDP Provider 3',
        email: 'tdp3@test.com',
        description: 'Third test TDP provider'
      },

      // Training Data Consumers (TDC)
      {
        partyType: 'TDC',
        name: 'Test TDC Consumer 1',
        email: 'tdc1@test.com',
        description: 'Test Training Data Consumer for development'
      },
      {
        partyType: 'TDC',
        name: 'Test TDC Consumer 2',
        email: 'tdc2@test.com',
        description: 'Another test TDC for contract testing'
      },
      {
        partyType: 'TDC',
        name: 'Test TDC Consumer 3',
        email: 'tdc3@test.com',
        description: 'Third test TDC consumer'
      },

      // Confidential Clean Room Providers (CCRP)
      {
        partyType: 'CCRP',
        name: 'Test CCRP Provider 1',
        email: 'ccrp1@test.com',
        description: 'Test Confidential Clean Room Provider for development'
      },
      {
        partyType: 'CCRP',
        name: 'Test CCRP Provider 2',
        email: 'ccrp2@test.com',
        description: 'Another test CCRP for contract testing'
      },
      {
        partyType: 'CCRP',
        name: 'Test CCRP Provider 3',
        email: 'ccrp3@test.com',
        description: 'Third test CCRP provider'
      }
    ];

    const createdWallets = [];

    for (const config of testWallets) {
      // Generate a new wallet
      const wallet = ethers.Wallet.createRandom();
      
      console.log(`Creating ${config.partyType} wallet:`);
      console.log(`  Name: ${config.name}`);
      console.log(`  Email: ${config.email}`);
      console.log(`  Wallet Address: ${wallet.address}`);
      console.log(`  Private Key: ${wallet.privateKey}`);
      console.log('');

      // Check if user already exists
      const existingUser = await db.User.findOne({
        where: { walletAddress: wallet.address }
      });

      if (existingUser) {
        console.log(`  ⚠️  User with wallet ${wallet.address} already exists, skipping...\n`);
        continue;
      }

      // Check if email already exists
      const existingEmail = await db.User.findOne({
        where: { email: config.email }
      });

      if (existingEmail) {
        console.log(`  ⚠️  User with email ${config.email} already exists, skipping...\n`);
        continue;
      }

      // Create user
      const user = await db.User.create({
        walletAddress: wallet.address,
        partyType: config.partyType,
        name: config.name,
        email: config.email,
        description: config.description,
        isRegistered: true,
        registrationDate: new Date(),
        isActive: true
      });

      // Create welcome notification
      await db.Notification.create({
        userId: user.id,
        type: 'CONTRACT_CREATED',
        title: 'Welcome to Contract Management',
        message: `Welcome ${config.name}! Your test account has been successfully registered as a ${config.partyType}.`,
        isRead: false,
        metadata: {
          partyType: config.partyType,
          registrationDate: new Date().toISOString(),
          isTestWallet: true
        }
      });

      createdWallets.push({
        ...config,
        walletAddress: wallet.address,
        privateKey: wallet.privateKey,
        userId: user.id
      });

      console.log(`  ✅ Created successfully (User ID: ${user.id})\n`);
    }

    console.log('=== SUMMARY ===');
    console.log(`Created ${createdWallets.length} new test wallets:\n`);

    // Group by party type
    const groupedWallets = {
      TDP: createdWallets.filter(w => w.partyType === 'TDP'),
      TDC: createdWallets.filter(w => w.partyType === 'TDC'),
      CCRP: createdWallets.filter(w => w.partyType === 'CCRP')
    };

    for (const [partyType, wallets] of Object.entries(groupedWallets)) {
      console.log(`${partyType} Wallets (${wallets.length}):`);
      wallets.forEach(wallet => {
        console.log(`  - ${wallet.name}: ${wallet.walletAddress}`);
        console.log(`    Private Key: ${wallet.privateKey}`);
      });
      console.log('');
    }

    console.log('=== USAGE INSTRUCTIONS ===');
    console.log('1. Use these wallet addresses for user registration in the frontend');
    console.log('2. Use the private keys for contract signing operations');
    console.log('3. These are test wallets - do not use on mainnet!');
    console.log('4. All wallets have 10,000 ETH on the local Hardhat network');

    return createdWallets;

  } catch (error) {
    console.error('Error creating test wallets:', error);
    throw error;
  }
};

// Run the script if called directly
if (require.main === module) {
  createTestWallets()
    .then(() => {
      console.log('\n✅ Test wallet creation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error creating test wallets:', error);
      process.exit(1);
    });
}

module.exports = createTestWallets; 