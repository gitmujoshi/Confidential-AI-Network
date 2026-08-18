---
layout: post
title: "Building Confidential AI Network — governed multi-party training without a data lake"
date: 2026-07-29
categories: [architecture, product, security]
tags: [can, ricardian, scitt, depa, oci, confidential-computing]
permalink: /security/2026/07/29/building-confidential-ai-network/
canonical: README.md
---

Most “shared AI” projects still start the same way: copy the dataset, sign an NDA, train somewhere convenient, and hope the audit never asks hard questions.

**Confidential AI Network (CAN)** is built for the opposite case — when healthcare, finance, public sector, and industrial partners need models that improve on *each other’s* data, but **cannot** put that data in a shared lake or rely on handshake deals.

This post is a technical walkthrough of what CAN is, how the pieces fit, and what is intentionally design vs live today.

Prefer screenshots? See the [product tour]({{ '/product-tour/' | relative_url }}) (Local path). Prefer the repo? [Confidential-AI-Network on GitHub](https://github.com/gitmujoshi/Confidential-AI-Network).

---

## The problem in one sentence

**Training needs multi-party data; regulation and competition forbid bulk export; audits need proof, not screenshots.**

CAN’s answer is a protocol, not a warehouse:

1. Publish **metadata and policy**, not the corpus  
2. Negotiate a **Ricardian contract** (human-readable terms + machine-enforceable state)  
3. Train only inside a **policy-bound environment** (TSP / CCRP clean room)  
4. Leave **tamper-evident provenance** (SCITT CCF + job audit bundles)

The design is inspired by India’s iSPIRT [**DEPA**](https://depa.world) (Data Empowerment and Protection Architecture): consent-based, accountable sharing for the AI era.

---

## Three parties, one control plane

| Role | Job | Typical assets |
|------|-----|----------------|
| **TDP** — Training Data Provider | Monetize / share data safely | Encrypted datasets, classification, usage policy |
| **TDC** — Training Data Consumer | Train models under contract | Model IP, training params, evaluation criteria |
| **TSP / CCRP** — Tech Service / Confidential Clean Room Provider | Host isolated compute | Confidential VMs, OKE/AKS jobs, KMS, storage |

**AppAdmin** operates the platform (users, constraints, global deployment settings).

Humans never share one “god login.” Production identity is the **cloud IdP** for that deployment:

| Cloud | Identity |
|-------|----------|
| OCI | IAM Identity Domains |
| Azure | Microsoft Entra ID |
| GCP | Identity Platform |
| AWS | Cognito |

**Keycloak** remains for **local docker-compose and Playwright** only — not on OKE/AKS.

---

## Lifecycle: catalog → contract → train → prove → predict

```
TDP publishes catalog          TDC drafts Ricardian contract
        │                                │
        └──────────┬─────────────────────┘
                   ▼
         Multi-party sign (TDP / TDC / TSP)
                   │
                   ▼
         Provision / select clean-room env
                   │
                   ▼
         Training job (ciphertext in → artifacts out)
                   │
                   ▼
         Provenance claim + SCITT receipt
                   │
                   ▼
         Optional deploy / inference under same policy
```

What makes this different from a workflow tool:

- **No training without signed state** — the contract is the gate  
- **Environment binding** — compute, region, KMS, and storage are part of the agreement  
- **Evidence plane** — outcomes are claimed, not merely logged in an app DB  

Walk it in the UI: [lifecycle user guide](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/guides/lifecycle-user-guide/LIFECYCLE_USER_GUIDE.md) and the [participant E2E guide](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/guides/PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md).

---

## Four planes (how we think about the system)

### 1. Control plane
React portal + Node.js APIs: catalog, contracts, roles, AppAdmin.  
State machine for contract lifecycle; RBAC mapped from IdP groups.

### 2. Data & crypto plane
Dataset encryption patterns (DEK/MEK), optional differential privacy, DEPA-aligned entity IDs, residency / jurisdiction fields on contracts.

### 3. Execution plane
Training jobs in isolated environments — confidential VMs, segmented Kubernetes (OKE Jobs on OCI), or attested clean rooms. East-west trust can use **SPIFFE/SPIRE**; cloud APIs use **workload identity** (no long-lived keys in pods).

### 4. Evidence plane
**SCITT** (Supply Chain Integrity, Transparency, and Trust) on a **CCF** confidential ledger for claims; SIEM export hooks for SOC tools.

Deep dive: [multi-cloud security patterns](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/production/MULTI_CLOUD_SECURITY_ARCHITECTURE_PATTERNS.md) · [three identity planes]({% post_url 2026-07-28-three-identity-planes %}).

---

## Stack (what you actually run)

| Layer | Choice |
|-------|--------|
| Frontend | React (MUI), role dashboards, contract wizard, training UI |
| Backend | Node.js, Express, Sequelize |
| Data | PostgreSQL (local and OCI managed Postgres) |
| Local IdP | Keycloak (compose) |
| Ledger | SCITT CCF (compose / opt-in cloud) |
| OCI IaC | Terraform: VCN, OKE, PostgreSQL, OCIR, Identity Domains, K8s apps |
| Azure IaC | Terraform scaffold (AKS, PostgreSQL, Entra path) |
| AWS / GCP | Security architecture docs; IaC still design-stage |

Local path: `./start-system.sh` · [quick start](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/getting-started/QUICK_START.md).

OCI path: `./deployment/deploy-oci.sh terraform -y --images` · [OCI readiness](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/deployment/OCI_READINESS.md).

On OKE, the frontend nginx proxies **`/api`** to the backend ClusterIP so the browser stays same-origin — no brittle absolute API URLs baked into images.

---

## OCI as the primary cloud product path

We invested first in **Oracle Cloud** because clean-room + Vault + OKE + Identity Domains map cleanly to the four planes:

- **Identity Domains** for TDC / TDP / TSP groups (no Keycloak on cluster)  
- **OCI Database with PostgreSQL** for the app (Sequelize dialect)  
- **OCIR** for backend/frontend images  
- **Vault / Object Storage / SPIFFE / WIF / training Job** as opt-in modules (`enable_*`)  
- Azure GA narrative: [product tour]({{ '/product-tour/' | relative_url }}) + [Azure confidential computing deep dive]({% post_url 2026-08-17-azure-confidential-computing-deep-dive %}) when a tenancy isn’t up yet  

Honest maturity: **baseline apply path is in-repo**; live WAF/API Gateway, SCITT HA, and production Job submitters are still opt-in / operator follow-through. See [OCI design complete](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/deployment/OCI_DESIGN_COMPLETE.md) and the [marketplace listing checklist](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/deployment/OCI_MARKETPLACE_LISTING_CHECKLIST.md).

---

## Compliance without theater

GRC reviewers don’t want a slide that says “we’re secure.” They want **requirements ↔ controls ↔ evidence**.

CAN maintains a crosswalk of met / partial requirements to:

- NIST Cybersecurity Framework 2.0  
- NIST SP 800-53 Rev. 5  
- CIS Controls v8  

Read: [SECURITY_CONTROLS_NIST_CIS_MAPPING.md](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/compliance/SECURITY_CONTROLS_NIST_CIS_MAPPING.md) · [blog note]({% post_url 2026-07-28-nist-cis-controls-mapping %}).

That matrix is a **control map**, not a claim of SOC 2 / FedRAMP certification for a customer tenancy.

---

## What we deliberately do *not* claim

| Claim | Reality |
|-------|---------|
| “One-click multi-cloud production” | OCI/Azure have IaC depth; AWS/GCP are architecture-first |
| “SCITT always on in every deploy” | Local/opt-in; cloud HA is operator-led |
| “Keys never leave the enclave in every path” | Design + partial code; TEE attestation maturity varies by cloud |
| “Keycloak in production on OCI” | **False** — Identity Domains only |

Shipping an honest readiness doc is part of the product: [OCI_READINESS.md](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/deployment/OCI_READINESS.md), [AZURE_READINESS.md](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/deployment/AZURE_READINESS.md).

---

## Why this architecture

| Alternative | Failure mode | CAN stance |
|-------------|--------------|------------|
| Central data lake | Sovereignty + blast radius | Federated catalog; data stays with TDP |
| Email NDAs | No machine gate | Signed Ricardian state before train |
| Single IdP everywhere | Cloud lock-in + key sprawl | Cloud-native IdP + SPIFFE for workloads |
| App-only audit logs | Tamperable | Ledger claims + SIEM export |

The product bet is simple: **contract first, compute second, proof always.**

---

## Where to go next

| Goal | Link |
|------|------|
| UI tour | [Product tour]({{ '/product-tour/' | relative_url }}) |
| Docs home | [docs/README.md](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/README.md) |
| Architecture | [ARCHITECTURE.md](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/ARCHITECTURE.md) |
| SCITT | [SCITT_CCF_ARCHITECTURE.md](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/features/scitt/SCITT_CCF_ARCHITECTURE.md) |
| SPIFFE + OCI WIF | [post]({% post_url 2026-07-28-spiffe-spire-oci-wif %}) · [design](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/deployment/OCI_SPIFFE_SPIRE_WIF.md) |
| Source | [github.com/gitmujoshi/Confidential-AI-Network](https://github.com/gitmujoshi/Confidential-AI-Network) |

If you are evaluating CAN for a regulated collaboration, start with the product tour, then the multi-cloud security patterns doc, then an Azure staging subscription (or your preferred cloud) — not a slide deck alone.
