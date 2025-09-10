/**
 * Constraint Category Model
 * 
 * This model represents different categories of constraints in the system
 * (e.g., datasets, contracts, ccrp, tdc) that can be managed by admins.
 */
module.exports = (sequelize, DataTypes) => {
  const ConstraintCategory = sequelize.define('ConstraintCategory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    
    // Category identifier (e.g., 'datasets', 'contracts', 'ccrp', 'tdc')
    categoryKey: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Unique identifier for the constraint category'
    },
    
    // Human-readable category name
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Display name for the category'
    },
    
    // Category description
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Description of what this category manages'
    },
    
    // Category icon (for UI display)
    icon: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Icon identifier for UI display'
    },
    
    // Category color (for UI display)
    color: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Color code for UI display'
    },
    
    // Whether this category is active
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether this category is active and available'
    },
    
    // Category order for display
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Order for displaying categories in UI'
    },
    
    // Category metadata
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional metadata for the category'
    }
  }, {
    tableName: 'constraint_categories',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['category_key']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['display_order']
      }
    ]
  });

  return ConstraintCategory;
};
