#!/bin/bash

# Fresh System Setup Script
# This script sets up the entire Contract Management System from scratch

set -e

echo "🚀 Setting up Fresh Contract Management System..."

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

# Step 1: Start fresh database and Keycloak
print_status "Step 1: Starting fresh database and Keycloak..."
if docker-compose -f docker-compose.fresh-setup.yml up -d; then
    print_success "Database and Keycloak started"
else
    print_error "Failed to start database and Keycloak"
    exit 1
fi

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 20

# Step 2: Test database connections
print_status "Step 2: Testing database connections..."
if docker exec ***REMOVED-DB_PASSWORD***-app psql -U ***REMOVED-DB_PASSWORD*** -d contract_management -c "SELECT 'App DB OK' as status;" > /dev/null 2>&1; then
    print_success "Application database connection OK"
else
    print_error "Application database connection failed"
    exit 1
fi

if docker exec ***REMOVED-DB_PASSWORD***-***REMOVED-KEYCLOAK_DB_PASSWORD*** psql -U ***REMOVED-KEYCLOAK_DB_PASSWORD*** -d ***REMOVED-KEYCLOAK_DB_PASSWORD*** -c "SELECT 'Keycloak DB OK' as status;" > /dev/null 2>&1; then
    print_success "Keycloak database connection OK"
else
    print_error "Keycloak database connection failed"
    exit 1
fi

# Step 3: Setup Keycloak configuration
print_status "Step 3: Setting up Keycloak configuration..."
cd backend

# Create a simple Keycloak setup script that works with the current setup
cat > setup-***REMOVED-KEYCLOAK_DB_PASSWORD***-simple.js << 'EOF'
const axios = require('axios');

// Configure axios to ignore SSL certificate verification
const httpsAgent = new (require('https').Agent)({
  rejectUnauthorized: false
});

const axiosInstance = axios.create({
  httpsAgent: httpsAgent
});

const KEYCLOAK_BASE_URL = 'https://localhost:8443';

async function setupKeycloak() {
  try {
    console.log('🔑 Getting admin token...');
    
    // Get admin token
    const tokenResponse = await axiosInstance.post(`${KEYCLOAK_BASE_URL}/realms/master/protocol/openid-connect/token`, 
      new URLSearchParams({
        username: 'admin',
        password: '***REMOVED-KEYCLOAK_ADMIN_PASSWORD***',
        grant_type: 'password',
        client_id: 'admin-cli'
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    const adminToken = tokenResponse.data.access_token;
    console.log('✅ Admin token obtained');
    
    // Create realm
    console.log('📝 Creating realm...');
    try {
      await axiosInstance.post(`${KEYCLOAK_BASE_URL}/admin/realms`, {
        realm: 'contract-management',
        enabled: true,
        displayName: 'Contract Management System',
        displayNameHtml: '<div class="kc-logo-text"><span>Contract Management</span></div>'
      }, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Realm created');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️ Realm already exists');
      } else {
        throw error;
      }
    }
    
    // Create roles
    console.log('👥 Creating roles...');
    const roles = ['TDP', 'TDC', 'CCRP', 'ADMIN'];
    for (const role of roles) {
      try {
        await axiosInstance.post(`${KEYCLOAK_BASE_URL}/admin/realms/contract-management/roles`, {
          name: role,
          description: `${role} role`
        }, {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        });
        console.log(`   ✅ Role ${role} created`);
      } catch (error) {
        if (error.response?.status === 409) {
          console.log(`   ℹ️ Role ${role} already exists`);
        } else {
          console.log(`   ⚠️ Failed to create role ${role}: ${error.message}`);
        }
      }
    }
    
    // Create frontend client
    console.log('🌐 Creating frontend client...');
    try {
      await axiosInstance.post(`${KEYCLOAK_BASE_URL}/admin/realms/contract-management/clients`, {
        clientId: 'contract-management-frontend',
        enabled: true,
        publicClient: true,
        standardFlowEnabled: true,
        directAccessGrantsEnabled: true,
        redirectUris: ['http://localhost:3000/callback', 'http://localhost:3000/*', 'http://localhost:3000'],
        webOrigins: ['http://localhost:3000'],
        fullScopeAllowed: true
      }, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Frontend client created');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️ Frontend client already exists');
      } else {
        console.log(`⚠️ Failed to create frontend client: ${error.message}`);
      }
    }
    
    console.log('🎉 Keycloak setup completed!');
    
  } catch (error) {
    console.error('❌ Keycloak setup failed:', error.message);
    throw error;
  }
}

setupKeycloak();
EOF

# Run the Keycloak setup
if node setup-***REMOVED-KEYCLOAK_DB_PASSWORD***-simple.js; then
    print_success "Keycloak setup completed"
else
    print_warning "Keycloak setup had issues, continuing..."
fi

# Step 4: Run database migrations
print_status "Step 4: Running database migrations..."
# Create tables directly using SQL commands
echo "🔧 Creating database tables..."

# Users table
docker exec ***REMOVED-DB_PASSWORD***-app psql -U ***REMOVED-DB_PASSWORD*** -d contract_management -c "
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  party_type VARCHAR(50) NOT NULL,
  organization VARCHAR(255),
  wallet_address VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);" > /dev/null 2>&1
