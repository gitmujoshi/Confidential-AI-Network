'use strict';

/** Add primary party columns used by contractService / Ricardian flows (idempotent). */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE contracts ADD COLUMN IF NOT EXISTS tdp_id INTEGER;
      ALTER TABLE contracts ADD COLUMN IF NOT EXISTS primary_tdp_id INTEGER;
      ALTER TABLE contracts ADD COLUMN IF NOT EXISTS dataset_id INTEGER;
      ALTER TABLE contracts ADD COLUMN IF NOT EXISTS primary_dataset_id INTEGER;
      ALTER TABLE contracts ADD COLUMN IF NOT EXISTS tdp_signed BOOLEAN DEFAULT false;
      ALTER TABLE contracts ADD COLUMN IF NOT EXISTS tdp_signed_at TIMESTAMP WITH TIME ZONE;
      ALTER TABLE contracts ADD COLUMN IF NOT EXISTS tdc_signed BOOLEAN DEFAULT false;
      ALTER TABLE contracts ADD COLUMN IF NOT EXISTS tdc_signed_at TIMESTAMP WITH TIME ZONE;
    `);
  },

  async down(queryInterface) {
    for (const col of [
      'tdc_signed_at',
      'tdc_signed',
      'tdp_signed_at',
      'tdp_signed',
      'primary_dataset_id',
      'dataset_id',
      'primary_tdp_id',
      'tdp_id',
    ]) {
      try {
        await queryInterface.removeColumn('contracts', col);
      } catch (_) {
        /* column may not exist */
      }
    }
  },
};
