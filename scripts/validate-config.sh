#!/bin/bash

# Configuration validation script
MAIN_CONFIG="config.env"

echo "🔍 Validating configuration..."

if [ ! -f "$MAIN_CONFIG" ]; then
    echo "❌ Error: Main configuration file $MAIN_CONFIG not found!"
    exit 1
fi

# Check for required fields
required_fields=("DB_HOST" "DB_PORT" "DB_NAME" "DB_USER" "DB_PASSWORD" "KEYCLOAK_URL" "BACKEND_PORT")
missing_fields=()

for field in "${required_fields[@]}"; do
    if ! grep -q "^$field=" "$MAIN_CONFIG"; then
        missing_fields+=("$field")
    fi
done

if [ ${#missing_fields[@]} -eq 0 ]; then
    echo "✅ All required configuration fields are present"
else
    echo "❌ Missing required fields: ${missing_fields[*]}"
    exit 1
fi

# Check for duplicate configurations
echo "🔍 Checking for duplicate configuration files..."
duplicate_files=()

for file in .env backend/.env frontend/.env config/system.env; do
    if [ -f "$file" ] && [ ! -L "$file" ]; then
        duplicate_files+=("$file")
    fi
done

if [ ${#duplicate_files[@]} -eq 0 ]; then
    echo "✅ No duplicate configuration files found"
else
    echo "⚠️  Found duplicate configuration files: ${duplicate_files[*]}"
    echo "   These should be symlinks to $MAIN_CONFIG"
fi

echo "✅ Configuration validation complete"
