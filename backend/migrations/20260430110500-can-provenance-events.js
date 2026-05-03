'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('can_provenance_events', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      stream: { type: Sequelize.STRING, allowNull: false, defaultValue: 'CAN_JCS' },
      jobId: { type: Sequelize.UUID, allowNull: false },
      seq: { type: Sequelize.INTEGER, allowNull: false },
      eventType: { type: Sequelize.STRING, allowNull: false },
      payload: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      prevHash: { type: Sequelize.TEXT, allowNull: true },
      hash: { type: Sequelize.TEXT, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') }
    });

    await queryInterface.addConstraint('can_provenance_events', {
      fields: ['jobId', 'seq'],
      type: 'unique',
      name: 'can_provenance_events_job_seq_unique'
    });

    await queryInterface.addIndex('can_provenance_events', ['jobId', 'createdAt'], { name: 'can_prov_job_created_idx' });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('can_provenance_events');
  }
};

