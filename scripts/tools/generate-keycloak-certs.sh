#!/bin/bash


source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../lib/common.sh"
resolve_repo_root
# Generate Self-Signed SSL Certificates for Keycloak Development
# This script creates self-signed certificates for local development

set -e

echo "🔐 Generating Self-Signed SSL Certificates for Keycloak..."

# Create certificates directory
mkdir -p ***REMOVED-KEYCLOAK_DB_PASSWORD***-config

# Generate private key
echo "📝 Generating private key..."
openssl genrsa -out ***REMOVED-KEYCLOAK_DB_PASSWORD***-config/server.key 2048

# Generate certificate signing request
echo "📝 Generating certificate signing request..."
openssl req -new -key ***REMOVED-KEYCLOAK_DB_PASSWORD***-config/server.key -out ***REMOVED-KEYCLOAK_DB_PASSWORD***-config/server.csr -subj "/C=US/ST=CA/L=San Francisco/O=Contract Management/OU=Development/CN=localhost"

# Generate self-signed certificate
echo "📝 Generating self-signed certificate..."
openssl x509 -req -days 365 -in ***REMOVED-KEYCLOAK_DB_PASSWORD***-config/server.csr -signkey ***REMOVED-KEYCLOAK_DB_PASSWORD***-config/server.key -out ***REMOVED-KEYCLOAK_DB_PASSWORD***-config/server.crt

# Set proper permissions
chmod 600 ***REMOVED-KEYCLOAK_DB_PASSWORD***-config/server.key
chmod 644 ***REMOVED-KEYCLOAK_DB_PASSWORD***-config/server.crt

echo "✅ SSL certificates generated successfully!"
echo "📁 Certificate files created in ***REMOVED-KEYCLOAK_DB_PASSWORD***-config/"
echo "   - server.key (private key)"
echo "   - server.crt (certificate)"
echo "   - server.csr (certificate signing request - can be deleted)"

# Clean up CSR file
rm ***REMOVED-KEYCLOAK_DB_PASSWORD***-config/server.csr

echo "🔒 Note: These are self-signed certificates for development only."
echo "   In production, use proper certificates from a trusted CA."
