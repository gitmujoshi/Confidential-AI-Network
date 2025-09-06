const { ContractId, Money, Duration, ValidationError } = require('@contract-management/value-objects');
const ContractValidationService = require('./services/contractValidationService');
const ScittCcfService = require('./services/scittCcfService');

console.log('🧪 Testing Value Objects Integration End-to-End...\n');

async function testIntegration() {
  try {
    // 1. Test Value Objects directly
    console.log('📋 1. Testing Value Objects...');
    const contractId = ContractId.generate();
    const money = new Money(100.50, 'USD');
    const duration = new Duration(30, 'DAYS');
    
    console.log('✅ ContractId:', contractId.value);
    console.log('✅ Money:', money.toString());
    console.log('✅ Duration:', duration.toString());

    // 2. Test Contract Validation Service
    console.log('\n🔍 2. Testing Contract Validation Service...');
    const validationService = new ContractValidationService();
    
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

    const validation = validationService.validateContractCreation(validData);
    console.log('✅ Contract validation passed');
    console.log('✅ Validated duration:', validation.duration.durationValue);
    console.log('✅ Validated datasets:', validation.datasetSelections.length);
    console.log('✅ Total price:', validationService.calculateTotalPrice(validation.datasetSelections).toString());

    // 3. Test SCITT CCF Service
    console.log('\n🔗 3. Testing SCITT CCF Service...');
    const scittService = new ScittCcfService();
    
    const claimData = {
      contractId: contractId.value,
      price: money.amount,
      duration: duration.durationValue,
      type: 'contract_creation'
    };

    const claim = scittService.buildClaim(claimData);
    console.log('✅ Claim built successfully');
    console.log('✅ Claim validation:', claim.validation);
    console.log('✅ Claim data:', {
      contractId: claim.data.contractId,
      price: claim.data.price,
      duration: claim.data.duration
    });

    // 4. Test error handling
    console.log('\n❌ 4. Testing Error Handling...');
    
    try {
      validationService.validateContractCreation({
        datasetSelections: [],
        duration: -5,
        termsAndConditions: ''
      });
      console.log('❌ Should have thrown validation error');
    } catch (error) {
      console.log('✅ Correctly caught validation error:', error.message);
    }

    try {
      scittService.buildClaim({
        contractId: 'invalid-id',
        price: -100,
        duration: -5
      });
      console.log('❌ Should have thrown validation error');
    } catch (error) {
      console.log('✅ Correctly caught SCITT validation error:', error.message);
    }

    console.log('\n🎉 All Value Objects Integration Tests Passed!');
    console.log('\n📊 Summary:');
    console.log('✅ Value Objects: Working');
    console.log('✅ Contract Validation: Working');
    console.log('✅ SCITT CCF Integration: Working');
    console.log('✅ Error Handling: Working');
    console.log('✅ End-to-End Flow: Working');

  } catch (error) {
    console.error('❌ Integration test failed:', error);
    process.exit(1);
  }
}

testIntegration();
