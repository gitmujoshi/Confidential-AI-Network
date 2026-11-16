'use strict';

const STATUS_VALUES = ['CANCELLED', 'REVOKED', 'TERMINATED'];
const TYPE_NAMES = ['enum_contracts_status', 'enum_contracts_multi_tdp_status'];

async function addEnumValues(queryInterface, typeName, values) {
  const dialect = queryInterface.sequelize.getDialect();
  if (dialect !== 'postgres') return;

  for (const value of values) {
    await queryInterface.sequelize.query(
      `ALTER TYPE "${typeName}" ADD VALUE IF NOT EXISTS '${value}'`,
      { transaction: null }
    );
  }
}

module.exports = {
  up: async (queryInterface) => {
    for (const typeName of TYPE_NAMES) {
      try {
        await addEnumValues(queryInterface, typeName, STATUS_VALUES);
      } catch (error) {
        console.warn(`Skipping enum update for ${typeName}:`, error.message);
      }
    }
  },

  down: async () => {
    // PostgreSQL cannot remove enum values safely; leave them in place.
  },
};
