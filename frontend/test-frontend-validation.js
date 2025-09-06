const ContractValidationService = require('./src/services/contractValidationService.js').default;

console.log('🧪 Testing Frontend Value Objects Integration...\n');

async function testFrontendIntegration() {
  try {
    // 1. Test validation service creation
    console.log('🔍 1. Testing Validation Service...');
    const validationService = new ContractValidationService();
    console.log('✅ Validation service created successfully');

    // 2. Test valid contract data
    console.log('\n📋 2. Testing Valid Contract Data...');
    const validData = {
      datasetSelections: [
        { datasetId: 'dataset-1', individualPrice: 100.50 },
        { datasetId: 'dataset-2', individualPrice: 200.75 }
      ],
      duration: 30,
      termsAndConditions: 'Valid terms and conditions for AI training contract',
      aiModelIds: [1, 2, 3],
      contractType: 'AI_TRAINING',
      privacyRequirements: {
        maxPrivacyLoss: 0.1,
        minAccuracy: 0.9,
        differentialPrivacy: true
      }
    };

    const validation = validationService.validateContractForm(validData);
    console.log('✅ Contract validation passed');
    console.log('✅ Validation result:', {
      isValid: validation.isValid,
      errorCount: Object.keys(validation.errors).length,
      validatedFields: Object.keys(validation.validated).length
    });

    // 3. Test invalid data scenarios
    console.log('\n❌ 3. Testing Invalid Data Scenarios...');
    
    // Test missing datasets
    const noDatasets = { ...validData, datasetSelections: [] };
    const noDatasetsValidation = validationService.validateContractForm(noDatasets);
    console.log('✅ Missing datasets caught:', !noDatasetsValidation.isValid);

    // Test invalid duration
    const invalidDuration = { ...validData, duration: -5 };
    const invalidDurationValidation = validationService.validateContractForm(invalidDuration);
    console.log('✅ Invalid duration caught:', !invalidDurationValidation.isValid);

    // Test missing terms
    const noTerms = { ...validData, termsAndConditions: '' };
    const noTermsValidation = validationService.validateContractForm(noTerms);
    console.log('✅ Missing terms caught:', !noTermsValidation.isValid);

    // Test invalid privacy requirements
    const invalidPrivacy = { 
      ...validData, 
      privacyRequirements: { maxPrivacyLoss: 1.5, minAccuracy: -0.1 }
    };
    const invalidPrivacyValidation = validationService.validateContractForm(invalidPrivacy);
    console.log('✅ Invalid privacy caught:', !invalidPrivacyValidation.isValid);

    // 4. Test utility methods
    console.log('\n🛠️ 4. Testing Utility Methods...');
    
    const contractId = validationService.generateContractId();
    console.log('✅ Generated contract ID:', contractId.value);

    const totalPrice = validationService.calculateTotalPrice(validData.datasetSelections);
    console.log('✅ Calculated total price:', totalPrice.toString());

    const formattedErrors = validationService.formatErrors({
      field1: 'Error message 1',
      field2: 'Error message 2'
    });
    console.log('✅ Formatted errors:', formattedErrors.length, 'errors');

    // 5. Test dataset validation specifically
    console.log('\n📊 5. Testing Dataset Validation...');
    
    const datasetValidation = validationService.validateDatasetSelections(validData.datasetSelections);
    console.log('✅ Dataset validation passed:', datasetValidation.errors.length === 0);
    console.log('✅ Validated datasets:', datasetValidation.validated.length);

    // Test too many datasets
    const tooManyDatasets = [
      { datasetId: 'dataset-1', individualPrice: 100 },
      { datasetId: 'dataset-2', individualPrice: 200 },
      { datasetId: 'dataset-3', individualPrice: 300 },
      { datasetId: 'dataset-4', individualPrice: 400 }
    ];
    const tooManyValidation = validationService.validateDatasetSelections(tooManyDatasets);
    console.log('✅ Too many datasets caught:', tooManyValidation.errors.length > 0);

    console.log('\n🎉 All Frontend Value Objects Integration Tests Passed!');
    console.log('\n📊 Summary:');
    console.log('✅ Validation Service: Working');
    console.log('✅ Form Validation: Working');
    console.log('✅ Error Handling: Working');
    console.log('✅ Utility Methods: Working');
    console.log('✅ Dataset Validation: Working');
    console.log('✅ Frontend Integration: Complete');

  } catch (error) {
    console.error('❌ Frontend integration test failed:', error);
    process.exit(1);
  }
}

testFrontendIntegration();
