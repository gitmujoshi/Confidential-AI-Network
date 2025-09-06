/**
 * Comprehensive Test Data Generation Script
 * Creates test users, datasets, and models for the Contract Management System
 */

const { User, Dataset, AIModel, Contract, ContractTemplate } = require('./models');
const { Op } = require('sequelize');

// Test data configuration
const TEST_DATA = {
  users: [
    // AppAdmin user
    {
      name: 'System Administrator',
      email: 'admin@contractmanagement.com',
      partyType: 'ADMIN',
      organization: 'Contract Management System',
      walletAddress: '0x1234567890123456789012345678901234567890',
      isActive: true,
      role: 'AppAdmin'
    },
    
    // TDP (Training Data Provider) users
    {
      name: 'Healthcare Data Corp',
      email: 'healthcare@tdp.com',
      partyType: 'TDP',
      organization: 'Healthcare Data Corporation',
      walletAddress: '0x1111111111111111111111111111111111111111',
      isActive: true,
      role: 'TDP',
      datasets: [
        {
          name: 'Medical Imaging Dataset',
          description: 'Comprehensive medical imaging dataset for AI training',
          dataType: 'MEDICAL_IMAGING',
          size: '500GB',
          recordCount: 100000,
          confidentiality: 'HIGH',
          price: 5000,
          tags: ['medical', 'imaging', 'AI', 'healthcare']
        },
        {
          name: 'Patient Records Dataset',
          description: 'Anonymized patient records for research purposes',
          dataType: 'PATIENT_RECORDS',
          size: '200GB',
          recordCount: 50000,
          confidentiality: 'HIGH',
          price: 3000,
          tags: ['patient', 'records', 'research', 'healthcare']
        },
        {
          name: 'Clinical Trial Data',
          description: 'Clinical trial results and outcomes data',
          dataType: 'CLINICAL_TRIALS',
          size: '150GB',
          recordCount: 25000,
          confidentiality: 'MEDIUM',
          price: 2000,
          tags: ['clinical', 'trials', 'outcomes', 'research']
        }
      ]
    },
    {
      name: 'Financial Analytics Inc',
      email: 'finance@tdp.com',
      partyType: 'TDP',
      organization: 'Financial Analytics Incorporated',
      walletAddress: '0x2222222222222222222222222222222222222222',
      isActive: true,
      role: 'TDP',
      datasets: [
        {
          name: 'Stock Market Data',
          description: 'Historical stock market data for algorithmic trading',
          dataType: 'FINANCIAL_DATA',
          size: '1TB',
          recordCount: 1000000,
          confidentiality: 'MEDIUM',
          price: 8000,
          tags: ['stock', 'market', 'trading', 'financial']
        },
        {
          name: 'Credit Risk Dataset',
          description: 'Credit risk assessment data for banking',
          dataType: 'CREDIT_RISK',
          size: '300GB',
          recordCount: 75000,
          confidentiality: 'HIGH',
          price: 4000,
          tags: ['credit', 'risk', 'banking', 'assessment']
        }
      ]
    },
    {
      name: 'Retail Insights Ltd',
      email: 'retail@tdp.com',
      partyType: 'TDP',
      organization: 'Retail Insights Limited',
      walletAddress: '0x3333333333333333333333333333333333333333',
      isActive: true,
      role: 'TDP',
      datasets: [
        {
          name: 'Customer Behavior Data',
          description: 'Customer shopping behavior and preferences',
          dataType: 'CUSTOMER_BEHAVIOR',
          size: '400GB',
          recordCount: 200000,
          confidentiality: 'MEDIUM',
          price: 3500,
          tags: ['customer', 'behavior', 'retail', 'shopping']
        },
        {
          name: 'Inventory Analytics',
          description: 'Inventory management and sales analytics data',
          dataType: 'INVENTORY_ANALYTICS',
          size: '250GB',
          recordCount: 100000,
          confidentiality: 'LOW',
          price: 1500,
          tags: ['inventory', 'analytics', 'retail', 'management']
        }
      ]
    },
    
    // TDC (Training Data Consumer) users
    {
      name: 'AI Research Institute',
      email: 'research@tdc.com',
      partyType: 'TDC',
      organization: 'AI Research Institute',
      walletAddress: '0x4444444444444444444444444444444444444444',
      isActive: true,
      role: 'TDC',
      models: [
        {
          name: 'Medical AI Model',
          description: 'AI model for medical diagnosis and analysis',
          modelType: 'MEDICAL_AI',
          architecture: 'Deep Learning',
          accuracy: 0.95,
          price: 15000,
          tags: ['medical', 'AI', 'diagnosis', 'healthcare']
        },
        {
          name: 'Financial Prediction Model',
          description: 'AI model for financial market predictions',
          modelType: 'FINANCIAL_PREDICTION',
          architecture: 'Neural Network',
          accuracy: 0.87,
          price: 12000,
          tags: ['financial', 'prediction', 'AI', 'trading']
        }
      ]
    },
    {
      name: 'Tech Startup Co',
      email: 'tech@tdc.com',
      partyType: 'TDC',
      organization: 'Tech Startup Company',
      walletAddress: '0x5555555555555555555555555555555555555555',
      isActive: true,
      role: 'TDC',
      models: [
        {
          name: 'Customer Segmentation Model',
          description: 'AI model for customer segmentation and targeting',
          modelType: 'CUSTOMER_SEGMENTATION',
          architecture: 'Machine Learning',
          accuracy: 0.92,
          price: 8000,
          tags: ['customer', 'segmentation', 'AI', 'marketing']
        }
      ]
    },
    
    // CCRP (Confidential Clean Room Provider) users
    {
      name: 'Secure Compute Solutions',
      email: 'secure@ccrp.com',
      partyType: 'CCRP',
      organization: 'Secure Compute Solutions',
      walletAddress: '0x6666666666666666666666666666666666666666',
      isActive: true,
      role: 'CCRP',
      capabilities: ['AMD_SEV_SNP', 'Intel_SGX', 'Azure_Confidential_Computing']
    },
    {
      name: 'Privacy First Computing',
      email: 'privacy@ccrp.com',
      partyType: 'CCRP',
      organization: 'Privacy First Computing',
      walletAddress: '0x7777777777777777777777777777777777777777',
      isActive: true,
      role: 'CCRP',
      capabilities: ['AWS_Nitro_Enclaves', 'GCP_Confidential_VMs', 'Homomorphic_Encryption']
    }
  ],
  
  contractTemplates: [
    {
      name: 'Standard AI Training Contract',
      description: 'Standard contract template for AI model training',
      terms: 'Standard terms and conditions for AI training contracts',
      isActive: true,
      contractType: 'AI_TRAINING'
    },
    {
      name: 'Healthcare Data Contract',
      description: 'Specialized contract for healthcare data usage',
      terms: 'Healthcare-specific terms with HIPAA compliance',
      isActive: true,
      contractType: 'HEALTHCARE'
    },
    {
      name: 'Financial Data Contract',
      description: 'Contract template for financial data analysis',
      terms: 'Financial data usage terms with regulatory compliance',
      isActive: true,
      contractType: 'FINANCIAL'
    }
  ]
};

