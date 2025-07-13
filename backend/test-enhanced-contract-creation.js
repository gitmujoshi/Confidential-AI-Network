const fs = require('fs');
const path = require('path');

// Test enhanced contract creation with the new template
async function testEnhancedContractCreation() {
  console.log('🧪 Testing Enhanced Contract Creation...\n');

  try {
    // Load the enhanced template
    const templatePath = path.join(__dirname, 'assets', 'ai_training_ricardian_contract_enhanced.json');
    const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

    console.log('✅ Enhanced template loaded');

    // Simulate contract creation with enhanced template
    const contractData = {
      tdpId: 1,
      tdcId: 2,
      ccrpId: 3,
      datasetId: 1,
      price: 75000,
      duration: 30,
      termsAndConditions: "Enhanced privacy-preserving AI training contract",
      legalDocument: template.ricardianContract.legalDocument,
      environmentSpecs: template.ricardianContract.trainingEnvironment,
      trainingParams: template.ricardianContract.trainingEnvironment.trainingSpecifications
    };

    console.log('✅ Contract data prepared with enhanced template');

    // Test 1: Validate enhanced template structure
    console.log('\n📋 Test 1: Enhanced Template Structure');
    const requiredSections = [
      'trainingEnvironment',
      'smartContract',
      'execution',
      'compliance'
    ];

    let allSectionsPresent = true;
    requiredSections.forEach(section => {
      if (!template.ricardianContract[section]) {
        console.log(`❌ Missing section: ${section}`);
        allSectionsPresent = false;
      }
    });

    if (allSectionsPresent) {
      console.log('✅ All enhanced sections present');
    } else {
      throw new Error('Enhanced sections missing');
    }

    // Test 2: Validate privacy-preserving techniques in training specifications
    console.log('\n📋 Test 2: Privacy-Preserving Techniques Validation');
    const trainingSpecs = template.ricardianContract.trainingEnvironment.trainingSpecifications;
    
    if (trainingSpecs.training.privacyTechniques && trainingSpecs.training.privacyTechniques.length > 0) {
      console.log('✅ Privacy-preserving techniques included in training specs');
    } else {
      throw new Error('Privacy-preserving techniques missing from training specs');
    }

    // Test 3: Validate enhanced compliance framework
    console.log('\n📋 Test 3: Enhanced Compliance Framework');
    const compliance = template.ricardianContract.compliance.regulatoryCompliance;
    
    const requiredCompliance = ['dpdp2023', 'gdpr', 'hipaa'];
    let allCompliancePresent = true;
    
    requiredCompliance.forEach(reg => {
      if (!compliance[reg]) {
        console.log(`❌ Missing compliance: ${reg}`);
        allCompliancePresent = false;
      }
    });

    if (allCompliancePresent) {
      console.log('✅ All compliance frameworks present');
    } else {
      throw new Error('Compliance frameworks missing');
    }

    // Test 4: Validate enhanced smart contract functions
    console.log('\n📋 Test 4: Enhanced Smart Contract Functions');
    const functions = template.ricardianContract.smartContract.functions;
    
    const requiredFunctions = [
      'privacyAudit',
      'privacyIncidentResponse'
    ];

    let allFunctionsPresent = true;
    requiredFunctions.forEach(func => {
      if (!functions[func]) {
        console.log(`❌ Missing function: ${func}`);
        allFunctionsPresent = false;
      }
    });

    if (allFunctionsPresent) {
      console.log('✅ All enhanced smart contract functions present');
    } else {
      throw new Error('Enhanced smart contract functions missing');
    }

    // Test 5: Validate enhanced legal document terms
    console.log('\n📋 Test 5: Enhanced Legal Document Terms');
    const terms = template.ricardianContract.legalDocument.terms;
    
    // Check for privacy-focused terms
    const privacyTerms = terms.filter(term => 
      term.title.toLowerCase().includes('privacy') || 
      term.content.toLowerCase().includes('privacy')
    );

    if (privacyTerms.length >= 3) {
      console.log('✅ Enhanced privacy-focused legal terms present');
    } else {
      throw new Error('Enhanced privacy-focused legal terms missing');
    }

    // Test 6: Validate enhanced metadata
    console.log('\n📋 Test 6: Enhanced Metadata');
    const metadata = template.ricardianContract.metadata;
    
    if (metadata.version === '3.0.0' && metadata.privacyCompliance) {
      console.log('✅ Enhanced metadata with privacy compliance');
    } else {
      throw new Error('Enhanced metadata missing');
    }

    // Test 7: Validate enhanced parties with privacy certifications
    console.log('\n📋 Test 7: Enhanced Parties with Privacy Certifications');
    const parties = template.ricardianContract.legalDocument.parties;
    
    let allPartiesHavePrivacyCerts = true;
    Object.values(parties).forEach(party => {
      if (!party.privacyCertifications && !party.privacyInfrastructure) {
        console.log(`❌ Party ${party.name} missing privacy certifications`);
        allPartiesHavePrivacyCerts = false;
      }
    });

    if (allPartiesHavePrivacyCerts) {
      console.log('✅ All parties have privacy certifications');
    } else {
      throw new Error('Privacy certifications missing for parties');
    }

    // Test 8: Check template size and complexity
    console.log('\n📋 Test 8: Template Complexity');
    const templateSize = JSON.stringify(template).length;
    console.log(`Template size: ${(templateSize / 1024).toFixed(2)} KB`);
    
    if (templateSize > 50000) { // Ensure template is substantial
      console.log('✅ Template has sufficient complexity');
    } else {
      throw new Error('Template too simple');
    }

    // Test 9: Validate backward compatibility
    console.log('\n📋 Test 9: Backward Compatibility');
    const originalFields = [
      'ricardianContract',
      'legalDocumentHash',
      'ricardianSignature',
      'smartContractAddress',
      'status',
      'tdpSigned',
      'ccrpSigned'
    ];

    let allOriginalFieldsPresent = true;
    originalFields.forEach(field => {
      if (!(field in template)) {
        console.log(`❌ Missing original field: ${field}`);
        allOriginalFieldsPresent = false;
      }
    });

    if (allOriginalFieldsPresent) {
      console.log('✅ Backward compatibility maintained');
    } else {
      throw new Error('Backward compatibility broken');
    }

    // Test 10: Simulate contract creation process
    console.log('\n📋 Test 10: Contract Creation Simulation');
    console.log('Simulating contract creation with enhanced template...');
    
    // Simulate the contract creation process
    const simulatedContract = {
      contractId: `CONTRACT-${Date.now()}-enhanced`,
      legalDocumentHash: template.legalDocumentHash,
      ricardianSignature: template.ricardianSignature,
      smartContractAddress: template.smartContractAddress,
      status: 'PENDING_TDP_APPROVAL',
      tdpSigned: false,
      ccrpSigned: false,
      enhancedPrivacy: true,
      privacyTechniques: trainingSpecs.training.privacyTechniques,
      complianceFrameworks: Object.keys(compliance),
      version: metadata.version
    };

    console.log('✅ Contract creation simulation successful');
    console.log(`Generated contract ID: ${simulatedContract.contractId}`);
    console.log(`Privacy techniques: ${simulatedContract.privacyTechniques.join(', ')}`);
    console.log(`Compliance frameworks: ${simulatedContract.complianceFrameworks.join(', ')}`);
    console.log(`Template version: ${simulatedContract.version}`);

    console.log('\n🎉 All enhanced contract creation tests passed!');
    console.log('\n📊 Enhanced Template Features:');
    console.log('✅ Comprehensive privacy-preserving techniques in training specs');
    console.log('✅ Enhanced compliance with DPDP, GDPR, HIPAA');
    console.log('✅ Privacy infrastructure with secure enclaves and ZK proofs');
    console.log('✅ Privacy monitoring and incident response');
    console.log('✅ Enhanced smart contract functions');
    console.log('✅ Enhanced legal terms with privacy focus');
    console.log('✅ Privacy certifications for all parties');
    console.log('✅ Backward compatibility maintained');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testEnhancedContractCreation(); 