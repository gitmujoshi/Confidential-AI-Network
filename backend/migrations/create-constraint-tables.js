'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔄 Creating constraint management tables...');

    // Create constraint_categories table
    await queryInterface.createTable('constraint_categories', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      category_key: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Unique identifier for the constraint category'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Display name for the category'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Description of what this category manages'
      },
      icon: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Icon identifier for UI display'
      },
      color: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Color code for UI display'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether this category is active and available'
      },
      display_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Order for displaying categories in UI'
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Additional metadata for the category'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create constraint_fields table
    await queryInterface.createTable('constraint_fields', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      field_key: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Unique identifier for the constraint field'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Display name for the field'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Description of what this field constrains'
      },
      field_type: {
        type: Sequelize.ENUM('select', 'multiselect', 'text', 'number', 'boolean', 'date'),
        allowNull: false,
        defaultValue: 'select',
        comment: 'Type of constraint field'
      },
      is_required: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether this field is required'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether this field is active and available'
      },
      display_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Order for displaying fields in UI'
      },
      validation_rules: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Validation rules for this field'
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Additional metadata for the field'
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'constraint_categories',
          key: 'id'
        },
        comment: 'Reference to the constraint category'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create constraint_values table
    await queryInterface.createTable('constraint_values', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      value_key: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Unique identifier for the constraint value'
      },
      label: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Display label for the value'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Description of this constraint value'
      },
      icon: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Icon identifier for UI display'
      },
      color: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Color code for UI display'
      },
      is_recommended: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether this value is recommended'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether this value is active and available'
      },
      display_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Order for displaying values in UI'
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Additional metadata for the value'
      },
      field_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'constraint_fields',
          key: 'id'
        },
        comment: 'Reference to the constraint field'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create indexes
    await queryInterface.addIndex('constraint_categories', ['category_key'], { unique: true });
    await queryInterface.addIndex('constraint_categories', ['is_active']);
    await queryInterface.addIndex('constraint_categories', ['display_order']);

    await queryInterface.addIndex('constraint_fields', ['category_id', 'field_key'], { unique: true });
    await queryInterface.addIndex('constraint_fields', ['category_id']);
    await queryInterface.addIndex('constraint_fields', ['is_active']);
    await queryInterface.addIndex('constraint_fields', ['display_order']);

    await queryInterface.addIndex('constraint_values', ['field_id', 'value_key'], { unique: true });
    await queryInterface.addIndex('constraint_values', ['field_id']);
    await queryInterface.addIndex('constraint_values', ['is_active']);
    await queryInterface.addIndex('constraint_values', ['is_recommended']);
    await queryInterface.addIndex('constraint_values', ['display_order']);

    console.log('✅ Constraint management tables created successfully!');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('↩️ Dropping constraint management tables...');

    await queryInterface.dropTable('constraint_values');
    await queryInterface.dropTable('constraint_fields');
    await queryInterface.dropTable('constraint_categories');

    console.log('✅ Constraint management tables dropped successfully!');
  }
};
