# Migration Scripts

This directory contains database migration and schema update scripts.

## Categories
- **Schema Updates**: Database structure changes
- **Data Migrations**: Data transformation scripts
- **IAM Updates**: Identity and access management changes
- **Keycloak Fixes**: Authentication system updates

## Usage
Run migrations from the backend directory:
```bash
node scripts/migration/[migration-name].js
```

⚠️ **Warning**: Always backup your database before running migrations!
