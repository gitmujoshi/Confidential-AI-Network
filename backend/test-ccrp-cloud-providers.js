const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001';

async function testCCRPCloudProviders() {
  try {
    console.log('🧪 Testing CCRP Cloud Provider Management...\n');

    // Step 1: Login as a CCRP user
    console.log('📝 Step 1: Logging in as CCRP user...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'cloud-security@example.com',
      password: 'password123'
    });

    const token = loginResponse.data.accessToken;
    const userId = loginResponse.data.user.id;
    console.log(`✅ Logged in as ${loginResponse.data.user.name} (ID: ${userId})`);

    // Step 2: Get current cloud providers
    console.log('\n📝 Step 2: Getting current cloud providers...');
    const getProvidersResponse = await axios.get(`${API_BASE_URL}/api/ccrp/cloud-providers/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Current cloud providers:', getProvidersResponse.data);

    // Step 3: Update cloud providers
    console.log('\n📝 Step 3: Updating cloud providers...');
    const newProviders = ['AWS', 'Azure', 'GCP', 'OCI'];
    const updateResponse = await axios.put(`${API_BASE_URL}/api/ccrp/cloud-providers/${userId}`, {
      cloudProviders: newProviders,
      description: 'Multi-cloud security provider with expertise across all major cloud platforms'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Updated cloud providers:', updateResponse.data);

    // Step 4: Get updated cloud providers
    console.log('\n📝 Step 4: Getting updated cloud providers...');
    const updatedProvidersResponse = await axios.get(`${API_BASE_URL}/api/ccrp/cloud-providers/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Updated cloud providers:', updatedProvidersResponse.data);

    // Step 5: Test filtering by cloud provider (as TDC)
    console.log('\n📝 Step 5: Testing cloud provider filtering...');
    
    // Login as TDC user
    const tdcLoginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'research@example.com',
      password: 'password123'
    });
    const tdcToken = tdcLoginResponse.data.accessToken;
    console.log(`✅ Logged in as TDC user: ${tdcLoginResponse.data.user.name}`);

    // Get all CCRP users
    const allCcrpResponse = await axios.get(`${API_BASE_URL}/api/ccrp/all`, {
      headers: { Authorization: `Bearer ${tdcToken}` }
    });
    console.log('✅ All CCRP users:', allCcrpResponse.data);

    // Filter by AWS
    const awsCcrpResponse = await axios.get(`${API_BASE_URL}/api/ccrp/all?cloudProvider=AWS`, {
      headers: { Authorization: `Bearer ${tdcToken}` }
    });
    console.log('✅ CCRP users supporting AWS:', awsCcrpResponse.data);

    // Filter by Azure
    const azureCcrpResponse = await axios.get(`${API_BASE_URL}/api/ccrp/all?cloudProvider=Azure`, {
      headers: { Authorization: `Bearer ${tdcToken}` }
    });
    console.log('✅ CCRP users supporting Azure:', azureCcrpResponse.data);

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testCCRPCloudProviders(); 