/**
 * Migration: Fix New Features Schema
 * 
 * This migration adds all the missing columns and indexes that were added
 * during the recent model training environment and dataset constraint features
 * but weren't properly migrated to the database.
 */

const { QueryInterface, DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    console.log('🔧 Starting comprehensive schema fix for new features...');
    
    try {
      // 1. Fix Dataset table - add missing columns
      console.log('📊 Adding missing columns to datasets table...');
      
      // Add data_classification column (if not exists)
      try {
        await queryInterface.addColumn('datasets', 'data_classification', {
          type: DataTypes.ENUM('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED', 'TOP_SECRET'),
          allowNull: false,
          defaultValue: 'INTERNAL',
          comment: 'Data sensitivity classification level'
        });
        console.log('  ✅ data_classification column added');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('  ⚠️ data_classification column already exists, skipping');
        } else {
          throw error;
        }
      }
      
      // Add secure_enclave_required column (if not exists)
      try {
        await queryInterface.addColumn('datasets', 'secure_enclave_required', {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Whether this dataset requires secure enclave processing'
        });
        console.log('  ✅ secure_enclave_required column added');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('  ⚠️ secure_enclave_required column already exists, skipping');
        } else {
          throw error;
        }
      }
      
      // Add attestation_required column (if not exists)
      try {
        await queryInterface.addColumn('datasets', 'attestation_required', {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Whether this dataset requires attestation'
        });
        console.log('  ✅ attestation_required column added');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('  ⚠️ attestation_required column already exists, skipping');
        } else {
          throw error;
        }
      }
      
      // Add data_residency_region column (if not exists)
      try {
        await queryInterface.addColumn('datasets', 'data_residency_region', {
          type: DataTypes.STRING(100),
          allowNull: true,
          comment: 'Data residency region requirement'
        });
        console.log('  ✅ data_residency_region column added');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('  ⚠️ data_residency_region column already exists, skipping');
        } else {
          throw error;
        }
      }
      
      // Add access_control_policy column (if not exists)
      try {
        await queryInterface.addColumn('datasets', 'access_control_policy', {
          type: DataTypes.JSONB,
          allowNull: true,
          comment: 'Fine-grained access control policy for this dataset'
        });
        console.log('  ✅ access_control_policy column added');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('  ⚠️ access_control_policy column already exists, skipping');
        } else {
          throw error;
        }
      }
      
      // Add retention_policy column (if not exists)
      try {
        await queryInterface.addColumn('datasets', 'retention_policy', {
          type: DataTypes.JSONB,
          allowNull: true,
          comment: 'Data retention and deletion policy'
        });
        console.log('  ✅ retention_policy column added');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('  ⚠️ retention_policy column already exists, skipping');
        } else {
          throw error;
        }
      }
      
      // Add audit_configuration column (if not exists)
      try {
        await queryInterface.addColumn('datasets', 'audit_configuration', {
          type: DataTypes.JSONB,
          allowNull: true,
          comment: 'Audit logging configuration for this dataset'
        });
        console.log('  ✅ audit_configuration column added');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('  ⚠️ audit_configuration column already exists, skipping');
        } else {
          throw error;
        }
      }
      
      // Add encryption_key_id column (if not exists)
      try {
        await queryInterface.addColumn('datasets', 'encryption_key_id', {
          type: DataTypes.STRING,
          allowNull: true,
          comment: 'ID of the encryption key used for this dataset'
        });
        console.log('  ✅ encryption_key_id column added');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('  ⚠️ encryption_key_id column already exists, skipping');
        } else {
          throw error;
        }
      }
      
      // Add attestation_policy column (if not exists)
      try {
        await queryInterface.addColumn('datasets', 'attestation_policy', {
          type: DataTypes.JSONB,
          allowNull: true,
          comment: 'Attestation policy configuration'
        });
        console.log('  ✅ attestation_policy column added');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('  ⚠️ attestation_policy column already exists, skipping');
        } else {
          throw error;
        }
      }
      
      console.log('✅ Dataset columns added successfully');
      
      // 2. Add indexes for Dataset table
      console.log('📊 Adding indexes for datasets table...');
      
      // Add indexes (if not exists)
      const datasetIndexes = [
        { columns: ['data_classification'], name: 'idx_datasets_data_classification' },
        { columns: ['secure_enclave_required'], name: 'idx_datasets_secure_enclave_required' },
        { columns: ['attestation_required'], name: 'idx_datasets_attestation_required' },
        { columns: ['data_residency_region'], name: 'idx_datasets_data_residency_region' }
      ];
      
      for (const index of datasetIndexes) {
        try {
          await queryInterface.addIndex('datasets', index.columns, { name: index.name });
          console.log(`  ✅ Index ${index.name} added`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`  ⚠️ Index ${index.name} already exists, skipping`);
          } else {
            throw error;
          }
        }
      }
      
      console.log('✅ Dataset indexes added successfully');
      
      // 3. Fix TrainingJob table - add missing columns
      console.log('🤖 Adding missing columns to training_jobs table...');
      
      const trainingJobColumns = [
        { name: 'environmentId', type: DataTypes.INTEGER, allowNull: true, comment: 'ID of the training environment used for this job' },
        { name: 'modelId', type: DataTypes.INTEGER, allowNull: true, comment: 'ID of the AI model being trained' },
        { name: 'contractId', type: DataTypes.INTEGER, allowNull: true, comment: 'ID of the contract associated with this training job' },
        { name: 'priority', type: DataTypes.ENUM('LOW', 'NORMAL', 'HIGH', 'CRITICAL'), allowNull: false, defaultValue: 'NORMAL', comment: 'Priority level of the training job' },
        { name: 'estimatedDuration', type: DataTypes.INTEGER, allowNull: true, comment: 'Estimated duration in minutes' },
        { name: 'actualDuration', type: DataTypes.INTEGER, allowNull: true, comment: 'Actual duration in minutes' },
        { name: 'resourceRequirements', type: DataTypes.JSONB, allowNull: true, comment: 'Resource requirements for the training job' },
        { name: 'trainingConfiguration', type: DataTypes.JSONB, allowNull: true, comment: 'Training configuration parameters' },
        { name: 'provenanceData', type: DataTypes.JSONB, allowNull: true, comment: 'Provenance tracking data for the training job' }
      ];
      
      for (const column of trainingJobColumns) {
        try {
          await queryInterface.addColumn('training_jobs', column.name, {
            type: column.type,
            allowNull: column.allowNull,
            defaultValue: column.defaultValue,
            comment: column.comment
          });
          console.log(`  ✅ ${column.name} column added`);
        } catch (error) {
          if (error.message.includes('already exists') || (error.message.includes('column') && error.message.includes('already exists'))) {
            console.log(`  ⚠️ ${column.name} column already exists, skipping`);
          } else {
            throw error;
          }
        }
      }
      
      console.log('✅ TrainingJob columns added successfully');
      
      // 4. Add indexes for TrainingJob table
      console.log('🤖 Adding indexes for training_jobs table...');
      
      const trainingJobIndexes = [
        { columns: ['environmentId'], name: 'idx_training_jobs_environment_id' },
        { columns: ['modelId'], name: 'idx_training_jobs_model_id' },
        { columns: ['contractId'], name: 'idx_training_jobs_contract_id' },
        { columns: ['priority'], name: 'idx_training_jobs_priority' },
        { columns: ['status'], name: 'idx_training_jobs_status' }
      ];
      
      for (const index of trainingJobIndexes) {
        try {
          await queryInterface.addIndex('training_jobs', index.columns, {
            name: index.name
          });
          console.log(`  ✅ ${index.name} index added`);
        } catch (error) {
          if (error.message.includes('already exists') || (error.message.includes('relation') && error.message.includes('already exists'))) {
            console.log(`  ⚠️ ${index.name} index already exists, skipping`);
          } else {
            throw error;
          }
        }
      }
      
      console.log('✅ TrainingJob indexes added successfully');
      
      // 5. Fix TrainingEnvironment table - add missing columns
      console.log('🏗️ Adding missing columns to training_environments table...');
      
      const trainingEnvColumns = [
        { name: 'provisioningMethod', type: DataTypes.ENUM('MANUAL', 'AUTOMATED', 'HYBRID'), allowNull: false, defaultValue: 'AUTOMATED', comment: 'Method used to provision this environment' },
        { name: 'cloudProvider', type: DataTypes.STRING(50), allowNull: true, comment: 'Cloud provider for this environment' },
        { name: 'region', type: DataTypes.STRING(100), allowNull: true, comment: 'Geographic region of the environment' },
        { name: 'instanceType', type: DataTypes.STRING(100), allowNull: true, comment: 'Type of compute instance' },
        { name: 'resourceSpecs', type: DataTypes.JSONB, allowNull: true, comment: 'Resource specifications for the environment' },
        { name: 'securityConfig', type: DataTypes.JSONB, allowNull: true, comment: 'Security configuration for the environment' },
        { name: 'attestationData', type: DataTypes.JSONB, allowNull: true, comment: 'Attestation data for the environment' }
      ];
      
      for (const column of trainingEnvColumns) {
        try {
          await queryInterface.addColumn('training_environments', column.name, {
            type: column.type,
            allowNull: column.allowNull,
            defaultValue: column.defaultValue,
            comment: column.comment
          });
          console.log(`  ✅ ${column.name} column added`);
        } catch (error) {
          if (error.message.includes('already exists') || (error.message.includes('column') && error.message.includes('already exists'))) {
            console.log(`  ⚠️ ${column.name} column already exists, skipping`);
          } else {
            throw error;
          }
        }
      }
      
      console.log('✅ TrainingEnvironment columns added successfully');
      
      // 6. Add indexes for TrainingEnvironment table
      console.log('🏗️ Adding indexes for training_environments table...');
      
      const trainingEnvIndexes = [
        { columns: ['status'], name: 'idx_training_environments_status' },
        { columns: ['provisioningMethod'], name: 'idx_training_environments_provisioning_method' },
        { columns: ['cloudProvider'], name: 'idx_training_environments_cloud_provider' }
      ];
      
      for (const index of trainingEnvIndexes) {
        try {
          await queryInterface.addIndex('training_environments', index.columns, {
            name: index.name
          });
          console.log(`  ✅ ${index.name} index added`);
        } catch (error) {
          if (error.message.includes('already exists') || (error.message.includes('relation') && error.message.includes('already exists'))) {
            console.log(`  ⚠️ ${index.name} index already exists, skipping`);
          } else {
            throw error;
          }
        }
      }
      
      console.log('✅ TrainingEnvironment indexes added successfully');
      
      // 7. Add TrainingProgress table if it doesn't exist
      console.log('📈 Creating training_progress table...');
      
      await queryInterface.createTable('training_progress', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        jobId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: 'ID of the training job'
        },
        timestamp: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
          comment: 'Timestamp of the progress update'
        },
        progress: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: false,
          comment: 'Progress percentage (0-100)'
        },
        metrics: {
          type: DataTypes.JSONB,
          allowNull: true,
          comment: 'Training metrics at this point'
        },
        status: {
          type: DataTypes.STRING(50),
          allowNull: false,
          comment: 'Status at this point in training'
        },
        message: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Status message'
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        }
      });
      
      // Add indexes for TrainingProgress table
      try {
        await queryInterface.addIndex('training_progress', ['jobId'], {
          name: 'idx_training_progress_job_id'
        });
        console.log('  ✅ Training progress job index added');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('  ⚠️ Training progress job index already exists, skipping');
        } else {
          throw error;
        }
      }
      
      try {
        await queryInterface.addIndex('training_progress', ['timestamp'], {
          name: 'idx_training_progress_timestamp'
        });
        console.log('  ✅ Training progress timestamp index added');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('  ⚠️ Training progress timestamp index already exists, skipping');
        } else {
          throw error;
        }
      }
      
      console.log('✅ TrainingProgress table created successfully');
      
      console.log('🎉 All schema fixes completed successfully!');
      
    } catch (error) {
      console.error('❌ Schema fix failed:', error.message);
      throw error;
    }
  },

  down: async (queryInterface) => {
    console.log('🔄 Rolling back schema fixes...');
    
    try {
      // Remove TrainingProgress table
      await queryInterface.dropTable('training_progress');
      
      // Remove TrainingEnvironment indexes
      await queryInterface.removeIndex('training_environments', 'idx_training_environments_cloud_provider');
      await queryInterface.removeIndex('training_environments', 'idx_training_environments_provisioning_method');
      await queryInterface.removeIndex('training_environments', 'idx_training_environments_status');
      
      // Remove TrainingEnvironment columns
      await queryInterface.removeColumn('training_environments', 'attestationData');
      await queryInterface.removeColumn('training_environments', 'securityConfig');
      await queryInterface.removeColumn('training_environments', 'resourceSpecs');
      await queryInterface.removeColumn('training_environments', 'instanceType');
      await queryInterface.removeColumn('training_environments', 'region');
      await queryInterface.removeColumn('training_environments', 'cloudProvider');
      await queryInterface.removeColumn('training_environments', 'provisioningMethod');
      
      // Remove TrainingJob indexes
      await queryInterface.removeIndex('training_jobs', 'idx_training_jobs_status');
      await queryInterface.removeIndex('training_jobs', 'idx_training_jobs_priority');
      await queryInterface.removeIndex('training_jobs', 'idx_training_jobs_contract_id');
      await queryInterface.removeIndex('training_jobs', 'idx_training_jobs_model_id');
      await queryInterface.removeIndex('training_jobs', 'idx_training_jobs_environment_id');
      
      // Remove TrainingJob columns
      await queryInterface.removeColumn('training_jobs', 'provenanceData');
      await queryInterface.removeColumn('training_jobs', 'trainingConfiguration');
      await queryInterface.removeColumn('training_jobs', 'resourceRequirements');
      await queryInterface.removeColumn('training_jobs', 'actualDuration');
      await queryInterface.removeColumn('training_jobs', 'estimatedDuration');
      await queryInterface.removeColumn('training_jobs', 'priority');
      await queryInterface.removeColumn('training_jobs', 'contractId');
      await queryInterface.removeColumn('training_jobs', 'modelId');
      await queryInterface.removeColumn('training_jobs', 'environmentId');
      
      // Remove Dataset indexes
      await queryInterface.removeIndex('datasets', 'idx_datasets_data_residency_region');
      await queryInterface.removeIndex('datasets', 'idx_datasets_attestation_required');
      await queryInterface.removeIndex('datasets', 'idx_datasets_secure_enclave_required');
      await queryInterface.removeIndex('datasets', 'idx_datasets_data_classification');
      
      // Remove Dataset columns
      await queryInterface.removeColumn('datasets', 'attestation_policy');
      await queryInterface.removeColumn('datasets', 'encryption_key_id');
      await queryInterface.removeColumn('datasets', 'audit_configuration');
      await queryInterface.removeColumn('datasets', 'retention_policy');
      await queryInterface.removeColumn('datasets', 'access_control_policy');
      await queryInterface.removeColumn('datasets', 'data_residency_region');
      await queryInterface.removeColumn('datasets', 'attestation_required');
      await queryInterface.removeColumn('datasets', 'secure_enclave_required');
      await queryInterface.removeColumn('datasets', 'data_classification');
      
      console.log('✅ Schema rollback completed successfully!');
      
    } catch (error) {
      console.error('❌ Schema rollback failed:', error.message);
      throw error;
    }
  }
};
