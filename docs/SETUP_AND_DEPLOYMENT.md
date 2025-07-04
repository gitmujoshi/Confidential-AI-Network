# Setup and Deployment Guide
## Contract Management System

Complete installation, configuration, and deployment documentation for the Contract Management System.

**Document Version:** 3.0  
**Date:** December 2024  
**Author:** Contract Management System Team

---

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Prerequisites](#prerequisites)
3. [Installation Steps](#installation-steps)
4. [Environment Configuration](#environment-configuration)
5. [IAM Configuration](#iam-configuration)
6. [Database Setup](#database-setup)
7. [Blockchain Setup](#blockchain-setup)
8. [Frontend Configuration](#frontend-configuration)
9. [Production Deployment](#production-deployment)
10. [Kubernetes Deployment](#kubernetes-deployment)
11. [Local Development](#local-development)
12. [Testing the Installation](#testing-the-installation)
13. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Hardware Requirements
- **CPU**: 2+ cores (4+ cores recommended)
- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 50GB available space
- **Network**: Stable internet connection

### Software Requirements
- **Operating System**: Linux, macOS, or Windows
- **Node.js**: Version 16 or higher
- **PostgreSQL**: Version 12 or higher
- **Docker**: Version 20 or higher
- **Docker Compose**: Version 2 or higher

### Browser Requirements
- **Chrome**: Version 90 or higher
- **Firefox**: Version 88 or higher
- **Safari**: Version 14 or higher
- **Edge**: Version 90 or higher

---

## Prerequisites

### Install Node.js
1. Download Node.js from the official website
2. Install Node.js on your system
3. Verify installation by running `node --version`
4. Verify npm installation by running `npm --version`

### Install PostgreSQL
1. Download PostgreSQL from the official website
2. Install PostgreSQL with default settings
3. Note down the database password
4. Verify installation by running `psql --version`

### Install Docker
1. Download Docker Desktop from the official website
2. Install Docker Desktop
3. Start Docker Desktop
4. Verify installation by running `docker --version`

### Install Git
1. Download Git from the official website
2. Install Git on your system
3. Configure Git with your credentials
4. Verify installation by running `git --version`

---

## Installation Steps

### Step 1: Clone the Repository
```bash
# Clone the repository
git clone https://github.com/your-org/contract-management.git
cd contract-management

# Verify the structure
ls -la
```

### Step 2: Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install blockchain dependencies
cd ../blockchain
npm install

# Return to root
cd ..
```

### Step 3: Environment Configuration
```bash
# Copy the example environment file
cp env.example .env

# Edit the environment file with your settings
nano .env
```

### Step 4: Database Setup
```bash
# Navigate to backend
cd backend

# Run database setup
npm run setup-db

# Verify database connection
npm run test-db
```

---

## Environment Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

#### Database Configuration
```bash
# Database settings
DB_HOST=localhost
DB_PORT=5432
DB_NAME=contract_management
DB_USER=***REMOVED-DB_PASSWORD***
DB_PASSWORD=your_secure_password
DB_DIALECT=***REMOVED-DB_PASSWORD***
DB_LOGGING=false
```

#### JWT Configuration
```bash
# JWT settings
JWT_SECRET=your_very_long_jwt_secret_key_here_minimum_32_characters
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
```

#### Blockchain Configuration
```bash
# Blockchain settings
BLOCKCHAIN_NETWORK=goerli
BLOCKCHAIN_RPC_URL=https://goerli.infura.io/v3/your_infura_project_id
BLOCKCHAIN_PRIVATE_KEY=your_private_key_here
BLOCKCHAIN_CONTRACT_ADDRESS=your_deployed_contract_address
```

#### IAM Configuration
```bash
# Keycloak settings
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=contract-management
KEYCLOAK_CLIENT_ID=contract-management-client
KEYCLOAK_CLIENT_SECRET=your_client_secret
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=your_secure_admin_password
```

#### Email Configuration
```bash
# Email settings
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@yourdomain.com
```

#### Frontend Configuration
```bash
# Frontend settings
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_BLOCKCHAIN_NETWORK=goerli
REACT_APP_CONTRACT_ADDRESS=your_deployed_contract_address
```

### Security Considerations

#### Generate Secure Secrets
```bash
# Generate JWT secret (32+ characters)
openssl rand -hex 32

# Generate database password
openssl rand -base64 32

# Generate Keycloak admin password
openssl rand -base64 16
```

#### Environment File Security
```bash
# Add .env to .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore

# Set proper file permissions
chmod 600 .env
```

---

## IAM Configuration

### Keycloak Setup

#### Starting Keycloak Services
```bash
# Start Keycloak using Docker Compose
docker-compose -f docker-compose.iam.yml up -d

# Wait for services to start completely
docker-compose -f docker-compose.iam.yml logs -f ***REMOVED-KEYCLOAK_DB_PASSWORD***

# Verify Keycloak is accessible
curl http://localhost:8080/health
```

#### Keycloak Configuration
1. **Access Admin Console**: http://localhost:8080/admin
2. **Login**: admin / your_admin_password
3. **Create Realm**: 
   - Name: `contract-management`
   - Display Name: `Contract Management System`
4. **Configure Authentication**:
   - Set password policies
   - Configure email verification
   - Set up account lockout policies

#### User Management Setup
```bash
# Create initial admin users
cd scripts
node setupKeycloak.js

# Verify user creation
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3001/api/users
```

#### Integration Setup
1. **Create OAuth2 Client**:
   - Client ID: `contract-management-client`
   - Client Secret: Generate secure secret
   - Valid Redirect URIs: `http://localhost:3000/*`
   - Web Origins: `http://localhost:3000`

2. **Configure JWT Settings**:
   - Access Token Lifespan: 15 minutes
   - Refresh Token Lifespan: 30 days
   - SSO Session Idle: 30 minutes

3. **Test Authentication Flow**:
```bash
# Test authentication endpoint
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "test@example.com", "password": "password"}'
```

---

## Database Setup

### PostgreSQL Configuration

#### Create Database
```sql
-- Connect to PostgreSQL
psql -U ***REMOVED-DB_PASSWORD***

-- Create database
CREATE DATABASE contract_management;

-- Create user (optional)
CREATE USER contract_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE contract_management TO contract_user;

-- Exit PostgreSQL
\q
```

#### Database Migration
```bash
# Navigate to backend
cd backend

# Run migrations
npm run migrate

# Verify tables
psql -U ***REMOVED-DB_PASSWORD*** -d contract_management -c "\dt"

# Seed initial data
npm run seed
```

#### Performance Tuning
```sql
-- Optimize PostgreSQL settings
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Reload configuration
SELECT pg_reload_conf();
```

#### Backup Configuration
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/***REMOVED-DB_PASSWORD***ql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="contract_management"

mkdir -p $BACKUP_DIR
pg_dump -U ***REMOVED-DB_PASSWORD*** $DB_NAME > $BACKUP_DIR/${DB_NAME}_${DATE}.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
EOF

# Make executable
chmod +x backup.sh

# Add to crontab (daily backup at 2 AM)
echo "0 2 * * * /path/to/backup.sh" | crontab -
```

---

## Blockchain Setup

### Smart Contract Deployment

#### Hardhat Configuration
```javascript
// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.19",
  networks: {
    goerli: {
      url: process.env.BLOCKCHAIN_RPC_URL,
      accounts: [process.env.BLOCKCHAIN_PRIVATE_KEY],
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
  },
};
```

#### Deploy Contracts
```bash
# Navigate to blockchain directory
cd blockchain

# Compile contracts
npx hardhat compile

# Deploy to local network
npx hardhat run scripts/deploy.js --network localhost

# Deploy to testnet
npx hardhat run scripts/deploy.js --network goerli

# Verify contract on Etherscan (if applicable)
npx hardhat verify --network goerli CONTRACT_ADDRESS
```

#### Contract Verification
```bash
# Test contract functions
npx hardhat test

# Run contract tests
npm test

# Verify contract deployment
npx hardhat console --network goerli
```

### Network Configuration

#### Testnet Setup
```bash
# Get testnet ETH from faucet
# Goerli: https://goerlifaucet.com/
# Sepolia: https://sepoliafaucet.com/

# Configure MetaMask
# Network: Goerli Testnet
# RPC URL: https://goerli.infura.io/v3/YOUR_PROJECT_ID
# Chain ID: 5
# Currency Symbol: ETH
```

#### Mainnet Preparation
```bash
# For production deployment
# 1. Ensure sufficient ETH for gas fees
# 2. Use secure private key management
# 3. Test thoroughly on testnet first
# 4. Consider using a multisig wallet
```

---

## Frontend Configuration

### React Application Setup

#### Environment Variables
```bash
# Create frontend environment file
cd frontend
cp .env.example .env

# Configure frontend environment
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_BLOCKCHAIN_NETWORK=goerli
REACT_APP_CONTRACT_ADDRESS=your_contract_address
REACT_APP_KEYCLOAK_URL=http://localhost:8080
REACT_APP_KEYCLOAK_REALM=contract-management
REACT_APP_KEYCLOAK_CLIENT_ID=contract-management-client
```

#### Build Configuration
```bash
# Install dependencies
npm install

# Build for development
npm start

# Build for production
npm run build

# Test build
npm test
```

#### Web3 Integration
```javascript
// Configure Web3 provider
import { ethers } from 'ethers';

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

// Connect to contract
const contract = new ethers.Contract(
  process.env.REACT_APP_CONTRACT_ADDRESS,
  contractABI,
  signer
);
```

---

## Production Deployment

### Server Requirements

#### Production Server Setup
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install ***REMOVED-DB_PASSWORD***ql ***REMOVED-DB_PASSWORD***ql-contrib -y

# Install Nginx
sudo apt install nginx -y

# Install PM2 for process management
sudo npm install -g pm2
```

#### SSL Certificate Setup
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Deployment Scripts

#### Production Build Script
```bash
#!/bin/bash
# deploy.sh

echo "Starting production deployment..."

# Pull latest changes
git pull origin main

# Install dependencies
npm ci --production

# Build frontend
cd frontend
npm ci
npm run build
cd ..

# Build backend
cd backend
npm ci
npm run build
cd ..

# Restart services
pm2 restart all

echo "Deployment completed!"
```

#### PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'contract-management-backend',
      script: './backend/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'contract-management-frontend',
      script: 'serve',
      args: '-s frontend/build -l 3000',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

### Nginx Configuration

#### Reverse Proxy Setup
```nginx
# /etc/nginx/sites-available/contract-management
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

---

## Kubernetes Deployment

### Kubernetes Setup

#### Cluster Requirements
- **Kubernetes**: Version 1.20 or higher
- **Helm**: Version 3.0 or higher
- **Ingress Controller**: Nginx or similar
- **Storage Class**: For persistent volumes

#### Namespace Setup
```bash
# Create namespace
kubectl create namespace contract-management

# Set namespace as default
kubectl config set-context --current --namespace=contract-management
```

#### Helm Chart Structure
```
k8s/
├── Chart.yaml
├── values.yaml
├── templates/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── configmap.yaml
│   └── secret.yaml
└── charts/
    ├── ***REMOVED-DB_PASSWORD***ql/
    ├── ***REMOVED-KEYCLOAK_DB_PASSWORD***/
    └── redis/
```

#### Deployment Configuration
```yaml
# values.yaml
backend:
  replicaCount: 3
  image:
    repository: your-registry/contract-management-backend
    tag: latest
  resources:
    limits:
      cpu: 500m
      memory: 512Mi
    requests:
      cpu: 250m
      memory: 256Mi

frontend:
  replicaCount: 2
  image:
    repository: your-registry/contract-management-frontend
    tag: latest
  resources:
    limits:
      cpu: 200m
      memory: 256Mi
    requests:
      cpu: 100m
      memory: 128Mi

***REMOVED-DB_PASSWORD***ql:
  enabled: true
  ***REMOVED-DB_PASSWORD***qlPassword: your_secure_password
  persistence:
    enabled: true
    size: 10Gi

***REMOVED-KEYCLOAK_DB_PASSWORD***:
  enabled: true
  adminPassword: your_secure_admin_password
  persistence:
    enabled: true
    size: 5Gi
```

#### Deploy to Kubernetes
```bash
# Add Helm repositories
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Install dependencies
helm dependency build k8s/

# Deploy the application
helm install contract-management k8s/

# Check deployment status
kubectl get pods
kubectl get services
kubectl get ingress
```

### Local Kubernetes Setup

#### Minikube Setup
```bash
# Install Minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Start Minikube
minikube start --cpus 4 --memory 8192 --disk-size 20g

# Enable addons
minikube addons enable ingress
minikube addons enable metrics-server

# Deploy application
helm install contract-management k8s/
```

#### Docker Desktop Kubernetes
```bash
# Enable Kubernetes in Docker Desktop
# Settings > Kubernetes > Enable Kubernetes

# Deploy application
helm install contract-management k8s/

# Access application
kubectl get ingress
```

---

## Local Development

### Development Environment

#### Quick Start Script
```bash
#!/bin/bash
# dev-start.sh

echo "Starting development environment..."

# Start IAM services
docker-compose -f docker-compose.iam.yml up -d

# Start database
docker-compose -f docker-compose.db.yml up -d

# Wait for services
sleep 10

# Setup database
cd backend
npm run setup-db
cd ..

# Start backend
cd backend
npm run dev &
cd ..

# Start frontend
cd frontend
npm start &
cd ..

# Start blockchain
cd blockchain
npx hardhat node &
cd ..

echo "Development environment started!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:3001"
echo "Keycloak: http://localhost:8080"
```

#### Development Scripts
```json
{
  "scripts": {
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "server": "cd backend && npm run dev",
    "client": "cd frontend && npm start",
    "blockchain": "cd blockchain && npm run node",
    "deploy": "cd blockchain && npm run deploy",
    "install-all": "npm install && cd backend && npm install && cd ../frontend && npm install && cd ../blockchain && npm install",
    "setup-db": "cd backend && npm run setup-db",
    "create-wallets": "cd backend && npm run create-wallets",
    "register-hardhat": "cd backend && npm run register-hardhat"
  }
}
```

### Testing Setup

#### Test Environment
```bash
# Create test database
createdb contract_management_test

# Run tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
```

#### Test Data Setup
```bash
# Create test wallets
cd scripts
node createTestWallets.js

# Create test datasets
node createTestDatasets.js

# Register test users
node registerHardhatUsers.js
```

---

## Testing the Installation

### Health Checks

#### API Health Check
```bash
# Test backend health
curl http://localhost:3001/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2024-12-01T10:00:00.000Z",
  "services": {
    "database": "connected",
    "blockchain": "connected",
    "***REMOVED-KEYCLOAK_DB_PASSWORD***": "connected"
  }
}
```

#### Frontend Health Check
```bash
# Test frontend
curl http://localhost:3000

# Should return HTML page
```

#### Database Health Check
```bash
# Test database connection
psql -U ***REMOVED-DB_PASSWORD*** -d contract_management -c "SELECT version();"

# Test tables exist
psql -U ***REMOVED-DB_PASSWORD*** -d contract_management -c "\dt"
```

### Integration Tests

#### User Registration Test
```bash
# Test user registration
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "partyType": "TDP",
    "walletAddress": "0x1234567890abcdef...",
    "publicKey": "0xabcdef123456..."
  }'
```

#### Contract Creation Test
```bash
# Test contract creation (requires authentication)
curl -X POST http://localhost:3001/api/contracts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "tdpId": 1,
    "ccrpId": 2,
    "datasets": [1],
    "terms": {"duration": "12 months"},
    "compensation": "1000.00"
  }'
```

### Performance Tests

#### Load Testing
```bash
# Install artillery
npm install -g artillery

# Run load test
artillery run load-test.yml
```

#### Load Test Configuration
```yaml
# load-test.yml
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 10
  defaults:
    headers:
      Content-Type: 'application/json'

scenarios:
  - name: "API Load Test"
    requests:
      - get:
          url: "/api/health"
      - post:
          url: "/api/auth/login"
          json:
            walletAddress: "0x1234567890abcdef..."
            signature: "0xsignature..."
```

---

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status ***REMOVED-DB_PASSWORD***ql

# Check connection
psql -U ***REMOVED-DB_PASSWORD*** -d contract_management

# Reset database
cd backend
npm run reset-db
```

#### Blockchain Connection Issues
```bash
# Check network connection
curl https://goerli.infura.io/v3/YOUR_PROJECT_ID

# Check contract deployment
npx hardhat console --network goerli
> const contract = await ethers.getContractAt("ContractManager", "CONTRACT_ADDRESS")
> await contract.contractCount()
```

#### Keycloak Issues
```bash
# Check Keycloak status
docker-compose -f docker-compose.iam.yml ps

# Check Keycloak logs
docker-compose -f docker-compose.iam.yml logs ***REMOVED-KEYCLOAK_DB_PASSWORD***

# Reset Keycloak
docker-compose -f docker-compose.iam.yml down
docker-compose -f docker-compose.iam.yml up -d
```

#### Frontend Issues
```bash
# Clear cache
rm -rf frontend/node_modules/.cache

# Reinstall dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Log Analysis

#### Backend Logs
```bash
# View backend logs
cd backend
npm run logs

# Check specific log files
tail -f logs/backend.log
tail -f logs/error.log
```

#### Frontend Logs
```bash
# View browser console
# Open Developer Tools (F12)
# Check Console tab for errors
```

#### System Logs
```bash
# Check system resources
./monitor-resources.sh

# Check memory usage
./analyze-memory.sh

# Check disk usage
df -h
```

### Performance Issues

#### Memory Optimization
```bash
# Run memory optimization
./optimize-memory.sh

# Monitor memory usage
./monitor-resources.sh --continuous 30
```

#### Database Optimization
```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';

-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

#### Network Optimization
```bash
# Check network latency
ping yourdomain.com

# Check DNS resolution
nslookup yourdomain.com

# Check SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

### Security Issues

#### SSL/TLS Issues
```bash
# Check SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Renew certificate
sudo certbot renew

# Check certificate expiration
echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
```

#### Authentication Issues
```bash
# Check JWT token
jwt decode YOUR_TOKEN

# Verify Keycloak configuration
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:8080/admin/realms/contract-management
```

#### Database Security
```sql
-- Check user permissions
SELECT usename, usesuper, usecreatedb 
FROM pg_user;

-- Check active connections
SELECT * FROM pg_stat_activity;
```

---

## Support and Maintenance

### Regular Maintenance

#### Daily Tasks
- [ ] Check system health
- [ ] Monitor error logs
- [ ] Verify backup completion
- [ ] Check disk space

#### Weekly Tasks
- [ ] Review performance metrics
- [ ] Update dependencies
- [ ] Check security updates
- [ ] Review access logs

#### Monthly Tasks
- [ ] Full system backup
- [ ] Performance optimization
- [ ] Security audit
- [ ] Update documentation

### Monitoring Setup

#### Application Monitoring
```bash
# Setup monitoring scripts
chmod +x scripts/monitor-resources.sh
chmod +x scripts/analyze-memory.sh

# Add to crontab
echo "*/5 * * * * /path/to/scripts/monitor-resources.sh" | crontab -
echo "0 2 * * * /path/to/scripts/analyze-memory.sh" | crontab -
```

#### Alert Configuration
```bash
# Setup email alerts
# Configure SMTP settings in .env
# Add alert thresholds to monitoring scripts
```

---

This comprehensive setup and deployment guide covers all aspects of installing, configuring, and maintaining the Contract Management System. For specific implementation details, refer to the individual service documentation and configuration files. 