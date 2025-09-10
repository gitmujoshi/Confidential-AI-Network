'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add security and encryption fields to datasets table
    await queryInterface.addColumn('datasets', 'encryptionKeyId', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Reference to encryption key for this dataset'
    });

    await queryInterface.addColumn('datasets', 'attestationPolicy', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'Attestation requirements for accessing this dataset'
    });

    await queryInterface.addColumn('datasets', 'accessControlPolicy', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'Fine-grained access control policy for this dataset'
    });

    await queryInterface.addColumn('datasets', 'dataClassification', {
      type: Sequelize.ENUM('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED', 'TOP_SECRET'),
      allowNull: false,
      defaultValue: 'INTERNAL',
      comment: 'Data sensitivity classification level'
    });

    await queryInterface.addColumn('datasets', 'retentionPolicy', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'Data retention and deletion policy'
    });

    await queryInterface.addColumn('datasets', 'auditConfiguration', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'Audit logging configuration for this dataset'
    });

    await queryInterface.addColumn('datasets', 'dataResidencyRegion', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Geographic region where data is stored'
    });

    await queryInterface.addColumn('datasets', 'processingLocation', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Allowed geographic regions for data processing'
    });

    await queryInterface.addColumn('datasets', 'crossBorderTransferAllowed', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether cross-border data transfer is allowed'
    });

    await queryInterface.addColumn('datasets', 'encryptionAlgorithm', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Encryption algorithm used for this dataset'
    });

    await queryInterface.addColumn('datasets', 'keyRotationSchedule', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'Key rotation policy and schedule'
    });

    await queryInterface.addColumn('datasets', 'encryptionAtRest', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether data is encrypted at rest'
    });

    await queryInterface.addColumn('datasets', 'encryptionInTransit', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether data is encrypted in transit'
    });

    await queryInterface.addColumn('datasets', 'secureEnclaveRequired', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether this dataset requires secure enclave processing'
    });

    await queryInterface.addColumn('datasets', 'attestationRequired', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether attestation is required for accessing this dataset'
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('datasets', ['dataClassification'], {
      name: 'idx_datasets_data_classification'
    });

    await queryInterface.addIndex('datasets', ['secureEnclaveRequired'], {
      name: 'idx_datasets_secure_enclave_required'
    });

    await queryInterface.addIndex('datasets', ['attestationRequired'], {
      name: 'idx_datasets_attestation_required'
    });

    await queryInterface.addIndex('datasets', ['dataResidencyRegion'], {
      name: 'idx_datasets_data_residency_region'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes first
    await queryInterface.removeIndex('datasets', 'idx_datasets_data_classification');
    await queryInterface.removeIndex('datasets', 'idx_datasets_secure_enclave_required');
    await queryInterface.removeIndex('datasets', 'idx_datasets_attestation_required');
    await queryInterface.removeIndex('datasets', 'idx_datasets_data_residency_region');

    // Remove columns
    await queryInterface.removeColumn('datasets', 'encryptionKeyId');
    await queryInterface.removeColumn('datasets', 'attestationPolicy');
    await queryInterface.removeColumn('datasets', 'accessControlPolicy');
    await queryInterface.removeColumn('datasets', 'dataClassification');
    await queryInterface.removeColumn('datasets', 'retentionPolicy');
    await queryInterface.removeColumn('datasets', 'auditConfiguration');
    await queryInterface.removeColumn('datasets', 'dataResidencyRegion');
    await queryInterface.removeColumn('datasets', 'processingLocation');
    await queryInterface.removeColumn('datasets', 'crossBorderTransferAllowed');
    await queryInterface.removeColumn('datasets', 'encryptionAlgorithm');
    await queryInterface.removeColumn('datasets', 'keyRotationSchedule');
    await queryInterface.removeColumn('datasets', 'encryptionAtRest');
    await queryInterface.removeColumn('datasets', 'encryptionInTransit');
    await queryInterface.removeColumn('datasets', 'secureEnclaveRequired');
    await queryInterface.removeColumn('datasets', 'attestationRequired');
  }
};
