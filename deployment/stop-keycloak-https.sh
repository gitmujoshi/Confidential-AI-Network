#!/bin/bash

# Stop Keycloak HTTPS Script

set -e

echo "🛑 Stopping Keycloak..."

cd "$(dirname "$0")/.."
docker-compose -f docker-compose.***REMOVED-KEYCLOAK_DB_PASSWORD***-https.yml down

echo "✅ Keycloak stopped"
