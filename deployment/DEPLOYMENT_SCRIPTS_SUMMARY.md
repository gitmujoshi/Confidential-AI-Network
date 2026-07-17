# Contract Management System - Deployment Scripts Summary

## 🎯 Overview

This document provides a comprehensive overview of all deployment scripts available in the Contract Management System. **Always use deployment scripts to manage services** as requested by the user.

## 📋 Complete Script Inventory

### 🔐 Keycloak IAM Management Scripts

| Script | Purpose | Usage | Status |
|--------|---------|-------|---------|
| `setup-keycloak-https.sh` | Complete HTTPS Keycloak setup with SSL certificates | `./deployment/setup-keycloak-https.sh` | ✅ Ready |
| `fix-keycloak-client-config.sh` | Fix Keycloak client configuration for backend authentication | `./deployment/fix-keycloak-client-config.sh` | ✅ Ready |
| `start-keycloak-https.sh` | Start Keycloak HTTPS service | `./deployment/start-keycloak-https.sh` | ✅ Ready |
| `stop-keycloak-https.sh` | Stop Keycloak HTTPS service | `./deployment/stop-keycloak-https.sh` | ✅ Ready |
| `status-keycloak-https.sh` | Check Keycloak HTTPS status | `./deployment/status-keycloak-https.sh` | ✅ Ready |

### 🚀 Complete Environment Management Scripts

| Script | Purpose | Usage | Status |
|--------|---------|-------|---------|
| `setup-complete-environment.sh` | **Complete system setup** - Keycloak, databases, SCITT CCF, backend, frontend | `./deployment/setup-complete-environment.sh` | ✅ Ready |
| `deployment-status.sh` | **Comprehensive status check** - All services and deployment scripts | `./deployment/deployment-status.sh` | ✅ Ready |

### 🏠 Local Services Management Scripts

| Script | Purpose | Usage | Status |
|--------|---------|-------|---------|
| `local/start-services.sh` | Start local services using deployment scripts | `./deployment/local/start-services.sh` | ✅ Ready |
| `local/stop-services.sh` | Stop local services using deployment scripts | `./deployment/local/stop-services.sh` | ✅ Ready |
| `local/status.sh` | Check local services status | `./deployment/local/status.sh` | ✅ Ready |

### 🧪 Test Data and API Testing Scripts

| Script | Purpose | Usage | Status |
|--------|---------|-------|---------|
| `create-test-data.sh` | **Create comprehensive test data** for TDP, TDC, CCRP users | `./deployment/create-test-data.sh` | ✅ Ready |
| `test-basic-apis.sh` | Test basic API functionality before creating test data | `./deployment/test-basic-apis.sh` | ✅ Ready |

---

## 🚀 Quick Start Guide

### 1. Complete Environment Setup (Recommended for First Time)
```bash
# Setup everything at once - Keycloak, databases, SCITT CCF, backend, frontend
./deployment/setup-complete-environment.sh
```

**What this script does:**
- ✅ Setup Keycloak HTTPS IAM with SSL certificates
- ✅ Start main PostgreSQL database (required for backend)
- ✅ Fix Keycloak client configuration for backend authentication
- ✅ Start SCITT CCF services (blockchain infrastructure)
- ✅ Start backend and frontend services
- ✅ Test IAM integration
- ✅ Create management scripts for the complete environment

### 2. Individual Service Setup
```bash
# Setup just Keycloak HTTPS IAM
./deployment/setup-keycloak-https.sh

# Fix Keycloak client configuration (if authentication issues)
./deployment/fix-keycloak-client-config.sh

# Start local services
./deployment/local/start-services.sh
```

### 3. Service Management
```bash
# Check complete system status
./deployment/deployment-status.sh

# Start/Stop Keycloak
./deployment/start-keycloak-https.sh
./deployment/stop-keycloak-https.sh

# Start/Stop local services
./deployment/local/start-services.sh
./deployment/local/stop-services.sh
```

### 4. Test Data Creation
```bash
# Test basic APIs first
./deployment/test-basic-apis.sh

# Create comprehensive test data for all user types
./deployment/create-test-data.sh
```

---

## 🔧 Troubleshooting Scripts

### Common Issues and Solutions

#### 1. Keycloak Authentication Failed
```bash
# Fix Keycloak client configuration
./deployment/fix-keycloak-client-config.sh

# Restart backend after fix
cd backend && npm run dev
```

#### 2. Database Connection Issues
```bash
# Check if main PostgreSQL is running
docker ps | grep postgres-app

# Start main database if needed
docker-compose -f docker-compose.main.yml up -d postgres-app
```

#### 3. Service Port Conflicts
```bash
# Check what's using the ports
./deployment/deployment-status.sh

# Stop conflicting services
./deployment/local/stop-services.sh
```

### Health Checks
```bash
# Complete system health check
./deployment/deployment-status.sh

# Keycloak specific health check
./deployment/status-keycloak-https.sh

# Local services health check
./deployment/local/status.sh
```

---

## 🧪 Test Data Creation

### What Test Data is Created

#### 👥 Users (9 total)
- **TDP Users (3)**: Training Data Providers
  - `tdp1@dataprovider.com` / `tdp123` - DataCorp Inc.
  - `tdp2@dataprovider.com` / `tdp123` - InfoSource Ltd.
  - `tdp3@dataprovider.com` / `tdp123` - DataFlow Systems

