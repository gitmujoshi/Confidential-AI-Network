/**
 * Create Contract with Multiple Datasets
 * 
 * This script creates contracts between TDC and TDP users with multiple datasets.
 * Since the current model supports one dataset per contract, we'll create multiple contracts.
 */

const db = require('../models');

// Sample AI models for different dataset categories
const aiModels = {
  'Computer Vision': [
    'ResNet-50',
    'EfficientNet-B0',
    'Vision Transformer (ViT)',
    'YOLO-v8',
    'DETR (Detection Transformer)'
  ],
  'Natural Language Processing': [
    'BERT-Base',
    'GPT-3.5',
    'RoBERTa',
    'T5-Base',
    'DistilBERT'
  ],
  'Audio': [
    'Whisper-Base',
    'Wav2Vec2',
    'HuBERT',
    'SpeechT5',
    'AudioCLIP'
  ],
  'Tabular': [
    'XGBoost',
    'LightGBM',
    'Random Forest',
    'Neural Network',
    'CatBoost'
  ]
};

// Contract templates with different terms
const contractTemplates = [
  {
    name: 'Standard Research License',
    termsAndConditions: `This contract grants a non-exclusive, non-transferable license to use the specified dataset for research and development purposes only. The licensee may not redistribute the dataset or use it for commercial purposes without written permission. All results must be properly attributed to the dataset provider.`,
    duration: 90,
    priceMultiplier: 1.0
  },
  {
    name: 'Commercial License',
    termsAndConditions: `This contract grants a non-exclusive license to use the specified dataset for commercial purposes. The licensee may incorporate the dataset into commercial products and services. The licensee must maintain proper attribution and may not redistribute the raw dataset.`,
    duration: 180,
    priceMultiplier: 2.5
  },
  {
    name: 'Enterprise License',
    termsAndConditions: `This contract grants an enterprise-wide license to use the specified dataset for internal business operations. The licensee may use the dataset across multiple projects and teams within their organization. Commercial redistribution is not permitted without additional licensing.`,
    duration: 365,
    priceMultiplier: 3.0
  }
];

