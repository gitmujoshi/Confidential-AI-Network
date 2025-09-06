#!/bin/bash

# Cleanup Old Deployment Scripts
# This script removes outdated deployment scripts and keeps only the essential ones

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Scripts to keep (essential ones)
KEEP_SCRIPTS=(
    "clean-start.sh"
    "clean-stop.sh"
    "setup-linux.sh"
    "cleanup-old-scripts.sh"
)

# Scripts to remove (outdated ones)
REMOVE_SCRIPTS=(
    "build-system.sh"
    "fix-auth.sh"
    "fix-database-setup.sh"
    "fix-keycloak.sh"
    "generate-keycloak-certs.sh"
    "manage-scitt-ccf.sh"
    "quick-test.sh"
    "setup-fresh-system.sh"
    "start-system.sh"
    "stop-scitt-ccf.sh"
    "stop-system.sh"
    "test-scitt-ccf-suite.sh"
    "test-ui-scitt-ccf.sh"
)

# Deployment directory scripts to remove
REMOVE_DEPLOYMENT_SCRIPTS=(
    "deployment/local/backup-keycloak.sh"
    "deployment/local/cleanup-memory.sh"
    "deployment/local/dev-backend.sh"
    "deployment/local/dev-blockchain.sh"
    "deployment/local/dev-frontend.sh"
    "deployment/local/emergency-stop.sh"
    "deployment/local/restart.sh"
    "deployment/local/restore-keycloak.sh"
    "deployment/local/setup-and-run.sh"
    "deployment/local/setup-keycloak-persistent.sh"
    "deployment/local/shutdown.sh"
    "deployment/local/start-backend-only.sh"
    "deployment/local/start-frontend.sh"
    "deployment/local/start-scitt-ccf-integrated.sh"
    "deployment/local/start-servers.sh"
    "deployment/local/start-services.sh"
    "deployment/local/status.sh"
    "deployment/local/stop-servers.sh"
    "deployment/local/stop-services.sh"
)

print_status "Starting cleanup of old deployment scripts..."

# Function to backup before removal
backup_scripts() {
    print_status "Creating backup of scripts before removal..."
    BACKUP_DIR="script-backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup root scripts
    for script in "${REMOVE_SCRIPTS[@]}"; do
        if [ -f "$script" ]; then
            cp "$script" "$BACKUP_DIR/"
            print_status "Backed up: $script"
        fi
    done
    
    # Backup deployment scripts
    mkdir -p "$BACKUP_DIR/deployment/local"
    for script in "${REMOVE_DEPLOYMENT_SCRIPTS[@]}"; do
        if [ -f "$script" ]; then
            cp "$script" "$BACKUP_DIR/deployment/local/"
            print_status "Backed up: $script"
        fi
    done
    
    print_success "Backup created in: $BACKUP_DIR"
}

# Function to remove root scripts
remove_root_scripts() {
    print_status "Removing outdated root scripts..."
    
    for script in "${REMOVE_SCRIPTS[@]}"; do
        if [ -f "$script" ]; then
            rm "$script"
            print_success "Removed: $script"
        else
            print_warning "Script not found: $script"
        fi
    done
}

# Function to remove deployment scripts
remove_deployment_scripts() {
    print_status "Removing outdated deployment scripts..."
    
    for script in "${REMOVE_DEPLOYMENT_SCRIPTS[@]}"; do
        if [ -f "$script" ]; then
            rm "$script"
            print_success "Removed: $script"
        else
            print_warning "Script not found: $script"
        fi
    done
    
    # Remove empty deployment directories if they exist
    if [ -d "deployment/local" ] && [ -z "$(ls -A deployment/local 2>/dev/null)" ]; then
        rmdir deployment/local
        print_status "Removed empty directory: deployment/local"
    fi
    
    if [ -d "deployment" ] && [ -z "$(ls -A deployment 2>/dev/null)" ]; then
        rmdir deployment
        print_status "Removed empty directory: deployment"
    fi
}

