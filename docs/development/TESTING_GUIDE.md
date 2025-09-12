# Testing Guide

## 🧪 **Complete Testing Guide for AI Model Training Environment**

This guide provides comprehensive testing strategies, frameworks, and best practices for the AI model training environment.

## 📋 **Testing Overview**

### **Testing Pyramid**
```
        /\
       /  \
      / E2E \     <- End-to-End Tests (Few)
     /______\
    /        \
   /Integration\  <- Integration Tests (Some)
  /____________\
 /              \
/   Unit Tests   \  <- Unit Tests (Many)
/________________\
```

### **Testing Stack**
- **Unit Tests**: Jest + Supertest
- **Integration Tests**: Jest + Test containers
- **E2E Tests**: Playwright
- **API Tests**: Supertest + Jest
- **Frontend Tests**: Jest + React Testing Library
- **Performance Tests**: Artillery + K6

## 🔧 **Testing Setup**

### **Installation**
```bash
# Install testing dependencies
npm install --save-dev jest supertest @testing-library/react @testing-library/jest-dom playwright

# Install additional testing tools
npm install --save-dev artillery k6 @types/jest
```

### **Configuration Files**

#### **Jest Configuration**
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/backend/tests/**/*.test.js',
    '<rootDir>/frontend/src/**/*.test.jsx'
  ],
  collectCoverageFrom: [
    'backend/**/*.js',
    'frontend/src/**/*.jsx',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testTimeout: 10000
};
```

#### **Playwright Configuration**
```javascript
// playwright.config.js
module.exports = {
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 2,
  workers: 4,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ]
};
```

## 🔬 **Unit Testing**

### **Backend Unit Tests**

#### **Service Testing**
```javascript
// backend/tests/unit/services/trainingService.test.js
const TrainingService = require('../../../services/trainingService');
const { TrainingJob } = require('../../../models');

// Mock dependencies
jest.mock('../../../models');
jest.mock('../../../services/contractService');
jest.mock('../../../services/teeProvisioningService');

describe('TrainingService', () => {
  let trainingService;

  beforeEach(() => {
    trainingService = new TrainingService();
    jest.clearAllMocks();
  });

  describe('createTrainingJob', () => {
    test('should create training job successfully', async () => {
      // Arrange
      const jobData = {
        contractId: 'contract-123',
        datasets: ['dataset-1', 'dataset-2'],
        parameters: {
          epochs: 10,
          batchSize: 32
        }
      };

      const mockJob = {
        id: 'job-123',
        ...jobData,
        status: 'pending',
        createdAt: new Date()
      };

      TrainingJob.create.mockResolvedValue(mockJob);

      // Act
      const result = await trainingService.createTrainingJob(jobData);

      // Assert
      expect(result).toEqual(mockJob);
      expect(TrainingJob.create).toHaveBeenCalledWith(jobData);
    });

    test('should throw error for invalid contract', async () => {
      // Arrange
      const jobData = {
        contractId: 'invalid-contract',
        datasets: ['dataset-1'],
        parameters: { epochs: 10 }
      };

      TrainingJob.create.mockRejectedValue(new Error('Invalid contract'));

      // Act & Assert
      await expect(trainingService.createTrainingJob(jobData))
        .rejects
        .toThrow('Invalid contract');
    });
  });

  describe('getTrainingJob', () => {
    test('should return training job by id', async () => {
      // Arrange
      const jobId = 'job-123';
      const mockJob = {
        id: jobId,
        status: 'running',
        progress: 50
      };

      TrainingJob.findByPk.mockResolvedValue(mockJob);

      // Act
      const result = await trainingService.getTrainingJob(jobId);

      // Assert
      expect(result).toEqual(mockJob);
      expect(TrainingJob.findByPk).toHaveBeenCalledWith(jobId);
    });

    test('should return null for non-existent job', async () => {
      // Arrange
      const jobId = 'non-existent';
      TrainingJob.findByPk.mockResolvedValue(null);

      // Act
      const result = await trainingService.getTrainingJob(jobId);

      // Assert
      expect(result).toBeNull();
    });
  });
});
```

#### **Controller Testing**
```javascript
// backend/tests/unit/controllers/trainingController.test.js
const request = require('supertest');
const app = require('../../../server');
const TrainingService = require('../../../services/trainingService');

// Mock the service
jest.mock('../../../services/trainingService');

