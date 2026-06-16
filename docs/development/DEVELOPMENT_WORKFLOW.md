# Development Workflow Guide

## 🔒 File Permissions Management

This project uses a read-only file permissions system to prevent accidental modifications and ensure proper development practices.

### Current State
- **Production Mode**: Files are read-only by default
- **Development Mode**: Files are writable for active development

### Switching Modes

#### Enable Development Mode
```bash
./scripts/enable-development-mode.sh
```
- Makes all files writable for development
- Use this when actively coding or making changes

#### Enable Production Mode
```bash
./scripts/enable-production-mode.sh
```
- Makes critical files read-only
- Use this when not actively developing to prevent accidental changes

### File Permission Structure

#### Read-Only Files (Production Mode)
- `config.env` - Core configuration
- `secrets.env` - Sensitive configuration
- `start-system.sh` - System startup script
- `backend/services/*.js` - Backend service files
- `frontend/src/services/*.js` - Frontend service files
- `docker-compose*.yml` - Docker configuration files
- `*.md` - Documentation files

#### Always Executable
- `scripts/*.sh` - All script files remain executable
- `scripts/*.js` - Node.js scripts remain executable

## 🚀 Development Workflow

### 1. Start Development Session
```bash
# Enable development mode
./scripts/enable-development-mode.sh

# Start the system
./scripts/script-manager.sh system start

# Check system status
./scripts/script-manager.sh system status
```

### 2. Make Changes
- Edit files as needed (they're now writable)
- Test changes using the script manager
- Run tests to verify functionality

### 3. Test Changes
```bash
# Run integration tests
./scripts/script-manager.sh test integration --quick

# Create test data
./scripts/script-manager.sh test create-data --comprehensive

# Test specific user roles
./scripts/script-manager.sh test users --all
```

### 4. Commit Changes
```bash
# Add changes to git
git add <modified-files>

# Commit with descriptive message
git commit -m "feat: Description of changes made"

# Push to repository
git push origin feature/branch-name
```

### 5. End Development Session
```bash
# Stop the system
./scripts/script-manager.sh system stop

# Enable production mode
./scripts/enable-production-mode.sh
```

## 📋 Best Practices

### Configuration Management
- Always use centralized configuration (`config.env` and `secrets.env`)
- Never hardcode URLs, ports, or sensitive data
- Use environment variables in all scripts and services

### Script Usage
- Always use `./scripts/script-manager.sh` for system operations
- Use `./scripts/load-config.sh` in bash scripts
- Use `./scripts/load-config.js` in Node.js scripts

### Testing
- Run tests after every change
- Use the comprehensive test suite for validation
- Test all user roles and system components

### File Modifications
- Enable development mode before making changes
- Enable production mode when not actively developing
- Never modify files directly in production mode

## 🔧 Troubleshooting

### Permission Denied Errors
```bash
# Check current mode
ls -la config.env

# If read-only, enable development mode
./scripts/enable-development-mode.sh
```

### System Issues
```bash
# Check system status
./scripts/script-manager.sh system status

# Restart system if needed
./scripts/script-manager.sh system stop
./scripts/script-manager.sh system start
```

### Configuration Issues
```bash
# Validate configuration
./scripts/validate-config.sh

# Check environment variables
source scripts/load-config.sh && env | grep -E "(BACKEND|KEYCLOAK|SCITT)"
```

## 📚 Quick Reference

### Essential Commands
```bash
# System Management
./scripts/script-manager.sh system start|stop|status|restart

# Testing
./scripts/script-manager.sh test integration --quick
./scripts/script-manager.sh test create-data --comprehensive

# Configuration
./scripts/enable-development-mode.sh
./scripts/enable-production-mode.sh

# Help
./scripts/script-manager.sh help
```

### File Locations
- **Configuration**: `config.env`, `secrets.env`
- **Scripts**: `scripts/` directory
- **Backend**: `backend/` directory
- **Frontend**: `frontend/` directory
- **Documentation**: `docs/` directory

This workflow ensures proper development practices while maintaining system stability and preventing accidental modifications.
