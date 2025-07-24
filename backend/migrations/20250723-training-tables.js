/**
 * Migration: Add Training Tables
 * 
 * Creates training_jobs and training_environments tables for tracking
 * training orchestration, environment provisioning, and job execution.
 */

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create training_environments table
    await queryInterface.createTable('training_environments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      environmentId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Unique training environment identifier'
      },
      contractId: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Associated contract ID'
      },
      status: {
        type: Sequelize.ENUM(
          'PENDING',      // Environment creation requested
          'PROVISIONING', // Infrastructure being provisioned
          'ACTIVE',       // Environment ready for training
          'RUNNING',      // Training in progress
          'COMPLETED',    // Training completed
          'FAILED',       // Environment creation failed
          'DESTROYING',   // Environment being destroyed
          'DESTROYED'     // Environment destroyed
        ),
        defaultValue: 'PENDING',
        comment: 'Environment status'
      },
      cloudProvider: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Cloud provider (AWS, GCP, Azure, OCI)'
      },
      region: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Cloud region'
      },
      infrastructureConfig: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Infrastructure configuration (compute, storage, network)'
      },
      securityConfig: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Security configuration (encryption, access control, monitoring)'
      },
      monitoringConfig: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Monitoring and logging configuration'
      },
      environmentUrl: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Environment access URL'
      },
      provisioningLogs: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Infrastructure provisioning logs'
      },
      costEstimate: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Estimated cost for environment'
      },
      actualCost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Actual cost incurred'
      },
      errorDetails: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Error details if environment creation failed'
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        comment: 'User who created the environment'
      },
      provisionedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When environment was provisioned'
      },
      destroyedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When environment was destroyed'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create indexes for training_environments
    await queryInterface.addIndex('training_environments', ['environmentId'], {
      unique: true,
      name: 'training_environments_environmentId_unique'
    });
    await queryInterface.addIndex('training_environments', ['contractId'], {
      name: 'training_environments_contractId_idx'
    });
    await queryInterface.addIndex('training_environments', ['status'], {
      name: 'training_environments_status_idx'
    });
    await queryInterface.addIndex('training_environments', ['cloudProvider'], {
      name: 'training_environments_cloudProvider_idx'
    });
    await queryInterface.addIndex('training_environments', ['createdBy'], {
      name: 'training_environments_createdBy_idx'
    });
    await queryInterface.addIndex('training_environments', ['provisionedAt'], {
      name: 'training_environments_provisionedAt_idx'
    });

    // Create training_jobs table
    await queryInterface.createTable('training_jobs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      jobId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Unique training job identifier'
      },
      contractId: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Associated contract ID'
      },
      status: {
        type: Sequelize.ENUM(
          'PENDING',      // Job created, waiting to start
          'PROVISIONING', // Environment being provisioned
          'RUNNING',      // Training in progress
          'COMPLETED',    // Training completed successfully
          'FAILED',       // Training failed
          'CANCELLED'     // Training cancelled
        ),
        defaultValue: 'PENDING',
        comment: 'Training job status'
      },
      cloudProvider: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Cloud provider (AWS, GCP, Azure, OCI)'
      },
      environmentSpecs: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Environment specifications from contract'
      },
      trainingParams: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Training parameters from contract'
      },
      estimatedDuration: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Estimated training duration (e.g., "50 hours")'
      },
      progress: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Training progress percentage (0-100)'
      },
      results: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Training results including accuracy, loss, privacy metrics'
      },
      environmentId: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'External environment ID'
      },
      logs: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Training execution logs'
      },
      errorDetails: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Error details if training failed'
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        comment: 'User who created the training job'
      },
      startedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When training started'
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When training completed'
      },
      cancelledAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When training was cancelled'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create indexes for training_jobs
    await queryInterface.addIndex('training_jobs', ['jobId'], {
      unique: true,
      name: 'training_jobs_jobId_unique'
    });
    await queryInterface.addIndex('training_jobs', ['contractId'], {
      name: 'training_jobs_contractId_idx'
    });
    await queryInterface.addIndex('training_jobs', ['status'], {
      name: 'training_jobs_status_idx'
    });
    await queryInterface.addIndex('training_jobs', ['createdBy'], {
      name: 'training_jobs_createdBy_idx'
    });
    await queryInterface.addIndex('training_jobs', ['cloudProvider'], {
      name: 'training_jobs_cloudProvider_idx'
    });
    await queryInterface.addIndex('training_jobs', ['startedAt'], {
      name: 'training_jobs_startedAt_idx'
    });

    console.log('✅ Training tables created successfully');
  },

  down: async (queryInterface, Sequelize) => {
    // Drop training_jobs table
    await queryInterface.dropTable('training_jobs');
    
    // Drop training_environments table
    await queryInterface.dropTable('training_environments');
    
    console.log('✅ Training tables dropped successfully');
  }
}; 