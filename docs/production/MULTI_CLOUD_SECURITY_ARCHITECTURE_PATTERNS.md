# Multi-cloud security architecture patterns

**Canonical explanation** of the security patterns Confidential AI Network (CAN) applies on **Azure, Amazon Web Services (AWS), Google Cloud (GCP), and Oracle Cloud Infrastructure (OCI)**. Per-cloud runbooks and product names live in the cloud-specific architecture docs; this page is the shared blueprint for CISOs, architects, and platform leads.

| Item | Value |
|------|--------|
| Audience | Security / GRC leaders, enterprise architects, platform owners |
| Maturity | **Pattern catalog** — product controls are shared; cloud IaC maturity varies (see readiness docs) |
| Complements | Per-cloud architectures below — **does not replace** them |

### Per-cloud detail (implementation)

| Cloud | Security architecture | Identity & edge | Features + env |
|-------|----------------------|-----------------|----------------|
| Azure | [AZURE_SECURITY_ARCHITECTURE.md](AZURE_SECURITY_ARCHITECTURE.md) | [AZURE_IAM_AND_EDGE_CONFIG.md](../deployment/AZURE_IAM_AND_EDGE_CONFIG.md) | [AZURE_FEATURES_AND_CONFIGURATION.md](../deployment/AZURE_FEATURES_AND_CONFIGURATION.md) |
| AWS | [AWS_SECURITY_ARCHITECTURE.md](AWS_SECURITY_ARCHITECTURE.md) | [AWS_IAM_AND_EDGE_CONFIG.md](../deployment/AWS_IAM_AND_EDGE_CONFIG.md) | [AWS_FEATURES_AND_CONFIGURATION.md](../deployment/AWS_FEATURES_AND_CONFIGURATION.md) |
| GCP | [GCP_SECURITY_ARCHITECTURE.md](GCP_SECURITY_ARCHITECTURE.md) | [GCP_IAM_AND_EDGE_CONFIG.md](../deployment/GCP_IAM_AND_EDGE_CONFIG.md) | [GCP_FEATURES_AND_CONFIGURATION.md](../deployment/GCP_FEATURES_AND_CONFIGURATION.md) |
| OCI | [OCI_SECURITY_ARCHITECTURE.md](OCI_SECURITY_ARCHITECTURE.md) | [OCI_IAM_AND_EDGE_CONFIG.md](../deployment/OCI_IAM_AND_EDGE_CONFIG.md) | [OCI_FEATURES_AND_CONFIGURATION.md](../deployment/OCI_FEATURES_AND_CONFIGURATION.md) |
| Workload identity (OCI first) | [OCI_SPIFFE_SPIRE_WIF.md](../deployment/OCI_SPIFFE_SPIRE_WIF.md) | — | SPIFFE/SPIRE + federation |

Related: [GLOSSARY.md](../GLOSSARY.md) · [PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md](../guides/PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md) · [SIEM_INTEGRATION_FRAMEWORK.md](SIEM_INTEGRATION_FRAMEWORK.md)

---

## 1. Why a common pattern set?

Enterprises pick a cloud (or several) for residency, commercial, and existing identity reasons. CAN must present the **same security story** everywhere:

- Humans sign in with the **cloud’s identity provider** (not Keycloak in production).
- Workloads reach Vault/Key Management Service, object storage, and registries with **short-lived credentials**, not static API keys.
- Peers in training and clean-room paths can prove **who is calling whom** (Zero Trust between services).
- Contracts, encryption keys, and provenance leave an **auditable trail** security and compliance teams can consume.

Cloud product names differ; the **control objectives** do not.

---

## 2. Reference topology (all clouds)

```
Internet
   → Global edge (CDN / Front Door / CloudFront / …) + Web Application Firewall
        ├─ Browser app  →  load balancer / ingress  →  Kubernetes frontend
        └─ API          →  API gateway (validates identity-provider tokens)
                              →  load balancer / ingress  →  Kubernetes backend
Backend → managed PostgreSQL (private) · Redis · object storage (customer-managed keys)
       → cloud secret store / Key Management Service
Training / clean room → Kubernetes Jobs or confidential compute (Trusted Execution Environment where required)
Evidence → confidential ledger (SCITT CCF) + Security Information and Event Management export
```

