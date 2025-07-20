const db = require('./models');
const { v4: uuidv4 } = require('uuid');

async function createContractForUser13() {
  try {
    console.log('🔧 Creating contract for user ID 13...');
    
    // Get a TDP user to create contract with
    const tdpUser = await db.User.findOne({ 
      where: { partyType: 'TDP' },
      attributes: ['id', 'email', 'name']
    });
    
    if (!tdpUser) {
      console.log('❌ No TDP user found. Creating one first...');
      const hashedPassword = await require('bcryptjs').hash('password123', 10);
      const newTdpUser = await db.User.create({
        email: 'tdp-for-ui@example.com',
        password: hashedPassword,
        name: 'TDP for UI',
        partyType: 'TDP',
        isActive: true
      });
      console.log('✅ Created TDP user:', { id: newTdpUser.id, email: newTdpUser.email });
    }
    
    // Get TDP user (either existing or newly created)
    const tdpUserFinal = await db.User.findOne({ 
      where: { partyType: 'TDP' },
      attributes: ['id', 'email', 'name']
    });
    
    // Get a dataset to use
    const dataset = await db.Dataset.findOne({
      attributes: ['id', 'name']
    });
    
    if (!dataset) {
      console.log('❌ No dataset found. Creating one first...');
      const newDataset = await db.Dataset.create({
        datasetId: `DATASET-${uuidv4()}`,
        name: 'Sample Dataset for UI',
        description: 'A sample dataset for UI testing',
        dataType: 'STRUCTURED',
        privacyLevel: 'ANONYMIZED',
        tdpId: tdpUserFinal.id,
        isActive: true
      });
      console.log('✅ Created dataset:', { id: newDataset.id, name: newDataset.name });
    }
    
    const datasetFinal = await db.Dataset.findOne({
      attributes: ['id', 'name']
    });
    
    // Create contract for user ID 13
    const contract = await db.Contract.create({
      contractId: `CONTRACT-${uuidv4()}`,
      tdcId: 13,
      tdpId: tdpUserFinal.id,
      primaryDatasetId: datasetFinal.id,
      primaryTdpId: tdpUserFinal.id,
      datasetId: datasetFinal.id,
      price: 1000.00,
      duration: 365,
      status: 'SIGNED',
      termsAndConditions: 'Standard terms and conditions for data sharing.',
      dataUsagePurpose: 'AI Model Training',
      dataRetentionPeriod: 365,
      maxTrainingRuns: 5,
      trainingParams: JSON.stringify({
        epochs: 100,
        batchSize: 32,
        learningRate: 0.001
      }),
      environmentSpecs: JSON.stringify({
        computeRequirements: 'GPU',
        memoryRequirements: '16GB',
        storageRequirements: '100GB'
      }),
      kmsConfigs: JSON.stringify({
        encryptionType: 'AES-256',
        keyRotation: '30 days'
      }),
      isActive: true
    });
    
    console.log('✅ Created contract for user ID 13:', {
      id: contract.id,
      contractId: contract.contractId,
      status: contract.status,
      tdcId: contract.tdcId,
      tdpId: contract.tdpId
    });
    
    console.log('🎉 TDC dashboard should now work for user ID 13!');
    
  } catch (error) {
    console.error('❌ Error creating contract:', error);
  } finally {
    process.exit();
  }
}

createContractForUser13(); 