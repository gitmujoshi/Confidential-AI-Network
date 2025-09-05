# Configuration Management - Quick Reference

## 🎯 **Single Source of Truth**

**Main Configuration**: `config.env` (root directory)
- All services use symlinks to this file
- No duplicate configuration files allowed
- All changes must be made to this file only

## 🔧 **Management Commands**

```bash
# Check configuration status
./scripts/config-manager.sh status

# Validate configuration
./scripts/config-manager.sh validate

# Fix configuration issues
./scripts/config-manager.sh fix

# Create backup
./scripts/config-manager.sh backup

# Restore from backup
./scripts/config-manager.sh restore
```

## 🚨 **Preventing Configuration Issues**

### ✅ **DO:**
- Always edit `config.env` only
- Run validation after changes: `./scripts/config-manager.sh validate`
- Create backups before major changes: `./scripts/config-manager.sh backup`
- Use the configuration manager for all operations

### ❌ **DON'T:**
- Create duplicate `.env` files
- Edit configuration files in subdirectories directly
- Copy configuration files between directories
- Ignore validation warnings

## 🔍 **Troubleshooting**

### Issue: "Configuration mismatch"
```bash
./scripts/config-manager.sh check
./scripts/config-manager.sh fix
```

### Issue: "Database connection failed"
```bash
./scripts/config-manager.sh validate
# Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD in config.env
```

### Issue: "Missing configuration"
```bash
./scripts/config-manager.sh status
# Verify symlinks are correct
```

## 📁 **File Structure**

```
config.env                    # ← SINGLE SOURCE OF TRUTH
├── backend/.env              # → Symlink to config.env
├── frontend/.env             # → Symlink to config.env
└── config-backups/           # → Backup directory
```

## 🔄 **Development Workflow**

1. **Before making changes:**
   ```bash
   ./scripts/config-manager.sh backup
   ```

2. **Make changes to `config.env` only**

3. **Validate changes:**
   ```bash
   ./scripts/config-manager.sh validate
   ```

4. **Test the system:**
   ```bash
   ./deployment/test-basic-apis-simple.sh
   ```

## 📞 **Emergency Recovery**

If configuration is corrupted:

```bash
# List available backups
ls config-backups/

# Restore from backup
./scripts/config-manager.sh restore

# Validate restoration
./scripts/config-manager.sh validate
```

---

**Remember**: The configuration issue we just fixed was caused by having multiple configuration files with different settings. This new system prevents that from happening again!
