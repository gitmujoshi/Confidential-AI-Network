# 👨‍💻 Developer Guide

Complete guide for developers working on the Contract Management System. This guide consolidates all developer-related documentation.

## 📋 Table of Contents

1. [Development Setup](#development-setup)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Testing](#testing)
5. [Debugging](#debugging)
6. [Deployment](#deployment)
7. [Best Practices](#best-practices)

## 🚀 Development Setup

### **Prerequisites**
- **Node.js** (v16+) and **npm** (v8+)
- **Docker** and **Docker Compose**
- **Git** for version control
- **PostgreSQL** (optional - Docker will provide)

### **Initial Setup**
```bash
# Clone repository
git clone <repository-url>
cd ContractManagement

# Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..

# Start development environment
./start-system.sh
```

### **Environment Configuration**
```bash
# Copy environment files
cp env.example .env
cp backend/config.env.example backend/config.env

# Update configuration
# See SETUP.md for detailed configuration
```

## 🏗️ Project Structure

### **Root Directory**
```
ContractManagement/
├── docs/                    # Consolidated documentation
├── backend/                 # Backend server (Node.js/Express)
├── frontend/                # Frontend (React)
├── blockchain/              # Smart contracts
├── scripts/                 # Utility scripts
├── deployment/              # Deployment configurations
└── tests/                   # End-to-end tests
```

### **Backend Structure**
```
backend/
├── routes/                  # API routes
├── services/                # Business logic
├── models/                  # Database models
├── middleware/              # Express middleware
├── scripts/                 # Utility scripts
├── tests/                   # Unit and integration tests
└── config/                  # Configuration files
```

### **Frontend Structure**
```
frontend/
├── src/
│   ├── components/          # React components
│   ├── pages/               # Page components
│   ├── services/            # API services
│   ├── contexts/            # React contexts
│   └── utils/               # Utility functions
├── public/                  # Static assets
└── tests/                   # Frontend tests
```

## 🔄 Development Workflow

### **Daily Development Process**

#### **1. Start Development Environment**
```bash
# Start all services
./start-system.sh

# Or start individually
docker-compose -f docker-compose.***REMOVED-KEYCLOAK_DB_PASSWORD***-persistent.yml up -d
cd backend && npm run dev
cd ../frontend && npm start
```

#### **2. Check System Status**
```bash
# Check all services
npm run status

# Test authentication
npm run test:login

# Check health
curl -s http://localhost:5001/health
```

#### **3. Make Changes**
- **Backend**: Edit files in `backend/` directory
- **Frontend**: Edit files in `frontend/src/` directory
- **Database**: Use migrations in `backend/migrations/`

#### **4. Test Changes**
```bash
# Test authentication after changes
npm run test:login

# Run backend tests
cd backend && npm test

# Run frontend tests
cd frontend && npm test

# Run end-to-end tests
npm run test:e2e
```

#### **5. Fix Issues**
```bash
# Fix authentication issues
./fix-auth.sh

# Auto-fix Keycloak issues
cd backend && node auto-fix-***REMOVED-KEYCLOAK_DB_PASSWORD***.js

# Reset Keycloak completely
npm run reset:***REMOVED-KEYCLOAK_DB_PASSWORD***
```

### **Git Workflow**

#### **Before Making Changes**
```bash
# Check current state
npm run status

# Test current functionality
npm run test:login

# Create feature branch
git checkout -b feature/your-feature-name
```

#### **During Development**
```bash
# Make small, focused changes
# Test immediately after each change
npm run test:login

# Commit frequently with clear messages
git add .
git commit -m "feat: Add user profile update functionality

- Added profile update API endpoint
- Updated frontend profile form
- Added validation and error handling
- Tested with all user roles"
```

#### **After Making Changes**
```bash
# Test the specific change
npm run test:login

# Test related functionality
npm run status

# Update documentation if needed
# Push changes
git push origin feature/your-feature-name
```

## 🧪 Testing

### **Test Categories**

#### **Unit Tests**
```bash
# Backend unit tests
cd backend && npm test

# Frontend unit tests
cd frontend && npm test

# Specific test files
npm test -- auth.test.js
npm test -- UserService.test.js
```

#### **Integration Tests**
```bash
# API integration tests
cd backend && npm run test:integration

# Database integration tests
npm test -- database.test.js

# Authentication integration tests
npm test -- auth.integration.test.js
```

#### **End-to-End Tests**
```bash
# Run all E2E tests
npm run test:e2e

# Run specific E2E test
npm run test:e2e -- auth.spec.js

# Run with specific browser
npm run test:e2e -- --browser chrome
```

#### **Performance Tests**
```bash
# Load testing
npm run test:load

# Memory testing
npm run test:memory

# API performance testing
npm run test:performance
```

### **Test Data Management**

#### **Create Test Data**
```bash
# Create test users
cd backend && node scripts/source/create-e2e-users-direct.js

# Create test datasets
node scripts/source/create-tdp-datasets.js

# Create test contracts
node scripts/source/create-contract-for-user-13.js
```

#### **Reset Test Data**
```bash
# Reset database
cd backend && npm run db:reset

# Reset Keycloak
npm run reset:***REMOVED-KEYCLOAK_DB_PASSWORD***

# Sync users to Keycloak
node scripts/source/sync-users-to-***REMOVED-KEYCLOAK_DB_PASSWORD***.js
```

### **Test Commands Reference**

| Command | Purpose | Location |
|---------|---------|----------|
| `npm test` | Run all tests | Backend/Frontend |
| `npm run test:login` | Test authentication | Root |
| `npm run test:integration` | API integration tests | Backend |
| `npm run test:e2e` | End-to-end tests | Root |
| `npm run test:coverage` | Generate coverage report | Backend |
| `npm run test:watch` | Watch mode for tests | Backend/Frontend |

## 🐛 Debugging

### **Backend Debugging**

#### **Enable Debug Logging**
```bash
# Set debug environment
export DEBUG=app:*
export NODE_ENV=development

# Start with debug logging
cd backend && DEBUG=* node server.js
```

#### **Database Debugging**
```bash
# Connect to database
psql -h localhost -U ***REMOVED-DB_PASSWORD*** -d contract_management

# Check database tables
\dt

# Check user data
SELECT * FROM users WHERE email = 'tdc-test@example.com';
```

#### **Keycloak Debugging**
```bash
# Check Keycloak status
curl -s http://localhost:8080/health

# Check Keycloak logs
docker logs ***REMOVED-KEYCLOAK_DB_PASSWORD***-cms

# Test Keycloak authentication directly
curl -X POST http://localhost:8080/realms/contract-management/protocol/openid-connect/token \
  -d "grant_type=password&client_id=contract-management-frontend&username=tdc-test@example.com&password=password123"
```

### **Frontend Debugging**

#### **React Developer Tools**
- Install React Developer Tools browser extension
- Use browser dev tools for component inspection
- Check network tab for API calls

#### **Console Debugging**
```javascript
// Add debug logs
console.log('🔍 Debug:', data);

// Check authentication state
console.log('🔐 Auth State:', authState);

// Check API responses
console.log('📡 API Response:', response);
```

### **Common Debugging Scenarios**

#### **Authentication Issues**
```bash
# Check Keycloak configuration
cd backend && node auto-fix-***REMOVED-KEYCLOAK_DB_PASSWORD***.js

# Reset authentication
./fix-auth.sh

# Check user sync
node scripts/source/sync-users-to-***REMOVED-KEYCLOAK_DB_PASSWORD***.js
```

#### **Database Issues**
```bash
# Check database connection
cd backend && node -e "require('./models').sequelize.authenticate().then(() => console.log('DB OK')).catch(console.error)"

# Reset database
npm run db:reset

# Check migrations
npx sequelize-cli db:migrate:status
```

#### **API Issues**
```bash
# Test API endpoints
curl -X GET http://localhost:5001/health
curl -X POST http://localhost:5001/api/auth/login -H "Content-Type: application/json" -d '{"email":"tdc-test@example.com","password":"password123"}'

# Check API logs
tail -f logs/backend.log
```

## 🚀 Deployment

### **Development Deployment**
```bash
# Start development environment
./start-system.sh

# Check all services are running
npm run status

# Test functionality
npm run test:login
```

### **Production Deployment**

#### **Environment Setup**
```bash
# Set production environment
export NODE_ENV=production
export PORT=5001

# Update environment variables
cp .env.production .env
cp backend/config.production.env backend/config.env
```

#### **Database Migration**
```bash
# Run database migrations
cd backend && npx sequelize-cli db:migrate

# Seed production data
npx sequelize-cli db:seed:all
```

#### **Service Deployment**
```bash
# Deploy with Docker Compose
docker-compose -f docker-compose.production.yml up -d

# Or deploy individually
cd backend && npm start
cd ../frontend && npm run build && serve -s build
```

### **Monitoring and Logging**

#### **Health Checks**
```bash
# Check system health
curl -s http://localhost:5001/health

# Check Keycloak health
curl -s http://localhost:8080/health

# Check database health
psql -h localhost -U ***REMOVED-DB_PASSWORD*** -d contract_management -c "SELECT 1;"
```

#### **Log Monitoring**
```bash
# Backend logs
tail -f logs/backend.log

# Keycloak logs
docker logs -f ***REMOVED-KEYCLOAK_DB_PASSWORD***-cms

# Database logs
docker logs -f ***REMOVED-DB_PASSWORD***-***REMOVED-KEYCLOAK_DB_PASSWORD***
```

## 📚 Best Practices

### **Code Organization**

#### **Backend Best Practices**
- **Service Layer**: Business logic in `services/` directory
- **Route Layer**: API endpoints in `routes/` directory
- **Model Layer**: Database models in `models/` directory
- **Middleware**: Authentication and validation in `middleware/` directory

#### **Frontend Best Practices**
- **Component Structure**: Reusable components in `components/`
- **Page Structure**: Page components in `pages/`
- **Service Layer**: API calls in `services/`
- **State Management**: Use React Context for global state

### **Security Best Practices**

#### **Authentication**
- Always validate tokens on protected routes
- Use HTTPS in production
- Implement proper session management
- Regular security audits

#### **Data Validation**
- Validate all input data
- Sanitize user inputs
- Use parameterized queries
- Implement rate limiting

### **Performance Best Practices**

#### **Database Optimization**
- Use database indexes
- Optimize queries
- Implement connection pooling
- Regular database maintenance

#### **API Optimization**
- Implement caching
- Use pagination for large datasets
- Optimize response payloads
- Monitor API performance

### **Testing Best Practices**

#### **Test Structure**
- Unit tests for individual functions
- Integration tests for API endpoints
- End-to-end tests for user workflows
- Performance tests for critical paths

#### **Test Data Management**
- Use isolated test databases
- Create realistic test data
- Clean up test data after tests
- Use test fixtures for consistency

### **Documentation Best Practices**

#### **Code Documentation**
- Document all public APIs
- Use JSDoc for JavaScript functions
- Keep README files updated
- Document configuration options

#### **Commit Messages**
- Use conventional commit format
- Write descriptive commit messages
- Reference issues in commits
- Keep commits focused and small

## 🛠️ Development Tools

### **Essential Tools**
- **VS Code** with extensions for Node.js and React
- **Postman** for API testing
- **pgAdmin** for database management
- **Docker Desktop** for containerization

### **Recommended Extensions**
- **ESLint** for code linting
- **Prettier** for code formatting
- **GitLens** for Git integration
- **Thunder Client** for API testing

### **Development Scripts**

#### **Quick Commands**
```bash
# Start development
./start-system.sh

# Fix authentication
./fix-auth.sh

# Check status
npm run status

# Test login
npm run test:login

# Reset everything
npm run reset:all
```

#### **Database Commands**
```bash
# Run migrations
cd backend && npx sequelize-cli db:migrate

# Rollback migrations
npx sequelize-cli db:migrate:undo

# Seed database
npx sequelize-cli db:seed:all

# Reset database
npx sequelize-cli db:drop && npx sequelize-cli db:create && npx sequelize-cli db:migrate
```

## 📚 Related Documentation

- **[Quick Start](QUICK_START.md)** - Get started in 5 minutes
- **[Setup Guide](SETUP.md)** - Complete installation and configuration
- **[User Guide](USER_GUIDE.md)** - How to use the system
- **[API Reference](API_REFERENCE.md)** - Technical API documentation
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions

---

*This developer guide consolidates information from multiple developer-related documents and workflow guides.* 