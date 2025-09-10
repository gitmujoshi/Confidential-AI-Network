/**
 * Constraint Value Model
 * 
 * This model represents individual constraint values for a field
 * (e.g., 'PUBLIC', 'CONFIDENTIAL' for data_classification).
 */
module.exports = (sequelize, DataTypes) => {
  const ConstraintValue = sequelize.define('ConstraintValue', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    
    // Value identifier (e.g., 'PUBLIC', 'Standard_D2s_v3')
    valueKey: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Unique identifier for the constraint value'
    },
    
    // Human-readable value name
    label: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Display label for the value'
    },
    
    // Value description
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Description of this constraint value'
    },
    
    // Value icon (for UI display)
    icon: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Icon identifier for UI display'
    },
    
    // Value color (for UI display)
    color: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Color code for UI display'
    },
    
    // Whether this value is recommended
    isRecommended: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether this value is recommended'
    },
    
    // Whether this value is active
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether this value is active and available'
    },
    
    // Value order for display
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Order for displaying values in UI'
    },
    
    // Value metadata (e.g., vcpus, memory, cost, security level)
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional metadata for the value'
    },
    
    // Foreign key to constraint field
    fieldId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'constraint_fields',
        key: 'id'
      },
      comment: 'Reference to the constraint field'
    }
  }, {
    tableName: 'constraint_values',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['field_id', 'value_key']
      },
      {
        fields: ['field_id']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['is_recommended']
      },
      {
        fields: ['display_order']
      }
    ]
  });

  return ConstraintValue;
};
