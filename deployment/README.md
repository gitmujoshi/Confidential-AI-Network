# Deployment Scripts and Configuration

This directory contains all deployment-related scripts, configurations, and utilities for the Contract Management System.

## 📁 Directory Structure

```
deployment/
├── oci/                    # Oracle Cloud Infrastructure deployment
│   └── terraform/          # Complete Terraform infrastructure
├── local/                  # Local development and deployment
│   ├── dev-*.sh           # Development environment scripts
│   ├── start-*.sh         # Service startup scripts
│   ├── stop-*.sh          # Service shutdown scripts
│   ├── status.sh          # Service status checker
│   └── frontend.port      # Frontend port configuration
├── monitoring/             # System monitoring and optimization
│   ├── analyze-memory.sh  # Memory usage analysis
│   ├── monitor-resources.sh # Resource monitoring
│   └── optimize-memory.sh # Memory optimization
└── utilities/              # Utility scripts and configurations
    ├── docker-compose.iam.yml # IAM services configuration
    ├── ***REMOVED-KEYCLOAK_DB_PASSWORD***-config/    # Keycloak configuration files
    ├── manage-node-modules.sh # Node modules management
    ├── generateMnemonic.js # Wallet mnemonic generation
    └── setupKeycloak.js    # Keycloak setup automation
```

## 🚀 Quick Start

### Local Development
```bash
# Start all services locally
cd deployment/local
./start-servers.sh

# Check service status
./status.sh

# Stop all services
./stop-servers.sh
```

### OCI Deployment
```bash
# Deploy to Oracle Cloud Infrastructure
cd deployment/oci/terraform
./deploy.sh

# Destroy infrastructure
./destroy.sh
```

### Monitoring
```bash
# Monitor system resources
cd deployment/monitoring
./monitor-resources.sh

# Analyze memory usage
./analyze-memory.sh

# Optimize memory
./optimize-memory.sh
```

## 📋 Script Categories

### 🏠 Local Development (`local/`)

#### Service Management
- **`start-servers.sh`**: Start all application servers (backend, frontend, blockchain)
- **`stop-servers.sh`**: Stop all application servers
- **`start-services.sh`**: Start IAM services (Keycloak, database)
- **`stop-services.sh`**: Stop IAM services
- **`shutdown.sh`**: Comprehensive shutdown script with multiple options
- **`emergency-stop.sh`**: Emergency force kill all processes
- **`restart.sh`**: Restart services with proper shutdown/startup sequence
- **`status.sh`**: Check status of all running services
- **`start-frontend.sh`**: Memory-optimized frontend startup with error handling
- **`cleanup-memory.sh`**: Memory cleanup and cache clearing for Node.js issues

#### Development Environment
- **`dev-backend.sh`**: Start backend in development mode
- **`dev-frontend.sh`**: Start frontend in development mode
- **`dev-blockchain.sh`**: Start blockchain development environment
- **`frontend.port`**: Frontend port configuration file

### ☁️ OCI Deployment (`oci/`)

#### Terraform Infrastructure
- **Complete OCI infrastructure deployment**
- **OKE (Oracle Container Engine for Kubernetes) cluster**
- **Autonomous Database**
- **Load Balancer configuration**
- **Container Registry setup**
- **Kubernetes application deployment**

### 📊 Monitoring (`monitoring/`)

#### System Monitoring
- **`monitor-resources.sh`**: Real-time system resource monitoring
- **`analyze-memory.sh`**: Detailed memory usage analysis
- **`optimize-memory.sh`**: Memory optimization and cleanup

### 🛠️ Utilities (`utilities/`)

#### Configuration Management
- **`docker-compose.iam.yml`**: IAM services Docker Compose configuration
- **`***REMOVED-KEYCLOAK_DB_PASSWORD***-config/`**: Keycloak configuration files and setup

#### Development Utilities
- **`manage-node-modules.sh`**: Node.js modules management and optimization
- **`generateMnemonic.js`**: Generate wallet mnemonics for testing
- **`setupKeycloak.js`**: Automated Keycloak realm and user setup

## 🔧 Usage Examples

### Starting Local Development Environment

```bash
# Navigate to local scripts
cd deployment/local

# Start all services
./start-servers.sh

# Check if everything is running
./status.sh

# Start development mode for specific service
./dev-backend.sh

# If frontend has memory issues, use the optimized script
./start-frontend.sh

# Clean up memory if needed
./cleanup-memory.sh
```

### Shutdown and Restart Options

