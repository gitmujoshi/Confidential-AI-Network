/**
 * Contract Template Model
 * 
 * This model represents predefined contract templates that users can select from
 * when creating new contracts. Templates provide standardized terms, conditions,
 * and pricing structures for different types of agreements.
 * 
 * Template Types:
 * - RESEARCH: Academic and research use
 * - COMMERCIAL: Business and commercial use
 * - ENTERPRISE: Large-scale enterprise use
 * - CUSTOM: Customizable template
 * 
 * Features:
 * - Predefined terms and conditions
 * - Duration and pricing guidelines
 * - Privacy and compliance settings
 * - Training environment specifications
 * - KMS configuration templates
 */

module.exports = (sequelize, DataTypes) => {
  const ContractTemplate = sequelize.define('ContractTemplate', {
    // Primary key
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    
    // Template identifier
    templateId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Unique template identifier (e.g., RESEARCH_STANDARD, COMMERCIAL_BASIC)'
    },
    
    // Template name for display
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Human-readable template name'
    },
    
    // Template description
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Detailed description of the template and its use cases'
    },
    
    // Template category
    category: {
      type: DataTypes.ENUM('RESEARCH', 'COMMERCIAL', 'ENTERPRISE', 'CUSTOM'),
      allowNull: false,
      defaultValue: 'RESEARCH',
      comment: 'Template category for organization'
    },
    
    // Template type for Ricardian contracts
    contractType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'AI_TRAINING',
      comment: 'Ricardian contract type (AI_TRAINING, BASIC, etc.)'
    },
    
    // Standard duration in days
    standardDuration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 90,
      comment: 'Standard contract duration in days'
    },
    
    // Price multiplier for this template
    priceMultiplier: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 1.0,
      comment: 'Multiplier applied to dataset base price'
    },
    
    // Base price for template (if applicable)
    basePrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Base price for template (additional to dataset price)'
    },
    
    // Terms and conditions template
    termsAndConditions: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Template terms and conditions text'
    },
    
    // Legal document template (JSONB)
    legalDocumentTemplate: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'JSONB template for legal document generation'
    },
    
    // Training environment specifications
    trainingEnvironmentSpecs: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Default training environment specifications'
    },
    
    // Privacy and compliance settings
    privacySettings: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Default privacy and compliance settings'
    },
    
    // KMS configuration template
    kmsConfigTemplate: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Default KMS configuration for this template'
    },
    
    // Template metadata
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional template metadata and configuration'
    },
    
    // Template version
    version: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '1.0.0',
      comment: 'Template version for tracking changes'
    },
    
    // Template status
    status: {
      type: DataTypes.ENUM('ACTIVE', 'DRAFT', 'DEPRECATED', 'ARCHIVED'),
      allowNull: false,
      defaultValue: 'ACTIVE',
      comment: 'Template availability status'
    },
    
    // Usage statistics
    usageCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of times this template has been used'
    },
    
    // Template tags for search and categorization
    tags: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Array of tags for template categorization and search'
    },
    
    // Created by user
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User who created this template'
    },
    
    // Timestamps
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'contract_templates',
    timestamps: true,
    underscored: true,
    
    // Indexes for performance
    indexes: [
      {
        name: 'idx_contract_templates_template_id',
        unique: true,
        fields: ['template_id']
      },
      {
        name: 'idx_contract_templates_category',
        fields: ['category']
      },
      {
        name: 'idx_contract_templates_status',
        fields: ['status']
      },
      {
        name: 'idx_contract_templates_contract_type',
        fields: ['contract_type']
      },
      {
        name: 'idx_contract_templates_tags',
        fields: ['tags'],
        using: 'gin'
      }
    ],
    
    // Model hooks
    hooks: {
      beforeCreate: (template) => {
        // Generate template ID if not provided
        if (!template.templateId) {
          template.templateId = `${template.category}_${Date.now()}`;
        }
      },
      
      beforeUpdate: (template) => {
        // Increment version on major changes
        if (template.changed('termsAndConditions') || template.changed('legalDocumentTemplate')) {
          const currentVersion = template.version.split('.');
          const newPatch = parseInt(currentVersion[2]) + 1;
          template.version = `${currentVersion[0]}.${currentVersion[1]}.${newPatch}`;
        }
      }
    }
  });

  // Instance methods
  ContractTemplate.prototype.incrementUsage = async function() {
    this.usageCount += 1;
    await this.save();
  };

  ContractTemplate.prototype.getFullPrice = function(datasetPrice) {
    const basePrice = this.basePrice || 0;
    const multiplierPrice = parseFloat(datasetPrice) * parseFloat(this.priceMultiplier);
    return basePrice + multiplierPrice;
  };

  ContractTemplate.prototype.isCompatibleWithDataset = function(dataset) {
    // Check if template has any dataset restrictions
    if (this.metadata && this.metadata.datasetRestrictions) {
      const restrictions = this.metadata.datasetRestrictions;
      
      // Check category restrictions
      if (restrictions.allowedCategories && !restrictions.allowedCategories.includes(dataset.category)) {
        return false;
      }
      
      // Check size restrictions
      if (restrictions.maxSize && dataset.size > restrictions.maxSize) {
        return false;
      }
      
      // Check record count restrictions
      if (restrictions.maxRecords && dataset.recordCount > restrictions.maxRecords) {
        return false;
      }
    }
    
    return true;
  };

  // Class methods
  ContractTemplate.findByCategory = function(category) {
    return this.findAll({
      where: { 
        category,
        status: 'ACTIVE'
      },
      order: [['usageCount', 'DESC'], ['name', 'ASC']]
    });
  };

  ContractTemplate.findByContractType = function(contractType) {
    return this.findAll({
      where: { 
        contractType,
        status: 'ACTIVE'
      },
      order: [['usageCount', 'DESC'], ['name', 'ASC']]
    });
  };

  ContractTemplate.searchTemplates = function(searchTerm, filters = {}) {
    const whereClause = {
      status: 'ACTIVE',
      [sequelize.Op.or]: [
        { name: { [sequelize.Op.iLike]: `%${searchTerm}%` } },
        { description: { [sequelize.Op.iLike]: `%${searchTerm}%` } },
        { tags: { [sequelize.Op.contains]: [searchTerm] } }
      ]
    };

    // Apply additional filters
    if (filters.category) {
      whereClause.category = filters.category;
    }
    
    if (filters.contractType) {
      whereClause.contractType = filters.contractType;
    }

    return this.findAll({
      where: whereClause,
      order: [['usageCount', 'DESC'], ['name', 'ASC']]
    });
  };

  // Associations
  ContractTemplate.associate = function(models) {
    // Template creator
    ContractTemplate.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    
    // Contracts using this template
    ContractTemplate.hasMany(models.Contract, {
      foreignKey: 'templateId',
      as: 'contracts'
    });
  };

  return ContractTemplate;
}; 