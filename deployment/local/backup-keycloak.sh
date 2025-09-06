#!/bin/bash

# Keycloak Backup Script
# This script backs up the Keycloak configuration and data

set -e

echo "💾 Creating Keycloak backup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Store the script directory for later use
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Create backup directory
BACKUP_DIR="$PROJECT_ROOT/***REMOVED-KEYCLOAK_DB_PASSWORD***-backups"
mkdir -p "$BACKUP_DIR"

# Create timestamp for backup
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="***REMOVED-KEYCLOAK_DB_PASSWORD***_backup_$TIMESTAMP"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

print_status "Creating backup: $BACKUP_NAME"

# Function to get admin token
get_admin_token() {
    local response=$(curl -k -s -X POST "${KEYCLOAK_URL:-https://localhost:8443}/realms/master/protocol/openid-connect/token" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "grant_type=password&client_id=admin-cli&username=${KEYCLOAK_ADMIN_USER:-admin}&password=${KEYCLOAK_ADMIN_PASSWORD:-***REMOVED-KEYCLOAK_ADMIN_PASSWORD***}")
    
    echo "$response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4
}

# Function to export realm
export_realm() {
    local admin_token=$1
    local realm_name=$2
    local backup_file=$3
    
    print_status "Exporting realm: $realm_name"
    
    # Export realm configuration
    curl -k -s -X GET "${KEYCLOAK_URL:-https://localhost:8443}/admin/realms/$realm_name" \
        -H "Authorization: Bearer $admin_token" \
        -H "Content-Type: application/json" > "$backup_file"
    
    if [ -s "$backup_file" ]; then
        print_success "Realm exported to: $backup_file"
    else
        print_error "Failed to export realm"
        return 1
    fi
}

# Function to export users
export_users() {
    local admin_token=$1
    local realm_name=$2
    local backup_file=$3
    
    print_status "Exporting users from realm: $realm_name"
    
    # Export users
    curl -k -s -X GET "${KEYCLOAK_URL:-https://localhost:8443}/admin/realms/$realm_name/users" \
        -H "Authorization: Bearer $admin_token" \
        -H "Content-Type: application/json" > "$backup_file"
    
    if [ -s "$backup_file" ]; then
        print_success "Users exported to: $backup_file"
    else
        print_warning "No users found or failed to export users"
    fi
}

# Main backup function
backup_***REMOVED-KEYCLOAK_DB_PASSWORD***() {
    # Check if Keycloak is running
    if ! curl -k -s "${KEYCLOAK_URL:-https://localhost:8443}/realms/master" >/dev/null 2>&1; then
        print_error "Keycloak is not running. Please start Keycloak first."
        exit 1
    fi
    
    # Get admin token
    print_status "Getting admin token..."
    local admin_token=$(get_admin_token)
    if [ -z "$admin_token" ]; then
        print_error "Failed to get admin token"
        exit 1
    fi
    print_success "Admin token obtained"
    
    # Create backup directory
    mkdir -p "$BACKUP_PATH"
    
    # Export realm configuration
    export_realm "$admin_token" "contract-management" "$BACKUP_PATH/realm.json"
    
    # Export users
    export_users "$admin_token" "contract-management" "$BACKUP_PATH/users.json"
    
    # Copy persistent data directory
    if [ -d "$PROJECT_ROOT/***REMOVED-KEYCLOAK_DB_PASSWORD***-data" ]; then
        print_status "Copying persistent data..."
        cp -r "$PROJECT_ROOT/***REMOVED-KEYCLOAK_DB_PASSWORD***-data" "$BACKUP_PATH/data"
        print_success "Persistent data backed up"
    else
        print_warning "No persistent data directory found"
    fi
    
    # Create backup info file
    cat > "$BACKUP_PATH/backup_info.txt" << EOF
Keycloak Backup Information
==========================
Backup Date: $(date)
Backup Name: $BACKUP_NAME
Realm: contract-management
Files:
- realm.json: Realm configuration
- users.json: User data
- data/: Persistent data directory

To restore this backup:
1. Stop Keycloak
2. Copy data/ to ***REMOVED-KEYCLOAK_DB_PASSWORD***-data/
3. Restart Keycloak
4. Run: ./restore-***REMOVED-KEYCLOAK_DB_PASSWORD***.sh $BACKUP_NAME
EOF
    
    print_success "Backup completed successfully!"
    print_status "Backup location: $BACKUP_PATH"
    print_status "Backup info: $BACKUP_PATH/backup_info.txt"
}

# Run backup
backup_***REMOVED-KEYCLOAK_DB_PASSWORD*** 