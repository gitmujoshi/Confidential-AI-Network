#!/bin/bash

# Centralized Configuration Loader
# Loads both config.env and secrets.env for consistent configuration across all scripts and services

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Function to load configuration files
load_config() {
    local config_loaded=false
    local secrets_loaded=false
    
    # Load main configuration
    if [ -f "config.env" ]; then
        source config.env
        config_loaded=true
        echo -e "${GREEN}✅ Loaded main configuration from config.env${NC}"
    else
        echo -e "${RED}❌ config.env not found${NC}"
        return 1
    fi
    
    # Load secrets configuration
    if [ -f "secrets.env" ]; then
        source secrets.env
        secrets_loaded=true
        echo -e "${GREEN}✅ Loaded secrets from secrets.env${NC}"
    else
        echo -e "${YELLOW}⚠️ secrets.env not found - using default values${NC}"
    fi
    
    # Set default values for missing secrets
    DB_PASSWORD=${DB_PASSWORD:-"postgres"}
    POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-"postgres"}
    KEYCLOAK_DB_PASSWORD=${KEYCLOAK_DB_PASSWORD:-"keycloak"}
    JWT_SECRET=${JWT_SECRET:-"your-super-secret-jwt-key-change-in-production"}
    KEYCLOAK_CLIENT_SECRET=${KEYCLOAK_CLIENT_SECRET:-"elyMs5qenxOEbjIyXGKPYdqFea6beW8N"}
    KEYCLOAK_ADMIN_PASSWORD=${KEYCLOAK_ADMIN_PASSWORD:-"admin123"}
    EMAIL_PASS=${EMAIL_PASS:-"your-app-password"}
    VAULT_TOKEN=${VAULT_TOKEN:-"hvs.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"}
    
    # Set derived configuration values
    BACKEND_URL=${BACKEND_URL:-"http://localhost:${PORT:-5001}"}
    FRONTEND_URL=${FRONTEND_URL:-"http://localhost:${FRONTEND_PORT:-3000}"}
    KEYCLOAK_URL=${KEYCLOAK_URL:-"https://localhost:${KEYCLOAK_PORT:-8443}"}
    
    
    # Export all variables for use in child processes
    export DB_HOST DB_PORT DB_NAME DB_USER DB_PASSWORD POSTGRES_PASSWORD
    export PORT NODE_ENV JWT_SECRET JWT_EXPIRES_IN
    export KEYCLOAK_URL KEYCLOAK_PORT KEYCLOAK_REALM KEYCLOAK_CLIENT_ID KEYCLOAK_CLIENT_SECRET
    export KEYCLOAK_ADMIN_USER KEYCLOAK_ADMIN_PASSWORD KEYCLOAK_ENABLED KEYCLOAK_HEALTH_URL
    export KEYCLOAK_DB_PASSWORD
    export EMAIL_HOST EMAIL_PORT EMAIL_USER EMAIL_PASS EMAIL_FROM
    export BLOCKCHAIN_ENABLED BLOCKCHAIN_NETWORK BLOCKCHAIN_RPC_URL CONTRACT_ADDRESS
    export SCITT_CCF_ENABLED SCITT_CCF_URL SCITT_CCF_NODE_URL SCITT_CCF_DASHBOARD_URL
    export DID_WEB_DOMAIN DID_WEB_PATH DEPA_ENABLED DEPA_BASE_URL
    export LOG_LEVEL CORS_ORIGIN RATE_LIMIT_WINDOW_MS RATE_LIMIT_MAX_REQUESTS
    export VAULT_ADDR VAULT_TOKEN
    export REDIS_PORT FRONTEND_HEALTH_URL MAILHOG_SMTP_PORT MAILHOG_WEB_PORT
    export NGINX_HTTP_PORT NGINX_HTTPS_PORT KEYCLOAK_DB_PORT BACKEND_PORT FRONTEND_PORT
    export BACKEND_URL FRONTEND_URL
    
    if [ "$config_loaded" = true ]; then
        return 0
    else
        return 1
    fi
}

# Function to validate required configuration
validate_config() {
    local missing_vars=()
    
    # Check required variables
    local required_vars=(
        "DB_HOST" "DB_PORT" "DB_NAME" "DB_USER" "DB_PASSWORD"
        "PORT" "NODE_ENV"
        "KEYCLOAK_URL" "KEYCLOAK_REALM" "KEYCLOAK_CLIENT_ID"
        "BACKEND_URL" "FRONTEND_URL"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        echo -e "${RED}❌ Missing required configuration variables:${NC}"
        printf '%s\n' "${missing_vars[@]}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Configuration validation passed${NC}"
    return 0
}

# Function to show current configuration (without secrets)
show_config() {
    echo -e "${BLUE}📋 Current Configuration:${NC}"
    echo "=================================="
    echo "Database: ${DB_HOST}:${DB_PORT}/${DB_NAME}"
    echo "Backend: ${BACKEND_URL}"
    echo "Frontend: ${FRONTEND_URL}"
    echo "Keycloak: ${KEYCLOAK_URL}/${KEYCLOAK_REALM}"
    echo "SCITT CCF: ${SCITT_CCF_ENABLED:-false} (${SCITT_CCF_URL:-N/A})"
    echo "Blockchain: ${BLOCKCHAIN_ENABLED:-false}"
    echo "DEPA: ${DEPA_ENABLED:-false}"
    echo "Environment: ${NODE_ENV}"
    echo "=================================="
}

# Always load configuration when sourced
load_config

# Main execution
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    # If script is run directly, also validate and show config
    validate_config
    show_config
fi
