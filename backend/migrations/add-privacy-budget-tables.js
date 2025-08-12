/**
 * Migration: Add Privacy Budget Tables for Differential Privacy
 * Creates tables for tracking privacy budget consumption and operations
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔐 Creating privacy budget tables...');

    // Privacy Budget table
    await queryInterface.createTable('PrivacyBudgets', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      contractId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'contracts', // Changed from 'Contracts' to 'contracts'
          key: 'contractId'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      initialEpsilon: {
        type: Sequelize.DECIMAL(10, 6),
        allowNull: false,
        defaultValue: 1.0
      },
      initialDelta: {
        type: Sequelize.DECIMAL(20, 15),
        allowNull: false,
        defaultValue: 1e-5
      },
      remainingEpsilon: {
        type: Sequelize.DECIMAL(10, 6),
        allowNull: false
      },
      remainingDelta: {
        type: Sequelize.DECIMAL(20, 15),
        allowNull: false
      },
      totalEpsilonConsumed: {
        type: Sequelize.DECIMAL(10, 6),
        allowNull: false,
        defaultValue: 0
      },
      totalDeltaConsumed: {
        type: Sequelize.DECIMAL(20, 15),
        allowNull: false,
        defaultValue: 0
      },
      budgetStatus: {
        type: Sequelize.ENUM('ACTIVE', 'WARNING', 'EXHAUSTED', 'RESET'),
        allowNull: false,
        defaultValue: 'ACTIVE'
      },
      lastResetAt: {
        type: Sequelize.DATE,
        allowNull: true
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
    });

    // Privacy Budget Log table
    await queryInterface.createTable('PrivacyBudgetLogs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      contractId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'contracts', // Changed from 'Contracts' to 'contracts'
          key: 'contractId'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      epsilonConsumed: {
        type: Sequelize.DECIMAL(10, 6),
        allowNull: false
      },
      deltaConsumed: {
        type: Sequelize.DECIMAL(20, 15),
        allowNull: false
      },
      operation: {
        type: Sequelize.STRING,
        allowNull: false
      },
      operationId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users', // Changed from 'Users' to 'users'
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true
      },
      ipAddress: {
        type: Sequelize.STRING,
        allowNull: true
      },
      userAgent: {
        type: Sequelize.STRING,
        allowNull: true
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
    });

    // Privacy Operations Log table
    await queryInterface.createTable('PrivacyOperationsLogs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      contractId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'contracts', // Changed from 'Contracts' to 'contracts'
          key: 'contractId'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      operationType: {
        type: Sequelize.STRING,
        allowNull: false
      },
      epsilon: {
        type: Sequelize.DECIMAL(10, 6),
        allowNull: false
      },
      delta: {
        type: Sequelize.DECIMAL(20, 15),
        allowNull: false
      },
      mechanism: {
        type: Sequelize.STRING,
        allowNull: false
      },
      sensitivity: {
        type: Sequelize.DECIMAL(15, 6),
        allowNull: false
      },
      dataSize: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      queryType: {
        type: Sequelize.STRING,
        allowNull: true
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users', // Changed from 'Users' to 'users'
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      result: {
        type: Sequelize.JSON,
        allowNull: true
      },
      executionTime: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      success: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      errorMessage: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      ipAddress: {
        type: Sequelize.STRING,
        allowNull: true
      },
      userAgent: {
        type: Sequelize.STRING,
        allowNull: true
      },
      sessionId: {
        type: Sequelize.STRING,
        allowNull: true
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
    });

    // Create indexes for better performance
    console.log('📊 Creating indexes...');

    // PrivacyBudgets indexes
    await queryInterface.addIndex('PrivacyBudgets', ['contractId'], {
      unique: true,
      name: 'privacy_budgets_contract_id_unique'
    });
    await queryInterface.addIndex('PrivacyBudgets', ['budgetStatus'], {
      name: 'privacy_budgets_status_index'
    });
    await queryInterface.addIndex('PrivacyBudgets', ['createdAt'], {
      name: 'privacy_budgets_created_at_index'
    });

    // PrivacyBudgetLogs indexes
    await queryInterface.addIndex('PrivacyBudgetLogs', ['contractId'], {
      name: 'privacy_budget_logs_contract_id_index'
    });
    await queryInterface.addIndex('PrivacyBudgetLogs', ['operation'], {
      name: 'privacy_budget_logs_operation_index'
    });
    await queryInterface.addIndex('PrivacyBudgetLogs', ['timestamp'], {
      name: 'privacy_budget_logs_timestamp_index'
    });
    await queryInterface.addIndex('PrivacyBudgetLogs', ['userId'], {
      name: 'privacy_budget_logs_user_id_index'
    });
    await queryInterface.addIndex('PrivacyBudgetLogs', ['operationId'], {
      name: 'privacy_budget_logs_operation_id_index'
    });

    // PrivacyOperationsLogs indexes
    await queryInterface.addIndex('PrivacyOperationsLogs', ['contractId'], {
      name: 'privacy_operations_logs_contract_id_index'
    });
    await queryInterface.addIndex('PrivacyOperationsLogs', ['operationType'], {
      name: 'privacy_operations_logs_operation_type_index'
    });
    await queryInterface.addIndex('PrivacyOperationsLogs', ['mechanism'], {
      name: 'privacy_operations_logs_mechanism_index'
    });
    await queryInterface.addIndex('PrivacyOperationsLogs', ['timestamp'], {
      name: 'privacy_operations_logs_timestamp_index'
    });
    await queryInterface.addIndex('PrivacyOperationsLogs', ['userId'], {
      name: 'privacy_operations_logs_user_id_index'
    });
    await queryInterface.addIndex('PrivacyOperationsLogs', ['success'], {
      name: 'privacy_operations_logs_success_index'
    });
    await queryInterface.addIndex('PrivacyOperationsLogs', ['queryType'], {
      name: 'privacy_operations_logs_query_type_index'
    });

    console.log('✅ Privacy budget tables created successfully');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🗑️ Dropping privacy budget tables...');

    // Drop tables in reverse order (due to foreign key constraints)
    await queryInterface.dropTable('PrivacyOperationsLogs');
    await queryInterface.dropTable('PrivacyBudgetLogs');
    await queryInterface.dropTable('PrivacyBudgets');

    console.log('✅ Privacy budget tables dropped successfully');
  }
}; 