**Local laptop / docker-compose** remains a fourth “environment”: **Keycloak** for demos and Playwright only. Never treat Keycloak as the production identity provider on Azure, AWS, GCP, or OCI.

---

## 3. Pattern catalog

Each pattern states the **control objective**, **how CAN applies it**, and the **typical cloud services**. Spellings favor leadership readers; see [GLOSSARY.md](../GLOSSARY.md) for short forms.

### P1 — Cloud-native human identity (no Keycloak in cloud)

| | |
|--|--|
| **Objective** | Interactive users (Training Data Consumer, Training Data Provider, Tech Service Provider / clean-room operator, AppAdmin) authenticate with enterprise-grade single sign-on, multi-factor authentication, and group or app-role mapping. |
| **CAN rule** | One identity provider per cloud deployment. Portal and API validate that provider’s tokens. |
| **Azure** | Microsoft Entra ID (app roles / security groups) |
| **AWS** | Amazon Cognito (+ optional IAM Identity Center federation) |
| **GCP** | Identity Platform / Cloud Identity |
| **OCI** | OCI IAM Identity Domains |

---

### P2 — Three identity planes (do not conflate)

| Plane | Question | Mechanism family |
|-------|----------|------------------|
| **A. Humans** | “Is this person allowed to use the portal/API?” | Cloud identity provider + API gateway token validation |
| **B. Platform → cloud APIs** | “May this pod read this bucket or open this vault secret?” | Kubernetes workload identity / Workload Identity Federation |
| **C. Workload → workload** | “Is this peer the training Job’s Kubernetes Service Account I expect?” | SPIFFE/SPIRE verifiable identity documents + mutual TLS (OCI design first; portable to other clouds) |

