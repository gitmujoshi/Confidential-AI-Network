/**
 * Simple Test Data Generation Script
 * Creates test data directly in the database without requiring Sequelize models
 */

const { Sequelize } = require('sequelize');

// Connect to database
const sequelize = new Sequelize(
  'contract_management',
  'postgres',
  'postgres',
  {
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: false
  }
);

// Test data
const TEST_DATA = {
  users: [
    {
      name: 'System Administrator',
      email: 'admin@contractmanagement.com',
      party_type: 'ADMIN',
      organization: 'Contract Management System',
      wallet_address: '0x1234567890123456789012345678901234567890',
      is_active: true
    },
    {
      name: 'Healthcare Data Corp',
      email: 'healthcare@tdp.com',
      party_type: 'TDP',
      organization: 'Healthcare Data Corporation',
      wallet_address: '0x1111111111111111111111111111111111111111',
      is_active: true
    },
    {
      name: 'Financial Analytics Inc',
      email: 'finance@tdp.com',
      party_type: 'TDP',
      organization: 'Financial Analytics Incorporated',
      wallet_address: '0x2222222222222222222222222222222222222222',
      is_active: true
    },
    {
      name: 'Retail Insights Ltd',
      email: 'retail@tdp.com',
      party_type: 'TDP',
      organization: 'Retail Insights Limited',
      wallet_address: '0x3333333333333333333333333333333333333333',
      is_active: true
    },
    {
      name: 'AI Research Institute',
      email: 'research@tdc.com',
      party_type: 'TDC',
      organization: 'AI Research Institute',
      wallet_address: '0x4444444444444444444444444444444444444444',
      is_active: true
    },
    {
      name: 'Tech Startup Co',
      email: 'tech@tdc.com',
      party_type: 'TDC',
      organization: 'Tech Startup Company',
      wallet_address: '0x5555555555555555555555555555555555555555',
      is_active: true
    },
    {
      name: 'Secure Compute Solutions',
      email: 'secure@ccrp.com',
      party_type: 'CCRP',
      organization: 'Secure Compute Solutions',
      wallet_address: '0x6666666666666666666666666666666666666666',
      is_active: true
    },
    {
      name: 'Privacy First Computing',
      email: 'privacy@ccrp.com',
      party_type: 'CCRP',
      organization: 'Privacy First Computing',
      wallet_address: '0x7777777777777777777777777777777777777777',
      is_active: true
    }
  ],
  
  contractTemplates: [
    {
      template_id: 'TEMPLATE-001',
      name: 'Standard AI Training Contract',
      description: 'Standard contract template for AI model training',
      terms: 'Standard terms and conditions for AI training contracts',
      is_active: true,
      contract_type: 'AI_TRAINING'
    },
    {
      template_id: 'TEMPLATE-002',
      name: 'Healthcare Data Contract',
      description: 'Specialized contract for healthcare data usage',
      terms: 'Healthcare-specific terms with HIPAA compliance',
      is_active: true,
      contract_type: 'HEALTHCARE'
    },
    {
      template_id: 'TEMPLATE-003',
      name: 'Financial Data Contract',
      description: 'Contract template for financial data analysis',
      terms: 'Financial data usage terms with regulatory compliance',
      is_active: true,
      contract_type: 'FINANCIAL'
    }
  ]
};

