const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5001/api';
const BACKEND_URL = 'http://localhost:5001';

// Test users data
const testUsers = [
  {
    name: 'MedData Solutions Inc.',
    email: 'tdp.medical@example.com',
    partyType: 'TDP',
    organization: 'MedData Solutions Inc.',
    description: 'Leading provider of medical imaging datasets for AI healthcare applications',
    phoneNumber: '+1-555-0101',
    website: 'https://meddata-solutions.com',
    location: 'Boston, MA'
  },
  {
    name: 'NLP Research Foundation',
    email: 'tdp.nlp@example.com',
    partyType: 'TDP',
    organization: 'NLP Research Foundation',
    description: 'Specialized in natural language processing datasets and text analytics',
    phoneNumber: '+1-555-0102',
    website: 'https://nlp-research.org',
    location: 'San Francisco, CA'
  },
  {
    name: 'AutoDrive Technologies',
    email: 'tdp.autodrive@example.com',
    partyType: 'TDP',
    organization: 'AutoDrive Technologies',
    description: 'Autonomous vehicle sensor data and driving behavior datasets',
    phoneNumber: '+1-555-0103',
    website: 'https://autodrive-tech.com',
    location: 'Detroit, MI'
  },
  {
    name: 'AI Healthcare Innovations',
    email: 'tdc.healthcare@example.com',
    partyType: 'TDC',
    organization: 'AI Healthcare Innovations',
    description: 'Developing AI-powered diagnostic tools for medical imaging',
    phoneNumber: '+1-555-0201',
    website: 'https://ai-healthcare.com',
    location: 'New York, NY'
  },
  {
    name: 'FinTech Analytics Corp',
    email: 'tdc.fintech@example.com',
    partyType: 'TDC',
    organization: 'FinTech Analytics Corp',
    description: 'Financial data analytics and risk assessment AI models',
    phoneNumber: '+1-555-0202',
    website: 'https://fintech-analytics.com',
    location: 'Chicago, IL'
  },
  {
    name: 'Language AI Labs',
    email: 'tdc.language@example.com',
    partyType: 'TDC',
    organization: 'Language AI Labs',
    description: 'Multilingual AI models and language processing solutions',
    phoneNumber: '+1-555-0203',
    website: 'https://language-ai-labs.com',
    location: 'Seattle, WA'
  },
  {
    name: 'SecureCloud Confidential Computing',
    email: 'ccrp.securecloud@example.com',
    partyType: 'CCRP',
    organization: 'SecureCloud Confidential Computing',
    description: 'Enterprise-grade confidential computing platform for secure AI training',
    phoneNumber: '+1-555-0301',
    website: 'https://securecloud-cc.com',
    location: 'Austin, TX'
  },
  {
    name: 'TrustedAI Environment Provider',
    email: 'ccrp.trustedai@example.com',
    partyType: 'CCRP',
    organization: 'TrustedAI Environment Provider',
    description: 'Trusted execution environments for AI model training and inference',
    phoneNumber: '+1-555-0302',
    website: 'https://trustedai-env.com',
    location: 'Denver, CO'
  },
  {
    name: 'PrivacyFirst Computing Solutions',
    email: 'ccrp.privacyfirst@example.com',
    partyType: 'CCRP',
    organization: 'PrivacyFirst Computing Solutions',
    description: 'Privacy-preserving AI training environments with zero-knowledge proofs',
    phoneNumber: '+1-555-0303',
    website: 'https://privacyfirst-computing.com',
    location: 'Portland, OR'
  }
];

// Function to check if backend is running
async function checkBackendHealth() {
  try {
    const response = await axios.get(`${BACKEND_URL}/health`);
    console.log('✅ Backend is running');
    return true;
  } catch (error) {
    console.error('❌ Backend is not running. Please start the backend server first.');
    return false;
  }
}

// Function to register a user via API
async function registerUser(userData) {
  try {
    console.log(`🔄 Registering: ${userData.name} (${userData.email})`);
    
    const response = await axios.post(`${BASE_URL}/auth/register`, userData);
    
    console.log(`✅ Successfully registered: ${userData.name}`);
    console.log(`   User ID: ${response.data.user.id}`);
    console.log(`   Party Type: ${response.data.user.partyType}`);
    
    if (response.data.loginCredentials) {
      console.log(`   Login Email: ${response.data.loginCredentials.email}`);
      console.log(`   Login Password: ${response.data.loginCredentials.password}`);
    }
    
    return {
      success: true,
      user: response.data.user,
      credentials: response.data.loginCredentials
    };
  } catch (error) {
    if (error.response?.status === 409) {
      console.log(`ℹ️ User already exists: ${userData.email}`);
      return {
        success: false,
        reason: 'ALREADY_EXISTS',
        email: userData.email
      };
    } else {
      console.error(`❌ Failed to register ${userData.name}:`, error.response?.data || error.message);
      return {
        success: false,
        reason: 'ERROR',
        error: error.response?.data || error.message
      };
    }
  }
}

// Function to verify user exists in database
async function verifyUserInDatabase(email) {
  try {
    // This would require authentication, so we'll just check if the user exists
    // by trying to register again (should return 409 if exists)
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Test User',
      email: email,
      partyType: 'TDC'
    });
    return false; // If we get here, user doesn't exist
  } catch (error) {
    if (error.response?.status === 409) {
      return true; // User exists
    }
    return false;
  }
}

// Main function
async function createTestUsersViaAPI() {
  console.log('🚀 Creating test users via proper registration API...');
  
  // Check if backend is running
  if (!await checkBackendHealth()) {
    return;
  }
  
  console.log('\n📋 Test users to create:');
  testUsers.forEach((user, index) => {
    console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.partyType}`);
  });
  
  console.log('\n🔄 Starting user creation...\n');
  
  let successCount = 0;
  let alreadyExistsCount = 0;
  let errorCount = 0;
  const results = [];
  
  for (const user of testUsers) {
    const result = await registerUser(user);
    results.push(result);
    
    if (result.success) {
      successCount++;
    } else if (result.reason === 'ALREADY_EXISTS') {
      alreadyExistsCount++;
    } else {
      errorCount++;
    }
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n📊 Registration Summary:');
  console.log(`✅ Successfully created: ${successCount} users`);
  console.log(`ℹ️ Already existed: ${alreadyExistsCount} users`);
  console.log(`❌ Failed to create: ${errorCount} users`);
  console.log(`📋 Total processed: ${testUsers.length} users`);
  
  // Show credentials for successful registrations
  const successfulResults = results.filter(r => r.success);
  if (successfulResults.length > 0) {
    console.log('\n🔑 Login Credentials for New Users:');
    successfulResults.forEach(result => {
      if (result.credentials) {
        console.log(`   ${result.user.email}: ${result.credentials.password}`);
      }
    });
  }
  
  // Show existing users
  const existingResults = results.filter(r => r.reason === 'ALREADY_EXISTS');
  if (existingResults.length > 0) {
    console.log('\nℹ️ Users that already exist:');
    existingResults.forEach(result => {
      console.log(`   ${result.email}`);
    });
  }
  
  if (errorCount === 0) {
    console.log('\n🎉 All users processed successfully!');
  } else {
    console.log('\n⚠️ Some users failed to register. Check the errors above.');
  }
}

// Run the script
if (require.main === module) {
  createTestUsersViaAPI()
    .then(() => {
      console.log('\n🎉 Test user creation completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createTestUsersViaAPI }; 