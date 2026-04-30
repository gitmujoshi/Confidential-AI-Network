#!/usr/bin/env node

/**
 * Migration: Add DEPA ID to AI models
 *
 * - Adds `depa_id` column to `ai_models` (unique, nullable)
 * - Backfills missing depa_id with {DEPLOYMENT_PREFIX}-AIMODEL-{UUID}
 */

const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../config.env') });

const DEPAIdService = require('../../services/depaIdService');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
  }
);

async function main() {
  const depaIdService = new DEPAIdService();

  console.log('🆔 Adding depa_id to ai_models...');

  // 1) Add column if missing
  await sequelize.query(`
    ALTER TABLE ai_models
    ADD COLUMN IF NOT EXISTS depa_id VARCHAR(255);
  `);

  // 2) Add unique index (partial) if missing
  await sequelize.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_models_depa_id
    ON ai_models (depa_id)
    WHERE depa_id IS NOT NULL;
  `);

  // 3) Backfill depa_id for existing rows that are missing it
  const [rows] = await sequelize.query(`
    SELECT id
    FROM ai_models
    WHERE depa_id IS NULL
    ORDER BY id ASC;
  `);

  let updated = 0;
  for (const r of rows) {
    const depaId = depaIdService.generateDEPAId('AIMODEL');
    await sequelize.query(
      `UPDATE ai_models SET depa_id = :depaId, updated_at = NOW() WHERE id = :id AND depa_id IS NULL`,
      { replacements: { depaId, id: r.id } }
    );
    updated += 1;
  }

  console.log(`✅ Backfilled depa_id for ${updated} AI model(s).`);
}

main()
  .then(async () => {
    await sequelize.close();
    console.log('🎉 AI model DEPA ID migration completed successfully!');
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ AI model DEPA ID migration failed:', err);
    try {
      await sequelize.close();
    } catch (_) {}
    process.exit(1);
  });