// Function to create users with their associated data
async function createUsersWithData() {
  console.log('🚀 Creating comprehensive test data...\n');
  
  try {
    // Create contract templates first
    console.log('📋 Creating contract templates...');
    for (const templateData of TEST_DATA.contractTemplates) {
      const [template, created] = await ContractTemplate.findOrCreate({
        where: { name: templateData.name },
        defaults: templateData
      });
      console.log(`${created ? '✅ Created' : 'ℹ️  Exists'}: ${template.name}`);
    }
    
    // Create users with their associated data
    console.log('\n👥 Creating users and associated data...');
    
    for (const userData of TEST_DATA.users) {
      console.log(`\n🔄 Processing user: ${userData.name} (${userData.email})`);
      
      // Create or find user
      const [user, userCreated] = await User.findOrCreate({
        where: { email: userData.email },
        defaults: {
          name: userData.name,
          partyType: userData.partyType,
          organization: userData.organization,
          walletAddress: userData.walletAddress,
          isActive: userData.isActive
        }
      });
      
      console.log(`   ${userCreated ? '✅ Created' : 'ℹ️  Exists'}: User ${user.name}`);
      
      // Create datasets for TDP users
      if (userData.datasets) {
        console.log(`   📊 Creating datasets for TDP: ${user.name}`);
        for (const datasetData of userData.datasets) {
          const [dataset, datasetCreated] = await Dataset.findOrCreate({
            where: { 
              name: datasetData.name,
              userId: user.id
            },
            defaults: {
              ...datasetData,
              userId: user.id,
              status: 'ACTIVE',
              metadata: {
                tags: datasetData.tags,
                confidentiality: datasetData.confidentiality,
                recordCount: datasetData.recordCount
              }
            }
          });
          console.log(`     ${datasetCreated ? '✅ Created' : 'ℹ️  Exists'}: Dataset ${dataset.name}`);
        }
      }
      
      // Create AI models for TDC users
      if (userData.models) {
        console.log(`   🤖 Creating AI models for TDC: ${user.name}`);
        for (const modelData of userData.models) {
          const [model, modelCreated] = await AIModel.findOrCreate({
            where: { 
              name: modelData.name,
              userId: user.id
            },
            defaults: {
              ...modelData,
              userId: user.id,
              status: 'ACTIVE',
              metadata: {
                tags: modelData.tags,
                architecture: modelData.architecture,
                accuracy: modelData.accuracy
              }
            }
          });
          console.log(`     ${modelCreated ? '✅ Created' : 'ℹ️  Exists'}: Model ${model.name}`);
        }
      }
    }
    
    console.log('\n🎉 Comprehensive test data creation completed!');
    
    // Display summary
    await displaySummary();
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  }
}