echo "✅ Users table created"

# Datasets table
docker exec ***REMOVED-DB_PASSWORD***-app psql -U ***REMOVED-DB_PASSWORD*** -d contract_management -c "
CREATE TABLE IF NOT EXISTS datasets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  data_type VARCHAR(100),
  size VARCHAR(50),
  record_count INTEGER,
  confidentiality VARCHAR(50),
  price DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'ACTIVE',
  user_id INTEGER REFERENCES users(id),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);" > /dev/null 2>&1
echo "✅ Datasets table created"

# AI Models table
docker exec ***REMOVED-DB_PASSWORD***-app psql -U ***REMOVED-DB_PASSWORD*** -d contract_management -c "
CREATE TABLE IF NOT EXISTS ai_models (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  model_type VARCHAR(100),
  architecture VARCHAR(100),
  accuracy DECIMAL(3,2),
  price DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'ACTIVE',
  user_id INTEGER REFERENCES users(id),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);" > /dev/null 2>&1
echo "✅ AI Models table created"

# Contract Templates table
docker exec ***REMOVED-DB_PASSWORD***-app psql -U ***REMOVED-DB_PASSWORD*** -d contract_management -c "
CREATE TABLE IF NOT EXISTS contract_templates (
  id SERIAL PRIMARY KEY,
  template_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  terms TEXT,
  is_active BOOLEAN DEFAULT true,
  contract_type VARCHAR(100),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);" > /dev/null 2>&1
echo "✅ Contract Templates table created"

# Contracts table
docker exec ***REMOVED-DB_PASSWORD***-app psql -U ***REMOVED-DB_PASSWORD*** -d contract_management -c "
CREATE TABLE IF NOT EXISTS contracts (
  id SERIAL PRIMARY KEY,
  contract_id VARCHAR(255) UNIQUE NOT NULL,
  tdp_id INTEGER REFERENCES users(id),
  tdc_id INTEGER REFERENCES users(id),
  ccrp_id INTEGER REFERENCES users(id),
  dataset_id INTEGER REFERENCES datasets(id),
  model_id INTEGER REFERENCES ai_models(id),
  template_id VARCHAR(255) REFERENCES contract_templates(template_id),
  price DECIMAL(10,2),
  duration INTEGER,
  terms_and_conditions TEXT,
  status VARCHAR(50) DEFAULT 'PENDING_TDP_APPROVAL',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);" > /dev/null 2>&1
echo "✅ Contracts table created"

print_success "Database migrations completed"

# Step 5: Create test data directly in the database
print_status "Step 5: Creating test data..."
echo "🔧 Creating test data directly in database..."

