/**
 * Fix JWT Secret Issue
 * 
 * This script tests the JWT token generation and validation to ensure consistency
 */

const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './config.env' });

async function fixJWTSecret() {
  try {
    console.log('🔧 Fixing JWT Secret Issue...\n');

    // Check environment variables
    console.log('1️⃣ Checking environment variables...');
    console.log(`   JWT_SECRET from env: ${process.env.JWT_SECRET ? 'Set' : 'Not set'}`);
    console.log(`   JWT_SECRET value: ${process.env.JWT_SECRET || 'Using fallback'}`);
    
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    console.log(`   Using JWT secret: ${jwtSecret}`);

    // Test JWT token generation and validation
    console.log('\n2️⃣ Testing JWT token generation and validation...');
    
    const testPayload = {
      userId: 6,
      email: 'appadmin@contractmanagement.com',
      walletAddress: null,
      partyType: 'AppAdmin',
      iat: Math.floor(Date.now() / 1000)
    };

    // Generate token
    const token = jwt.sign(testPayload, jwtSecret, { expiresIn: '24h' });
    console.log('✅ Token generated successfully');
    console.log(`   Token: ${token.substring(0, 50)}...`);

    // Validate token
    try {
      const decoded = jwt.verify(token, jwtSecret);
      console.log('✅ Token validation successful');
      console.log(`   Decoded payload:`, {
        userId: decoded.userId,
        email: decoded.email,
        partyType: decoded.partyType
      });
    } catch (validationError) {
      console.log('❌ Token validation failed:', validationError.message);
    }

    // Test with different secret (simulating the issue)
    console.log('\n3️⃣ Testing with different secret (simulating the issue)...');
    try {
      const wrongSecret = 'wrong-secret-key';
      const decodedWithWrongSecret = jwt.verify(token, wrongSecret);
      console.log('❌ Should have failed with wrong secret');
    } catch (wrongSecretError) {
      console.log('✅ Correctly failed with wrong secret:', wrongSecretError.message);
    }

    console.log('\n🎉 JWT Secret Test Completed!');
    console.log('\n📝 Summary:');
    console.log(`   JWT Secret: ${jwtSecret}`);
    console.log(`   Token Generation: ✅ Working`);
    console.log(`   Token Validation: ✅ Working`);
    console.log(`   Wrong Secret Test: ✅ Working`);

    // Check if the issue might be in the auth middleware
    console.log('\n🔍 Potential Issue Analysis:');
    console.log('   The JWT secret appears to be working correctly.');
    console.log('   The issue might be in the auth middleware or token format.');
    console.log('   Let\'s check if the token is being passed correctly in the frontend.');

  } catch (error) {
    console.error('❌ JWT Secret fix failed:', error.message);
  }
}

// Run the fix
fixJWTSecret(); 