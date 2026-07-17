#!/bin/bash

# =====================================================
# Contract Management System - Database Deployment Script
# =====================================================
# 
# This script deploys the complete database schema for the Contract Management System
# 
# Prerequisites:
# - PostgreSQL 12+ installed and running
# - psql command available
# - Database user with CREATE privileges
# 
# Usage:
# ./deploy-database.sh [database_name] [username] [host] [port]
# 
# Examples:
# ./deploy-database.sh                                    # Uses defaults
# ./deploy-database.sh contract_management                # Custom database name
# ./deploy-database.sh contract_management postgres       # Custom database and user
# ./deploy-database.sh contract_management postgres localhost 5432  # Full custom
# =====================================================

set -e

# Default values
DB_NAME=${1:-"contract_management"}
DB_USER=${2:-"postgres"}
DB_HOST=${3:-"localhost"}
DB_PORT=${4:-"5432"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${BLUE}"
    echo "====================================================="
    echo "$1"
    echo "====================================================="
    echo -e "${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v psql &> /dev/null; then
        print_error "psql command not found. Please install PostgreSQL client."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Test database connection
test_connection() {
    print_status "Testing database connection..."
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "SELECT 1;" &> /dev/null; then
        print_success "Database connection successful"
    else
        print_error "Cannot connect to database. Please check your credentials and connection."
        print_status "Connection details:"
        echo "  Host: $DB_HOST"
        echo "  Port: $DB_PORT"
        echo "  User: $DB_USER"
        echo "  Database: postgres (for connection test)"
        exit 1
    fi
}

# Create database if it doesn't exist
create_database() {
    print_status "Creating database '$DB_NAME' if it doesn't exist..."
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME';" | grep -q 1; then
        print_warning "Database '$DB_NAME' already exists"
    else
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "CREATE DATABASE \"$DB_NAME\";"
        print_success "Database '$DB_NAME' created successfully"
    fi
}

# Deploy schema
deploy_schema() {
    print_status "Deploying database schema..."
    
    # Get the directory where this script is located
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    SCHEMA_FILE="$SCRIPT_DIR/create-database-from-scratch.sql"
    
    if [ ! -f "$SCHEMA_FILE" ]; then
        print_error "Schema file not found: $SCHEMA_FILE"
        exit 1
    fi
    
    print_status "Executing schema file: $SCHEMA_FILE"
    
    # Execute the schema file
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCHEMA_FILE"; then
        print_success "Schema deployment completed successfully"
    else
        print_error "Schema deployment failed"
        exit 1
    fi
}

# Verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Count tables
    TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
    
    # Count indexes
    INDEX_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';" | xargs)
    
    print_success "Deployment verification completed:"
    echo "  Tables created: $TABLE_COUNT"
    echo "  Indexes created: $INDEX_COUNT"
    
    if [ "$TABLE_COUNT" -ge 20 ]; then
        print_success "Expected number of tables reached"
    else
        print_warning "Expected 20+ tables, found $TABLE_COUNT"
    fi
}

# Show connection info
show_connection_info() {
    print_header "Connection Information"
    echo "Database: $DB_NAME"
    echo "Host: $DB_HOST"
    echo "Port: $DB_PORT"
    echo "User: $DB_USER"
    echo ""
    echo "Connection string:"
    echo "  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
    echo ""
    echo "Environment variables for applications:"
    echo "  DB_HOST=$DB_HOST"
    echo "  DB_PORT=$DB_PORT"
    echo "  DB_NAME=$DB_NAME"
    echo "  DB_USER=$DB_USER"
}

# Main execution
main() {
    print_header "Contract Management System - Database Deployment"
    echo "Target Database: $DB_NAME"
    echo "Database User: $DB_USER"
    echo "Database Host: $DB_HOST"
    echo "Database Port: $DB_PORT"
    echo ""
    
    check_prerequisites
    test_connection
    create_database
    deploy_schema
    verify_deployment
    
    print_header "Deployment Summary"
    print_success "Database deployment completed successfully!"
    echo ""
    show_connection_info
    
    print_header "Next Steps"
    echo "1. Update your application's database configuration"
    echo "2. Test the connection with the new database"
    echo "3. Run your application to verify all tables are accessible"
    echo ""
    echo "If you encounter any issues, check the logs above for details."
}

# Run main function
main "$@"
