#!/usr/bin/env node
/**
 * Seed E2E users directly to database for CI environments
 * This bypasses the API/Keycloak and creates users directly in the database
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Load database models
const db = require('./models');

// Load fixture
const FIXTURE_PATH = path.join(__dirname, '../fixtures/test-data/static-e2e-users.json');
const fixture = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'));
const PASSWORD = fixture.password || 'TestNewPassword123!';
const USERS = fixture.users || [];

async function seedUsers() {
  console.log('🌱 Seeding E2E users directly to database...');
  
  try {
    // Ensure database connection
    await db.sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Hash the password once
    const hashedPassword = await bcrypt.hash(PASSWORD, 10);
    
    // Create each user
    for (const userData of USERS) {
      try {
        // Check if user already exists
        const existingUser = await db.User.findOne({
          where: { email: userData.email.toLowerCase() }
        });
        
        if (existingUser) {
          console.log(`   ✓ User already exists: ${userData.email}`);
          continue;
        }
        
        // Create user
        const user = await db.User.create({
          name: userData.name,
          email: userData.email.toLowerCase(),
          password: hashedPassword,
          partyType: userData.partyType,
          isRegistered: true,
          isActive: true,
          emailVerified: true,
          profileCompleted: true,
          onboardingStatus: 'completed',
          registrationDate: new Date(),
          organization: userData.organization || null,
          description: userData.description || null,
          cloudProviders: userData.cloudProviders || null
        });
        
        console.log(`   + Created user: ${userData.email} (${userData.partyType})`);
      } catch (error) {
        console.error(`   ❌ Failed to create user ${userData.email}:`, error.message);
        // Continue with other users even if one fails
      }
    }
    
    console.log('\n✅ E2E user seeding complete!');
    console.log(`   Password (all users): ${PASSWORD}`);
    for (const u of USERS) {
      console.log(`   - ${u.role || u.partyType}: ${u.email}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('💥 Seeding failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedUsers();
}

module.exports = { seedUsers };
