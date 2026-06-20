/**
 * Migrate CCRP → TSP (Tech Service Provider) in party types and contract workflow enums.
 *
 * Usage: node backend/scripts/migration/migrate-ccrp-to-tsp.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../config.env') });

const db = require('../../models');

async function migrateCcrpToTsp() {
  console.log('🔄 Migrating CCRP → TSP...');

  await db.sequelize.query(`
    UPDATE users SET party_type = 'TSP' WHERE party_type = 'CCRP';
  `);

  await db.sequelize.query(`
    UPDATE contracts SET status = 'PENDING_TSP' WHERE status = 'PENDING_CCRP';
  `);
  await db.sequelize.query(`
    UPDATE contracts SET status = 'PENDING_TSP_APPROVAL' WHERE status = 'PENDING_CCRP_APPROVAL';
  `);
  await db.sequelize.query(`
    UPDATE contracts SET "multiTdpStatus" = 'PENDING_TSP' WHERE "multiTdpStatus" = 'PENDING_CCRP';
  `);

  await db.sequelize.query(`
    DO $$ BEGIN
      CREATE TYPE "enum_users_partyType_tsp" AS ENUM ('TDP', 'TDC', 'TSP', 'AppAdmin');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await db.sequelize.query(`
    ALTER TABLE users
    ALTER COLUMN "partyType" TYPE "enum_users_partyType_tsp"
    USING (
      CASE
        WHEN "partyType"::text = 'CCRP' THEN 'TSP'::"enum_users_partyType_tsp"
        ELSE "partyType"::text::"enum_users_partyType_tsp"
      END
    );
  `);

  await db.sequelize.query(`
    DO $$ BEGIN
      DROP TYPE IF EXISTS "enum_users_partyType";
    EXCEPTION WHEN dependent_objects_still_exist THEN
      ALTER TYPE "enum_users_partyType" RENAME TO "enum_users_partyType_old";
    END $$;
  `);

  await db.sequelize.query(`
    ALTER TYPE "enum_users_partyType_tsp" RENAME TO "enum_users_partyType";
  `);

  await db.sequelize.query(`
    DROP TYPE IF EXISTS "enum_users_partyType_old";
  `);

  console.log('✅ CCRP → TSP migration complete');
  console.log('ℹ️  Re-run Keycloak role sync if roles still use CCRP (setup-***REMOVED-KEYCLOAK_DB_PASSWORD*** creates TSP role).');
}

if (require.main === module) {
  migrateCcrpToTsp()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('💥 Migration failed:', err);
      process.exit(1);
    });
}

module.exports = migrateCcrpToTsp;