# Function to create new essential scripts
create_essential_scripts() {
    print_status "Creating essential management scripts..."
    
    # Create a simple start script
    cat > start.sh << 'EOF'
#!/bin/bash
# Start Contract Management System

echo "🚀 Starting Contract Management System..."

# Start Docker services
docker-compose -f docker-compose.main.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Start backend
cd backend && node server.js &
BACKEND_PID=$!
echo $BACKEND_PID > .backend.pid

# Start frontend
cd ../frontend && npm start &
FRONTEND_PID=$!
echo $FRONTEND_PID > .frontend.pid

echo "✅ System started successfully!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
EOF

    # Create a simple stop script
    cat > stop.sh << 'EOF'
#!/bin/bash
# Stop Contract Management System

echo "🛑 Stopping Contract Management System..."

# Stop backend
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    kill $BACKEND_PID 2>/dev/null || true
    rm -f .backend.pid
    echo "✅ Backend stopped"
fi

# Stop frontend
if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    kill $FRONTEND_PID 2>/dev/null || true
    rm -f .frontend.pid
    echo "✅ Frontend stopped"
fi

# Stop Docker services
docker-compose -f docker-compose.main.yml down

echo "✅ System stopped successfully!"
EOF

    # Create a status script
    cat > status.sh << 'EOF'
#!/bin/bash
# Check Contract Management System Status

echo "📊 Contract Management System Status"
echo "=================================="

echo "🐳 Docker Services:"
docker-compose -f docker-compose.main.yml ps

echo ""
echo "🔧 Application Services:"
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "✅ Backend running (PID: $BACKEND_PID)"
    else
        echo "❌ Backend not running"
    fi
else
    echo "❌ Backend not started"
fi

if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "✅ Frontend running (PID: $FRONTEND_PID)"
    else
        echo "❌ Frontend not running"
    fi
else
    echo "❌ Frontend not started"
fi

echo ""
echo "🌐 Service Health:"
curl -s http://localhost:5001/health | jq . 2>/dev/null || echo "❌ Backend not responding"
curl -s http://localhost:3000 | head -1 || echo "❌ Frontend not responding"
curl -s http://localhost:8080/health/ready | jq . 2>/dev/null || echo "❌ Keycloak not responding"
EOF

    # Make scripts executable
    chmod +x start.sh stop.sh status.sh
    
    print_success "Essential scripts created: start.sh, stop.sh, status.sh"
}

# Function to update README
update_readme() {
    print_status "Updating README with new script information..."
    
    # Create a simple README section for scripts
    cat > SCRIPT_USAGE.md << 'EOF'
# Script Usage Guide

## Essential Scripts

### Development Scripts
- `clean-start.sh` - Start the system with clean setup
- `clean-stop.sh` - Stop the system and clean up
- `start.sh` - Simple start script for development
- `stop.sh` - Simple stop script for development
- `status.sh` - Check system status

### Setup Scripts
- `setup-linux.sh` - Complete Linux environment setup from scratch

## Usage

### Development
```bash
# Start the system
./start.sh

# Check status
./status.sh

# Stop the system
./stop.sh
```

### Clean Setup
```bash
# Start with clean setup
./clean-start.sh

# Stop and cleanup
./clean-stop.sh
```

### New Linux Environment
```bash
# Run complete setup
./setup-linux.sh
```

## Service URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001
- Keycloak: http://localhost:8080
EOF

    print_success "Documentation created: SCRIPT_USAGE.md"
}

# Main execution
main() {
    echo "🧹 Contract Management System - Script Cleanup"
    echo "=============================================="
    
    # Ask for confirmation
    read -p "This will remove old deployment scripts. Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Cleanup cancelled"
        exit 0
    fi
    
    # Create backup
    backup_scripts
    
    # Remove old scripts
    remove_root_scripts
    remove_deployment_scripts
    
    # Create new essential scripts
    create_essential_scripts
    
    # Update documentation
    update_readme
    
    print_success "Cleanup completed successfully!"
    echo ""
    echo "📋 Remaining scripts:"
    ls -la *.sh 2>/dev/null || echo "No shell scripts found"
    echo ""
    echo "📚 See SCRIPT_USAGE.md for usage instructions"
}

# Run main function
main "$@"
