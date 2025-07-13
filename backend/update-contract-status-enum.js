const db = require('./models');

async function updateContractStatusEnum() {
  try {
    console.log('🔄 Updating contract status enum...');
    
    // Add new enum values to the existing enum
    await db.sequelize.query(`
      ALTER TYPE enum_contracts_status ADD VALUE IF NOT EXISTS 'PENDING_ALL_TDP_APPROVAL';
    `, { type: db.sequelize.QueryTypes.RAW });
    
    await db.sequelize.query(`
      ALTER TYPE enum_contracts_status ADD VALUE IF NOT EXISTS 'PARTIALLY_TDP_APPROVED';
    `, { type: db.sequelize.QueryTypes.RAW });
    
    await db.sequelize.query(`
      ALTER TYPE enum_contracts_status ADD VALUE IF NOT EXISTS 'ALL_TDP_APPROVED';
    `, { type: db.sequelize.QueryTypes.RAW });
    
    console.log('✅ Added new enum values to contracts_status');
    
    // Verify the updated enum values
    const result = await db.sequelize.query(
      "SELECT unnest(enum_range(NULL::enum_contracts_status)) as status_values",
      { type: db.sequelize.QueryTypes.SELECT }
    );
    
    console.log('📊 Updated status enum values:', result.map(r => r.status_values));
    
  } catch (error) {
    console.error('❌ Error updating enum:', error);
  }
}

updateContractStatusEnum().then(() => {
  console.log('🏁 Enum update completed');
  process.exit(0);
}).catch(console.error); 