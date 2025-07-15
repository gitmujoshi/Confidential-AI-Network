const axios = require('axios');
const { User } = require('./models');

async function testAdminDashboard() {
  try {
    console.log('🔍 Testing Admin Dashboard Functionality...\n');

    // Step 1: Check if admin user exists
    console.log('📊 Step 1: Checking admin users...');
    const adminUsers = await User.findAll({
      where: { partyType: 'AppAdmin' },
      attributes: ['id', 'name', 'email', 'partyType', 'isActive']
    });

    console.log(`Found ${adminUsers.length} admin users:`);
    adminUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Active: ${user.isActive}`);
    });

    if (adminUsers.length === 0) {
      console.log('\n❌ No admin users found! Creating one...');
      
      // Create an admin user
      const adminUser = await User.create({
        name: 'System Administrator',
        email: 'admin@example.com',
        partyType: 'AppAdmin',
        isActive: true,
        isRegistered: true,
        profileCompleted: true
      });
      
      console.log(`✅ Created admin user: ${adminUser.name} (${adminUser.email})`);
    }

    // Step 2: Test admin API endpoints
    console.log('\n🔗 Step 2: Testing admin API endpoints...');
    
    const baseURL = 'http://localhost:5001';
    
    // Test endpoints that should work
    const endpoints = [
      '/api/admin/users',
      '/api/admin/contracts', 
      '/api/admin/datasets',
      '/api/admin/data-breaches',
      '/api/admin/compliance'
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`Testing ${endpoint}...`);
        const response = await axios.get(`${baseURL}${endpoint}`, {
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json'
          }
        });
        console.log(`  ✅ ${endpoint} - Status: ${response.status}`);
      } catch (error) {
        console.log(`  ❌ ${endpoint} - Error: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
      }
    }

    // Step 3: Check database tables
    console.log('\n🗄️ Step 3: Checking database tables...');
    
    const tables = ['Users', 'Contracts', 'Datasets', 'DataBreaches', 'Consents', 'AuditLogs'];
    
    for (const table of tables) {
      try {
        const count = await User.sequelize.query(`SELECT COUNT(*) as count FROM "${table}"`, {
          type: User.sequelize.QueryTypes.SELECT
        });
        console.log(`  📊 ${table}: ${count[0]?.count || 0} records`);
      } catch (error) {
        console.log(`  ❌ ${table}: Error - ${error.message}`);
      }
    }

    // Step 4: Check model associations
    console.log('\n🔗 Step 4: Checking model associations...');
    
    try {
      const contracts = await require('./models').Contract.findAll({
        include: [
          { model: User, as: 'tdp' },
          { model: User, as: 'tdc' },
          { model: User, as: 'ccrp' }
        ],
        limit: 1
      });
      console.log(`  ✅ Contract associations working - Found ${contracts.length} contracts`);
    } catch (error) {
      console.log(`  ❌ Contract associations error: ${error.message}`);
    }

    try {
      const datasets = await require('./models').Dataset.findAll({
        include: [{ model: User, as: 'owner' }],
        limit: 1
      });
      console.log(`  ✅ Dataset associations working - Found ${datasets.length} datasets`);
    } catch (error) {
      console.log(`  ❌ Dataset associations error: ${error.message}`);
    }

    console.log('\n✅ Admin dashboard test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAdminDashboard(); 