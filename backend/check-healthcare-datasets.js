const db = require('./models');

async function checkHealthcareDatasets() {
  try {
    console.log('🔍 Checking datasets owned by healthcare@example.com...\n');
    
    // Find the healthcare user
    const user = await db.User.findOne({ 
      where: { email: 'healthcare@example.com' } 
    });
    
    if (!user) {
      console.log('❌ User healthcare@example.com not found');
      return;
    }
    
    console.log('✅ User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Party Type: ${user.partyType}`);
    console.log(`   Email: ${user.email}\n`);
    
    // Find datasets owned by this user
    const datasets = await db.Dataset.findAll({ 
      where: { ownerId: user.id } 
    });
    
    console.log(`📊 Datasets owned by healthcare@example.com:`);
    console.log(`   Total Count: ${datasets.length}\n`);
    
    if (datasets.length > 0) {
      console.log('📋 Dataset Details:');
      datasets.forEach((dataset, index) => {
        console.log(`   ${index + 1}. ${dataset.name}`);
        console.log(`      ID: ${dataset.id}`);
        console.log(`      Description: ${dataset.description || 'No description'}`);
        console.log(`      Data Type: ${dataset.dataType || 'Not specified'}`);
        console.log(`      Created: ${dataset.createdAt}`);
        console.log('');
      });
    } else {
      console.log('   No datasets found for this user');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit();
  }
}

checkHealthcareDatasets(); 