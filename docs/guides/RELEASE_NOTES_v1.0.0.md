# 🚀 Baseline Release v1.0.0

This release marks the **first stable, production-ready baseline** for the Contract Management System. It includes all core features, infrastructure, and documentation required to set up, run, and extend the platform.

---

## 🎯 **What's Included**

### **Database**
- All Sequelize models for users, contracts, datasets, and notifications.
- **Baseline migration script:**  
  - `migrations/20250723-initial-baseline.js`  
  - Enables reproducible database setup for all environments.
- **Migration workflow documentation:**  
  - `migrations/README.md`

### **Keycloak (IAM)**
- **Realm export and configuration:**  
  - `deployment/***REMOVED-KEYCLOAK_DB_PASSWORD***-config/realm-export.json`  
  - `deployment/***REMOVED-KEYCLOAK_DB_PASSWORD***-config/***REMOVED-KEYCLOAK_DB_PASSWORD***-config.json`
- Ready-to-import for instant IAM setup, including roles and clients.

### **Blockchain**
- **Smart contract deployment scripts:**  
  - `blockchain/scripts/deploy.js`
  - `blockchain/hardhat.config.js`
- Supports local development and testing with Hardhat.

### **Backend & Frontend**
- All application code, API endpoints, and React UI as of this release.
- Role-based dashboards for TDP, TDC, CCRP, and AppAdmin.
- Strict Keycloak authentication and service API usage enforced.

---

## 🛠️ **How to Set Up**

1. **Database**
   ```sh
   npx sequelize-cli db:migrate
   ```
2. **Keycloak**
   - Import the realm using the provided JSON files in the Keycloak admin UI.
3. **Blockchain**
   ```sh
   cd blockchain
   npx hardhat node
   npx hardhat run scripts/deploy.js --network localhost
   ```

---

## 📝 **Notes**

- This release is the reference point for all future migrations and upgrades.
- All test data, scripts, and documentation are included for rapid onboarding.
- For detailed setup and migration instructions, see `migrations/README.md`.

---

**Thank you for using and contributing to the Contract Management System!**  
For questions or support, please open an issue or discussion on GitHub. 