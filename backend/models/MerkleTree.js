const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MerkleTree = sequelize.define('MerkleTree', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    treeId: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: false,
      field: 'tree_id'
    },
    contractId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'contract_id',
      references: {
        model: 'contracts',
        key: 'contract_id'
      }
    },
    treeType: {
      type: DataTypes.STRING(50),
      defaultValue: 'BINARY_MERKLE_TREE',
      field: 'tree_type'
    },
    hashAlgorithm: {
      type: DataTypes.STRING(20),
      defaultValue: 'SHA256',
      field: 'hash_algorithm'
    },
    maxDepth: {
      type: DataTypes.INTEGER,
      defaultValue: 32,
      field: 'max_depth'
    },
    rootHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'root_hash'
    },
    nodeCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'node_count'
    }
  }, {
    tableName: 'merkle_trees',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  MerkleTree.associate = (models) => {
    MerkleTree.belongsTo(models.Contract, {
      foreignKey: 'contractId',
      as: 'contract'
    });

    MerkleTree.hasMany(models.ProvenanceNode, {
      foreignKey: 'treeId',
      sourceKey: 'treeId',
      as: 'nodes'
    });
  };

  return MerkleTree;
};
