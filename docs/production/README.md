# Production Documentation

Production guides for the **Confidential AI Network (CAN)** — the multi-party platform where Training Data Providers (TDPs), Training Data Consumers (TDCs), and Confidential Clean Room Providers (CCRPs) negotiate contracts, run AI training in protected environments, and leave an auditable trail of what happened.

Use this folder when you are **standing up or operating CAN in a real environment** (OCI, Azure, or other supported clouds), not when you are doing local development. For day-to-day product usage, see [USER_GUIDE.md](../USER_GUIDE.md). For local demos, see [training/LOCAL_DEMO_RUNBOOK.md](../training/LOCAL_DEMO_RUNBOOK.md).

---

## Business use cases

CAN is built for organizations that need to **share or combine sensitive data and models for AI training** without giving up control, visibility, or compliance evidence.

### Multi-party AI training with contractual guardrails

A **TDC** (hospital network, bank, retailer, telco) wants to train a model on a **TDP’s** dataset under explicit terms: permitted use, duration, geography, privacy technique, and price. CAN turns those terms into a **Ricardian contract** that all parties sign before any training starts.

**Outcome:** Training only proceeds after agreement; contract state and key events are recorded for audit.

### Confidential clean room execution

A **TSP** (also called CCRP in the UI) hosts the job on a Local machine or on an AKS, GKE, or OKE cluster that provider already runs. Dataset owners and the model publisher release keys through the Key Orchestrator. The API records the release time and does not store key bytes.

**Outcome today:** The attestation report stays simulated until a verified SEV-SNP quote is accepted. `CAN_KEY_RELEASE_PROFILE=production` refuses the mock broker. Azure Key Vault release, Trustee, Confidential Space, and Nitro stay off until selected and fail closed without an endpoint and a quote. The operator steps are in [PRODUCTION_DEPLOYMENT_GUIDE.md](PRODUCTION_DEPLOYMENT_GUIDE.md).

### Regulated and cross-border data collaboration

Enterprises in **healthcare, finance, and public sector** need a record of who signed the contract, which job ran, and which leaf was checked.

**Outcome today:** The Auditor workspace reviews the Ricardian contract and the Merkle root stored in this database. A SCITT receipt is written only when the ledger is enabled. SOX, FedRAMP, and CCPA labels on a deployment card are configuration, not a certification. The screen walk is the [Auditor user guide](../guides/role-user-guides/AUDITOR_USER_GUIDE.md).

### Federated catalog without central data lake

**TDPs** publish dataset **metadata and policies** in a catalog; **TDCs** discover and contract for access without copying entire corpora into a shared warehouse. Optional physical training artifacts or Hub references (dev) can point trainers at the right data source.

**Outcome:** Data sovereignty stays with the provider; consumers get governed access paths instead of bulk export.

### Operational security and SOC integration

Security and platform teams need **defense in depth** (WAF, API gateway, private networking, secrets in vault) and **centralized audit export** to existing SIEM tools (Splunk, Sentinel, OCI Logging, webhooks).

**Outcome:** CAN fits enterprise security operations — alerts, investigations, and retention — rather than a siloed training UI.

### Who benefits

| Role | Primary need | What production docs help with |
|------|----------------|----------------------------------|
| **TDC** | Train on external data under contract | Training runtime, CCRP selection, provenance |
| **TDP** | Monetize data safely | Classification, access policy, audit |
| **TSP** | Host the job on an existing cluster | [PRODUCTION_DEPLOYMENT_GUIDE.md](PRODUCTION_DEPLOYMENT_GUIDE.md), kubeconfig on the Cloud Provider card |
| **Auditor** | Review the sealed Merkle tree | [Auditor user guide](../guides/role-user-guides/AUDITOR_USER_GUIDE.md) |
| **Platform / SRE** | Deploy and run reliably | Architecture, deployment, scaling, DR |
| **Security / GRC** | Control and evidence | Security architecture, SIEM, [NIST/CIS mapping](../compliance/SECURITY_CONTROLS_NIST_CIS_MAPPING.md) |
| **AppAdmin** | Operate users and health | [ADMIN_GUIDE.md](../ADMIN_GUIDE.md), troubleshooting |

---

## Technical documentation

