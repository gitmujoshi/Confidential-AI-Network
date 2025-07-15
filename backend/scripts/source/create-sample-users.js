const { Sequelize } = require('sequelize');
require('dotenv').config({ path: './config.env' });

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: '***REMOVED-DB_PASSWORD***',
    logging: false
  }
);

async function createSampleUsers() {
  try {
    console.log('👤 Creating sample users...');
    const now = new Date();
    const users = [
      {
        name: 'Test TDP',
        email: 'tdpuser@example.com',
        partyType: 'TDP',
        walletAddress: '0xA1b2C3D4E5F678901234567890abcdef12345678',
        publicKey: '0x' + 'a'.repeat(128),
        description: 'Sample Training Data Provider',
        isRegistered: true,
        registrationDate: now,
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Test TDC',
        email: 'tdcuser@example.com',
        partyType: 'TDC',
        walletAddress: '0xB2c3D4E5F678901234567890abcdef1234567890',
        publicKey: '0x' + 'b'.repeat(128),
        description: 'Sample Training Data Consumer',
        isRegistered: true,
        registrationDate: now,
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Test CCRP',
        email: 'ccrpuser@example.com',
        partyType: 'CCRP',
        walletAddress: '0xC3d4E5F678901234567890abcdef1234567890ab',
        publicKey: '0x' + 'c'.repeat(128),
        description: 'Sample Confidential Clean Room Provider',
        isRegistered: true,
        registrationDate: now,
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Test AppAdmin',
        email: 'appadmin@example.com',
        partyType: 'TDP', // Use valid enum value
        walletAddress: '0xD4e5F678901234567890abcdef1234567890abcd',
        publicKey: '0x' + 'd'.repeat(128),
        description: 'Sample App Admin (AppAdmin role)',
        isRegistered: true,
        registrationDate: now,
        isActive: true,
        createdAt: now,
        updatedAt: now
        // isAppAdmin: true // (for reference, not stored in DB)
      }
    ];

    for (const user of users) {
      await sequelize.query(
        `INSERT INTO users (name, email, "partyType", "walletAddress", "publicKey", description, "isRegistered", "registrationDate", "isActive", "createdAt", "updatedAt")
         VALUES (:name, :email, :partyType, :walletAddress, :publicKey, :description, :isRegistered, :registrationDate, :isActive, :createdAt, :updatedAt)
         ON CONFLICT (email) DO NOTHING`,
        { replacements: user }
      );
      console.log(`✅ Created user: ${user.name} (${user.partyType})`);
    }
    await sequelize.close();
    console.log('🎉 Sample users created successfully!');
  } catch (error) {
    console.error('❌ Error creating sample users:', error);
    process.exit(1);
  }
}

createSampleUsers(); 