'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('can_jcs_jobs', 'ccrProvider', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'local'
    });

    await queryInterface.addColumn('can_jcs_jobs', 'trainingJobId', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('can_jcs_jobs', 'trainingJobId');
    await queryInterface.removeColumn('can_jcs_jobs', 'ccrProvider');
  }
};

