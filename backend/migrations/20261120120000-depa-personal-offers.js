'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('depa_personal_offers', {
      offerId: { type: Sequelize.UUID, primaryKey: true },
      contractId: { type: Sequelize.STRING, allowNull: true },
      providerUserId: { type: Sequelize.INTEGER, allowNull: true },
      purpose: { type: Sequelize.STRING, allowNull: false },
      fields: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
      personalData: { type: Sequelize.JSONB, allowNull: false },
      status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'open' },
      principalId: { type: Sequelize.STRING, allowNull: true },
      artefactPayload: { type: Sequelize.TEXT, allowNull: true },
      signature: { type: Sequelize.TEXT, allowNull: true },
      publicKey: { type: Sequelize.TEXT, allowNull: true },
      consentedAt: { type: Sequelize.DATE, allowNull: true },
      expiresAt: { type: Sequelize.DATE, allowNull: true },
      releasedAt: { type: Sequelize.DATE, allowNull: true },
      withdrawnAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('depa_personal_offers');
  },
};
