const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProvenanceNode = sequelize.define('ProvenanceNode', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nodeId: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: false,
      field: 'node_id'
    },
    treeId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'tree_id'
    },
    nodeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'node_type'
    },
    dataHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'data_hash'
    },
    parentHash: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'parent_hash'
    },
    leftChildHash: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'left_child_hash'
    },
    rightChildHash: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'right_child_hash'
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
      defaultValue: DataTypes.NOW
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_verified'
    }
  }, {
    tableName: 'provenance_nodes',
    underscored: true,
    timestamps: false
  });

  ProvenanceNode.associate = (models) => {
    ProvenanceNode.belongsTo(models.MerkleTree, {
      foreignKey: 'treeId',
      targetKey: 'treeId',
      as: 'tree'
    });

    ProvenanceNode.hasMany(models.ProvenanceCapture, {
      foreignKey: 'nodeId',
      sourceKey: 'nodeId',
      as: 'captures'
    });
  };

  return ProvenanceNode;
};
