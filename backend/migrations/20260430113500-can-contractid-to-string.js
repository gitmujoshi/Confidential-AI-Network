'use strict';

module.exports = {
  up: async (queryInterface) => {
    // Convert CAN contractId columns from UUID to TEXT to match platform contractId (string).
    await queryInterface.sequelize.query(
      'ALTER TABLE can_jcs_jobs ALTER COLUMN "contractId" TYPE TEXT USING "contractId"::text;'
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE can_ccr_sessions ALTER COLUMN "contractId" TYPE TEXT USING "contractId"::text;'
    );
  },

  down: async (queryInterface, Sequelize) => {
    // Best-effort rollback: convert back to UUID if possible.
    await queryInterface.sequelize.query(
      'ALTER TABLE can_jcs_jobs ALTER COLUMN "contractId" TYPE UUID USING "contractId"::uuid;'
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE can_ccr_sessions ALTER COLUMN "contractId" TYPE UUID USING "contractId"::uuid;'
    );
  }
};

