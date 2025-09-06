#!/usr/bin/env node

/**
 * Simple Database Connection Test
 * 
 * This script tests the database connection using the same configuration
 * as the backend to verify connectivity before proceeding with API-based
 * test data creation.
 */

const { Sequelize } = require('sequelize');
require('dotenv').config({ path: './backend/config.env' });

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  console.log(`   Host: ${process.env.DB_HOST}`);
  console.log(`   Port: ${process.env.DB_PORT}`);
  console.log(`   Database: ${process.env.DB_NAME}`);
  console.log(`   User: ${process.env.DB_USER}`);
  
  const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: '***REMOVED-DB_PASSWORD***',
      logging: false,
      dialectOptions: {
        family: 4 // Force IPv4
      }
    }
  );

  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const [results] = await sequelize.query('SELECT version()');
    console.log('✅ Database query successful!');
    console.log(`   PostgreSQL version: ${results[0].version}`);
    
    await sequelize.close();
    console.log('✅ Database connection closed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Run the test
testDatabaseConnection()
  .then(success => {
    if (success) {
      console.log('\n🎉 Database connection test passed!');
      console.log('💡 The backend should be able to connect to the database.');
      process.exit(0);
    } else {
      console.log('\n❌ Database connection test failed!');
      console.log('💡 Check the database configuration and ensure PostgreSQL is running.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Test script error:', error);
    process.exit(1);
  });
