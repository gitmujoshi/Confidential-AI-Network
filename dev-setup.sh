#!/bin/bash

# Development Environment Setup Script
# This script sets up the development environment for new team members

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}  $1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

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

print_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# Function to check system requirements
check_requirements() {
    print_header "Checking System Requirements"
    
    # Check OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        print_success "Linux detected"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        print_success "macOS detected"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        print_success "Windows detected"
    else
        print_warning "Unknown OS: $OSTYPE"
    fi
    
    # Check Docker
    if command -v docker >/dev/null 2>&1; then
        DOCKER_VERSION=$(docker --version)
        print_success "Docker found: $DOCKER_VERSION"
        
        if docker info >/dev/null 2>&1; then
            print_success "Docker is running"
        else
            print_error "Docker is not running. Please start Docker and try again."
            exit 1
        fi
    else
        print_error "Docker is not installed. Please install Docker and try again."
        exit 1
    fi
    
    # Check Docker Compose
    if command -v docker-compose >/dev/null 2>&1; then
        COMPOSE_VERSION=$(docker-compose --version)
        print_success "Docker Compose found: $COMPOSE_VERSION"
    else
        print_error "Docker Compose is not installed. Please install Docker Compose and try again."
        exit 1
    fi
    
    # Check Git
    if command -v git >/dev/null 2>&1; then
        GIT_VERSION=$(git --version)
        print_success "Git found: $GIT_VERSION"
    else
        print_error "Git is not installed. Please install Git and try again."
        exit 1
    fi
    
    # Check Node.js (optional, for local development)
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node --version)
        print_success "Node.js found: $NODE_VERSION"
    else
        print_warning "Node.js not found locally (will use containerized version)"
    fi
}

# Function to clone repository
clone_repository() {
    print_header "Setting Up Repository"
    
    if [ -d ".git" ]; then
        print_warning "Repository already exists, updating..."
        git pull origin main
    else
        print_step "Cloning repository..."
        # Replace with actual repository URL
        git clone https://github.com/your-username/ContractManagement.git .
    fi
    
    print_success "Repository setup completed"
}

# Function to create environment files
create_environment_files() {
    print_header "Creating Environment Files"
    
    # Backend environment
    if [ ! -f "backend/.env" ]; then
        print_step "Creating backend/.env..."
        cp config.env backend/.env
        print_success "Backend environment file created"
    else
        print_warning "Backend .env already exists"
    fi
    
    # Frontend environment
    if [ ! -f "frontend/.env" ]; then
        print_step "Creating frontend/.env..."
        cat > frontend/.env << EOF
REACT_APP_API_URL=http://localhost:5001
REACT_APP_KEYCLOAK_URL=\${KEYCLOAK_URL:-https://localhost:8443}
REACT_APP_KEYCLOAK_REALM=contract-management
REACT_APP_KEYCLOAK_CLIENT_ID=contract-management-frontend
CHOKIDAR_USEPOLLING=true
EOF
        print_success "Frontend environment file created"
    else
        print_warning "Frontend .env already exists"
    fi
    
    # Docker environment
    if [ ! -f ".env" ]; then
        print_step "Creating .env for Docker..."
        cat > .env << EOF
# Development Environment Variables
NODE_ENV=development
COMPOSE_PROJECT_NAME=contract-management-dev

# Database
POSTGRES_DB=contract_management
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Keycloak
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=admin123

# API
API_PORT=5001
FRONTEND_PORT=3000
KEYCLOAK_PORT=8080
EOF
        print_success "Docker environment file created"
    else
        print_warning "Docker .env already exists"
    fi
}

# Function to create necessary directories
create_directories() {
    print_header "Creating Directories"
    
    print_step "Creating necessary directories..."
    
    mkdir -p nginx/ssl
    mkdir -p logs
    mkdir -p data
    mkdir -p backend/logs
    mkdir -p frontend/logs
    
    print_success "Directories created"
}

# Function to setup Git hooks (optional)
setup_git_hooks() {
    print_header "Setting Up Git Hooks"
    
    if [ -d ".git/hooks" ]; then
        print_step "Creating pre-commit hook..."
        cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Pre-commit hook for Contract Management System

echo "Running pre-commit checks..."

# Check for TODO/FIXME comments
if git diff --cached --name-only | xargs grep -l "TODO\|FIXME" 2>/dev/null; then
    echo "Warning: Found TODO/FIXME comments in staged files"
fi

# Check for console.log statements
if git diff --cached --name-only | xargs grep -l "console\.log" 2>/dev/null; then
    echo "Warning: Found console.log statements in staged files"
fi

echo "Pre-commit checks completed"
EOF
        chmod +x .git/hooks/pre-commit
        print_success "Git hooks configured"
    else
        print_warning "Not a git repository, skipping git hooks"
    fi
}

# Function to create VS Code configuration
setup_vscode() {
    print_header "Setting Up VS Code Configuration"
    
    if [ -d ".vscode" ]; then
        print_warning "VS Code configuration already exists"
        return
    fi
    
    print_step "Creating VS Code configuration..."
    
    mkdir -p .vscode
    
    # VS Code settings
    cat > .vscode/settings.json << 'EOF'
{
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
    },
    "files.exclude": {
        "**/node_modules": true,
        "**/dist": true,
        "**/build": true
    },
    "typescript.preferences.importModuleSpecifier": "relative",
    "javascript.preferences.importModuleSpecifier": "relative"
}
EOF

    # VS Code extensions
    cat > .vscode/extensions.json << 'EOF'
{
    "recommendations": [
        "ms-vscode.vscode-typescript-next",
        "bradlc.vscode-tailwindcss",
        "esbenp.prettier-vscode",
        "ms-vscode.vscode-eslint",
        "ms-vscode.vscode-json",
        "redhat.vscode-yaml",
        "ms-azuretools.vscode-docker",
        "ms-vscode-remote.remote-containers"
    ]
}
EOF

    # VS Code launch configuration
    cat > .vscode/launch.json << 'EOF'
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Debug Backend",
            "type": "node",
            "request": "attach",
            "port": 9229,
            "restart": true,
            "localRoot": "${workspaceFolder}/backend",
            "remoteRoot": "/app"
        },
        {
            "name": "Debug Frontend",
            "type": "chrome",
            "request": "launch",
            "url": "http://localhost:3000",
            "webRoot": "${workspaceFolder}/frontend/src"
        }
    ]
}
EOF

    print_success "VS Code configuration created"
}

