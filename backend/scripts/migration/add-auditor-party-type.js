/**
 * Add Auditor to users.partyType ENUM.
 *
 * Usage: node backend/scripts/migration/add-auditor-party-type.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../config.env') });

const db = require('../../models');

async function addAuditorPartyType() {
  console.log('🔄 Adding Auditor to enum_users_partyType...');

  // Postgres ENUM: ADD VALUE is transactional-safe with IF NOT EXISTS (PG 9.1+ / IF NOT EXISTS PG 9.3+)
  await db.sequelize.query(`
    DO $$ BEGIN
      ALTER TYPE "enum_users_partyType" ADD VALUE IF NOT EXISTS 'Auditor';
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN undefined_object THEN
        -- Fallback: recreate enum if type name differs (snake_case legacy)
        ALTER TYPE enum_users_party_type ADD VALUE IF NOT EXISTS 'Auditor';
    END $$;
  `).catch(async (err) => {
    console.warn('Primary ALTER failed, trying alternate enum name:', err.message);
    await db.sequelize.query(`
      ALTER TYPE enum_users_party_type ADD VALUE IF NOT EXISTS 'Auditor';
    `);
  });

  console.log('✅ Auditor party type available');
}

if (require.main === module) {
  addAuditorPartyType()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('💥 Migration failed:', err);
      process.exit(1);
    });
}

module.exports = addAuditorPartyType;
