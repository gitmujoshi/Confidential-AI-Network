const { sequelize } = require('../models');
const { DataTypes } = require('sequelize');

async function addCcrpCloudProviderField() {
  try {
    console.log('Adding ccrpCloudProvider field to contracts table...');
    
    // Add the ccrpCloudProvider column to the contracts table
    await sequelize.getQueryInterface().addColumn('contracts', 'ccrpCloudProvider', {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Selected cloud provider for this contract (AWS, GCP, Azure, OCI)'
    });
    
    console.log('✅ Successfully added ccrpCloudProvider field to contracts table');
    
    // Update existing contracts to have a default cloud provider if they have a CCRP
    const [results] = await sequelize.query(`
      UPDATE contracts 
      SET "ccrpCloudProvider" = 'AWS' 
      WHERE "ccrpId" IS NOT NULL AND "ccrpCloudProvider" IS NULL
    `);
    
    console.log(`✅ Updated ${results.affectedRows} existing contracts with default cloud provider`);
    
  } catch (error) {
    console.error('❌ Error adding ccrpCloudProvider field:', error);
    throw error;
  }
}

// Run the migration
addCcrpCloudProviderField()
  .then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }); 