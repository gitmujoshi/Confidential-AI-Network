# E2E Test Suite

Comprehensive end-to-end testing suite for the Contract Management System, covering role-based access control, core functionality, and advanced features.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Playwright browsers installed
- **Backend API running** at `BACKEND_URL` / port from repo root `config.env` (same as `getBackendURL()` in `frontend/load-config.js`). Global setup calls `/health` and will **abort** if the server is down.

### Installation
```bash
# Install dependencies
npm install

# Install Playwright browsers
npm run test:e2e:install
```

### Running Tests
```bash
# Run all Playwright projects (Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari)
npm run test:e2e

# Faster: desktop Chromium only
npm run test:e2e:chromium

# Subsets (see package.json)
npm run test:e2e:auth
npm run test:e2e:core
npm run test:e2e:advanced
npm run test:e2e:role-based

# Run with UI
npm run test:e2e:ui

# Run in headed mode (visible browser)
npm run test:e2e:headed
```

**CI / local:** `playwright.config.js` sets `reuseExistingServer: true`, so if `FRONTEND_URL` (e.g. `http://localhost:3000`) already responds, Playwright will not try to bind a second dev server. `CI=1` is therefore safe while `npm run start` is running.

## 📋 Test Suites (current files)

### 1. Authentication (`auth`)
- **File**: `auth.spec.js`
- **Description**: Login, logout, registration, forgot password, TDC dashboard smoke

### 2. Core (`core`)
- **Files**: `auth.spec.js`, `contracts.spec.js`, `dashboard.spec.js`, `tdc-training.spec.js`

### 3. Advanced (`advanced`)
- **Files** (`npm run test:e2e:advanced`): `training-parameters.spec.js`, `system-fixes-validation.spec.js`, `tdc-training.spec.js`, `ccrp-training-environment.spec.js`

### 4. Full E2E (`integration` / `all`)
- **Path**: `tests/e2e/*.spec.js` (same as `npm run test:e2e`)

## 🔐 Role-Based Access Tests

### Test Users
- **TDP User**: `tdp.role-test@example.com` - Can create datasets, view own data
- **TDC User**: `tdc.role-test@example.com` - Can create contracts, view public datasets
- **CCRP User**: `ccrp.role-test@example.com` - Can manage environments, view assigned contracts
- **Admin User**: `admin.role-test@example.com` - Can view all data, manage users

### Test Scenarios
1. **TDP Access Control**
   - Can only see their own datasets
   - Can only see contracts they're involved in
   - Cannot see "Create Contract" button
   - Can add new datasets

2. **TDC Access Control**
   - Can see public datasets
   - Can see their own contracts
   - Can see "Create Contract" button
   - Cannot add datasets

3. **CCRP Access Control**
   - Can see public datasets
   - Can see contracts assigned to them
   - Cannot see "Create Contract" button
   - Cannot add datasets

4. **Admin Access Control**
   - Can see all datasets
   - Can see all contracts
   - Can see Users menu
   - Full system access

## 🛠️ Test data

Seeding runs in **`global-setup.js`** via `test-data-setup.js` (APIs only, no direct DB). Ensure backend is up and `config.env` / `FRONTEND_URL` match before running tests.

### TDC / CCRP training smoke tests
- **`tdc-training.spec.js`** — TDC user loads **`/tdc/training`**, checks copy; API smoke: unknown contract returns **404** for job list.
- **`ccrp-training-environment.spec.js`** — CCRP user loads **`/ccrp/training-environment`** (uses **`/api/ccrp/training/...`** in the app).

See **[docs/training/TDC_TRAINING_RUNTIME.md](../../../docs/training/TDC_TRAINING_RUNTIME.md)** for API details.

## 📊 Test Reporting

### HTML Report
```bash
# Generate HTML report
npm run test:e2e:report
```

### Test Results
- **Location**: `test-results/`
- **HTML Report**: `test-results/html-report/index.html`
- **JSON Results**: `test-results/results.json`
- **JUnit Results**: `test-results/results.xml`

## 🔧 Configuration

### Environment Variables
```bash
# Set test base URL
export TEST_BASE_URL=http://localhost:3000

# Set test user credentials
export TEST_ADMIN_EMAIL=admin@example.com
export TEST_ADMIN_PASSWORD=Test123!
```

### Browser Configuration
- **Chromium**: Default browser
- **Firefox**: Alternative browser
- **WebKit**: Safari engine
- **Mobile**: Chrome Mobile, Safari Mobile

### Test Configuration
- **Timeout**: 30 seconds per test
- **Retries**: 2 retries on failure
- **Parallel**: Tests run in parallel
- **Workers**: 1 worker in CI, multiple locally

## 🐛 Debugging

### Debug Mode
```bash
# Run tests in debug mode
npm run test:e2e:debug
```

### Headed Mode
```bash
# Run tests with visible browser
npm run test:e2e:headed
```

### UI Mode
```bash
# Run tests with Playwright UI
npm run test:e2e:ui
```

### Specific Test
```bash
npx playwright test tests/e2e/dashboard.spec.js
npx playwright test --grep "should load admin dashboard"
```

## 📝 Writing Tests

### Test Structure
```javascript
const { test, expect } = require('@playwright/test');

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Test implementation
  });
});
```

### Best Practices
1. **Use data-testid attributes** for reliable element selection
2. **Wait for network idle** after navigation
3. **Use proper assertions** with meaningful messages
4. **Clean up test data** after tests
5. **Use page objects** for complex interactions

### Test Data
- Use the test data setup scripts
- Create isolated test data for each test
- Clean up after each test
- Use meaningful test data names

## 🚨 Troubleshooting

### Common Issues

#### Tests Failing
1. Check if the application is running
2. Verify test data is set up correctly
3. Check browser console for errors
4. Run tests in headed mode to see what's happening

#### Test Data Issues
1. Run cleanup and setup again
2. Check database for existing test data
3. Verify user credentials are correct

#### Browser Issues
1. Reinstall Playwright browsers
2. Check browser version compatibility
3. Try different browser

### Getting Help
1. Check test logs in `test-results/`
2. Run tests in debug mode
3. Check application logs
4. Review test documentation

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Test Organization Guide](./test-organization.md)
- [Test Data Setup](./setup-role-based-tests.js)
- [Test Runner](./run-tests.js)