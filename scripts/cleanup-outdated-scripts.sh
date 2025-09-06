#!/bin/bash

# Cleanup Outdated Scripts
# This script removes outdated scripts and keeps only the current, recommended ones

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

echo "🧹 Cleaning Up Outdated Scripts"
echo "==============================="
echo ""

# List of outdated scripts to remove
OUTDATED_SCRIPTS=(
    "setup-fresh-system.sh"
    "setup-linux.sh"
    "clean-start.sh"
    "clean-stop.sh"
    "deploy-ubuntu.sh"
    "cleanup-old-scripts.sh"
    "check-user-sync.js"
    "create-test-users.js"
    "generate-keycloak-certs.sh"
    "generate-private-key.js"
    "test-es256-signing.js"
    "test-ui-scitt-ccf.sh"
)

# List of outdated Docker Compose files to remove
OUTDATED_DOCKER_COMPOSE=(
    "docker-compose.dev.yml"
    "docker-compose.fresh-setup.yml"
    "docker-compose.https.yml"
    "docker-compose.keycloak-https.yml"
    "docker-compose.keycloak-persistent.yml"
    "docker-compose.backend.yml"
    "docker-compose.test.yml"
    "docker-compose.scitt-ccf-isolated.yml"
)

# List of outdated backend scripts to remove
OUTDATED_BACKEND_SCRIPTS=(
    "backend/setup-keycloak-simple.js"
    "backend/fix-keycloak-client.js"
    "backend/list-keycloak-users.js"
    "backend/get-client-secret.js"
    "backend/sync-appadmin-from-keycloak.js"
)

# Function to check if file exists and remove it
remove_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        print_status "Removing $description: $file"
        rm "$file"
        print_success "Removed: $file"
        return 0
    else
        print_warning "File not found: $file"
        return 1
    fi
}

# Function to backup file before removal
backup_file() {
    local file=$1
    local backup_dir="backup/outdated-scripts"
    
    if [ -f "$file" ]; then
        mkdir -p "$backup_dir"
        local backup_path="$backup_dir/$(basename "$file")"
        cp "$file" "$backup_path"
        print_status "Backed up to: $backup_path"
    fi
}

# Main cleanup function
cleanup_outdated_scripts() {
    print_status "Cleaning up outdated scripts..."
    echo ""
    
    local removed_count=0
    local total_count=0
    
    # Remove outdated scripts
    for script in "${OUTDATED_SCRIPTS[@]}"; do
        total_count=$((total_count + 1))
        if remove_file "$script" "outdated script"; then
            removed_count=$((removed_count + 1))
        fi
    done
    
    echo ""
    print_success "Removed $removed_count out of $total_count outdated scripts"
}

# Cleanup outdated Docker Compose files
cleanup_outdated_docker_compose() {
    print_status "Cleaning up outdated Docker Compose files..."
    echo ""
    
    local removed_count=0
    local total_count=0
    
    for compose_file in "${OUTDATED_DOCKER_COMPOSE[@]}"; do
        total_count=$((total_count + 1))
        if remove_file "$compose_file" "outdated Docker Compose file"; then
            removed_count=$((removed_count + 1))
        fi
    done
    
    echo ""
    print_success "Removed $removed_count out of $total_count outdated Docker Compose files"
}

# Cleanup outdated backend scripts
cleanup_outdated_backend_scripts() {
    print_status "Cleaning up outdated backend scripts..."
    echo ""
    
    local removed_count=0
    local total_count=0
    
    for backend_script in "${OUTDATED_BACKEND_SCRIPTS[@]}"; do
        total_count=$((total_count + 1))
        if remove_file "$backend_script" "outdated backend script"; then
            removed_count=$((removed_count + 1))
        fi
    done
    
    echo ""
    print_success "Removed $removed_count out of $total_count outdated backend scripts"
}

