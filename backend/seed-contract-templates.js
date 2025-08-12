const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './config.env') });

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: '***REMOVED-DB_PASSWORD***',
    logging: false
  }
);

const defaultTemplates = [
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
    },
    status: 'ACTIVE',
    version: '1.0.0',
    usageCount: 0
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
    },
    status: 'ACTIVE',
    version: '1.0.0',
    usageCount: 0
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
    },
    status: 'ACTIVE',
    version: '1.0.0',
    usageCount: 0
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
    },
    status: 'ACTIVE',
    version: '1.0.0',
    usageCount: 0
  }
];

async function seedTemplates() {
  try {
    console.log('🌱 Seeding contract templates...');
    
    for (const template of defaultTemplates) {
      const existingTemplate = await sequelize.query(
        'SELECT id FROM contract_templates WHERE "templateId" = :templateId',
        {
          replacements: { templateId: template.templateId },
          type: Sequelize.QueryTypes.SELECT
        }
      );
      
      if (existingTemplate.length === 0) {
        await sequelize.query(
          `INSERT INTO contract_templates (
            "templateId", name, description, category, "contractType", 
            "standardDuration", "priceMultiplier", "basePrice", "termsAndConditions", 
            tags, "privacySettings", "trainingEnvironmentSpecs", status, version, "usageCount",
            "createdAt", "updatedAt"
          ) VALUES (
            :templateId, :name, :description, :category, :contractType,
            :standardDuration, :priceMultiplier, :basePrice, :termsAndConditions,
            :tags, :privacySettings, :trainingEnvironmentSpecs, :status, :version, :usageCount,
            NOW(), NOW()
          )`,
          {
            replacements: {
              templateId: template.templateId,
              name: template.name,
              description: template.description,
              category: template.category,
              contractType: template.contractType,
              standardDuration: template.standardDuration,
              priceMultiplier: template.priceMultiplier,
              basePrice: template.basePrice,
              termsAndConditions: template.termsAndConditions,
              tags: JSON.stringify(template.tags),
              privacySettings: JSON.stringify(template.privacySettings),
              trainingEnvironmentSpecs: JSON.stringify(template.trainingEnvironmentSpecs),
              status: template.status,
              version: template.version,
              usageCount: template.usageCount
            },
            type: Sequelize.QueryTypes.INSERT
          }
        );
        console.log(`✅ Created template: ${template.name}`);
      } else {
        console.log(`⚠️ Template already exists: ${template.name}`);
      }
    }
    
    console.log('✅ Contract templates seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding templates:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

seedTemplates()
  .then(() => process.exit(0))
  .catch(() => process.exit(1)); 