# 👨‍💻 Developer Guide

Complete guide for developers working on the Contract Management System. This guide consolidates all developer-related documentation.

## 📋 Table of Contents

1. [Development Setup](#development-setup)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [SCITT CCF Development](#scitt-ccf-development)
5. [Differential Privacy Development](#differential-privacy-development)
6. [Testing](#testing)
7. [Debugging](#debugging)
8. [Deployment](#deployment)
9. [Best Practices](#best-practices)

## 🚀 Development Setup

### **Prerequisites**
- **Node.js** (v16+) and **npm** (v8+)
- **Docker** and **Docker Compose**
- **Git** for version control
- **PostgreSQL** (optional - Docker will provide)
- **SCITT CCF Ledger** (optional - for high-performance mode)

### **Initial Setup**
```bash
# Clone repository
git clone <repository-url>
cd ContractManagement

# Checkout SCITT CCF integration branch
git checkout feature/scitt-ccf-migration

# Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..

# Start development environment
./start-system.sh
```

### **Environment Configuration**
```bash
# Copy environment files
cp env.example .env
cp backend/config.env.example backend/config.env

# Copy SCITT CCF configuration (optional)
cp env.scitt-ccf.example .env.scitt-ccf

# Update configuration
# See SETUP.md for detailed configuration
```

### **SCITT CCF Development Setup**
```bash
# Setup SCITT CCF integration
./manage-scitt-ccf.sh setup

# Start SCITT CCF services
./manage-scitt-ccf.sh start

# Test integration
./manage-scitt-ccf.sh test
```

## 🏗️ Project Structure

### **Root Directory**
```
ContractManagement/
├── docs/                    # Consolidated documentation
├── backend/                 # Backend server (Node.js/Express)
├── frontend/                # Frontend (React)
├── blockchain/              # Smart contracts
├── scripts/                 # Utility scripts
├── deployment/              # Deployment configurations
├── tests/                   # End-to-end tests
├── SCITT_CCF_*.md          # SCITT CCF documentation
├── manage-scitt-ccf.sh     # SCITT CCF management script
├── docker-compose.scitt-ccf-dev.yml  # SCITT CCF services
└── env.scitt-ccf.example   # SCITT CCF configuration template
```

### **Backend Structure**
```
backend/
├── routes/                  # API routes
├── services/                # Business logic
│   ├── scittCcfService.js  # SCITT CCF integration service
│   ├── contractRouterService.js  # Contract routing service
│   └── systemHealthMonitor.js   # Health monitoring service
├── models/                  # Database models
│   ├── ScittClaim.js       # SCITT CCF claims model
│   └── SystemHealthLog.js  # Health logging model
├── middleware/              # Express middleware
├── scripts/                 # Utility scripts
│   └── test-scitt-ccf-integration.js  # SCITT CCF tests
├── tests/                   # Unit and integration tests
├── migrations/              # Database migrations
│   └── 20250108-add-scitt-ccf-tables.js  # SCITT CCF schema
└── config/                  # Configuration files
```

### **Frontend Structure**
```
frontend/
├── src/
│   ├── components/          # React components
│   ├── pages/               # Page components
│   ├── services/            # API services
│   ├── contexts/            # React contexts
│   └── utils/               # Utility functions
├── public/                  # Static assets
└── tests/                   # Frontend tests
```

## 🔄 Development Workflow

### **Daily Development Process**

#### **1. Start Development Environment**
```bash
# Start all services (including SCITT CCF if configured)
./start-system.sh

# Or start individually
docker-compose -f docker-compose.keycloak-persistent.yml up -d
./manage-scitt-ccf.sh start  # If using SCITT CCF
cd backend && npm run dev
```

#### **2. SCITT CCF Development Workflow**
```bash
# Check SCITT CCF status
./manage-scitt-ccf.sh status

# View SCITT CCF logs
./manage-scitt-ccf.sh logs

# Test SCITT CCF integration
./manage-scitt-ccf.sh test

# Switch migration modes for testing
./manage-scitt-ccf.sh switch HYBRID
./manage-scitt-ccf.sh switch SCITT_CCF_ONLY
./manage-scitt-ccf.sh switch ETHEREUM_ONLY
```

## 🔗 SCITT CCF Development

### **Architecture Overview**

The SCITT CCF integration provides a high-performance alternative to traditional blockchain:

```
┌─────────────────────────────────────────────────────────────┐
│                    Contract Router Service                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Ethereum        │  │ SCITT CCF       │  │ Migration       │  │
│  │ Service         │  │ Service         │  │ Orchestrator    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ PostgreSQL      │  │ SCITT CCF       │  │ Ethereum        │  │
│  │ (Primary)       │  │ Ledger          │  │ Blockchain      │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### **Core Services**

#### **1. ContractRouterService**
The central orchestrator that routes contract operations:

```javascript
const ContractRouterService = require('./services/contractRouterService');

const router = new ContractRouterService();
await router.initialize();

// Create contract (automatically routed)
const result = await router.createContract(contractData);
console.log('Contract created with source:', result.source);

// Get system health
const health = await router.getSystemHealth();
console.log('Overall health:', health.overall);
```

#### **2. ScittCcfService**
Handles SCITT CCF Ledger operations:

```javascript
const ScittCcfService = require('./services/scittCcfService');

const scittService = new ScittCcfService();
await scittService.initialize();

// Create contract in SCITT CCF
const result = await scittService.createContract(contractData);

// Get contract status
const status = await scittService.getContractStatus(contractId);
```

#### **3. SystemHealthMonitor**
Monitors system health and performance:

```javascript
const SystemHealthMonitor = require('./services/systemHealthMonitor');

const monitor = new SystemHealthMonitor();
await monitor.startMonitoring();

// Get detailed metrics
const metrics = await monitor.getDetailedMetrics();
```

### **Database Models**

#### **ScittClaim Model**
```javascript
const ScittClaim = require('../models/ScittClaim');

// Create a new claim
const claim = await ScittClaim.create({
  claimId: 'CLAIM-001',
  contractId: 1,
  claimType: 'contract_creation',
  claimData: { /* claim data */ },
  status: 'PENDING'
});

// Find claims by contract
const claims = await ScittClaim.findByContractId(1);
```

#### **SystemHealthLog Model**
```javascript
const SystemHealthLog = require('../models/SystemHealthLog');

// Get system uptime
const uptime = await SystemHealthLog.findSystemUptime('scittCcf', 24);

// Get performance metrics
const metrics = await SystemHealthLog.findAverageResponseTime('scittCcf', 24);
```

### **Migration Modes**

#### **HYBRID Mode (Recommended for Development)**
- New contracts go to SCITT CCF
- Existing contracts remain on Ethereum
- Automatic fallback if SCITT CCF fails
- Gradual migration path

```javascript
// Switch to hybrid mode
await router.switchMigrationMode('HYBRID');

// Create contract (will be routed to SCITT CCF)
const result = await router.createContract(contractData);
```

#### **SCITT_CCF_ONLY Mode**
- All contracts use SCITT CCF
- No Ethereum fallback
- Maximum performance
- Requires SCITT CCF to be fully operational

```javascript
// Switch to SCITT CCF only mode
await router.switchMigrationMode('SCITT_CCF_ONLY');
```

#### **ETHEREUM_ONLY Mode**
- Traditional blockchain operation
- No SCITT CCF integration
- Legacy mode for troubleshooting

```javascript
// Switch to Ethereum only mode
await router.switchMigrationMode('ETHEREUM_ONLY');
```

### **Testing SCITT CCF Integration**

#### **Updated Test Suites**

The backend now includes comprehensive SCITT CCF test suites:

```bash
# Run all tests including SCITT CCF
cd backend
npm test

# Run SCITT CCF specific tests
npm test -- --testPathPattern="scitt-ccf"

# Run specific test suites
npm test -- scitt-ccf-integration.test.js
npm test -- scitt-ccf-api.test.js
```

#### **Test Coverage**

- **SCITT CCF Service Tests**: Service initialization, connection, TEE detection
- **Contract Router Tests**: Migration modes, fallback scenarios, dual operations  
- **System Health Tests**: SCITT CCF vs Ethereum health monitoring
- **API Endpoint Tests**: All SCITT CCF API endpoints
- **Migration Tests**: Contract migration workflows
- **Performance Tests**: Load testing and concurrent operations

#### **Legacy Integration Tests**
```bash
# Run comprehensive SCITT CCF tests (legacy)
cd backend
node scripts/test-scitt-ccf-integration.js
cd ..
```

#### **Manual Testing**
```bash
# Test different migration modes
./manage-scitt-ccf.sh switch HYBRID
./manage-scitt-ccf.sh test

./manage-scitt-ccf.sh switch SCITT_CCF_ONLY
./manage-scitt-ccf.sh test

./manage-scitt-ccf.sh switch ETHEREUM_ONLY
./manage-scitt-ccf.sh test
```

#### **Performance Testing**
```bash
# Run performance benchmarks
cd backend
node -e "
  const ScittCcfService = require('./services/scittCcfService');
  const service = new ScittCcfService();
  
  service.initialize()
    .then(() => service.getPerformanceMetrics())
    .then(metrics => console.log('Performance:', metrics))
    .catch(console.error);
"
cd ..
```

### **Development Best Practices**

#### **1. Service Initialization**
Always initialize services before use:

```javascript
const router = new ContractRouterService();
await router.initialize();  // Required!

// Now safe to use
const result = await router.createContract(contractData);
```

#### **2. Error Handling**
Handle both SCITT CCF and Ethereum failures gracefully:

```javascript
try {
  const result = await router.createContract(contractData);
  console.log('Contract created:', result.source);
} catch (error) {
  if (error.message.includes('SCITT CCF')) {
    console.log('SCITT CCF failed, falling back to Ethereum');
    // Handle fallback logic
  } else {
    console.error('Contract creation failed:', error);
  }
}
```

#### **3. Health Monitoring**
Check system health before operations:

```javascript
const health = await router.getSystemHealth();
if (!health.overall) {
  throw new Error('System is unhealthy');
}

if (!health.scittCcf.isHealthy && router.migrationMode === 'SCITT_CCF_ONLY') {
  throw new Error('SCITT CCF is required but unhealthy');
}
```

#### **4. Migration Mode Management**
Use appropriate migration modes for different scenarios:

```javascript
// Development: Use hybrid mode
await router.switchMigrationMode('HYBRID');

// Testing: Use specific modes
await router.switchMigrationMode('SCITT_CCF_ONLY');
await router.switchMigrationMode('ETHEREUM_ONLY');

// Production: Use hybrid mode initially, then migrate
await router.switchMigrationMode('HYBRID');
// ... after validation ...
await router.switchMigrationMode('SCITT_CCF_ONLY');
```

### **Debugging SCITT CCF Issues**

#### **1. Check Service Status**
```bash
# Check SCITT CCF service status
./manage-scitt-ccf.sh status

# View service logs
./manage-scitt-ccf.sh logs
```

#### **2. Test Individual Components**
```bash
# Test SCITT CCF service directly
cd backend
node -e "
  const ScittCcfService = require('./services/scittCcfService');
  const service = new ScittCcfService();
  
  service.initialize()
    .then(() => service.getHealthStatus())
    .then(health => console.log('Health:', health))
    .catch(console.error);
"
cd ..
```

#### **3. Check Database Schema**
```bash
# Verify SCITT CCF tables exist
cd backend
npm run migrate:status

# Run migration if needed
npm run migrate:scitt-ccf
cd ..
```

#### **4. Environment Configuration**
```bash
# Check SCITT CCF configuration
cat .env.scitt-ccf

# Verify Docker services
docker-compose -f docker-compose.scitt-ccf-dev.yml ps
```

### **Performance Optimization**

#### **1. Caching**
Enable caching for better performance:

```bash
# In .env.scitt-ccf
CACHE_ENABLED=true
CACHE_TTL=300000  # 5 minutes
CACHE_MAX_SIZE=1000
```

#### **2. Health Check Intervals**
Adjust health check frequency:

```bash
# In .env.scitt-ccf
HEALTH_CHECK_INTERVAL=30000  # 30 seconds
HEALTH_CHECK_TIMEOUT=5000    # 5 seconds
```

#### **3. Batch Operations**
Use batch operations for multiple contracts:

```javascript
// Migrate multiple contracts at once
const contracts = await Contract.findAll({ where: { migration_status: 'PENDING' } });
const results = await Promise.allSettled(
  contracts.map(contract => router.migrateContract(contract.id))
);
```

## 🔐 Differential Privacy Development

### **Overview**
The differential privacy system provides privacy-preserving data analysis capabilities. This section covers how to develop, extend, and maintain the DP functionality.

### **Core Components**

#### **1. Differential Privacy Service**
```javascript
// backend/services/differentialPrivacyService.js
class DifferentialPrivacyService {
  constructor() {
    this.mechanisms = {
      laplace: new LaplaceMechanism(),
      gaussian: new GaussianMechanism(),
      exponential: new ExponentialMechanism(),
      geometric: new GeometricMechanism()
    };
    this.budgetTracker = new PrivacyBudgetTracker();
    this.sensitivityAnalyzer = new SensitivityAnalyzer();
  }
}
```

**Key Methods:**
- `applyDifferentialPrivacy(data, query, privacyParams)`
- `validatePrivacyParams(params)`
- `selectMechanism(queryType, data)`

#### **2. Noise Mechanisms**
```javascript
// backend/services/mechanisms/laplaceMechanism.js
class LaplaceMechanism {
  addNoise(value, epsilon, sensitivity) {
    const scale = sensitivity / epsilon;
    const noise = this.sampleLaplace(scale);
    return value + noise;
  }
  
  addNoiseToArray(array, epsilon, sensitivity) {
    return array.map(value => this.addNoise(value, epsilon, sensitivity));
  }
}
```

**Available Mechanisms:**
- **Laplace**: `backend/services/mechanisms/laplaceMechanism.js`
- **Gaussian**: `backend/services/mechanisms/gaussianMechanism.js`
- **Exponential**: `backend/services/mechanisms/exponentialMechanism.js`
- **Geometric**: `backend/services/mechanisms/geometricMechanism.js`

#### **3. Privacy Budget Management**
```javascript
// backend/services/privacyBudgetTracker.js
class PrivacyBudgetTracker {
  async checkBudget(contractId, requiredEpsilon, requiredDelta) {
    const budget = await this.getCurrentBudget(contractId);
    return {
      hasBudget: budget.remainingEpsilon >= requiredEpsilon && 
                 budget.remainingDelta >= requiredDelta,
      currentBudget: budget
    };
  }
  
  async consumeBudget(contractId, epsilon, delta) {
    // Implementation details
  }
}
```

### **Adding New DP Mechanisms**

#### **Step 1: Create Mechanism Class**
```javascript
// backend/services/mechanisms/customMechanism.js
class CustomMechanism {
  constructor() {
    this.name = 'custom';
    this.description = 'Custom differential privacy mechanism';
  }
  
  addNoise(value, privacyParams) {
    // Implement noise addition logic
    const noise = this.generateNoise(privacyParams);
    return value + noise;
  }
  
  generateNoise(privacyParams) {
    // Implement noise generation
    return 0; // Placeholder
  }
  
  validateParams(privacyParams) {
    // Validate mechanism-specific parameters
    return true;
  }
}
```

#### **Step 2: Register in DP Service**
```javascript
// backend/services/differentialPrivacyService.js
const CustomMechanism = require('./mechanisms/customMechanism');

class DifferentialPrivacyService {
  constructor() {
    this.mechanisms = {
      // ... existing mechanisms
      custom: new CustomMechanism()
    };
  }
}
```

#### **Step 3: Add Tests**
```javascript
// backend/tests/custom-mechanism.test.js
describe('CustomMechanism', () => {
  let mechanism;
  
  beforeEach(() => {
    mechanism = new CustomMechanism();
  });
  
  test('should add noise to values', () => {
    const result = mechanism.addNoise(10, { epsilon: 1.0 });
    expect(result).not.toBe(10); // Should be different due to noise
  });
  
  test('should validate parameters', () => {
    const isValid = mechanism.validateParams({ epsilon: 1.0 });
    expect(isValid).toBe(true);
  });
});
```

### **Adding New Query Types**

#### **Step 1: Define Query Type**
```javascript
// backend/services/sensitivityAnalyzer.js
class SensitivityAnalyzer {
  calculateSensitivity(queryType, data, parameters) {
    switch(queryType) {
      // ... existing cases
      case 'CUSTOM_QUERY':
        return this.calculateCustomSensitivity(data, parameters);
      default:
        throw new Error(`Unsupported query type: ${queryType}`);
    }
  }
  
  calculateCustomSensitivity(data, parameters) {
    // Implement sensitivity calculation for custom query
    return 1.0; // Placeholder
  }
}
```

#### **Step 2: Update API Documentation**
```javascript
// backend/routes/differential-privacy.js
router.get('/query-types', (req, res) => {
  const queryTypes = [
    // ... existing types
    {
      name: 'CUSTOM_QUERY',
      description: 'Custom query type for specific use case',
      sensitivity: 'data_dependent',
      mechanism: 'custom'
    }
  ];
  
  res.json({ success: true, data: queryTypes });
});
```

### **Database Schema Extensions**

#### **Adding New Privacy Fields**
```javascript
// backend/migrations/add-custom-privacy-fields.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('PrivacyOperationsLogs', 'customField', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },
  
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('PrivacyOperationsLogs', 'customField');
  }
};
```

#### **Running Migrations**
```bash
# Create migration runner
cd backend
node run-privacy-migration.js

# Or run manually
psql -h localhost -U mukeshjoshi -d contract_management -f migrations/add-custom-privacy-fields.js
```

### **Frontend Integration**

#### **Adding DP Controls to Components**
```javascript
// frontend/src/components/DifferentialPrivacyManager.js
import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Select, 
  MenuItem, 
  Button,
  FormControl,
  InputLabel 
} from '@mui/material';

const DifferentialPrivacyManager = ({ contractId, onApply }) => {
  const [privacyParams, setPrivacyParams] = useState({
    epsilon: 1.0,
    delta: 1e-5,
    mechanism: 'laplace'
  });
  
  const [budget, setBudget] = useState(null);
  
  useEffect(() => {
    // Fetch current budget
    fetchBudget(contractId);
  }, [contractId]);
  
  const handleApply = async () => {
    try {
      const result = await applyDifferentialPrivacy(privacyParams);
      onApply(result);
    } catch (error) {
      console.error('DP application failed:', error);
    }
  };
  
  return (
    <div>
      <FormControl fullWidth>
        <InputLabel>Mechanism</InputLabel>
        <Select
          value={privacyParams.mechanism}
          onChange={(e) => setPrivacyParams({
            ...privacyParams,
            mechanism: e.target.value
          })}
        >
          <MenuItem value="laplace">Laplace</MenuItem>
          <MenuItem value="gaussian">Gaussian</MenuItem>
          <MenuItem value="exponential">Exponential</MenuItem>
          <MenuItem value="geometric">Geometric</MenuItem>
        </Select>
      </FormControl>
      
      <TextField
        label="Epsilon (ε)"
        type="number"
        value={privacyParams.epsilon}
        onChange={(e) => setPrivacyParams({
          ...privacyParams,
          epsilon: parseFloat(e.target.value)
        })}
        inputProps={{ min: 0.1, max: 10, step: 0.1 }}
      />
      
      <TextField
        label="Delta (δ)"
        type="number"
        value={privacyParams.delta}
        onChange={(e) => setPrivacyParams({
          ...privacyParams,
          delta: parseFloat(e.target.value)
        })}
        inputProps={{ min: 1e-6, max: 1e-3, step: 1e-6 }}
      />
      
      <Button onClick={handleApply} variant="contained">
        Apply Differential Privacy
      </Button>
      
      {budget && (
        <div>
          <h4>Privacy Budget</h4>
          <p>Remaining Epsilon: {budget.remainingEpsilon}</p>
          <p>Remaining Delta: {budget.remainingDelta}</p>
          <p>Status: {budget.budgetStatus}</p>
        </div>
      )}
    </div>
  );
};
```

### **Testing DP Functionality**

#### **Unit Tests**
```javascript
// backend/tests/differential-privacy.test.js
describe('DifferentialPrivacyService', () => {
  let dpService;
  
  beforeEach(() => {
    dpService = new DifferentialPrivacyService();
  });
  
  test('should apply Laplace mechanism', async () => {
    const data = [1, 2, 3, 4, 5];
    const query = { type: 'AVERAGE' };
    const privacyParams = {
      epsilon: 1.0,
      mechanism: 'laplace',
      contractId: 'test-contract'
    };
    
    const result = await dpService.applyDifferentialPrivacy(
      data, query, privacyParams
    );
    
    expect(result.success).toBe(true);
    expect(result.data.result).toHaveLength(5);
    expect(result.data.privacyMetrics.mechanism).toBe('laplace');
  });
  
  test('should respect privacy budget', async () => {
    // Test budget enforcement
  });
  
  test('should handle insufficient budget', async () => {
    // Test budget exhaustion
  });
});
```

#### **Integration Tests**
```javascript
// backend/tests/api/differential-privacy.test.js
describe('Differential Privacy API', () => {
  test('GET /api/dp/mechanisms should return available mechanisms', async () => {
    const response = await request(app)
      .get('/api/dp/mechanisms')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(4); // laplace, gaussian, exponential, geometric
  });
  
  test('POST /api/dp/test should apply DP to test data', async () => {
    const testData = {
      data: [1, 2, 3, 4, 5],
      query: { type: 'AVERAGE' },
      privacyParams: {
        epsilon: 0.1,
        delta: 1e-5,
        mechanism: 'laplace'
      }
    };
    
    const response = await request(app)
      .post('/api/dp/test')
      .send(testData)
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.result).toHaveLength(5);
  });
});
```

### **Performance Optimization**

#### **Budget Caching**
```javascript
// backend/services/privacyBudgetTracker.js
class PrivacyBudgetTracker {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }
  
  async getCurrentBudget(contractId) {
    const cached = this.cache.get(contractId);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.budget;
    }
    
    const budget = await this.fetchFromDatabase(contractId);
    this.cache.set(contractId, {
      budget,
      timestamp: Date.now()
    });
    
    return budget;
  }
}
```

#### **Batch Operations**
```javascript
// backend/services/differentialPrivacyService.js
async applyDifferentialPrivacyBatch(operations, privacyParams) {
  const results = [];
  
  // Group operations by contract for batch budget checking
  const operationsByContract = this.groupByContract(operations);
  
  for (const [contractId, contractOps] of operationsByContract) {
    const totalEpsilon = contractOps.reduce((sum, op) => sum + op.epsilon, 0);
    const totalDelta = contractOps.reduce((sum, op) => sum + op.delta, 0);
    
    // Check budget for all operations at once
    const hasBudget = await this.budgetTracker.checkBudget(
      contractId, totalEpsilon, totalDelta
    );
    
    if (!hasBudget) {
      throw new Error(`Insufficient budget for contract ${contractId}`);
    }
    
    // Process all operations
    for (const operation of contractOps) {
      const result = await this.processOperation(operation);
      results.push(result);
    }
    
    // Update budget once for all operations
    await this.budgetTracker.consumeBudget(
      contractId, totalEpsilon, totalDelta
    );
  }
  
  return results;
}
```

### **Debugging DP Issues**

#### **Common Problems and Solutions**

**1. Budget Exhaustion**
```bash
# Check budget status
curl -s http://localhost:5001/api/dp/budget/contract-123

