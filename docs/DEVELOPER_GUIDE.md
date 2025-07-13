# Developer Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Development Environment Setup](#development-environment-setup)
3. [API Development](#api-development)
4. [Frontend Development](#frontend-development)
5. [Database Development](#database-development)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

## Getting Started

### Prerequisites
- **Node.js**: Version 18 or higher
- **PostgreSQL**: Version 14 or higher
- **Docker**: For containerized development
- **Git**: Version control
- **Keycloak**: For IAM integration

### Quick Start
```bash
# Clone the repository
git clone https://github.com/gitmujoshi/ContractManagement.git
cd ContractManagement

# Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install

# Set up environment variables
cp env.example .env
cp backend/config.env.example backend/config.env

# Start development environment
npm run dev
```

## Development Environment Setup

### Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Set up database
npm run db:migrate
npm run db:seed

# Start development server
npm run dev
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

### Keycloak Setup
```bash
# Start Keycloak with Docker
docker-compose -f deployment/utilities/docker-compose.iam.yml up -d

# Set up realm and users
node deployment/utilities/setupKeycloak.js
```

### Database Setup
```bash
# Create database
createdb contract_management

# Run migrations
npm run db:migrate

# Seed data
npm run db:seed
```

## API Development

### Project Structure
```
backend/
├── models/           # Database models
├── routes/           # API routes
├── services/         # Business logic
├── middleware/       # Custom middleware
├── scripts/          # Utility scripts
└── tests/            # Test files
```

### Creating New API Endpoints

#### 1. Define Route
```javascript
// routes/example.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

router.get('/example', authenticateToken, async (req, res) => {
  try {
    // Your logic here
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

#### 2. Add to Server
```javascript
// server.js
const exampleRoutes = require('./routes/example');
app.use('/api/example', exampleRoutes);
```

#### 3. Create Tests
```javascript
// tests/specs/example.test.js
describe('Example API', () => {
  test('GET /api/example should return data', async () => {
    const response = await request(app)
      .get('/api/example')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

### Authentication Middleware
```javascript
// middleware/auth.js
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Verify token with Keycloak
    const user = await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};
```

### Error Handling
```javascript
// Global error handler
app.use((error, req, res, next) => {
  console.error(error.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});
```

## Frontend Development

### Project Structure
```
frontend/
├── src/
│   ├── components/   # Reusable components
│   ├── pages/        # Page components
│   ├── services/     # API services
│   ├── contexts/     # React contexts
│   └── utils/        # Utility functions
├── public/           # Static assets
└── package.json
```

### Creating New Components
```javascript
// components/ExampleComponent.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/UserContext';

const ExampleComponent = () => {
  const [data, setData] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    // Fetch data
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/api/example');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <div>
      <h2>Example Component</h2>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
};

export default ExampleComponent;
```

### API Service Layer
```javascript
// services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
});

// Request interceptor for authentication
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle token expiration
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### State Management
```javascript
// contexts/UserContext.js
import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', credentials);
      setUser(response.data.user);
      localStorage.setItem('authToken', response.data.accessToken);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
  };

  return (
    <UserContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useAuth = () => useContext(UserContext);
```

## Database Development

### Model Definition
```javascript
// models/Example.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Example = sequelize.define('Example', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true,
  tableName: 'examples'
});

module.exports = Example;
```

### Database Migrations
```javascript
// scripts/createExampleTable.js
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('examples', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('examples');
  }
};
```

### Database Seeding
```javascript
// scripts/seedExampleData.js
const Example = require('../models/Example');

const seedExampleData = async () => {
  try {
    await Example.bulkCreate([
      {
        name: 'Example 1',
        description: 'First example'
      },
      {
        name: 'Example 2',
        description: 'Second example'
      }
    ]);
    console.log('Example data seeded successfully');
  } catch (error) {
    console.error('Error seeding example data:', error);
  }
};

module.exports = seedExampleData;
```

## Testing

### Backend Testing
```javascript
// tests/specs/example.test.js
const request = require('supertest');
const app = require('../../server');
const { User } = require('../../models');

describe('Example API', () => {
  let token;
  let testUser;

  beforeAll(async () => {
    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      partyType: 'TDC'
    });

    // Get authentication token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Test123!'
      });
    
    token = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    // Clean up test data
    await testUser.destroy();
  });

  test('GET /api/example should return data', async () => {
    const response = await request(app)
      .get('/api/example')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

### Frontend Testing
```javascript
// ExampleComponent.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ExampleComponent from './ExampleComponent';

describe('ExampleComponent', () => {
  test('renders component', () => {
    render(<ExampleComponent />);
    expect(screen.getByText('Example Component')).toBeInTheDocument();
  });

  test('handles user interaction', () => {
    render(<ExampleComponent />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByText('Clicked!')).toBeInTheDocument();
  });
});
```

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Run all tests
npm run test:all
```

## Deployment

### Local Deployment
```bash
# Start all services
npm run dev

# Or start individually
cd backend && npm start
cd frontend && npm start
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Build images
docker build -t contract-management-backend ./backend
docker build -t contract-management-frontend ./frontend
```

### Kubernetes Deployment
```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods
kubectl get services
```

### Production Deployment
```bash
# Set production environment
export NODE_ENV=production

# Run database migrations
npm run db:migrate

# Start production server
npm start
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check database status
psql -h localhost -U ***REMOVED-DB_PASSWORD*** -d contract_management

# Reset database
npm run db:reset
```

#### 2. Keycloak Connection Issues
```bash
# Check Keycloak status
curl http://localhost:8080/health

# Reset Keycloak realm
node deployment/utilities/setupKeycloak.js
```

#### 3. Frontend Build Issues
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

#### 4. Port Conflicts
```bash
# Check port usage
lsof -i :3000
lsof -i :5001

# Kill processes
pkill -f "node server.js"
```

### Debug Tools
```javascript
// Enable debug logging
DEBUG=* npm start

// Enable Sequelize logging
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  logging: console.log
});
```

## Best Practices

### Code Organization
- **Separation of Concerns**: Keep business logic in services
- **Error Handling**: Use try-catch blocks consistently
- **Input Validation**: Validate all user inputs
- **Security**: Never expose sensitive data in logs

### API Design
- **RESTful Principles**: Follow REST conventions
- **Versioning**: Use API versioning for backward compatibility
- **Documentation**: Document all endpoints
- **Rate Limiting**: Implement rate limiting for public APIs

### Database
- **Indexing**: Create indexes for frequently queried fields
- **Migrations**: Use migrations for schema changes
- **Backups**: Regular database backups
- **Connection Pooling**: Use connection pooling for performance

### Security
- **Authentication**: Always validate user authentication
- **Authorization**: Check user permissions
- **Input Sanitization**: Sanitize all user inputs
- **HTTPS**: Use HTTPS in production

### Testing
- **Unit Tests**: Test individual functions
- **Integration Tests**: Test API endpoints
- **E2E Tests**: Test complete user flows
- **Coverage**: Maintain high test coverage

---

*This guide provides comprehensive information for developers working on the Contract Management System.* 