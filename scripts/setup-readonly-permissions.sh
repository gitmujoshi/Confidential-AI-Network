#!/bin/bash

# Setup Read-Only Permissions Script
# This script sets up proper file permissions for production-ready development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${2}${1}${NC}"
}

print_status "🔒 Setting up read-only permissions for production files..." $BLUE

# Core configuration files - READ-ONLY
print_status "📋 Setting core configuration files to read-only..." $YELLOW
chmod 444 config.env secrets.env
chmod 444 CONFIGURATION_QUICK_REFERENCE.md QUICK_SCRIPT_REFERENCE.md SCRIPT_CONSOLIDATION_SUMMARY.md

# Script files - EXECUTABLE but not writable by others
print_status "🔧 Setting script files to executable..." $YELLOW
chmod 755 scripts/load-config.sh scripts/script-manager.sh
chmod 755 scripts/test-*.sh scripts/create-test-data*.sh
chmod 644 scripts/load-config.js scripts/create-test-data*.js scripts/test-data-common*.js

# Core system files - READ-ONLY
print_status "⚙️ Setting core system files to read-only..." $YELLOW
chmod 444 start-system.sh stop-system.sh

# Backend service files - READ-ONLY
print_status "🔧 Setting backend service files to read-only..." $YELLOW
chmod 444 backend/services/keycloakService.js backend/services/scittCcfService.js
chmod 444 backend/server.js

# Frontend service files - READ-ONLY
print_status "🎨 Setting frontend service files to read-only..." $YELLOW
chmod 444 frontend/src/services/api.js

# Docker Compose files - READ-ONLY
print_status "🐳 Setting Docker Compose files to read-only..." $YELLOW
chmod 444 docker-compose*.yml

# Documentation files - READ-ONLY
print_status "📚 Setting documentation files to read-only..." $YELLOW
find docs/ -name "*.md" -exec chmod 444 {} \;
find . -name "*.md" -not -path "./node_modules/*" -not -path "./.git/*" -exec chmod 444 {} \;

# Create a script to make files writable for development
print_status "🛠️ Creating development mode script..." $YELLOW
cat > scripts/enable-development-mode.sh << 'EOF'
#!/bin/bash
# Enable Development Mode - Make files writable for development

echo "🔓 Enabling development mode - making files writable..."

# Core configuration files
chmod 644 config.env secrets.env

# Core system files
chmod 755 start-system.sh stop-system.sh

# Script files
chmod 755 scripts/*.sh
chmod 644 scripts/*.js

# Backend service files
chmod 644 backend/services/*.js backend/server.js

# Frontend service files
chmod 644 frontend/src/services/*.js

# Docker Compose files
chmod 644 docker-compose*.yml

# Documentation files
find docs/ -name "*.md" -exec chmod 644 {} \;
find . -name "*.md" -not -path "./node_modules/*" -not -path "./.git/*" -exec chmod 644 {} \;

echo "✅ Development mode enabled - files are now writable"
EOF

chmod 755 scripts/enable-development-mode.sh

# Create a script to make files read-only for production
print_status "🔒 Creating production mode script..." $YELLOW
cat > scripts/enable-production-mode.sh << 'EOF'
#!/bin/bash
# Enable Production Mode - Make files read-only for production

echo "🔒 Enabling production mode - making files read-only..."

# Core configuration files
chmod 444 config.env secrets.env

# Core system files
chmod 444 start-system.sh stop-system.sh

# Script files
chmod 755 scripts/*.sh
chmod 644 scripts/*.js

# Backend service files
chmod 444 backend/services/*.js backend/server.js

# Frontend service files
chmod 444 frontend/src/services/*.js

# Docker Compose files
chmod 444 docker-compose*.yml

# Documentation files
find docs/ -name "*.md" -exec chmod 444 {} \;
find . -name "*.md" -not -path "./node_modules/*" -not -path "./.git/*" -exec chmod 444 {} \;

echo "✅ Production mode enabled - files are now read-only"
EOF

chmod 755 scripts/enable-production-mode.sh

print_status "✅ Read-only permissions setup completed!" $GREEN
print_status "" $NC
print_status "📋 Usage:" $BLUE
print_status "  Development: ./scripts/enable-development-mode.sh" $YELLOW
print_status "  Production:  ./scripts/enable-production-mode.sh" $YELLOW
print_status "" $NC
print_status "🔒 Files are now in production mode (read-only)" $GREEN