- **TDC Users (3)**: Training Data Consumers
  - `tdc1@dataconsumer.com` / `tdc123` - AI Solutions Corp.
  - `tdc2@dataconsumer.com` / `tdc123` - ML Innovations Ltd.
  - `tdc3@dataconsumer.com` / `tdc123` - SmartTech Industries

- **CCRP Users (3)**: Confidential Clean Room Providers
  - `ccrp1@cleanroom.com` / `ccrp123` - SecureCompute Inc.
  - `ccrp2@cleanroom.com` / `ccrp123` - PrivacyFirst Computing
  - `ccrp3@cleanroom.com` / `ccrp123` - ConfidentialAI Labs

#### 📊 Datasets (9 total - 3 per TDP user)
- Customer Behavior Analytics
- Financial Transaction Records
- Healthcare Patient Data
- IoT Sensor Data
- Social Media Sentiment
- E-commerce Purchase History
- Satellite Imagery
- Genomic Sequences
- Traffic Flow Data

#### 🤖 AI Models (9 total - 3 per TDC user)
- Fraud Detection Model
- Customer Segmentation Model
- Predictive Analytics Engine
- Image Recognition Model
- Natural Language Processor
- Recommendation System
- Anomaly Detection Model
- Optimization Engine
- Risk Assessment Model

#### 🏗️ Training Environments (9 total - 3 per CCRP user)
- High-Security Compute Cluster
- Confidential Data Lab
- Federated Learning Hub
- Privacy-First Compute Grid
- Secure Multi-Tenant Platform
- Confidential AI Workspace
- Zero-Knowledge Compute
- Homomorphic Encryption Lab
- Secure Model Training

#### ☁️ Cloud Credentials (9 total - 3 per CCRP user)
- AWS, Azure, and GCP credentials for each CCRP user
- Different regions and security levels
- Proper permissions and encryption settings

---

## 📊 Service Ports

| Service | Port | Purpose | Status |
|---------|------|---------|---------|
| Frontend | 3000 | React application | ✅ Running |
| Backend | 5001 | Node.js API server | ✅ Running |
| Main PostgreSQL | 5432 | Application database | ✅ Running |
| Keycloak PostgreSQL | 5433 | IAM database | ✅ Running |
| SCITT CCF PostgreSQL | 5434 | Blockchain database | ✅ Running |
| SCITT CCF Node | 8000 | Blockchain node | ✅ Running |
| SCITT CCF Dashboard | 8082 | Blockchain monitoring | ✅ Running |
| Keycloak HTTPS | 8443 | IAM service | ✅ Running |
| Redis | 6380 | Cache and sessions | ✅ Running |

---

## 🎯 Best Practices

### ✅ Always Use Deployment Scripts
- Never manually start/stop services
- Use `./deployment/setup-complete-environment.sh` for complete setup
- Use individual scripts for specific services

### ✅ Check Status Before Changes
```bash
# Always check current status first
./deployment/deployment-status.sh
```

### ✅ Use HTTPS for Keycloak
- Keycloak admin API requires HTTPS
- Self-signed certificates are configured for development
- Production should use proper CA-signed certificates

### ✅ Test IAM Integration
- Always test login after configuration changes
- Verify JWT tokens are working
- Check user roles and permissions

---

## 🔄 Workflow Examples

### Development Workflow
```bash
# 1. Start development environment
./deployment/setup-complete-environment.sh

# 2. Check status
./deployment/deployment-status.sh

# 3. Create test data
./deployment/create-test-data.sh

# 4. Make changes and test

# 5. Stop when done
./deployment/local/stop-services.sh
```

### Troubleshooting Workflow
```bash
# 1. Check current status
./deployment/deployment-status.sh

# 2. Identify the issue

# 3. Run appropriate fix script
./deployment/fix-keycloak-client-config.sh

# 4. Verify the fix
./deployment/deployment-status.sh
```

### Service Restart Workflow
```bash
# 1. Stop services
./deployment/local/stop-services.sh

# 2. Wait a moment
sleep 5

# 3. Start services
./deployment/local/start-services.sh

# 4. Verify status
./deployment/deployment-status.sh
```

---

## 📝 Notes

- **HTTPS Required**: Keycloak admin operations require HTTPS
- **Persistent Configuration**: All settings persist across restarts
- **Database Dependencies**: Backend requires main PostgreSQL database
- **IAM Integration**: Backend authenticates users through Keycloak
- **Deployment Scripts**: All services managed through deployment scripts
- **Test Data**: All test data created via backend APIs (no direct database access)

---

## 🆘 Emergency Commands

### Force Stop Everything
```bash
# Stop all Docker services
docker-compose -f docker-compose.*.yml down

# Kill all Node.js processes
pkill -f node
pkill -f npm

# Free all ports
for port in 3000 5001 5432 5433 5434 8000 8080 8082 8443 6380; do
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
done
```

### Complete Reset
```bash
# Stop everything
./deployment/local/stop-services.sh

# Remove all containers and volumes
docker system prune -a --volumes

# Start fresh
./deployment/setup-complete-environment.sh
```

---

## 📚 Related Documentation

- **IAM Integration Design**: `docs/IAM_INTEGRATION_DESIGN.md`
- **Deployment Scripts Guide**: `deployment/DEPLOYMENT_SCRIPTS_GUIDE.md`
- **API Testing Guide**: `deployment/test-basic-apis.sh`
- **Test Data Creation**: `deployment/create-test-data.sh`

---

**Remember: Always use deployment scripts to manage services!** 🚀

**Last Updated**: 2025-08-29  
**Status**: All scripts ready and tested
