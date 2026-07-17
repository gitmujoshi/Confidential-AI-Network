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
    logging: console.log
  }
);

async function removeModelIdFromContracts() {
  try {
    console.log('🔧 Starting migration: Remove modelId from contracts table...');
    
    // Check if modelId column exists
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'contracts' AND column_name = 'modelId'
    `);
    
    if (results.length === 0) {
      console.log('✅ modelId column does not exist in contracts table');
      return;
    }
    
    console.log('📋 Found modelId column, removing it...');
    
    // Remove the modelId column
    await sequelize.query('ALTER TABLE contracts DROP COLUMN IF EXISTS "modelId"');
    
    console.log('✅ Successfully removed modelId column from contracts table');
    
    // Verify the column was removed
    const [verifyResults] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'contracts' AND column_name = 'modelId'
    `);
    
    if (verifyResults.length === 0) {
      console.log('✅ Verification successful: modelId column no longer exists');
    } else {
      console.log('❌ Verification failed: modelId column still exists');
    }
    
  } catch (error) {
    console.error('❌ Error removing modelId column:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the migration
removeModelIdFromContracts()
  .then(() => {
    console.log('🎉 Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }); 