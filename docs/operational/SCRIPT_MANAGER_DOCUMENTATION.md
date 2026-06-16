# Script Manager Documentation

## Overview

The Script Manager (`./scripts/script-manager.sh`) is the **master script** for all system operations in the Contract Management System. It provides a unified interface that consolidates redundant scripts and offers a single entry point for all common system tasks.

## Features

- **Centralized Configuration**: Loads `config.env` and `secrets.env` automatically
- **Unified Interface**: Single command structure for all operations
- **Color-coded Output**: Clear visual feedback with colored status messages
- **Comprehensive Help**: Built-in help system with category-specific documentation
- **Error Handling**: Robust error handling with clear error messages
- **Modular Design**: Organized by functional categories

## Usage

### Basic Syntax
```bash
./scripts/script-manager.sh [CATEGORY] [COMMAND] [OPTIONS]
```

### Quick Start
```bash
# Show general help
./scripts/script-manager.sh help

# Show category-specific help
./scripts/script-manager.sh help system
./scripts/script-manager.sh help test
```

## Categories

### 1. System Management (`system`)

Manages core system services and operations.

#### Commands:
- `start [OPTIONS]` - Start services
- `stop [OPTIONS]` - Stop services  
- `restart [OPTIONS]` - Restart services
- `status` - Show system status
- `clean-start` - Clean system start
- `clean-stop` - Clean system stop

#### Options:
- `--backend-only` - Start/stop only backend
- `--frontend-only` - Start/stop only frontend
- `--scitt-ccf-only` - Start/stop only SCITT CCF
- `--dev` - Development mode
- `--production` - Production mode

#### Examples:
```bash
# Start all services
./scripts/script-manager.sh system start

# Start only backend in dev mode
./scripts/script-manager.sh system start --backend-only --dev

# Check system status
./scripts/script-manager.sh system status

# Clean restart
./scripts/script-manager.sh system restart
```

### 2. Setup and Installation (`setup`)

Handles system setup, installation, and configuration.

#### Commands:
- `fresh` - Fresh system setup
- `dev` - Development environment setup
- `***REMOVED-KEYCLOAK_DB_PASSWORD*** [OPTIONS]` - Keycloak setup
- `database [OPTIONS]` - Database setup
- `dependencies` - Install dependencies

#### Keycloak Options:
- `--http` - HTTP setup
- `--https` - HTTPS setup
- `--persistent` - Persistent setup

#### Database Options:
- `--test` - Test database
- `--production` - Production database
- `--comprehensive` - Comprehensive setup

#### Examples:
```bash
# Fresh system setup
./scripts/script-manager.sh setup fresh

# Setup Keycloak with HTTPS
./scripts/script-manager.sh setup ***REMOVED-KEYCLOAK_DB_PASSWORD*** --https

# Setup test database
./scripts/script-manager.sh setup database --test

# Install all dependencies
./scripts/script-manager.sh setup dependencies
```

### 3. Testing (`test`)

Comprehensive testing suite for all system components.

#### Commands:
- `apis [OPTIONS]` - API testing
- `contracts [OPTIONS]` - Contract creation testing
- `ai-models [OPTIONS]` - AI model testing
- `e2e [OPTIONS]` - End-to-end testing
- `create-data [OPTIONS]` - Create test data
- `integration [OPTIONS]` - Integration testing
- `users [OPTIONS]` - User role testing
- `datasets [OPTIONS]` - Dataset testing
- `models [OPTIONS]` - AI model testing
- `environments [OPTIONS]` - Training environment testing
- `test-data [OPTIONS]` - Manage common test data

#### API Test Options:
- `--simple` - Simple output format
- `--verbose` - Verbose output

#### Contract Test Options:
- `--ui` - UI testing
- `--e2e` - End-to-end testing
- `--simplified` - Simplified testing

#### Test Data Options:
- `--comprehensive` - Create comprehensive test data
- `--basic` - Create basic test data
- `--via-apis` - Create data via APIs only
- `--tdp-only` - Create TDP test data only
- `--tdc-only` - Create TDC test data only
- `--ccrp-only` - Create CCRP test data only

#### Integration Test Options:
- `--full` - Full integration test suite
- `--quick` - Quick integration tests
- `--user-workflows` - Test user workflows
- `--role-based` - Test role-based functionality

