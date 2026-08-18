# Confidential AI Network — Documentation

**Start here.** Docs follow a Google-inspired [Diátaxis](https://diataxis.fr/) layout: tutorials, how-to guides, reference, and explanation. Style rules: [DOC_STYLE.md](DOC_STYLE.md).

---

## Tutorials (learn by doing)

| Goal | Doc |
|------|-----|
| Run the stack locally | [getting-started/QUICK_START.md](getting-started/QUICK_START.md) |
| Full local setup | [getting-started/SETUP.md](getting-started/SETUP.md) |
| Stakeholder demo (contract → train) | [training/LOCAL_DEMO_RUNBOOK.md](training/LOCAL_DEMO_RUNBOOK.md) |
| CAN JCS MVP (API) | [features/can/CAN_QUICKSTART.md](features/can/CAN_QUICKSTART.md) |

---

## How-to guides (solve a task)

| Task | Doc |
|------|-----|
| **Full party lifecycle** (onboard → sign → train → cleanup) | [guides/PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md](guides/PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md) |
| **Screenshot E2E lifecycle** (onboard → sign → train → provenance → inference) | [guides/lifecycle-user-guide/LIFECYCLE_USER_GUIDE.md](guides/lifecycle-user-guide/LIFECYCLE_USER_GUIDE.md) |
| **Screenshot multi-model training** (one contract per model type) | [guides/multi-model-user-guide/MULTI_MODEL_USER_GUIDE.md](guides/multi-model-user-guide/MULTI_MODEL_USER_GUIDE.md) |
| Use the product UI (TDP / TDC / TSP) | [USER_GUIDE.md](USER_GUIDE.md) |
| Sign contracts | [features/contract-signing/CONTRACT_SIGNING_USER_GUIDE.md](features/contract-signing/CONTRACT_SIGNING_USER_GUIDE.md) |
| Fix auth / Keycloak | [getting-started/TROUBLESHOOTING.md](getting-started/TROUBLESHOOTING.md) · `./fix-auth.sh` |
| AppAdmin operations | [ADMIN_GUIDE.md](ADMIN_GUIDE.md) |
| Role training modules | [training/README.md](training/README.md) |
| DEPA alignment | [guides/DEPA_INTEGRATION_GUIDE.md](guides/DEPA_INTEGRATION_GUIDE.md) |

---

## Reference

| Topic | Doc |
|-------|-----|
| Glossary | [GLOSSARY.md](GLOSSARY.md) |
| APIs | [api/API_REFERENCE.md](api/API_REFERENCE.md) · [api/COMPLETE_API_SPECIFICATIONS.md](api/COMPLETE_API_SPECIFICATIONS.md) |
| Contract signing (tech) | [features/contract-signing/CONTRACT_SIGNING_TECHNICAL_REFERENCE.md](features/contract-signing/CONTRACT_SIGNING_TECHNICAL_REFERENCE.md) |
| Data model | [architecture/DATA_MODEL_REFERENCE.md](architecture/DATA_MODEL_REFERENCE.md) |
| Scripts | [operational/QUICK_SCRIPT_REFERENCE.md](operational/QUICK_SCRIPT_REFERENCE.md) |
| Env vars / local dev | [development/README.md](development/README.md) |
| Testing | [development/TESTING_GUIDE.md](development/TESTING_GUIDE.md) · [testing/E2E_TEST_DOCUMENTATION.md](testing/E2E_TEST_DOCUMENTATION.md) |

---

## Explanation (design & architecture)

| Topic | Doc |
|-------|-----|
| System architecture | [ARCHITECTURE.md](ARCHITECTURE.md) |
| CAN gap / trust model | [features/can/CAN_GAP_DECISION_MEMO.md](features/can/CAN_GAP_DECISION_MEMO.md) |
| SCITT CCF | [features/scitt/SCITT_CCF_ARCHITECTURE.md](features/scitt/SCITT_CCF_ARCHITECTURE.md) |
| Encrypted dataset / model → TEE flows | [flows/](flows/) |
| IAM & keys | [security/README.md](security/README.md) |
| OCI security architecture | [production/OCI_SECURITY_ARCHITECTURE.md](production/OCI_SECURITY_ARCHITECTURE.md) |
| Azure security architecture | [production/AZURE_SECURITY_ARCHITECTURE.md](production/AZURE_SECURITY_ARCHITECTURE.md) |
| Multi-cloud security patterns | [production/MULTI_CLOUD_SECURITY_ARCHITECTURE_PATTERNS.md](production/MULTI_CLOUD_SECURITY_ARCHITECTURE_PATTERNS.md) |
| **NIST / CIS / OWASP control mapping** (requirements met) | [compliance/SECURITY_CONTROLS_NIST_CIS_MAPPING.md](compliance/SECURITY_CONTROLS_NIST_CIS_MAPPING.md) |
| DPDP Act 2023 implementation | [compliance/DPDP_COMPLIANCE_IMPLEMENTATION.md](compliance/DPDP_COMPLIANCE_IMPLEMENTATION.md) |
| OCI design complete (scaffolds) | [deployment/OCI_DESIGN_COMPLETE.md](deployment/OCI_DESIGN_COMPLETE.md) |
| Security blog (GitHub Pages) | [blogs/](blogs/README.md) · [Product tour](blogs/product-tour.md) |

---

## Deploy

| Target | Readiness | Architecture / IAM |
|--------|-----------|-------------------|
| Local / VM | [getting-started/QUICK_START.md](getting-started/QUICK_START.md) | [deployment/README.md](deployment/README.md) |
| OCI | [deployment/OCI_READINESS.md](deployment/OCI_READINESS.md) | [production/OCI_SECURITY_ARCHITECTURE.md](production/OCI_SECURITY_ARCHITECTURE.md) · [OCI IAM & edge](deployment/OCI_IAM_AND_EDGE_CONFIG.md) |
| Azure | [deployment/AZURE_READINESS.md](deployment/AZURE_READINESS.md) | [production/AZURE_SECURITY_ARCHITECTURE.md](production/AZURE_SECURITY_ARCHITECTURE.md) · [Azure IAM & edge](deployment/AZURE_IAM_AND_EDGE_CONFIG.md) |
| K8s production | [production/PRODUCTION_DEPLOYMENT_GUIDE.md](production/PRODUCTION_DEPLOYMENT_GUIDE.md) | [production/README.md](production/README.md) |

---

## By role (short)

| Role | Start |
|------|--------|
| End user / facilitator | [guides/PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md](guides/PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md) · [training/LOCAL_DEMO_RUNBOOK.md](training/LOCAL_DEMO_RUNBOOK.md) |
| Developer | [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) |
| AppAdmin / SRE | [ADMIN_GUIDE.md](ADMIN_GUIDE.md) · [production/README.md](production/README.md) |
| Security / architect | [ARCHITECTURE.md](ARCHITECTURE.md) · [security/README.md](security/README.md) · [production/MULTI_CLOUD_SECURITY_ARCHITECTURE_PATTERNS.md](production/MULTI_CLOUD_SECURITY_ARCHITECTURE_PATTERNS.md) · [compliance/SECURITY_CONTROLS_NIST_CIS_MAPPING.md](compliance/SECURITY_CONTROLS_NIST_CIS_MAPPING.md) · [blogs/](blogs/README.md) |

---

## Folder map

```
docs/
├── README.md, DOC_STYLE.md, GLOSSARY.md
├── USER_GUIDE.md, ADMIN_GUIDE.md, DEVELOPER_GUIDE.md, ARCHITECTURE.md
├── getting-started/   tutorials: install, troubleshoot
├── training/          demos + role modules
├── guides/            how-to (E2E lifecycle, DEPA, templates)
├── features/          can, contract-signing, scitt, provenance, encryption
├── flows/             TDP/TDC/CCRP encrypt→TEE sequences
├── api/               reference
├── architecture/      deep design
├── security/          IAM, keys, provenance crypto
├── compliance/        NIST/CIS/OWASP mapping, DPDP Act implementation
├── blogs/             GitHub Pages site (vision, product tour, security notes)
├── deployment/        OCI/Azure readiness + IAM edge
├── production/        runbooks, SIEM, security architectures
├── development/       local env, testing
├── testing/           QA plans
├── implementation/    active design notes (keep thin)
├── integrations/      HF, Samyog comparison
├── operational/       script reference
├── contracts/         Ricardian templates
└── archive/           historical only — not canonical
```

---

## Archive policy

Superseded indexes, root stubs, conversion exports, and old implementation summaries live under **[archive/](archive/README.md)**. Do not treat archive as current.

When updating docs: edit the canonical file, link from this home page, follow [DOC_STYLE.md](DOC_STYLE.md).

**Last updated:** 2026-07-28
