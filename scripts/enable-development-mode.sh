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