# Function to show current recommended scripts
show_current_scripts() {
    print_status "Current recommended scripts:"
    echo ""
    
    echo "🚀 System Management:"
    echo "  ./start-system.sh                    # Main system startup"
    echo "  ./manage-services.sh                 # Service management"
    echo "  ./manage-scitt-ccf.sh               # SCITT CCF management"
    echo "  ./stop-system.sh                    # System shutdown"
    echo ""
    
    echo "🔧 Configuration & Fixes:"
    echo "  ./scripts/config-loader.js           # Centralized configuration"
    echo "  ./scripts/fix-auth-unified.sh       # Unified authentication fix"
    echo "  ./scripts/fix-ssl-inconsistencies.sh # SSL configuration fix"
    echo ""
    
    echo "🛠️ Development:"
    echo "  ./dev-setup.sh                      # Development environment setup"
    echo "  ./build-system.sh                   # Build system"
    echo ""
    
    echo "🐳 Docker Compose:"
    echo "  docker-compose.keycloak-dev.yml     # Keycloak development"
    echo "  docker-compose.scitt-ccf-dev.yml    # SCITT CCF development"
    echo "  docker-compose.main.yml             # Production setup"
    echo ""
    
    echo "📦 NPM Scripts:"
    echo "  npm run start                       # Start backend"
    echo "  npm run setup                       # Setup Keycloak and sync users"
    echo "  npm run test:login                  # Test authentication"
    echo "  npm run status                      # Check service status"
    echo ""
}

# Function to create cleanup summary
create_cleanup_summary() {
    local summary_file="CLEANUP_SUMMARY.md"
    
    cat > "$summary_file" << EOF
# 🧹 Script Cleanup Summary

## 📅 Cleanup Date
$(date)

## 🗑️ Removed Files

### Outdated Scripts
EOF

    for script in "${OUTDATED_SCRIPTS[@]}"; do
        if [ ! -f "$script" ]; then
            echo "- ✅ $script" >> "$summary_file"
        else
            echo "- ❌ $script (still exists)" >> "$summary_file"
        fi
    done

    cat >> "$summary_file" << EOF

### Outdated Docker Compose Files
EOF

    for compose_file in "${OUTDATED_DOCKER_COMPOSE[@]}"; do
        if [ ! -f "$compose_file" ]; then
            echo "- ✅ $compose_file" >> "$summary_file"
        else
            echo "- ❌ $compose_file (still exists)" >> "$summary_file"
        fi
    done

    cat >> "$summary_file" << EOF

### Outdated Backend Scripts
EOF

    for backend_script in "${OUTDATED_BACKEND_SCRIPTS[@]}"; do
        if [ ! -f "$backend_script" ]; then
            echo "- ✅ $backend_script" >> "$summary_file"
        else
            echo "- ❌ $backend_script (still exists)" >> "$summary_file"
        fi
    done

    cat >> "$summary_file" << EOF

## ✅ Current Recommended Scripts

### System Management
- \`./start-system.sh\` - Main system startup
- \`./manage-services.sh\` - Service management
- \`./manage-scitt-ccf.sh\` - SCITT CCF management
- \`./stop-system.sh\` - System shutdown

### Configuration & Fixes
- \`./scripts/config-loader.js\` - Centralized configuration
- \`./scripts/fix-auth-unified.sh\` - Unified authentication fix
- \`./scripts/fix-ssl-inconsistencies.sh\` - SSL configuration fix

### Development
- \`./dev-setup.sh\` - Development environment setup
- \`./build-system.sh\` - Build system

### Docker Compose
- \`docker-compose.keycloak-dev.yml\` - Keycloak development
- \`docker-compose.scitt-ccf-dev.yml\` - SCITT CCF development
- \`docker-compose.main.yml\` - Production setup

### NPM Scripts
- \`npm run start\` - Start backend
- \`npm run setup\` - Setup Keycloak and sync users
- \`npm run test:login\` - Test authentication
- \`npm run status\` - Check service status

## 📋 Next Steps

1. Test the current workflow with recommended scripts
2. Update documentation to reflect current scripts
3. Train team members on new script usage
4. Remove this summary file after verification

EOF

    print_success "Cleanup summary created: $summary_file"
}

# Main function
main() {
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
    
    # Ask for confirmation
    print_warning "This will remove outdated scripts and files."
    print_warning "A backup will be created in backup/outdated-scripts/"
    echo ""
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Operation cancelled"
        exit 0
    fi
    
    # Create backup directory
    mkdir -p backup/outdated-scripts
    
    # Perform cleanup
    cleanup_outdated_scripts
    cleanup_outdated_docker_compose
    cleanup_outdated_backend_scripts
    
    # Show current scripts
    echo ""
    show_current_scripts
    
    # Create cleanup summary
    create_cleanup_summary
    
    echo ""
    print_success "Cleanup completed!"
    print_status "Backup files created in: backup/outdated-scripts/"
    print_status "Cleanup summary: CLEANUP_SUMMARY.md"
    echo ""
    print_status "Next steps:"
    print_status "  1. Test the system with current scripts"
    print_status "  2. Update documentation"
    print_status "  3. Train team members on new workflow"
}

# Run main function
main "$@"