# Check operation history
curl -s http://localhost:5001/api/dp/history/contract-123
```

**2. Mechanism Selection Issues**
```bash
# Test specific mechanism
curl -s -X POST http://localhost:5001/api/dp/test \
  -H "Content-Type: application/json" \
  -d '{"data":[1,2,3],"query":{"type":"COUNT"},"privacyParams":{"epsilon":1.0,"mechanism":"geometric"}}'
```

**3. Database Connection Issues**
```bash
# Check if DP tables exist
psql -h localhost -U mukeshjoshi -d contract_management -c "\dt" | grep -i privacy

# Run migration if needed
cd backend && node run-privacy-migration.js
```

#### **Logging and Monitoring**
```javascript
// Enable detailed DP logging
const dpLogger = {
  info: (message, data) => console.log(`[DP INFO] ${message}`, data),
  error: (message, error) => console.error(`[DP ERROR] ${message}`, error),
  debug: (message, data) => {
    if (process.env.DP_DEBUG) {
      console.log(`[DP DEBUG] ${message}`, data);
    }
  }
};
```

### **Best Practices for DP Development**

#### **1. Privacy-First Design**
- Always validate privacy parameters
- Implement proper budget checking
- Use appropriate mechanisms for query types
- Log all operations for audit purposes

#### **2. Performance Considerations**
- Cache budget information when possible
- Batch operations to reduce database calls
- Use efficient noise generation algorithms
- Monitor execution times

#### **3. Testing Strategy**
- Test with various data types and sizes
- Verify privacy guarantees mathematically
- Test budget enforcement thoroughly
- Include edge cases in test coverage

#### **4. Error Handling**
- Graceful degradation when budget is exhausted
- Clear error messages for debugging
- Fallback mechanisms when possible
- Comprehensive error logging 