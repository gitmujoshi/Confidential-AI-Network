# 👨‍💻 Developer Guide

Complete guide for developers working on the Contract Management System. This guide consolidates all developer-related documentation.

## 📋 Table of Contents

1. [Development Setup](#development-setup)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Differential Privacy Development](#differential-privacy-development)
5. [Testing](#testing)
6. [Debugging](#debugging)
7. [Deployment](#deployment)
8. [Best Practices](#best-practices)

## 🚀 Development Setup

### **Prerequisites**
- **Node.js** (v16+) and **npm** (v8+)
- **Docker** and **Docker Compose**
- **Git** for version control
- **PostgreSQL** (optional - Docker will provide)

### **Initial Setup**
```bash
# Clone repository
git clone <repository-url>
cd ContractManagement

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

# Update configuration
# See SETUP.md for detailed configuration
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
└── tests/                   # End-to-end tests
```

### **Backend Structure**
```
backend/
├── routes/                  # API routes
├── services/                # Business logic
├── models/                  # Database models
├── middleware/              # Express middleware
├── scripts/                 # Utility scripts
├── tests/                   # Unit and integration tests
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
# Start all services
./start-system.sh

# Or start individually
docker-compose -f docker-compose.***REMOVED-KEYCLOAK_DB_PASSWORD***-persistent.yml up -d
cd backend && npm run dev
cd ../frontend && npm start
```

#### **2. Check System Status**
```bash
# Check all services
npm run status

# Test authentication
npm run test:login

# Check health
curl -s http://localhost:5001/health
```

#### **3. Make Changes**
- **Backend**: Edit files in `backend/` directory
- **Frontend**: Edit files in `frontend/src/` directory
- **Database**: Use migrations in `backend/migrations/`

#### **4. Test Changes**
```bash
# Test authentication after changes
npm run test:login

# Run backend tests
cd backend && npm test

# Run frontend tests
cd frontend && npm test

# Run end-to-end tests
npm run test:e2e
```

#### **5. Fix Issues**
```bash
# Fix authentication issues
./fix-auth.sh

# Auto-fix Keycloak issues
cd backend && node auto-fix-***REMOVED-KEYCLOAK_DB_PASSWORD***.js

# Reset Keycloak completely
npm run reset:***REMOVED-KEYCLOAK_DB_PASSWORD***
```

### **Git Workflow**

#### **Before Making Changes**
```bash
# Check current state
npm run status

# Test current functionality
npm run test:login

# Create feature branch
git checkout -b feature/your-feature-name
```

#### **During Development**
```bash
# Make small, focused changes
# Test immediately after each change
npm run test:login

# Commit frequently with clear messages
git add .
git commit -m "feat: Add user profile update functionality

- Added profile update API endpoint
- Updated frontend profile form
- Added validation and error handling
- Tested with all user roles"
```

#### **After Making Changes**
```bash
# Test the specific change
npm run test:login

# Test related functionality
npm run status

# Update documentation if needed
# Push changes
git push origin feature/your-feature-name
```

## 🧪 Testing

### **Test Categories**

#### **Unit Tests**
```bash
# Backend unit tests
cd backend && npm test

# Frontend unit tests
cd frontend && npm test

# Specific test files
npm test -- auth.test.js
npm test -- UserService.test.js
```

#### **Integration Tests**
```bash
# API integration tests
cd backend && npm run test:integration

# Database integration tests
npm test -- database.test.js

# Authentication integration tests
npm test -- auth.integration.test.js
```

#### **End-to-End Tests**
```bash
# Run all E2E tests
npm run test:e2e

# Run specific E2E test
npm run test:e2e -- auth.spec.js

# Run with specific browser
npm run test:e2e -- --browser chrome
```

#### **Performance Tests**
```bash
# Load testing
npm run test:load

# Memory testing
npm run test:memory

# API performance testing
npm run test:performance
```

### **Test Data Management**

#### **Create Test Data**
```bash
# Create test users
cd backend && node scripts/source/create-e2e-users-direct.js

# Create test datasets
node scripts/source/create-tdp-datasets.js

# Create test contracts
node scripts/source/create-contract-for-user-13.js
```

#### **Reset Test Data**
```bash
# Reset database
cd backend && npm run db:reset

# Reset Keycloak
npm run reset:***REMOVED-KEYCLOAK_DB_PASSWORD***

# Sync users to Keycloak
node scripts/source/sync-users-to-***REMOVED-KEYCLOAK_DB_PASSWORD***.js
```

### **Test Commands Reference**

| Command | Purpose | Location |
|---------|---------|----------|
| `npm test` | Run all tests | Backend/Frontend |
| `npm run test:login` | Test authentication | Root |
| `npm run test:integration` | API integration tests | Backend |
| `npm run test:e2e` | End-to-end tests | Root |
| `npm run test:coverage` | Generate coverage report | Backend |
| `npm run test:watch` | Watch mode for tests | Backend/Frontend |

## 🐛 Debugging

### **Backend Debugging**

#### **Enable Debug Logging**
```bash
# Set debug environment
export DEBUG=app:*
export NODE_ENV=development

# Start with debug logging
cd backend && DEBUG=* node server.js
```

#### **Database Debugging**
```bash
# Connect to database
psql -h localhost -U ***REMOVED-DB_PASSWORD*** -d contract_management

# Check database tables
\dt

# Check user data
SELECT * FROM users WHERE email = 'tdc-test@example.com';
```

#### **Keycloak Debugging**
```bash
# Check Keycloak status
curl -s http://localhost:8080/health

# Check Keycloak logs
docker logs ***REMOVED-KEYCLOAK_DB_PASSWORD***-cms

# Test Keycloak authentication directly
curl -X POST http://localhost:8080/realms/contract-management/protocol/openid-connect/token \
  -d "grant_type=password&client_id=contract-management-frontend&username=tdc-test@example.com&password=password123"
```

### **Frontend Debugging**

#### **React Developer Tools**
- Install React Developer Tools browser extension
- Use browser dev tools for component inspection
- Check network tab for API calls

#### **Console Debugging**
```javascript
// Add debug logs
console.log('🔍 Debug:', data);

// Check authentication state
console.log('🔐 Auth State:', authState);

// Check API responses
console.log('📡 API Response:', response);
```

### **Common Debugging Scenarios**

#### **Authentication Issues**
```bash
# Check Keycloak configuration
cd backend && node auto-fix-***REMOVED-KEYCLOAK_DB_PASSWORD***.js

# Reset authentication
./fix-auth.sh

# Check user sync
node scripts/source/sync-users-to-***REMOVED-KEYCLOAK_DB_PASSWORD***.js
```

#### **Database Issues**
```bash
# Check database connection
cd backend && node -e "require('./models').sequelize.authenticate().then(() => console.log('DB OK')).catch(console.error)"

# Reset database
npm run db:reset

# Check migrations
npx sequelize-cli db:migrate:status
```

#### **API Issues**
```bash
# Test API endpoints
curl -X GET http://localhost:5001/health
curl -X POST http://localhost:5001/api/auth/login -H "Content-Type: application/json" -d '{"email":"tdc-test@example.com","password":"password123"}'

# Check API logs
tail -f logs/backend.log
```

## 🚀 Deployment

### **Development Deployment**
```bash
# Start development environment
./start-system.sh

# Check all services are running
npm run status

# Test functionality
npm run test:login
```

### **Production Deployment**

#### **Environment Setup**
```bash
# Set production environment
export NODE_ENV=production
export PORT=5001

# Update environment variables
cp .env.production .env
cp backend/config.production.env backend/config.env
```

#### **Database Migration**
```bash
# Run database migrations
cd backend && npx sequelize-cli db:migrate

# Seed production data
npx sequelize-cli db:seed:all
```

#### **Service Deployment**
```bash
# Deploy with Docker Compose
docker-compose -f docker-compose.production.yml up -d

# Or deploy individually
cd backend && npm start
cd ../frontend && npm run build && serve -s build
```

### **Monitoring and Logging**

#### **Health Checks**
```bash
# Check system health
curl -s http://localhost:5001/health

# Check Keycloak health
curl -s http://localhost:8080/health

# Check database health
psql -h localhost -U ***REMOVED-DB_PASSWORD*** -d contract_management -c "SELECT 1;"
```

#### **Log Monitoring**
```bash
# Backend logs
tail -f logs/backend.log

# Keycloak logs
docker logs -f ***REMOVED-KEYCLOAK_DB_PASSWORD***-cms

# Database logs
docker logs -f ***REMOVED-DB_PASSWORD***-***REMOVED-KEYCLOAK_DB_PASSWORD***
```

## 📚 Best Practices

### **Code Organization**

#### **Backend Best Practices**
- **Service Layer**: Business logic in `services/` directory
- **Route Layer**: API endpoints in `routes/` directory
- **Model Layer**: Database models in `models/` directory
- **Middleware**: Authentication and validation in `middleware/` directory

#### **Frontend Best Practices**
- **Component Structure**: Reusable components in `components/`
- **Page Structure**: Page components in `pages/`
- **Service Layer**: API calls in `services/`
- **State Management**: Use React Context for global state

### **Security Best Practices**

#### **Authentication**
- Always validate tokens on protected routes
- Use HTTPS in production
- Implement proper session management
- Regular security audits

#### **Data Validation**
- Validate all input data
- Sanitize user inputs
- Use parameterized queries
- Implement rate limiting

### **Performance Best Practices**

#### **Database Optimization**
- Use database indexes
- Optimize queries
- Implement connection pooling
- Regular database maintenance

#### **API Optimization**
- Implement caching
- Use pagination for large datasets
- Optimize response payloads
- Monitor API performance

### **Testing Best Practices**

#### **Test Structure**
- Unit tests for individual functions
- Integration tests for API endpoints
- End-to-end tests for user workflows
- Performance tests for critical paths

#### **Test Data Management**
- Use isolated test databases
- Create realistic test data
- Clean up test data after tests
- Use test fixtures for consistency

### **Documentation Best Practices**

#### **Code Documentation**
- Document all public APIs
- Use JSDoc for JavaScript functions
- Keep README files updated
- Document configuration options

#### **Commit Messages**
- Use conventional commit format
- Write descriptive commit messages
- Reference issues in commits
- Keep commits focused and small

## 🛠️ Development Tools

### **Essential Tools**
- **VS Code** with extensions for Node.js and React
- **Postman** for API testing
- **pgAdmin** for database management
- **Docker Desktop** for containerization

### **Recommended Extensions**
- **ESLint** for code linting
- **Prettier** for code formatting
- **GitLens** for Git integration
- **Thunder Client** for API testing

### **Development Scripts**

#### **Quick Commands**
```bash
# Start development
./start-system.sh

# Fix authentication
./fix-auth.sh

# Check status
npm run status

# Test login
npm run test:login

# Reset everything
npm run reset:all
```

#### **Database Commands**
```bash
# Run migrations
cd backend && npx sequelize-cli db:migrate

# Rollback migrations
npx sequelize-cli db:migrate:undo

# Seed database
npx sequelize-cli db:seed:all

# Reset database
npx sequelize-cli db:drop && npx sequelize-cli db:create && npx sequelize-cli db:migrate
```

## 📚 Related Documentation

- **[Quick Start](QUICK_START.md)** - Get started in 5 minutes
- **[Setup Guide](SETUP.md)** - Complete installation and configuration
- **[User Guide](USER_GUIDE.md)** - How to use the system
- **[API Reference](API_REFERENCE.md)** - Technical API documentation
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions

---

*This developer guide consolidates information from multiple developer-related documents and workflow guides.* 

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