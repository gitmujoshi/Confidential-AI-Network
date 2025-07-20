# E2E Testing with Playwright

This directory contains End-to-End (E2E) tests for the Contract Management Frontend using Playwright.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Install Playwright Browsers
```bash
npm run test:e2e:install
```

### 3. Start the Backend Server
Make sure your backend server is running on port 5001:
```bash
cd ../backend
npm start
```

### 4. Run E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run tests in debug mode
npm run test:e2e:debug

# View test reports
npm run test:e2e:report
```

## 📁 Test Structure

```
tests/e2e/
├── auth.spec.js              # Authentication tests
├── contracts.spec.js         # Contract management tests
├── dashboard.spec.js         # Dashboard functionality tests
├── training-parameters.spec.js # Max training runs feature tests
├── global-setup.js           # Global test setup
├── global-teardown.js        # Global test cleanup
└── README.md                 # This file
```

## 🧪 Test Categories

### Authentication Tests (`auth.spec.js`)
- Login form display
- Invalid login handling
- Successful login flow
- Registration form
- User registration
- Logout functionality
- Forgot password flow

### Contract Management Tests (`contracts.spec.js`)
- Contract page navigation
- Contract creation
- Contract viewing
- Contract editing
- Contract filtering
- Contract signing
- Contract status display
- Contract deletion

### Dashboard Tests (`dashboard.spec.js`)
- Dashboard display
- User information
- Navigation menu
- Contract statistics
- Recent contracts
- Notifications
- User profile
- Responsive design
- Charts and analytics
- Quick actions
- Search functionality
- Theme switching

### Training Parameters Tests (`training-parameters.spec.js`)
- Max training runs field display
- Field editing
- Input validation
- Contract saving
- Contract details display
- Field editing in details
- JSON format display
- Form validation
- Different contract types
- Export functionality

## 🛠️ Configuration

The E2E tests are configured in `playwright.config.js`:

- **Base URL**: `http://localhost:3000`
- **Test Directory**: `./tests/e2e`
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Screenshots**: On failure
- **Videos**: On failure
- **Traces**: On first retry
- **Web Server**: Automatically starts React dev server

## 🎯 Writing Tests

### Basic Test Structure
```javascript
const { test, expect } = require('@playwright/test');

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/');
    // Login if needed
  });

  test('should do something', async ({ page }) => {
    // Test steps
    await page.getByRole('button', { name: /click me/i }).click();
    
    // Assertions
    await expect(page.getByText(/success/i)).toBeVisible();
  });
});
```

### Best Practices

1. **Use Semantic Selectors**
   ```javascript
   // Good
   await page.getByRole('button', { name: /login/i }).click();
   await page.getByLabel(/email/i).fill('test@example.com');
   
   // Avoid
   await page.click('#login-button');
   await page.fill('#email-input', 'test@example.com');
   ```

2. **Wait for Elements**
   ```javascript
   // Playwright auto-waits, but be explicit when needed
   await expect(page.getByText(/loading/i)).toBeVisible();
   await expect(page.getByText(/loading/i)).not.toBeVisible();
   ```

3. **Use Descriptive Test Names**
   ```javascript
   test('should display error message for invalid email format', async ({ page }) => {
     // Test implementation
   });
   ```

4. **Group Related Tests**
   ```javascript
   test.describe('Contract Creation', () => {
     test('should create contract with valid data', async ({ page }) => {
       // Test implementation
     });
     
     test('should show validation errors for invalid data', async ({ page }) => {
       // Test implementation
     });
   });
   ```

## 🔧 Debugging

### Debug Mode
```bash
npm run test:e2e:debug
```
This opens Playwright Inspector where you can:
- Step through tests
- Inspect elements
- View network requests
- See console logs

### UI Mode
```bash
npm run test:e2e:ui
```
This opens Playwright UI where you can:
- Run tests interactively
- View test results
- Debug failures
- Generate reports

### Screenshots and Videos
Failed tests automatically generate:
- Screenshots in `test-results/`
- Videos in `test-results/`
- Traces in `test-results/`

## 📊 Reports

### HTML Report
```bash
npm run test:e2e:report
```
Opens detailed HTML report with:
- Test results
- Screenshots
- Videos
- Traces
- Performance metrics

### JSON Report
Test results are saved to `test-results/e2e-results.json`

### JUnit Report
Test results are saved to `test-results/e2e-results.xml`

## 🚀 CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd frontend && npm install
      - run: cd frontend && npm run test:e2e:install
      - run: cd backend && npm install
      - run: cd backend && npm start &
      - run: cd frontend && npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

## 🔍 Troubleshooting

### Common Issues

1. **Tests Fail on CI but Pass Locally**
   - Check if backend server is running
   - Verify database connection
   - Check for timing issues

2. **Element Not Found**
   - Use `page.pause()` to debug
   - Check if element is in viewport
   - Verify element selectors

3. **Slow Tests**
   - Use `page.waitForLoadState('networkidle')`
   - Optimize selectors
   - Reduce unnecessary waits

4. **Flaky Tests**
   - Add explicit waits
   - Use more reliable selectors
   - Check for race conditions

### Debug Commands
```bash
# Run specific test file
npm run test:e2e tests/e2e/auth.spec.js

# Run specific test
npm run test:e2e --grep "should login"

# Run tests in specific browser
npm run test:e2e --project=chromium

# Run tests with custom timeout
npm run test:e2e --timeout=60000
```

## 📈 Performance Testing

### Load Testing
```javascript
test('should handle multiple users', async ({ browser }) => {
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();
  
  // Test concurrent operations
});
```

### Visual Regression Testing
```javascript
test('should match screenshot', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveScreenshot('dashboard.png');
});
```

## 🎯 Next Steps

1. **Add More Test Coverage**
   - Dataset management
   - User management
   - Admin functionality
   - Error handling

2. **Performance Testing**
   - Load testing
   - Visual regression testing
   - Accessibility testing

3. **Mobile Testing**
   - Touch interactions
   - Responsive design
   - Mobile-specific features

4. **API Testing**
   - Backend integration
   - Error scenarios
   - Data validation

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Test API](https://playwright.dev/docs/api/class-test)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug) 