#### Examples:
```bash
# Run API tests with simple output
./scripts/script-manager.sh test apis --simple

# Test contract creation with UI
./scripts/script-manager.sh test contracts --ui

# Create comprehensive test data via APIs
./scripts/script-manager.sh test create-data --comprehensive --via-apis

# Run full integration test suite
./scripts/script-manager.sh test integration --full

# Test TDP user functionality
./scripts/script-manager.sh test users --tdp

# Test dataset creation
./scripts/script-manager.sh test datasets --create
```

### 4. Deployment (`deploy`)

Handles various deployment scenarios and environments.

#### Commands:
- `local [OPTIONS]` - Local deployment
- `cloud [OPTIONS]` - Cloud deployment
- `k8s [OPTIONS]` - Kubernetes deployment
- `status` - Deployment status

#### Cloud Options:
- `--azure` - Azure deployment
- `--gcp` - Google Cloud deployment
- `--oci` - Oracle Cloud deployment

#### K8s Options:
- `--minikube` - Minikube setup
- `--local` - Local K8s setup

#### Examples:
```bash
# Local deployment
./scripts/script-manager.sh deploy local

# Azure cloud deployment
./scripts/script-manager.sh deploy cloud --azure

# Minikube K8s deployment
./scripts/script-manager.sh deploy k8s --minikube

# Check deployment status
./scripts/script-manager.sh deploy status
```

### 5. Configuration Management (`config`)

Manages system configuration and settings.

#### Commands:
- `validate` - Validate configuration
- `backup` - Backup configuration
- `restore` - Restore configuration
- `status` - Configuration status
- `fix` - Fix configuration issues

#### Examples:
```bash
# Validate current configuration
./scripts/script-manager.sh config validate

# Backup configuration
./scripts/script-manager.sh config backup

# Check configuration status
./scripts/script-manager.sh config status
```

### 6. Monitoring and Maintenance (`monitor`)

System monitoring, maintenance, and optimization.

#### Commands:
- `resources` - Monitor system resources
- `memory` - Memory analysis
- `cleanup` - System cleanup
- `optimize` - System optimization
- `emergency-stop` - Emergency stop

#### Examples:
```bash
# Monitor system resources
./scripts/script-manager.sh monitor resources

# Analyze memory usage
./scripts/script-manager.sh monitor memory

# Clean up system
./scripts/script-manager.sh monitor cleanup

# Emergency stop all services
./scripts/script-manager.sh monitor emergency-stop
```

## Configuration

The script manager automatically loads configuration from:
1. `config.env` - Main configuration file
2. `secrets.env` - Secrets and sensitive data (if available)

## Error Handling

- **Exit on Error**: Script uses `set -e` for immediate exit on errors
- **Clear Error Messages**: Color-coded error messages with context
- **Help Integration**: Unknown commands show relevant help information
- **Validation**: Input validation for commands and options

## Color Coding

- 🔴 **RED**: Errors and critical issues
- 🟢 **GREEN**: Success messages
- 🟡 **YELLOW**: Warnings and important information
- 🔵 **BLUE**: Status updates and information
- 🟣 **PURPLE**: Special operations
- 🔵 **CYAN**: Help and documentation

## Best Practices

1. **Always use the script manager** instead of individual scripts
2. **Check help first** for unfamiliar commands
3. **Use appropriate options** for your specific needs
4. **Monitor system status** regularly
5. **Backup configuration** before major changes
6. **Test thoroughly** before production deployment

## Troubleshooting

### Common Issues:

1. **Permission Denied**
   ```bash
   chmod +x ./scripts/script-manager.sh
   ```

2. **Configuration Not Found**
   - Ensure `config.env` exists in project root
   - Check file permissions

3. **Service Not Starting**
   - Check system status: `./scripts/script-manager.sh system status`
   - Review logs for specific errors

4. **Test Failures**
   - Ensure services are running
   - Check configuration validity
   - Review test-specific logs

### Getting Help:

```bash
# General help
./scripts/script-manager.sh help

# Category-specific help
./scripts/script-manager.sh help [category]

# Command-specific help
./scripts/script-manager.sh [category] [command] --help
```

## Integration

The script manager integrates with:
- **Docker Compose**: For service orchestration
- **Keycloak**: For authentication setup
- **PostgreSQL**: For database operations
- **Node.js**: For backend services
- **React**: For frontend services
- **Kubernetes**: For container orchestration

## Maintenance

- **Regular Updates**: Keep script manager updated with new features
- **Configuration Sync**: Ensure all scripts use centralized configuration
- **Error Monitoring**: Monitor for common error patterns
- **Performance**: Optimize script execution times
- **Documentation**: Keep documentation current with changes

---

**Note**: This script manager replaces the need for individual script execution and provides a consistent, maintainable interface for all system operations.
