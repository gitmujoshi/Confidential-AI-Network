#!/bin/bash

# Persistent Keycloak Setup Script
# This script sets up Keycloak configuration and saves it for persistence

set -e

echo "🔧 Setting up persistent Keycloak configuration..."

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

# Function to wait for Keycloak to be ready
wait_for_***REMOVED-KEYCLOAK_DB_PASSWORD***() {
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

# Function to check if realm exists
check_realm_exists() {
    local admin_token=$1
    local realm_name=$2
    
    local response=$(curl -k -s -X GET "${KEYCLOAK_URL:-https://localhost:8443}/admin/realms/$realm_name" \
        -H "Authorization: Bearer $admin_token" \
        -H "Content-Type: application/json" 2>/dev/null || echo "NOT_FOUND")
    
    if [[ "$response" == *"NOT_FOUND"* ]] || [[ "$response" == *"404"* ]]; then
        return 1  # Realm doesn't exist
    else
        return 0  # Realm exists
    fi
}

# Function to get admin token
get_admin_token() {
    local response=$(curl -k -s -X POST "${KEYCLOAK_URL:-https://localhost:8443}/realms/master/protocol/openid-connect/token" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "grant_type=password&client_id=admin-cli&username=${KEYCLOAK_ADMIN_USER:-admin}&password=${KEYCLOAK_ADMIN_PASSWORD:-***REMOVED-KEYCLOAK_ADMIN_PASSWORD***}")
    
    echo "$response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4
}

# Main setup function
setup_***REMOVED-KEYCLOAK_DB_PASSWORD***() {
    print_status "Setting up Keycloak configuration..."
    
    # Wait for Keycloak to be ready
    if ! wait_for_***REMOVED-KEYCLOAK_DB_PASSWORD***; then
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
    
    # Check if realm already exists
    if check_realm_exists "$admin_token" "contract-management"; then
        print_warning "Realm 'contract-management' already exists. Skipping realm creation."
    else
        print_status "Creating realm 'contract-management'..."
        
        # Create realm
        local realm_response=$(curl -s -X POST "http://localhost:8080/admin/realms" \
            -H "Authorization: Bearer $admin_token" \
            -H "Content-Type: application/json" \
            -d '{
                "realm": "contract-management",
                "enabled": true,
                "displayName": "Contract Management",
                "displayNameHtml": "<div class=\"kc-logo-text\"><span>Contract Management</span></div>"
            }')
        
        if [[ "$realm_response" == *"409"* ]]; then
            print_warning "Realm already exists"
        elif [[ "$realm_response" == *"201"* ]] || [[ "$realm_response" == "" ]]; then
            print_success "Realm created successfully"
        else
            print_error "Failed to create realm: $realm_response"
            exit 1
        fi
    fi
    
    # Check if client exists
    local client_response=$(curl -s -X GET "http://localhost:8080/admin/realms/contract-management/clients?clientId=contract-management-client" \
        -H "Authorization: Bearer $admin_token" \
        -H "Content-Type: application/json")
    
    if [[ "$client_response" == "[]" ]]; then
        print_status "Creating client 'contract-management-client'..."
        
        # Create client
        local create_client_response=$(curl -s -X POST "http://localhost:8080/admin/realms/contract-management/clients" \
            -H "Authorization: Bearer $admin_token" \
            -H "Content-Type: application/json" \
            -d '{
                "clientId": "contract-management-client",
                "enabled": true,
                "publicClient": true,
                "standardFlowEnabled": true,
                "directAccessGrantsEnabled": true,
                "serviceAccountsEnabled": true,
                "redirectUris": ["http://localhost:3000/*", "http://localhost:3001/*"],
                "webOrigins": ["http://localhost:3000", "http://localhost:3001"]
            }')
        
        if [[ "$create_client_response" == *"409"* ]]; then
            print_warning "Client already exists"
        elif [[ "$create_client_response" == *"201"* ]] || [[ "$create_client_response" == "" ]]; then
            print_success "Client created successfully"
        else
            print_error "Failed to create client: $create_client_response"
            exit 1
        fi
    else
        print_warning "Client 'contract-management-client' already exists. Skipping client creation."
    fi
    
    # Create roles
    local roles=("TDP" "TDC" "CCRP" "AppAdmin")
    
    for role in "${roles[@]}"; do
        print_status "Creating role '$role'..."
        
        local role_response=$(curl -s -X POST "http://localhost:8080/admin/realms/contract-management/roles" \
            -H "Authorization: Bearer $admin_token" \
            -H "Content-Type: application/json" \
            -d "{\"name\": \"$role\"}")
        
        if [[ "$role_response" == *"409"* ]]; then
            print_warning "Role '$role' already exists"
        elif [[ "$role_response" == *"201"* ]] || [[ "$role_response" == "" ]]; then
            print_success "Role '$role' created"
        else
            print_error "Failed to create role '$role': $role_response"
        fi
    done
    
    print_success "Keycloak setup completed!"
    print_status "Realm: contract-management"
    print_status "Admin Console: http://localhost:8080"
    print_status "Admin Username: admin"
    print_status "Admin Password: ***REMOVED-KEYCLOAK_ADMIN_PASSWORD***"
}

# Run setup
setup_***REMOVED-KEYCLOAK_DB_PASSWORD*** 