# Create test users
echo "👥 Creating test users..."
docker exec ***REMOVED-DB_PASSWORD***-app psql -U ***REMOVED-DB_PASSWORD*** -d contract_management -c "
INSERT INTO users (name, email, party_type, organization, wallet_address, is_active) VALUES
('System Administrator', 'admin@contractmanagement.com', 'ADMIN', 'Contract Management System', '0x1234567890123456789012345678901234567890', true),
('Healthcare Data Corp', 'healthcare@tdp.com', 'TDP', 'Healthcare Data Corporation', '0x1111111111111111111111111111111111111111', true),
('Financial Analytics Inc', 'finance@tdp.com', 'TDP', 'Financial Analytics Incorporated', '0x2222222222222222222222222222222222222222', true),
('Retail Insights Ltd', 'retail@tdp.com', 'TDP', 'Retail Insights Limited', '0x3333333333333333333333333333333333333333', true),
('AI Research Institute', 'research@tdc.com', 'TDC', 'AI Research Institute', '0x4444444444444444444444444444444444444444', true),
('Tech Startup Co', 'tech@tdc.com', 'TDC', 'Tech Startup Company', '0x5555555555555555555555555555555555555555', true),
('Secure Compute Solutions', 'secure@ccrp.com', 'CCRP', 'Secure Compute Solutions', '0x6666666666666666666666666666666666666666', true),
('Privacy First Computing', 'privacy@ccrp.com', 'CCRP', 'Privacy First Computing', '0x7777777777777777777777777777777777777777', true)
ON CONFLICT (email) DO NOTHING;" > /dev/null 2>&1
echo "✅ Test users created"

# Create contract templates
echo "📋 Creating contract templates..."
docker exec ***REMOVED-DB_PASSWORD***-app psql -U ***REMOVED-DB_PASSWORD*** -d contract_management -c "
INSERT INTO contract_templates (template_id, name, description, terms, is_active, contract_type) VALUES
('TEMPLATE-001', 'Standard AI Training Contract', 'Standard contract template for AI model training', 'Standard terms and conditions for AI training contracts', true, 'AI_TRAINING'),
('TEMPLATE-002', 'Healthcare Data Contract', 'Specialized contract for healthcare data usage', 'Healthcare-specific terms with HIPAA compliance', true, 'HEALTHCARE'),
('TEMPLATE-003', 'Financial Data Contract', 'Contract template for financial data analysis', 'Financial data usage terms with regulatory compliance', true, 'FINANCIAL')
ON CONFLICT (template_id) DO NOTHING;" > /dev/null 2>&1
echo "✅ Contract templates created"

# Create datasets for TDP users
echo "📊 Creating datasets..."
docker exec ***REMOVED-DB_PASSWORD***-app psql -U ***REMOVED-DB_PASSWORD*** -d contract_management -c "
INSERT INTO datasets (name, description, data_type, size, record_count, confidentiality, price, user_id, metadata) 
SELECT 
  'Medical Imaging Dataset',
  'Comprehensive medical imaging dataset for AI training',
  'MEDICAL_IMAGING',
  '500GB',
  100000,
  'HIGH',
  5000,
  u.id,
  '{\"tags\": [\"medical\", \"imaging\", \"AI\", \"healthcare\"], \"confidentiality\": \"HIGH\", \"record_count\": 100000}'
FROM users u WHERE u.email = 'healthcare@tdp.com'
ON CONFLICT (name, user_id) DO NOTHING;" > /dev/null 2>&1

docker exec ***REMOVED-DB_PASSWORD***-app psql -U ***REMOVED-DB_PASSWORD*** -d contract_management -c "
INSERT INTO datasets (name, description, data_type, size, record_count, confidentiality, price, user_id, metadata) 
SELECT 
  'Patient Records Dataset',
  'Anonymized patient records for research purposes',
  'PATIENT_RECORDS',
  '200GB',
  50000,
  'HIGH',
  3000,
  u.id,
  '{\"tags\": [\"patient\", \"records\", \"research\", \"healthcare\"], \"confidentiality\": \"HIGH\", \"record_count\": 50000}'
FROM users u WHERE u.email = 'healthcare@tdp.com'
ON CONFLICT (name, user_id) DO NOTHING;" > /dev/null 2>&1

docker exec ***REMOVED-DB_PASSWORD***-app psql -U ***REMOVED-DB_PASSWORD*** -d contract_management -c "
INSERT INTO datasets (name, description, data_type, size, record_count, confidentiality, price, user_id, metadata) 
SELECT 
  'Stock Market Data',
  'Historical stock market data for algorithmic trading',
  'FINANCIAL_DATA',
  '1TB',
  1000000,
  'MEDIUM',
  8000,
  u.id,
  '{\"tags\": [\"stock\", \"market\", \"trading\", \"financial\"], \"confidentiality\": \"MEDIUM\", \"record_count\": 1000000}'
