/**
 * Create Test Data Script
 * Populates the database with comprehensive test data for SCITT CCF testing
 */

const { Sequelize } = require('sequelize');

// Connect to database from inside the container
const sequelize = new Sequelize(
  'contract_management',
  'postgres',
  'postgres',
  {
    host: 'postgres-app',
    port: 5432,
    dialect: 'postgres',
    logging: false
  }
);

async function createTestData() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    console.log('🚀 Creating comprehensive test data...');
    
    // Create test users
    console.log('👥 Creating test users...');
    const users = await sequelize.query(`
      INSERT INTO users (name, email, party_type, organization, wallet_address, is_active, depa_id) VALUES
      ('System Administrator', 'admin@contractmanagement.com', 'ADMIN', 'Contract Management System', '0x1234567890123456789012345678901234567890', true, 'USER-ADMIN-001'),
      ('Healthcare Data Corp', 'healthcare@tdp.com', 'TDP', 'Healthcare Data Corporation', '0x1111111111111111111111111111111111111111', true, 'USER-TDP-001'),
      ('Financial Analytics Inc', 'finance@tdp.com', 'TDP', 'Financial Analytics Incorporated', '0x2222222222222222222222222222222222222222', true, 'USER-TDP-002'),
      ('Retail Insights Ltd', 'retail@tdp.com', 'TDP', 'Retail Insights Limited', '0x3333333333333333333333333333333333333333', true, 'USER-TDP-003'),
      ('AI Research Institute', 'research@tdc.com', 'TDC', 'AI Research Institute', '0x4444444444444444444444444444444444444444', true, 'USER-TDC-001'),
      ('Tech Startup Co', 'tech@tdc.com', 'TDC', 'Tech Startup Company', '0x5555555555555555555555555555555555555555', true, 'USER-TDC-002'),
      ('Secure Compute Solutions', 'secure@ccrp.com', 'CCRP', 'Secure Compute Solutions', '0x6666666666666666666666666666666666666666', true, 'USER-CCRP-001'),
      ('Privacy First Computing', 'privacy@ccrp.com', 'CCRP', 'Privacy First Computing', '0x7777777777777777777777777777777777777777', true, 'USER-CCRP-002')
      RETURNING id, name, email, party_type, depa_id
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log(`✅ Created ${users.length} users`);
    
    // Create contract templates
    console.log('📋 Creating contract templates...');
    const templates = await sequelize.query(`
      INSERT INTO contract_templates (template_id, name, description, terms, contract_type, created_by) VALUES
      ('TEMPLATE-001', 'Standard AI Training Contract', 'Standard contract template for AI model training', 'Standard terms and conditions for AI training contracts', 'AI_TRAINING', 1),
      ('TEMPLATE-002', 'Healthcare Data Contract', 'Specialized contract for healthcare data usage', 'Healthcare-specific terms with HIPAA compliance', 'HEALTHCARE', 1),
      ('TEMPLATE-003', 'Financial Data Contract', 'Contract template for financial data analysis', 'Financial data usage terms with regulatory compliance', 'FINANCIAL', 1)
      RETURNING id, template_id, name, contract_type
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log(`✅ Created ${templates.length} contract templates`);
    
    // Create datasets for TDP users
    console.log('📊 Creating datasets...');
    const datasets = await sequelize.query(`
      INSERT INTO datasets (dataset_id, name, description, category, size, record_count, price, license, tags, metadata, owner_id, depa_id) VALUES
      ('DATASET-001', 'Medical Imaging Dataset', 'Comprehensive medical imaging dataset for AI training', 'Computer Vision', 512000, 100000, 5000.00, 'Commercial License', '["medical", "imaging", "AI", "healthcare"]', '{"confidentiality": "HIGH", "format": "DICOM", "anonymized": true}', 2, 'DATASET-001'),
      ('DATASET-002', 'Patient Records Dataset', 'Anonymized patient records for research purposes', 'Tabular', 204800, 50000, 3000.00, 'Research License', '["patient", "records", "research", "healthcare"]', '{"confidentiality": "HIGH", "format": "CSV", "anonymized": true}', 2, 'DATASET-002'),
      ('DATASET-003', 'Clinical Trial Data', 'Clinical trial results and outcomes data', 'Tabular', 153600, 25000, 2000.00, 'Academic License', '["clinical", "trials", "outcomes", "research"]', '{"confidentiality": "MEDIUM", "format": "JSON", "anonymized": true}', 2, 'DATASET-003'),
      ('DATASET-004', 'Stock Market Data', 'Historical stock market data for algorithmic trading', 'Tabular', 1048576, 1000000, 8000.00, 'Commercial License', '["stock", "market", "trading", "financial"]', '{"confidentiality": "MEDIUM", "format": "CSV", "frequency": "daily"}', 3, 'DATASET-004'),
      ('DATASET-005', 'Credit Risk Dataset', 'Credit risk assessment data for banking', 'Tabular', 307200, 75000, 4000.00, 'Commercial License', '["credit", "risk", "banking", "assessment"]', '{"confidentiality": "HIGH", "format": "CSV", "anonymized": true}', 3, 'DATASET-005'),
      ('DATASET-006', 'Customer Behavior Data', 'Customer shopping behavior and preferences', 'Tabular', 409600, 200000, 3500.00, 'Commercial License', '["customer", "behavior", "retail", "shopping"]', '{"confidentiality": "MEDIUM", "format": "JSON", "frequency": "hourly"}', 4, 'DATASET-006'),
      ('DATASET-007', 'Inventory Analytics', 'Inventory management and sales analytics data', 'Tabular', 256000, 100000, 1500.00, 'Commercial License', '["inventory", "analytics", "retail", "management"]', '{"confidentiality": "LOW", "format": "CSV", "frequency": "daily"}', 4, 'DATASET-007')
      RETURNING id, dataset_id, name, owner_id, depa_id
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log(`✅ Created ${datasets.length} datasets`);
    
    // Create AI models for TDC users
    console.log('🤖 Creating AI models...');
    const models = await sequelize.query(`
      INSERT INTO ai_models (model_id, name, description, model_type, architecture, accuracy, price, tags, metadata, owner_id, depa_id) VALUES
      ('MODEL-001', 'Medical AI Model', 'AI model for medical diagnosis and analysis', 'Computer Vision', 'Deep Learning', 0.95, 15000.00, '["medical", "AI", "diagnosis", "healthcare"]', '{"framework": "PyTorch", "input_size": "512x512", "output_classes": 10}', 5, 'MODEL-001'),
      ('MODEL-002', 'Financial Prediction Model', 'AI model for financial market predictions', 'Tabular', 'Neural Network', 0.87, 12000.00, '["financial", "prediction", "AI", "trading"]', '{"framework": "TensorFlow", "input_features": 50, "output_type": "regression"}', 5, 'MODEL-002'),
      ('MODEL-003', 'Customer Segmentation Model', 'AI model for customer segmentation and targeting', 'Tabular', 'Machine Learning', 0.92, 8000.00, '["customer", "segmentation", "AI", "marketing"]', '{"framework": "Scikit-learn", "algorithm": "K-means", "clusters": 5}', 6, 'MODEL-003')
      RETURNING id, model_id, name, owner_id, depa_id
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log(`✅ Created ${models.length} AI models`);
    
    // Create sample contracts
    console.log('📜 Creating sample contracts...');
    const contracts = await sequelize.query(`
      INSERT INTO contracts (contract_id, name, description, tdp_id, tdc_id, ccrp_id, dataset_id, model_id, template_id, price, duration, terms_and_conditions, status, depa_id) VALUES
      ('CONTRACT-001', 'Healthcare AI Training Contract', 'Contract for training medical AI model on healthcare dataset', 2, 5, 7, 1, 1, 'TEMPLATE-001', 8000.00, 90, 'Standard AI training terms with healthcare data compliance', 'PENDING_TDP_APPROVAL', 'CONTRACT-001'),
      ('CONTRACT-002', 'Financial Analytics Contract', 'Contract for financial data analysis and model training', 3, 5, 8, 4, 2, 'TEMPLATE-003', 12000.00, 120, 'Financial data analysis with regulatory compliance', 'PENDING_TDP_APPROVAL', 'CONTRACT-002'),
      ('CONTRACT-003', 'Retail Customer Insights Contract', 'Contract for customer behavior analysis', 4, 6, 7, 6, 3, 'TEMPLATE-001', 5000.00, 60, 'Customer behavior analysis with privacy protection', 'PENDING_TDP_APPROVAL', 'CONTRACT-003')
      RETURNING id, contract_id, name, status, depa_id
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log(`✅ Created ${contracts.length} contracts`);
    
    console.log('🎉 Test data creation completed successfully!');
    
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
  console.log('\n📊 Test Data Summary:');
  console.log('=====================');
  
  const userCount = await sequelize.query('SELECT COUNT(*) as count FROM users', { type: Sequelize.QueryTypes.SELECT });
  const datasetCount = await sequelize.query('SELECT COUNT(*) as count FROM datasets', { type: Sequelize.QueryTypes.SELECT });
  const modelCount = await sequelize.query('SELECT COUNT(*) as count FROM ai_models', { type: Sequelize.QueryTypes.SELECT });
  const templateCount = await sequelize.query('SELECT COUNT(*) as count FROM contract_templates', { type: Sequelize.QueryTypes.SELECT });
  const contractCount = await sequelize.query('SELECT COUNT(*) as count FROM contracts', { type: Sequelize.QueryTypes.SELECT });
  
  console.log(`👥 Users: ${userCount[0].count}`);
  console.log(`📊 Datasets: ${datasetCount[0].count}`);
  console.log(`🤖 AI Models: ${modelCount[0].count}`);
  console.log(`📋 Contract Templates: ${templateCount[0].count}`);
  console.log(`📜 Contracts: ${contractCount[0].count}`);
  
  // Show users by role
  const usersByRole = await sequelize.query(`
    SELECT party_type, name, email, depa_id 
    FROM users 
    ORDER BY party_type, name
  `, { type: Sequelize.QueryTypes.SELECT });
  
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
      console.log(`  • ${user.name} (${user.email}) - ${user.depa_id}`);
    });
  });
  
  // Show datasets
  const datasets = await sequelize.query(`
    SELECT d.dataset_id, d.name, d.price, u.name as owner_name, d.depa_id
    FROM datasets d
    JOIN users u ON d.owner_id = u.id
    ORDER BY d.name
  `, { type: Sequelize.QueryTypes.SELECT });
  
  console.log('\n📊 Available Datasets:');
  console.log('----------------------');
  datasets.forEach(dataset => {
    console.log(`• ${dataset.name} - ${dataset.owner_name} ($${dataset.price}) - ${dataset.depa_id}`);
  });
  
  // Show AI models
  const models = await sequelize.query(`
    SELECT m.model_id, m.name, m.price, u.name as owner_name, m.depa_id
    FROM ai_models m
    JOIN users u ON m.owner_id = u.id
    ORDER BY m.name
  `, { type: Sequelize.QueryTypes.SELECT });
  
  console.log('\n🤖 Available AI Models:');
  console.log('------------------------');
  models.forEach(model => {
    console.log(`• ${model.name} - ${model.owner_name} ($${model.price}) - ${model.depa_id}`);
  });
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
