/**
 * Constraint Field Model
 * 
 * This model represents individual constraint fields within a category
 * (e.g., 'data_classification', 'encryption_algorithm', 'vm_size').
 */
module.exports = (sequelize, DataTypes) => {
  const ConstraintField = sequelize.define('ConstraintField', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    
    // Field identifier (e.g., 'data_classification', 'vm_size')
    fieldKey: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Unique identifier for the constraint field'
    },
    
    // Human-readable field name
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Display name for the field'
    },
    
    // Field description
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Description of what this field constrains'
    },
    
    // Field type (select, multiselect, text, number, boolean)
    fieldType: {
      type: DataTypes.ENUM('select', 'multiselect', 'text', 'number', 'boolean', 'date'),
      allowNull: false,
      defaultValue: 'select',
      comment: 'Type of constraint field'
    },
    
    // Whether this field is required
    isRequired: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether this field is required'
    },
    
    // Whether this field is active
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether this field is active and available'
    },
    
    // Field order for display
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Order for displaying fields in UI'
    },
    
    // Validation rules (JSON)
    validationRules: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Validation rules for this field'
    },
    
    // Field metadata
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional metadata for the field'
    },
    
    // Foreign key to constraint category
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'constraint_categories',
        key: 'id'
      },
      comment: 'Reference to the constraint category'
    }
  }, {
    tableName: 'constraint_fields',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['category_id', 'field_key']
      },
      {
        fields: ['category_id']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['display_order']
      }
    ]
  });

  return ConstraintField;
};
