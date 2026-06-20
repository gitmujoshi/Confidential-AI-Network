#!/usr/bin/env node

// Simple script to create test users
const { User } = require('./backend/models');

const testUsers = [
    {
        email: 'tdc-test@example.com',
        password: 'password123',
        name: 'TDC Test User',
        partyType: 'TDC',
        organization: 'AI Research Institute',
        isActive: true,
        isRegistered: true,
        emailVerified: true
    },
    {
        email: 'tdp-test@example.com',
        password: 'password123',
        name: 'TDP Test User',
        partyType: 'TDP',
        organization: 'Healthcare Data Corp',
        isActive: true,
        isRegistered: true,
        emailVerified: true
    },
    {
        email: 'tsp-test@example.com',
        password: 'password123',
        name: 'TSP Test User',
        partyType: 'TSP',
        organization: 'Secure Compute Solutions',
        isActive: true,
        isRegistered: true,
        emailVerified: true
    },
    {
        email: 'appadmin-test@example.com',
        password: 'password123',
        name: 'App Admin',
        partyType: 'ADMIN',
        organization: 'Contract Management System',
        isActive: true,
        isRegistered: true,
        emailVerified: true
    }
];

async function createTestUsers() {
    try {
        console.log('👥 Creating test users...');
        
        for (const userData of testUsers) {
            try {
                // Check if user already exists
                const existingUser = await User.findOne({ where: { email: userData.email } });
                
                if (existingUser) {
                    console.log(`   ✅ User ${userData.email} already exists`);
                    continue;
                }
                
                // Create new user
                const user = await User.create(userData);
                console.log(`   ✅ Created user: ${userData.email} (${userData.partyType})`);
            } catch (error) {
                console.log(`   ❌ Failed to create user ${userData.email}:`, error.message);
            }
        }
        
        console.log('✅ Test users setup completed!');
    } catch (error) {
        console.log('❌ Failed to create test users:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    createTestUsers();
}
