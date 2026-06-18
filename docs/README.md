# Contract Management — Documentation

**Start here.** This is the single index for project documentation. Older duplicate indexes (`DOCUMENTATION_INDEX.md`, `MAIN_README.md`) were archived.

## Quick links

| I want to… | Go to |
|------------|--------|
| Run the app locally | [getting-started/QUICK_START.md](getting-started/QUICK_START.md) |
| Fix setup / auth issues | [getting-started/TROUBLESHOOTING.md](getting-started/TROUBLESHOOTING.md) · [guides/SETUP_TROUBLESHOOTING_GUIDE.md](guides/SETUP_TROUBLESHOOTING_GUIDE.md) |
| Use the product (TDC/TDP/CCRP) | [USER_GUIDE.md](USER_GUIDE.md) · [training/README.md](training/README.md) |
| Develop or extend the system | [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) · [development/README.md](development/README.md) |
| Deploy to production / OCI / Azure | [deployment/README.md](deployment/README.md) · [production/README.md](production/README.md) |
| Understand architecture | [ARCHITECTURE.md](ARCHITECTURE.md) · [architecture/](architecture/) |
| Call APIs | [api/API_REFERENCE.md](api/API_REFERENCE.md) · [api/COMPLETE_API_SPECIFICATIONS.md](api/COMPLETE_API_SPECIFICATIONS.md) |
| Security & IAM | [security/](security/) · [production/OCI_SECURITY_ARCHITECTURE.md](production/OCI_SECURITY_ARCHITECTURE.md) |
| Test (manual / E2E) | [development/TESTING_GUIDE.md](development/TESTING_GUIDE.md) · [testing/E2E_TEST_DOCUMENTATION.md](testing/E2E_TEST_DOCUMENTATION.md) · [frontend/tests/e2e/README.md](../frontend/tests/e2e/README.md) |
| **Local stakeholder demo** | [training/LOCAL_DEMO_RUNBOOK.md](training/LOCAL_DEMO_RUNBOOK.md) |
| **OCI deploy readiness** | [deployment/OCI_READINESS.md](deployment/OCI_READINESS.md) |
| **OCI IAM / WAF / API GW** | [deployment/OCI_IAM_AND_EDGE_CONFIG.md](deployment/OCI_IAM_AND_EDGE_CONFIG.md) |
| **SIEM integration** | [production/SIEM_INTEGRATION_FRAMEWORK.md](production/SIEM_INTEGRATION_FRAMEWORK.md) · [deployment/siem/](../deployment/siem/README.md) |
| **OCI new-env setup runbook** | [production/OCI_SECURITY_ARCHITECTURE.md](production/OCI_SECURITY_ARCHITECTURE.md) (top of doc) |
| **Azure deploy readiness** | [deployment/AZURE_READINESS.md](deployment/AZURE_READINESS.md) |
| **Azure IAM / WAF / APIM** | [deployment/AZURE_IAM_AND_EDGE_CONFIG.md](deployment/AZURE_IAM_AND_EDGE_CONFIG.md) |
| **Azure new-env setup runbook** | [production/AZURE_SECURITY_ARCHITECTURE.md](production/AZURE_SECURITY_ARCHITECTURE.md) (top of doc) |
| **Hugging Face (dev catalog)** | [integrations/HUGGINGFACE.md](integrations/HUGGINGFACE.md) |
| **CAN vs Samyog** | [integrations/SAMYOG_CAN_COMPARISON.md](integrations/SAMYOG_CAN_COMPARISON.md) |

---

## Folder map

```
docs/
├── README.md                 ← you are here
├── ARCHITECTURE.md           ← system architecture (hub + deep dive)
├── USER_GUIDE.md             ← end-user guide
├── ADMIN_GUIDE.md            ← AppAdmin operations
├── DEVELOPER_GUIDE.md        ← developer setup & workflow
│
├── getting-started/          ← install, config, first run
├── development/              ← local dev, env vars, testing notes
├── deployment/               ← where to deploy (VM, OCI, K8s) — hub
├── production/               ← K8s/OCI production runbooks
│
├── features/
│   ├── contract-signing/     ← Ricardian signing docs
│   ├── can/                  ← Confidential AI Network
│   ├── scitt/                ← SCITT CCF integration
│   ├── provenance/           ← provenance & audit trails
│   └── encryption/           ← LUKS & large-file encryption
│
├── architecture/             ← deep-dive design (KMS, data model, UML, …)
├── api/                      ← API reference & specifications
├── security/                 ← IAM, keys, secrets, signing
├── compliance/               ← DPDP and regulatory
├── contracts/                ← Ricardian contract templates & KMS providers
├── flows/                    ← end-to-end data flows (TDP/TDC/CCRP)
├── guides/                   ← how-to guides (DEPA, templates, …)
├── training/                 ← role training modules + course
├── testing/                  ← QA, test data, E2E notes
├── implementation/           ← PRDs, service docs, active design notes
├── integrations/             ← Hugging Face, external catalog adapters (dev)
├── operational/              ← scripts, script manager references
└── archive/                  ← superseded & historical docs (do not use as canonical)
```

---

## By role

