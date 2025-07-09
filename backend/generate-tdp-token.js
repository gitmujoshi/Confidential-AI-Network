const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './config.env' });

// Get the JWT secret from config
const JWT_SECRET = process.env.JWT_SECRET || '***REMOVED-HARDCODED-JWT***';

// TDP User data
const tdpUserData = {
  userId: 3,
  email: 'tdpuser@example.com',
  partyType: 'TDP',
  walletAddress: null
};

// Generate token
const token = jwt.sign(tdpUserData, JWT_SECRET, { expiresIn: '24h' });

console.log('🔐 Generated TDP User JWT Token:');
console.log('=====================================');
console.log(`Token: ${token}`);
console.log('=====================================');
console.log('');
console.log('📋 Token Details:');
console.log(`- User ID: ${tdpUserData.userId}`);
console.log(`- Email: ${tdpUserData.email}`);
console.log(`- Party Type: ${tdpUserData.partyType}`);
console.log(`- Expires: 24 hours from now`);
console.log(`- Secret Used: ${JWT_SECRET.substring(0, 20)}...`);
console.log('');
console.log('💡 To use this token:');
console.log('1. Copy the token above');
console.log('2. Open browser developer tools');
console.log('3. Go to Application > Local Storage > http://localhost:3000');
console.log('4. Set "token" to the token value');
console.log('5. Refresh the page'); 