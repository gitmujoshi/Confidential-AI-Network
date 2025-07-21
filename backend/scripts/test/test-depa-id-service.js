/**
 * Test Script: DEPA ID Service
 * 
 * This script tests the DEPA ID service functionality including:
 * - DEPA ID generation for all entity types
 * - DEPA ID validation
 * - Entity type extraction
 * - GUID extraction
 * - Error handling
 * 
 * Run this script to validate DEPA ID service before integration.
 */

const DEPAIdService = require('../../services/depaIdService');

async function testDEPAIdService() {
  console.log('🧪 Testing DEPA ID Service...\n');

  const depaIdService = new DEPAIdService();
  let testResults = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Generate DEPA IDs for all entity types
  console.log('📝 Test 1: Generate DEPA IDs for all entity types');
  const entityTypes = depaIdService.getValidEntityTypes();
  
  for (const entityType of entityTypes) {
    try {
      const depaId = depaIdService.generateDEPAId(entityType);
      const isValid = depaIdService.validateDEPAId(depaId);
      const extractedType = depaIdService.getEntityType(depaId);
      
      if (isValid && extractedType === entityType) {
        console.log(`✅ ${entityType}: ${depaId}`);
        testResults.passed++;
        testResults.tests.push({
          test: `Generate ${entityType} DEPA ID`,
          status: 'PASSED',
          result: depaId
        });
      } else {
        console.log(`❌ ${entityType}: Invalid or incorrect type`);
        testResults.failed++;
        testResults.tests.push({
          test: `Generate ${entityType} DEPA ID`,
          status: 'FAILED',
          error: 'Invalid or incorrect type'
        });
      }
    } catch (error) {
      console.log(`❌ ${entityType}: ${error.message}`);
      testResults.failed++;
      testResults.tests.push({
        test: `Generate ${entityType} DEPA ID`,
        status: 'FAILED',
        error: error.message
      });
    }
  }

  // Test 2: Validate DEPA ID format
  console.log('\n📝 Test 2: Validate DEPA ID format');
  const testDEPAIds = [
    'TDC-8f4e2a1b-3c4d-5e6f-7a8b-9c0d1e2f3a4b',
    'TDP-1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
    'CCRP-2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e',
    'CONTRACT-3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f'
  ];

  const invalidDEPAIds = [
    'INVALID-format',
    'TDC-invalid-guid',
    'WRONG-8f4e2a1b-3c4d-5e6f-7a8b-9c0d1e2f3a4b',
    '',
    null,
    undefined
  ];

  // Test valid DEPA IDs
  for (const depaId of testDEPAIds) {
    const isValid = depaIdService.validateDEPAId(depaId);
    if (isValid) {
      console.log(`✅ Valid: ${depaId}`);
      testResults.passed++;
      testResults.tests.push({
        test: `Validate valid DEPA ID: ${depaId}`,
        status: 'PASSED'
      });
    } else {
      console.log(`❌ Invalid: ${depaId}`);
      testResults.failed++;
      testResults.tests.push({
        test: `Validate valid DEPA ID: ${depaId}`,
        status: 'FAILED',
        error: 'Should be valid'
      });
    }
  }

  // Test invalid DEPA IDs
  for (const depaId of invalidDEPAIds) {
    const isValid = depaIdService.validateDEPAId(depaId);
    if (!isValid) {
      console.log(`✅ Correctly rejected: ${depaId}`);
      testResults.passed++;
      testResults.tests.push({
        test: `Validate invalid DEPA ID: ${depaId}`,
        status: 'PASSED'
      });
    } else {
      console.log(`❌ Should be invalid: ${depaId}`);
      testResults.failed++;
      testResults.tests.push({
        test: `Validate invalid DEPA ID: ${depaId}`,
        status: 'FAILED',
        error: 'Should be invalid'
      });
    }
  }

  // Test 3: Extract entity type from DEPA ID
  console.log('\n📝 Test 3: Extract entity type from DEPA ID');
  for (const depaId of testDEPAIds) {
    const entityType = depaIdService.getEntityType(depaId);
    const expectedType = depaId.split('-')[0];
    
    if (entityType === expectedType) {
      console.log(`✅ ${depaId} -> ${entityType}`);
      testResults.passed++;
      testResults.tests.push({
        test: `Extract entity type from: ${depaId}`,
        status: 'PASSED',
        result: entityType
      });
    } else {
      console.log(`❌ ${depaId} -> Expected: ${expectedType}, Got: ${entityType}`);
      testResults.failed++;
      testResults.tests.push({
        test: `Extract entity type from: ${depaId}`,
        status: 'FAILED',
        error: `Expected: ${expectedType}, Got: ${entityType}`
      });
    }
  }

  // Test 4: Extract GUID from DEPA ID
  console.log('\n📝 Test 4: Extract GUID from DEPA ID');
  for (const depaId of testDEPAIds) {
    const guid = depaIdService.getGUID(depaId);
    const expectedGuid = depaId.split('-').slice(1).join('-');
    
    if (guid === expectedGuid) {
      console.log(`✅ ${depaId} -> ${guid}`);
      testResults.passed++;
      testResults.tests.push({
        test: `Extract GUID from: ${depaId}`,
        status: 'PASSED',
        result: guid
      });
    } else {
      console.log(`❌ ${depaId} -> Expected: ${expectedGuid}, Got: ${guid}`);
      testResults.failed++;
      testResults.tests.push({
        test: `Extract GUID from: ${depaId}`,
        status: 'FAILED',
        error: `Expected: ${expectedGuid}, Got: ${guid}`
      });
    }
  }

  // Test 5: Check entity type matching
  console.log('\n📝 Test 5: Check entity type matching');
  const testCases = [
    { depaId: 'TDC-8f4e2a1b-3c4d-5e6f-7a8b-9c0d1e2f3a4b', expectedType: 'TDC', shouldMatch: true },
    { depaId: 'TDP-1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d', expectedType: 'TDP', shouldMatch: true },
    { depaId: 'CCRP-2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e', expectedType: 'CCRP', shouldMatch: true },
    { depaId: 'CONTRACT-3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f', expectedType: 'CONTRACT', shouldMatch: true },
    { depaId: 'TDC-8f4e2a1b-3c4d-5e6f-7a8b-9c0d1e2f3a4b', expectedType: 'TDP', shouldMatch: false },
    { depaId: 'TDP-1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d', expectedType: 'CCRP', shouldMatch: false }
  ];

  for (const testCase of testCases) {
    const matches = depaIdService.matchesEntityType(testCase.depaId, testCase.expectedType);
    
    if (matches === testCase.shouldMatch) {
      console.log(`✅ ${testCase.depaId} matches ${testCase.expectedType}: ${matches}`);
      testResults.passed++;
      testResults.tests.push({
        test: `Check ${testCase.depaId} matches ${testCase.expectedType}`,
        status: 'PASSED',
        result: matches
      });
    } else {
      console.log(`❌ ${testCase.depaId} matches ${testCase.expectedType}: Expected ${testCase.shouldMatch}, Got ${matches}`);
      testResults.failed++;
      testResults.tests.push({
        test: `Check ${testCase.depaId} matches ${testCase.expectedType}`,
        status: 'FAILED',
        error: `Expected ${testCase.shouldMatch}, Got ${matches}`
      });
    }
  }

  // Test 6: Generate user DEPA IDs based on party type
  console.log('\n📝 Test 6: Generate user DEPA IDs based on party type');
  const partyTypes = ['TDC', 'TDP', 'CCRP', 'AppAdmin'];
  
  for (const partyType of partyTypes) {
    try {
      const depaId = depaIdService.generateUserDEPAId(partyType);
      const isValid = depaIdService.validateDEPAId(depaId);
      const entityType = depaIdService.getEntityType(depaId);
      
      if (isValid && entityType) {
        console.log(`✅ ${partyType} -> ${depaId} (${entityType})`);
        testResults.passed++;
        testResults.tests.push({
          test: `Generate user DEPA ID for ${partyType}`,
          status: 'PASSED',
          result: depaId
        });
      } else {
        console.log(`❌ ${partyType} -> Invalid DEPA ID`);
        testResults.failed++;
        testResults.tests.push({
          test: `Generate user DEPA ID for ${partyType}`,
          status: 'FAILED',
          error: 'Invalid DEPA ID generated'
        });
      }
    } catch (error) {
      console.log(`❌ ${partyType} -> ${error.message}`);
      testResults.failed++;
      testResults.tests.push({
        test: `Generate user DEPA ID for ${partyType}`,
        status: 'FAILED',
        error: error.message
      });
    }
  }

  // Test 7: Generate contract DEPA IDs
  console.log('\n📝 Test 7: Generate contract DEPA IDs');
  for (let i = 0; i < 3; i++) {
    try {
      const depaId = depaIdService.generateContractDEPAId();
      const isValid = depaIdService.validateDEPAId(depaId);
      const entityType = depaIdService.getEntityType(depaId);
      
      if (isValid && entityType === 'CONTRACT') {
        console.log(`✅ Contract ${i + 1}: ${depaId}`);
        testResults.passed++;
        testResults.tests.push({
          test: `Generate contract DEPA ID ${i + 1}`,
          status: 'PASSED',
          result: depaId
        });
      } else {
        console.log(`❌ Contract ${i + 1}: Invalid DEPA ID`);
        testResults.failed++;
        testResults.tests.push({
          test: `Generate contract DEPA ID ${i + 1}`,
          status: 'FAILED',
          error: 'Invalid DEPA ID generated'
        });
      }
    } catch (error) {
      console.log(`❌ Contract ${i + 1}: ${error.message}`);
      testResults.failed++;
      testResults.tests.push({
        test: `Generate contract DEPA ID ${i + 1}`,
        status: 'FAILED',
        error: error.message
      });
    }
  }

  // Test 8: Error handling for invalid entity types
  console.log('\n📝 Test 8: Error handling for invalid entity types');
  const invalidEntityTypes = ['INVALID', 'WRONG', 'TEST', ''];
  
  for (const invalidType of invalidEntityTypes) {
    try {
      depaIdService.generateDEPAId(invalidType);
      console.log(`❌ Should throw error for: ${invalidType}`);
      testResults.failed++;
      testResults.tests.push({
        test: `Generate DEPA ID for invalid type: ${invalidType}`,
        status: 'FAILED',
        error: 'Should throw error'
      });
    } catch (error) {
      console.log(`✅ Correctly rejected: ${invalidType} -> ${error.message}`);
      testResults.passed++;
      testResults.tests.push({
        test: `Generate DEPA ID for invalid type: ${invalidType}`,
        status: 'PASSED',
        result: error.message
      });
    }
  }

  // Test 9: Error handling for invalid party types
  console.log('\n📝 Test 9: Error handling for invalid party types');
  const invalidPartyTypes = ['INVALID', 'WRONG', 'TEST', ''];
  
  for (const invalidType of invalidPartyTypes) {
    try {
      depaIdService.generateUserDEPAId(invalidType);
      console.log(`❌ Should throw error for: ${invalidType}`);
      testResults.failed++;
      testResults.tests.push({
        test: `Generate user DEPA ID for invalid party type: ${invalidType}`,
        status: 'FAILED',
        error: 'Should throw error'
      });
    } catch (error) {
      console.log(`✅ Correctly rejected: ${invalidType} -> ${error.message}`);
      testResults.passed++;
      testResults.tests.push({
        test: `Generate user DEPA ID for invalid party type: ${invalidType}`,
        status: 'PASSED',
        result: error.message
      });
    }
  }

  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📋 Total: ${testResults.passed + testResults.failed}`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 All tests passed! DEPA ID service is ready for integration.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }

  return testResults;
}

// Run tests if this script is executed directly
if (require.main === module) {
  testDEPAIdService()
    .then((results) => {
      if (results.failed === 0) {
        console.log('\n✅ DEPA ID service test completed successfully');
        process.exit(0);
      } else {
        console.log('\n❌ DEPA ID service test completed with failures');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testDEPAIdService }; 