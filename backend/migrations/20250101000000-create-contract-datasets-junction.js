'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create junction table for many-to-many relationship between contracts and datasets
    await queryInterface.createTable('contract_datasets', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      contract_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'contracts',
          key: 'contract_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      dataset_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'datasets',
          key: 'dataset_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      tdp_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      individual_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Individual price for this dataset in this contract'
      },
      payment_status: {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: 'PENDING',
        comment: 'Payment status for this dataset: PENDING, PAID, FAILED'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add unique constraint to prevent duplicate entries
    await queryInterface.addConstraint('contract_datasets', {
      fields: ['contract_id', 'dataset_id'],
      type: 'unique',
      name: 'unique_contract_dataset'
    });

    // Add indexes for performance
    await queryInterface.addIndex('contract_datasets', ['contract_id']);
    await queryInterface.addIndex('contract_datasets', ['dataset_id']);
    await queryInterface.addIndex('contract_datasets', ['tdp_id']);
    await queryInterface.addIndex('contract_datasets', ['payment_status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('contract_datasets');
  }
};
