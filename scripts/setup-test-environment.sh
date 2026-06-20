#!/bin/bash

# Test Environment Setup Script
# This script sets up a complete test environment with all necessary data

set -e  # Exit on any error

echo "🚀 Setting up test environment..."

# Load configuration
source ./scripts/load-config.sh

echo "📊 Database: $DB_NAME@$DB_HOST:$DB_PORT"
echo "👤 User: $DB_USER"

# 1. Run database migrations
echo "🔧 Running database migrations..."
cd backend
node run-schema-fix.js
cd ..

# 2. Create comprehensive test data
echo "📦 Creating test data..."
node scripts/create-test-data.js

echo "🎉 Test environment setup completed!"
echo ""
echo "🔑 Test Login Credentials:"
echo "========================="
echo "TDP User: alice@tdp.com / password123"
echo "TDC User: bob@tdc.com / password123"
echo "TSP User: carol@tsp.com / password123"
echo "Admin User: david@admin.com / password123"
echo ""
echo "🚀 You can now start the application and test all features!"
