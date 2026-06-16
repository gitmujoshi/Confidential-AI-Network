# Developer Guide

## 🛠️ **Complete Developer Guide for AI Model Training Environment**

This guide provides comprehensive documentation for developers who need to enhance, fix, and test the AI model training environment locally.

## 📋 **Table of Contents**

1. [Development Environment Setup](#development-environment-setup)
2. [Project Structure](#project-structure)
3. [Local Development Workflow](#local-development-workflow)
4. [Testing Framework](#testing-framework)
5. [Debugging and Troubleshooting](#debugging-and-troubleshooting)
6. [Code Standards and Best Practices](#code-standards-and-best-practices)
7. [API Development](#api-development)
8. [Frontend Development](#frontend-development)
9. [Backend Development](#backend-development)
10. [Database Development](#database-development)
11. [Deployment and CI/CD](#deployment-and-cicd)
12. [Contributing Guidelines](#contributing-guidelines)

## 🏗️ **Development Environment Setup**

### **Prerequisites**
- **Node.js**: v18+ (LTS recommended)
- **npm**: v8+ or **yarn**: v1.22+
- **Docker**: v20.10+ and Docker Compose
- **Git**: v2.30+
- **IDE**: VS Code (recommended) or any modern IDE
- **Database**: PostgreSQL v13+ (or use Docker)

### **Quick Setup**
```bash
# Clone the repository
git clone https://github.com/gitmujoshi/ContractManagement.git
cd ContractManagement

# Install dependencies
npm install

# Set up environment variables
cp config.env.example config.local.env
# Edit config.local.env with your local settings

# Start local development environment
./scripts/dev-start.sh

# Or use Docker Compose for full stack
docker-compose -f docker-compose.dev.yml up -d
```

### **Detailed Setup Instructions**

#### **1. Backend Setup**
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set up local database
npm run db:setup

# Run migrations
npm run db:migrate

# Seed development data
npm run db:seed

# Start development server
npm run dev
```

#### **2. Frontend Setup**
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

#### **3. Gateway Setup**
```bash
# Navigate to gateway directory
cd gateway

# Install dependencies
npm install

# Start gateway server
npm start
```

## 📁 **Project Structure**

```
ContractManagement/
├── backend/                    # Backend API services
│   ├── controllers/           # API controllers
│   ├── models/               # Database models
│   ├── routes/               # API routes
│   ├── services/             # Business logic services
│   ├── middleware/           # Express middleware
│   ├── utils/                # Utility functions
│   ├── tests/                # Backend tests
│   └── server.js             # Main server file
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── utils/           # Utility functions
│   │   └── App.js           # Main app component
│   └── public/              # Static assets
├── gateway/                   # API Gateway
│   ├── middleware/          # Gateway middleware
│   └── server.js            # Gateway server
├── docs/                     # Documentation
│   ├── development/         # Developer documentation
│   ├── production/          # Production documentation
│   └── training/            # User training documentation
├── scripts/                  # Development scripts
├── tests/                    # Integration tests
├── docker-compose.dev.yml    # Development Docker setup
├── config.local.env          # Local environment variables
└── package.json              # Root package.json
```

## 🔄 **Local Development Workflow**

### **Daily Development Workflow**
```bash
# 1. Start your day
git pull origin main
npm install  # If dependencies changed

# 2. Start development environment
./scripts/dev-start.sh

# 3. Make your changes
# Edit code, add features, fix bugs

# 4. Test your changes
npm test
npm run test:integration
npm run test:e2e

# 5. Commit your changes
git add .
git commit -m "feat: add new feature"
git push origin feature/your-feature

# 6. End your day
./scripts/dev-stop.sh
```

### **Feature Development Workflow**
```bash
# 1. Create feature branch
git checkout -b feature/your-feature-name

# 2. Develop feature
# Make your changes, write tests

# 3. Test thoroughly
npm test
npm run test:integration
npm run test:e2e

# 4. Update documentation
# Update relevant docs

# 5. Create pull request
git push origin feature/your-feature-name
# Create PR on GitHub

# 6. Code review and merge
# Address review comments
# Merge to main
```

### **Bug Fix Workflow**
```bash
# 1. Create bug fix branch
git checkout -b fix/bug-description

# 2. Reproduce the bug
# Write failing test first

# 3. Fix the bug
# Implement the fix

# 4. Verify fix
npm test
# Manual testing

# 5. Update tests
# Add regression tests

# 6. Commit and push
git add .
git commit -m "fix: resolve bug description"
git push origin fix/bug-description
```

## 🧪 **Testing Framework**

### **Testing Stack**
- **Unit Tests**: Jest + Supertest
- **Integration Tests**: Jest + Test containers
- **E2E Tests**: Playwright
- **API Tests**: Supertest + Jest
- **Frontend Tests**: Jest + React Testing Library

### **Running Tests**
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e          # End-to-end tests only
npm run test:api          # API tests only
npm run test:frontend     # Frontend tests only

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=user.test.js
```

### **Writing Tests**

#### **Unit Test Example**
```javascript
// backend/tests/unit/user.test.js
const request = require('supertest');
const app = require('../../server');

describe('User API', () => {
  test('GET /api/users should return users', async () => {
    const response = await request(app)
      .get('/api/users')
      .expect(200);
    
    expect(response.body).toHaveProperty('users');
    expect(Array.isArray(response.body.users)).toBe(true);
  });

  test('POST /api/users should create user', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com'
    };

    const response = await request(app)
      .post('/api/users')
      .send(userData)
      .expect(201);
    
    expect(response.body).toHaveProperty('id');
    expect(response.body.username).toBe(userData.username);
  });
});
```

#### **Integration Test Example**
```javascript
// backend/tests/integration/training.test.js
const { TrainingOrchestrationService } = require('../../services/trainingOrchestrationService');

describe('Training Integration', () => {
  let trainingService;

  beforeEach(() => {
    trainingService = new TrainingOrchestrationService();
  });

  test('should start training job', async () => {
    const trainingConfig = {
      contractId: 'test-contract',
      datasets: ['dataset1', 'dataset2'],
      parameters: {
        epochs: 10,
        batchSize: 32
      }
    };

    const result = await trainingService.startTraining(trainingConfig);
    
    expect(result).toHaveProperty('jobId');
    expect(result.status).toBe('started');
  });
});
```

#### **E2E Test Example**
```javascript
// tests/e2e/training-workflow.spec.js
const { test, expect } = require('@playwright/test');

test('complete training workflow', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[data-testid=username]', 'testuser');
  await page.fill('[data-testid=password]', 'password');
  await page.click('[data-testid=login-button]');

  // Navigate to training
  await page.click('[data-testid=training-menu]');
  await expect(page).toHaveURL('/training');

  // Create training job
  await page.click('[data-testid=create-training-button]');
  await page.fill('[data-testid=job-name]', 'Test Training Job');
  await page.selectOption('[data-testid=dataset-select]', 'dataset1');
  await page.click('[data-testid=submit-button]');

  // Verify job created
  await expect(page.locator('[data-testid=job-status]')).toContainText('Started');
});
```

## 🐛 **Debugging and Troubleshooting**

### **Backend Debugging**
```bash
# Start with debugging enabled
npm run dev:debug

# Or use Node.js debugger
node --inspect server.js

# Debug specific test
npm test -- --testPathPattern=user.test.js --verbose
```

### **Frontend Debugging**
```bash
# Start with React DevTools
npm start

# Debug in browser
# Open Chrome DevTools
# Set breakpoints in Sources tab
# Use React DevTools extension
```

### **Database Debugging**
```bash
# Connect to database
psql -h localhost -U ***REMOVED-DB_PASSWORD*** -d contract_management

# Check database logs
docker logs contract-management-db

# Run database queries
npm run db:query "SELECT * FROM users LIMIT 10;"
```

### **Common Issues and Solutions**

#### **Port Already in Use**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

#### **Database Connection Issues**
```bash
# Check if database is running
docker ps | grep ***REMOVED-DB_PASSWORD***

# Restart database
docker-compose restart db

# Check database logs
docker logs contract-management-db
```

#### **Dependency Issues**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📝 **Code Standards and Best Practices**

### **JavaScript/Node.js Standards**
```javascript
// Use ES6+ features
const express = require('express');
const { Router } = require('express');

// Use async/await instead of callbacks
async function getUserById(id) {
  try {
    const user = await User.findById(id);
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

// Use meaningful variable names
const userEmail = user.email;
const isUserActive = user.status === 'active';

// Use JSDoc for documentation
/**
 * Creates a new training job
 * @param {Object} config - Training configuration
 * @param {string} config.contractId - Contract ID
 * @param {Array} config.datasets - Array of dataset IDs
 * @param {Object} config.parameters - Training parameters
 * @returns {Promise<Object>} Created training job
 */
async function createTrainingJob(config) {
  // Implementation
}
```

### **React/Frontend Standards**
```jsx
// Use functional components with hooks
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const UserProfile = ({ userId, onUpdate }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId).then(setUser).finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="user-profile">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
};

UserProfile.propTypes = {
  userId: PropTypes.string.isRequired,
  onUpdate: PropTypes.func
};

export default UserProfile;
```

### **API Design Standards**
```javascript
// Use RESTful conventions
// GET /api/users - List users
// GET /api/users/:id - Get user
// POST /api/users - Create user
// PUT /api/users/:id - Update user
// DELETE /api/users/:id - Delete user

// Use consistent response format
const successResponse = {
  success: true,
  data: result,
  message: 'Operation completed successfully'
};

const errorResponse = {
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid input data',
    details: validationErrors
  }
};
```

## 🔌 **API Development**

### **Creating New API Endpoints**
```javascript
// 1. Create controller
// backend/controllers/trainingController.js
const TrainingService = require('../services/trainingService');

class TrainingController {
  async createTrainingJob(req, res) {
    try {
      const { contractId, datasets, parameters } = req.body;
      
      const trainingJob = await TrainingService.createJob({
        contractId,
        datasets,
        parameters
      });
      
      res.status(201).json({
        success: true,
        data: trainingJob
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'TRAINING_ERROR',
          message: error.message
        }
      });
    }
  }
}

module.exports = new TrainingController();
```

```javascript
// 2. Create route
// backend/routes/training.js
const express = require('express');
const trainingController = require('../controllers/trainingController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/jobs', authMiddleware, trainingController.createTrainingJob);
router.get('/jobs', authMiddleware, trainingController.getTrainingJobs);
router.get('/jobs/:id', authMiddleware, trainingController.getTrainingJob);

module.exports = router;
```

```javascript
// 3. Register route in server.js
app.use('/api/training', require('./routes/training'));
```

### **API Testing**
```javascript
// backend/tests/api/training.test.js
const request = require('supertest');
const app = require('../../server');

describe('Training API', () => {
  let authToken;

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

  test('POST /api/training/jobs should create training job', async () => {
    const trainingData = {
      contractId: 'test-contract',
      datasets: ['dataset1'],
      parameters: {
        epochs: 10,
        batchSize: 32
      }
    };

    const response = await request(app)
      .post('/api/training/jobs')
      .set('Authorization', `Bearer ${authToken}`)
      .send(trainingData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('jobId');
  });
});
```

## 🎨 **Frontend Development**

### **Creating New Components**
```jsx
// frontend/src/components/TrainingJobCard.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent, Typography, Button } from '@mui/material';

const TrainingJobCard = ({ job, onStart, onStop, onView }) => {
  const handleStart = () => onStart(job.id);
  const handleStop = () => onStop(job.id);
  const handleView = () => onView(job.id);

  return (
    <Card className="training-job-card">
      <CardContent>
        <Typography variant="h6" component="h2">
          {job.name}
        </Typography>
        <Typography color="textSecondary">
          Status: {job.status}
        </Typography>
        <Typography color="textSecondary">
          Progress: {job.progress}%
        </Typography>
        <div className="job-actions">
          {job.status === 'stopped' && (
            <Button onClick={handleStart} color="primary">
              Start
            </Button>
          )}
          {job.status === 'running' && (
            <Button onClick={handleStop} color="secondary">
              Stop
            </Button>
          )}
          <Button onClick={handleView} color="default">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

TrainingJobCard.propTypes = {
  job: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    progress: PropTypes.number.isRequired
  }).isRequired,
  onStart: PropTypes.func.isRequired,
  onStop: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired
};

export default TrainingJobCard;
```

### **Frontend Testing**
```jsx
// frontend/src/components/__tests__/TrainingJobCard.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TrainingJobCard from '../TrainingJobCard';

describe('TrainingJobCard', () => {
  const mockJob = {
    id: '1',
    name: 'Test Job',
    status: 'stopped',
    progress: 0
  };

  const mockHandlers = {
    onStart: jest.fn(),
    onStop: jest.fn(),
    onView: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders job information', () => {
    render(
      <TrainingJobCard 
        job={mockJob} 
        {...mockHandlers} 
      />
    );

    expect(screen.getByText('Test Job')).toBeInTheDocument();
    expect(screen.getByText('Status: stopped')).toBeInTheDocument();
    expect(screen.getByText('Progress: 0%')).toBeInTheDocument();
  });

  test('calls onStart when start button is clicked', () => {
    render(
      <TrainingJobCard 
        job={mockJob} 
        {...mockHandlers} 
      />
    );

    fireEvent.click(screen.getByText('Start'));
    expect(mockHandlers.onStart).toHaveBeenCalledWith('1');
  });
});
```

## 🗄️ **Database Development**

### **Creating New Models**
```javascript
// backend/models/TrainingJob.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TrainingJob = sequelize.define('TrainingJob', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'running', 'completed', 'failed', 'cancelled'),
    defaultValue: 'pending'
  },
  contractId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Contracts',
      key: 'id'
    }
  },
  parameters: {
    type: DataTypes.JSON,
    allowNull: false
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  }
}, {
  tableName: 'training_jobs',
  timestamps: true
});

module.exports = TrainingJob;
```

### **Creating Migrations**
```javascript
// backend/migrations/20240101000000-create-training-jobs.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('training_jobs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'running', 'completed', 'failed', 'cancelled'),
        defaultValue: 'pending'
      },
      contract_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'contracts',
          key: 'id'
        }
      },
      parameters: {
        type: Sequelize.JSON,
        allowNull: false
      },
      progress: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('training_jobs');
  }
};
```

### **Database Testing**
```javascript
// backend/tests/database/training.test.js
const { TrainingJob } = require('../../models');
const sequelize = require('../../config/database');

describe('TrainingJob Model', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('should create training job', async () => {
    const trainingJob = await TrainingJob.create({
      name: 'Test Training Job',
      contractId: 'test-contract-id',
      parameters: {
        epochs: 10,
        batchSize: 32
      }
    });

    expect(trainingJob.id).toBeDefined();
    expect(trainingJob.name).toBe('Test Training Job');
    expect(trainingJob.status).toBe('pending');
  });
});
```

## 🚀 **Deployment and CI/CD**

### **Local Deployment Testing**
```bash
# Test production build locally
npm run build
npm run start:prod

# Test Docker build
docker build -t contract-management .
docker run -p 3000:3000 contract-management

# Test Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### **CI/CD Pipeline**
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Run linting
      run: npm run lint
    
    - name: Build application
      run: npm run build
```

## 🤝 **Contributing Guidelines**

### **Code Contribution Process**
1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Make changes and commit**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Create Pull Request**

### **Commit Message Convention**
```
type(scope): description

feat: add new feature
fix: fix bug
docs: update documentation
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

### **Pull Request Guidelines**
- **Clear description** of changes
- **Link to issues** if applicable
- **Include tests** for new features
- **Update documentation** if needed
- **Screenshots** for UI changes

## 📞 **Support and Resources**

### **Development Support**
- **Email**: dev-support@training.example.com
- **Slack**: #development channel
- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Complete technical documentation

### **Useful Commands**
```bash
# Development
npm run dev              # Start development server
npm run dev:debug        # Start with debugging
npm run build            # Build for production
npm run start:prod       # Start production server

# Testing
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
npm run test:e2e         # Run E2E tests

# Database
npm run db:setup         # Setup database
npm run db:migrate       # Run migrations
npm run db:seed          # Seed test data
npm run db:reset         # Reset database

# Linting and Formatting
npm run lint             # Run ESLint
npm run lint:fix         # Fix linting issues
npm run format           # Format code with Prettier
```

---

**Developer Guide Status**: ✅ **COMPREHENSIVE**  
**Setup Instructions**: ✅ **DETAILED**  
**Testing Framework**: ✅ **COMPLETE**  
**Debugging Guide**: ✅ **INCLUDED**  
**Best Practices**: ✅ **DOCUMENTED**
