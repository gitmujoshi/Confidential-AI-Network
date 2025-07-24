const { v4: uuidv4 } = require('uuid');
const db = require('../../models');

async function addDatasetDepaId() {
  try {
    console.log('🔧 Adding depaId field to datasets table...');
    
    // Add depaId column to datasets table
    await db.sequelize.query(`
      ALTER TABLE datasets 
      ADD COLUMN "depaId" VARCHAR(255) UNIQUE;
    `);
    
    console.log('✅ Added depaId column to datasets table');
    
    // Get all existing datasets
    const datasets = await db.Dataset.findAll({
      attributes: ['id', 'datasetId', 'name', 'ownerId']
    });
    
    console.log(`📊 Found ${datasets.length} existing datasets to update`);
    
    // Generate DEPA IDs for existing datasets
    for (const dataset of datasets) {
      const depaId = `DATASET-${uuidv4()}`;
      
      await db.Dataset.update(
        { depaId },
        { where: { id: dataset.id } }
      );
      
      console.log(`✅ Updated dataset "${dataset.name}" (${dataset.datasetId}) with DEPA ID: ${depaId}`);
    }
    
    console.log('\n🎉 Successfully added DEPA IDs to all datasets!');
    
  } catch (error) {
    console.error('❌ Error adding dataset DEPA IDs:', error);
  } finally {
    process.exit(0);
  }
}

addDatasetDepaId(); 