const { Sequelize } = require('sequelize');
const db = require('../../models');

async function updateContractEnum() {
  try {
    console.log('🔄 Updating contract status enum...');
    
    // Update existing records to use new enum values
    await db.sequelize.query(`
      UPDATE contracts 
      SET status = CASE 
        WHEN status = 'PENDING_TDP_APPROVAL' THEN 'PENDING_TDP'
        WHEN status = 'PENDING_CCRP_APPROVAL' THEN 'PENDING_CCRP'
        WHEN status = 'ACTIVE' THEN 'SIGNED'
        WHEN status = 'CANCELLED' THEN 'REJECTED'
        ELSE status
      END;
    `);
    
    console.log('✅ Contract status values updated successfully');
    
    // Also update multiTdpStatus if it exists
    try {
      await db.sequelize.query(`
        UPDATE contracts 
        SET "multiTdpStatus" = CASE 
          WHEN "multiTdpStatus" = 'PENDING_TDP_APPROVAL' THEN 'PENDING_TDP'
          WHEN "multiTdpStatus" = 'PENDING_CCRP_APPROVAL' THEN 'PENDING_CCRP'
          WHEN "multiTdpStatus" = 'ACTIVE' THEN 'SIGNED'
          WHEN "multiTdpStatus" = 'CANCELLED' THEN 'REJECTED'
          ELSE "multiTdpStatus"
        END;
      `);
      
      console.log('✅ Multi-TDP status values updated successfully');
    } catch (error) {
      console.log('ℹ️ Multi-TDP status column not found, skipping...');
    }
    
  } catch (error) {
    console.error('❌ Error updating contract enum:', error);
    throw error;
  }
}

// Run the migration if called directly
if (require.main === module) {
  updateContractEnum()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = updateContractEnum; 