describe('TrainingController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/training/jobs', () => {
    test('should create training job', async () => {
      // Arrange
      const jobData = {
        contractId: 'contract-123',
        datasets: ['dataset-1'],
        parameters: { epochs: 10 }
      };

      const mockJob = {
        id: 'job-123',
        ...jobData,
        status: 'pending'
      };

      TrainingService.createTrainingJob.mockResolvedValue(mockJob);

      // Act
      const response = await request(app)
        .post('/api/training/jobs')
        .send(jobData)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockJob);
      expect(TrainingService.createTrainingJob).toHaveBeenCalledWith(jobData);
    });

    test('should return 400 for invalid data', async () => {
      // Arrange
      const invalidData = {
        contractId: '', // Invalid empty contract ID
        datasets: [],
        parameters: {}
      };

      // Act
      const response = await request(app)
        .post('/api/training/jobs')
        .send(invalidData)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/training/jobs', () => {
    test('should return list of training jobs', async () => {
      // Arrange
      const mockJobs = [
        { id: 'job-1', status: 'running' },
        { id: 'job-2', status: 'completed' }
      ];

      TrainingService.getTrainingJobs.mockResolvedValue(mockJobs);

      // Act
      const response = await request(app)
        .get('/api/training/jobs')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockJobs);
    });
  });
});
```

### **Frontend Unit Tests**

#### **Component Testing**
```jsx
// frontend/src/components/__tests__/TrainingJobCard.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TrainingJobCard from '../TrainingJobCard';

describe('TrainingJobCard', () => {
  const mockJob = {
    id: 'job-123',
    name: 'Test Training Job',
    status: 'running',
    progress: 50,
    createdAt: '2024-01-01T00:00:00Z'
  };

  const mockHandlers = {
    onStart: jest.fn(),
    onStop: jest.fn(),
    onView: jest.fn(),
    onDelete: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders job information correctly', () => {
    render(
      <TrainingJobCard 
        job={mockJob} 
        {...mockHandlers} 
      />
    );

    expect(screen.getByText('Test Training Job')).toBeInTheDocument();
    expect(screen.getByText('running')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  test('calls onStart when start button is clicked', () => {
    const jobWithStoppedStatus = { ...mockJob, status: 'stopped' };
    
    render(
      <TrainingJobCard 
        job={jobWithStoppedStatus} 
        {...mockHandlers} 
      />
    );

    const startButton = screen.getByText('Start');
    fireEvent.click(startButton);

    expect(mockHandlers.onStart).toHaveBeenCalledWith('job-123');
  });

  test('calls onStop when stop button is clicked', () => {
    render(
      <TrainingJobCard 
        job={mockJob} 
        {...mockHandlers} 
      />
    );

    const stopButton = screen.getByText('Stop');
    fireEvent.click(stopButton);

    expect(mockHandlers.onStop).toHaveBeenCalledWith('job-123');
  });

  test('shows progress bar for running jobs', () => {
    render(
      <TrainingJobCard 
        job={mockJob} 
        {...mockHandlers} 
      />
    );

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });
});
```

#### **Hook Testing**
```jsx
// frontend/src/hooks/__tests__/useTrainingJobs.test.js
import { renderHook, act } from '@testing-library/react';
import { useTrainingJobs } from '../useTrainingJobs';
import * as trainingService from '../../services/trainingService';

// Mock the service
jest.mock('../../services/trainingService');

describe('useTrainingJobs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should fetch training jobs on mount', async () => {
    // Arrange
    const mockJobs = [
      { id: 'job-1', name: 'Job 1' },
      { id: 'job-2', name: 'Job 2' }
    ];

    trainingService.getTrainingJobs.mockResolvedValue(mockJobs);

    // Act
    const { result } = renderHook(() => useTrainingJobs());

    // Wait for async operation
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Assert
    expect(result.current.jobs).toEqual(mockJobs);
    expect(result.current.loading).toBe(false);
    expect(trainingService.getTrainingJobs).toHaveBeenCalledTimes(1);
  });

  test('should create training job', async () => {
    // Arrange
    const newJob = {
      name: 'New Job',
      contractId: 'contract-123',
      datasets: ['dataset-1']
    };

    const createdJob = { id: 'job-123', ...newJob };
    trainingService.createTrainingJob.mockResolvedValue(createdJob);

    // Act
    const { result } = renderHook(() => useTrainingJobs());

    await act(async () => {
      await result.current.createJob(newJob);
    });

    // Assert
    expect(result.current.jobs).toContain(createdJob);
    expect(trainingService.createTrainingJob).toHaveBeenCalledWith(newJob);
  });
});
```

## 🔗 **Integration Testing**

### **API Integration Tests**
```javascript
// backend/tests/integration/api/training.test.js
const request = require('supertest');
const app = require('../../../server');
const { TrainingJob } = require('../../../models');
const sequelize = require('../../../config/database');

