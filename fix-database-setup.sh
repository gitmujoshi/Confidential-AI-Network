#!/bin/bash

# Database Setup Fix Script
# This script fixes the database connection issues for the Contract Management System

set -e

echo "🔧 Fixing Database Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() { echo -e "${BLUE}🔍 $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Check if PostgreSQL container is running
if ! docker ps | grep -q "***REMOVED-DB_PASSWORD***-cms"; then
    print_error "PostgreSQL container is not running. Please start it first."
    exit 1
fi

print_status "PostgreSQL container is running"

# Create the contract_management database and ***REMOVED-DB_PASSWORD*** user
print_status "Setting up database and user..."

# Create ***REMOVED-DB_PASSWORD*** user and contract_management database
docker exec ***REMOVED-DB_PASSWORD***-cms psql -U ***REMOVED-KEYCLOAK_DB_PASSWORD*** -d ***REMOVED-KEYCLOAK_DB_PASSWORD*** << 'EOF'
-- Create ***REMOVED-DB_PASSWORD*** user if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '***REMOVED-DB_PASSWORD***') THEN
        CREATE USER ***REMOVED-DB_PASSWORD*** WITH PASSWORD '***REMOVED-DB_PASSWORD***';
        ALTER USER ***REMOVED-DB_PASSWORD*** WITH SUPERUSER;
    ELSE
        ALTER USER ***REMOVED-DB_PASSWORD*** WITH PASSWORD '***REMOVED-DB_PASSWORD***';
    END IF;
END
$$;

-- Create contract_management database if it doesn't exist
SELECT 'CREATE DATABASE contract_management'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'contract_management')\gexec

-- Grant privileges to ***REMOVED-DB_PASSWORD*** user
GRANT ALL PRIVILEGES ON DATABASE contract_management TO ***REMOVED-DB_PASSWORD***;
GRANT ALL PRIVILEGES ON DATABASE ***REMOVED-KEYCLOAK_DB_PASSWORD*** TO ***REMOVED-DB_PASSWORD***;

-- Connect to contract_management database to set up schema
\c contract_management;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO ***REMOVED-DB_PASSWORD***;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ***REMOVED-DB_PASSWORD***;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ***REMOVED-DB_PASSWORD***;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ***REMOVED-DB_PASSWORD***;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ***REMOVED-DB_PASSWORD***;
EOF

if [ $? -eq 0 ]; then
    print_success "Database and user setup completed"
else
    print_error "Failed to setup database and user"
    exit 1
fi

# Test the connection
print_status "Testing database connection..."
if docker exec ***REMOVED-DB_PASSWORD***-cms psql -U ***REMOVED-DB_PASSWORD*** -d contract_management -c "SELECT 'Connection successful' as status;" 2>/dev/null; then
    print_success "Database connection test passed"
else
    print_error "Database connection test failed"
    exit 1
fi

# Update backend config to use the correct database port
print_status "Updating backend configuration..."
if [ -f "backend/config.env" ]; then
    # Update database port to match the exposed port
    sed -i.bak 's/DB_PORT=5432/DB_PORT=5433/' backend/config.env
    print_success "Updated backend config to use port 5433"
else
    print_warning "Backend config file not found"
fi

print_success "Database setup fix completed!"
echo ""
echo "📋 Summary of changes:"
echo "  • Created ***REMOVED-DB_PASSWORD*** user with password '***REMOVED-DB_PASSWORD***'"
echo "  • Created contract_management database"
echo "  • Granted necessary privileges"
echo "  • Updated backend config to use port 5433"
echo ""
echo "🚀 You can now start the backend server!"