async function createContractWithMultipleDatasets() {
  try {
    console.log('🚀 Creating Contracts with Multiple Datasets...\n');

    // Find the TDC and TDP users
    const tdcUser = await db.User.findOne({
      where: { email: 'tdcuser@example.com' }
    });

    const tdpUser = await db.User.findOne({
      where: { email: 'tdpuser@example.com' }
    });

    if (!tdcUser) {
      console.error('❌ TDC user not found. Please create the TDC user first.');
      return;
    }

    if (!tdpUser) {
      console.error('❌ TDP user not found. Please create the TDP user first.');
      return;
    }

    console.log(`✅ Found TDC user: ${tdcUser.name} (${tdcUser.email})`);
    console.log(`   User ID: ${tdcUser.id}`);
    console.log(`   Party Type: ${tdcUser.partyType}\n`);

    console.log(`✅ Found TDP user: ${tdpUser.name} (${tdpUser.email})`);
    console.log(`   User ID: ${tdpUser.id}`);
    console.log(`   Party Type: ${tdpUser.partyType}\n`);

    // Get datasets owned by the TDP user
    const datasets = await db.Dataset.findAll({
      where: { ownerId: tdpUser.id, isActive: true },
      order: [['createdAt', 'ASC']]
    });

    if (datasets.length === 0) {
      console.error('❌ No datasets found for TDP user. Please create datasets first.');
      return;
    }

    console.log(`📊 Found ${datasets.length} datasets owned by TDP user:`);
    datasets.forEach((dataset, index) => {
      console.log(`   ${index + 1}. ${dataset.name} (${dataset.datasetId})`);
      console.log(`      Category: ${dataset.category}`);
      console.log(`      Price: $${dataset.price}`);
      console.log(`      Records: ${dataset.recordCount.toLocaleString()}`);
      console.log('');
    });

    // Create contracts for multiple datasets
    console.log('📋 Creating contracts...');
    const createdContracts = [];

    // Select datasets to create contracts for (at least 2)
    const selectedDatasets = datasets.slice(0, Math.min(3, datasets.length)); // Create contracts for up to 3 datasets

    for (let i = 0; i < selectedDatasets.length; i++) {
      const dataset = selectedDatasets[i];
      const contractTemplate = contractTemplates[i % contractTemplates.length];
      
      // Select appropriate model for the dataset category
      const availableModels = aiModels[dataset.category] || aiModels['Computer Vision'];
      const selectedModel = availableModels[i % availableModels.length];
      
      // Calculate contract price based on dataset price and template multiplier
      const contractPrice = parseFloat(dataset.price) * contractTemplate.priceMultiplier;
      
      // Create contract
      const contract = await db.Contract.create({
        contractId: `CONTRACT-${Date.now()}-${i + 1}`,
        blockchainContractId: null, // Will be set when blockchain is available
        tdpId: tdpUser.id,
        tdcId: tdcUser.id,
        ccrpId: null, // No CCRP for this contract
        datasetId: dataset.id,
        modelId: selectedModel,
        price: contractPrice,
        duration: contractTemplate.duration,
        termsAndConditions: contractTemplate.termsAndConditions,
        status: 'PENDING_TDP_APPROVAL',
        tdpSigned: false,
        ccrpSigned: false
      });

      // Get full contract with associations
      const fullContract = await db.Contract.findOne({
        where: { id: contract.id },
        include: [
          { model: db.User, as: 'tdp' },
          { model: db.User, as: 'tdc' },
          { model: db.User, as: 'ccrp' },
          { model: db.Dataset, as: 'dataset' }
        ]
      });

      createdContracts.push(fullContract);

      console.log(`✅ Created contract ${i + 1}: ${contractTemplate.name}`);
      console.log(`   Contract ID: ${contract.contractId}`);
      console.log(`   Dataset: ${dataset.name}`);
      console.log(`   Model: ${selectedModel}`);
      console.log(`   Price: $${contractPrice.toFixed(2)}`);
      console.log(`   Duration: ${contractTemplate.duration} days`);
      console.log(`   Status: ${contract.status}`);
      console.log('');
    }

    console.log('🎉 Contract creation completed!');
    console.log(`\n📋 Summary:`);
    console.log(`   TDC User: ${tdcUser.name} (${tdcUser.email})`);
    console.log(`   TDP User: ${tdpUser.name} (${tdpUser.email})`);
    console.log(`   Total contracts created: ${createdContracts.length}`);
    console.log(`   Total contracts between TDC and TDP: ${await db.Contract.count({ 
      where: { 
        tdcId: tdcUser.id, 
        tdpId: tdpUser.id 
      } 
    })}`);

    // Display all contracts between TDC and TDP
    const allContracts = await db.Contract.findAll({
      where: { 
        tdcId: tdcUser.id, 
        tdpId: tdpUser.id 
      },
      include: [
        { model: db.User, as: 'tdp' },
        { model: db.User, as: 'tdc' },
        { model: db.Dataset, as: 'dataset' }
      ],
      order: [['createdAt', 'ASC']]
    });

    console.log(`\n📊 All contracts between ${tdcUser.name} and ${tdpUser.name}:`);
    allContracts.forEach((contract, index) => {
      console.log(`   ${index + 1}. Contract ${contract.contractId}`);
      console.log(`      Dataset: ${contract.dataset.name}`);
      console.log(`      Model: ${contract.modelId}`);
      console.log(`      Price: $${contract.price}`);
      console.log(`      Duration: ${contract.duration} days`);
      console.log(`      Status: ${contract.status}`);
      console.log(`      Created: ${contract.createdAt.toLocaleDateString()}`);
      console.log('');
    });

    // Create notifications for the contracts
    console.log('📧 Creating notifications...');
    for (const contract of createdContracts) {
      // Create notification for TDP
      await db.Notification.create({
        userId: tdpUser.id,
        type: 'CONTRACT_CREATED',
        title: 'New Contract Created',
        message: `A new contract has been created for your dataset "${contract.dataset.name}" by ${tdcUser.name}.`,
        isRead: false,
        metadata: {
          contractId: contract.contractId,
          datasetName: contract.dataset.name,
          tdcName: tdcUser.name,
          price: contract.price
        }
      });

      // Create notification for TDC
      await db.Notification.create({
        userId: tdcUser.id,
        type: 'CONTRACT_CREATED',
        title: 'Contract Created Successfully',
        message: `Your contract for dataset "${contract.dataset.name}" has been created successfully.`,
        isRead: false,
        metadata: {
          contractId: contract.contractId,
          datasetName: contract.dataset.name,
          tdpName: tdpUser.name,
          price: contract.price
        }
      });
    }

    console.log(`✅ Created ${createdContracts.length * 2} notifications (2 per contract)`);

  } catch (error) {
    console.error('❌ Error creating contracts:', error);
  } finally {
    await db.sequelize.close();
  }
}

// Run the script
createContractWithMultipleDatasets()
  .then(() => {
    console.log('🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }); 