async function createTestData() {
  try {
    console.log('🚀 Creating test data...\n');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful\n');
    
    // Create contract templates
    console.log('📋 Creating contract templates...');
    for (const template of TEST_DATA.contractTemplates) {
      await sequelize.query(`
        INSERT INTO contract_templates (template_id, name, description, terms, is_active, contract_type)
        VALUES (:template_id, :name, :description, :terms, :is_active, :contract_type)
        ON CONFLICT (template_id) DO NOTHING
      `, {
        replacements: template,
        type: sequelize.QueryTypes.INSERT
      });
      console.log(`   ✅ Created template: ${template.name}`);
    }
    
    // Create users
    console.log('\n👥 Creating users...');
    const userIds = {};
    for (const user of TEST_DATA.users) {
      const [result] = await sequelize.query(`
        INSERT INTO users (name, email, party_type, organization, wallet_address, is_active)
        VALUES (:name, :email, :party_type, :organization, :wallet_address, :is_active)
        ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          party_type = EXCLUDED.party_type,
          organization = EXCLUDED.organization,
          wallet_address = EXCLUDED.wallet_address,
          is_active = EXCLUDED.is_active
        RETURNING id
      `, {
        replacements: user,
        type: sequelize.QueryTypes.INSERT
      });
      
      if (result && result.id) {
        userIds[user.email] = result.id;
        console.log(`   ✅ Created user: ${user.name} (${user.party_type})`);
      } else {
        // Get existing user ID
        const [existingUser] = await sequelize.query(`
          SELECT id FROM users WHERE email = :email
        `, {
          replacements: { email: user.email },
          type: sequelize.QueryTypes.SELECT
        });
        if (existingUser) {
          userIds[user.email] = existingUser.id;
        }
      }
    }
    
    // Create datasets for TDP users
    console.log('\n📊 Creating datasets...');
    const datasets = [
      {
        name: 'Medical Imaging Dataset',
        description: 'Comprehensive medical imaging dataset for AI training',
        data_type: 'MEDICAL_IMAGING',
        size: '500GB',
        record_count: 100000,
        confidentiality: 'HIGH',
        price: 5000,
        user_id: userIds['healthcare@tdp.com']
      },
      {
        name: 'Patient Records Dataset',
        description: 'Anonymized patient records for research purposes',
        data_type: 'PATIENT_RECORDS',
        size: '200GB',
        record_count: 50000,
        confidentiality: 'HIGH',
        price: 3000,
        user_id: userIds['healthcare@tdp.com']
      },
      {
        name: 'Stock Market Data',
        description: 'Historical stock market data for algorithmic trading',
        data_type: 'FINANCIAL_DATA',
        size: '1TB',
        record_count: 1000000,
        confidentiality: 'MEDIUM',
        price: 8000,
        user_id: userIds['finance@tdp.com']
      },
      {
        name: 'Customer Behavior Data',
        description: 'Customer shopping behavior and preferences',
        data_type: 'CUSTOMER_BEHAVIOR',
        size: '400GB',
        record_count: 200000,
        confidentiality: 'MEDIUM',
        price: 3500,
        user_id: userIds['retail@tdp.com']
      }
    ];
    
    for (const dataset of datasets) {
      if (dataset.user_id) {
        await sequelize.query(`
          INSERT INTO datasets (name, description, data_type, size, record_count, confidentiality, price, user_id, metadata)
          VALUES (:name, :description, :data_type, :size, :record_count, :confidentiality, :price, :user_id, :metadata)
          ON CONFLICT (name, user_id) DO NOTHING
        `, {
          replacements: {
            ...dataset,
            metadata: JSON.stringify({
              tags: [dataset.data_type.toLowerCase().replace('_', ' '), 'AI', 'training'],
              confidentiality: dataset.confidentiality,
              record_count: dataset.record_count
            })
          },
          type: sequelize.QueryTypes.INSERT
        });
        console.log(`   ✅ Created dataset: ${dataset.name}`);
      }
    }
    
    // Create AI models for TDC users
    console.log('\n🤖 Creating AI models...');
    const models = [
      {
        name: 'Medical AI Model',
        description: 'AI model for medical diagnosis and analysis',
        model_type: 'MEDICAL_AI',
        architecture: 'Deep Learning',
        accuracy: 0.95,
        price: 15000,
        user_id: userIds['research@tdc.com']
      },
      {
        name: 'Financial Prediction Model',
        description: 'AI model for financial market predictions',
        model_type: 'FINANCIAL_PREDICTION',
        architecture: 'Neural Network',
        accuracy: 0.87,
        price: 12000,
        user_id: userIds['research@tdc.com']
      },
      {
        name: 'Customer Segmentation Model',
        description: 'AI model for customer segmentation and targeting',
        model_type: 'CUSTOMER_SEGMENTATION',
        architecture: 'Machine Learning',
        accuracy: 0.92,
        price: 8000,
        user_id: userIds['tech@tdc.com']
      }
    ];
    
    for (const model of models) {
      if (model.user_id) {
        await sequelize.query(`
          INSERT INTO ai_models (name, description, model_type, architecture, accuracy, price, user_id, metadata)
          VALUES (:name, :description, :model_type, :architecture, :accuracy, :price, :user_id, :metadata)
          ON CONFLICT (name, user_id) DO NOTHING
        `, {
          replacements: {
            ...model,
            metadata: JSON.stringify({
              tags: [model.model_type.toLowerCase().replace('_', ' '), 'AI', 'model'],
              architecture: model.architecture,
              accuracy: model.accuracy
            })
          },
          type: sequelize.QueryTypes.INSERT
        });
        console.log(`   ✅ Created model: ${model.name}`);
      }
    }
    
    console.log('\n🎉 Test data creation completed!');
    
    // Display summary
    await displaySummary();
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

async function displaySummary() {
  try {
    const sequelize = new Sequelize(
      'contract_management',
      'postgres',
      'postgres',
      {
        host: 'localhost',
        port: 5432,
        dialect: 'postgres',
        logging: false
      }
    );
    
    console.log('\n📊 Test Data Summary:');
    console.log('=====================');
    
    const [userCount] = await sequelize.query('SELECT COUNT(*) as count FROM users', { type: sequelize.QueryTypes.SELECT });
    const [datasetCount] = await sequelize.query('SELECT COUNT(*) as count FROM datasets', { type: sequelize.QueryTypes.SELECT });
    const [modelCount] = await sequelize.query('SELECT COUNT(*) as count FROM ai_models', { type: sequelize.QueryTypes.SELECT });
    const [templateCount] = await sequelize.query('SELECT COUNT(*) as count FROM contract_templates', { type: sequelize.QueryTypes.SELECT });
    
    console.log(`👥 Users: ${userCount.count}`);
    console.log(`📊 Datasets: ${datasetCount.count}`);
    console.log(`🤖 AI Models: ${modelCount.count}`);
    console.log(`📋 Contract Templates: ${templateCount.count}`);
    
    // Show users by role
    const usersByRole = await sequelize.query(`
      SELECT party_type, name, email 
      FROM users 
      ORDER BY party_type, name
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('\n👥 Users by Role:');
    console.log('----------------');
    const roleGroups = {};
    usersByRole.forEach(user => {
      if (!roleGroups[user.party_type]) {
        roleGroups[user.party_type] = [];
      }
      roleGroups[user.party_type].push(user);
    });
    
    Object.entries(roleGroups).forEach(([role, users]) => {
      console.log(`\n${role}:`);
      users.forEach(user => {
        console.log(`  • ${user.name} (${user.email})`);
      });
    });
    
    // Show datasets
    const datasets = await sequelize.query(`
      SELECT d.name, d.price, u.name as user_name
      FROM datasets d
      JOIN users u ON d.user_id = u.id
      ORDER BY d.name
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('\n📊 Available Datasets:');
    console.log('----------------------');
    datasets.forEach(dataset => {
      console.log(`• ${dataset.name} - ${dataset.user_name} ($${dataset.price})`);
    });
    
    // Show AI models
    const models = await sequelize.query(`
      SELECT m.name, m.price, u.name as user_name
      FROM ai_models m
      JOIN users u ON m.user_id = u.id
      ORDER BY m.name
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('\n🤖 Available AI Models:');
    console.log('------------------------');
    models.forEach(model => {
      console.log(`• ${model.name} - ${model.user_name} ($${model.price})`);
    });
    
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Error displaying summary:', error);
  }
}

// Main execution
if (require.main === module) {
  createTestData()
    .then(() => {
      console.log('🎉 Test data creation completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test data creation failed:', error);
      process.exit(1);
    });
}

module.exports = {
  createTestData,
  displaySummary
}; 