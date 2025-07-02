const { Sequelize } = require('sequelize');
require('dotenv').config({ path: './config.env' });

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false
  }
);

// Test user public keys (these correspond to the private keys in the test wallets)
const testUserPublicKeys = {
  // TDP - Account #0
  '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266': '0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
  
  // TDC - Account #1  
  '0x70997970C51812dc3A010C7d01b50e0d17dc79C8': '0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
  
  // CCRP - Account #2
  '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC': '0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798'
};

async function updateTestUserPublicKeys() {
  try {
    console.log('Updating test user public keys...');
    
    for (const [walletAddress, publicKey] of Object.entries(testUserPublicKeys)) {
      const result = await sequelize.query(`
        UPDATE users 
        SET "publicKey" = :publicKey 
        WHERE "walletAddress" = :walletAddress
      `, {
        replacements: { publicKey, walletAddress },
        type: Sequelize.QueryTypes.UPDATE
      });
      
      console.log(`✅ Updated user ${walletAddress} with public key`);
    }
    
    console.log('✅ Successfully updated all test user public keys');
    
  } catch (error) {
    console.error('❌ Error updating test user public keys:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the script
if (require.main === module) {
  updateTestUserPublicKeys()
    .then(() => {
      console.log('Test user public key update completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test user public key update failed:', error);
      process.exit(1);
    });
}

module.exports = updateTestUserPublicKeys; 