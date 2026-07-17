#!/bin/bash

# Keycloak Restore Script
# This script restores Keycloak configuration from a backup

set -e

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

# Check if backup name is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_name>"
    echo "Available backups:"
    ls -1 "$PROJECT_ROOT/keycloak-backups" 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_NAME=$1
BACKUP_PATH="$PROJECT_ROOT/keycloak-backups/$BACKUP_NAME"

if [ ! -d "$BACKUP_PATH" ]; then
    print_error "Backup '$BACKUP_NAME' not found"
    echo "Available backups:"
    ls -1 "$PROJECT_ROOT/keycloak-backups" 2>/dev/null || echo "No backups found"
    exit 1
fi

echo "🔄 Restoring Keycloak from backup: $BACKUP_NAME"

# Function to get admin token
get_admin_token() {
    local response=$(curl -k -s -X POST "${KEYCLOAK_URL:-https://localhost:8443}/realms/master/protocol/openid-connect/token" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "grant_type=password&client_id=admin-cli&username=${KEYCLOAK_ADMIN_USER:-admin}&password=${KEYCLOAK_ADMIN_PASSWORD:-admin123}")
    
    echo "$response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4
}

# Function to wait for Keycloak to be ready
wait_for_keycloak() {
    print_status "Waiting for Keycloak to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -k -s "${KEYCLOAK_URL:-https://localhost:8443}/realms/master" >/dev/null 2>&1; then
            print_success "Keycloak is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "Keycloak failed to start within $((max_attempts * 2)) seconds"
    return 1
}

# Function to import realm
import_realm() {
    local admin_token=$1
    local realm_file=$2
    
    print_status "Importing realm configuration..."
    
    # Import realm
    local response=$(curl -k -s -X POST "${KEYCLOAK_URL:-https://localhost:8443}/admin/realms" \
        -H "Authorization: Bearer $admin_token" \
        -H "Content-Type: application/json" \
        -d @"$realm_file")
    
    if [[ "$response" == *"409"* ]]; then
        print_warning "Realm already exists, updating..."
        # Get realm name from file
        local realm_name=$(grep -o '"realm":"[^"]*"' "$realm_file" | cut -d'"' -f4)
        
        # Update realm
        curl -k -s -X PUT "${KEYCLOAK_URL:-https://localhost:8443}/admin/realms/$realm_name" \
            -H "Authorization: Bearer $admin_token" \
            -H "Content-Type: application/json" \
            -d @"$realm_file" >/dev/null
        
        print_success "Realm updated successfully"
    elif [[ "$response" == *"201"* ]] || [[ "$response" == "" ]]; then
        print_success "Realm imported successfully"
    else
        print_error "Failed to import realm: $response"
        return 1
    fi
}

# Function to import users
import_users() {
    local admin_token=$1
    local users_file=$2
    
    if [ ! -s "$users_file" ]; then
        print_warning "No users file found or file is empty"
        return 0
    fi
    
    print_status "Importing users..."
    
    # Read users from file and import them one by one
    local user_count=0
    while IFS= read -r user_json; do
        if [ -n "$user_json" ] && [ "$user_json" != "[" ] && [ "$user_json" != "]" ]; then
            # Remove trailing comma if present
            user_json=$(echo "$user_json" | sed 's/,$//')
            
            # Import user
            local response=$(curl -k -s -X POST "${KEYCLOAK_URL:-https://localhost:8443}/admin/realms/${KEYCLOAK_REALM:-contract-management}/users" \
                -H "Authorization: Bearer $admin_token" \
                -H "Content-Type: application/json" \
                -d "$user_json")
            
            if [[ "$response" == *"409"* ]]; then
                print_warning "User already exists, skipping..."
            elif [[ "$response" == *"201"* ]] || [[ "$response" == "" ]]; then
                print_success "User imported successfully"
                user_count=$((user_count + 1))
            else
                print_warning "Failed to import user: $response"
            fi
        fi
    done < <(cat "$users_file" | jq -c '.[]' 2>/dev/null || echo "[]")
    
    print_success "Imported $user_count users"
}

# Main restore function
restore_keycloak() {
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
    
    # Import realm configuration
    if [ -f "$BACKUP_PATH/realm.json" ]; then
        import_realm "$admin_token" "$BACKUP_PATH/realm.json"
    else
        print_error "Realm configuration file not found: $BACKUP_PATH/realm.json"
        exit 1
    fi
    
    # Import users
    if [ -f "$BACKUP_PATH/users.json" ]; then
        import_users "$admin_token" "$BACKUP_PATH/users.json"
    else
        print_warning "Users file not found: $BACKUP_PATH/users.json"
    fi
    
    # Restore persistent data if available
    if [ -d "$BACKUP_PATH/data" ]; then
        print_status "Restoring persistent data..."
        rm -rf "$PROJECT_ROOT/keycloak-data"
        cp -r "$BACKUP_PATH/data" "$PROJECT_ROOT/keycloak-data"
        print_success "Persistent data restored"
    else
        print_warning "No persistent data found in backup"
    fi
    
    print_success "Restore completed successfully!"
    print_status "Backup restored: $BACKUP_NAME"
    print_status "Keycloak Admin Console: ${KEYCLOAK_URL:-https://localhost:8443}/admin"
}

# Run restore
restore_keycloak 