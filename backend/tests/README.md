# Contract Management System Backend Test Suite

## ⚠️ CRITICAL: Authentication Rules
**ALWAYS use Keycloak authentication in tests. NEVER bypass authentication layers.**
- All test users must be synced to Keycloak
- Use service APIs, never direct database calls
- See [AUTHENTICATION_RULES.md](../../AUTHENTICATION_RULES.md) for complete guidelines

## Overview

This test suite supports both **mock** and **integration** modes for comprehensive testing of the Contract Management System backend.

## Test Modes

### Mock Mode (Fast Unit Tests)
- Uses mocked external services (Keycloak, Blockchain, etc.)
- No external dependencies required
- Fast execution for CI/CD and development
- Run with: `npm run test:mock`

### Integration Mode (Real Service Tests)
- Uses real external services (Keycloak, Blockchain, Database)
- Requires running services (see Prerequisites)
- End-to-end testing with real data
- Run with: `npm run test:integration`

## Quick Start

### Prerequisites
- Node.js 16+
- PostgreSQL database
- For integration tests: Keycloak server, Blockchain node

### Running Tests

```bash
# Run all tests
npm test

# Run only mock tests (fast)
npm run test:mock

# Run only integration tests
npm run test:integration
```

## Test Structure

### Centralized Configuration
- `tests/test-env.js` - Environment variables for both modes
- `tests/mocks/index.js` - Jest mock definitions for mock mode
- `tests/utils/` - Test data utilities and helpers

### Test Files
- `tests/specs/` - Individual test suites
- `tests/setup.js` - Global test setup and utilities
- `tests/test-server.js` - Test Express server

## Usage Examples

### Using Test Utilities

```javascript
const { createTestUser, createTestContract, generateAuthToken } = require('../utils');

describe('My Test Suite', () => {
  let testUser, testContract, authToken;

  beforeAll(async () => {
    // Create test data
    testUser = await createTestUser({
      email: 'test@example.com',
      partyType: 'TDP'
    });
    
    testContract = await createTestContract({
      status: 'PENDING_TDP',
      price: 150.00
    });
    
    authToken = generateAuthToken(testUser);
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupAllTestData();
  });
});
```

### Environment Configuration

```javascript
const { setTestEnv } = require('./test-env');

// Set environment for mock mode
setTestEnv('mock');

// Set environment for integration mode
setTestEnv('integration');
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure no other services are running on test ports
2. **Database connection**: Check PostgreSQL is running and accessible
3. **Mock mode failures**: Verify Jest mocks are properly configured
4. **Integration mode failures**: Ensure all external services are running

### Debug Mode

```bash
# Run with verbose output
npm run test:mock -- --verbose

# Run specific test file
npm run test:mock -- --testPathPattern=api.test.js
```

## Adding New Tests

1. Create test file in `tests/specs/`
2. Use centralized utilities for test data creation
3. Follow existing patterns for setup/teardown
4. Use appropriate test mode (mock vs integration)

## Coverage and Reporting

- Coverage reports generated in `coverage/` directory
- Test results in `test-results/` directory
- HTML coverage reports available for detailed analysis

## Best Practices

1. **Use centralized utilities** for test data creation and cleanup
2. **Choose appropriate test mode** based on what you're testing
3. **Clean up test data** in `afterAll` hooks
4. **Use descriptive test names** and organize tests logically
5. **Mock external dependencies** in unit tests
6. **Test both success and error scenarios**

## Configuration

### Environment Variables

The test environment is configured in `tests/test-env.js`:

- `TEST_MODE`: 'mock' or 'integration'
- `DATABASE_URL`: PostgreSQL connection string
- `BLOCKCHAIN_ENABLED`: Enable/disable blockchain integration
- `KEYCLOAK_ENABLED`: Enable/disable Keycloak integration
- `JWT_SECRET`: Secret for JWT token generation

### Jest Configuration

See `jest.config.js` for Jest-specific configuration including:
- Test timeout settings
- Coverage thresholds
- Test file patterns
- Setup files 