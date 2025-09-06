#!/bin/bash

# Stop Keycloak HTTPS Script

set -e

echo "🛑 Stopping Keycloak..."

cd "$(dirname "$0")/.."
docker-compose -f docker-compose.keycloak-https.yml down

echo "✅ Keycloak stopped"
