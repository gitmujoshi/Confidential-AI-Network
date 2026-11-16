'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('users');
    if (table.cloud_account) return;
    await queryInterface.addColumn('users', 'cloud_account', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'TSP cloud account keyed by provider (Azure, OCI). Not secrets for a new subscription per job.',
    });
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('users');
    if (!table.cloud_account) return;
    await queryInterface.removeColumn('users', 'cloud_account');
  },
};
