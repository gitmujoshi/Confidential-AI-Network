const db = require('../../models');

async function addContractExecutionFields() {
  try {
    console.log('🔧 Adding Contract execution fields...');
    
    // Add serviceAccount field
    await db.sequelize.query(`
      ALTER TABLE contracts 
      ADD COLUMN "serviceAccount" VARCHAR
    `);
    console.log('✅ Added serviceAccount field');
    
    // Add containerImage field
    await db.sequelize.query(`
      ALTER TABLE contracts 
      ADD COLUMN "containerImage" VARCHAR
    `);
    console.log('✅ Added containerImage field');
    
    // Add logDestination field
    await db.sequelize.query(`
      ALTER TABLE contracts 
      ADD COLUMN "logDestination" VARCHAR
    `);
    console.log('✅ Added logDestination field');
    
    console.log('🎉 Contract execution fields migration completed successfully!');
  } catch (error) {
    console.error('❌ Error adding Contract execution fields:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  addContractExecutionFields()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addContractExecutionFields }; 