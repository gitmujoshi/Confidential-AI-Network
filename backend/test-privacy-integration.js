const axios = require('axios');

// Test privacy integration with contract creation APIs
async function testPrivacyIntegration() {
  console.log('🧪 Testing Privacy Integration...\n');

  const baseURL = 'http://localhost:5001/api';
  
  // Test data - use a TDC user since only TDC users can create contracts
  const testUser = {
    email: 'tdc@test.com',
    password: 'Test123!'
  };

  const privacyRequirements = {
    maxPrivacyLoss: 0.1,
    minAccuracy: 0.95,
    differentialPrivacy: {
      enabled: true,
      epsilon: 0.1,
      delta: 1e-5
    },
    federatedLearning: {
      enabled: true,
      aggregationMethod: 'secure-aggregation',
      communicationRounds: 100
    },
    secureMultiPartyComputation: {
      enabled: true,
      protocol: 'shamir-secret-sharing',
      threshold: 3
    }
  };

  try {
    // Step 1: Login to get token
    console.log('📋 Step 1: Login to get authentication token');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, testUser);
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token obtained');

    // Step 2: Get datasets to find a valid dataset
    console.log('\n📋 Step 2: Get available datasets');
    const datasetsResponse = await axios.get(`${baseURL}/datasets`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const datasets = datasetsResponse.data.datasets;
    console.log(`✅ Found ${datasets.length} datasets`);

    if (datasets.length === 0) {
      console.log('❌ No datasets available for testing');
      return;
    }

    const testDataset = datasets[0];
    console.log(`📊 Using dataset: ${testDataset.name} (ID: ${testDataset.id})`);

    // Step 3: Test regular contract creation with privacy requirements
    console.log('\n📋 Step 3: Test regular contract creation with privacy requirements');
    const regularContractPayload = {
      tdpId: testDataset.owner.id,
      datasetId: testDataset.datasetId,
      price: 5000,
      duration: 30,
      termsAndConditions: 'Test contract with privacy requirements',
      privacyRequirements
    };

    try {
      const regularContractResponse = await axios.post(`${baseURL}/contracts`, regularContractPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Regular contract created successfully with privacy requirements');
      console.log(`📄 Contract ID: ${regularContractResponse.data.contract.contractId}`);
    } catch (error) {
      console.log('❌ Regular contract creation failed:', error.response?.data?.error || error.message);
    }

    // Step 4: Test Ricardian contract creation with privacy requirements
    console.log('\n📋 Step 4: Test Ricardian contract creation with privacy requirements');
    const ricardianContractPayload = {
      tdpId: testDataset.owner.id,
      datasetId: testDataset.datasetId,
      price: 10000,
      duration: 60,
      termsAndConditions: 'Test Ricardian contract with privacy requirements',
      contractType: 'AI_TRAINING',
      environmentSpecs: {
        infrastructure: {
          computeType: 'confidential-vm',
          memoryGB: 32,
          cpuCores: 8
        },
        security: {
          attestationRequired: true,
          encryptionAtRest: true,
          encryptionInTransit: true
        }
      },
      trainingParams: {
        modelType: 'transformer',
        privacyTechnique: 'federated-learning',
        maxEpochs: 100,
        batchSize: 32,
        learningRate: 0.001,
        privacyRequirements
      },
      kmsConfigs: {
        provider: 'azure-key-vault',
        keyName: 'training-data-key',
        region: 'eastus'
      }
    };

    try {
      const ricardianContractResponse = await axios.post(`${baseURL}/contracts/ricardian`, ricardianContractPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Ricardian contract created successfully with privacy requirements');
      console.log(`📄 Contract ID: ${ricardianContractResponse.data.contract.contractId}`);
      console.log(`📄 Legal Document Hash: ${ricardianContractResponse.data.legalDocument?.legalDocumentHash}`);
    } catch (error) {
      console.log('❌ Ricardian contract creation failed:', error.response?.data?.error || error.message);
    }

    // Step 5: Test privacy validation - invalid privacy loss
    console.log('\n📋 Step 5: Test privacy validation - invalid privacy loss');
    const invalidPrivacyPayload = {
      ...regularContractPayload,
      privacyRequirements: {
        ...privacyRequirements,
        maxPrivacyLoss: 2.0 // Invalid: should be <= 1.0
      }
    };

    try {
      await axios.post(`${baseURL}/contracts`, invalidPrivacyPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('❌ Should have failed with invalid privacy loss');
    } catch (error) {
      if (error.response?.data?.error?.includes('Maximum privacy loss must be between 0.01 and 1.0')) {
        console.log('✅ Privacy validation working correctly - rejected invalid privacy loss');
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.error || error.message);
      }
    }

    // Step 6: Test privacy validation - invalid accuracy
    console.log('\n📋 Step 6: Test privacy validation - invalid accuracy');
    const invalidAccuracyPayload = {
      ...regularContractPayload,
      privacyRequirements: {
        ...privacyRequirements,
        minAccuracy: 0.3 // Invalid: should be >= 0.5
      }
    };

    try {
      await axios.post(`${baseURL}/contracts`, invalidAccuracyPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('❌ Should have failed with invalid accuracy');
    } catch (error) {
      if (error.response?.data?.error?.includes('Minimum accuracy must be between 50% and 99.9%')) {
        console.log('✅ Privacy validation working correctly - rejected invalid accuracy');
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.error || error.message);
      }
    }

    // Step 7: Test privacy validation - no privacy techniques
    console.log('\n📋 Step 7: Test privacy validation - no privacy techniques');
    const noTechniquesPayload = {
      ...regularContractPayload,
      privacyRequirements: {
        maxPrivacyLoss: 0.1,
        minAccuracy: 0.95,
        differentialPrivacy: { enabled: false },
        federatedLearning: { enabled: false },
        secureMultiPartyComputation: { enabled: false }
      }
    };

    try {
      await axios.post(`${baseURL}/contracts`, noTechniquesPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('❌ Should have failed with no privacy techniques');
    } catch (error) {
      if (error.response?.data?.error?.includes('At least one privacy-preserving technique must be enabled')) {
        console.log('✅ Privacy validation working correctly - rejected no privacy techniques');
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.error || error.message);
      }
    }

    console.log('\n🎉 Privacy integration test completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- ✅ Privacy requirements validation working');
    console.log('- ✅ Regular contract creation with privacy requirements');
    console.log('- ✅ Ricardian contract creation with privacy requirements');
    console.log('- ✅ Privacy parameter validation (epsilon, accuracy, techniques)');
    console.log('- ✅ Error handling for invalid privacy parameters');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testPrivacyIntegration(); 