describe('Training API Integration', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await TrainingJob.destroy({ where: {} });
  });

  describe('POST /api/training/jobs', () => {
    test('should create and retrieve training job', async () => {
      // Arrange
      const jobData = {
        contractId: 'contract-123',
        datasets: ['dataset-1', 'dataset-2'],
        parameters: {
          epochs: 10,
          batchSize: 32
        }
      };

      // Act - Create job
      const createResponse = await request(app)
        .post('/api/training/jobs')
        .send(jobData)
        .expect(201);

      // Assert - Check response
      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data).toHaveProperty('id');
      expect(createResponse.body.data.contractId).toBe(jobData.contractId);

      // Act - Retrieve job
      const jobId = createResponse.body.data.id;
      const getResponse = await request(app)
        .get(`/api/training/jobs/${jobId}`)
        .expect(200);

      // Assert - Check retrieved job
      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.id).toBe(jobId);
      expect(getResponse.body.data.status).toBe('pending');
    });
  });

  describe('GET /api/training/jobs', () => {
    test('should return paginated list of jobs', async () => {
      // Arrange - Create test jobs
      const jobs = await Promise.all([
        TrainingJob.create({
          contractId: 'contract-1',
          datasets: ['dataset-1'],
          parameters: { epochs: 10 }
        }),
        TrainingJob.create({
          contractId: 'contract-2',
          datasets: ['dataset-2'],
          parameters: { epochs: 20 }
        })
      ]);

      // Act
      const response = await request(app)
        .get('/api/training/jobs')
        .query({ page: 1, limit: 10 })
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.jobs).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
    });
  });
});
```

### **Database Integration Tests**
```javascript
// backend/tests/integration/database/training.test.js
const { TrainingJob, Contract, Dataset } = require('../../../models');
const sequelize = require('../../../config/database');

describe('Training Database Integration', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await TrainingJob.destroy({ where: {} });
    await Contract.destroy({ where: {} });
    await Dataset.destroy({ where: {} });
  });

  test('should create training job with associations', async () => {
    // Arrange
    const contract = await Contract.create({
      id: 'contract-123',
      name: 'Test Contract',
      status: 'active'
    });

    const dataset = await Dataset.create({
      id: 'dataset-123',
      name: 'Test Dataset',
      status: 'available'
    });

    // Act
    const trainingJob = await TrainingJob.create({
      contractId: contract.id,
      datasets: [dataset.id],
      parameters: { epochs: 10 }
    });

    // Assert
    expect(trainingJob.id).toBeDefined();
    expect(trainingJob.contractId).toBe(contract.id);
    expect(trainingJob.datasets).toContain(dataset.id);
  });

  test('should handle training job updates', async () => {
    // Arrange
    const trainingJob = await TrainingJob.create({
      contractId: 'contract-123',
      datasets: ['dataset-1'],
      parameters: { epochs: 10 }
    });

    // Act
    await trainingJob.update({
      status: 'running',
      progress: 50
    });

    // Assert
    const updatedJob = await TrainingJob.findByPk(trainingJob.id);
    expect(updatedJob.status).toBe('running');
    expect(updatedJob.progress).toBe(50);
  });
});
```

## 🎭 **End-to-End Testing**

### **Playwright E2E Tests**
```javascript
// tests/e2e/training-workflow.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Training Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid=username]', 'testuser');
    await page.fill('[data-testid=password]', 'password');
    await page.click('[data-testid=login-button]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should create and monitor training job', async ({ page }) => {
    // Navigate to training page
    await page.click('[data-testid=training-menu]');
    await expect(page).toHaveURL('/training');

    // Create new training job
    await page.click('[data-testid=create-training-button]');
    await page.fill('[data-testid=job-name]', 'E2E Test Job');
    await page.selectOption('[data-testid=contract-select]', 'contract-123');
    await page.selectOption('[data-testid=dataset-select]', 'dataset-1');
    await page.fill('[data-testid=epochs-input]', '10');
    await page.fill('[data-testid=batch-size-input]', '32');
    await page.click('[data-testid=submit-button]');

    // Verify job was created
    await expect(page.locator('[data-testid=job-status]')).toContainText('Started');
    await expect(page.locator('[data-testid=job-name]')).toContainText('E2E Test Job');

    // Monitor job progress
    await page.click('[data-testid=view-details-button]');
    await expect(page).toHaveURL(/\/training\/\d+/);
    await expect(page.locator('[data-testid=progress-bar]')).toBeVisible();

    // Wait for job completion (with timeout)
    await page.waitForSelector('[data-testid=job-completed]', { timeout: 60000 });
    await expect(page.locator('[data-testid=job-status]')).toContainText('Completed');
  });

  test('should handle training job failure', async ({ page }) => {
    // Create job with invalid parameters
    await page.click('[data-testid=create-training-button]');
    await page.fill('[data-testid=job-name]', 'Invalid Job');
    await page.fill('[data-testid=epochs-input]', '0'); // Invalid epochs
    await page.click('[data-testid=submit-button]');

    // Verify error message
    await expect(page.locator('[data-testid=error-message]')).toContainText('Invalid parameters');
  });
});
```

### **API E2E Tests**
```javascript
// tests/e2e/api/training-api.test.js
const request = require('supertest');
const app = require('../../backend/server');

