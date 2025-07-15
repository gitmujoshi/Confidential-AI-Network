const { Sequelize } = require('sequelize');
require('dotenv').config({ path: '../config.env' });

// Create Sequelize instance
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: '***REMOVED-DB_PASSWORD***',
  logging: false
});

async function addAiModelIdsField() {
  try {
    console.log('🔧 Adding aiModelIds field to contracts table...');
    
    // Add the aiModelIds column
    await sequelize.query(`
      ALTER TABLE contracts 
      ADD COLUMN IF NOT EXISTS aimodelids JSON;
    `);
    
    console.log('✅ aiModelIds field added successfully!');
    
    // Verify the column was added
    const [results] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'contracts' 
      AND column_name = 'aimodelids';
    `);
    
    if (results.length > 0) {
      console.log('✅ Column verification successful:', results[0]);
    } else {
      console.log('❌ Column verification failed');
    }
    
  } catch (error) {
    console.error('❌ Error adding aiModelIds field:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the migration
addAiModelIdsField(); 