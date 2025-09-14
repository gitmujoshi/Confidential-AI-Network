#!/bin/bash

# Fresh Test Data Setup Script
# This script creates a completely fresh test environment

set -e  # Exit on any error

echo "🚀 Setting up fresh test environment..."

# Load configuration
source ./scripts/load-config.sh

echo "📊 Database: $DB_NAME@$DB_HOST:$DB_PORT"
echo "👤 User: $DB_USER"
echo "🌐 Backend URL: http://localhost:${PORT:-5001}"

# 1. Clean existing test data
echo "🧹 Cleaning existing test data..."
cd backend
node -e "
const { sequelize } = require('./models');
const { User, Contract, Dataset, TrainingEnvironment, TrainingJob, Notification } = require('./models');

async function cleanData() {
  try {
    await sequelize.sync();
    
    // Delete in correct order to avoid foreign key constraints
    await TrainingJob.destroy({ where: {}, force: true });
    await TrainingEnvironment.destroy({ where: {}, force: true });
    await Contract.destroy({ where: {}, force: true });
    await Dataset.destroy({ where: {}, force: true });
    await Notification.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    
    console.log('✅ Existing test data cleaned');
  } catch (error) {
    console.log('⚠️ Error cleaning data:', error.message);
  }
}

cleanData();
"
cd ..

# 2. Run database migrations
echo "🔧 Running database migrations..."
cd backend
node run-schema-fix.js
cd ..

# 3. Start backend if not running
echo "🔍 Checking if backend is running..."
if ! curl -s http://localhost:${PORT:-5001}/api/health > /dev/null 2>&1; then
    echo "🚀 Starting backend server..."
    cd backend
    npm start &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend to start
    echo "⏳ Waiting for backend to start..."
    for i in {1..30}; do
        if curl -s http://localhost:${PORT:-5001}/api/health > /dev/null 2>&1; then
            echo "✅ Backend is running"
            break
        fi
        echo "   Attempt $i/30..."
        sleep 2
    done
    
    if ! curl -s http://localhost:${PORT:-5001}/api/health > /dev/null 2>&1; then
        echo "❌ Backend failed to start"
        exit 1
    fi
else
    echo "✅ Backend is already running"
fi

# 4. Create fresh test data using the comprehensive script
echo "📦 Creating fresh test data using APIs..."
node scripts/setup-comprehensive-test-data.js

echo "🎉 Fresh test environment setup completed!"
echo ""
echo "🔑 Test Login Credentials:"
echo "========================="
echo "TDP User: alice@tdp.com / password123"
echo "TDC User: bob@tdc.com / password123"
echo "CCRP User: carol@ccrp.com / password123"
echo "Admin User: david@admin.com / password123"
echo ""
echo "🚀 You can now test all features with fresh data!"
echo "💡 All data was created using APIs and includes new enhancements"
