#!/bin/bash

# Generate Self-Signed SSL Certificates for Keycloak Development
# This script creates self-signed certificates for local development

set -e

echo "🔐 Generating Self-Signed SSL Certificates for Keycloak..."

# Create certificates directory
mkdir -p keycloak-config

# Generate private key
echo "📝 Generating private key..."
openssl genrsa -out keycloak-config/server.key 2048

# Generate certificate signing request
echo "📝 Generating certificate signing request..."
openssl req -new -key keycloak-config/server.key -out keycloak-config/server.csr -subj "/C=US/ST=CA/L=San Francisco/O=Contract Management/OU=Development/CN=localhost"

# Generate self-signed certificate
echo "📝 Generating self-signed certificate..."
openssl x509 -req -days 365 -in keycloak-config/server.csr -signkey keycloak-config/server.key -out keycloak-config/server.crt

# Set proper permissions
chmod 600 keycloak-config/server.key
chmod 644 keycloak-config/server.crt

echo "✅ SSL certificates generated successfully!"
echo "📁 Certificate files created in keycloak-config/"
echo "   - server.key (private key)"
echo "   - server.crt (certificate)"
echo "   - server.csr (certificate signing request - can be deleted)"

# Clean up CSR file
rm keycloak-config/server.csr

echo "🔒 Note: These are self-signed certificates for development only."
echo "   In production, use proper certificates from a trusted CA."