### End users & trainers
- [USER_GUIDE.md](USER_GUIDE.md)
- [training/USER_TRAINING_GUIDE.md](training/USER_TRAINING_GUIDE.md)
- [training/TDC_TRAINING_MODULE.md](training/TDC_TRAINING_MODULE.md) · [TDP](training/TDP_TRAINING_MODULE.md) · [CCRP](training/CCRP_TRAINING_MODULE.md) · [AppAdmin](training/APPADMIN_TRAINING_MODULE.md)
- [training/TDC_TRAINING_RUNTIME.md](training/TDC_TRAINING_RUNTIME.md) — APIs, env vars, UI routes
- [training/TRAINING_COURSE.md](training/TRAINING_COURSE.md) — full courseware

### Developers
- [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)
- [development/LOCAL_DEVELOPMENT_SETUP.md](development/LOCAL_DEVELOPMENT_SETUP.md)
- [development/TESTING_GUIDE.md](development/TESTING_GUIDE.md) — unit, integration, E2E (incl. HF, CAN API, opt-in NLP DP)
- [implementation/BACKEND_SERVICES_DOCUMENTATION.md](implementation/BACKEND_SERVICES_DOCUMENTATION.md)
- [implementation/FRONTEND_COMPONENTS_DOCUMENTATION.md](implementation/FRONTEND_COMPONENTS_DOCUMENTATION.md)

### Operators & AppAdmin
- [ADMIN_GUIDE.md](ADMIN_GUIDE.md)
- [production/README.md](production/README.md)
- [production/MONITORING_GUIDE.md](production/MONITORING_GUIDE.md)
- [production/TROUBLESHOOTING_GUIDE.md](production/TROUBLESHOOTING_GUIDE.md)
- [operational/QUICK_SCRIPT_REFERENCE.md](operational/QUICK_SCRIPT_REFERENCE.md)

### Architects & security
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [architecture/DATA_MODEL_REFERENCE.md](architecture/DATA_MODEL_REFERENCE.md)
- [security/IDENTITY_AND_ACCESS_MANAGEMENT_DOCUMENTATION.md](security/IDENTITY_AND_ACCESS_MANAGEMENT_DOCUMENTATION.md)
- [security/IAM_INTEGRATION_DESIGN.md](security/IAM_INTEGRATION_DESIGN.md)
- [production/OCI_SECURITY_ARCHITECTURE.md](production/OCI_SECURITY_ARCHITECTURE.md)
- [production/SECURITY_GUIDE.md](production/SECURITY_GUIDE.md)

---

## Feature documentation

### Contract signing
Index: [features/contract-signing/CONTRACT_SIGNING_INDEX.md](features/contract-signing/CONTRACT_SIGNING_INDEX.md)

- [Overview](features/contract-signing/CONTRACT_SIGNING_OVERVIEW.md)
- [User guide](features/contract-signing/CONTRACT_SIGNING_USER_GUIDE.md)
- [Technical reference](features/contract-signing/CONTRACT_SIGNING_TECHNICAL_REFERENCE.md)
- [SCITT integration](features/contract-signing/CONTRACT_SIGNING_SCITT_INTEGRATION.md)

### SCITT CCF
- [Architecture](features/scitt/SCITT_CCF_ARCHITECTURE.md)
- [Integration README](features/scitt/SCITT_CCF_INTEGRATION_README.md)
- [API specs](api/SCITT_CCF_API_SPECIFICATIONS.md)
- [Implementation status](implementation/SCITT_CCF_INTEGRATION_STATUS.md)

### CAN (Confidential AI Network)
- [CAN quickstart](features/can/CAN_QUICKSTART.md)
- [Gap decision memo](features/can/CAN_GAP_DECISION_MEMO.md)

### Provenance & encryption
- [Provenance integration](features/provenance/PROVENANCE_INTEGRATION_GUIDE.md)
- [Provenance API endpoints](api/API_PROVENANCE_ENDPOINTS.md)
- [Merkle tree implementation](security/MERKLE_TREE_PROVENANCE_IMPLEMENTATION.md)
- [LUKS encryption](features/encryption/LUKS_ENCRYPTION_GUIDE.md)

---

## Deployment paths

| Scenario | Documentation | Scripts |
|----------|---------------|---------|
| Local dev | [getting-started/QUICK_START.md](getting-started/QUICK_START.md) | `./start-system.sh` |
| Ubuntu / local VM | [deployment/README.md](deployment/README.md) | `deployment/deploy-to-ubuntu-vm.sh` |
| OCI (Terraform) | [production/OCI_SECURITY_ARCHITECTURE.md](production/OCI_SECURITY_ARCHITECTURE.md) | [deployment/oci/terraform/](../deployment/oci/terraform/README.md) |
| Azure (Terraform) | [production/AZURE_SECURITY_ARCHITECTURE.md](production/AZURE_SECURITY_ARCHITECTURE.md) | [deployment/azure/terraform/](../deployment/azure/terraform/README.md) |
| K8s production | [production/PRODUCTION_DEPLOYMENT_GUIDE.md](production/PRODUCTION_DEPLOYMENT_GUIDE.md) | [deploy/production/](../deploy/production/README.md) |

---

## Archive policy

Historical changelogs, duplicate guides, and superseded specs live under **[archive/](archive/README.md)**. They are kept for audit history only — **do not treat them as current**.

When updating docs:
1. Edit the canonical file in the folder map above.
2. Do not add new top-level files under `docs/` (use subfolders).
3. Point README links here instead of creating new index files.

---

**Last updated:** 2026-06-15
