# Local Development Setup Guide

## 🏠 **Complete Local Development Environment Setup**

This guide provides step-by-step instructions for setting up a complete local development environment for the AI model training environment.

## 📋 **Prerequisites**

### **Required Software**
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

## 🚀 **Quick Start (5 minutes)**

### **Option 1: Docker Compose (Recommended)**
```bash
# Clone repository
git clone https://github.com/gitmujoshi/ContractManagement.git
cd ContractManagement

# Copy environment file
cp config.env.example config.local.env

# Start all services
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to start (2-3 minutes)
docker-compose logs -f

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# Gateway: http://localhost:8080
```

### **Option 2: Manual Setup**
```bash
# Clone repository
git clone https://github.com/gitmujoshi/ContractManagement.git
cd ContractManagement

# Install dependencies
npm install

# Setup environment
cp config.env.example config.local.env
# Edit config.local.env with your settings

# Start services
./scripts/dev-start.sh
```

## 🔧 **Detailed Setup Instructions**

### **Step 1: Environment Configuration**

#### **1.1 Create Local Environment File**
```bash
# Copy example environment file
cp config.env.example config.local.env

# Edit with your local settings
nano config.local.env
```

#### **1.2 Environment Variables**
```bash
# config.local.env
NODE_ENV=development
TEE_MODE=local

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=contract_management_dev
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# API Configuration
API_PORT=3001
API_HOST=0.0.0.0
CORS_ORIGIN=http://localhost:3000

# Authentication
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=development
KEYCLOAK_CLIENT_ID=contract-management
KEYCLOAK_CLIENT_SECRET=your_client_secret
JWT_SECRET=your_jwt_secret

# Local Development
DEBUG_MODE=true
MOCK_SERVICES=true
TEST_MODE=false
```

### **Step 2: Database Setup**

#### **2.1 Using Docker (Recommended)**
```bash
# Start PostgreSQL with Docker
docker run --name contract-management-db \
  -e POSTGRES_DB=contract_management_dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  -d postgres:13

# Start Redis with Docker
docker run --name contract-management-redis \
  -p 6379:6379 \
  -d redis:6-alpine
```

#### **2.2 Using Local Installation**
```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Create database
createdb contract_management_dev

# Install Redis (macOS)
brew install redis
brew services start redis
```

#### **2.3 Database Initialization**
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Run migrations
npm run db:migrate

# Seed development data
npm run db:seed

# Verify database
npm run db:verify
```

### **Step 3: Backend Setup**

#### **3.1 Install Dependencies**
```bash
cd backend
npm install
```

#### **3.2 Start Backend Services**
```bash
# Start API server
npm run dev

# Or start with debugging
npm run dev:debug

# Or start specific service
npm run dev:api
npm run dev:training
npm run dev:monitoring
```

#### **3.3 Verify Backend**
```bash
# Test API endpoints
curl http://localhost:3001/health
curl http://localhost:3001/api/users
curl http://localhost:3001/api/training/health
```

### **Step 4: Frontend Setup**

#### **4.1 Install Dependencies**
```bash
cd frontend
npm install
```

#### **4.2 Start Frontend**
```bash
# Start development server
npm start

# Or start with specific port
PORT=3000 npm start
```

#### **4.3 Verify Frontend**
- Open browser to http://localhost:3000
- Check for any console errors
- Verify API connectivity

### **Step 5: Gateway Setup**

#### **5.1 Install Dependencies**
```bash
cd gateway
npm install
```

#### **5.2 Start Gateway**
```bash
# Start gateway server
npm start

# Or start with debugging
npm run dev
```

#### **5.3 Verify Gateway**
```bash
# Test gateway endpoints
curl http://localhost:8080/health
curl http://localhost:8080/api/users
```

## 🐳 **Docker Development Setup**

### **Docker Compose Configuration**
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  # Database
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: contract_management_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/init.sql:/docker-entrypoint-initdb.d/init.sql

  # Redis
  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # Backend API
  backend:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres
      - REDIS_HOST=redis
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend

  # Gateway
  gateway:
    build:
      context: ./gateway
      dockerfile: Dockerfile.dev
    ports:
      - "8080:8080"
    volumes:
      - ./gateway:/app
      - /app/node_modules
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
```