describe('Training API E2E', () => {
  let authToken;
  let testJobId;

  beforeAll(async () => {
    // Setup test data
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testuser',
        password: 'password'
      });
    
    authToken = loginResponse.body.token;
  });

  test('complete training workflow', async () => {
    // 1. Create training job
    const createResponse = await request(app)
      .post('/api/training/jobs')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        contractId: 'contract-123',
        datasets: ['dataset-1', 'dataset-2'],
        parameters: {
          epochs: 10,
          batchSize: 32
        }
      })
      .expect(201);

    testJobId = createResponse.body.data.id;

    // 2. Start training job
    await request(app)
      .post(`/api/training/jobs/${testJobId}/start`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // 3. Monitor job progress
    const progressResponse = await request(app)
      .get(`/api/training/jobs/${testJobId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(progressResponse.body.data.status).toBe('running');

    // 4. Wait for completion (with polling)
    let completed = false;
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max

    while (!completed && attempts < maxAttempts) {
      const statusResponse = await request(app)
        .get(`/api/training/jobs/${testJobId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      if (statusResponse.body.data.status === 'completed') {
        completed = true;
      } else {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        attempts++;
      }
    }

    expect(completed).toBe(true);

    // 5. Download model
    const downloadResponse = await request(app)
      .get(`/api/training/jobs/${testJobId}/model`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(downloadResponse.body.data.modelUrl).toBeDefined();
  });
});
```

## ⚡ **Performance Testing**

### **Load Testing with Artillery**
```yaml
# tests/performance/load-test.yml
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 20
    - duration: 60
      arrivalRate: 10
  defaults:
    headers:
      Authorization: 'Bearer {{ authToken }}'

scenarios:
  - name: "Training API Load Test"
    weight: 100
    flow:
      - post:
          url: "/api/training/jobs"
          json:
            contractId: "contract-123"
            datasets: ["dataset-1"]
            parameters:
              epochs: 10
              batchSize: 32
      - get:
          url: "/api/training/jobs"
      - get:
          url: "/api/training/jobs/{{ jobId }}"
```

### **Stress Testing with K6**
```javascript
// tests/performance/stress-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.1'],     // Error rate under 10%
  },
};