FROM users u WHERE u.email = 'finance@tdp.com'
ON CONFLICT (name, user_id) DO NOTHING;" > /dev/null 2>&1

docker exec ***REMOVED-DB_PASSWORD***-app psql -U ***REMOVED-DB_PASSWORD*** -d contract_management -c "
INSERT INTO datasets (name, description, data_type, size, record_count, confidentiality, price, user_id, metadata) 
SELECT 
  'Customer Behavior Data',
  'Customer shopping behavior and preferences',
  'CUSTOMER_BEHAVIOR',
  '400GB',
  200000,
  'MEDIUM',
  3500,
  u.id,
  '{\"tags\": [\"customer\", \"behavior\", \"retail\", \"shopping\"], \"confidentiality\": \"MEDIUM\", \"record_count\": 200000}'
FROM users u WHERE u.email = 'retail@tdp.com'
ON CONFLICT (name, user_id) DO NOTHING;" > /dev/null 2>&1

echo "✅ Datasets created"

# Create AI models for TDC users
echo "🤖 Creating AI models..."
docker exec ***REMOVED-DB_PASSWORD***-app psql -U ***REMOVED-DB_PASSWORD*** -d contract_management -c "
INSERT INTO ai_models (name, description, model_type, architecture, accuracy, price, user_id, metadata) 
SELECT 
  'Medical AI Model',
  'AI model for medical diagnosis and analysis',
  'MEDICAL_AI',
  'Deep Learning',
  0.95,
  15000,
  u.id,
  '{\"tags\": [\"medical\", \"AI\", \"diagnosis\", \"healthcare\"], \"architecture\": \"Deep Learning\", \"accuracy\": 0.95}'
FROM users u WHERE u.email = 'research@tdc.com'
ON CONFLICT (name, user_id) DO NOTHING;" > /dev/null 2>&1

docker exec ***REMOVED-DB_PASSWORD***-app psql -U ***REMOVED-DB_PASSWORD*** -d contract_management -c "
INSERT INTO ai_models (name, description, model_type, architecture, accuracy, price, user_id, metadata) 
SELECT 
  'Financial Prediction Model',
  'AI model for financial market predictions',
  'FINANCIAL_PREDICTION',
  'Neural Network',
  0.87,
  12000,
  u.id,
  '{\"tags\": [\"financial\", \"prediction\", \"AI\", \"trading\"], \"architecture\": \"Neural Network\", \"accuracy\": 0.87}'
FROM users u WHERE u.email = 'research@tdc.com'
ON CONFLICT (name, user_id) DO NOTHING;" > /dev/null 2>&1

docker exec ***REMOVED-DB_PASSWORD***-app psql -U ***REMOVED-DB_PASSWORD*** -d contract_management -c "
INSERT INTO ai_models (name, description, model_type, architecture, accuracy, price, user_id, metadata) 
SELECT 
  'Customer Segmentation Model',
  'AI model for customer segmentation and targeting',
  'CUSTOMER_SEGMENTATION',
  'Machine Learning',
  0.92,
  8000,
  u.id,
  '{\"tags\": [\"customer\", \"segmentation\", \"AI\", \"marketing\"], \"architecture\": \"Machine Learning\", \"accuracy\": 0.92}'
FROM users u WHERE u.email = 'tech@tdc.com'
ON CONFLICT (name, user_id) DO NOTHING;" > /dev/null 2>&1

echo "✅ AI models created"

print_success "Test data created successfully"

# Step 6: Start the backend server
print_status "Step 6: Starting backend server..."
cd ..
if npm run dev --prefix backend; then
    print_success "Backend server started"
else
    print_error "Backend server failed to start"
    exit 1
fi

print_success "🎉 Fresh system setup completed!"
echo ""
echo "📋 System Status:"
echo "  ✅ Database: Running on port 5432"
echo "  ✅ Keycloak: Running on HTTPS port 8443"
echo "  ✅ Backend: Starting..."
echo "  ✅ Test Data: Created"
echo ""
echo "🚀 Next steps:"
echo "  1. Wait for backend to fully start"
echo "  2. Test the API endpoints"
echo "  3. Start the frontend"
echo "  4. Test the complete SCITT CCF integration"
