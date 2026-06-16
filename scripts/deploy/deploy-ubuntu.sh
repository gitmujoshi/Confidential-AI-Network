#!/bin/bash


source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../lib/common.sh"
resolve_repo_root
# Contract Management System - Ubuntu/Linux Deployment Script
# This script sets up the entire system on a fresh Ubuntu machine

set -e  # Exit on any error

echo "🚀 Starting Contract Management System Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as a regular user."
   exit 1
fi

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y
print_success "System updated successfully"

# Install required packages
print_status "Installing required packages..."
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
print_success "Required packages installed"

# Install Docker
print_status "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    print_success "Docker installed successfully"
else
    print_warning "Docker is already installed"
fi

# Install Docker Compose
print_status "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose installed successfully"
else
    print_warning "Docker Compose is already installed"
fi

# Install Node.js
print_status "Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_success "Node.js installed successfully"
else
    print_warning "Node.js is already installed (version: $(node --version))"
fi

# Install PostgreSQL client
print_status "Installing PostgreSQL client..."
sudo apt install -y ***REMOVED-DB_PASSWORD***ql-client
print_success "PostgreSQL client installed"

# Create application directory
APP_DIR="$HOME/contract-management"
print_status "Setting up application directory: $APP_DIR"

if [ -d "$APP_DIR" ]; then
    print_warning "Application directory already exists. Backing up..."
    mv "$APP_DIR" "${APP_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
fi

mkdir -p "$APP_DIR"
cd "$APP_DIR"

# Clone repository (replace with your actual repo URL)
print_status "Cloning repository..."
# git clone <your-repo-url> .
# For now, we'll create a placeholder
echo "Please clone your repository to: $APP_DIR"

# Create environment configuration
print_status "Creating environment configuration..."
cat > config.env << 'EOF'
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=contract_management
DB_USER=***REMOVED-DB_PASSWORD***
DB_PASSWORD=***REMOVED-DB_PASSWORD***123

# Keycloak Configuration
KEYCLOAK_URL=https://localhost:8443
KEYCLOAK_REALM=contract-management
KEYCLOAK_CLIENT_ID=contract-management-client
KEYCLOAK_CLIENT_SECRET=
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=***REMOVED-KEYCLOAK_ADMIN_PASSWORD***
KEYCLOAK_ENABLED=true

# SCITT CCF Configuration
SCITT_ENABLED=true
CCF_NODE_URL=http://localhost:8000
CCF_PLATFORM=virtual

# Application Configuration
NODE_ENV=production
PORT=5001
FRONTEND_PORT=3000

# Email Configuration
EMAIL_ENABLED=false
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# Security Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ENCRYPTION_KEY=your-32-character-encryption-key-here
EOF

print_success "Environment configuration created"

# Create startup script
print_status "Creating startup script..."
cat > start-system.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting Contract Management System..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start services
echo "📦 Starting Docker services..."
run_compose "docker-compose.main.yml" up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
echo "🔍 Checking service health..."

# Check PostgreSQL
if docker exec ***REMOVED-DB_PASSWORD*** pg_isready -U ***REMOVED-DB_PASSWORD*** > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready"
else
    echo "❌ PostgreSQL is not ready"
fi

# Check Keycloak
if curl -s -k https://localhost:8443/health > /dev/null 2>&1; then
    echo "✅ Keycloak is ready"
else
    echo "❌ Keycloak is not ready"
fi

# Start backend
echo "🔧 Starting backend..."
cd backend
npm install
npm run dev &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Start frontend
echo "🎨 Starting frontend..."
cd ../frontend
npm install
npm start &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

# Save PIDs for later use
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

echo "🎉 System started successfully!"
echo "Backend: http://localhost:5001"
echo "Frontend: http://localhost:3000"
echo "Keycloak: https://localhost:8443"
echo ""
echo "To stop the system, run: ./stop-system.sh"
EOF

chmod +x start-system.sh

# Create stop script
print_status "Creating stop script..."
cat > stop-system.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping Contract Management System..."

# Stop backend
if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "🔄 Stopping backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        rm .backend.pid
    fi
fi

# Stop frontend
if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "🔄 Stopping frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        rm .frontend.pid
    fi
fi

# Stop Docker services
echo "📦 Stopping Docker services..."
run_compose "docker-compose.main.yml" down

echo "✅ System stopped successfully!"
EOF

chmod +x stop-system.sh

# Create status check script
print_status "Creating status check script..."
cat > check-status.sh << 'EOF'
#!/bin/bash

echo "🔍 Contract Management System Status"
echo "=================================="

# Check Docker services
echo "📦 Docker Services:"
if docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(***REMOVED-DB_PASSWORD***|***REMOVED-KEYCLOAK_DB_PASSWORD***|contract)" > /dev/null; then
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(***REMOVED-DB_PASSWORD***|***REMOVED-KEYCLOAK_DB_PASSWORD***|contract)"
else
    echo "❌ No Docker services running"