export default function() {
  const baseURL = 'http://localhost:3001';
  const headers = {
    'Authorization': 'Bearer test-token',
    'Content-Type': 'application/json',
  };

  // Test training job creation
  const createResponse = http.post(`${baseURL}/api/training/jobs`, JSON.stringify({
    contractId: 'contract-123',
    datasets: ['dataset-1'],
    parameters: { epochs: 10, batchSize: 32 }
  }), { headers });

  check(createResponse, {
    'create job status is 201': (r) => r.status === 201,
    'create job response time < 2s': (r) => r.timings.duration < 2000,
  });

  // Test job listing
  const listResponse = http.get(`${baseURL}/api/training/jobs`, { headers });

  check(listResponse, {
    'list jobs status is 200': (r) => r.status === 200,
    'list jobs response time < 1s': (r) => r.timings.duration < 1000,
  });

  sleep(1);
}
```

## 🔍 **Test Data Management**

### **Test Data Setup**
```javascript
// tests/fixtures/testData.js
const testData = {
  users: [
    {
      id: 'user-1',
      username: 'testuser',
      email: 'test@example.com',
      role: 'TDC'
    },
    {
      id: 'user-2',
      username: 'admin',
      email: 'admin@example.com',
      role: 'AppAdmin'
    }
  ],
  contracts: [
    {
      id: 'contract-123',
      name: 'Test Contract',
      status: 'active',
      tdcId: 'user-1',
      tdpId: 'user-2'
    }
  ],
  datasets: [
    {
      id: 'dataset-1',
      name: 'Test Dataset',
      status: 'available',
      providerId: 'user-2'
    }
  ],
  trainingJobs: [
    {
      id: 'job-123',
      contractId: 'contract-123',
      datasets: ['dataset-1'],
      parameters: { epochs: 10, batchSize: 32 },
      status: 'pending'
    }
  ]
};

module.exports = testData;
```

### **Test Database Setup**
```javascript
// tests/setup/database.js
const { sequelize } = require('../../backend/config/database');
const testData = require('../fixtures/testData');

const setupTestDatabase = async () => {
  // Sync database
  await sequelize.sync({ force: true });
  
  // Seed test data
  const { User, Contract, Dataset, TrainingJob } = require('../../backend/models');
  
  await User.bulkCreate(testData.users);
  await Contract.bulkCreate(testData.contracts);
  await Dataset.bulkCreate(testData.datasets);
  await TrainingJob.bulkCreate(testData.trainingJobs);
};

const cleanupTestDatabase = async () => {
  await sequelize.close();
};

module.exports = {
  setupTestDatabase,
  cleanupTestDatabase
};
```

## 📊 **Test Reporting**

### **Coverage Reports**
```bash
# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

### **Test Results Dashboard**
```javascript
// tests/reporting/testResults.js
const fs = require('fs');
const path = require('path');

const generateTestReport = (results) => {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.numTotalTests,
      passed: results.numPassedTests,
      failed: results.numFailedTests,
      skipped: results.numPendingTests
    },
    duration: results.startTime,
    coverage: results.coverageMap
  };

  // Save report
  const reportPath = path.join(__dirname, '../reports/test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  return report;
};

module.exports = { generateTestReport };
```

## 🚀 **Running Tests**

### **Test Commands**
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:api
npm run test:frontend

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run tests in parallel
npm run test:parallel

# Run performance tests
npm run test:performance
```

### **CI/CD Integration**
```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      ***REMOVED-DB_PASSWORD***:
        image: ***REMOVED-DB_PASSWORD***:13
        env:
          POSTGRES_PASSWORD: ***REMOVED-DB_PASSWORD***
          POSTGRES_DB: contract_management_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Run integration tests
      run: npm run test:integration
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
```

## 📚 **Best Practices**

### **Test Writing Best Practices**
1. **Arrange-Act-Assert**: Structure tests clearly
2. **One Assertion Per Test**: Keep tests focused
3. **Descriptive Test Names**: Use clear, descriptive names
4. **Independent Tests**: Tests should not depend on each other
5. **Mock External Dependencies**: Isolate units under test
6. **Test Edge Cases**: Cover boundary conditions
7. **Keep Tests Fast**: Optimize for speed
8. **Maintain Test Data**: Keep test data up to date

### **Test Organization**
1. **Group Related Tests**: Use describe blocks
2. **Use Setup/Teardown**: beforeEach/afterEach hooks
3. **Share Common Code**: Extract helper functions
4. **Use Test Utilities**: Create reusable test helpers
5. **Document Test Intent**: Add comments for complex tests

### **Test Maintenance**
1. **Regular Review**: Review tests regularly
2. **Update Tests**: Keep tests in sync with code
3. **Remove Obsolete Tests**: Delete outdated tests
4. **Refactor Tests**: Improve test quality over time
5. **Monitor Test Performance**: Track test execution time

---

**Testing Guide Status**: ✅ **COMPREHENSIVE**  
**Unit Tests**: ✅ **COVERED**  
**Integration Tests**: ✅ **INCLUDED**  
**E2E Tests**: ✅ **DETAILED**  
**Performance Tests**: ✅ **CONFIGURED**
