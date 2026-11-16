/**
 * Idempotent Postgres enum bootstrap for cancel/revoke/terminate.
 * sequelize.sync({ alter: false }) will not add enum values.
 */

const VALUES = ['CANCELLED', 'REVOKED', 'TERMINATED'];
const TYPE_NAMES = ['enum_contracts_status', 'enum_contracts_multi_tdp_status'];

async function ensureContractLifecycleEnums(sequelize) {
  if (!sequelize) return;
  const dialect = sequelize.getDialect();
  if (dialect !== 'postgres') return;

  for (const typeName of TYPE_NAMES) {
    for (const value of VALUES) {
      try {
        await sequelize.query(`ALTER TYPE "${typeName}" ADD VALUE IF NOT EXISTS '${value}'`);
      } catch (_) {
        // type missing or value already present
      }
    }
  }
}

module.exports = { ensureContractLifecycleEnums };
