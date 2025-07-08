/**
 * Migration Script: Update PartyType ENUM to include AppAdmin
 * 
 * This script updates the partyType ENUM in the User model to include the new AppAdmin role.
 */

const db = require('../models');

async function updatePartyTypeEnum() {
  try {
    console.log('🔄 Updating partyType ENUM to include AppAdmin...');
    
    // PostgreSQL doesn't support adding values to ENUM types directly
    // We need to create a new type and alter the column
    await db.sequelize.query(`
      -- Create new ENUM type with AppAdmin
      CREATE TYPE "enum_users_partyType_new" AS ENUM ('TDP', 'TDC', 'CCRP', 'AppAdmin');
      
      -- Update the column to use the new type
      ALTER TABLE "users" 
      ALTER COLUMN "partyType" TYPE "enum_users_partyType_new" 
      USING "partyType"::text::"enum_users_partyType_new";
      
      -- Drop the old type
      DROP TYPE "enum_users_partyType";
      
      -- Rename the new type to the original name
      ALTER TYPE "enum_users_partyType_new" RENAME TO "enum_users_partyType";
    `);
    
    console.log('✅ PartyType ENUM updated successfully');
    
    // Verify the update
    const [results] = await db.sequelize.query(`
      SELECT unnest(enum_range(NULL::"enum_users_partyType")) as party_type;
    `);
    
    console.log('📋 Available party types:');
    results.forEach(row => {
      console.log(`   - ${row.party_type}`);
    });
    
  } catch (error) {
    console.error('❌ Error updating partyType ENUM:', error.message);
    
    // If the error is about the type already existing, that's okay
    if (error.message.includes('already exists')) {
      console.log('ℹ️ PartyType ENUM already includes AppAdmin');
    } else {
      throw error;
    }
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  updatePartyTypeEnum()
    .then(() => {
      console.log('🎉 Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = updatePartyTypeEnum; 