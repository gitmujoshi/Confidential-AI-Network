/**
 * Contract Template Service
 * 
 * This service manages contract templates, providing functionality to:
 * - Create, read, update, and delete templates
 * - Search and filter templates
 * - Validate template compatibility with datasets
 * - Generate contract data from templates
 * - Track template usage statistics
 */

const db = require('../models');
const { Op } = require('sequelize');

class ContractTemplateService {
  constructor() {
    this.defaultTemplates = this.initializeDefaultTemplates();
  }

  /**
   * Initialize default contract templates
   */
  initializeDefaultTemplates() {
    return [
      {
        templateId: 'RESEARCH_STANDARD',
        name: 'Standard Research License',
        description: 'Non-exclusive license for academic and research purposes. Suitable for universities, research institutions, and individual researchers.',
        category: 'RESEARCH',
        contractType: 'AI_TRAINING',
        standardDuration: 90,
        priceMultiplier: 1.0,
        basePrice: 0,
        termsAndConditions: `This contract grants a non-exclusive, non-transferable license to use the specified dataset for research and development purposes only. The licensee may not redistribute the dataset or use it for commercial purposes without written permission. All results must be properly attributed to the dataset provider.`,
        tags: ['research', 'academic', 'non-commercial', 'attribution-required'],
        privacySettings: {
          differentialPrivacy: { enabled: true, defaultEpsilon: 1.0 },
          federatedLearning: { enabled: false },
          secureMPC: { enabled: false },
          dataRetention: '90 days',
          dataSharing: 'prohibited'
        },
        trainingEnvironmentSpecs: {
          computeRequirements: 'standard',
          securityLevel: 'basic',
          compliance: ['GDPR', 'FERPA'],
          dataIsolation: true
        }
      },
      {
        templateId: 'COMMERCIAL_BASIC',
        name: 'Commercial License',
        description: 'Non-exclusive license for commercial use. Suitable for startups, small businesses, and commercial research projects.',
        category: 'COMMERCIAL',
        contractType: 'AI_TRAINING',
        standardDuration: 180,
        priceMultiplier: 2.5,
        basePrice: 100,
        termsAndConditions: `This contract grants a non-exclusive license to use the specified dataset for commercial purposes. The licensee may incorporate the dataset into commercial products and services. The licensee must maintain proper attribution and may not redistribute the raw dataset.`,
        tags: ['commercial', 'startup', 'business', 'attribution-required'],
        privacySettings: {
          differentialPrivacy: { enabled: true, defaultEpsilon: 0.5 },
          federatedLearning: { enabled: true },
          secureMPC: { enabled: false },
          dataRetention: '180 days',
          dataSharing: 'restricted'
        },
        trainingEnvironmentSpecs: {
          computeRequirements: 'enhanced',
          securityLevel: 'intermediate',
          compliance: ['GDPR', 'CCPA', 'SOX'],
          dataIsolation: true,
          auditLogging: true
        }
      },
      {
        templateId: 'ENTERPRISE_PREMIUM',
        name: 'Enterprise License',
        description: 'Enterprise-wide license for large organizations. Suitable for corporations, government agencies, and enterprise research teams.',
        category: 'ENTERPRISE',
        contractType: 'AI_TRAINING',
        standardDuration: 365,
        priceMultiplier: 3.0,
        basePrice: 500,
        termsAndConditions: `This contract grants an enterprise-wide license to use the specified dataset for internal business operations. The licensee may use the dataset across multiple projects and teams within their organization. Commercial redistribution is not permitted without additional licensing.`,
        tags: ['enterprise', 'corporate', 'government', 'multi-team'],
        privacySettings: {
          differentialPrivacy: { enabled: true, defaultEpsilon: 0.1 },
          federatedLearning: { enabled: true },
          secureMPC: { enabled: true },
          dataRetention: '365 days',
          dataSharing: 'controlled'
        },
        trainingEnvironmentSpecs: {
          computeRequirements: 'premium',
          securityLevel: 'high',
          compliance: ['GDPR', 'CCPA', 'SOX', 'HIPAA', 'FedRAMP'],
          dataIsolation: true,
          auditLogging: true,
          encryption: 'end-to-end',
          accessControl: 'role-based'
        }
      },
      {
        templateId: 'CUSTOM_FLEXIBLE',
        name: 'Custom Template',
        description: 'Flexible template that can be customized for specific use cases. Suitable for unique requirements and specialized projects.',
        category: 'CUSTOM',
        contractType: 'AI_TRAINING',
        standardDuration: 120,
        priceMultiplier: 2.0,
        basePrice: 200,
        termsAndConditions: `This is a customizable contract template. Terms and conditions can be modified based on specific project requirements. Please review and customize the terms before proceeding.`,
        tags: ['custom', 'flexible', 'specialized', 'modifiable'],
        privacySettings: {
          differentialPrivacy: { enabled: true, defaultEpsilon: 0.8 },
          federatedLearning: { enabled: false },
          secureMPC: { enabled: false },
          dataRetention: '120 days',
          dataSharing: 'negotiable'
        },
        trainingEnvironmentSpecs: {
          computeRequirements: 'flexible',
          securityLevel: 'configurable',
          compliance: ['configurable'],
          dataIsolation: true,
          customization: true
        }
      }
    ];
  }

