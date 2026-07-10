#!/usr/bin/env node
/**
 * Remove rows tied to legacy DEPA IDs with prefix LOCAL- and reseed baseline
 * users/datasets/models using the current DEPLOYMENT_PREFIX (e.g. US-EAST).
 *
 * Usage:
 *   node scripts/dev/purge-local-depa-reseed.js
 *   node scripts/dev/purge-local-depa-reseed.js --dry-run
 *
 * Loads config from repo root (same pattern as other dev scripts).
 */
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../../config.env') });
try {
  require('dotenv').config({ path: path.resolve(__dirname, '../../../secrets.env') });
} catch (_) {}

const db = require('../../models');
const DEPAIdService = require('../../services/depaIdService');
const { destroyRelatedToContracts, seedUsEastBaselines } = require('./depaPurgeShared');

const LOCAL_DEPA = { [Op.iLike]: 'LOCAL-%' };

async function findLocalUserIds(transaction) {
  const rows = await db.User.findAll({
    where: { depaId: LOCAL_DEPA },
    attributes: ['id'],
    transaction,
  });
  return rows.map((r) => r.id);
}

/**
 * Contracts to remove: LOCAL depa on contract, LOCAL party (TDC/CCRP), or LOCAL dataset depa in contract_datasets JSON.
 */
async function findContractKeysToPurge(sequelize, transaction) {
  const [rows] = await sequelize.query(
    `
    SELECT c.id AS "intId", c.contract_id AS "contractId"
    FROM contracts c
    WHERE c.depa_id ILIKE 'LOCAL-%'
       OR c.tdc_id IN (SELECT id FROM users WHERE depa_id ILIKE 'LOCAL-%')
       OR (c.ccrp_id IS NOT NULL AND c.ccrp_id IN (SELECT id FROM users WHERE depa_id ILIKE 'LOCAL-%'))
       OR EXISTS (
         SELECT 1
         FROM jsonb_array_elements(COALESCE(c.contract_datasets, '[]'::jsonb)) elem
         WHERE COALESCE(elem->>'depaId', '') ILIKE 'LOCAL-%'
       )
    `,
    { transaction }
  );
  return rows;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const depaIdService = new DEPAIdService();
  console.log(`🧹 purge-local-depa-reseed (dryRun=${dryRun})`);
  console.log(`   Effective DEPLOYMENT_PREFIX for new IDs: ${depaIdService.deploymentPrefix}`);

  await db.sequelize.authenticate();

  const localUserIdsPreview = await findLocalUserIds(undefined);
  const contractKeysPreview = await findContractKeysToPurge(db.sequelize, undefined);
  const localDatasetIdsPreview = (
    await db.Dataset.findAll({ where: { depaId: LOCAL_DEPA }, attributes: ['id'] })
  ).map((r) => r.id);
  const localModelIdsPreview = (
    await db.AIModel.findAll({ where: { depaId: LOCAL_DEPA }, attributes: ['id'] })
  ).map((r) => r.id);

  console.log(`   LOCAL- users: ${localUserIdsPreview.length}`);
  console.log(`   Contracts to purge (related): ${contractKeysPreview.length}`);
  console.log(`   LOCAL- datasets: ${localDatasetIdsPreview.length}`);
  console.log(`   LOCAL- AI models: ${localModelIdsPreview.length}`);

  if (dryRun) {
    console.log('Dry run: no changes.');
    await db.sequelize.close();
    process.exit(0);
    return;
  }

  await db.sequelize.transaction(async (t) => {
    const localUserIdsT = await findLocalUserIds(t);
    const contractRows = await findContractKeysToPurge(db.sequelize, t);
    const intIds = [...new Set(contractRows.map((r) => Number(r.intId)))];
    const stringIds = [...new Set(contractRows.map((r) => r.contractId))];

    await destroyRelatedToContracts(db, intIds, stringIds, t);

    if (localUserIdsT.length) {
      await db.Notification.destroy({ where: { userId: localUserIdsT }, transaction: t });
      await db.UserKey.destroy({ where: { userId: localUserIdsT }, transaction: t });
      await db.CCRPAzureCredentials.destroy({ where: { ccrpUserId: localUserIdsT }, transaction: t });
      await db.SigningRequest.destroy({ where: { userId: localUserIdsT }, transaction: t });
      await db.EnterpriseKey.destroy({ where: { userId: localUserIdsT }, transaction: t });
      await db.Consent.destroy({ where: { userId: localUserIdsT }, transaction: t });
      await db.DataProcessingRecord.destroy({ where: { userId: localUserIdsT }, transaction: t });
      await db.Grievance.destroy({ where: { userId: localUserIdsT }, transaction: t });
      await db.AuditLog.destroy({ where: { userId: localUserIdsT }, transaction: t });
      await db.SigningEvent.destroy({ where: { userId: localUserIdsT }, transaction: t });
      await db.ContractTemplate.update(
        { createdBy: null },
        { where: { createdBy: localUserIdsT }, transaction: t }
      );
    }

    const localDatasetIdsT = (
      await db.Dataset.findAll({ where: { depaId: LOCAL_DEPA }, attributes: ['id'], transaction: t })
    ).map((r) => r.id);
    const ownedDatasetIds = localUserIdsT.length
      ? (await db.Dataset.findAll({ where: { ownerId: localUserIdsT }, attributes: ['id'], transaction: t })).map(
          (r) => r.id
        )
      : [];
    const datasetIdsToDelete = [...new Set([...localDatasetIdsT, ...ownedDatasetIds])];
    if (datasetIdsToDelete.length) {
      await db.Dataset.destroy({ where: { id: datasetIdsToDelete }, transaction: t });
    }

    const localModelIdsT = (
      await db.AIModel.findAll({ where: { depaId: LOCAL_DEPA }, attributes: ['id'], transaction: t })
    ).map((r) => r.id);
    if (localModelIdsT.length) {
      await db.AIModel.destroy({ where: { id: localModelIdsT }, transaction: t });
    }

    if (localUserIdsT.length) {
      await db.User.destroy({ where: { id: localUserIdsT }, transaction: t });
    }

    await seedUsEastBaselines(db, depaIdService, t, 'purge-local-depa-reseed');
  });

  console.log('✅ Purge + reseed finished.');
  console.log('ℹ️  If you use Keycloak, re-sync or remove IAM users for deleted rows: npm run ***REMOVED-KEYCLOAK_DB_PASSWORD***:sync --prefix backend');
}

main()
  .then(async () => {
    await db.sequelize.close();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ purge-local-depa-reseed failed:', err);
    try {
      await db.sequelize.close();
    } catch (_) {}
    process.exit(1);
  });
