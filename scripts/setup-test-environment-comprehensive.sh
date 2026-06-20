#!/bin/bash

# Comprehensive Test Environment Setup Script
# This script sets up a complete test environment with all necessary data using APIs

set -e  # Exit on any error

echo "🚀 Setting up comprehensive test environment..."

# Load configuration
source ./scripts/load-config.sh

echo "📊 Database: $DB_NAME@$DB_HOST:$DB_PORT"
echo "👤 User: $DB_USER"
echo "🌐 Backend URL: http://localhost:${PORT:-5001}"

# 1. Run database migrations
echo "🔧 Running database migrations..."
cd backend
node run-schema-fix.js
cd ..

# 2. Start backend if not running
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

# 3. Create comprehensive test data using APIs
echo "📦 Creating comprehensive test data using APIs..."
node scripts/setup-comprehensive-test-data.js

echo "🎉 Comprehensive test environment setup completed!"
echo ""
echo "🔑 Test Login Credentials:"
echo "========================="
echo "TDP User: alice@tdp.com / password123"
echo "TDC User: bob@tdc.com / password123"
echo "TSP User: carol@tsp.com / password123"
echo "Admin User: david@admin.com / password123"
echo ""
echo "🚀 You can now test all features with comprehensive data!"
echo "💡 All data was created using APIs and includes new enhancements"
