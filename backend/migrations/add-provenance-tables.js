const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create merkle_trees table
    await queryInterface.createTable('merkle_trees', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      tree_id: {
        type: DataTypes.STRING(255),
        unique: true,
        allowNull: false
      },
      contract_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        references: {
          model: 'contracts',
          key: 'contract_id'
        }
      },
      tree_type: {
        type: DataTypes.STRING(50),
        defaultValue: 'BINARY_MERKLE_TREE'
      },
      hash_algorithm: {
        type: DataTypes.STRING(20),
        defaultValue: 'SHA256'
      },
      max_depth: {
        type: DataTypes.INTEGER,
        defaultValue: 32
      },
      root_hash: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      node_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create provenance_nodes table
    await queryInterface.createTable('provenance_nodes', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      node_id: {
        type: DataTypes.STRING(255),
        unique: true,
        allowNull: false
      },
      tree_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        references: {
          model: 'merkle_trees',
          key: 'tree_id'
        }
      },
      node_type: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      data_hash: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      parent_hash: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      left_child_hash: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      right_child_hash: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      level: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      position: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      timestamp: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    });

    // Create provenance_captures table
    await queryInterface.createTable('provenance_captures', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      capture_id: {
        type: DataTypes.STRING(255),
        unique: true,
        allowNull: false
      },
      contract_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        references: {
          model: 'contracts',
          key: 'contract_id'
        }
      },
      capture_type: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      data_source: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      data_hash: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      merkle_proof: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      verification_status: {
        type: DataTypes.STRING(50),
        defaultValue: 'PENDING'
      },
      captured_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      verified_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    });

    // Create provenance_verifications table
    await queryInterface.createTable('provenance_verifications', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      verification_id: {
        type: DataTypes.STRING(255),
        unique: true,
        allowNull: false
      },
      capture_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        references: {
          model: 'provenance_captures',
          key: 'capture_id'
        }
      },
      verification_method: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      details: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      verified_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('merkle_trees', ['contract_id']);
    await queryInterface.addIndex('provenance_nodes', ['tree_id']);
    await queryInterface.addIndex('provenance_nodes', ['data_hash']);
    await queryInterface.addIndex('provenance_captures', ['contract_id']);
    await queryInterface.addIndex('provenance_captures', ['capture_type']);
    await queryInterface.addIndex('provenance_verifications', ['capture_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('provenance_verifications');
    await queryInterface.dropTable('provenance_captures');
    await queryInterface.dropTable('provenance_nodes');
    await queryInterface.dropTable('merkle_trees');
  }
};
