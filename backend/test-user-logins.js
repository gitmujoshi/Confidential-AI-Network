const axios = require('axios');

const testUsers = [
  { id: 27, name: "Test User", email: "test@example.com", partyType: "TDP", password: "Test123!" },
  { id: 31, name: "New User", email: "newuser@example.com", partyType: "TDC", password: "Test123!" },
  { id: 32, name: "Test Keycloak User", email: "test***REMOVED-KEYCLOAK_DB_PASSWORD***@example.com", partyType: "TDP", password: "Test123!" },
  { id: 33, name: "Test Keycloak User 2", email: "test***REMOVED-KEYCLOAK_DB_PASSWORD***2@example.com", partyType: "TDP", password: "Test123!" },
  { id: 34, name: "Test Email User", email: "testemail@example.com", partyType: "TDP", password: "Test123!" },
  { id: 35, name: "Email Test User", email: "emailtest@example.com", partyType: "TDP", password: "Test123!" },
  { id: 36, name: "Final Email Test", email: "finalemailtest@example.com", partyType: "TDP", password: "Test123!" },
  { id: 37, name: "mmjuser1", email: "joshi.mukesh078@gmail.com", partyType: "TDP", password: "Test123!" },
  { id: 38, name: "Test Registration", email: "testregistration@example.com", partyType: "TDP", password: "Test123!" },
  { id: 39, name: "Test TDC User", email: "testtdc@example.com", partyType: "TDC", password: "Test123!" },
  { id: 40, name: "UI TDC User", email: "uitdc@example.com", partyType: "TDC", password: "Test123!" }
];

async function testUserLogin(user) {
  try {
    console.log(`\n🔍 Testing login for: ${user.name} (${user.email})`);
    
    const response = await axios.post('http://localhost:5001/api/auth/login', {
      email: user.email,
      password: user.password
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    if (response.data.accessToken) {
      console.log(`   ✅ SUCCESS - Login working`);
      console.log(`   📋 User ID: ${user.id}`);
      console.log(`   👤 Role: ${user.partyType}`);
      console.log(`   🔑 Token: ${response.data.accessToken.substring(0, 50)}...`);
      return { ...user, success: true, token: response.data.accessToken };
    } else {
      console.log(`   ❌ FAILED - No token in response`);
      return { ...user, success: false, error: 'No token in response' };
    }
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.message;
    console.log(`   ❌ FAILED - ${errorMessage}`);
    return { ...user, success: false, error: errorMessage };
  }
}

async function testAllLogins() {
  console.log('🧪 Testing Login for All Users...\n');
  
  const results = [];
  
  for (const user of testUsers) {
    const result = await testUserLogin(user);
    results.push(result);
  }
  
  // Summary
  console.log('\n📊 LOGIN TEST SUMMARY:');
  console.log('========================');
  
  const workingUsers = results.filter(r => r.success);
  const failedUsers = results.filter(r => !r.success);
  
  console.log(`\n✅ WORKING LOGINS (${workingUsers.length}):`);
  workingUsers.forEach(user => {
    console.log(`   • ${user.name} (${user.email}) - ${user.partyType}`);
  });
  
  console.log(`\n❌ FAILED LOGINS (${failedUsers.length}):`);
  failedUsers.forEach(user => {
    console.log(`   • ${user.name} (${user.email}) - ${user.partyType} - Error: ${user.error}`);
  });
  
  console.log(`\n📈 Success Rate: ${workingUsers.length}/${testUsers.length} (${Math.round(workingUsers.length/testUsers.length*100)}%)`);
  
  return { workingUsers, failedUsers };
}

testAllLogins().catch(console.error); 