```bash
# Comprehensive shutdown with options
./shutdown.sh --all              # Stop all services gracefully
./shutdown.sh --frontend         # Stop only frontend
./shutdown.sh --force            # Force kill all processes
./shutdown.sh --clean            # Clean shutdown with file cleanup

# Emergency stop (immediate force kill)
./emergency-stop.sh

# Restart services
./restart.sh --all               # Restart all services
./restart.sh --frontend          # Restart only frontend
./restart.sh --force             # Force restart
./restart.sh --clean             # Clean restart
```

### Deploying to OCI

```bash
# Navigate to OCI deployment
cd deployment/oci/terraform

# Configure variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your OCI credentials

# Deploy infrastructure
./deploy.sh

# Check deployment status
terraform output
```

### Monitoring System Performance

```bash
# Navigate to monitoring scripts
cd deployment/monitoring

# Start resource monitoring
./monitor-resources.sh

# Analyze memory usage
./analyze-memory.sh

# Optimize if needed
./optimize-memory.sh
```

### Managing Node Modules

```bash
# Navigate to utilities
cd deployment/utilities

# Clean and reinstall node modules
./manage-node-modules.sh

# Generate test wallet
node generateMnemonic.js

# Setup Keycloak
node setupKeycloak.js
```

## 🔧 Troubleshooting

### Frontend Memory Issues

If you encounter "JavaScript heap out of memory" errors when starting the frontend:

```bash
# Use the memory-optimized frontend script
./deployment/local/start-frontend.sh

# Or clean up memory first
./deployment/local/cleanup-memory.sh
./deployment/local/start-frontend.sh

# For severe memory issues, clean dependencies
./deployment/local/cleanup-memory.sh --clean-deps
cd frontend && npm ci && cd ..
./deployment/local/start-frontend.sh
```

### Common Issues and Solutions

1. **Frontend won't start (memory error)**
   - Use `./deployment/local/start-frontend.sh` instead of `npm start`
   - Run `./deployment/local/cleanup-memory.sh` to clear cache
   - Check available system memory

2. **Port conflicts**
   - Check if ports 3000 (frontend) or 5000 (backend) are in use
   - Use `./deployment/local/status.sh` to see running services
   - Stop conflicting services with `./deployment/local/shutdown.sh`

3. **Node modules issues**
   - Run `./deployment/local/cleanup-memory.sh --clean-deps`
   - Reinstall with `npm ci` in frontend and backend directories

4. **Services not starting**
   - Check logs for specific error messages
   - Ensure all dependencies are installed
   - Verify environment variables are set correctly

## 🔒 Security Considerations

### Local Development
- Services run on localhost with appropriate port configurations
- Development mode with hot reloading enabled
- Debug logging available

### OCI Deployment
- All sensitive data stored in Kubernetes secrets
- Network security through VCN and security lists
- Database encryption and secure connections
- Container security with non-root users

## 📈 Performance Optimization

### Memory Management
- Regular memory analysis and optimization
- Node.js memory limits configured
- Resource monitoring and alerting

### Resource Scaling
- OCI infrastructure supports auto-scaling
- Kubernetes horizontal pod autoscaling
- Load balancer traffic distribution

## 🛠️ Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check what's using a port
   lsof -i :5000
   
   # Kill process if needed
   kill -9 <PID>
   ```

2. **Service Not Starting**
   ```bash
   # Check service logs
   cd deployment/local
   ./status.sh
   
   # Check specific service
   tail -f logs/backend.log
   ```

3. **Memory Issues**
   ```bash
   # Analyze memory usage
   cd deployment/monitoring
   ./analyze-memory.sh
   
   # Optimize memory
   ./optimize-memory.sh
   ```

4. **OCI Deployment Issues**
   ```bash
   # Check Terraform state
   cd deployment/oci/terraform
   terraform show
   
   # Validate configuration
   terraform validate
   ```

## 📚 Documentation

- **Local Development**: See `local/` directory for development scripts
- **OCI Deployment**: See `oci/terraform/README.md` for detailed OCI deployment guide
- **Monitoring**: See `monitoring/` scripts for system monitoring
- **Utilities**: See `utilities/` for configuration and setup scripts

## 🔄 Maintenance

### Regular Tasks
- Monitor system resources weekly
- Update dependencies monthly
- Review and optimize memory usage
- Backup configurations and data

### Updates
- Keep Terraform configurations updated
- Update Docker images regularly
- Monitor for security updates
- Review and update monitoring thresholds

## 🤝 Support

For issues and questions:
1. Check the troubleshooting section
2. Review service logs
3. Run monitoring scripts for diagnostics
4. Check documentation in respective directories
5. Contact the development team 