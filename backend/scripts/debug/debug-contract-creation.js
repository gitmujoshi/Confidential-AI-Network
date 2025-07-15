const db = require('./models');
const { NotificationService } = require('./services');

async function debugContractCreation() {
  try {
    console.log('🔍 Starting contract creation debug...');
    
    // Test 1: Check if we can find the TDP user
    console.log('\n1. Testing TDP user lookup...');
    const tdpUser = await db.User.findOne({
      where: { id: 27, partyType: 'TDP' }
    });
    console.log('TDP User:', tdpUser ? 'Found' : 'Not found');
    if (tdpUser) {
      console.log('TDP User details:', {
        id: tdpUser.id,
        name: tdpUser.name,
        email: tdpUser.email,
        partyType: tdpUser.partyType
      });
    }
    
    // Test 2: Check if we can find the dataset
    console.log('\n2. Testing dataset lookup...');
    const dataset = await db.Dataset.findOne({
      where: { id: 27, ownerId: 27 }
    });
    console.log('Dataset:', dataset ? 'Found' : 'Not found');
    if (dataset) {
      console.log('Dataset details:', {
        id: dataset.id,
        datasetId: dataset.datasetId,
        name: dataset.name,
        ownerId: dataset.ownerId
      });
    }
    
    // Test 3: Check if we can find the TDC user
    console.log('\n3. Testing TDC user lookup...');
    const tdcUser = await db.User.findOne({
      where: { email: 'uitdc@example.com', partyType: 'TDC' }
    });
    console.log('TDC User:', tdcUser ? 'Found' : 'Not found');
    if (tdcUser) {
      console.log('TDC User details:', {
        id: tdcUser.id,
        name: tdcUser.name,
        email: tdcUser.email,
        partyType: tdcUser.partyType
      });
    }
    
    // Test 4: Try to create a contract
    console.log('\n4. Testing contract creation...');
    if (tdpUser && dataset && tdcUser) {
      try {
        const contract = await db.Contract.create({
          contractId: `CONTRACT-${Date.now()}`,
          blockchainContractId: null,
          tdpId: tdpUser.id,
          tdcId: tdcUser.id,
          ccrpId: null,
          datasetId: dataset.id,
          price: 50,
          duration: 30,
          termsAndConditions: 'Test Ricardian contract terms.',
          status: 'PENDING_CCRP_APPROVAL'
        });
        console.log('✅ Contract created successfully!');
        console.log('Contract ID:', contract.id);
        console.log('Contract ContractId:', contract.contractId);
        
        // Test 5: Try to find the contract with associations
        console.log('\n5. Testing contract with associations...');
        const fullContract = await db.Contract.findOne({
          where: { id: contract.id },
          include: [
            { model: db.User, as: 'tdp' },
            { model: db.User, as: 'tdc' },
            { model: db.User, as: 'ccrp' },
            { model: db.Dataset, as: 'dataset' }
          ]
        });
        console.log('✅ Contract with associations found!');
        console.log('Contract associations loaded successfully');
        
        // Test 6: Try notification service
        console.log('\n6. Testing notification service...');
        const notificationService = new NotificationService();
        await notificationService.notifyContractCreated(fullContract, tdpUser);
        console.log('✅ Notification sent successfully!');
        
        // Clean up - delete the test contract
        console.log('\n7. Cleaning up test contract...');
        await contract.destroy();
        console.log('✅ Test contract deleted');
        
      } catch (error) {
        console.error('❌ Error in contract creation:', error.message);
        console.error('Stack trace:', error.stack);
      }
    } else {
      console.log('❌ Missing required users or dataset for contract creation');
    }
    
  } catch (error) {
    console.error('❌ Debug script error:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await db.sequelize.close();
  }
}

debugContractCreation(); 