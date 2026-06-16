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
