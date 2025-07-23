# Migration & Setup Guide

## Baseline
- **Baseline Tag:** `v1.0.0`
- This baseline represents the first stable, working version of the Contract Management System.
- All database tables, Keycloak configuration, and blockchain contracts are assumed to be in sync with this tag.

## Database Setup
- All Sequelize models as of `v1.0.0` are considered the baseline schema.
- Use Sequelize migrations for all schema changes after this point.
- To initialize the database from scratch:
  1. Clone the repository and checkout `v1.0.0` (or latest tag).
  2. Configure your database connection in `backend/config.env`.
  3. Run all migrations:
     ```sh
     npx sequelize-cli db:migrate
     ```

## Keycloak Setup
- Keycloak realm and client configuration is stored in:
  - `deployment/keycloak-config/keycloak-config.json`
  - `deployment/keycloak-config/realm-export.json`
- To set up Keycloak:
  1. Import the realm using the above files.
  2. Sync users using backend scripts (see `backend/setup-keycloak.js`).

## Blockchain Setup
- Smart contracts are deployed using Hardhat scripts:
  - `blockchain/scripts/deploy.js`
- To set up the blockchain environment:
  1. Start Hardhat node (see `deployment/local/start-services.sh`).
  2. Deploy contracts:
     ```sh
     cd blockchain
     npx hardhat run scripts/deploy.js --network localhost
     ```

## Migration Workflow
- For any schema/config changes after `v1.0.0`, create a new migration using:
  ```sh
  npx sequelize-cli migration:generate --name <migration-name>
  ```
- Apply migrations with:
  ```sh
  npx sequelize-cli db:migrate
  ```

---

**Note:** Never use `sequelize.sync()` in production. Always use migrations for schema changes after the baseline. 