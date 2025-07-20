#!/usr/bin/env node

/**
 * Authentication Logic Validation Script
 * 
 * This script validates that the authentication logic remains frozen
 * and has not been accidentally modified.
 */

const fs = require('fs');
const path = require('path');

// Frozen authentication logic signatures
const FROZEN_SIGNATURES = {
  'middleware/auth.js': [
    '🔒 FROZEN AUTHENTICATION LOGIC - DO NOT MODIFY',
    'Use only Keycloak username to match with database iamUsername',
    'const keycloakUsername = validationResult.user.username;',
    'iamUsername: keycloakUsername,',
    'USER_NOT_FOUND'
  ]
};

function validateAuthLogic() {
  console.log('🔍 Validating Authentication Logic...\n');
  
  let allValid = true;
  
  for (const [filePath, signatures] of Object.entries(FROZEN_SIGNATURES)) {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`❌ File not found: ${filePath}`);
      allValid = false;
      continue;
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    let fileValid = true;
    
    console.log(`📁 Checking: ${filePath}`);
    
    for (const signature of signatures) {
      if (!content.includes(signature)) {
        console.log(`  ❌ Missing signature: "${signature}"`);
        fileValid = false;
      } else {
        console.log(`  ✅ Found signature: "${signature}"`);
      }
    }
    
    if (fileValid) {
      console.log(`  ✅ ${filePath} - AUTHENTICATION LOGIC FROZEN\n`);
    } else {
      console.log(`  ❌ ${filePath} - AUTHENTICATION LOGIC MODIFIED!\n`);
      allValid = false;
    }
  }
  
  if (allValid) {
    console.log('🎉 All authentication logic is properly frozen!');
    console.log('   No accidental modifications detected.');
  } else {
    console.log('⚠️  WARNING: Authentication logic has been modified!');
    console.log('   Please review changes and ensure they are intentional.');
  }
  
  return allValid;
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateAuthLogic();
}

module.exports = { validateAuthLogic }; 