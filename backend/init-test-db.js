/**
 * Initialize Test Database
 * Creates the test database schema using Sequelize models
 */

require('dotenv').config({ path: './config.test.env' });

const { sequelize } = require('./models');

async function initTestDatabase() {
  try {
    console.log('🔧 Initializing test database...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Sync all models to create tables
    console.log('🏗️ Syncing database schema from models...');
    await sequelize.sync({ force: true });
    console.log('✅ Database schema synced successfully from models');
    
    // Verify tables were created
    const [results] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    
    console.log('📋 Created tables:');
    results.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    console.log('✅ Test database initialization completed successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize test database:', error.message);
    throw error;
  } finally {
    await sequelize.close();
    console.log('✅ Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  initTestDatabase()
    .then(() => {
      console.log('🎉 Test database ready for integration tests!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test database initialization failed:', error.message);
      process.exit(1);
    });
}

module.exports = { initTestDatabase };
