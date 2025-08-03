#!/bin/bash

# Vault Development Setup Script
echo "🔧 Setting up HashiCorp Vault for development..."

# Set environment variables
export VAULT_ADDR='http://localhost:8200'
export VAULT_TOKEN='dev-token-12345'

# Check if Vault is already running
if curl -s http://localhost:8200/v1/sys/health > /dev/null 2>&1; then
    echo "✅ Vault is already running"
else
    echo "🚀 Starting Vault development server..."
    # Start Vault in background
    ./vault server -dev -dev-root-token-id="dev-token-12345" > vault.log 2>&1 &
    VAULT_PID=$!
    echo "Vault started with PID: $VAULT_PID"
    
    # Wait for Vault to start
    echo "⏳ Waiting for Vault to start..."
    for i in {1..30}; do
        if curl -s http://localhost:8200/v1/sys/health > /dev/null 2>&1; then
            echo "✅ Vault is ready!"
            break
        fi
        sleep 1
    done
fi

# Test Vault connection
echo "🧪 Testing Vault connection..."
./vault status

# Enable secrets engine
echo "🔐 Enabling secrets engine..."
./vault secrets enable -path=secret kv

# Create test secret
echo "📝 Creating test secret..."
./vault kv put secret/test key1=value1 key2=value2

# List secrets
echo "📋 Listing secrets..."
./vault kv list secret/

echo "🎉 Vault development environment is ready!"
echo "   - Address: http://localhost:8200"
echo "   - Token: dev-token-12345"
echo "   - UI: http://localhost:8200/ui" 