Follow the links below by topic. OCI and Azure each have a **step-by-step new-environment runbook at the top** of their security architecture docs.

### Deploy and operate

| Topic | Document |
|-------|----------|
| End-to-end production deployment | [PRODUCTION_DEPLOYMENT_GUIDE.md](PRODUCTION_DEPLOYMENT_GUIDE.md) |
| System architecture (components, data flow) | [PRODUCTION_ARCHITECTURE.md](PRODUCTION_ARCHITECTURE.md) |
| OCI deploy readiness | [../deployment/OCI_READINESS.md](../deployment/OCI_READINESS.md) |
| OCI features & configuration (env vars) | [../deployment/OCI_FEATURES_AND_CONFIGURATION.md](../deployment/OCI_FEATURES_AND_CONFIGURATION.md) |
| OCI SPIFFE/SPIRE + WIF (workload identity) | [../deployment/OCI_SPIFFE_SPIRE_WIF.md](../deployment/OCI_SPIFFE_SPIRE_WIF.md) |
| OCI design complete (scaffolds map) | [../deployment/OCI_DESIGN_COMPLETE.md](../deployment/OCI_DESIGN_COMPLETE.md) |
| Azure deploy readiness | [../deployment/AZURE_READINESS.md](../deployment/AZURE_READINESS.md) |
| Azure features & configuration (env vars) | [../deployment/AZURE_FEATURES_AND_CONFIGURATION.md](../deployment/AZURE_FEATURES_AND_CONFIGURATION.md) |
| AWS deploy readiness | [../deployment/AWS_READINESS.md](../deployment/AWS_READINESS.md) |
| AWS features & configuration (env vars) | [../deployment/AWS_FEATURES_AND_CONFIGURATION.md](../deployment/AWS_FEATURES_AND_CONFIGURATION.md) |
| GCP deploy readiness | [../deployment/GCP_READINESS.md](../deployment/GCP_READINESS.md) |
| GCP features & configuration (env vars) | [../deployment/GCP_FEATURES_AND_CONFIGURATION.md](../deployment/GCP_FEATURES_AND_CONFIGURATION.md) |
| Deployment index (scripts, tfvars) | [../deployment/README.md](../deployment/README.md) |
| Troubleshooting | [TROUBLESHOOTING_GUIDE.md](TROUBLESHOOTING_GUIDE.md) |

### Security and identity

| Topic | Document |
|-------|----------|
| **Multi-cloud security patterns** (Azure, AWS, GCP, OCI) | [MULTI_CLOUD_SECURITY_ARCHITECTURE_PATTERNS.md](MULTI_CLOUD_SECURITY_ARCHITECTURE_PATTERNS.md) |
| **NIST / CIS control mapping** | [../compliance/SECURITY_CONTROLS_NIST_CIS_MAPPING.md](../compliance/SECURITY_CONTROLS_NIST_CIS_MAPPING.md) |
| OCI security architecture (compartments, WAF, API GW, OKE) | [OCI_SECURITY_ARCHITECTURE.md](OCI_SECURITY_ARCHITECTURE.md) |
| Azure security architecture (Entra ID, Front Door, APIM, AKS) | [AZURE_SECURITY_ARCHITECTURE.md](AZURE_SECURITY_ARCHITECTURE.md) |
| AWS security architecture (Cognito, CloudFront, EKS) | [AWS_SECURITY_ARCHITECTURE.md](AWS_SECURITY_ARCHITECTURE.md) |
| GCP security architecture (Identity Platform, Armor, GKE) | [GCP_SECURITY_ARCHITECTURE.md](GCP_SECURITY_ARCHITECTURE.md) |
| OCI IAM and edge configuration (policies, routes, JWT) | [../deployment/OCI_IAM_AND_EDGE_CONFIG.md](../deployment/OCI_IAM_AND_EDGE_CONFIG.md) |
| Azure IAM and edge configuration | [../deployment/AZURE_IAM_AND_EDGE_CONFIG.md](../deployment/AZURE_IAM_AND_EDGE_CONFIG.md) |
| AWS IAM and edge configuration | [../deployment/AWS_IAM_AND_EDGE_CONFIG.md](../deployment/AWS_IAM_AND_EDGE_CONFIG.md) |
| GCP IAM and edge configuration | [../deployment/GCP_IAM_AND_EDGE_CONFIG.md](../deployment/GCP_IAM_AND_EDGE_CONFIG.md) |
| Application security practices | [SECURITY_GUIDE.md](SECURITY_GUIDE.md) |
| SIEM / audit export (Splunk, Sentinel, OCI, webhook) | [SIEM_INTEGRATION_FRAMEWORK.md](SIEM_INTEGRATION_FRAMEWORK.md) · [../deployment/siem/README.md](../deployment/siem/README.md) |
| **NIST / CIS requirements met** | [../compliance/SECURITY_CONTROLS_NIST_CIS_MAPPING.md](../compliance/SECURITY_CONTROLS_NIST_CIS_MAPPING.md) |