# Function to create development documentation
create_dev_docs() {
    print_header "Creating Development Documentation"
    
    cat > DEV_SETUP.md << 'EOF'
# Development Environment Setup

## Quick Start

1. **Prerequisites**
   - Docker and Docker Compose installed
   - Git installed
   - VS Code (recommended)

2. **Setup**
   ```bash
   ./dev-setup.sh
   ```

3. **Start Development Environment**
   ```bash
   ./dev-start.sh
   ```

4. **Access Services**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001
   - Keycloak: \${KEYCLOAK_URL:-https://localhost:8443}
   - Mailhog: http://localhost:8025

## Development Commands

### Start/Stop Services
```bash
# Start all services
./dev-start.sh

# Stop all services
./dev-start.sh stop

# View logs
./dev-start.sh logs [service-name]

# Restart service
./dev-start.sh restart [service-name]

# Access shell
./dev-start.sh shell [container-name]
```

### Database Operations
```bash
# Access database
docker exec -it postgres-app-dev psql -U postgres -d contract_management

# Run migrations
docker exec backend-dev node run-migrations.js

# Reset database
docker-compose -f docker-compose.dev.yml down -v
./dev-start.sh
```

### Keycloak Operations
```bash
# Access Keycloak admin
# URL: \${KEYCLOAK_URL:-https://localhost:8443}
# Username: admin
# Password: admin123

# Setup Keycloak
docker exec backend-dev node setup-keycloak-simple.js
```

## Project Structure

```
├── backend/                 # Backend API (Node.js/Express)
├── frontend/               # Frontend (React)
├── docker-compose.dev.yml  # Development environment
├── nginx/                  # Nginx configuration
├── dev-start.sh           # Development startup script
├── dev-setup.sh           # Development setup script
└── docs/                  # Documentation
```

## Troubleshooting

### Common Issues

1. **Port conflicts**
   - Ensure ports 3000, 5001, 8080, 5432, 5433 are available

2. **Docker issues**
   - Restart Docker Desktop
   - Run `docker system prune` to clean up

3. **Database connection issues**
   - Wait for services to fully start
   - Check logs: `docker-compose -f docker-compose.dev.yml logs postgres-app`

4. **Keycloak issues**
   - Wait for Keycloak to be ready
   - Check logs: `docker-compose -f docker-compose.dev.yml logs keycloak`

### Getting Help

- Check service logs: `./dev-start.sh logs`
- View service status: `./dev-start.sh status`
- Access dev tools: `./dev-start.sh shell dev-tools`
EOF

    print_success "Development documentation created: DEV_SETUP.md"
}

# Function to display final instructions
display_final_instructions() {
    print_header "Setup Complete!"
    
    echo -e "${GREEN}🎉 Development environment setup completed successfully!${NC}"
    echo ""
    echo -e "${CYAN}📋 Next Steps:${NC}"
    echo "1. Start the development environment:"
    echo "   ./dev-start.sh"
    echo ""
    echo "2. Access the application:"
    echo "   - Frontend: http://localhost:3000"
    echo "   - Backend API: http://localhost:5001"
    echo "   - Keycloak: \${KEYCLOAK_URL:-https://localhost:8443}"
    echo ""
    echo "3. Read the documentation:"
    echo "   cat DEV_SETUP.md"
    echo ""
    echo -e "${YELLOW}⚠️  Important Notes:${NC}"
    echo "- All services run in Docker containers"
    echo "- Code changes are automatically reflected (hot reload)"
    echo "- Database data persists between restarts"
    echo "- Use './dev-start.sh' for all development operations"
    echo ""
    echo -e "${GREEN}📚 Documentation:${NC}"
    echo "- DEV_SETUP.md - Development setup guide"
    echo "- README.md - Project overview"
    echo ""
}

# Main execution
main() {
    print_header "Contract Management System - Development Setup"
    
    # Setup steps
    check_requirements
    clone_repository
    create_environment_files
    create_directories
    setup_git_hooks
    setup_vscode
    create_dev_docs
    
    # Display final instructions
    display_final_instructions
}

# Run main function
main "$@"
