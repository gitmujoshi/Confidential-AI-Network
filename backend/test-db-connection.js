require('dotenv').config({ path: './config.env' });

console.log('🔍 Testing Database Connection...');
console.log('Environment variables:');
console.log(`  DB_HOST: ${process.env.DB_HOST}`);
console.log(`  DB_PORT: ${process.env.DB_PORT}`);
console.log(`  DB_NAME: ${process.env.DB_NAME}`);
console.log(`  DB_USER: ${process.env.DB_USER}`);
console.log(`  DB_PASSWORD: ${process.env.DB_PASSWORD}`);

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: '***REMOVED-DB_PASSWORD***',
    logging: console.log
  }
);

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
    
    // Test creating a simple table
    console.log('🔧 Testing table creation...');
    await sequelize.query('CREATE TABLE IF NOT EXISTS test_connection (id SERIAL PRIMARY KEY, message TEXT)');
    console.log('✅ Test table created successfully');
    
    // Test inserting data
    await sequelize.query("INSERT INTO test_connection (message) VALUES ('Connection test successful')");
    console.log('✅ Test data inserted successfully');
    
    // Test querying data
    const [results] = await sequelize.query('SELECT * FROM test_connection');
    console.log('✅ Test data queried successfully:', results);
    
    // Clean up
    await sequelize.query('DROP TABLE test_connection');
    console.log('✅ Test table cleaned up');
    
    await sequelize.close();
    console.log('🎉 Database connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
