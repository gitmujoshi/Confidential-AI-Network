# 🧪 Testing Documentation

Complete testing guide for the Contract Management System, including SCITT CCF integration tests.

## 📋 Table of Contents

1. [Test Suite Overview](#test-suite-overview)
2. [SCITT CCF Test Suites](#scitt-ccf-test-suites)
3. [Running Tests](#running-tests)
4. [Test Data Management](#test-data-management)
5. [Test Environment Setup](#test-environment-setup)
6. [Continuous Integration](#continuous-integration)
7. [Troubleshooting Tests](#troubleshooting-tests)

## 🎯 Test Suite Overview

### **Complete Test Coverage**

The system includes comprehensive testing for all components:

```
backend/tests/
├── scitt-ccf-integration.test.js    # SCITT CCF service integration tests
├── scitt-ccf-api.test.js           # SCITT CCF API endpoint tests
├── api-test-suite.js               # General API tests
├── contract-state-machine.test.js  # Contract lifecycle tests
├── cloudProviders.test.js          # Cloud provider integration tests
├── differential-privacy.test.js    # Differential privacy tests
├── secretManager.test.js           # Secret management tests
├── multi-tdp-contracts.test.js     # Multi-TDP contract tests
└── integration/                    # Integration test suites
    ├── cloudCredentials.test.js    # Cloud credentials workflow
    └── e2e/                       # End-to-end tests
        └── cloudCredentialsWorkflow.test.js
```

### **Test Categories**

- **Unit Tests**: Individual service and function tests
- **Integration Tests**: Service interaction tests
- **API Tests**: Endpoint functionality tests
- **End-to-End Tests**: Complete workflow tests
- **Performance Tests**: Load and stress tests

## 🔗 SCITT CCF Test Suites

### **1. SCITT CCF Integration Tests** (`scitt-ccf-integration.test.js`)

#### **Service Tests**
- Service initialization and configuration
- Connection testing to SCITT CCF node
- TEE (Trusted Execution Environment) detection
- Service health monitoring

#### **Contract Router Tests**
- Migration mode switching (ETHEREUM_ONLY, SCITT_CCF_ONLY, HYBRID)
- Fallback scenarios when SCITT CCF fails
- Dual operations in hybrid mode
- Contract routing decisions

#### **System Health Tests**
- SCITT CCF vs Ethereum health comparison
- Performance metrics collection
- Response time monitoring
- Service availability checks

#### **Migration Tests**
- Contract migration workflows
- Migration mode validation
- Migration progress tracking
- Rollback capabilities

#### **Error Handling Tests**
- Service unavailability scenarios
- Network connectivity issues
- Invalid data handling
- Graceful degradation

#### **Performance Tests**
- Concurrent contract creation
- Response time validation
- Load testing scenarios
- Resource utilization

### **2. SCITT CCF API Tests** (`scitt-ccf-api.test.js`)

#### **Health Endpoints**
- SCITT CCF health status
- System metrics collection
- Performance indicators
- Uptime monitoring

#### **Contract Operations**
- Contract creation via SCITT CCF
- Contract status retrieval
- Contract listing and filtering
- Contract updates and modifications

#### **Claims Management**
- Claim submission to SCITT CCF
- Claim retrieval and status
- Claim lifecycle management
- Claim validation

#### **TEE Attestation**
- Trusted execution environment verification
- Attestation report validation
- TEE provider detection
- Security verification

#### **Migration Endpoints**
- Migration mode management
- Migration status tracking
- Contract migration workflows
- Migration rollback

#### **Configuration Management**
- SCITT CCF configuration retrieval
- Configuration updates
- Environment variable management
- Service configuration validation

#### **Load Testing**
- Concurrent operations
- Large data handling
- Performance under stress
- Resource limits

## 🚀 Running Tests

### **Prerequisites**

Ensure the test environment is properly set up:

```bash
# Check if test data exists
docker exec postgres-app psql -U postgres -d contract_management -c "SELECT COUNT(*) FROM users;"

# Expected results:
# - 8 users (TDP, TDC, CCRP, Admin)
# - 7 datasets with DEPA IDs
# - 3 AI models with DEPA IDs
# - 3 contract templates
# - 3 sample contracts
```

### **Basic Test Commands**

#### **Run All Tests**
```bash
cd backend
npm test
```

#### **Run SCITT CCF Specific Tests**
```bash
# Run all SCITT CCF tests
npm test -- --testPathPattern="scitt-ccf"

# Run specific test suites
npm test -- scitt-ccf-integration.test.js
npm test -- scitt-ccf-api.test.js
```

#### **Run with Verbose Output**
```bash
npm test -- --verbose --testPathPattern="scitt-ccf"
```

#### **Run Tests in Watch Mode**
```bash
npm test -- --watch --testPathPattern="scitt-ccf"
```

### **Advanced Test Commands**

#### **Run Tests with Coverage**
```bash
npm test -- --coverage --testPathPattern="scitt-ccf"
```

#### **Run Tests in Parallel**
```bash
npm test -- --maxWorkers=4 --testPathPattern="scitt-ccf"
```

#### **Run Tests with Specific Environment**
```bash
NODE_ENV=test SCITT_CCF_ENABLED=true npm test -- --testPathPattern="scitt-ccf"
```

## 📊 Test Data Management

### **Test Data Structure**

The test suites use comprehensive test data created by `create-test-data.js`:

#### **Users (8 total)**
- **Admin**: System Administrator
- **TDPs**: Healthcare Data Corp, Financial Analytics Inc, Retail Insights Ltd
- **TDCs**: AI Research Institute, Tech Startup Co
- **CCRPs**: Secure Compute Solutions, Privacy First Computing

#### **Datasets (7 total)**
- **Healthcare**: Medical Imaging, Patient Records, Clinical Trial Data
- **Financial**: Stock Market Data, Credit Risk Data
- **Retail**: Customer Behavior Data, Inventory Analytics

#### **AI Models (3 total)**
- Medical AI Model, Financial Prediction Model, Customer Segmentation Model

#### **Contract Templates (3 total)**
- Standard AI Training, Healthcare Data, Financial Data

#### **Sample Contracts (3 total)**
- Healthcare AI Training, Financial Analytics, Retail Customer Insights

### **Test Data Verification**

```bash
# Check user count
docker exec postgres-app psql -U postgres -d contract_management -c "SELECT party_type, COUNT(*) FROM users GROUP BY party_type;"

# Check dataset count
docker exec postgres-app psql -U postgres -d contract_management -c "SELECT COUNT(*) FROM datasets;"

# Check AI model count
docker exec postgres-app psql -U postgres -d contract_management -c "SELECT COUNT(*) FROM ai_models;"

# Check contract count
docker exec postgres-app psql -U postgres -d contract_management -c "SELECT COUNT(*) FROM contracts;"
```

### **Recreating Test Data**

If test data is missing or corrupted:

```bash
# Recreate test data
docker exec cms-backend node /app/create-test-data.js

# Or run from host
cd backend
node create-test-data.js
```

## ⚙️ Test Environment Setup

### **Environment Configuration**

Create `.env.test` for test-specific configuration:

```bash
# Test environment configuration
NODE_ENV=test
TEST_MODE=integration
SCITT_CCF_ENABLED=true
MIGRATION_MODE=HYBRID
BLOCKCHAIN_ENABLED=true
KEYCLOAK_ENABLED=true

# Test database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/contract_management_test

# Test SCITT CCF
CCF_NODE_URL=http://localhost:8000
CCF_GOVERNANCE_URL=http://localhost:8001
```

### **Docker Test Environment**

```bash
# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Run tests
docker exec test-backend npm test

# Stop test environment
docker-compose -f docker-compose.test.yml down
```

### **Local Test Environment**

```bash
# Start required services
docker-compose -f docker-compose.fresh-setup.yml up -d

# Setup test data
cd backend && node create-test-data.js

# Run tests
npm test
```

## 🔄 Continuous Integration

### **CI/CD Pipeline**

The test suites are designed to run in CI/CD environments:

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - name: Install dependencies
        run: |
          npm ci
          cd backend && npm ci
      
      - name: Start test environment
        run: |
          docker-compose -f docker-compose.test.yml up -d
          sleep 30
      
      - name: Run tests
        run: |
          cd backend
          npm test -- --coverage --testPathPattern="scitt-ccf"
      
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

### **Test Reports**

Generate test reports for CI/CD:

```bash
# Generate JUnit XML report
npm test -- --reporter=junit --outputDirectory=test-results

# Generate coverage report
npm test -- --coverage --coverageReporters=html --coverageReporters=text

# Generate test summary
npm test -- --verbose --testPathPattern="scitt-ccf" > test-summary.txt
```

## 🚨 Troubleshooting Tests

### **Common Test Issues**

#### **Test Suites Not Found**
```bash
# Check if test files exist
ls -la backend/tests/scitt-ccf*.test.js

# Expected files:
# - scitt-ccf-integration.test.js
# - scitt-ccf-api.test.js
```

#### **Test Environment Issues**
```bash
# Check test environment
cat .env.scitt-ccf

# Verify test data exists
docker exec postgres-app psql -U postgres -d contract_management -c "SELECT COUNT(*) FROM users;"

# Recreate test data if needed
docker exec cms-backend node /app/create-test-data.js
```

#### **SCITT CCF Service Issues**
```bash
# Check SCITT CCF status
./manage-scitt-ccf.sh status

# Restart SCITT CCF services
./manage-scitt-ccf.sh restart

# Check logs
./manage-scitt-ccf.sh logs
```

#### **Database Connection Issues**
```bash
# Check database connection
docker exec postgres-app psql -U postgres -d contract_management -c "SELECT 1;"

# Restart database
docker-compose restart postgres-app

# Check database logs
docker logs postgres-app
```

### **Test Debugging**

#### **Run Tests with Debug Output**
```bash
# Enable debug logging
DEBUG=* npm test -- --testPathPattern="scitt-ccf"

# Run specific test with verbose output
npm test -- --verbose scitt-ccf-integration.test.js
```

#### **Isolate Test Failures**
```bash
# Run single test
npm test -- --testNamePattern="should create contract via SCITT CCF"

# Run tests in specific file
npm test -- scitt-ccf-api.test.js

# Run tests with specific pattern
npm test -- --testPathPattern="scitt-ccf" --testNamePattern="API"
```

#### **Check Test Dependencies**
```bash
# Verify test dependencies
npm list --depth=0

# Check for missing packages
npm audit

# Update test dependencies
npm update
```

## 📚 Related Documentation

- **[Quick Start](QUICK_START.md)** - Get started with testing
- **[Setup Guide](SETUP.md)** - Test environment setup
- **[Developer Guide](DEVELOPER_GUIDE.md)** - Development testing workflows
- **[API Reference](API_REFERENCE.md)** - API testing examples
- **[Troubleshooting](TROUBLESHOOTING.md)** - Test troubleshooting guide
- **[SCITT CCF Integration](../SCITT_CCF_INTEGRATION_README.md)** - SCITT CCF testing details

---

*This testing documentation consolidates all testing-related information for the Contract Management System.*
