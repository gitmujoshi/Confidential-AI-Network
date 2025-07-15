const db = require('./models');

async function testContractCreation() {
  try {
    console.log('🧪 Testing contract creation...');
    
    // Get a TDC user
    const tdcUser = await db.User.findOne({ where: { partyType: 'TDC' } });
    if (!tdcUser) {
      console.log('❌ No TDC user found');
      return;
    }
    console.log('✅ TDC user found:', tdcUser.name);
    
    // Get a dataset
    const dataset = await db.Dataset.findOne({
      include: [{ model: db.User, as: 'owner' }]
    });
    if (!dataset) {
      console.log('❌ No dataset found');
      return;
    }
    console.log('✅ Dataset found:', dataset.name, 'by', dataset.owner.name);
    
    // Test contract creation
    const contractData = {
      datasetSelections: [{
        datasetId: dataset.datasetId,
        individualPrice: 100.00
      }],
      duration: 30,
      termsAndConditions: 'Test contract terms'
    };
    
    console.log('📝 Contract data:', contractData);
    
    // Simulate the contract creation logic
    const selectedDatasetIds = contractData.datasetSelections.map(selection => selection.datasetId);
    const datasets = await db.Dataset.findAll({
      where: { 
        datasetId: selectedDatasetIds,
        isActive: true
      },
      include: [
        { model: db.User, as: 'owner' }
      ]
    });
    
    console.log('✅ Found datasets:', datasets.length);
    
    const tdpUsers = await db.User.findAll({
      where: { 
        id: datasets.map(d => d.owner.id),
        partyType: 'TDP',
        isActive: true
      }
    });
    
    console.log('✅ Found TDP users:', tdpUsers.length);
    
    const totalPrice = contractData.datasetSelections.reduce((sum, selection) => sum + selection.individualPrice, 0);
    
    const contractDatasets = datasets.map((dataset, index) => ({
      datasetId: dataset.datasetId,
      tdpId: dataset.owner.id,
      datasetName: dataset.name,
      tdpName: dataset.owner.name,
      individualPrice: contractData.datasetSelections[index].individualPrice,
      paymentStatus: 'PENDING'
    }));
    
    const tdpSignatures = {};
    tdpUsers.forEach(tdp => {
      tdpSignatures[tdp.id] = {
        signed: false,
        signedAt: null,
        paymentAmount: contractData.datasetSelections.find(s => 
          datasets.find(d => d.owner.id === tdp.id)?.datasetId === s.datasetId
        )?.individualPrice || 0
      };
    });
    
    const tdpPayments = {};
    tdpUsers.forEach(tdp => {
      tdpPayments[tdp.id] = {
        amount: contractData.datasetSelections.find(s => 
          datasets.find(d => d.owner.id === tdp.id)?.datasetId === s.datasetId
        )?.individualPrice || 0,
        status: 'PENDING',
        paidAt: null
      };
    });
    
    const primaryDataset = datasets[0];
    const primaryTdp = primaryDataset.owner;
    
    console.log('📝 Creating contract with data:', {
      primaryDatasetId: primaryDataset.id,
      primaryTdpId: primaryTdp.id,
      datasetCount: datasets.length,
      tdpCount: tdpUsers.length,
      totalPrice: totalPrice
    });
    
    // Create contract
    const contract = await db.Contract.create({
      contractId: `TEST-CONTRACT-${Date.now()}`,
      blockchainContractId: null,
      tdpId: primaryTdp.id,
      tdcId: tdcUser.id,
      ccrpId: null,
      datasetId: primaryDataset.id,
      primaryDatasetId: primaryDataset.id,
      primaryTdpId: primaryTdp.id,
      contractDatasets: contractDatasets,
      datasetCount: datasets.length,
      tdpCount: tdpUsers.length,
      totalPrice: totalPrice,
      price: totalPrice,
      duration: parseInt(contractData.duration),
      termsAndConditions: contractData.termsAndConditions,
      status: 'PENDING_ALL_TDP_APPROVAL',
      multiTdpStatus: 'PENDING_ALL_TDP_APPROVAL',
      tdpSignatures: tdpSignatures,
      tdpPayments: tdpPayments,
      trainingParams: null
    });
    
    console.log('✅ Contract created successfully:', contract.contractId);
    
  } catch (error) {
    console.error('❌ Error creating contract:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      constraint: error.constraint,
      table: error.table,
      column: error.column
    });
  }
}

testContractCreation().then(() => {
  console.log('🏁 Test completed');
  process.exit(0);
}).catch(console.error); 