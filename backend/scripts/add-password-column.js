/**
 * Add Password Column Migration
 * 
 * This script adds a password column to the users table for database authentication.
 */

const db = require('../models');

async function addPasswordColumn() {
  try {
    console.log('🔧 Adding password column to users table...');
    
    // Add password column to users table
    await db.sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN password VARCHAR(255) NULL
    `);
    
    console.log('✅ Password column added successfully');
    
    // Verify the column was added
    const [results] = await db.sequelize.query(`
      DESCRIBE users
    `);
    
    const passwordColumn = results.find(col => col.Field === 'password');
    if (passwordColumn) {
      console.log('✅ Password column verified in database');
    } else {
      console.log('❌ Password column not found in database');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to add password column:', error.message);
    process.exit(1);
  }
}

addPasswordColumn(); 