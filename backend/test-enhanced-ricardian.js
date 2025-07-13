const fs = require('fs');
const path = require('path');

// Test the enhanced Ricardian contract template
function testEnhancedRicardianTemplate() {
  console.log('🧪 Testing Enhanced Ricardian Contract Template...\n');

  try {
    // Load the enhanced template
    const templatePath = path.join(__dirname, 'assets', 'ai_training_ricardian_contract_enhanced.json');
    const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

    console.log('✅ Template loaded successfully');

    // Test 1: Validate JSON structure
    console.log('\n📋 Test 1: JSON Structure Validation');
    if (template.ricardianContract && template.ricardianContract.metadata) {
      console.log('✅ Basic structure is valid');
    } else {
      throw new Error('Invalid template structure');
    }

    // Test 2: Check version update
    console.log('\n📋 Test 2: Version Check');
    if (template.ricardianContract.metadata.version === '3.0.0') {
      console.log('✅ Version updated to 3.0.0');
    } else {
      throw new Error('Version not updated');
    }

    // Test 3: Validate privacy-preserving techniques
    console.log('\n📋 Test 3: Privacy-Preserving Techniques');
    const privacyTechniques = template.ricardianContract.trainingEnvironment.trainingSpecifications.privacyPreservingTechniques;
    if (privacyTechniques.federatedLearning && privacyTechniques.differentialPrivacy) {
      console.log('✅ Privacy-preserving techniques included');
    } else {
      throw new Error('Privacy-preserving techniques missing');
    }

    // Test 4: Check enhanced compliance
    console.log('\n📋 Test 4: Enhanced Compliance');
    const compliance = template.ricardianContract.compliance.regulatoryCompliance;
    if (compliance.dpdp2023 && compliance.gdpr && compliance.hipaa) {
      console.log('✅ Enhanced compliance framework included');
    } else {
      throw new Error('Enhanced compliance missing');
    }

    // Test 5: Validate privacy infrastructure
    console.log('\n📋 Test 5: Privacy Infrastructure');
    const privacyInfra = template.ricardianContract.privacyInfrastructure;
    if (privacyInfra.secureEnclaves && privacyInfra.zeroKnowledgeProofs) {
      console.log('✅ Privacy infrastructure included');
    } else {
      throw new Error('Privacy infrastructure missing');
    }

    // Test 6: Check privacy monitoring
    console.log('\n📋 Test 6: Privacy Monitoring');
    const privacyMonitoring = template.ricardianContract.privacyMonitoring;
    if (privacyMonitoring.privacyMetrics && privacyMonitoring.privacyIncidentResponse) {
      console.log('✅ Privacy monitoring included');
    } else {
      throw new Error('Privacy monitoring missing');
    }

    // Test 7: Validate enhanced smart contract functions
    console.log('\n📋 Test 7: Enhanced Smart Contract Functions');
    const functions = template.ricardianContract.smartContract.functions;
    if (functions.privacyAudit && functions.privacyIncidentResponse) {
      console.log('✅ Enhanced smart contract functions included');
    } else {
      throw new Error('Enhanced smart contract functions missing');
    }

    // Test 8: Check data privacy controls
    console.log('\n📋 Test 8: Data Privacy Controls');
    const dataPrivacy = template.ricardianContract.dataPrivacyControls;
    if (dataPrivacy.dataMinimization && dataPrivacy.consentManagement) {
      console.log('✅ Data privacy controls included');
    } else {
      throw new Error('Data privacy controls missing');
    }

    // Test 9: Validate enhanced legal terms
    console.log('\n📋 Test 9: Enhanced Legal Terms');
    const terms = template.ricardianContract.legalDocument.terms;
    const privacyTerm = terms.find(term => term.section === '9.0');
    if (privacyTerm && privacyTerm.title.includes('Privacy-Preserving')) {
      console.log('✅ Enhanced legal terms included');
    } else {
      throw new Error('Enhanced legal terms missing');
    }

    // Test 10: Check backward compatibility
    console.log('\n📋 Test 10: Backward Compatibility');
    const requiredFields = [
      'ricardianContract',
      'legalDocumentHash',
      'ricardianSignature',
      'smartContractAddress',
      'status'
    ];
    
    let allFieldsPresent = true;
    requiredFields.forEach(field => {
      if (!(field in template)) {
        console.log(`❌ Missing required field: ${field}`);
        allFieldsPresent = false;
      }
    });

    if (allFieldsPresent) {
      console.log('✅ Backward compatibility maintained');
    } else {
      throw new Error('Backward compatibility broken');
    }

    console.log('\n🎉 All tests passed! Enhanced template is valid and ready for use.');
    console.log('\n📊 Summary of Enhancements:');
    console.log('- Privacy-preserving techniques: Federated Learning, Differential Privacy, SMPC');
    console.log('- Enhanced compliance: DPDP 2023, GDPR, HIPAA with privacy controls');
    console.log('- Privacy infrastructure: Secure Enclaves, Zero-Knowledge Proofs');
    console.log('- Privacy monitoring: Budget tracking, leakage detection, incident response');
    console.log('- Enhanced smart contracts: Privacy audit and incident response functions');
    console.log('- Data privacy controls: Minimization, consent management, classification');
    console.log('- Enhanced legal terms: Comprehensive privacy-preserving training section');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testEnhancedRicardianTemplate(); 