Detail: [OCI_SPIFFE_SPIRE_WIF.md](../deployment/OCI_SPIFFE_SPIRE_WIF.md) · blog-oriented summary on the [Pages site](https://gitmujoshi.github.io/Confidential-AI-Network/).

---

### P3 — Environment isolation and least privilege

| | |
|--|--|
| **Objective** | Dev cannot administer prod; auditors get read-only; break-glass is rare and logged. |
| **CAN rule** | Separate resource containers per environment (`dev` → `test` → `staging` → `prod`); shared services (registry, Terraform state) in a dedicated shared scope. |
| **Azure** | Management groups + resource groups |
| **AWS** | AWS Organizations + accounts (or strong account/VPC separation) |
| **GCP** | Folders + projects |
| **OCI** | Compartment hierarchy |

Enforce tags such as project, environment, and data classification via policy where the cloud supports it.

---

### P4 — Network segmentation (default deny)

| | |
|--|--|
| **Objective** | Databases and training data paths are not on the public internet; east-west traffic is limited to required ports. |
| **CAN rule** | One virtual network per environment; public / application / data (and optionally clean-room) subnet tiers; private endpoints or service gateways to data plane services. |
| **Azure** | Virtual Network, Network Security Groups, Private Endpoints |
| **AWS** | Virtual Private Cloud, security groups, VPC endpoints |
| **GCP** | Virtual Private Cloud, firewall rules, Private Google Access / Private Service Connect |
| **OCI** | Virtual Cloud Network, Network Security Groups, service gateways |

Admin access via bastion / just-in-time access — not standing public Secure Shell on nodes.

---

### P5 — Edge protection (Web Application Firewall + API gateway)

| | |
|--|--|
| **Objective** | Browser and API entry points are rate-limited, inspected, and authenticated before reaching the cluster. |
| **CAN rule** | Global edge + Web Application Firewall in front of the app; API gateway validates identity-provider tokens for `/api`. |
| **Azure** | Front Door + Web Application Firewall, API Management |
| **AWS** | CloudFront + AWS Web Application Firewall, API Gateway |
| **GCP** | Cloud Armor (+ Cloud CDN / External Application Load Balancer), API Gateway or Apigee as chosen |
| **OCI** | Web Application Firewall, API Gateway (+ Cloud Gate for browser apps where used) |

---

### P6 — Hardened managed Kubernetes

| | |
|--|--|
| **Objective** | Control plane and nodes are private where possible; images are scanned; namespaces separate portal, API, training, and platform add-ons. |
| **CAN rule** | Managed Kubernetes; pull from private registry; secrets from cloud secret store (or External Secrets); no long-lived cloud keys in pod environment variables. |
| **Azure** | Azure Kubernetes Service, Azure Container Registry, Key Vault |
| **AWS** | Elastic Kubernetes Service, Elastic Container Registry, Secrets Manager / Parameter Store |
| **GCP** | Google Kubernetes Engine, Artifact Registry, Secret Manager |
| **OCI** | Oracle Container Engine for Kubernetes, Oracle Cloud Infrastructure Registry, OCI Vault |

Prefer cloud **Workload Identity** (or federation) so pods assume a cloud principal bound to a Kubernetes Service Account.

---

### P7 — Data protection and customer-managed keys

| | |
|--|--|
| **Objective** | Database, object storage, and disks use encryption with customer-managed keys in production; public buckets are blocked. |
| **CAN rule** | Private database; object storage for datasets and artifacts with server-side encryption under the environment key; application-layer Data / Model Encryption Keys for contracted training (see lifecycle guide). |
| **Azure** | Azure Database for PostgreSQL, Blob Storage, Key Vault |
| **AWS** | Relational Database Service, S3, Key Management Service |
| **GCP** | Cloud SQL, Cloud Storage, Cloud Key Management Service |
| **OCI** | Autonomous Database / PostgreSQL, Object Storage, OCI Vault |

Application crypto narrative (signing, Data Encryption Key, Model Encryption Key, escrow): [PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md](../guides/PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md).

---

### P8 — Confidential clean rooms and attestation

| | |
|--|--|
| **Objective** | High-sensitivity training decrypts data only inside an isolated, preferably attested environment. |
| **CAN rule** | Tech Service Provider / Confidential Clean Room Provider hosts segmented or Trusted Execution Environment compute; key release gated on contract state + identity (+ attestation when maturity allows). |
| **Azure** | Confidential VMs / enclaves on Azure Kubernetes Service (phased) |
| **AWS** | Nitro Enclaves / confidential options (phased) |
| **GCP** | Confidential Google Kubernetes Engine / Confidential VMs (phased) |
| **OCI** | Confidential computing / clean-room paths on Oracle Container Engine for Kubernetes (phased) |

SPIFFE peer authentication complements — does not replace — Trusted Execution Environment attestation.

---

### P9 — Evidence plane (ledger + Security Information and Event Management)

| | |
|--|--|
| **Objective** | Contract and training claims are tamper-evident; security operations can investigate in their existing tools. |
| **CAN rule** | SCITT Confidential Consortium Framework for selected claims; export audit events to Security Information and Event Management. |
| **Azure** | Microsoft Sentinel (and/or webhooks) |
| **AWS** | Security Hub / CloudWatch / customer Splunk (and/or webhooks) |
| **GCP** | Chronicle / Cloud Logging (and/or webhooks) |
| **OCI** | OCI Logging / Cloud Guard signals (and/or webhooks) |

Framework: [SIEM_INTEGRATION_FRAMEWORK.md](SIEM_INTEGRATION_FRAMEWORK.md).

---

### P10 — Environment profiles (dev → production)

| Profile | Typical posture |
|---------|-----------------|
| **Development** | Single region; cloud identity provider still required; lighter Web Application Firewall; no production data |
| **Test** | Automation-friendly; parity with staging for identity and network shape |
| **Staging** | Production-like edge, private data plane, purge protection on keys/secrets |
| **Production** | Strict least privilege, private clusters where feasible, customer-managed keys, Security Information and Event Management on, disaster-recovery plan |

Never promote by copying production secrets into lower environments.

---

### P11 — Disaster recovery and residency (production)

| | |
|--|--|
| **Objective** | Meet recovery and data-residency commitments without improvising during an outage. |
| **CAN rule** | Document primary and paired/DR region; backup databases and critical object prefixes; know which identity tenant and key vaults are authoritative. |
| **Azure** | Paired regions, geo-redundant storage options |
| **AWS** | Multi-Availability Zone + secondary region runbooks |
| **GCP** | Multi-zone / multi-region per product capability |
| **OCI** | Multi-Availability Domain + secondary region runbooks |

Exact Recovery Time Objective / Recovery Point Objective are customer-specific; capture them in the environment’s production runbook.

---

### P12 — Infrastructure as Code and change control

| | |
|--|--|
| **Objective** | Security baselines are reviewable and repeatable. |
| **CAN rule** | Prefer Terraform (or equivalent) for network, identity wiring, clusters, and edge; separate state per environment; deny unmanaged prod drift where policy allows. |
| **Azure / OCI** | Terraform modules under `deployment/azure/terraform`, `deployment/oci/terraform` |
| **AWS / GCP** | Documented targets; IaC scaffolding maturity — see readiness docs |

---

## 4. Service map (quick reference)

| Pattern | Azure | AWS | GCP | OCI |
|---------|-------|-----|-----|-----|
| Human identity provider | Entra ID | Cognito | Identity Platform | Identity Domains |
| Managed Kubernetes | Azure Kubernetes Service | Elastic Kubernetes Service | Google Kubernetes Engine | Oracle Container Engine for Kubernetes |
| API edge | API Management | API Gateway | API Gateway / Apigee | API Gateway |
| Web Application Firewall / CDN edge | Front Door + WAF | CloudFront + WAF | Cloud Armor (+ CDN/LB) | WAF (+ load balancer) |
| Secrets / keys | Key Vault | Secrets Manager + KMS | Secret Manager + Cloud KMS | OCI Vault |
| Object storage | Blob | S3 | Cloud Storage | Object Storage |
| Database | Azure Database for PostgreSQL | RDS PostgreSQL | Cloud SQL | Autonomous DB / PostgreSQL |
| Workload → cloud APIs | Workload identity | IAM Roles for Service Accounts | Workload Identity | OKE Workload Identity / federation |
| Workload → workload | SPIFFE/SPIRE (target) | SPIFFE/SPIRE (target) | SPIFFE/SPIRE (target) | SPIFFE/SPIRE + federation (design) |
| Security posture | Defender for Cloud | Security Hub / GuardDuty | Security Command Center | Cloud Guard |

---

## 5. What is cloud-specific vs shared application security

| Shared in the CAN application | Implemented per cloud |
|------------------------------|------------------------|
| Ricardian contracts, roles (TDC / TDP / TSP / AppAdmin) | Identity provider apps, groups, token validation at the gateway |
| DEPA-aligned entity identifiers | Deployment prefix / region in identifiers |
| Signing, Data Encryption Key / Model Encryption Key flows | Key Management Service key types and release paths |
| SCITT claim shapes | Network path to the ledger service |
| SIEM event schema | Connector (Sentinel, Splunk, OCI Logging, webhook) |
| Portal and API code | Ingress, certificates, registry, node pools |

Application-layer practices: [SECURITY_GUIDE.md](SECURITY_GUIDE.md) · product IAM: [../security/README.md](../security/README.md).

---

## 6. How to use this document

1. **Design review / CISO briefing** — walk §2–§3; confirm patterns are accepted before cloud deep-dives.  
2. **Cloud selection** — use §4, then open that cloud’s security architecture + readiness doc.  
3. **Implementation** — follow the cloud IAM & edge config and features catalogs; do not fork a second pattern set in tickets.  
4. **Gaps** — readiness docs state what is design vs Terraform vs live; keep this page pattern-stable.

---

## 7. Document history

| Date | Change |
|------|--------|
| 2026-07-28 | Initial multi-cloud security architecture patterns (Azure, AWS, GCP, OCI) |

← [Production documentation home](README.md) · [Documentation home](../README.md)