fi

echo ""

# Check backend
echo "🔧 Backend Status:"
if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "✅ Backend running (PID: $BACKEND_PID)"
        if curl -s http://localhost:5001/health > /dev/null 2>&1; then
            echo "✅ Backend API responding"
        else
            echo "❌ Backend API not responding"
        fi
    else
        echo "❌ Backend not running"
    fi
else
    echo "❌ Backend PID file not found"
fi

echo ""

# Check frontend
echo "🎨 Frontend Status:"
if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "✅ Frontend running (PID: $FRONTEND_PID)"
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            echo "✅ Frontend responding"
        else
            echo "❌ Frontend not responding"
        fi
    else
        echo "❌ Frontend not running"
    fi
else
    echo "❌ Frontend PID file not found"
fi

echo ""

# Check Keycloak
echo "🔐 Keycloak Status:"
if curl -s -k https://localhost:8443/health > /dev/null 2>&1; then
    echo "✅ Keycloak responding"
else
    echo "❌ Keycloak not responding"
fi

echo ""

# Check ports
echo "🌐 Port Status:"
echo "Backend (5001): $(netstat -tlnp 2>/dev/null | grep :5001 || echo 'Not listening')"
echo "Frontend (3000): $(netstat -tlnp 2>/dev/null | grep :3000 || echo 'Not listening')"
echo "Keycloak (8443): $(netstat -tlnp 2>/dev/null | grep :8443 || echo 'Not listening')"
EOF

chmod +x check-status.sh

# Create systemd service files (optional)
print_status "Creating systemd service files..."
sudo tee /etc/systemd/system/contract-management.service > /dev/null << 'EOF'
[Unit]
Description=Contract Management System
After=docker.service
Requires=docker.service

[Service]
Type=forking
User=$USER
WorkingDirectory=$APP_DIR
ExecStart=$APP_DIR/start-system.sh
ExecStop=$APP_DIR/stop-system.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create README
print_status "Creating deployment README..."
cat > DEPLOYMENT_README.md << 'EOF'
# Contract Management System - Deployment Guide

## 🚀 Quick Start

1. **Start the system:**
   ```bash
   ./start-system.sh
   ```

2. **Stop the system:**
   ```bash
   ./stop-system.sh
   ```

3. **Check system status:**
   ```bash
   ./check-status.sh
   ```

## 🔧 Manual Service Management

### Start Services Manually:
```bash
# Start Docker services
run_compose "docker-compose.main.yml" up -d

# Start backend
cd backend && npm run dev &

# Start frontend
cd frontend && npm start &
```

### Stop Services Manually:
```bash
# Stop backend and frontend
pkill -f "node.*server.js"
pkill -f "react-scripts"

# Stop Docker services
run_compose "docker-compose.main.yml" down
```

## 📋 Service URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **Keycloak**: https://localhost:8443
- **PostgreSQL**: localhost:5432

## 🔐 Default Credentials

- **Keycloak Admin**: admin / ***REMOVED-KEYCLOAK_ADMIN_PASSWORD***
- **Database**: ***REMOVED-DB_PASSWORD*** / ***REMOVED-DB_PASSWORD***123

## 🛠️ Troubleshooting

### Check logs:
```bash
# Docker logs
docker logs ***REMOVED-KEYCLOAK_DB_PASSWORD***-cms
docker logs ***REMOVED-DB_PASSWORD***

# Application logs
tail -f backend/logs/app.log
```

### Restart services:
```bash
./stop-system.sh
sleep 5
./start-system.sh
```

## 📝 Configuration

Edit `config.env` to modify:
- Database settings
- Keycloak configuration
- Port numbers
- Security keys

## 🔄 Updates

To update the system:
```bash
git pull origin main
npm install
cd backend && npm install
cd ../frontend && npm install
./stop-system.sh
./start-system.sh
```
EOF

print_success "Deployment scripts created successfully"

# Final instructions
echo ""
echo "🎉 Deployment setup completed!"
echo "=============================="
echo ""
echo "Next steps:"
echo "1. Clone your repository to: $APP_DIR"
echo "2. Edit config.env with your settings"
echo "3. Run: ./start-system.sh"
echo ""
echo "Available commands:"
echo "- ./start-system.sh    - Start all services"
echo "- ./stop-system.sh     - Stop all services"
echo "- ./check-status.sh    - Check service status"
echo ""
echo "System will be available at:"
echo "- Frontend: http://localhost:3000"
echo "- Backend: http://localhost:5001"
echo "- Keycloak: https://localhost:8443"
echo ""
echo "⚠️  Important: Logout and login again for Docker group to take effect"
echo "⚠️  Remember to change default passwords in production"
echo ""
print_success "Deployment setup completed successfully!"
