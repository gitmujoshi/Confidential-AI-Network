#!/bin/bash

# Generate SSL certificates for Keycloak
# This script creates self-signed certificates for development purposes

set -e

CERT_DIR="./deployment/keycloak-certs"
KEYCLOAK_CONF_DIR="./deployment/keycloak-config"

echo "🔐 Generating SSL certificates for Keycloak..."

# Create directories if they don't exist
mkdir -p "$CERT_DIR"
mkdir -p "$KEYCLOAK_CONF_DIR"

# Generate private key
echo "📝 Generating private key..."
openssl genrsa -out "$CERT_DIR/key.pem" 2048

# Generate certificate signing request
echo "📝 Generating certificate signing request..."
openssl req -new -key "$CERT_DIR/key.pem" -out "$CERT_DIR/cert.csr" -subj "/C=US/ST=CA/L=San Francisco/O=Contract Management/OU=Development/CN=localhost"

# Generate self-signed certificate
echo "📝 Generating self-signed certificate..."
openssl x509 -req -in "$CERT_DIR/cert.csr" -signkey "$CERT_DIR/key.pem" -out "$CERT_DIR/cert.pem" -days 365

# Set proper permissions
chmod 600 "$CERT_DIR/key.pem"
chmod 644 "$CERT_DIR/cert.pem"

# Clean up CSR
rm "$CERT_DIR/cert.csr"

echo "✅ SSL certificates generated successfully!"
echo "📁 Certificate files:"
echo "   - Private Key: $CERT_DIR/key.pem"
echo "   - Certificate: $CERT_DIR/cert.pem"
echo ""
echo "🔒 Note: These are self-signed certificates for development only."
echo "   For production, use proper CA-signed certificates."
echo ""
echo "🚀 You can now restart Keycloak with:"
echo "   docker-compose -f docker-compose.main.yml restart keycloak"
