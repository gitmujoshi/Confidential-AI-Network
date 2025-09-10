'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔄 Fixing dataset column naming conventions...');
    
    // Rename camelCase columns to snake_case for consistency
    const columnRenames = [
      { from: 'accessControlPolicy', to: 'access_control_policy' },
      { from: 'attestationPolicy', to: 'attestation_policy' },
      { from: 'attestationRequired', to: 'attestation_required' },
      { from: 'auditConfiguration', to: 'audit_configuration' },
      { from: 'crossBorderTransferAllowed', to: 'cross_border_transfer_allowed' },
      { from: 'dataClassification', to: 'data_classification' },
      { from: 'dataResidencyRegion', to: 'data_residency_region' },
      { from: 'encryptionAlgorithm', to: 'encryption_algorithm' },
      { from: 'encryptionAtRest', to: 'encryption_at_rest' },
      { from: 'encryptionInTransit', to: 'encryption_in_transit' },
      { from: 'encryptionKeyId', to: 'encryption_key_id' },
      { from: 'keyRotationSchedule', to: 'key_rotation_schedule' },
      { from: 'processingLocation', to: 'processing_location' },
      { from: 'retentionPolicy', to: 'retention_policy' },
      { from: 'secureEnclaveRequired', to: 'secure_enclave_required' }
    ];

    for (const rename of columnRenames) {
      try {
        await queryInterface.renameColumn('datasets', rename.from, rename.to);
        console.log(`✅ Renamed ${rename.from} → ${rename.to}`);
      } catch (error) {
        console.log(`⚠️  Column ${rename.from} may not exist or already renamed: ${error.message}`);
      }
    }

    // Update indexes to use snake_case column names
    try {
      await queryInterface.removeIndex('datasets', 'idx_datasets_data_classification');
      await queryInterface.addIndex('datasets', {
        fields: ['data_classification'],
        name: 'idx_datasets_data_classification'
      });
      console.log('✅ Updated data_classification index');
    } catch (error) {
      console.log(`⚠️  Index update for data_classification: ${error.message}`);
    }

    try {
      await queryInterface.removeIndex('datasets', 'idx_datasets_secure_enclave_required');
      await queryInterface.addIndex('datasets', {
        fields: ['secure_enclave_required'],
        name: 'idx_datasets_secure_enclave_required'
      });
      console.log('✅ Updated secure_enclave_required index');
    } catch (error) {
      console.log(`⚠️  Index update for secure_enclave_required: ${error.message}`);
    }

    try {
      await queryInterface.removeIndex('datasets', 'idx_datasets_attestation_required');
      await queryInterface.addIndex('datasets', {
        fields: ['attestation_required'],
        name: 'idx_datasets_attestation_required'
      });
      console.log('✅ Updated attestation_required index');
    } catch (error) {
      console.log(`⚠️  Index update for attestation_required: ${error.message}`);
    }

    try {
      await queryInterface.removeIndex('datasets', 'idx_datasets_data_residency_region');
      await queryInterface.addIndex('datasets', {
        fields: ['data_residency_region'],
        name: 'idx_datasets_data_residency_region'
      });
      console.log('✅ Updated data_residency_region index');
    } catch (error) {
      console.log(`⚠️  Index update for data_residency_region: ${error.message}`);
    }

    console.log('🎉 Column naming convention fix completed!');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔄 Reverting dataset column naming conventions...');
    
    // Rename snake_case columns back to camelCase
    const columnRenames = [
      { from: 'access_control_policy', to: 'accessControlPolicy' },
      { from: 'attestation_policy', to: 'attestationPolicy' },
      { from: 'attestation_required', to: 'attestationRequired' },
      { from: 'audit_configuration', to: 'auditConfiguration' },
      { from: 'cross_border_transfer_allowed', to: 'crossBorderTransferAllowed' },
      { from: 'data_classification', to: 'dataClassification' },
      { from: 'data_residency_region', to: 'dataResidencyRegion' },
      { from: 'encryption_algorithm', to: 'encryptionAlgorithm' },
      { from: 'encryption_at_rest', to: 'encryptionAtRest' },
      { from: 'encryption_in_transit', to: 'encryptionInTransit' },
      { from: 'encryption_key_id', to: 'encryptionKeyId' },
      { from: 'key_rotation_schedule', to: 'keyRotationSchedule' },
      { from: 'processing_location', to: 'processingLocation' },
      { from: 'retention_policy', to: 'retentionPolicy' },
      { from: 'secure_enclave_required', to: 'secureEnclaveRequired' }
    ];

    for (const rename of columnRenames) {
      try {
        await queryInterface.renameColumn('datasets', rename.from, rename.to);
        console.log(`✅ Reverted ${rename.from} → ${rename.to}`);
      } catch (error) {
        console.log(`⚠️  Column ${rename.from} may not exist: ${error.message}`);
      }
    }

    console.log('🎉 Column naming convention revert completed!');
  }
};
