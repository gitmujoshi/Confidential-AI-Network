#!/usr/bin/env node
/**
 * Remove rows whose depa_id matches the *legacy* format (ENTITY-uuid with no deployment prefix),
 * as defined in backend/services/depaIdService.js (depaIdPatternLegacy). Prefixed IDs such as
 * US-EAST-TDC-... are kept.
 *
 * Usage:
 *   node scripts/dev/purge-legacy-depa-reseed.js
 *   node scripts/dev/purge-legacy-depa-reseed.js --dry-run
 */
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../../config.env') });
try {
  require('dotenv').config({ path: path.resolve(__dirname, '../../../secrets.env') });
} catch (_) {}

const db = require('../../models');
const DEPAIdService = require('../../services/depaIdService');
const { GUID_TAIL, destroyRelatedToContracts, seedUsEastBaselines } = require('./depaPurgeShared');

const LEGACY_USER_RE = `^(tdc|tdp|ccrp)-${GUID_TAIL}$`;
const LEGACY_CONTRACT_RE = `^contract-${GUID_TAIL}$`;
const LEGACY_DATASET_RE = `^dataset-${GUID_TAIL}$`;
const LEGACY_AIMODEL_RE = `^aimodel-${GUID_TAIL}$`;

async function findLegacyUserIds(sequelize, transaction) {
  const [rows] = await sequelize.query(
    `SELECT id FROM users WHERE depa_id ~* :re AND party_type IN ('TDC', 'TDP', 'CCRP')`,
    {
      replacements: { re: LEGACY_USER_RE },
      transaction,
    }
  );
  return rows.map((r) => r.id);
}

async function findContractKeysToPurge(sequelize, transaction) {
  const [rows] = await sequelize.query(
    `
    SELECT c.id AS "intId", c.contract_id AS "contractId"
    FROM contracts c
    WHERE (c.depa_id IS NOT NULL AND c.depa_id ~* :contractRe)
       OR c.tdc_id IN (SELECT id FROM users WHERE depa_id ~* :userRe AND party_type IN ('TDC','TDP','CCRP'))
       OR (c.ccrp_id IS NOT NULL AND c.ccrp_id IN (SELECT id FROM users WHERE depa_id ~* :userRe AND party_type IN ('TDC','TDP','CCRP')))
       OR EXISTS (
         SELECT 1
         FROM jsonb_array_elements(COALESCE(c.contract_datasets, '[]'::jsonb)) elem
         WHERE COALESCE(elem->>'depaId', '') ~* :datasetRe
            OR COALESCE(elem->>'tdpDepaId', '') ~* :tdpRe
            OR COALESCE(elem->>'tdcDepaId', '') ~* :tdcRe
            OR COALESCE(elem->>'ccrpDepaId', '') ~* :ccrpRe
       )
    `,
    {
      replacements: {
        contractRe: LEGACY_CONTRACT_RE,
        userRe: LEGACY_USER_RE,
        datasetRe: LEGACY_DATASET_RE,
        tdpRe: `^tdp-${GUID_TAIL}$`,
        tdcRe: `^tdc-${GUID_TAIL}$`,
        ccrpRe: `^ccrp-${GUID_TAIL}$`,
      },
      transaction,
    }
  );
  return rows;
}

