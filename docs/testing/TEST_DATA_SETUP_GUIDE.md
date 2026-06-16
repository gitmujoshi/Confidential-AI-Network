# Test Data Setup Guide

This guide explains how to set up comprehensive test data for the Contract Management System using APIs and the common `config.env` configuration.

## Overview

The system now includes multiple test data setup scripts that create realistic test scenarios with all the new enhancements from the last 2 days:

- **TDP (Training Data Provider)**: Users who provide datasets for ML training
- **TDC (Training Data Consumer)**: Users who consume data to train AI models
- **CCRP (Confidential Clean Room Provider)**: Users who provide secure training environments
- **AppAdmin**: System administrators

## Available Scripts

### 1. Fresh Test Data Setup (Recommended)
```bash
./scripts/setup-fresh-test-data.sh
```

**What it does:**
- Cleans all existing test data
- Runs database migrations
- Starts backend if needed
- Creates fresh users via registration API
- Creates comprehensive test data using APIs

**Best for:** Clean testing environment with all new features

### 2. Comprehensive Test Data Setup
```bash
./scripts/setup-test-environment-comprehensive.sh
```

**What it does:**
- Runs database migrations
- Starts backend if needed
- Creates comprehensive test data using APIs
- Includes all new enhancements

**Best for:** Adding test data to existing system

### 3. Simple Test Data Setup
```bash
node scripts/create-simple-test-data.js
```

**What it does:**
- Uses existing users
- Creates datasets and contracts via APIs
- Lightweight approach

**Best for:** Quick data addition to existing users

### 4. Direct Database Test Data
```bash
cd backend && node create-test-data.js
```

**What it does:**
- Creates users directly in database
- Bypasses API layer
- Faster but less realistic

**Best for:** Development and debugging

## Test Data Created

### Users
- **Alice Johnson** (alice@tdp.com) - TDP from DataCorp Inc
- **Bob Smith** (bob@tdc.com) - TDC from AI Research Labs  
- **Carol Davis** (carol@ccrp.com) - CCRP from SecureCompute Solutions
- **David Wilson** (david@admin.com) - AppAdmin from Contract Management Corp
- **Eve Brown** (eve@tdp2.com) - TDP from Financial Data Co
- **Frank Miller** (frank@tdc2.com) - TDC from TechStartup Inc

### Datasets (Created by TDP users)
1. **Healthcare Patient Records** - Confidential healthcare data for AI training
2. **Financial Transaction Data** - Banking data for fraud detection
3. **E-commerce Customer Behavior** - Shopping behavior for recommendations
4. **IoT Sensor Data** - Manufacturing sensor data for predictive maintenance

### Contracts (Created by TDC users)
1. **Healthcare AI Model Training Agreement** - 365-day contract for healthcare data
2. **Financial Fraud Detection Model Contract** - 180-day contract for banking data

### Training Environments (Created by CCRP users)
1. **Healthcare Training Environment** - AWS Nitro Enclaves setup
2. **Financial Training Environment** - Azure SGX Enclaves setup

### Training Jobs
- Healthcare Model Training Job (Random Forest)
- Financial Fraud Detection Job (XGBoost)

## New Features Included

### Enhanced Dataset Management
- Data classification levels (CONFIDENTIAL, RESTRICTED, INTERNAL)
- Secure enclave requirements
- Attestation requirements
- Data residency regions
- Comprehensive metadata
- Audit configurations

### Advanced Contract Features
- Ricardian contracts with legal document binding
- Multi-dataset support (1-3 datasets per contract)
- Privacy requirements (differential privacy, k-anonymity, l-diversity)
- Compliance specifications (HIPAA, GDPR, SOX, PCI-DSS)
- Training environment specifications
- KMS configurations

### Training Environment Management
- Cloud provider support (AWS, Azure)
- Resource specifications
- Security configurations
- Attestation data
- Automated provisioning

### AI Model Management
- Model types and versions
- Performance metrics
- Training configurations
- Provenance tracking

## Configuration

All scripts use the common `config.env` file for configuration:

```bash
# Database configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=contract_management
DB_USER=postgres
DB_PASSWORD=password

# Backend configuration
PORT=5001
LOG_LEVEL=info

# Keycloak configuration
KEYCLOAK_URL=https://localhost:8080
KEYCLOAK_REALM=contract-management
KEYCLOAK_CLIENT_ID=contract-management-backend

# SCITT CCF configuration
SCITT_CCF_ENABLED=true
SCITT_CCF_URL=http://localhost:8000
```

## Usage Examples

### Quick Start
```bash
# Clean setup with fresh data
./scripts/setup-fresh-test-data.sh

# Test login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@tdp.com","password":"password123"}'
```

### Development Testing
```bash
# Add data to existing system
node scripts/create-simple-test-data.js

# Check system status
npm run status
```

### API Testing
```bash
# List datasets
curl -H "Authorization: Bearer <token>" http://localhost:5001/api/datasets

# List contracts  
curl -H "Authorization: Bearer <token>" http://localhost:5001/api/contracts

# List training environments
curl -H "Authorization: Bearer <token>" http://localhost:5001/api/infrastructure/environments
```

## Troubleshooting

### Authentication Issues
If users can't login, they may not be properly synced to Keycloak:
```bash
# Run the auth fix script
./fix-auth.sh

# Or sync users manually
cd backend && node auto-fix-keycloak.js
```

### Database Issues
If you get schema errors:
```bash
# Run migrations
cd backend && node run-schema-fix.js

# Or use the deployment script
./scripts/deploy-database.sh
```

### Backend Issues
If the backend won't start:
```bash
# Check if port is in use
lsof -i :5001

# Kill existing processes
pkill -f "node.*server.js"

# Start fresh
cd backend && npm start
```

## Test Scenarios

### 1. TDP Workflow
1. Login as alice@tdp.com
2. Create datasets with proper classification
3. Set up secure enclave requirements
4. Configure attestation policies

### 2. TDC Workflow  
1. Login as bob@tdc.com
2. Browse available datasets
3. Create Ricardian contracts
4. Specify training requirements
5. Set privacy and compliance requirements

### 3. CCRP Workflow
1. Login as carol@ccrp.com
2. Create training environments
3. Configure security settings
4. Set up attestation

### 4. Admin Workflow
1. Login as david@admin.com
2. Monitor system health
3. Manage users and permissions
4. View audit logs

## Next Steps

After setting up test data:

1. **Test the frontend** - Login with different user types
2. **Run test suites** - Execute `npm test` to verify functionality
3. **Test API endpoints** - Use the provided curl commands
4. **Verify integrations** - Check Keycloak, SCITT CCF, and database connections
5. **Monitor logs** - Watch for any errors or issues

## Support

If you encounter issues:

1. Check the logs in `logs/` directory
2. Verify configuration in `config.env`
3. Ensure all services are running (`npm run status`)
4. Run the appropriate fix scripts
5. Check the troubleshooting section above

The test data setup is designed to be comprehensive and realistic, providing a solid foundation for testing all features of the Contract Management System.
