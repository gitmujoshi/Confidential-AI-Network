# Integration Test Data Management System

This document describes the new test data management system that provides better isolation, reusability, and error handling for integration tests.

## 🏗️ Architecture Overview

The system consists of three main components:

1. **TestDataFactory** - Low-level data creation and management
2. **TestScenarioManager** - High-level scenario management and isolation
3. **TestHelpers** - Common test utilities and assertions

## 📁 File Structure

```
tests/integration/
├── test-data-factory.js      # Core data creation and management
├── test-scenario-manager.js  # High-level scenario management
├── test-helpers.js          # Common test utilities
├── integration.test.js       # Example refactored test
└── README.md                # This documentation
```

## 🚀 Quick Start

### Basic Usage

```javascript
const TestScenarioManager = require('./test-scenario-manager');
const TestHelpers = require('./test-helpers');

describe('My Integration Test', () => {
  let scenarioManager;
  let testHelpers;
  let currentScenario;

  beforeEach(async () => {
    // Create isolated test scenario
    scenarioManager = new TestScenarioManager();
    currentScenario = await scenarioManager.createMinimalScenario();
    
    // Initialize test helpers
    testHelpers = new TestHelpers(app);
  });

  afterEach(async () => {
    // Clean up test data
    await scenarioManager.cleanup();
  });

  it('should test something', async () => {
    const { tdpUser } = currentScenario;
    const tdpToken = currentScenario.getTdpToken();
    
    // Use the test data...
  });
});
```

## 🎯 Test Scenarios

### Available Scenarios

#### 1. Minimal Scenario (`createMinimalScenario()`)
- Creates 1 TDP user
- Basic setup for simple tests
- Fast execution

```javascript
const scenario = await scenarioManager.createMinimalScenario();
const tdpUser = scenario.users.tdpUser;
const tdpToken = scenario.getTdpToken();
```

#### 2. Contract Scenario (`createContractTestScenario()`)
- Creates TDP, TDC, TSP users
- Creates test dataset and AI model
- Perfect for contract-related tests

```javascript
const scenario = await scenarioManager.createContractTestScenario();
const { tdpUser, tdcUser, tspUser, dataset, aiModel } = scenario;
const tdcToken = scenario.getTdcToken();
```

#### 3. Comprehensive Scenario (`createComprehensiveScenario()`)
- Creates all user types
- Multiple datasets and AI models
- Notifications and additional data
- For full workflow testing

```javascript
const scenario = await scenarioManager.createComprehensiveScenario();
const { users, datasets, aiModels, notifications } = scenario;
```

### Custom Scenarios

```javascript
// Initialize with specific scenario type
await scenarioManager.initializeScenario('contract');

// Add additional data
await scenarioManager.addData('user', { role: 'TDP', organization: 'Custom Org' });
await scenarioManager.addData('dataset', { ownerId: userId, name: 'Custom Dataset' });
```

## 🛠️ Test Data Factory

### Creating Individual Test Data

```javascript
const factory = new TestDataFactory();
await factory.initialize();

// Create users
const tdpUser = await factory.createUser('TDP', {
  organization: 'Custom Org',
  description: 'Custom description'
});

// Create datasets
const dataset = await factory.createDataset(tdpUser.id, {
  name: 'Custom Dataset',
  category: 'Computer Vision'
});

// Create AI models
const aiModel = await factory.createAIModel({
  name: 'Custom Model',
  type: 'transformer'
});

// Clean up
await factory.cleanup();
```

### Transaction Management

```javascript
const factory = new TestDataFactory();
await factory.initialize();

try {
  // Create test data
  const user = await factory.createUser('TDP');
  
  // Commit if everything succeeds
  await factory.commit();
} catch (error) {
  // Rollback on failure
  await factory.rollback();
  throw error;
}
```

## 🔧 Test Helpers

### HTTP Request Helpers

```javascript
const helpers = new TestHelpers(app);

// Authenticated requests
const response = await helpers.authenticatedRequest(
  'POST', 
  '/api/contracts', 
  token, 
  contractData
);

// Unauthenticated requests
const response = await helpers.unauthenticatedRequest(
  'GET', 
  '/api/health'
);
```

### Data Validation

```javascript
// Validate successful responses
helpers.validateSuccessResponse(response, 201);

// Validate error responses
helpers.validateErrorResponse(response, 400, 'VALIDATION_ERROR');

// Validate data structures
helpers.validateUserData(user, 'TDP');
helpers.validateDatasetData(dataset, ownerId);
helpers.validateContractData(contract, 'PENDING_APPROVAL');
```

### Utility Methods

```javascript
// Generate unique test data
const uniqueData = helpers.generateUniqueData('test');
// Result: { email: 'test-123456-abc123@test.example.com', ... }

// Wait for conditions
await helpers.waitFor(() => service.isReady(), 5000);

// Retry operations
const result = await helpers.retry(async () => {
  return await riskyOperation();
}, 3, 1000);

// Check service health
const isHealthy = await helpers.checkServiceHealth('/health');
```

## 🧪 Writing Tests

### Test Structure Best Practices

