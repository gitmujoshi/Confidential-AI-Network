import { ContractId } from './core/ContractId.js';
import { Money } from './core/Money.js';
import { Duration } from './core/Duration.js';

console.log('🧪 Testing Value Objects...\n');

// Test ContractId
console.log('📋 Testing ContractId:');
try {
  const validContractId = new ContractId('RICARDIAN-1234567890');
  console.log('✅ Valid ContractId:', validContractId.value);
  
  const generatedContractId = ContractId.generate();
  console.log('✅ Generated ContractId:', generatedContractId.value);
  
  // Test invalid ContractId
  try {
    new ContractId('invalid-id');
    console.log('❌ Should have thrown error for invalid ContractId');
  } catch (error) {
    console.log('✅ Correctly rejected invalid ContractId:', (error as Error).message);
  }
} catch (error) {
  console.log('❌ ContractId test failed:', (error as Error).message);
}

// Test Money
console.log('\n💰 Testing Money:');
try {
  const validMoney = new Money(100.50, 'USD');
  console.log('✅ Valid Money:', validMoney.toString());
  
  const addedMoney = validMoney.add(new Money(50.25, 'USD'));
  console.log('✅ Added Money:', addedMoney.toString());
  
  // Test invalid Money
  try {
    new Money(-100);
    console.log('❌ Should have thrown error for negative amount');
  } catch (error) {
    console.log('✅ Correctly rejected negative amount:', (error as Error).message);
  }
} catch (error) {
  console.log('❌ Money test failed:', (error as Error).message);
}

// Test Duration
console.log('\n⏰ Testing Duration:');
try {
  const validDuration = new Duration(30, 'DAYS');
  console.log('✅ Valid Duration:', validDuration.toString());
  console.log('✅ Duration in hours:', validDuration.toHours());
  
  const addedDuration = validDuration.add(new Duration(7, 'DAYS'));
  console.log('✅ Added Duration:', addedDuration.toString());
  
  // Test invalid Duration
  try {
    new Duration(-5);
    console.log('❌ Should have thrown error for negative duration');
  } catch (error) {
    console.log('✅ Correctly rejected negative duration:', (error as Error).message);
  }
} catch (error) {
  console.log('❌ Duration test failed:', (error as Error).message);
}

console.log('\n🎉 Value Objects test completed!');
