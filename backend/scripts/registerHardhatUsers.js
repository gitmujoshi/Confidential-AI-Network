const { ethers } = require('ethers');
const db = require('../models');

const registerHardhatUsers = async () => {
  try {
    console.log('Registering users using Hardhat test wallets...\n');

    // Hardhat test accounts (Account #0 to #19)
    const hardhatWallets = [
      // Account #0 - TDP
      {
        walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
        partyType: 'TDP',
        name: 'Hardhat TDP Provider 1',
        email: 'hardhat.tdp1@test.com',
        description: 'Hardhat test wallet for TDP provider'
      },
      // Account #1 - TDC
      {
        walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
        partyType: 'TDC',
        name: 'Hardhat TDC Consumer 1',
        email: 'hardhat.tdc1@test.com',
        description: 'Hardhat test wallet for TDC consumer'
      },
      // Account #2 - CCRP
      {
        walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
        partyType: 'CCRP',
        name: 'Hardhat CCRP Provider 1',
        email: 'hardhat.ccrp1@test.com',
        description: 'Hardhat test wallet for CCRP provider'
      },
      // Account #3 - TDP
      {
        walletAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
        privateKey: '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
        partyType: 'TDP',
        name: 'Hardhat TDP Provider 2',
        email: 'hardhat.tdp2@test.com',
        description: 'Hardhat test wallet for TDP provider'
      },
      // Account #4 - TDC
      {
        walletAddress: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
        privateKey: '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a',
        partyType: 'TDC',
        name: 'Hardhat TDC Consumer 2',
        email: 'hardhat.tdc2@test.com',
        description: 'Hardhat test wallet for TDC consumer'
      },
      // Account #5 - CCRP
      {
        walletAddress: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
        privateKey: '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba',
        partyType: 'CCRP',
        name: 'Hardhat CCRP Provider 2',
        email: 'hardhat.ccrp2@test.com',
        description: 'Hardhat test wallet for CCRP provider'
      },
      // Account #6 - TDP
      {
        walletAddress: '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
        privateKey: '0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e',
        partyType: 'TDP',
        name: 'Hardhat TDP Provider 3',
        email: 'hardhat.tdp3@test.com',
        description: 'Hardhat test wallet for TDP provider'
      },
      // Account #7 - TDC
      {
        walletAddress: '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
        privateKey: '0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356',
        partyType: 'TDC',
        name: 'Hardhat TDC Consumer 3',
        email: 'hardhat.tdc3@test.com',
        description: 'Hardhat test wallet for TDC consumer'
      },
      // Account #8 - CCRP
      {
        walletAddress: '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f',
        privateKey: '0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97',
        partyType: 'CCRP',
        name: 'Hardhat CCRP Provider 3',
        email: 'hardhat.ccrp3@test.com',
        description: 'Hardhat test wallet for CCRP provider'
      },
      // Account #9 - TDP
      {
        walletAddress: '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720',
        privateKey: '0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6',
        partyType: 'TDP',
        name: 'Hardhat TDP Provider 4',
        email: 'hardhat.tdp4@test.com',
        description: 'Hardhat test wallet for TDP provider'
      }
    ];

    let successCount = 0;
    let errorCount = 0;

    for (const wallet of hardhatWallets) {
      try {
        // Check if user already exists
        const existingUser = await db.User.findOne({
          where: { walletAddress: wallet.walletAddress }
        });

        if (existingUser) {
          console.log(`⚠️  Wallet ${wallet.walletAddress} already registered as: ${existingUser.name}`);
          continue;
        }

        // Create new user
        const user = await db.User.create({
          walletAddress: wallet.walletAddress,
          partyType: wallet.partyType,
          name: wallet.name,
          email: wallet.email,
          description: wallet.description,
          isRegistered: true,
          registrationDate: new Date(),
          isActive: true
        });

        // Create welcome notification
        await db.Notification.create({
          userId: user.id,
          type: 'CONTRACT_CREATED',
          title: 'Welcome to Contract Management',
          message: `Welcome ${wallet.name}! Your account has been successfully registered as a ${wallet.partyType}.`,
          isRead: false,
          metadata: {
            partyType: wallet.partyType,
            registrationDate: new Date().toISOString()
          }
        });

        console.log(`✅ Registered ${wallet.partyType}: ${wallet.name}`);
        console.log(`   Wallet: ${wallet.walletAddress}`);
        console.log(`   Private Key: ${wallet.privateKey}`);
        console.log(`   User ID: ${user.id}\n`);
        
        successCount++;

      } catch (error) {
        console.error(`❌ Error registering ${wallet.name}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Registration Summary:`);
    console.log(`✅ Successfully registered: ${successCount} users`);
    console.log(`❌ Errors: ${errorCount} users`);
    console.log(`📝 Total processed: ${hardhatWallets.length} wallets`);

    // Display all registered users
    console.log(`\n📋 All registered users:`);
    const allUsers = await db.User.findAll({
      where: { isActive: true },
      order: [['partyType', 'ASC'], ['name', 'ASC']]
    });

    allUsers.forEach(user => {
      console.log(`   ${user.partyType}: ${user.name} (${user.walletAddress})`);
    });

  } catch (error) {
    console.error('❌ Script error:', error);
  } finally {
    process.exit(0);
  }
};

registerHardhatUsers(); 