async function purgeUserRelatedRows(db, userIds, transaction) {
  if (!userIds.length) return;
  await db.Notification.destroy({ where: { userId: userIds }, transaction });
  await db.UserKey.destroy({ where: { userId: userIds }, transaction });
  await db.CCRPAzureCredentials.destroy({ where: { ccrpUserId: userIds }, transaction });
  await db.SigningRequest.destroy({ where: { userId: userIds }, transaction });
  await db.EnterpriseKey.destroy({ where: { userId: userIds }, transaction });
  await db.Consent.destroy({ where: { userId: userIds }, transaction });
  await db.DataProcessingRecord.destroy({ where: { userId: userIds }, transaction });
  await db.Grievance.destroy({ where: { userId: userIds }, transaction });
  await db.AuditLog.destroy({ where: { userId: userIds }, transaction });
  await db.SigningEvent.destroy({ where: { userId: userIds }, transaction });
  await db.ContractTemplate.update({ createdBy: null }, { where: { createdBy: userIds }, transaction });
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const depaIdService = new DEPAIdService();
  console.log(`🧹 purge-legacy-depa-reseed (dryRun=${dryRun})`);
  console.log(`   DEPLOYMENT_PREFIX for new IDs: ${depaIdService.deploymentPrefix}`);

  await db.sequelize.authenticate();

  const legacyUserIdsPreview = await findLegacyUserIds(db.sequelize, undefined);
  const contractKeysPreview = await findContractKeysToPurge(db.sequelize, undefined);
  const [dsPrev] = await db.sequelize.query(
    `SELECT COUNT(*)::int AS n FROM datasets WHERE depa_id ~* :re`,
    { replacements: { re: LEGACY_DATASET_RE } }
  );
  const [mPrev] = await db.sequelize.query(
    `SELECT COUNT(*)::int AS n FROM ai_models WHERE depa_id ~* :re`,
    { replacements: { re: LEGACY_AIMODEL_RE } }
  );

  console.log(`   Legacy-pattern users (TDC|TDP|CCRP-uuid): ${legacyUserIdsPreview.length}`);
  console.log(`   Contracts to purge (related): ${contractKeysPreview.length}`);
  console.log(`   Legacy-pattern datasets: ${dsPrev[0]?.n ?? 0}`);
  console.log(`   Legacy-pattern AI models: ${mPrev[0]?.n ?? 0}`);

  if (dryRun) {
    console.log('Dry run: no changes.');
    await db.sequelize.close();
    process.exit(0);
    return;
  }

  await db.sequelize.transaction(async (t) => {
    const legacyUserIdsT = await findLegacyUserIds(db.sequelize, t);
    const contractRows = await findContractKeysToPurge(db.sequelize, t);
    const intIds = [...new Set(contractRows.map((r) => Number(r.intId)))];
    const stringIds = [...new Set(contractRows.map((r) => r.contractId))];

    await destroyRelatedToContracts(db, intIds, stringIds, t);
    await purgeUserRelatedRows(db, legacyUserIdsT, t);

    const [legacyDatasetRows] = await db.sequelize.query(
      `SELECT id FROM datasets WHERE depa_id ~* :re`,
      { replacements: { re: LEGACY_DATASET_RE }, transaction: t }
    );
    const legacyDatasetIds = legacyDatasetRows.map((r) => r.id);
    const ownedDatasetIds = legacyUserIdsT.length
      ? (
          await db.Dataset.findAll({
            where: { ownerId: legacyUserIdsT },
            attributes: ['id'],
            transaction: t,
          })
        ).map((r) => r.id)
      : [];
    const datasetIdsToDelete = [...new Set([...legacyDatasetIds, ...ownedDatasetIds])];
    if (datasetIdsToDelete.length) {
      await db.Dataset.destroy({ where: { id: datasetIdsToDelete }, transaction: t });
    }

    const [legacyModelRows] = await db.sequelize.query(
      `SELECT id FROM ai_models WHERE depa_id ~* :re`,
      { replacements: { re: LEGACY_AIMODEL_RE }, transaction: t }
    );
    const legacyModelIds = legacyModelRows.map((r) => r.id);
    if (legacyModelIds.length) {
      await db.AIModel.destroy({ where: { id: legacyModelIds }, transaction: t });
    }

    if (legacyUserIdsT.length) {
      await db.User.destroy({ where: { id: legacyUserIdsT }, transaction: t });
    }

    await seedUsEastBaselines(db, depaIdService, t, 'purge-legacy-depa-reseed');

    // AppAdmin rows were excluded from deletion but may still carry legacy TDC-… depa_ids.
    const admins = await db.User.findAll({
      where: { partyType: 'AppAdmin' },
      transaction: t,
    });
    for (const u of admins) {
      if (u.depaId && new RegExp(LEGACY_USER_RE, 'i').test(u.depaId)) {
        const next = depaIdService.generateUserDEPAId('AppAdmin');
        await u.update({ depaId: next }, { transaction: t });
        console.log(`  ~ AppAdmin ${u.id} depa_id → ${next}`);
      }
    }
  });

  console.log('✅ Legacy purge + reseed finished.');
  console.log('ℹ️  Keycloak: npm run ***REMOVED-KEYCLOAK_DB_PASSWORD***:sync --prefix backend');
}

main()
  .then(async () => {
    await db.sequelize.close();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ purge-legacy-depa-reseed failed:', err);
    try {
      await db.sequelize.close();
    } catch (_) {}
    process.exit(1);
  });
