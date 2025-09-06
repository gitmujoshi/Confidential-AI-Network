#!/bin/bash

# =============================================================================
# CONFIGURATION CONSOLIDATION SCRIPT
# =============================================================================
# This script consolidates all configuration files into a single source of truth
# and removes redundant configurations to prevent mismatches
# =============================================================================

set -e

echo "🔧 Starting Configuration Consolidation..."

# Define the single source of truth
MAIN_CONFIG="config.env"
BACKUP_DIR="config-backups-$(date +%Y%m%d_%H%M%S)"

# Create backup directory
mkdir -p "$BACKUP_DIR"
echo "📁 Created backup directory: $BACKUP_DIR"

# Function to backup and remove redundant configs
backup_and_remove() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "📦 Backing up: $file"
        cp "$file" "$BACKUP_DIR/"
        echo "🗑️  Removing: $file"
        rm "$file"
    fi
}

# Function to create symlink to main config
create_symlink() {
    local target="$1"
    local link="$2"
    if [ -f "$target" ] && [ ! -L "$link" ]; then
        echo "🔗 Creating symlink: $link -> $target"
        ln -sf "$target" "$link"
    fi
}

echo "🔄 Step 1: Backing up and removing redundant configuration files..."

# Remove redundant root configs
backup_and_remove ".env"
backup_and_remove "config/system.env"

# Remove redundant backend configs
backup_and_remove "backend/.env"
backup_and_remove "backend/config.env"
backup_and_remove "backend/config.env.bak"
backup_and_remove "backend/.env.backup"

# Remove redundant frontend configs (if they exist)
backup_and_remove "frontend/.env"

echo "🔄 Step 2: Creating symlinks to main configuration..."

# Create symlinks to main config
create_symlink "../$MAIN_CONFIG" "backend/.env"
create_symlink "../$MAIN_CONFIG" "frontend/.env"

echo "🔄 Step 3: Updating scripts to use centralized config..."

# Update backend server.js to use the correct config path
if [ -f "backend/server.js" ]; then
    echo "📝 Updating backend/server.js configuration path..."
    sed -i.bak 's|require.*dotenv.*config.*path.*\.\./config\.env.*|require("dotenv").config({ path: "../config.env" });|' backend/server.js
    rm -f backend/server.js.bak
fi

echo "🔄 Step 4: Validating configuration..."

# Validate that main config exists and has required fields
if [ ! -f "$MAIN_CONFIG" ]; then
    echo "❌ Error: Main configuration file $MAIN_CONFIG not found!"
    exit 1
fi

# Check for required configuration fields
required_fields=("DB_HOST" "DB_PORT" "DB_NAME" "DB_USER" "DB_PASSWORD" "KEYCLOAK_URL" "BACKEND_PORT")
for field in "${required_fields[@]}"; do
    if ! grep -q "^$field=" "$MAIN_CONFIG"; then
        echo "⚠️  Warning: Required field $field not found in $MAIN_CONFIG"
    fi
done

echo "🔄 Step 5: Creating configuration validation script..."

# Create a configuration validation script
cat > scripts/validate-config.sh << 'EOF'
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
EOF

chmod +x scripts/validate-config.sh

echo "🔄 Step 6: Creating configuration documentation..."

# Create configuration documentation
cat > docs/CONFIGURATION_MANAGEMENT.md << 'EOF'
# Configuration Management

## Single Source of Truth

The Contract Management System uses a **single source of truth** for all configuration:

- **Main Configuration**: `config.env` (root directory)
- **All services**: Use symlinks to this main configuration
- **No duplicates**: All redundant configuration files are removed

## Configuration Structure

```
config.env                    # Main configuration (SINGLE SOURCE OF TRUTH)
├── backend/.env              # Symlink to config.env
├── frontend/.env             # Symlink to config.env
└── config-backups-*/         # Backup directory for removed configs
```

## Required Configuration Fields

- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `KEYCLOAK_URL` - Keycloak URL
- `BACKEND_PORT` - Backend port

## Validation

Run configuration validation:
```bash
./scripts/validate-config.sh
```

## Adding New Configuration

1. Add new fields to `config.env`
2. Update validation script if needed
3. Update this documentation
4. Test with validation script

## Troubleshooting

If you encounter configuration issues:

1. Run `./scripts/validate-config.sh`
2. Check that all services use symlinks to `config.env`
3. Verify no duplicate configuration files exist
4. Check backup directory for previous configurations
EOF

echo "✅ Configuration consolidation complete!"
echo ""
echo "📋 Summary:"
echo "  - Main configuration: $MAIN_CONFIG"
echo "  - Backups created in: $BACKUP_DIR"
echo "  - Validation script: scripts/validate-config.sh"
echo "  - Documentation: docs/CONFIGURATION_MANAGEMENT.md"
echo ""
echo "🔍 Next steps:"
echo "  1. Run: ./scripts/validate-config.sh"
echo "  2. Test the system: ./deployment/test-basic-apis-simple.sh"
echo "  3. Review documentation: docs/CONFIGURATION_MANAGEMENT.md"
