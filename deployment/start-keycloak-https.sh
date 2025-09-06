#!/bin/bash

# Start Keycloak HTTPS Script

set -e

echo "🚀 Starting Keycloak with HTTPS..."

cd "$(dirname "$0")/.."
docker-compose -f docker-compose.***REMOVED-KEYCLOAK_DB_PASSWORD***-https.yml up -d

echo "⏳ Waiting for Keycloak to be ready..."
sleep 15

if curl -k -s "https://localhost:8443/health" >/dev/null 2>&1; then
    echo "✅ Keycloak HTTPS is running"
    echo "🔗 Admin Console: https://localhost:8443/admin (admin/***REMOVED-KEYCLOAK_ADMIN_PASSWORD***)"
else
    echo "❌ Keycloak failed to start"
    exit 1
fi
