const { Sequelize, DataTypes } = require('sequelize');
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

async function addPublicKeyColumn() {
  try {
    console.log('Adding publicKey column to users table...');
    
    // Add the publicKey column
    await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS "publicKey" TEXT;
    `);
    
    // Add a comment to the column
    await sequelize.query(`
      COMMENT ON COLUMN users."publicKey" IS 'Public key for cryptographic operations (hex format)';
    `);
    
    // Create an index on the publicKey column
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS "users_publicKey_idx" ON users ("publicKey");
    `);
    
    console.log('✅ Successfully added publicKey column to users table');
    
    // Update existing users with a placeholder public key (they'll need to update it)
    const updateCount = await sequelize.query(`
      UPDATE users 
      SET "publicKey" = '0x' || REPEAT('00', 64) 
      WHERE "publicKey" IS NULL;
    `);
    
    console.log(`✅ Updated ${updateCount[0].rowCount} existing users with placeholder public key`);
    console.log('⚠️  Note: Existing users will need to update their public keys');
    
  } catch (error) {
    console.error('❌ Error adding publicKey column:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the migration
if (require.main === module) {
  addPublicKeyColumn()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = addPublicKeyColumn; 