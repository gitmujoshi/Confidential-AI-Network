const jwt = require('jsonwebtoken');

// Admin user data
const adminUser = {
  userId: 56, // Application Admin ID
  email: 'appadmin@example.com',
  partyType: 'AppAdmin',
  walletAddress: null,
  authType: 'database' // Required by the middleware
};

// Generate JWT token
const token = jwt.sign(adminUser, 'your-super-secret-jwt-key', { expiresIn: '24h' });

console.log('🔐 Generated Admin JWT Token:');
console.log('=====================================');
console.log('Token:', token);
console.log('=====================================\n');

console.log('📋 Token Details:');
console.log('- User ID:', adminUser.userId);
console.log('- Email:', adminUser.email);
console.log('- Party Type:', adminUser.partyType);
console.log('- Auth Type:', adminUser.authType);
console.log('- Expires: 24 hours from now');
console.log('- Secret Used: your-super-secret-jwt-key\n');

console.log('💡 To use this token:');
console.log('1. Copy the token above');
console.log('2. Open browser developer tools');
console.log('3. Go to Application > Local Storage > http://localhost:3000');
console.log('4. Set "token" to the token value');
console.log('5. Refresh the page');

// Save token to file for testing
const fs = require('fs');
fs.writeFileSync('admin-token.txt', token);
console.log('\n✅ Token saved to admin-token.txt'); 