// Function to display summary of created data
async function displaySummary() {
  console.log('\n📊 Test Data Summary:');
  console.log('=====================');
  
  const userCount = await User.count();
  const datasetCount = await Dataset.count();
  const modelCount = await AIModel.count();
  const templateCount = await ContractTemplate.count();
  
  console.log(`👥 Users: ${userCount}`);
  console.log(`📊 Datasets: ${datasetCount}`);
  console.log(`🤖 AI Models: ${modelCount}`);
  console.log(`📋 Contract Templates: ${templateCount}`);
  
  // Show users by role
  const usersByRole = await User.findAll({
    attributes: ['partyType', 'name', 'email'],
    order: [['partyType', 'ASC'], ['name', 'ASC']]
  });
  
  console.log('\n👥 Users by Role:');
  console.log('----------------');
  const roleGroups = {};
  usersByRole.forEach(user => {
    if (!roleGroups[user.partyType]) {
      roleGroups[user.partyType] = [];
    }
    roleGroups[user.partyType].push(user);
  });
  
  Object.entries(roleGroups).forEach(([role, users]) => {
    console.log(`\n${role}:`);
    users.forEach(user => {
      console.log(`  • ${user.name} (${user.email})`);
    });
  });
  
  // Show datasets
  const datasets = await Dataset.findAll({
    include: [{ model: User, as: 'user', attributes: ['name', 'email'] }],
    order: [['name', 'ASC']]
  });
  
  console.log('\n📊 Available Datasets:');
  console.log('----------------------');
  datasets.forEach(dataset => {
    console.log(`• ${dataset.name} - ${dataset.user.name} ($${dataset.price})`);
  });
  
  // Show AI models
  const models = await AIModel.findAll({
    include: [{ model: User, as: 'user', attributes: ['name', 'email'] }],
    order: [['name', 'ASC']]
  });
  
  console.log('\n🤖 Available AI Models:');
  console.log('------------------------');
  models.forEach(model => {
    console.log(`• ${model.name} - ${model.user.name} ($${model.price})`);
  });
}

// Function to clean up test data (optional)
async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...');
  
  try {
    await Contract.destroy({ where: {} });
    await Dataset.destroy({ where: {} });
    await AIModel.destroy({ where: {} });
    await User.destroy({ where: {} });
    await ContractTemplate.destroy({ where: {} });
    
    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--cleanup')) {
    cleanupTestData()
      .then(() => {
        console.log('🎉 Cleanup completed!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('💥 Cleanup failed:', error);
        process.exit(1);
      });
  } else {
    createUsersWithData()
      .then(() => {
        console.log('🎉 Test data creation completed!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('💥 Test data creation failed:', error);
        process.exit(1);
      });
  }
}

module.exports = {
  createUsersWithData,
  cleanupTestData,
  displaySummary
};
