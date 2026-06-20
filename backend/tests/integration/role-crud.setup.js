// Role CRUD integration tests use JWT auth (no live Keycloak per request).
process.env.KEYCLOAK_ENABLED = 'false';

const { sequelize } = require('../../models');

/**
 * Ensure test database accepts TSP party type (idempotent; safe on dev/test DBs).
 */
async function ensureTspPartyTypeEnum() {
  try {
    await sequelize.query(`
      DO $$ BEGIN
        ALTER TYPE enum_users_party_type ADD VALUE IF NOT EXISTS 'TSP';
      EXCEPTION
        WHEN undefined_object THEN
          NULL;
        WHEN duplicate_object THEN
          NULL;
      END $$;
    `);
  } catch (_) {
    // Older PG without IF NOT EXISTS on enums — ignore if TSP already present.
  }

  try {
    await sequelize.query(`
      UPDATE users SET party_type = 'TSP' WHERE party_type = 'CCRP';
    `);
  } catch (_) {
    // Column may be camelCase on some DBs.
    try {
      await sequelize.query(`
        UPDATE users SET "partyType" = 'TSP' WHERE "partyType" = 'CCRP';
      `);
    } catch (inner) {
      console.warn('⚠️ role-crud setup: could not backfill TSP users:', inner.message);
    }
  }
}

beforeAll(async () => {
  await ensureTspPartyTypeEnum();
});
