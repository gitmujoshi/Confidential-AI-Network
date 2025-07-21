/**
 * Integration Test: DEPA ID Service with Database Models
 * 
 * This script tests the integration between the DEPA ID service and the database models.
 * It validates that DEPA IDs are properly generated and stored in the database.
 * 
 * Run this script after updating the models to ensure proper integration.
 */

const DEPAIdService = require('../../services/depaIdService');
const db = require('../../models');

async function testDEPAIdIntegration() {
  console.log('🧪 Testing DEPA ID Integration with Database Models...\n');

  const depaIdService = new DEPAIdService();
  let testResults = {
    passed: 0,
    failed: 0,
    tests: []
  };

  try {
    // Test 1: Check if models have DEPA ID fields
    console.log('📝 Test 1: Check if models have DEPA ID fields');
    
    const userAttributes = Object.keys(db.User.rawAttributes);
    const contractAttributes = Object.keys(db.Contract.rawAttributes);
    
    if (userAttributes.includes('depaId')) {
      console.log('✅ User model has depaId field');
      testResults.passed++;
      testResults.tests.push({
        test: 'User model has depaId field',
        status: 'PASSED'
      });
    } else {
      console.log('❌ User model missing depaId field');
      testResults.failed++;
      testResults.tests.push({
        test: 'User model has depaId field',
        status: 'FAILED',
        error: 'depaId field not found'
      });
    }

    if (contractAttributes.includes('depaId')) {
      console.log('✅ Contract model has depaId field');
      testResults.passed++;
      testResults.tests.push({
        test: 'Contract model has depaId field',
        status: 'PASSED'
      });
    } else {
      console.log('❌ Contract model missing depaId field');
      testResults.failed++;
      testResults.tests.push({
        test: 'Contract model has depaId field',
        status: 'FAILED',
        error: 'depaId field not found'
      });
    }

    // Test 2: Check DEPA ID field configuration
    console.log('\n📝 Test 2: Check DEPA ID field configuration');
    
    const userDepaIdField = db.User.rawAttributes.depaId;
    const contractDepaIdField = db.Contract.rawAttributes.depaId;
    
    if (userDepaIdField && userDepaIdField.type.key === 'STRING') {
      console.log('✅ User depaId field has correct type');
      testResults.passed++;
      testResults.tests.push({
        test: 'User depaId field type',
        status: 'PASSED',
        result: 'STRING'
      });
    } else {
      console.log('❌ User depaId field has incorrect type');
      testResults.failed++;
      testResults.tests.push({
        test: 'User depaId field type',
        status: 'FAILED',
        error: 'Incorrect type'
      });
    }

    if (contractDepaIdField && contractDepaIdField.type.key === 'STRING') {
      console.log('✅ Contract depaId field has correct type');
      testResults.passed++;
      testResults.tests.push({
        test: 'Contract depaId field type',
        status: 'PASSED',
        result: 'STRING'
      });
    } else {
      console.log('❌ Contract depaId field has incorrect type');
      testResults.failed++;
      testResults.tests.push({
        test: 'Contract depaId field type',
        status: 'FAILED',
        error: 'Incorrect type'
      });
    }

    // Test 3: Check unique constraints
    console.log('\n📝 Test 3: Check unique constraints');
    
    if (userDepaIdField && userDepaIdField.unique) {
      console.log('✅ User depaId field has unique constraint');
      testResults.passed++;
      testResults.tests.push({
        test: 'User depaId unique constraint',
        status: 'PASSED'
      });
    } else {
      console.log('❌ User depaId field missing unique constraint');
      testResults.failed++;
      testResults.tests.push({
        test: 'User depaId unique constraint',
        status: 'FAILED',
        error: 'Missing unique constraint'
      });
    }

    if (contractDepaIdField && contractDepaIdField.unique) {
      console.log('✅ Contract depaId field has unique constraint');
      testResults.passed++;
      testResults.tests.push({
        test: 'Contract depaId unique constraint',
        status: 'PASSED'
      });
    } else {
      console.log('❌ Contract depaId field missing unique constraint');
      testResults.failed++;
      testResults.tests.push({
        test: 'Contract depaId unique constraint',
        status: 'FAILED',
        error: 'Missing unique constraint'
      });
    }

    // Test 4: Check indexes
    console.log('\n📝 Test 4: Check DEPA ID indexes');
    
    const userIndexes = db.User.options.indexes || [];
    const contractIndexes = db.Contract.options.indexes || [];
    
    const userDepaIdIndex = userIndexes.find(index => 
      index.fields && index.fields.includes('depaId')
    );
    
    const contractDepaIdIndex = contractIndexes.find(index => 
      index.fields && index.fields.includes('depaId')
    );
    
    if (userDepaIdIndex) {
      console.log('✅ User model has depaId index');
      testResults.passed++;
      testResults.tests.push({
        test: 'User depaId index',
        status: 'PASSED'
      });
    } else {
      console.log('❌ User model missing depaId index');
      testResults.failed++;
      testResults.tests.push({
        test: 'User depaId index',
        status: 'FAILED',
        error: 'Missing index'
      });
    }

    if (contractDepaIdIndex) {
      console.log('✅ Contract model has depaId index');
      testResults.passed++;
      testResults.tests.push({
        test: 'Contract depaId index',
        status: 'PASSED'
      });
    } else {
      console.log('❌ Contract model missing depaId index');
      testResults.failed++;
      testResults.tests.push({
        test: 'Contract depaId index',
        status: 'FAILED',
        error: 'Missing index'
      });
    }

    // Test 5: Test DEPA ID generation with service
    console.log('\n📝 Test 5: Test DEPA ID generation with service');
    
    const testUserDEPAId = depaIdService.generateUserDEPAId('TDC');
    const testContractDEPAId = depaIdService.generateContractDEPAId();
    
    if (depaIdService.validateDEPAId(testUserDEPAId)) {
      console.log(`✅ Generated valid user DEPA ID: ${testUserDEPAId}`);
      testResults.passed++;
      testResults.tests.push({
        test: 'Generate user DEPA ID',
        status: 'PASSED',
        result: testUserDEPAId
      });
    } else {
      console.log(`❌ Generated invalid user DEPA ID: ${testUserDEPAId}`);
      testResults.failed++;
      testResults.tests.push({
        test: 'Generate user DEPA ID',
        status: 'FAILED',
        error: 'Invalid DEPA ID'
      });
    }

    if (depaIdService.validateDEPAId(testContractDEPAId)) {
      console.log(`✅ Generated valid contract DEPA ID: ${testContractDEPAId}`);
      testResults.passed++;
      testResults.tests.push({
        test: 'Generate contract DEPA ID',
        status: 'PASSED',
        result: testContractDEPAId
      });
    } else {
      console.log(`❌ Generated invalid contract DEPA ID: ${testContractDEPAId}`);
      testResults.failed++;
      testResults.tests.push({
        test: 'Generate contract DEPA ID',
        status: 'FAILED',
        error: 'Invalid DEPA ID'
      });
    }

    // Test 6: Check database connection and table structure
    console.log('\n📝 Test 6: Check database connection and table structure');
    
    try {
      await db.sequelize.authenticate();
      console.log('✅ Database connection successful');
      testResults.passed++;
      testResults.tests.push({
        test: 'Database connection',
        status: 'PASSED'
      });

      // Check if tables exist and have depaId columns
      const tables = await db.sequelize.getQueryInterface().showAllTables();
      
      if (tables.includes('users')) {
        console.log('✅ Users table exists');
        testResults.passed++;
        testResults.tests.push({
          test: 'Users table exists',
          status: 'PASSED'
        });
      } else {
        console.log('❌ Users table does not exist');
        testResults.failed++;
        testResults.tests.push({
          test: 'Users table exists',
          status: 'FAILED',
          error: 'Table not found'
        });
      }

      if (tables.includes('contracts')) {
        console.log('✅ Contracts table exists');
        testResults.passed++;
        testResults.tests.push({
          test: 'Contracts table exists',
          status: 'PASSED'
        });
      } else {
        console.log('❌ Contracts table does not exist');
        testResults.failed++;
        testResults.tests.push({
          test: 'Contracts table exists',
          status: 'FAILED',
          error: 'Table not found'
        });
      }

      // Check if depaId columns exist in database
      if (tables.includes('users')) {
        const userColumns = await db.sequelize.getQueryInterface().describeTable('users');
        if (userColumns.depaId) {
          console.log('✅ Users table has depaId column');
          testResults.passed++;
          testResults.tests.push({
            test: 'Users table has depaId column',
            status: 'PASSED'
          });
        } else {
          console.log('❌ Users table missing depaId column');
          testResults.failed++;
          testResults.tests.push({
            test: 'Users table has depaId column',
            status: 'FAILED',
            error: 'Column not found'
          });
        }
      }

      if (tables.includes('contracts')) {
        const contractColumns = await db.sequelize.getQueryInterface().describeTable('contracts');
        if (contractColumns.depaId) {
          console.log('✅ Contracts table has depaId column');
          testResults.passed++;
          testResults.tests.push({
            test: 'Contracts table has depaId column',
            status: 'PASSED'
          });
        } else {
          console.log('❌ Contracts table missing depaId column');
          testResults.failed++;
          testResults.tests.push({
            test: 'Contracts table has depaId column',
            status: 'FAILED',
            error: 'Column not found'
          });
        }
      }

    } catch (error) {
      console.log(`❌ Database connection failed: ${error.message}`);
      testResults.failed++;
      testResults.tests.push({
        test: 'Database connection',
        status: 'FAILED',
        error: error.message
      });
    }

  } catch (error) {
    console.error('❌ Integration test failed:', error);
    testResults.failed++;
    testResults.tests.push({
      test: 'Integration test execution',
      status: 'FAILED',
      error: error.message
    });
  } finally {
    // Close database connection
    if (db.sequelize) {
      await db.sequelize.close();
    }
  }

  // Summary
  console.log('\n📊 Integration Test Summary:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📋 Total: ${testResults.passed + testResults.failed}`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 All integration tests passed! DEPA ID integration is ready.');
  } else {
    console.log('\n⚠️  Some integration tests failed. Please review the errors above.');
  }

  return testResults;
}

// Run integration tests if this script is executed directly
if (require.main === module) {
  testDEPAIdIntegration()
    .then((results) => {
      if (results.failed === 0) {
        console.log('\n✅ DEPA ID integration test completed successfully');
        process.exit(0);
      } else {
        console.log('\n❌ DEPA ID integration test completed with failures');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Integration test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testDEPAIdIntegration }; 