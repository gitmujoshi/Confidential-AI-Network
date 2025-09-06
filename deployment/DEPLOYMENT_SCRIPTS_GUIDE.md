# Contract Management System - Deployment Scripts Guide

## 🎯 Overview

This guide covers all deployment scripts for the Contract Management System. **Always use deployment scripts to setup and manage services** as requested by the user.

## 📋 Available Deployment Scripts

### 🔐 Keycloak IAM Management

| Script | Purpose | Usage |
|--------|---------|-------|
| `setup-keycloak-https.sh` | Complete HTTPS Keycloak setup with SSL certificates | `./deployment/setup-keycloak-https.sh` |
| `fix-keycloak-client-config.sh` | Fix Keycloak client configuration for backend authentication | `./deployment/fix-keycloak-client-config.sh` |
| `start-keycloak-https.sh` | Start Keycloak HTTPS service | `./deployment/start-keycloak-https.sh` |
| `stop-keycloak-https.sh` | Stop Keycloak HTTPS service | `./deployment/stop-keycloak-https.sh` |
| `status-keycloak-https.sh` | Check Keycloak HTTPS status | `./deployment/status-keycloak-https.sh` |

### 🚀 Complete Environment Management

| Script | Purpose | Usage |
|--------|---------|-------|
| `setup-complete-environment.sh` | **Complete system setup** - Keycloak, databases, SCITT CCF, backend, frontend | `./deployment/setup-complete-environment.sh` |
| `deployment-status.sh` | **Comprehensive status check** - All services and deployment scripts | `./deployment/deployment-status.sh` |

### 🏠 Local Services Management

| Script | Purpose | Usage |
|--------|---------|-------|
| `local/start-services.sh` | Start local services using deployment scripts | `./deployment/local/start-services.sh` |
| `local/stop-services.sh` | Stop local services using deployment scripts | `./deployment/local/stop-services.sh` |
| `local/status.sh` | Check local services status | `./deployment/local/status.sh` |

## 🚀 Quick Start Guide

### 1. Complete Environment Setup (Recommended)

```bash
# Setup everything at once
./deployment/setup-complete-environment.sh
```

This script will:
- ✅ Setup Keycloak HTTPS IAM
- ✅ Start main PostgreSQL database
- ✅ Fix Keycloak client configuration
- ✅ Start SCITT CCF services
- ✅ Start backend and frontend
- ✅ Test IAM integration

### 2. Individual Service Setup

```bash
# Setup just Keycloak HTTPS
./deployment/setup-keycloak-https.sh

# Fix Keycloak client configuration
./deployment/fix-keycloak-client-config.sh

# Start local services
./deployment/local/start-services.sh
```

### 3. Service Management

```bash
# Check complete status
./deployment/deployment-status.sh

# Start/Stop Keycloak
./deployment/start-keycloak-https.sh
./deployment/stop-keycloak-https.sh

# Start/Stop local services
./deployment/local/start-services.sh
./deployment/local/stop-services.sh
```

## 🔧 Troubleshooting

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

## 🔐 IAM Integration Testing

### Test Admin User Login
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@contractmanagement.com","password":"admin123"}'
```

### Test Backend Health
```bash
curl http://localhost:5001/health
```

### Test Keycloak HTTPS
```bash
curl -k https://localhost:8443/health
```

## 📊 Service Ports

| Service | Port | Purpose |
|---------|------|---------|
| Frontend | 3000 | React application |
| Backend | 5001 | Node.js API server |
| Main PostgreSQL | 5432 | Application database |
| Keycloak PostgreSQL | 5433 | IAM database |
| SCITT CCF PostgreSQL | 5434 | Blockchain database |
| SCITT CCF Node | 8000 | Blockchain node |
| SCITT CCF Dashboard | 8082 | Blockchain monitoring |
| Keycloak HTTPS | 8443 | IAM service |
| Redis | 6380 | Cache and sessions |

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

## 🔄 Workflow Examples

### Development Workflow
```bash
# 1. Start development environment
./deployment/setup-complete-environment.sh

# 2. Check status
./deployment/deployment-status.sh

# 3. Make changes and test

# 4. Stop when done
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

## 📝 Notes

- **HTTPS Required**: Keycloak admin operations require HTTPS
- **Persistent Configuration**: All settings persist across restarts
- **Database Dependencies**: Backend requires main PostgreSQL database
- **IAM Integration**: Backend authenticates users through Keycloak
- **Deployment Scripts**: All services managed through deployment scripts

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

**Remember: Always use deployment scripts to manage services!** 🚀
