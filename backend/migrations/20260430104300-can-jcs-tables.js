'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('can_ccr_sessions', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      contractId: { type: Sequelize.UUID, allowNull: false },
      state: { type: Sequelize.STRING, allowNull: false, defaultValue: 'REQUESTED' },
      ccrNodeId: { type: Sequelize.STRING, allowNull: true },
      tdImageHash: { type: Sequelize.TEXT, allowNull: true },
      attestationRef: { type: Sequelize.TEXT, allowNull: true },
      dekReceived: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      mekReceived: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      startedAt: { type: Sequelize.DATE, allowNull: true },
      completedAt: { type: Sequelize.DATE, allowNull: true },
      destroyedAt: { type: Sequelize.DATE, allowNull: true }
    });

    await queryInterface.createTable('can_jcs_jobs', {
      jobId: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      contractId: { type: Sequelize.UUID, allowNull: false },
      ccrSessionId: { type: Sequelize.UUID, allowNull: true },
      escrowState: { type: Sequelize.STRING, allowNull: false, defaultValue: 'OPEN' },
      dekReceivedAt: { type: Sequelize.DATE, allowNull: true },
      mekReceivedAt: { type: Sequelize.DATE, allowNull: true },
      escrowDeadline: { type: Sequelize.DATE, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      resolvedAt: { type: Sequelize.DATE, allowNull: true }
    });

    await queryInterface.createTable('can_jcs_attestations', {
      ccrSessionId: { type: Sequelize.UUID, primaryKey: true },
      jobId: { type: Sequelize.UUID, allowNull: false, unique: true },
      reportFormat: { type: Sequelize.STRING, allowNull: false, defaultValue: 'SIMULATED' },
      attestationReport: { type: Sequelize.BLOB, allowNull: false },
      tlsPublicKey: { type: Sequelize.TEXT, allowNull: false },
      enclaveMeasurements: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      keyDeliveryEndpoint: { type: Sequelize.TEXT, allowNull: false },
      platformSignature: { type: Sequelize.TEXT, allowNull: false },
      generatedAt: { type: Sequelize.DATE, allowNull: false },
      expiresAt: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.createTable('can_jcs_events', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      jobId: { type: Sequelize.UUID, allowNull: false },
      seq: { type: Sequelize.INTEGER, allowNull: false },
      eventType: { type: Sequelize.STRING, allowNull: false },
      payload: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') }
    });

    await queryInterface.addConstraint('can_jcs_events', {
      fields: ['jobId', 'seq'],
      type: 'unique',
      name: 'can_jcs_events_job_seq_unique'
    });

    await queryInterface.addIndex('can_jcs_events', ['jobId', 'createdAt'], { name: 'can_jcs_events_job_created_idx' });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('can_jcs_events');
    await queryInterface.dropTable('can_jcs_attestations');
    await queryInterface.dropTable('can_jcs_jobs');
    await queryInterface.dropTable('can_ccr_sessions');
  }
};

