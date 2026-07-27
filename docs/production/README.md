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

A **CCRP** (cloud provider, specialist TEE operator, internal platform team) offers **isolated compute** — confidential VMs, enclaves, or segmented Kubernetes — where data and models are decrypted only inside an attested environment.

**Outcome:** TDP data and TDC model IP stay protected in transit and at rest; execution happens where policy allows.

### Regulated and cross-border data collaboration

Enterprises in **healthcare, finance, and public sector** must prove **who accessed what, when, and under which policy**. CAN combines role-based access (Keycloak), dataset classification, residency controls, and ledger-backed provenance.

**Outcome:** Evidence for GDPR, HIPAA, SOX, and emerging AI governance (e.g. EU AI Act) without ad-hoc spreadsheets and email approvals.

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
| **CCRP** | Host compliant workloads | Environment isolation, monitoring |
| **Platform / SRE** | Deploy and run reliably | Architecture, deployment, scaling, DR |
| **Security / GRC** | Control and evidence | Security architecture, SIEM, compliance |
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

For a **smoke test** or lab environment:

```bash
./deploy-production.sh production aws us-east-1
```

For a **full production-style** rollout (Kubernetes, monitoring, security hooks):

```bash
./deploy/production/deploy-training-environment.sh production us-east-1 aws
```

Cloud-specific Terraform and scripts live under [../deployment/](../deployment/) (OCI and Azure modules included). Replace region and provider as appropriate.

---

## Production checklist (summary)

**Before go-live**

- [ ] Target cloud account, compartments/resource groups, and networking defined
- [ ] Kubernetes cluster, container registry, and secrets (Vault / Key Vault / OCI Vault) ready
- [ ] Keycloak / Entra integration and role mapping verified for TDC, TDP, CCRP, AppAdmin
- [ ] Edge stack configured (WAF, API gateway, TLS certificates)
- [ ] Monitoring and SIEM export tested with a sample audit event
- [ ] Backup and restore drill completed for database and cluster state

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

*Last updated: 2026-06-18*
