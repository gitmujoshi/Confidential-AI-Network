# Contract Management System — Admin Guide (AppAdmin)

Last updated: 2026-04-30

This guide is for **AppAdmin** users responsible for system operations, security, and support across all roles (TDP/TDC/CCRP).

## 🔐 Admin access and safety
- **Least privilege**: only grant AppAdmin to trusted operators.
- **Auditability**: prefer configuration via version-controlled files and repeatable scripts.
- **Do not bypass Keycloak auth**: user/role access should flow through IAM unless explicitly in a dev environment.

## 👥 User & role management

### **Roles**
- **TDP**: dataset provider
- **TDC**: dataset consumer / training initiator
- **CCRP**: confidential clean room provider (environments/TEE/training operations)
- **AppAdmin**: system administrator

### **Common admin tasks**
- **Create or onboard a user**:
  - Use the application registration workflow and ensure Keycloak sync is healthy.
- **Disable a user**:
  - Mark the local user inactive and remove/disable in Keycloak as required by policy.
- **Fix “user not found” issues**:
  - Ensure Keycloak username ↔ local `iamUsername` mapping is consistent.

## 🧭 Operational monitoring

### **Health check**
- Backend health endpoint: `GET /health` (returns uptime, memory, version)

### **System status scripts**
From repo root:

```bash
npm run status
```

### **Logs**
- Backend logs: `logs/backend.log` (plus console output in dev)
- Investigate auth failures first (Keycloak connectivity, client credentials, realm config).

## 🔑 Keycloak / IAM operations

### **Keycloak health & auto-fix**
The backend includes an internal Keycloak health check and can attempt auto-fix on startup when configured.

Useful commands:

```bash
./fix-auth.sh
cd backend && node auto-fix-***REMOVED-KEYCLOAK_DB_PASSWORD***.js
npm run ***REMOVED-KEYCLOAK_DB_PASSWORD***:sync
```

## 📝 Contracts and signing (admin view)
- **Support contract lifecycle issues**:
  - Confirm template availability, party assignments, and signature status.
- **Audit evidence**:
  - Export contract details, signing events, and system audit logs as required.

## 📦 Datasets, compliance, and DEPA operations

### **DEPA / deployment identifiers**
- Deployment defaults and examples: `config.env.example`
- Visibility: `docs/DEPA_ID_CONFIGURATION_VISIBILITY.md`

### **Maintenance scripts**
Development scripts (use carefully):
- `backend/scripts/dev/reset-contracts-and-dropdowns.js`
- `backend/scripts/dev/purge-local-depa-reseed.js`
- `backend/scripts/dev/purge-legacy-depa-reseed.js`
- `backend/scripts/dev/depaPurgeShared.js`

## 🧪 Test operations (admin support)

### **Backend**
```bash
cd backend
npm run test:unit
npm run test:integration
```

### **Frontend E2E**
```bash
cd frontend
npx playwright test
```

## 🕵️ Audit logging and evidence
- Prefer **append-only** event streams for security-relevant actions.
- Retain logs according to compliance requirements.

## 🌐 CAN (Confidential AI Network) — operational notes (MVP)

The CAN MVP runs in **parallel** under `/api/can/*` and is intentionally separate from portal/Keycloak auth.

### **What AppAdmin may need to operate**
- Ensure the backend process deployed includes CAN routes.
- Optional webhook delivery settings:
  - `CAN_WEBHOOK_URLS` (comma-separated)
  - `CAN_WEBHOOK_SECRET`
- Optional deadline sweeper:
  - `CAN_ESCROW_SWEEPER_ENABLED=false` to disable
  - `CAN_ESCROW_SWEEPER_INTERVAL_MS=5000` to tune

### **Docs**
- CAN quickstart: `docs/CAN_QUICKSTART.md`
- CAN scope decisions: `docs/CAN_GAP_DECISION_MEMO.md`

---

### **Related documents**
- User guide: `docs/USER_GUIDE.md`
- Training guide: `docs/training/USER_TRAINING_GUIDE.md`
- Troubleshooting: `docs/TROUBLESHOOTING.md`
