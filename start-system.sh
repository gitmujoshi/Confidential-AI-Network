#!/bin/bash

# Simplified Contract Management System Startup Script
# This script removes all the dead code and complex logic

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Contract Management System (Simplified)${NC}"

# Load centralized configuration
load_centralized_config() {
    if [ -f "config.env" ]; then
        echo "✅ Loading centralized configuration from config.env"
        source config.env
        echo "🔗 SCITT CCF Mode: ${SCITT_CCF_ENABLED}"
    else
        echo "❌ Centralized configuration file not found: config.env"
        echo "⚠️ Please ensure config.env exists"
        return 1
    fi
    
    if [ -f "secrets.env" ]; then
        echo "✅ Loading secrets from secrets.env"
        source secrets.env
    else
        echo "⚠️ Secrets file not found: secrets.env"
    fi
    
    # Export all variables for Docker Compose
    export DB_HOST DB_PORT DB_NAME DB_USER DB_PASSWORD POSTGRES_PASSWORD
    export PORT NODE_ENV JWT_SECRET JWT_EXPIRES_IN
    export KEYCLOAK_URL KEYCLOAK_PORT KEYCLOAK_REALM KEYCLOAK_CLIENT_ID KEYCLOAK_CLIENT_SECRET
    export KEYCLOAK_ADMIN_USER KEYCLOAK_ADMIN_PASSWORD KEYCLOAK_ENABLED KEYCLOAK_HEALTH_URL
    export KEYCLOAK_DB_PASSWORD
    export EMAIL_HOST EMAIL_PORT EMAIL_USER EMAIL_PASS EMAIL_FROM
    export BLOCKCHAIN_ENABLED BLOCKCHAIN_NETWORK BLOCKCHAIN_RPC_URL CONTRACT_ADDRESS
    export SCITT_CCF_ENABLED SCITT_CCF_URL SCITT_CCF_NODE_URL SCITT_CCF_DASHBOARD_URL
    export DID_WEB_DOMAIN DID_WEB_PATH DEPA_ENABLED DEPA_BASE_URL
    # Ensure DEPA ID prefix is available to the backend/node process
    export DEPLOYMENT_PREFIX DEPLOYMENT_ID DEPLOYMENT_REGION DEPLOYMENT_COUNTRY DEPLOYMENT_JURISDICTION
    export LOG_LEVEL CORS_ORIGIN RATE_LIMIT_WINDOW_MS RATE_LIMIT_MAX_REQUESTS
    export VAULT_ADDR VAULT_TOKEN
    export REDIS_PORT FRONTEND_HEALTH_URL MAILHOG_SMTP_PORT MAILHOG_WEB_PORT
    export NGINX_HTTP_PORT NGINX_HTTPS_PORT KEYCLOAK_DB_PORT BACKEND_PORT FRONTEND_PORT
    export BACKEND_URL FRONTEND_URL
}

# Load configuration
if ! load_centralized_config; then
    echo "❌ Configuration load failed, using defaults"
    SCITT_CCF_ENABLED=false
fi

echo ""
echo -e "${BLUE}🔐 Step 1: Starting databases and Keycloak...${NC}"

# Start application database
echo "   Starting application database..."
docker-compose -f docker-compose.dev.yml up -d postgres-app

# Start Keycloak database and Keycloak
if [[ "$KEYCLOAK_URL" == https://* ]]; then
    echo "   Starting Keycloak with HTTPS configuration..."
    docker-compose -f docker-compose.keycloak-https.yml up -d
else
    echo "   Starting Keycloak with HTTP configuration..."
    docker-compose -f docker-compose.keycloak-dev.yml up -d
fi

# Wait for Keycloak to be ready
echo "⏳ Waiting for Keycloak to be ready..."
for i in {1..30}; do
    if curl -k -s "${KEYCLOAK_URL}/realms/master" > /dev/null 2>&1; then
        echo "✅ Keycloak is ready!"
        break
    fi
    echo "   Attempt $i/30..."
    sleep 2
done

echo ""
echo -e "${BLUE}🔧 Step 2: Keycloak configuration...${NC}"
echo "✅ Using existing Keycloak configuration (persistent setup)"

echo ""
echo -e "${BLUE}🔗 Step 3: Starting SCITT CCF services (if enabled)...${NC}"

# Start SCITT CCF services if enabled
if [ "$SCITT_CCF_ENABLED" = true ]; then
    echo "🚀 Starting SCITT CCF services..."
    if [ -f "manage-scitt-ccf.sh" ]; then
        chmod +x manage-scitt-ccf.sh
        if ./manage-scitt-ccf.sh start; then
            echo "✅ SCITT CCF services started successfully"
        else
            echo "❌ SCITT CCF services failed to start - this is a critical error"
            echo "   The system requires SCITT CCF services to be running"
            exit 1
        fi
    else
        echo "❌ manage-scitt-ccf.sh not found - this is a critical error"
        echo "   The system requires SCITT CCF management script"
        exit 1
    fi
else
    echo "ℹ️  SCITT CCF services disabled"
fi

echo ""
echo -e "${BLUE}🚀 Step 4: Starting backend and frontend...${NC}"

# Stop any previously started local processes (this script uses nohup).
stop_if_running() {
    local pid_file="$1"
    local label="$2"
    if [ -f "$pid_file" ]; then
        local pid
        pid="$(cat "$pid_file" 2>/dev/null || true)"
        if [ -n "$pid" ] && kill -0 "$pid" >/dev/null 2>&1; then
            echo "   Stopping existing $label (pid $pid)..."
            kill "$pid" >/dev/null 2>&1 || true
            # Give it a moment, then force kill if still alive
            sleep 1
            if kill -0 "$pid" >/dev/null 2>&1; then
                kill -9 "$pid" >/dev/null 2>&1 || true
            fi
        fi
        rm -f "$pid_file" >/dev/null 2>&1 || true
    fi
}

mkdir -p logs >/dev/null 2>&1 || true
stop_if_running "logs/backend.pid" "backend"
stop_if_running "logs/frontend.pid" "frontend"

# Also kill anything currently listening on the ports (covers processes not started by this script).
kill_port_listener() {
    local port="$1"
    local label="$2"
    if [ -z "$port" ]; then
        return 0
    fi
    local pid
    pid="$(lsof -t -iTCP:${port} -sTCP:LISTEN 2>/dev/null | head -n 1 || true)"
    if [ -n "$pid" ]; then
        echo "   Stopping $label listening on port $port (pid $pid)..."
        kill "$pid" >/dev/null 2>&1 || true
        sleep 1
        if kill -0 "$pid" >/dev/null 2>&1; then
            kill -9 "$pid" >/dev/null 2>&1 || true
        fi
    fi
}

kill_port_listener "${BACKEND_PORT:-5001}" "backend"
kill_port_listener "${FRONTEND_PORT:-3000}" "frontend"

# Start backend
echo "   Starting backend server..."
cd backend
nohup npm start > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Start frontend
echo "   Starting frontend server..."
cd frontend
nohup npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait a moment for services to start
sleep 5

# Store PIDs for later reference
echo $BACKEND_PID > logs/backend.pid
echo $FRONTEND_PID > logs/frontend.pid

echo ""
echo -e "${GREEN}✅ System startup completed!${NC}"
echo ""
echo -e "${BLUE}🔗 Quick Access:${NC}"
