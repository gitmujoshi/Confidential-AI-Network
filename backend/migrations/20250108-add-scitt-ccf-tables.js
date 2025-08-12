/**
 * Migration: Add SCITT CCF Tables
 * 
 * This migration adds the necessary tables for SCITT CCF integration:
 * - scitt_claims: Store SCITT CCF claims locally
 * - system_health_log: Track system health monitoring
 * - Update contracts table with SCITT CCF fields
 * 
 * @author Contract Management System Team
 * @version 1.0.0
 * @since 2025-01-08
 */

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🚀 Starting SCITT CCF tables migration...');

      // 1. Create scitt_claims table
      console.log('Creating scitt_claims table...');
      await queryInterface.createTable('scitt_claims', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        claimId: {
          type: Sequelize.STRING(255),
          allowNull: false,
          unique: true,
          comment: 'Unique identifier for the claim in SCITT CCF'
        },
        contractId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'Reference to the contract this claim belongs to'
        },
        claimType: {
          type: Sequelize.STRING(100),
          allowNull: false,
          comment: 'Type of claim (contract_creation, contract_approval, contract_completion, etc.)'
        },
        claimData: {
          type: Sequelize.JSONB,
          allowNull: false,
          comment: 'Complete claim data as submitted to SCITT CCF'
        },
        receipt: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Receipt received from SCITT CCF after claim submission'
        },
        status: {
          type: Sequelize.STRING(50),
          allowNull: false,
          defaultValue: 'PENDING',
          comment: 'Current status of the claim'
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      }, { 
        transaction,
        comment: 'SCITT CCF claims stored locally for tracking and fallback'
      });

      // 2. Create system_health_log table
      console.log('Creating system_health_log table...');
      await queryInterface.createTable('system_health_log', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        systemName: {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment: 'Name of the system being monitored (ethereum, scittCcf)'
        },
        healthStatus: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          comment: 'Whether the system is healthy (true) or unhealthy (false)'
        },
        responseTime: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'Response time in milliseconds for the health check'
        },
        errorMessage: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Error message if the health check failed'
        },
        metrics: {
          type: Sequelize.JSONB,
          allowNull: true,
          comment: 'Additional metrics and metadata from the health check'
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      }, { 
        transaction,
        comment: 'System health monitoring logs for Ethereum and SCITT CCF systems'
      });

      // 3. Add indexes to scitt_claims table
      console.log('Adding indexes to scitt_claims table...');
      await queryInterface.addIndex('scitt_claims', ['claimId'], {
        name: 'idx_claim_id',
        transaction
      });
      
      await queryInterface.addIndex('scitt_claims', ['contractId'], {
        name: 'idx_contract_id',
        transaction
      });
      
      await queryInterface.addIndex('scitt_claims', ['claimType'], {
        name: 'idx_claim_type',
        transaction
      });
      
      await queryInterface.addIndex('scitt_claims', ['status'], {
        name: 'idx_status',
        transaction
      });

      // 4. Add indexes to system_health_log table
      console.log('Adding indexes to system_health_log table...');
      await queryInterface.addIndex('system_health_log', ['systemName'], {
        name: 'idx_system_name',
        transaction
      });
      
      await queryInterface.addIndex('system_health_log', ['healthStatus'], {
        name: 'idx_health_status',
        transaction
      });
      
      await queryInterface.addIndex('system_health_log', ['createdAt'], {
        name: 'idx_created_at',
        transaction
      });

      // 5. Add SCITT CCF fields to contracts table
      console.log('Adding SCITT CCF fields to contracts table...');
      await queryInterface.addColumn('contracts', 'scitt_claim_id', {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'SCITT CCF claim ID for this contract'
      }, { transaction });

      await queryInterface.addColumn('contracts', 'scitt_receipt', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'SCITT CCF receipt for this contract'
      }, { transaction });

      await queryInterface.addColumn('contracts', 'contract_source', {
        type: Sequelize.ENUM('ETHEREUM', 'SCITT_CCF', 'HYBRID'),
        allowNull: false,
        defaultValue: 'ETHEREUM',
        comment: 'Source system for this contract'
      }, { transaction });

      await queryInterface.addColumn('contracts', 'migration_status', {
        type: Sequelize.ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'ROLLED_BACK'),
        allowNull: false,
        defaultValue: 'PENDING',
        comment: 'Migration status to SCITT CCF'
      }, { transaction });

      await queryInterface.addColumn('contracts', 'last_migration_attempt', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp of last migration attempt'
      }, { transaction });

      // 6. Add indexes for new contract fields
      console.log('Adding indexes for new contract fields...');
      await queryInterface.addIndex('contracts', ['contract_source'], {
        name: 'idx_contract_source',
        transaction
      });
      
      await queryInterface.addIndex('contracts', ['migration_status'], {
        name: 'idx_migration_status',
        transaction
      });
      
      await queryInterface.addIndex('contracts', ['scitt_claim_id'], {
        name: 'idx_scitt_claim_id',
        transaction
      });

      // 7. Add foreign key constraint for scitt_claims.contractId
      console.log('Adding foreign key constraints...');
      await queryInterface.addConstraint('scitt_claims', {
        fields: ['contractId'],
        type: 'foreign key',
        name: 'fk_scitt_claims_contract_id',
        references: {
          table: 'contracts',
          field: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      }, { transaction });

      // Commit transaction
      await transaction.commit();
      
      console.log('✅ SCITT CCF tables migration completed successfully');
      
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      console.error('❌ SCITT CCF tables migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Rolling back SCITT CCF tables migration...');

      // 1. Remove foreign key constraints
      console.log('Removing foreign key constraints...');
      await queryInterface.removeConstraint('scitt_claims', 'fk_scitt_claims_contract_id', { transaction });

      // 2. Remove indexes from contracts table
      console.log('Removing indexes from contracts table...');
      await queryInterface.removeIndex('contracts', 'idx_scitt_claim_id', { transaction });
      await queryInterface.removeIndex('contracts', 'idx_migration_status', { transaction });
      await queryInterface.removeIndex('contracts', 'idx_contract_source', { transaction });

      // 3. Remove SCITT CCF columns from contracts table
      console.log('Removing SCITT CCF columns from contracts table...');
      await queryInterface.removeColumn('contracts', 'last_migration_attempt', { transaction });
      await queryInterface.removeColumn('contracts', 'migration_status', { transaction });
      await queryInterface.removeColumn('contracts', 'contract_source', { transaction });
      await queryInterface.removeColumn('contracts', 'scitt_receipt', { transaction });
      await queryInterface.removeColumn('contracts', 'scitt_claim_id', { transaction });

      // 4. Remove ENUM types (this might require additional handling in some databases)
      try {
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_contracts_contract_source;', { transaction });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_contracts_migration_status;', { transaction });
      } catch (enumError) {
        console.warn('Warning: Could not remove ENUM types:', enumError.message);
      }

      // 5. Remove indexes from system_health_log table
      console.log('Removing indexes from system_health_log table...');
      await queryInterface.removeIndex('system_health_log', 'idx_created_at', { transaction });
      await queryInterface.removeIndex('system_health_log', 'idx_health_status', { transaction });
      await queryInterface.removeIndex('system_health_log', 'idx_system_name', { transaction });

      // 6. Remove indexes from scitt_claims table
      console.log('Removing indexes from scitt_claims table...');
      await queryInterface.removeIndex('scitt_claims', 'idx_status', { transaction });
      await queryInterface.removeIndex('scitt_claims', 'idx_claim_type', { transaction });
      await queryInterface.removeIndex('scitt_claims', 'idx_contract_id', { transaction });
      await queryInterface.removeIndex('scitt_claims', 'idx_claim_id', { transaction });

      // 7. Drop tables
      console.log('Dropping tables...');
      await queryInterface.dropTable('system_health_log', { transaction });
      await queryInterface.dropTable('scitt_claims', { transaction });

      // Commit transaction
      await transaction.commit();
      
      console.log('✅ SCITT CCF tables migration rollback completed successfully');
      
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      console.error('❌ SCITT CCF tables migration rollback failed:', error);
      throw error;
    }
  }
};
