#!/bin/bash

# Database Deployment Script
# This script ensures database schema is properly migrated before starting the application

set -e  # Exit on any error

echo "🚀 Starting database deployment process..."

# Load configuration
source ./scripts/load-config.sh

# Database connection parameters
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-contract_management}
DB_USER=${DB_USER:-postgres}

echo "📊 Database: $DB_NAME@$DB_HOST:$DB_PORT"
echo "👤 User: $DB_USER"

# Function to check if database exists
check_database_exists() {
    echo "🔍 Checking if database exists..."
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1
}

# Function to create database if it doesn't exist
create_database() {
    if ! check_database_exists; then
        echo "📦 Creating database $DB_NAME..."
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;"
        echo "✅ Database created successfully"
    else
        echo "✅ Database already exists"
    fi
}

# Function to run database migrations
run_migrations() {
    echo "🔧 Running database migrations..."
    
    # Change to backend directory
    cd backend
    
    # Run the comprehensive schema fix
    echo "📋 Running comprehensive schema migration..."
    node run-schema-fix.js
    
    if [ $? -eq 0 ]; then
        echo "✅ Database migrations completed successfully"
    else
        echo "❌ Database migrations failed"
        exit 1
    fi
    
    # Return to root directory
    cd ..
}

# Function to validate database schema
validate_schema() {
    echo "🔍 Validating database schema..."
    
    # Check for required tables
    REQUIRED_TABLES=("users" "contracts" "datasets" "training_jobs" "training_environments" "signing_events" "system_health_log")
    
    for table in "${REQUIRED_TABLES[@]}"; do
        echo "  Checking table: $table"
        if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT 1 FROM information_schema.tables WHERE table_name='$table'" | grep -q 1; then
            echo "    ✅ $table exists"
        else
            echo "    ❌ $table missing"
            exit 1
        fi
    done
    
    # Check for required columns in users table
    REQUIRED_USER_COLUMNS=("first_login" "email_verified" "onboarding_status")
    
    for column in "${REQUIRED_USER_COLUMNS[@]}"; do
        echo "  Checking users.$column column"
        if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='$column'" | grep -q 1; then
            echo "    ✅ users.$column exists"
        else
            echo "    ❌ users.$column missing"
            exit 1
        fi
    done
    
    echo "✅ Database schema validation passed"
}

# Function to create backup before migration
create_backup() {
    echo "💾 Creating database backup..."
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    
    PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > "backups/$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        echo "✅ Database backup created: backups/$BACKUP_FILE"
    else
        echo "⚠️ Database backup failed, but continuing with migration"
    fi
}

# Main deployment process
main() {
    echo "🎯 Starting database deployment for environment: ${NODE_ENV:-development}"
    
    # Create backups directory if it doesn't exist
    mkdir -p backups
    
    # Step 1: Create database if it doesn't exist
    create_database
    
    # Step 2: Create backup before migration
    create_backup
    
    # Step 3: Run migrations
    run_migrations
    
    # Step 4: Validate schema
    validate_schema
    
    echo "🎉 Database deployment completed successfully!"
    echo "🚀 Ready to start the application"
}

# Run main function
main "$@"