### **Docker Commands**
```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down

# Rebuild services
docker-compose -f docker-compose.dev.yml up --build

# Execute commands in containers
docker-compose -f docker-compose.dev.yml exec backend npm test
docker-compose -f docker-compose.dev.yml exec frontend npm test
```

## 🧪 **Testing Setup**

### **Test Database Setup**
```bash
# Create test database
createdb contract_management_test

# Update test environment
# config.test.env
NODE_ENV=test
DB_NAME=contract_management_test
DB_HOST=localhost
DB_PORT=5432
```

### **Running Tests**
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### **Test Data Setup**
```bash
# Seed test data
npm run db:seed:test

# Reset test database
npm run db:reset:test

# Verify test data
npm run db:verify:test
```

## 🔧 **Development Tools Setup**

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

### **VS Code Settings**
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "jest.jestCommandLine": "npm test --",
  "jest.autoRun": "off"
}
```

### **Git Hooks Setup**
```bash
# Install husky for git hooks
npm install --save-dev husky

# Setup pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm test"

# Setup pre-push hook
npx husky add .husky/pre-push "npm run test:integration"
```

## 🐛 **Debugging Setup**

### **Backend Debugging**
```bash
# Start with Node.js debugger
node --inspect server.js

# Or use npm script
npm run dev:debug

# Connect debugger
# Open Chrome DevTools
# Go to chrome://inspect
# Click "Open dedicated DevTools for Node"
```

### **Frontend Debugging**
```bash
# Start with React DevTools
npm start

# Install React DevTools browser extension
# Set breakpoints in browser DevTools
# Use console.log for debugging
```

### **Database Debugging**
```bash
# Connect to database
psql -h localhost -U postgres -d contract_management_dev

# Check database logs
docker logs contract-management-db

# Use database client
# pgAdmin or DBeaver
```

## 📊 **Monitoring and Logging**

### **Application Logs**
```bash
# View backend logs
tail -f logs/backend.log

# View frontend logs
tail -f logs/frontend.log

# View all logs
tail -f logs/*.log
```

### **Database Monitoring**
```bash
# Monitor database connections
psql -h localhost -U postgres -d contract_management_dev -c "SELECT * FROM pg_stat_activity;"

# Monitor database size
psql -h localhost -U postgres -d contract_management_dev -c "SELECT pg_size_pretty(pg_database_size('contract_management_dev'));"
```

### **Performance Monitoring**
```bash
# Monitor CPU and memory usage
top -p $(pgrep -f "node.*server.js")

# Monitor network connections
netstat -tulpn | grep :3001

# Monitor disk usage
df -h
```

## 🚨 **Troubleshooting**

### **Common Issues**

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

#### **Docker Issues**
```bash
# Clean up Docker
docker system prune -a

# Rebuild containers
docker-compose -f docker-compose.dev.yml up --build --force-recreate

# Check Docker logs
docker-compose -f docker-compose.dev.yml logs
```

### **Performance Issues**
```bash
# Check system resources
htop
free -h
df -h

# Check application performance
npm run profile

# Check database performance
psql -h localhost -U postgres -d contract_management_dev -c "EXPLAIN ANALYZE SELECT * FROM users;"
```

## 📚 **Useful Commands**

### **Development Commands**
```bash
# Start development environment
./scripts/dev-start.sh

# Stop development environment
./scripts/dev-stop.sh

# Restart services
./scripts/dev-restart.sh

# Check service status
./scripts/dev-status.sh

# View logs
./scripts/dev-logs.sh
```

### **Database Commands**
```bash
# Database setup
npm run db:setup

# Run migrations
npm run db:migrate

# Rollback migrations
npm run db:rollback

# Seed data
npm run db:seed

# Reset database
npm run db:reset

# Backup database
npm run db:backup

# Restore database
npm run db:restore
```

### **Testing Commands**
```bash
# Run all tests
npm test

# Run specific tests
npm test -- --testPathPattern=user.test.js

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e
```

### **Linting and Formatting**
```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting
npm run format:check
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

**Local Development Setup**: ✅ **COMPLETE**  
**Docker Support**: ✅ **INCLUDED**  
**Testing Framework**: ✅ **CONFIGURED**  
**Debugging Tools**: ✅ **SETUP**  
**Troubleshooting**: ✅ **DOCUMENTED**
