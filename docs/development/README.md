# Development Documentation

## 🛠️ **Complete Development Documentation for AI Model Training Environment**

This directory contains comprehensive documentation for developers who need to enhance, fix, and test the AI model training environment.

## 📚 **Documentation Overview**

### **Core Development Guides**
- **[Developer Guide](../DEVELOPER_GUIDE.md)** - Complete developer documentation (canonical)
- **[Development workflow](DEVELOPMENT_WORKFLOW.md)** - Day-to-day workflow
- **[Local Development Setup](LOCAL_DEVELOPMENT_SETUP.md)** - Step-by-step local setup
- **[Testing Guide](TESTING_GUIDE.md)** - Comprehensive testing strategies
- **[TDC training runtime](../training/TDC_TRAINING_RUNTIME.md)** - TDC/CCRP training APIs, `TRAINING_SIMULATION_MODE`, Playwright prerequisites

### **Quick Start for Developers**
```bash
# Clone and setup
git clone https://github.com/gitmujoshi/ContractManagement.git
cd ContractManagement

# Start development environment
./scripts/dev-start.sh

# Run tests
npm test

# Stop development environment
./scripts/dev-stop.sh
```

## 🏗️ **Development Architecture**

### **Technology Stack**
- **Backend**: Node.js, Express.js, PostgreSQL, Redis
- **Frontend**: React.js, Material-UI, React Router
- **Gateway**: Node.js, Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Caching**: Redis
- **Testing**: Jest, Supertest, Playwright
- **Containerization**: Docker, Docker Compose

### **Project Structure**
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
└── docker-compose.dev.yml    # Development Docker setup
```

## 🚀 **Development Workflow**

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
- **Performance Tests**: Artillery + K6

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

# From frontend/: regenerate per-role UI user guides + screenshots
cd frontend && npm run test:e2e:user-guides
# → docs/guides/role-user-guides/

cd frontend && npm run test:e2e:lifecycle-guide
# → docs/guides/lifecycle-user-guide/ (onboard → sign → train → provenance/logs)

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=user.test.js
```

## 🔧 **Development Tools**

### **Required Tools**
- **Node.js**: v18+ (LTS recommended)
- **npm**: v8+ or **yarn**: v1.22+
- **Docker**: v20.10+ and Docker Compose
- **Git**: v2.30+
- **PostgreSQL**: v13+ (or use Docker)
- **Redis**: v6+ (or use Docker)

### **Recommended Tools**
- **IDE**: VS Code with extensions
- **Database Client**: pgAdmin or DBeaver
- **API Client**: Postman or Insomnia
- **Browser**: Chrome with DevTools

### **VS Code Extensions**
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-json",
    "ms-vscode.vscode-yaml",
    "redhat.vscode-yaml",
    "ms-vscode.vscode-docker",
    "ms-vscode.vscode-git",
    "ms-vscode.vscode-github",
    "ms-vscode.vscode-jest",
    "ms-vscode.vscode-react-native"
  ]
}
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
psql -h localhost -U postgres -d contract_management_dev

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
lsof -i :3001
lsof -i :5432

# Kill process
kill -9 <PID>

# Or use different ports
PORT=3002 npm start
```

#### **Database Connection Issues**
```bash
# Check if database is running
docker ps | grep postgres
brew services list | grep postgres

# Check database logs
docker logs contract-management-db

# Test database connection
psql -h localhost -U postgres -d contract_management_dev -c "SELECT 1;"
```

#### **Dependency Issues**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for version conflicts
npm ls
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
const TrainingService = require('../../../services/trainingService');

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

## 🎯 **Next Steps**

### **After Setup**
1. **Run Tests**: Ensure all tests pass
2. **Check Logs**: Verify no errors in logs
3. **Test API**: Test API endpoints
4. **Test Frontend**: Test UI functionality
5. **Read Documentation**: Review project documentation

### **Development Workflow**
1. **Create Feature Branch**: `git checkout -b feature/your-feature`
2. **Make Changes**: Implement your changes
3. **Write Tests**: Add tests for new functionality
4. **Run Tests**: Ensure all tests pass
5. **Commit Changes**: `git commit -m "feat: add your feature"`
6. **Push Changes**: `git push origin feature/your-feature`
7. **Create PR**: Create pull request on GitHub

---

**Development Documentation Status**: ✅ **COMPREHENSIVE**  
**Setup Instructions**: ✅ **DETAILED**  
**Testing Framework**: ✅ **COMPLETE**  
**Debugging Guide**: ✅ **INCLUDED**  
**Best Practices**: ✅ **DOCUMENTED**
