'use strict';

/** Ensures training_jobs.metadata exists for TDC simulation + job state. */

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.addColumn('training_jobs', 'metadata', {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Job state, phases, simulation results, container snapshot refs',
      });
    } catch (e) {
      if (e.message && e.message.includes('already exists')) return;
      throw e;
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.removeColumn('training_jobs', 'metadata');
    } catch (e) {
      if (e.message && e.message.includes('does not exist')) return;
      throw e;
    }
  },
};
