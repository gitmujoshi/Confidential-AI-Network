const { User, AIModel, Dataset, Contract } = require('./models');

async function showDemoData() {
  try {
    console.log('📊 Current Demo Data in Database\n');

    // --- USERS ---
    console.log('👥 USERS:');
    const users = await User.findAll({
      where: { 
        email: {
          [require('sequelize').Op.like]: '%@example.com'
        }
      },
      attributes: ['id', 'name', 'email', 'partyType']
    });
    
    users.forEach(user => {
      console.log(`  ${user.partyType}: ${user.name} (${user.email})`);
    });

    // --- AI MODELS ---
    console.log('\n🤖 AI MODELS:');
    const models = await AIModel.findAll({
      attributes: ['id', 'modelId', 'name', 'type', 'framework']
    });
    
    models.forEach(model => {
      console.log(`  ${model.modelId}: ${model.name} (${model.type}, ${model.framework})`);
    });

    // --- DATASETS ---
    console.log('\n📁 DATASETS:');
    const datasets = await Dataset.findAll({
      attributes: ['id', 'datasetId', 'name', 'category', 'price', 'ownerId']
    });
    
    datasets.forEach(dataset => {
      console.log(`  ${dataset.datasetId}: ${dataset.name} (${dataset.category}, $${dataset.price})`);
    });

    // --- CONTRACTS ---
    console.log('\n📋 CONTRACTS:');
    const contracts = await Contract.findAll({
      attributes: ['id', 'contractId', 'price', 'status', 'tdpId', 'tdcId', 'ccrpId', 'datasetId']
    });
    
    contracts.forEach(contract => {
      console.log(`  ${contract.contractId}: $${contract.price} (${contract.status})`);
    });

    console.log('\n🔑 LOGIN CREDENTIALS:');
    console.log('  Password for all users: password123');
    console.log('\n📧 ACTUAL EMAILS (copy these for login):');
    users.forEach(user => {
      console.log(`  ${user.partyType}: ${user.email}`);
    });

  } catch (error) {
    console.error('❌ Error showing demo data:', error);
  }
}

showDemoData(); 