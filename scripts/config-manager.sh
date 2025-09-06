#!/bin/bash

# =============================================================================
# CONFIGURATION MANAGER
# =============================================================================
# This script provides utilities for managing the centralized configuration
# and prevents configuration mismatches
# =============================================================================

set -e

MAIN_CONFIG="config.env"
BACKUP_DIR="config-backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to show help
show_help() {
    echo "Configuration Manager for Contract Management System"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  validate     - Validate current configuration"
    echo "  backup       - Create backup of current configuration"
    echo "  restore      - Restore from backup"
    echo "  check        - Check for configuration issues"
    echo "  fix          - Fix common configuration issues"
    echo "  status       - Show configuration status"
    echo "  help         - Show this help message"
    echo ""
}

# Function to validate configuration
validate_config() {
    print_status $BLUE "🔍 Validating configuration..."
    
    if [ ! -f "$MAIN_CONFIG" ]; then
        print_status $RED "❌ Error: Main configuration file $MAIN_CONFIG not found!"
        return 1
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
        print_status $GREEN "✅ All required configuration fields are present"
    else
        print_status $RED "❌ Missing required fields: ${missing_fields[*]}"
        return 1
    fi
    
    # Check for duplicate configurations
    print_status $BLUE "🔍 Checking for duplicate configuration files..."
    duplicate_files=()
    
    for file in .env backend/.env frontend/.env config/system.env; do
        if [ -f "$file" ] && [ ! -L "$file" ]; then
            duplicate_files+=("$file")
        fi
    done
    
    if [ ${#duplicate_files[@]} -eq 0 ]; then
        print_status $GREEN "✅ No duplicate configuration files found"
    else
        print_status $YELLOW "⚠️  Found duplicate configuration files: ${duplicate_files[*]}"
        print_status $YELLOW "   These should be symlinks to $MAIN_CONFIG"
        return 1
    fi
    
    # Check symlinks
    print_status $BLUE "🔍 Checking configuration symlinks..."
    symlink_issues=()
    
    if [ ! -L "backend/.env" ]; then
        symlink_issues+=("backend/.env")
    fi
    
    if [ ! -L "frontend/.env" ]; then
        symlink_issues+=("frontend/.env")
    fi
    
    if [ ${#symlink_issues[@]} -eq 0 ]; then
        print_status $GREEN "✅ All configuration symlinks are correct"
    else
        print_status $YELLOW "⚠️  Missing or incorrect symlinks: ${symlink_issues[*]}"
        return 1
    fi
    
    print_status $GREEN "✅ Configuration validation complete"
    return 0
}

# Function to create backup
backup_config() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/config-backup-$timestamp.env"
    
    print_status $BLUE "📦 Creating configuration backup..."
    
    mkdir -p "$BACKUP_DIR"
    cp "$MAIN_CONFIG" "$backup_file"
    
    print_status $GREEN "✅ Backup created: $backup_file"
}

# Function to restore from backup
restore_config() {
    print_status $BLUE "🔄 Available backups:"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        print_status $RED "❌ No backup directory found"
        return 1
    fi
    
    local backups=($(ls -t "$BACKUP_DIR"/config-backup-*.env 2>/dev/null))
    
    if [ ${#backups[@]} -eq 0 ]; then
        print_status $RED "❌ No backups found"
        return 1
    fi
    
    for i in "${!backups[@]}"; do
        echo "  $((i+1)). ${backups[$i]}"
    done
    
    echo ""
    read -p "Select backup to restore (1-${#backups[@]}): " choice
    
    if [[ "$choice" =~ ^[0-9]+$ ]] && [ "$choice" -ge 1 ] && [ "$choice" -le ${#backups[@]} ]; then
        local selected_backup="${backups[$((choice-1))]}"
        print_status $BLUE "🔄 Restoring from: $selected_backup"
        
        backup_config  # Create backup before restoring
        cp "$selected_backup" "$MAIN_CONFIG"
        
        print_status $GREEN "✅ Configuration restored from backup"
    else
        print_status $RED "❌ Invalid selection"
        return 1
    fi
}

# Function to check for issues
check_config() {
    print_status $BLUE "🔍 Checking for configuration issues..."
    
    local issues=0
    
    # Check if main config exists
    if [ ! -f "$MAIN_CONFIG" ]; then
        print_status $RED "❌ Main configuration file missing"
        ((issues++))
    fi
    
    # Check for duplicate files
    for file in .env backend/.env frontend/.env config/system.env; do
        if [ -f "$file" ] && [ ! -L "$file" ]; then
            print_status $YELLOW "⚠️  Duplicate configuration file: $file"
            ((issues++))
        fi
    done
    
    # Check symlinks
    for link in backend/.env frontend/.env; do
        if [ ! -L "$link" ]; then
            print_status $YELLOW "⚠️  Missing symlink: $link"
            ((issues++))
        fi
    done
    
    if [ $issues -eq 0 ]; then
        print_status $GREEN "✅ No configuration issues found"
    else
        print_status $YELLOW "⚠️  Found $issues configuration issue(s)"
    fi
    
    return $issues
}

# Function to fix common issues
fix_config() {
    print_status $BLUE "🔧 Fixing configuration issues..."
    
    # Create missing symlinks
    if [ ! -L "backend/.env" ]; then
        print_status $BLUE "🔗 Creating backend/.env symlink"
        ln -sf "../$MAIN_CONFIG" "backend/.env"
    fi
    
    if [ ! -L "frontend/.env" ]; then
        print_status $BLUE "🔗 Creating frontend/.env symlink"
        ln -sf "../$MAIN_CONFIG" "frontend/.env"
    fi
    
    # Remove duplicate files
    for file in .env config/system.env; do
        if [ -f "$file" ] && [ ! -L "$file" ]; then
            print_status $BLUE "🗑️  Removing duplicate file: $file"
            backup_config
            rm "$file"
        fi
    done
    
    print_status $GREEN "✅ Configuration issues fixed"
}

# Function to show status
show_status() {
    print_status $BLUE "📊 Configuration Status"
    echo ""
    
    # Main config
    if [ -f "$MAIN_CONFIG" ]; then
        print_status $GREEN "✅ Main configuration: $MAIN_CONFIG"
        echo "   Size: $(wc -l < "$MAIN_CONFIG") lines"
        echo "   Modified: $(stat -f "%Sm" "$MAIN_CONFIG")"
    else
        print_status $RED "❌ Main configuration: $MAIN_CONFIG (missing)"
    fi
    
    echo ""
    
    # Symlinks
    print_status $BLUE "🔗 Configuration Symlinks:"
    for link in backend/.env frontend/.env; do
        if [ -L "$link" ]; then
            local target=$(readlink "$link")
            print_status $GREEN "✅ $link -> $target"
        else
            print_status $RED "❌ $link (missing or not a symlink)"
        fi
    done
    
    echo ""
    
    # Duplicates
    print_status $BLUE "🔍 Duplicate Files:"
    local duplicates=0
    for file in .env backend/.env frontend/.env config/system.env; do
        if [ -f "$file" ] && [ ! -L "$file" ]; then
            print_status $YELLOW "⚠️  $file (duplicate)"
            ((duplicates++))
        fi
    done
    
    if [ $duplicates -eq 0 ]; then
        print_status $GREEN "✅ No duplicate configuration files"
    fi
    
    echo ""
    
    # Backups
    if [ -d "$BACKUP_DIR" ]; then
        local backup_count=$(ls -1 "$BACKUP_DIR"/config-backup-*.env 2>/dev/null | wc -l)
        print_status $BLUE "📦 Backups: $backup_count available"
    else
        print_status $YELLOW "⚠️  No backup directory found"
    fi
}

# Main script logic
case "${1:-help}" in
    validate)
        validate_config
        ;;
    backup)
        backup_config
        ;;
    restore)
        restore_config
        ;;
    check)
        check_config
        ;;
    fix)
        fix_config
        ;;
    status)
        show_status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_status $RED "❌ Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