  /**
   * Seed default templates into database
   */
  async seedDefaultTemplates() {
    try {
      console.log('🌱 Seeding default contract templates...');
      
      for (const template of this.defaultTemplates) {
        const existingTemplate = await db.ContractTemplate.findOne({
          where: { templateId: template.templateId }
        });
        
        if (!existingTemplate) {
          await db.ContractTemplate.create(template);
          console.log(`✅ Created template: ${template.name}`);
        } else {
          console.log(`⚠️ Template already exists: ${template.name}`);
        }
      }
      
      console.log('✅ Default templates seeded successfully');
    } catch (error) {
      console.error('❌ Error seeding default templates:', error);
      throw error;
    }
  }

  /**
   * Get all active templates
   */
  async getAllTemplates(filters = {}) {
    try {
      const whereClause = { status: 'ACTIVE' };
      
      // Apply filters
      if (filters.category) {
        whereClause.category = filters.category;
      }
      
      if (filters.contractType) {
        whereClause.contractType = filters.contractType;
      }
      
      if (filters.search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${filters.search}%` } },
          { description: { [Op.iLike]: `%${filters.search}%` } },
          { tags: { [Op.contains]: [filters.search] } }
        ];
      }

      const templates = await db.ContractTemplate.findAll({
        where: whereClause,
        order: [['usageCount', 'DESC'], ['name', 'ASC']],
        include: [
          {
            model: db.User,
            as: 'creator',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      return templates;
    } catch (error) {
      console.error('❌ Error getting templates:', error);
      throw error;
    }
  }

  /**
   * Get template by ID
   */
  async getTemplateById(templateId) {
    try {
      const template = await db.ContractTemplate.findOne({
        where: { templateId, status: 'ACTIVE' },
        include: [
          {
            model: db.User,
            as: 'creator',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      return template;
    } catch (error) {
      console.error('❌ Error getting template:', error);
      throw error;
    }
  }

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(category) {
    try {
      const templates = await db.ContractTemplate.findAll({
        where: { 
          category,
          status: 'ACTIVE'
        },
        order: [['usageCount', 'DESC'], ['name', 'ASC']]
      });

      return templates;
    } catch (error) {
      console.error('❌ Error getting templates by category:', error);
      throw error;
    }
  }

  /**
   * Get templates by contract type
   */
  async getTemplatesByContractType(contractType) {
    try {
      const templates = await db.ContractTemplate.findAll({
        where: { 
          contractType,
          status: 'ACTIVE'
        },
        order: [['usageCount', 'DESC'], ['name', 'ASC']]
      });

      return templates;
    } catch (error) {
      console.error('❌ Error getting templates by contract type:', error);
      throw error;
    }
  }

  /**
   * Search templates
   */
  async searchTemplates(searchTerm, filters = {}) {
    try {
      const whereClause = {
        status: 'ACTIVE'
      };

      // Apply additional filters
      if (filters.category) {
        whereClause.category = filters.category;
      }
      
      if (filters.contractType) {
        whereClause.contractType = filters.contractType;
      }

      // Use simple text search instead of complex JSON operators
      if (searchTerm) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${searchTerm}%` } },
          { description: { [Op.iLike]: `%${searchTerm}%` } }
        ];
      }

      const templates = await db.ContractTemplate.findAll({
        where: whereClause,
        order: [['usageCount', 'DESC'], ['name', 'ASC']]
      });

      // If we have a search term, also filter by tags (client-side)
      let filteredTemplates = templates;
      if (searchTerm) {
        filteredTemplates = templates.filter(template => {
          // Check if any tags contain the search term
          if (template.tags && Array.isArray(template.tags)) {
            return template.tags.some(tag => 
              tag.toLowerCase().includes(searchTerm.toLowerCase())
            );
          }
          return true;
        });
      }

      return filteredTemplates;
    } catch (error) {
      console.error('❌ Error searching templates:', error);
      throw error;
    }
  }

  /**
   * Create new template
   */
  async createTemplate(templateData, userId) {
    try {
      const template = await db.ContractTemplate.create({
        ...templateData,
        createdBy: userId
      });

      console.log(`✅ Created template: ${template.name}`);
      return template;
    } catch (error) {
      console.error('❌ Error creating template:', error);
      throw error;
    }
  }

  /**
   * Update template
   */
  async updateTemplate(templateId, updateData) {
    try {
      const template = await db.ContractTemplate.findOne({
        where: { templateId }
      });

      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      await template.update(updateData);
      console.log(`✅ Updated template: ${template.name}`);
      
      return template;
    } catch (error) {
      console.error('❌ Error updating template:', error);
      throw error;
    }
  }

  /**
   * Delete template (soft delete by setting status to ARCHIVED)
   */
  async deleteTemplate(templateId) {
    try {
      const template = await db.ContractTemplate.findOne({
        where: { templateId }
      });

      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      await template.update({ status: 'ARCHIVED' });
      console.log(`✅ Archived template: ${template.name}`);
      
      return template;
    } catch (error) {
      console.error('❌ Error deleting template:', error);
      throw error;
    }
  }

  /**
   * Increment template usage count
   */
  async incrementUsage(templateId) {
    try {
      const template = await db.ContractTemplate.findOne({
        where: { templateId }
      });

      if (template) {
        template.usageCount += 1;
        await template.save();
        console.log(`📊 Incremented usage for template: ${template.name}`);
      }
    } catch (error) {
      console.error('❌ Error incrementing usage:', error);
      // Don't throw error for usage tracking failures
    }
  }

  /**
   * Get template recommendations based on dataset and user preferences
   */
  async getTemplateRecommendations(dataset, userPreferences = {}) {
    try {
      const templates = await this.getAllTemplates();
      const recommendations = [];

      for (const template of templates) {
        let score = 0;
        const reasons = [];

        // Check dataset compatibility
        if (template.isCompatibleWithDataset && template.isCompatibleWithDataset(dataset)) {
          score += 10;
          reasons.push('Dataset compatible');
        }

        // Check category match
        if (userPreferences.category && template.category === userPreferences.category) {
          score += 8;
          reasons.push('Category preference match');
        }

        // Check duration preference
        if (userPreferences.duration) {
          const durationDiff = Math.abs(template.standardDuration - userPreferences.duration);
          if (durationDiff <= 30) {
            score += 6;
            reasons.push('Duration preference match');
          } else if (durationDiff <= 90) {
            score += 3;
            reasons.push('Duration preference close');
          }
        }

        // Check budget preference
        if (userPreferences.budget && template.priceMultiplier <= userPreferences.budget) {
          score += 5;
          reasons.push('Budget preference match');
        }

        // Popularity bonus
        score += Math.min(template.usageCount / 10, 5);
        if (template.usageCount > 50) {
          reasons.push('Popular choice');
        }

        recommendations.push({
          template,
          score,
          reasons
        });
      }

      // Sort by score (highest first)
      recommendations.sort((a, b) => b.score - a.score);

      return recommendations;
    } catch (error) {
      console.error('❌ Error getting template recommendations:', error);
      throw error;
    }
  }

  /**
   * Generate contract data from template
   */
  async generateContractFromTemplate(templateId, contractData) {
    try {
      const template = await this.getTemplateById(templateId);
      
      // Generate contract data based on template
      const generatedContract = {
        duration: contractData.duration || template.standardDuration,
        termsAndConditions: contractData.termsAndConditions || template.termsAndConditions,
        contractType: template.contractType,
        environmentSpecs: {
          ...template.trainingEnvironmentSpecs,
          ...contractData.environmentSpecs
        },
        trainingParams: {
          ...contractData.trainingParams,
          privacySettings: {
            ...template.privacySettings,
            ...contractData.privacySettings
          }
        },
        kmsConfigs: {
          ...template.kmsConfigTemplate,
          ...contractData.kmsConfigs
        }
      };

      // Calculate price based on template
      if (contractData.datasetSelections) {
        const totalPrice = contractData.datasetSelections.reduce((total, selection) => {
          const datasetPrice = parseFloat(selection.individualPrice);
          const templatePrice = template.getFullPrice(datasetPrice);
          return total + templatePrice;
        }, 0);
        
        generatedContract.totalPrice = totalPrice;
      }

      return generatedContract;
    } catch (error) {
      console.error('❌ Error generating contract from template:', error);
      throw error;
    }
  }

  /**
   * Validate template compatibility with dataset
   */
  async validateTemplateCompatibility(templateId, dataset) {
    try {
      const template = await this.getTemplateById(templateId);
      
      const compatibility = {
        compatible: true,
        issues: [],
        warnings: []
      };

      // Check dataset restrictions
      if (template.metadata && template.metadata.datasetRestrictions) {
        const restrictions = template.metadata.datasetRestrictions;
        
        // Check category restrictions
        if (restrictions.allowedCategories && !restrictions.allowedCategories.includes(dataset.category)) {
          compatibility.compatible = false;
          compatibility.issues.push(`Dataset category '${dataset.category}' not allowed for this template`);
        }
        
        // Check size restrictions
        if (restrictions.maxSize && dataset.size > restrictions.maxSize) {
          compatibility.warnings.push(`Dataset size (${dataset.size}) exceeds recommended maximum (${restrictions.maxSize})`);
        }
        
        // Check record count restrictions
        if (restrictions.maxRecords && dataset.recordCount > restrictions.maxRecords) {
          compatibility.warnings.push(`Dataset record count (${dataset.recordCount}) exceeds recommended maximum (${restrictions.maxRecords})`);
        }
      }

      // Check privacy requirements
      if (template.privacySettings && dataset.privacyLevel) {
        const requiredLevel = template.privacySettings.minPrivacyLevel;
        if (requiredLevel && dataset.privacyLevel < requiredLevel) {
          compatibility.warnings.push(`Dataset privacy level (${dataset.privacyLevel}) may not meet template requirements (${requiredLevel})`);
        }
      }

      return compatibility;
    } catch (error) {
      console.error('❌ Error validating template compatibility:', error);
      throw error;
    }
  }
}

module.exports = ContractTemplateService; 