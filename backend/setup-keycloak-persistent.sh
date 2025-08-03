#!/bin/bash

# Keycloak Persistent Setup Script
# This script ensures Keycloak configuration persists across restarts

set -e

echo "🔧 Setting up Keycloak with persistent configuration..."

# Check if Keycloak is running
if ! curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo "❌ Keycloak is not running. Please start Keycloak first."
    echo "   Run: docker-compose up -d keycloak"
    exit 1
fi

# Wait for Keycloak to be ready
echo "⏳ Waiting for Keycloak to be ready..."
until curl -s http://localhost:8080/health > /dev/null 2>&1; do
    sleep 2
done

# Get admin token
echo "🔑 Getting admin token..."
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \
    -d "grant_type=password&client_id=admin-cli&username=admin&password=admin123" \
    | jq -r '.access_token')

if [ "$ADMIN_TOKEN" = "null" ] || [ -z "$ADMIN_TOKEN" ]; then
    echo "❌ Failed to get admin token"
    exit 1
fi

echo "✅ Admin token obtained"

# Check if realm exists
REALM_EXISTS=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
    http://localhost:8080/admin/realms/contract-management | jq -r '.realm')

if [ "$REALM_EXISTS" = "contract-management" ]; then
    echo "✅ Realm 'contract-management' already exists"
else
    echo "📝 Creating realm 'contract-management'..."
    curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "realm": "contract-management",
            "enabled": true,
            "displayName": "Contract Management System",
            "displayNameHtml": "<div class=\"kc-logo-text\"><span>Contract Management</span></div>",
            "attributes": {
                "frontendUrl": "http://localhost:3000"
            }
        }' \
        http://localhost:8080/admin/realms
    echo "✅ Realm created"
fi

# Create roles
echo "👥 Creating roles..."
ROLES=("TDP" "TDC" "CCRP" "ADMIN")

for ROLE in "${ROLES[@]}"; do
    ROLE_EXISTS=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
        "http://localhost:8080/admin/realms/contract-management/roles/$ROLE" | jq -r '.name')
    
    if [ "$ROLE_EXISTS" = "$ROLE" ]; then
        echo "   ✅ Role '$ROLE' already exists"
    else
        curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{\"name\":\"$ROLE\",\"description\":\"$ROLE role\"}" \
            http://localhost:8080/admin/realms/contract-management/roles
        echo "   ✅ Role '$ROLE' created"
    fi
done

# Create frontend client
echo "🌐 Setting up frontend client..."
FRONTEND_CLIENT_EXISTS=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
    http://localhost:8080/admin/realms/contract-management/clients | \
    jq -r '.[] | select(.clientId == "contract-management-frontend") | .clientId')

if [ "$FRONTEND_CLIENT_EXISTS" = "contract-management-frontend" ]; then
    echo "   ✅ Frontend client already exists"
else
    curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "clientId": "contract-management-frontend",
            "enabled": true,
            "publicClient": true,
            "standardFlowEnabled": true,
            "directAccessGrantsEnabled": true,
            "redirectUris": ["http://localhost:3000/callback", "http://localhost:3000/*", "http://localhost:3000"],
            "webOrigins": ["http://localhost:3000"],
            "fullScopeAllowed": true
        }' \
        http://localhost:8080/admin/realms/contract-management/clients
    echo "   ✅ Frontend client created"
fi

# Create backend client
echo "🔧 Setting up backend client..."
BACKEND_CLIENT_EXISTS=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
    http://localhost:8080/admin/realms/contract-management/clients | \
    jq -r '.[] | select(.clientId == "contract-management-backend") | .clientId')

if [ "$BACKEND_CLIENT_EXISTS" = "contract-management-backend" ]; then
    echo "   ✅ Backend client already exists"
else
    curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "clientId": "contract-management-backend",
            "enabled": true,
            "publicClient": false,
            "clientAuthenticatorType": "client-secret",
            "serviceAccountsEnabled": true,
            "directAccessGrantsEnabled": true,
            "fullScopeAllowed": true
        }' \
        http://localhost:8080/admin/realms/contract-management/clients
    echo "   ✅ Backend client created"
fi

# Update environment files
echo "📝 Updating environment files..."

# Update config.env (used by backend)
cat > config.env << EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=contract_management
DB_USER=postgres
DB_PASSWORD=postgres

# Server Configuration
PORT=5001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# Keycloak Configuration
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=contract-management
KEYCLOAK_CLIENT_ID=contract-management-frontend
KEYCLOAK_CLIENT_SECRET=
KEYCLOAK_ADMIN_USER=admin
KEYCLOAK_ADMIN_PASSWORD=admin123
KEYCLOAK_ENABLED=true

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# Blockchain Configuration
BLOCKCHAIN_ENABLED=true
BLOCKCHAIN_NETWORK=localhost
BLOCKCHAIN_RPC_URL=http://localhost:8545
CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

# DID Configuration
DID_WEB_DOMAIN=localhost:3000
DID_WEB_PATH=/did.json

# DEPA Configuration
DEPA_ENABLED=true
DEPA_BASE_URL=http://localhost:3000

# Logging
LOG_LEVEL=info

# Security
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Vault Configuration
VAULT_ADDR=http://localhost:8200
VAULT_TOKEN=hvs.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EOF

# Update .env (for reference)
cat > .env << EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=contract_management
DB_USER=postgres
DB_PASSWORD=postgres

# Server Configuration
PORT=5001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# Keycloak Configuration
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=contract-management
KEYCLOAK_CLIENT_ID=contract-management-frontend
KEYCLOAK_CLIENT_SECRET=
KEYCLOAK_ADMIN_USER=admin
KEYCLOAK_ADMIN_PASSWORD=admin123
KEYCLOAK_ENABLED=true

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# Blockchain Configuration
BLOCKCHAIN_ENABLED=true
BLOCKCHAIN_NETWORK=localhost
BLOCKCHAIN_RPC_URL=http://localhost:8545
CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

# DID Configuration
DID_WEB_DOMAIN=localhost:3000
DID_WEB_PATH=/did.json

# DEPA Configuration
DEPA_ENABLED=true
DEPA_BASE_URL=http://localhost:3000

# Logging
LOG_LEVEL=info

# Security
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Vault Configuration
VAULT_ADDR=http://localhost:8200
VAULT_TOKEN=hvs.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EOF

echo "✅ Environment files updated"

# Sync users
echo "🔄 Syncing users to Keycloak..."
node scripts/source/sync-users-to-keycloak.js

echo ""
echo "🎉 Keycloak setup completed successfully!"
echo ""
echo "📋 Configuration Summary:"
echo "   Realm: contract-management"
echo "   Frontend Client: contract-management-frontend"
echo "   Backend Client: contract-management-backend"
echo "   Roles: TDP, TDC, CCRP, ADMIN"
echo ""
echo "🔗 Access URLs:"
echo "   Keycloak Admin: http://localhost:8080/admin/"
echo "   Login: http://localhost:8080/realms/contract-management/protocol/openid-connect/auth"
echo ""
echo "✅ Keycloak configuration is now persistent!" 