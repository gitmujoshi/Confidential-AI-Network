# Integration Testing Guide

This guide explains how to run integration tests with real Keycloak, blockchain, and database services.

## Overview

Integration tests use real services instead of mocks to test the complete application flow:
- **Keycloak**: Real authentication and user management
- **Blockchain**: Real Ethereum node (Ganache/Hardhat) with smart contracts
- **Database**: Real PostgreSQL database with actual data persistence

## Prerequisites

1. **Docker and Docker Compose**: Must be installed and running
2. **Node.js**: Version 16 or higher
3. **npm**: For package management

## Quick Start

### 1. Start the Integration Test Environment

```bash
# Start all required services
npm run test:integration:setup

# Or manually:
./scripts/start-integration-test-env.sh
```

This will start:
- PostgreSQL database (port 5433)
- Keycloak server (port 8081)
- Ganache blockchain (port 8546)
- Hardhat node (port 8547)

### 2. Run Integration Tests

```bash
# Run integration tests
npm run test:integration

# Or manually:
npx jest tests/integration.test.js --verbose --timeout=60000
```

### 3. Stop the Environment

```bash
# Stop all services
npm run test:integration:teardown

# Or manually:
./scripts/stop-integration-test-env.sh
```

### 4. Run Complete Integration Test Suite

```bash
# Start environment, run tests, and stop environment
npm run test:integration:full
```

## Service Configuration

### Database (PostgreSQL)
- **URL**: `postgresql://testuser:testpass@localhost:5433/contract_management_test`
- **Port**: 5433
- **Database**: `contract_management_test`
- **User**: `testuser`
- **Password**: `testpass`

### Keycloak
- **URL**: `http://localhost:8081`
- **Admin**: `admin`
- **Password**: `admin123`
- **Realm**: `contract-management-test`
- **Client ID**: `backend-test`

### Blockchain (Ganache)
- **URL**: `http://localhost:8546`
- **Network ID**: 1337
- **Accounts**: 10 pre-funded accounts
- **Mnemonic**: `test test test test test test test test test test test junk`

### Blockchain (Hardhat)
- **URL**: `http://localhost:8547`
- **Network ID**: 31337
- **Accounts**: 20 pre-funded accounts

## Test Accounts

The integration tests use these pre-funded accounts:

### Private Keys
```javascript
TDP:  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
TDC:  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
CCRP: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a'
ADMIN: '0x7c852118eafd6e862e4eaa3b37b6c7b1e6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b'
```

### Addresses
```javascript
TDP:   '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
TDC:   '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
CCRP:  '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
ADMIN: '0x90F79bf6EB2c4f870365E785982E1f101E93b906'
```

## Test Structure

### Integration Test Categories

1. **Service Health Checks**
   - Database connection
   - Keycloak connection
   - Blockchain connection
   - Block number verification

2. **Keycloak Integration**
   - Realm creation
   - Client creation
   - User creation
   - Authentication

3. **Blockchain Integration**
   - Party registration
   - Contract creation
   - Contract signing
   - Contract retrieval

4. **Database Integration**
   - User creation
   - Dataset creation
   - AI model creation
   - Contract creation

5. **API Integration**
   - AI models endpoint
   - Datasets endpoint
   - Contracts endpoint

6. **End-to-End Flow**
   - Complete contract lifecycle
   - Status transitions
   - Data persistence

## Environment Variables

The integration tests use these environment variables (configured in `tests/integration-env.js`):

```javascript
DATABASE_URL: 'postgresql://testuser:testpass@localhost:5433/contract_management_test'
KEYCLOAK_URL: 'http://localhost:8081'
BLOCKCHAIN_URL: 'http://localhost:8546' // or 8547 for Hardhat
BLOCKCHAIN_ENABLED: 'true'
JWT_SECRET: 'integration-test-secret-key-for-jwt-signing'
```

## Troubleshooting

### Common Issues

1. **Docker not running**
   ```bash
   # Start Docker Desktop
   # Then run the setup script
   ```

2. **Port conflicts**
   ```bash
   # Check if ports are in use
   lsof -i :5433
   lsof -i :8081
   lsof -i :8546
   lsof -i :8547
   
   # Stop conflicting services
   ```

3. **Services not ready**
   ```bash
   # Check service status
   docker-compose -f docker-compose.test.yml ps
   
   # Check service logs
   docker-compose -f docker-compose.test.yml logs
   ```

4. **Database connection issues**
   ```bash
   # Test database connection
   psql postgresql://testuser:testpass@localhost:5433/contract_management_test
   ```

5. **Keycloak connection issues**
   ```bash
   # Test Keycloak health
   curl http://localhost:8081/health/ready
   ```

6. **Blockchain connection issues**
   ```bash
   # Test Ganache
   curl -X POST -H "Content-Type: application/json" \
     --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
     http://localhost:8546
   ```

### Debug Mode

Run tests with verbose output:
```bash
npm run test:integration -- --verbose
```

### Manual Service Checks

```bash
# Check PostgreSQL
docker-compose -f docker-compose.test.yml exec postgres-test pg_isready -U testuser -d contract_management_test

# Check Keycloak
curl -f http://localhost:8081/health/ready

# Check Ganache
curl -f -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  http://localhost:8546
```

## Advanced Configuration

### Using Different Blockchain Networks

Edit `tests/integration-env.js` to switch between Ganache and Hardhat:

```javascript
// For Ganache
BLOCKCHAIN_URL: 'http://localhost:8546'

// For Hardhat
BLOCKCHAIN_URL: 'http://localhost:8547'
```

### Custom Test Data

Modify the test data in `tests/integration.test.js`:

```javascript
const testUsers = [
  {
    email: 'custom-tdp@example.com',
    username: 'custom-tdp',
    password: 'CustomPassword123',
    role: 'TDP'
  }
  // ... more users
];
```

### Adding New Test Cases

1. Create a new test file: `tests/new-integration.test.js`
2. Import the integration environment: `require('./integration-env')`
3. Use real services without mocks
4. Add to package.json scripts if needed

## CI/CD Integration

For continuous integration, add to your CI pipeline:

```yaml
# Example GitHub Actions
- name: Start Integration Environment
  run: npm run test:integration:setup

- name: Wait for Services
  run: sleep 60

- name: Run Integration Tests
  run: npm run test:integration

- name: Stop Integration Environment
  if: always()
  run: npm run test:integration:teardown
```

## Performance Considerations

- Integration tests are slower than unit tests
- Each test suite takes 30-60 seconds
- Consider running in parallel for CI/CD
- Use separate test databases for isolation

## Security Notes

- Test environment uses weak passwords
- Test blockchain has pre-funded accounts
- Never use test credentials in production
- Test data is isolated from production

## Next Steps

1. **Deploy Smart Contracts**: Deploy your contracts to the test blockchain
2. **Configure Keycloak**: Set up your specific realm and client configuration
3. **Add More Tests**: Extend the test suite for your specific use cases
4. **Performance Testing**: Add load testing with real services
5. **Monitoring**: Add health checks and monitoring for test services 