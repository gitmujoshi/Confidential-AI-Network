# Contract Management System Backend Test Suite

## User Guide for Testing

### Test Structure
- **All test specs** are now located in `backend/tests/specs/`.
- **Test utilities** (e.g., `test-server.js`, `setup.js`) remain in `backend/tests/`.
- **Test runner scripts** (e.g., `run-tests.js`, `run-all-tests.js`) remain in `backend/tests/`.

### How to Run Tests

#### Run All Tests
```sh
npm test
```
Or, from the backend directory:
```sh
npm run test
```

#### Run a Specific Test File
```sh
npx jest tests/specs/<test-file-name>.js
```

#### Run Tests by Name Pattern
```sh
npm test -- --testNamePattern="integration|models|blockchainService"
```

### Test Types
- **Unit tests**: Test individual services and models.
- **Integration tests**: Test API endpoints and service interactions (using a mock test server).
- **Comprehensive tests**: Cover end-to-end flows.

### Adding New Tests
1. Add new test files to `backend/tests/specs/`.
2. Use relative imports for shared utilities, e.g.:
   ```js
   const app = require('../test-server');
   ```
3. Follow existing test patterns for structure and assertions.

### Troubleshooting
- **Test not found**: Ensure your test file is in `specs/` and named `*.test.js`.
- **Import errors**: Use correct relative paths (e.g., `../test-server`).
- **Database errors**: Make sure the test database is running and configured.
- **Keycloak errors**: Ensure Keycloak is running if integration tests require it.
- **Port conflicts**: Stop any running servers before running tests.

### Coverage
To generate a coverage report:
```sh
npm test -- --coverage
```

---

For more details, see the comments in each test file or ask the development team. 