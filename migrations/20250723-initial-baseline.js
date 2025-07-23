// Migration: Initial Baseline (v1.0.0)
// This migration creates the users, contracts, datasets, and notifications tables as per the v1.0.0 baseline.
// Keycloak baseline: see deployment/keycloak-config/realm-export.json
// Blockchain baseline: see blockchain/scripts/deploy.js

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // USERS TABLE
    await queryInterface.createTable('users', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      walletAddress: { type: Sequelize.STRING, allowNull: true, unique: true },
      publicKey: { type: Sequelize.TEXT, allowNull: true },
      partyType: { type: Sequelize.ENUM('TDP', 'TDC', 'CCRP', 'AppAdmin'), allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      password: { type: Sequelize.STRING, allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      isRegistered: { type: Sequelize.BOOLEAN, defaultValue: false },
      registrationDate: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      iamUserId: { type: Sequelize.STRING, allowNull: true, unique: true },
      iamUsername: { type: Sequelize.STRING, allowNull: true },
      did: { type: Sequelize.STRING, allowNull: true, unique: true },
      didSource: { type: Sequelize.ENUM('SYSTEM_GENERATED', 'USER_PROVIDED'), allowNull: true },
      didVerified: { type: Sequelize.BOOLEAN, defaultValue: false },
      didVerificationMethod: { type: Sequelize.STRING, allowNull: true },
      onboardingStatus: { type: Sequelize.ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED'), defaultValue: 'PENDING' },
      profileCompleted: { type: Sequelize.BOOLEAN, defaultValue: false },
      emailVerified: { type: Sequelize.BOOLEAN, defaultValue: false },
      emailVerificationToken: { type: Sequelize.STRING, allowNull: true },
      emailVerificationExpires: { type: Sequelize.DATE, allowNull: true },
      lastLoginAt: { type: Sequelize.DATE, allowNull: true },
      organization: { type: Sequelize.STRING, allowNull: true },
      phoneNumber: { type: Sequelize.STRING, allowNull: true },
      website: { type: Sequelize.STRING, allowNull: true },
      location: { type: Sequelize.STRING, allowNull: true },
      passwordResetToken: { type: Sequelize.STRING, allowNull: true },
      passwordResetExpires: { type: Sequelize.DATE, allowNull: true },
      cloudProviders: { type: Sequelize.JSON, allowNull: true },
      depaId: { type: Sequelize.STRING, allowNull: true, unique: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    // Indexes for users
    await queryInterface.addIndex('users', ['walletAddress'], { unique: true, where: { walletAddress: { [Sequelize.Op.ne]: null } } });
    await queryInterface.addIndex('users', ['iamUserId'], { unique: true });
    await queryInterface.addIndex('users', ['did'], { unique: true });
    await queryInterface.addIndex('users', ['partyType']);
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['publicKey'], { where: { publicKey: { [Sequelize.Op.ne]: null } } });
    await queryInterface.addIndex('users', ['onboardingStatus']);
    await queryInterface.addIndex('users', ['profileCompleted']);
    await queryInterface.addIndex('users', ['lastLoginAt']);
    await queryInterface.addIndex('users', ['depaId'], { unique: true });

    // CONTRACTS TABLE
    await queryInterface.createTable('contracts', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      contractId: { type: Sequelize.STRING, allowNull: false, unique: true },
      blockchainContractId: { type: Sequelize.INTEGER, allowNull: true },
      legaldocumenthash: { type: Sequelize.STRING(66), allowNull: true },
      ricardiansignature: { type: Sequelize.STRING(132), allowNull: true },
      smartcontractaddress: { type: Sequelize.STRING(42), allowNull: true },
      smartcontractnetwork: { type: Sequelize.STRING, allowNull: true, defaultValue: 'goerli' },
      status: { type: Sequelize.ENUM('DRAFT','PENDING_TDP','PENDING_TDP_APPROVAL','PENDING_TDC','PENDING_CCRP','PENDING_CCRP_APPROVAL','SIGNED','EXECUTING','COMPLETED','REJECTED','FAILED'), defaultValue: 'DRAFT' },
      price: { type: Sequelize.DECIMAL(10,2), allowNull: false },
      duration: { type: Sequelize.INTEGER, allowNull: false },
      termsAndConditions: { type: Sequelize.TEXT, allowNull: false },
      legaldocument: { type: Sequelize.JSON, allowNull: true },
      environmentspecs: { type: Sequelize.JSON, allowNull: true },
      trainingparams: { type: Sequelize.JSON, allowNull: true },
      aimodelids: { type: Sequelize.JSON, allowNull: true },
      attestationverified: { type: Sequelize.BOOLEAN, defaultValue: false },
      attestationreport: { type: Sequelize.JSON, allowNull: true },
      kmsconfigs: { type: Sequelize.JSON, allowNull: true },
      tdpSigned: { type: Sequelize.BOOLEAN, defaultValue: false },
      ccrpSigned: { type: Sequelize.BOOLEAN, defaultValue: false },
      tdpSignedAt: { type: Sequelize.DATE, allowNull: true },
      ccrpSignedAt: { type: Sequelize.DATE, allowNull: true },
      tdcId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
      ccrpId: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
      ccrpCloudProvider: { type: Sequelize.STRING, allowNull: true },
      contractDatasets: { type: Sequelize.JSON, allowNull: false },
      datasetCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      tdpCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      totalPrice: { type: Sequelize.DECIMAL(10,2), allowNull: true },
      tdpSignatures: { type: Sequelize.JSON, allowNull: true },
      tdpPayments: { type: Sequelize.JSON, allowNull: true },
      multiTdpStatus: { type: Sequelize.ENUM('DRAFT','PENDING_TDP','PENDING_ALL_TDP_APPROVAL','PENDING_TDC','PENDING_CCRP','SIGNED','EXECUTING','COMPLETED','REJECTED','FAILED'), defaultValue: 'DRAFT' },
      depaId: { type: Sequelize.STRING, allowNull: true, unique: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    // Indexes for contracts
    await queryInterface.addIndex('contracts', ['contractId'], { unique: true });
    await queryInterface.addIndex('contracts', ['status']);
    await queryInterface.addIndex('contracts', ['tdcId']);
    await queryInterface.addIndex('contracts', ['ccrpId']);
    await queryInterface.addIndex('contracts', ['blockchainContractId']);
    await queryInterface.addIndex('contracts', ['legaldocumenthash']);
    await queryInterface.addIndex('contracts', ['smartcontractaddress']);
    await queryInterface.addIndex('contracts', ['attestationverified']);
    await queryInterface.addIndex('contracts', ['depaId'], { unique: true });

    // DATASETS TABLE
    await queryInterface.createTable('datasets', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      datasetId: { type: Sequelize.STRING, allowNull: false, unique: true },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: false },
      category: { type: Sequelize.ENUM('Computer Vision', 'Natural Language Processing', 'Audio', 'Tabular', 'Multimodal'), allowNull: false },
      size: { type: Sequelize.INTEGER, allowNull: false },
      recordCount: { type: Sequelize.INTEGER, allowNull: false },
      price: { type: Sequelize.DECIMAL(10,2), allowNull: false },
      license: { type: Sequelize.STRING, allowNull: false },
      tags: { type: Sequelize.JSON, allowNull: true },
      metadata: { type: Sequelize.JSON, allowNull: true },
      isPublic: { type: Sequelize.BOOLEAN, defaultValue: true },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      ownerId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
      depaId: { type: Sequelize.STRING, allowNull: true, unique: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    // Indexes for datasets
    await queryInterface.addIndex('datasets', ['datasetId'], { unique: true });
    await queryInterface.addIndex('datasets', ['category']);
    await queryInterface.addIndex('datasets', ['ownerId']);
    await queryInterface.addIndex('datasets', ['isPublic']);

    // NOTIFICATIONS TABLE
    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      type: { type: Sequelize.ENUM('USER_REGISTERED','CONTRACT_CREATED','CONTRACT_SIGNED','CONTRACT_COMPLETED','CONTRACT_CANCELLED','CCRP_SELECTED'), allowNull: false },
      title: { type: Sequelize.STRING, allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: false },
      isRead: { type: Sequelize.BOOLEAN, defaultValue: false },
      metadata: { type: Sequelize.JSON, allowNull: true },
      userId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    // Indexes for notifications
    await queryInterface.addIndex('notifications', ['userId']);
    await queryInterface.addIndex('notifications', ['isRead']);
    await queryInterface.addIndex('notifications', ['type']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop in reverse order due to FKs and enums
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('datasets');
    await queryInterface.dropTable('contracts');
    await queryInterface.dropTable('users');
    // Drop enums
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_partyType"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_didSource"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_onboardingStatus"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_contracts_status"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_contracts_multiTdpStatus"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_datasets_category"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_notifications_type"');
  }
}; 