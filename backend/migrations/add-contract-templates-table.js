/**
 * Migration: Add Contract Templates Table
 * 
 * This migration creates the contract_templates table to store predefined
 * contract templates that users can select from when creating contracts.
 */

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔧 Creating contract_templates table...');
    
    await queryInterface.createTable('contract_templates', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      
      templateId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Unique template identifier'
      },
      
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Human-readable template name'
      },
      
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Detailed description of the template'
      },
      
      category: {
        type: Sequelize.ENUM('RESEARCH', 'COMMERCIAL', 'ENTERPRISE', 'CUSTOM'),
        allowNull: false,
        defaultValue: 'RESEARCH',
        comment: 'Template category'
      },
      
      contractType: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'AI_TRAINING',
        comment: 'Ricardian contract type'
      },
      
      standardDuration: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 90,
        comment: 'Standard duration in days'
      },
      
      priceMultiplier: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 1.0,
        comment: 'Price multiplier for dataset price'
      },
      
      basePrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Base price for template'
      },
      
      termsAndConditions: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Template terms and conditions'
      },
      
      legalDocumentTemplate: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'JSON template for legal document'
      },
      
      trainingEnvironmentSpecs: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Training environment specifications'
      },
      
      privacySettings: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Privacy and compliance settings'
      },
      
      kmsConfigTemplate: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'KMS configuration template'
      },
      
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Additional template metadata'
      },
      
      version: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '1.0.0',
        comment: 'Template version'
      },
      
      status: {
        type: Sequelize.ENUM('ACTIVE', 'DRAFT', 'DEPRECATED', 'ARCHIVED'),
        allowNull: false,
        defaultValue: 'ACTIVE',
        comment: 'Template status'
      },
      
      usageCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Usage count'
      },
      
      tags: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Template tags'
      },
      
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'User who created template'
      },
      
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create indexes for performance
    console.log('📊 Creating indexes...');
    
    await queryInterface.addIndex('contract_templates', ['templateId'], {
      unique: true,
      name: 'idx_contract_templates_template_id'
    });
    
    await queryInterface.addIndex('contract_templates', ['category'], {
      name: 'idx_contract_templates_category'
    });
    
    await queryInterface.addIndex('contract_templates', ['status'], {
      name: 'idx_contract_templates_status'
    });
    
    await queryInterface.addIndex('contract_templates', ['contractType'], {
      name: 'idx_contract_templates_contract_type'
    });

    console.log('✅ Contract templates table created successfully');
  },

  async down(queryInterface, Sequelize) {
    console.log('🗑️ Dropping contract_templates table...');
    
    await queryInterface.dropTable('contract_templates');
    
    console.log('✅ Contract templates table dropped successfully');
  }
}; 