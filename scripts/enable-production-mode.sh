#!/bin/bash
# Enable Production Mode - Make files read-only for production

echo "🔒 Enabling production mode - making files read-only..."

# Core configuration files
chmod 444 config.env secrets.env

# Core system files - keep executable for script manager
chmod 755 start-system.sh stop-system.sh

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
