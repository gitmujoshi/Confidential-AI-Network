#!/bin/bash

# Unified Authentication Fix Script
# This script uses the centralized configuration system
# All configurations come from config/system.env

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/common.sh"
resolve_repo_root

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Load centralized configuration
load_config() {
    print_status "Loading centralized configuration..."
    
    if [ ! -f "scripts/config-loader.js" ]; then
        print_error "Configuration loader not found. Please run from project root."
        exit 1
    fi
    
    # Load configuration using Node.js
    CONFIG_OUTPUT=$(node -e "
        const config = require('./scripts/config-loader');
        console.log(JSON.stringify({
            keycloak: config.getKeycloak(),
            database: config.getDatabase(),
            backend: config.getBackend(),
            docker: config.getDocker(),
            scittCcf: config.getScittCcf()
        }));
    ")
    
    if [ $? -ne 0 ]; then
        print_error "Failed to load configuration"
        exit 1
    fi
    
    # Parse configuration
    KEYCLOAK_URL=$(echo "$CONFIG_OUTPUT" | jq -r '.keycloak.url')
    KEYCLOAK_REALM=$(echo "$CONFIG_OUTPUT" | jq -r '.keycloak.realm')
    KEYCLOAK_ADMIN_USER=$(echo "$CONFIG_OUTPUT" | jq -r '.keycloak.adminUser')
    KEYCLOAK_ADMIN_PASSWORD=$(echo "$CONFIG_OUTPUT" | jq -r '.keycloak.adminPassword')
    KEYCLOAK_CLIENT_ID=$(echo "$CONFIG_OUTPUT" | jq -r '.keycloak.clientId')
    
    DB_HOST=$(echo "$CONFIG_OUTPUT" | jq -r '.database.host')
    DB_PORT=$(echo "$CONFIG_OUTPUT" | jq -r '.database.port')
    DB_NAME=$(echo "$CONFIG_OUTPUT" | jq -r '.database.name')
    DB_USER=$(echo "$CONFIG_OUTPUT" | jq -r '.database.user')
    DB_PASSWORD=$(echo "$CONFIG_OUTPUT" | jq -r '.database.password')
    
    BACKEND_PORT=$(echo "$CONFIG_OUTPUT" | jq -r '.backend.port')
    BACKEND_HOST=$(echo "$CONFIG_OUTPUT" | jq -r '.backend.host')
    
    DOCKER_KEYCLOAK_PORT=$(echo "$CONFIG_OUTPUT" | jq -r '.docker.keycloakPort')
    DOCKER_POSTGRES_PORT=$(echo "$CONFIG_OUTPUT" | jq -r '.docker.postgresPort')
    
    SCITT_CCF_ENABLED=$(echo "$CONFIG_OUTPUT" | jq -r '.scittCcf.enabled')
    SCITT_CCF_URL=$(echo "$CONFIG_OUTPUT" | jq -r '.scittCcf.url')
    
    print_success "Configuration loaded successfully"
    print_status "Keycloak: $KEYCLOAK_URL (realm: $KEYCLOAK_REALM)"
    print_status "Database: $DB_HOST:$DB_PORT/$DB_NAME"
    print_status "Backend: $BACKEND_HOST:$BACKEND_PORT"
    print_status "SCITT CCF: $SCITT_CCF_ENABLED"
}

# Function to check if a service is running
check_service() {
    local service_name=$1
    local port=$2
    local url=$3
    
    if curl -s "$url" > /dev/null 2>&1; then
        print_success "$service_name is running on port $port"
        return 0
    else
        print_warning "$service_name is not running on port $port"
        return 1
    fi
}

# Function to wait for a service to be ready
wait_for_service() {
    local service_name=$1
    local port=$2
    local url=$3
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service_name to be ready..."
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        print_status "   Attempt $attempt/$max_attempts..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start after $max_attempts attempts"
    return 1
}

# Function to start Keycloak
start_keycloak() {
    print_status "Starting Keycloak..."
    
    if ! check_service "Keycloak" "$DOCKER_KEYCLOAK_PORT" "$KEYCLOAK_URL/realms/master"; then
        print_status "Starting Keycloak container..."
        docker-compose -f docker-compose.keycloak-dev.yml up -d keycloak postgres
        
        print_status "Waiting for Keycloak to start..."
        wait_for_service "Keycloak" "$DOCKER_KEYCLOAK_PORT" "$KEYCLOAK_URL/realms/master"
    fi
}

# Function to start SCITT CCF if enabled
start_scitt_ccf() {
    if [ "$SCITT_CCF_ENABLED" = "true" ]; then
        print_status "Starting SCITT CCF services..."
        
        if [ -f "docker-compose.scitt-ccf-dev.yml" ]; then
            docker-compose -f docker-compose.scitt-ccf-dev.yml up -d
            
            print_status "Waiting for SCITT CCF services to start..."
            sleep 10
            
            if check_service "SCITT CCF Node" "8000" "$SCITT_CCF_URL/app/health"; then
                print_success "SCITT CCF services are running"
            else
                print_warning "SCITT CCF services failed to start, continuing with blockchain mode"
            fi
        else
            print_warning "SCITT CCF Docker Compose file not found"
        fi
    fi
}

# Function to fix Keycloak configuration
fix_keycloak_config() {
    print_status "Fixing Keycloak configuration..."
    
    cd backend
    
    # Create a temporary script that uses centralized config
    cat > temp-fix-keycloak.js << EOF
const config = require('../scripts/config-loader');
const axios = require('axios');

class KeycloakAutoFix {
  constructor() {
    this.keycloak = config.getKeycloak();
  }

  async getAdminToken() {
    try {
      const response = await axios.post(\`\${this.keycloak.url}/realms/master/protocol/openid-connect/token\`,
        \`grant_type=password&client_id=admin-cli&username=\${this.keycloak.adminUser}&password=\${this.keycloak.adminPassword}\`,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      return response.data.access_token;
    } catch (error) {
      throw new Error(\`Failed to get admin token: \${error.response?.data?.error_description || error.message}\`);
    }
  }

  async checkRealmExists(token) {
    try {
      const response = await axios.get(\`\${this.keycloak.url}/admin/realms/\${this.keycloak.realm}\`, {
        headers: { 'Authorization': \`Bearer \${token}\` }
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async createRealm(token) {
    console.log('📝 Creating realm...');
    await axios.post(\`\${this.keycloak.url}/admin/realms\`, {
      realm: this.keycloak.realm,
      enabled: true,
      displayName: 'Contract Management System'
    }, {
      headers: { 'Authorization': \`Bearer \${token}\` }
    });
    console.log('✅ Realm created');
  }

  async checkClientExists(token, clientId) {
    try {
      const response = await axios.get(\`\${this.keycloak.url}/admin/realms/\${this.keycloak.realm}/clients\`, {
        headers: { 'Authorization': \`Bearer \${token}\` }
      });
      return response.data.some(client => client.clientId === clientId);
    } catch (error) {
      return false;
    }
  }

  async createFrontendClient(token) {
    console.log('🌐 Creating frontend client...');
    await axios.post(\`\${this.keycloak.url}/admin/realms/\${this.keycloak.realm}/clients\`, {
      clientId: this.keycloak.clientId,
      enabled: true,
      publicClient: true,
      standardFlowEnabled: true,
      directAccessGrantsEnabled: true,
      redirectUris: ['http://localhost:3000/callback', 'http://localhost:3000/*', 'http://localhost:3000'],
      webOrigins: ['http://localhost:3000'],
      fullScopeAllowed: true
    }, {
      headers: { 'Authorization': \`Bearer \${token}\` }
    });
    console.log('✅ Frontend client created');
  }

  async createRoles(token) {
    console.log('👥 Creating roles...');
    const roles = ['TDP', 'TDC', 'TSP', 'ADMIN'];
    
    for (const role of roles) {
      try {
        await axios.post(\`\${this.keycloak.url}/admin/realms/\${this.keycloak.realm}/roles\`, {
          name: role,
          description: \`\${role} role\`
        }, {
          headers: { 'Authorization': \`Bearer \${token}\` }
        });
        console.log(\`   ✅ Role '\${role}' created\`);
      } catch (error) {
        if (error.response?.status === 409) {
          console.log(\`   ✅ Role '\${role}' already exists\`);
        } else {
          console.log(\`   ❌ Failed to create role '\${role}': \${error.message}\`);
        }
      }
    }
  }

  async run() {
    console.log('🔧 Auto-Fixing Keycloak Issues...\\n');
    
    try {
      const token = await this.getAdminToken();
      console.log('✅ Admin token obtained\\n');
      
      const realmExists = await this.checkRealmExists(token);
      if (!realmExists) {
        await this.createRealm(token);
      } else {
        console.log('✅ Realm exists');
      }
      
      const frontendExists = await this.checkClientExists(token, this.keycloak.clientId);
      if (!frontendExists) {
        await this.createFrontendClient(token);
      } else {
        console.log('✅ Frontend client exists');
      }
      
      await this.createRoles(token);
      
      console.log('\\n🎉 Keycloak configuration fixed!');
      
    } catch (error) {
      console.error('❌ Keycloak fix failed:', error.message);
      throw error;
    }
  }
}

const autoFix = new KeycloakAutoFix();
autoFix.run().catch(console.error);
EOF

    node temp-fix-keycloak.js
    rm temp-fix-keycloak.js
    
    cd ..
    print_success "Keycloak configuration fixed"
}

# Function to sync users
sync_users() {
    print_status "Syncing users..."
    
    cd backend
    
    # Create a temporary script that uses centralized config
    cat > temp-sync-users.js << EOF
const config = require('../scripts/config-loader');
const axios = require('axios');
const { User } = require('./models');

const keycloak = config.getKeycloak();

// Configure axios to ignore SSL certificate verification for self-signed certs
const httpsAgent = new (require('https').Agent)({
  rejectUnauthorized: false
});

const axiosInstance = axios.create({
  httpsAgent: httpsAgent
});

async function getKeycloakToken() {
  try {
    const response = await axiosInstance.post(\`\${keycloak.url}/realms/master/protocol/openid-connect/token\`, 
      new URLSearchParams({
        username: keycloak.adminUser,
        password: keycloak.adminPassword,
        grant_type: 'password',
        client_id: 'admin-cli'
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
    
    return response.data.access_token;
  } catch (error) {
    console.error('❌ Failed to get Keycloak token:', error.response?.data || error.message);
    throw error;
  }
}

async function syncUsersToKeycloak() {
  try {
    const token = await getKeycloakToken();
    const users = await User.findAll();
    
    console.log(\`Found \${users.length} users to sync\`);
    
    for (const user of users) {
      try {
        // Check if user exists in Keycloak
        const usersResponse = await axiosInstance.get(
          \`\${keycloak.url}/admin/realms/\${keycloak.realm}/users?username=\${encodeURIComponent(user.email)}\`,
          {
            headers: {
              'Authorization': \`Bearer \${token}\`
            }
          }
        );
        
        if (usersResponse.data && usersResponse.data.length > 0) {
          console.log(\`✅ User \${user.email} already exists in Keycloak\`);
        } else {
          // Create user in Keycloak
          const keycloakUser = {
            username: user.email,
            email: user.email,
            firstName: user.name.split(' ')[0] || user.name,
            lastName: user.name.split(' ').slice(1).join(' ') || '',
            enabled: true,
            emailVerified: true,
            attributes: {
              partyType: [user.partyType],
              organization: [user.name]
            }
          };
          
          await axiosInstance.post(
            \`\${keycloak.url}/admin/realms/\${keycloak.realm}/users\`,
            keycloakUser,
            {
              headers: {
                'Authorization': \`Bearer \${token}\`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          console.log(\`✅ User \${user.email} created in Keycloak\`);
        }
      } catch (error) {
        console.error(\`❌ Failed to sync user \${user.email}:\`, error.message);
      }
    }
    
    console.log('✅ User sync completed');
  } catch (error) {
    console.error('❌ User sync failed:', error.message);
    throw error;
  }
}

syncUsersToKeycloak().catch(console.error);
EOF

    node temp-sync-users.js
    rm temp-sync-users.js
    
    cd ..
    print_success "Users synced"
}

# Function to restart backend
restart_backend() {
    print_status "Restarting backend..."
    
    pkill -f "node server.js" || true
    sleep 2
    
    cd backend
    node server.js &
    cd ..
    
    print_status "Waiting for backend to start..."
    wait_for_service "Backend" "$BACKEND_PORT" "http://$BACKEND_HOST:$BACKEND_PORT/health"
}

# Function to test authentication
test_authentication() {
    print_status "Testing authentication..."
    
    TEST_RESULT=$(curl -s -X POST "http://$BACKEND_HOST:$BACKEND_PORT/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"tdc-test@example.com","password":"password123"}' \
        | jq -r '.message // .error // "Unknown error"')
    
    if [ "$TEST_RESULT" = "Login successful" ]; then
        print_success "Authentication is working!"
        return 0
    else
        print_error "Authentication test failed: $TEST_RESULT"
        return 1
    fi
}

# Main function
main() {
    echo "🔧 Unified Authentication Fix Script"
    echo "===================================="
    echo "Using centralized configuration system"
    echo ""
    
    # Load configuration
    load_config
    
    # Step 1: Start Keycloak
    start_keycloak
    
    # Step 2: Start SCITT CCF if enabled
    start_scitt_ccf
    
    # Step 3: Fix Keycloak configuration
    fix_keycloak_config
    
    # Step 4: Sync users
    sync_users
    
    # Step 5: Restart backend
    restart_backend
    
    # Step 6: Test authentication
    if test_authentication; then
        print_success "All authentication issues fixed!"
        echo ""
        print_status "Available test users:"
        echo "   TDC: tdc-test@example.com / password123"
        echo "   TDP: tdp-test@example.com / password123"
        echo "   TSP: tsp-test@example.com / password123"
        echo "   AppAdmin: appadmin-test@example.com / password123"
        
        if [ "$SCITT_CCF_ENABLED" = "true" ]; then
            echo ""
            print_status "SCITT CCF Integration:"
            echo "   Migration Mode: HYBRID (both blockchain and SCITT CCF)"
            echo "   Test Integration: ./manage-scitt-ccf.sh test"
        fi
    else
        print_error "Authentication still failing"
        echo ""
        print_status "Try running this command again, or manually restart the backend:"
        echo "   pkill -f 'node server.js' && cd backend && node server.js &"
    fi
}

# Run main function
main "$@"
