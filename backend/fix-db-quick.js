#!/usr/bin/env node

/**
 * Quick Database Fix Script
 * Creates the contract_management database and tests connection
 */

const { Client } = require('pg');
require('dotenv').config({ path: '../config.env' });

async function fixDatabase() {
  console.log('🔧 Quick Database Fix...');
  
  try {
    // Connect to default postgres database first
    const client = new Client({
      host: 'localhost',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: 'postgres'
    });

    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Create the contract_management database
    await client.query('CREATE DATABASE contract_management');
    console.log('✅ Created contract_management database');

    await client.end();

    // Test connection to the new database
    const testClient = new Client({
      host: 'localhost',
      port: 5432,
      database: 'contract_management',
      user: 'postgres',
      password: 'postgres'
    });

    await testClient.connect();
    console.log('✅ Successfully connected to contract_management database');
    await testClient.end();

    console.log('🎉 Database fix completed successfully!');
    
  } catch (error) {
    if (error.code === '42P04') {
      console.log('✅ Database contract_management already exists');
    } else {
      console.error('❌ Database fix failed:', error.message);
      process.exit(1);
    }
  }
}

fixDatabase();