```javascript
describe('Feature Integration Tests', () => {
  let scenarioManager;
  let testHelpers;
  let currentScenario;

  beforeEach(async () => {
    // 1. Initialize test helpers
    testHelpers = new TestHelpers(app);
    
    // 2. Create isolated test scenario
    scenarioManager = new TestScenarioManager();
    currentScenario = await scenarioManager.createComprehensiveScenario();
    
    // 3. Validate scenario has required data
    scenarioManager.validateScenario(['users', 'datasets']);
  });

  afterEach(async () => {
    // Clean up test data
    await scenarioManager.cleanup();
  });

  it('should perform integration test', async () => {
    // 1. Get test data from scenario
    const { tdpUser, dataset } = currentScenario;
    const tdpToken = currentScenario.getTdpToken();
    
    // 2. Perform test operations
    const response = await testHelpers.authenticatedRequest(
      'POST', 
      '/api/endpoint', 
      tdpToken, 
      testData
    );
    
    // 3. Validate response
    testHelpers.validateSuccessResponse(response, 201);
    testHelpers.validateDataStructure(response.body.data);
    
    // 4. Additional assertions
    expect(response.body.data.status).toBe('SUCCESS');
  });
});
```

### Test Data Isolation

Each test gets its own isolated test data:

```javascript
it('test 1', async () => {
  const scenario1 = await scenarioManager.createMinimalScenario();
  // This test has its own data
});

it('test 2', async () => {
  const scenario2 = await scenarioManager.createMinimalScenario();
  // This test has completely different data
  // No interference between tests
});
```

## 🧹 Cleanup and Maintenance

### Automatic Cleanup

The system automatically tracks created data and cleans it up:

```javascript
// Data is automatically tracked
const user = await factory.createUser('TDP');
const dataset = await factory.createDataset(user.id);

// Cleanup removes all tracked data
await factory.cleanup();
```

### Manual Cleanup

```javascript
// Get summary of created data
const summary = factory.getSummary();
console.log(summary);
// Output: { users: 3, datasets: 2, contracts: 1, aiModels: 1, notifications: 2 }

// Force cleanup specific data types
await factory.cleanup();
```

## 🚨 Error Handling

### Graceful Degradation

```javascript
try {
  await scenarioManager.initializeScenario('contract');
} catch (error) {
  console.warn('⚠️ Scenario initialization failed, using minimal scenario');
  await scenarioManager.createMinimalScenario();
}
```

### Validation Failures

```javascript
// Scenario validation
try {
  scenarioManager.validateScenario(['users', 'datasets', 'aiModels']);
} catch (error) {
  console.error('❌ Test scenario incomplete:', error.message);
  throw error;
}
```

## 📊 Monitoring and Debugging

### Test Data Summary

```javascript
// Get current scenario summary
const summary = scenarioManager.getScenarioSummary();
console.log('Current scenario:', summary);
// Output: { status: 'Active', users: 3, dataset: true, aiModel: true, ... }
```

### Debug Logging

The system provides detailed logging:

```
🏗️ Creating comprehensive test scenario...
✅ Created test user: tdp-123456@test.example.com (TDP)
✅ Created test user: tdc-123456@test.example.com (TDC)
✅ Created test user: tsp-123456@test.example.com (TSP)
✅ Created test dataset: TEST-DATASET-123456
✅ Created test AI model: test-model-123456
✅ Contract test scenario created successfully
```

## 🔄 Migration from Old Tests

### Before (Old Way)

```javascript
// Global variables shared across tests
let tdpUser, tdcUser, testDataset;

beforeAll(async () => {
  // Single setup for all tests
  await createTestUsers();
  await createTestDataset();
});

// Tests share the same data
it('test 1', () => { /* uses tdpUser */ });
it('test 2', () => { /* uses same tdpUser */ });
```

### After (New Way)

```javascript
// Isolated data for each test
let scenarioManager;
let currentScenario;

beforeEach(async () => {
  // Fresh data for each test
  scenarioManager = new TestScenarioManager();
  currentScenario = await scenarioManager.createMinimalScenario();
});

afterEach(async () => {
  // Clean up after each test
  await scenarioManager.cleanup();
});

// Each test has its own data
it('test 1', () => { 
  const { tdpUser } = currentScenario; // Isolated data
});
it('test 2', () => { 
  const { tdpUser } = currentScenario; // Different isolated data
});
```

## 🎯 Benefits

1. **Test Isolation** - Each test has its own data
2. **No Interference** - Tests can't affect each other
3. **Better Error Handling** - Graceful degradation and validation
4. **Reusability** - Common scenarios can be reused
5. **Maintainability** - Centralized data management
6. **Debugging** - Better logging and error messages
7. **Performance** - Faster test execution with proper cleanup

## 🚀 Next Steps

1. **Refactor existing tests** to use the new system
2. **Create custom scenarios** for specific test needs
3. **Add new data types** to the factory as needed
4. **Extend test helpers** with domain-specific utilities
5. **Monitor test performance** and optimize scenarios

## 📚 Examples

See `integration.test.js` for a complete example of how to use the new system.
