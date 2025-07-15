/**
 * Generate valid Ethereum addresses for testing
 */

const crypto = require('crypto');

function generateValidEthereumAddress() {
  // Generate 20 bytes (40 hex characters)
  const randomBytes = crypto.randomBytes(20);
  const address = '0x' + randomBytes.toString('hex');
  return address;
}

// Generate 9 valid addresses for our test users
const addresses = [];
for (let i = 0; i < 9; i++) {
  addresses.push(generateValidEthereumAddress());
}

console.log('Valid Ethereum addresses for testing:');
addresses.forEach((addr, index) => {
  console.log(`Address ${index + 1}: ${addr}`);
});

console.log('\nCopy these addresses to replace the wallet addresses in refresh-test-data.js'); 