### Observability and resilience

| Topic | Document |
|-------|----------|
| Monitoring and dashboards | [MONITORING_GUIDE.md](MONITORING_GUIDE.md) |
| Backup, recovery, and DR patterns | Covered in [PRODUCTION_DEPLOYMENT_GUIDE.md](PRODUCTION_DEPLOYMENT_GUIDE.md) and architecture guides |

### Related product and integration docs

| Topic | Document |
|-------|----------|
| Training workflows (TDC/TDP/CCRP) | [../training/README.md](../training/README.md) · [GLOSSARY.md](../GLOSSARY.md) (training & privacy terms) |
| System architecture (full stack) | [../ARCHITECTURE.md](../ARCHITECTURE.md) |
| Hugging Face Hub (dev catalog) | [../integrations/HUGGINGFACE.md](../integrations/HUGGINGFACE.md) |
| API reference | [../api/API_REFERENCE.md](../api/API_REFERENCE.md) |

---

## Quick deployment commands

Follow [PRODUCTION_DEPLOYMENT_GUIDE.md](PRODUCTION_DEPLOYMENT_GUIDE.md). The env files and the Azure and OCI commands are in [../deployment/README.md](../deployment/README.md).

The laptop layout on Azure is one VM: `./deployment/deploy-azure.sh vm -y`. Keycloak and both Postgres databases run in Docker on that machine. The AKS path stays Entra unless `identity_mode` is `keycloak`, which stores the Keycloak database on Azure Database for PostgreSQL.

`scripts/deploy/deploy-production.sh` and `deploy/production/deploy-training-environment.sh` exit immediately. They are the older sketch and do not deploy this system.

---

## Production checklist (summary)

**Before go-live**

- [ ] Existing AKS, GKE, or OKE cluster named on the tech service provider card, with a kubeconfig path. An empty path must fail the job
- [ ] Cloud identity on for the cluster path (Entra, Cloud Identity, Cognito, or OCI IAM). On Azure, `identity_mode=keycloak` is the Keycloak alternative, and `./deployment/deploy-azure.sh vm -y` runs the local stack on one VM
- [ ] `CAN_KEY_RELEASE_PROFILE=production` refuses the mock broker. The selected release mode has its endpoint and quote, or it fails closed
- [ ] Auditor user created with `partyType` `Auditor`. Merkle verify works on a completed job
- [ ] `SEV_SNP_ARK_PEM` is set before any hardware quote is accepted. Until a quote verifies, the job stays simulated
- [ ] Public DNS, SPIRE Helm, and a confidential-pool apply are done only when that environment requires them

**After go-live**

- [ ] Health checks and ingress routes passing
- [ ] Alerts routed to on-call / SOC
- [ ] Contract → training path validated end-to-end in the target environment
- [ ] Runbooks and contacts updated for your organization

Full procedures and component detail are in the linked guides above.

---

## Support path

1. **Symptom in running environment** → [TROUBLESHOOTING_GUIDE.md](TROUBLESHOOTING_GUIDE.md)  
2. **Deployment or infra** → [PRODUCTION_DEPLOYMENT_GUIDE.md](PRODUCTION_DEPLOYMENT_GUIDE.md) + cloud-specific security doc  
3. **Auth or access** → [../getting-started/TROUBLESHOOTING.md](../getting-started/TROUBLESHOOTING.md) · [SECURITY_GUIDE.md](SECURITY_GUIDE.md)  
4. **Product behavior** → [../USER_GUIDE.md](../USER_GUIDE.md)

---

*Last updated: 2026-11-24*
