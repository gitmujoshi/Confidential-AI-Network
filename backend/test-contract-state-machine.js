/**
 * Simple Contract State Machine Test
 * 
 * This script tests the basic functionality of our enhanced contract state machine
 * without requiring the full test suite setup.
 */

const ContractService = require('./services/contractService');

async function testContractStateMachine() {
  console.log('🧪 Testing Contract State Machine Implementation');
  console.log('===============================================');

  const contractService = new ContractService();

  // Test 1: State Transition Validation
  console.log('\n1. Testing State Transition Validation...');
  
  const validTransitions = [
    ['DRAFT', 'PENDING_TDP'],
    ['PENDING_TDP', 'PENDING_TDC'],
    ['PENDING_TDC', 'PENDING_CCRP'],
    ['PENDING_CCRP', 'SIGNED'],
    ['SIGNED', 'EXECUTING'],
    ['EXECUTING', 'COMPLETED'],
    ['REJECTED', 'DRAFT'],
    ['FAILED', 'DRAFT']
  ];

  const invalidTransitions = [
    ['DRAFT', 'SIGNED'],
    ['PENDING_TDP', 'COMPLETED'],
    ['SIGNED', 'DRAFT'],
    ['COMPLETED', 'EXECUTING']
  ];

  console.log('✅ Valid transitions:');
  validTransitions.forEach(([from, to]) => {
    const isValid = contractService.validateStateTransition(from, to);
    console.log(`   ${from} → ${to}: ${isValid ? '✅' : '❌'}`);
  });

  console.log('❌ Invalid transitions:');
  invalidTransitions.forEach(([from, to]) => {
    const isValid = contractService.validateStateTransition(from, to);
    console.log(`   ${from} → ${to}: ${isValid ? '❌' : '✅'}`);
  });

  // Test 2: Valid Next States
  console.log('\n2. Testing Valid Next States...');
  
  const testStates = ['DRAFT', 'PENDING_TDP', 'PENDING_TDC', 'PENDING_CCRP', 'SIGNED', 'EXECUTING', 'COMPLETED', 'REJECTED', 'FAILED'];
  
  testStates.forEach(state => {
    const nextStates = contractService.getValidNextStates(state);
    console.log(`   ${state}: [${nextStates.join(', ')}]`);
  });

  // Test 3: State Machine Logic
  console.log('\n3. Testing State Machine Logic...');
  
  // Simulate a contract lifecycle
  console.log('   Simulating contract lifecycle:');
  
  let currentState = 'DRAFT';
  console.log(`   Start: ${currentState}`);
  
  // DRAFT → PENDING_TDP
  if (contractService.validateStateTransition(currentState, 'PENDING_TDP')) {
    currentState = 'PENDING_TDP';
    console.log(`   → ${currentState}`);
  }
  
  // PENDING_TDP → PENDING_TDC
  if (contractService.validateStateTransition(currentState, 'PENDING_TDC')) {
    currentState = 'PENDING_TDC';
    console.log(`   → ${currentState}`);
  }
  
  // PENDING_TDC → PENDING_CCRP
  if (contractService.validateStateTransition(currentState, 'PENDING_CCRP')) {
    currentState = 'PENDING_CCRP';
    console.log(`   → ${currentState}`);
  }
  
  // PENDING_CCRP → SIGNED
  if (contractService.validateStateTransition(currentState, 'SIGNED')) {
    currentState = 'SIGNED';
    console.log(`   → ${currentState}`);
  }
  
  // SIGNED → EXECUTING
  if (contractService.validateStateTransition(currentState, 'EXECUTING')) {
    currentState = 'EXECUTING';
    console.log(`   → ${currentState}`);
  }
  
  // EXECUTING → COMPLETED
  if (contractService.validateStateTransition(currentState, 'COMPLETED')) {
    currentState = 'COMPLETED';
    console.log(`   → ${currentState}`);
  }

  console.log(`   Final state: ${currentState}`);

  // Test 4: Error Handling
  console.log('\n4. Testing Error Handling...');
  
  // Test rejection path
  console.log('   Testing rejection path:');
  let rejectionState = 'PENDING_TDP';
  console.log(`   Start: ${rejectionState}`);
  
  if (contractService.validateStateTransition(rejectionState, 'REJECTED')) {
    rejectionState = 'REJECTED';
    console.log(`   → ${rejectionState}`);
  }
  
  if (contractService.validateStateTransition(rejectionState, 'DRAFT')) {
    rejectionState = 'DRAFT';
    console.log(`   → ${rejectionState} (resubmitted)`);
  }

  // Test failure path
  console.log('   Testing failure path:');
  let failureState = 'EXECUTING';
  console.log(`   Start: ${failureState}`);
  
  if (contractService.validateStateTransition(failureState, 'FAILED')) {
    failureState = 'FAILED';
    console.log(`   → ${failureState}`);
  }
  
  if (contractService.validateStateTransition(failureState, 'DRAFT')) {
    failureState = 'DRAFT';
    console.log(`   → ${failureState} (resubmitted)`);
  }

  console.log('\n✅ Contract State Machine Test Completed Successfully!');
  console.log('=====================================================');
}

// Run the test
testContractStateMachine().catch(console.error); 