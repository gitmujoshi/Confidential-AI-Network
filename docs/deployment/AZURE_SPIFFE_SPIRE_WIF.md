# Azure SPIFFE/SPIRE + Entra Workload Identity Federation

**Design and implementation reference** for combining **SPIFFE/SPIRE** (portable Zero Trust workload identity) with **Microsoft Entra ID Workload Identity Federation** and **AKS Workload Identity** — so CAN training and platform workloads reach Key Vault, Blob Storage, ACR, and Azure APIs with **short-lived tokens** and **no static secrets in pods**.

| Item | Value |
|------|--------|
| Status | **Design** — not coded as Azure Terraform/Helm yet; OCI has prior scaffolding |
| Audience | CISOs (trust model), platform / security engineers, TSP / CCRP operators |
| Maturity | Design (target for Azure pilot → prod) |
| Complements | [AZURE_IAM_AND_EDGE_CONFIG.md](AZURE_IAM_AND_EDGE_CONFIG.md) (human Entra SSO) — **does not replace** it |
| Microsoft tutorial | [Federate SPIFFE/SPIRE with Entra ID](https://learn.microsoft.com/entra/workload-id/workload-identity-federation-spiffe-spire) |

### Terms

| Term | Meaning |
|------|---------|
| **SPIFFE / SPIRE** | Open standard / software that issues each workload a portable identity and short-lived proof |
| **SVID** | SPIFFE Verifiable Identity Document (X.509 or JWT) |
| **AKS Workload Identity** | Native AKS feature: Kubernetes Service Account → Entra federated identity → Azure RBAC |
| **Entra WIF** | Workload Identity Federation — exchange an external JWT (e.g. SPIFFE JWT-SVID) for an Entra access token |
| **Federated identity credential** | Entra config: `issuer` + `subject` (SPIFFE ID) + `audiences: ["api://AzureADTokenExchange"]` |
| **mTLS** | Mutual TLS using X.509 SVIDs between workloads |
| **TEE** | Trusted Execution Environment — required for DEK/MEK release; SPIFFE alone is not enough |

### Document set

| Document | Role |
|----------|------|
| **This doc** | SPIFFE/SPIRE + Azure / Entra federation design |
| [AZURE_SECURITY_ARCHITECTURE.md](../production/AZURE_SECURITY_ARCHITECTURE.md) | Azure topology + crypto §16 |
| [AZURE_FEATURES_AND_CONFIGURATION.md](AZURE_FEATURES_AND_CONFIGURATION.md) | Feature catalog + env vars |
| [AZURE_READINESS.md](AZURE_READINESS.md) | Gap analysis |
| OCI twin | [OCI_SPIFFE_SPIRE_WIF.md](OCI_SPIFFE_SPIRE_WIF.md) |
| Blog | [SPIFFE/SPIRE on Azure](https://gitmujoshi.github.io/Confidential-AI-Network/security/2026/08/17/spiffe-spire-azure-wif/) |

**Identity layers (do not conflate):**

| Layer | Mechanism | Who / what | Purpose |
|-------|-----------|------------|---------|
| **A. Human / app SSO** | Microsoft Entra ID (MSAL / JWT) | TDC, TDP, TSP, AppAdmin, Auditor | Portal login, API roles |
| **B. Platform ↔ Azure APIs** | AKS Workload Identity **and/or** Entra WIF via SPIFFE JWT-SVID | Pods, Jobs, CI | Key Vault, Blob, ACR — **no static keys** |
| **C. Workload ↔ workload** | SPIFFE/SPIRE (X.509 SVID + mTLS) | Backend, trainer, CAN JCS, CCR, SCITT, External Secrets | Peer Zero Trust |

**Keycloak** remains **local docker-compose / Playwright only**. Do not deploy Keycloak on Azure as a SPIRE or human IdP substitute.

---

## 1. Why both SPIFFE/SPIRE and Azure Workload Identity?

| Security question | SPIFFE/SPIRE | AKS Workload Identity / Entra WIF |
|-------------------|--------------|-------------------------------------|
| “Is this peer the **training Job’s SA** I expect?” | Yes (SPIFFE ID + SVID) | No (Azure principal only) |
| “May this pod read `can-{env}-datasets` Blob?” | Indirect (via federated Entra principal) | Yes (Azure RBAC) |
| “Same ID on AKS, OKE, GKE, or off-cluster CCR?” | Yes | Cloud-specific |
| “Short-lived Azure access without secrets?” | Via JWT-SVID → Entra token exchange | Native (Path N) or federation (Path F) |
| “Before DEK/MEK release, prove peer identity?” | Strong for peer auth | Insufficient alone (need TEE / SKR too) |

**Recommended composition for CAN on Azure:**

1. **SPIRE** issues SVIDs after Kubernetes (and optionally TEE) attestation.  
2. **East-west** traffic uses **X.509 SVID mTLS** (mesh or app).  
3. **Azure resource access** uses either:  
   - **Path N (native):** AKS Workload Identity — SA annotated → user-assigned MI / app → Key Vault / Blob RBAC.  
   - **Path F (federation):** SPIRE **JWT-SVID** (`aud=api://AzureADTokenExchange`) → Entra **federated identity credential** → access token → Azure SDK (`ClientAssertionCredential`).

Use **Path N** for standard AKS apps (External Secrets, backend Blob). Use **Path F** when the same SPIFFE ID must work **off AKS** (CI, multi-cloud clean room, self-managed K8s) or when you want one portable ID mapped into Entra.

```
┌─────────────────────────────────────────────────────────────────┐
│ Humans: Entra OIDC → APIM / App Gateway → backend               │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ SPIRE Server (trust domain: can.azure.{env})                    │
│   ├─ Agents on AKS nodes / confidential node pools              │
│   ├─ X.509 SVID → mTLS (backend ↔ trainer ↔ CAN CCR)            │
│   └─ JWT-SVID → Entra WIF → access token → Key Vault / Blob     │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ Optional parallel: AKS Workload Identity (native) for pods that │
│   only need Azure APIs and do not need portable SPIFFE federation│
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Design principles

1. **Least privilege per SPIFFE ID** — one ID per SA × namespace × environment (finer for CCR sessions).  
2. **No long-lived Azure client secrets in pods** — Path N or Path F only.  
3. **Attestation before identity** — SPIRE selectors (K8s SA, node; optional TEE).  
4. **Exact subject match** on Entra federated credentials — **never** wildcard SPIFFE subjects in prod.  
5. **Separate trust domains per env** — e.g. `spiffe://can.dev.azure.example` vs prod.  
6. **Human IdP stays Entra** — SPIRE is not end-user login.  
7. **CAN key release** — DEK/MEK need SPIFFE peer auth **and** Azure Attestation / SKR; Entra WIF alone does not prove enclave state.

---

## 3. SPIFFE ID taxonomy (CAN on Azure)

Trust domain (example): `can.{env}.azure.example`  
Form: `spiffe://{trust-domain}/{path}`

| Workload | Example SPIFFE ID | K8s SA | Entra principal (Path F) | Typical Azure rights |
|----------|-------------------|--------|--------------------------|----------------------|
| Backend API | `…/ns/contract-management/sa/backend` | `backend` | `can-{env}-backend-wi` | Key Vault Secrets User (app paths); Blob read metadata |
| Training Job | `…/ns/cms-training/sa/training-job` | `training-job` | `can-{env}-trainer-wi` | Blob read ciphertext; write training outputs |
| CAN JCS / escrow | `…/ns/cms-can/sa/can-jcs` | `can-jcs` | `can-{env}-jcs-wi` | Minimal; no vault master keys |
| CCR / confidential agent | `…/ns/cms-can/sa/can-ccr` | `can-ccr` | `can-{env}-ccr-wi` | Session-scoped Blob; SKR-gated unwrap |
| External Secrets | `…/ns/external-secrets/sa/eso` | `external-secrets` | `can-{env}-eso-wi` | Key Vault Get/List only |
| SCITT client | `…/ns/scitt/sa/scitt-client` | `scitt-client` | `can-{env}-scitt-wi` | Narrow network + optional receipt store |
| CI (off-cluster) | `…/ci/github-actions/{repo}` | N/A | `can-{env}-cicd-wi` | AcrPush; deploy to non-prod |

```
spiffe://can.{env}.azure.example/ns/{namespace}/sa/{serviceAccount}
spiffe://can.{env}.azure.example/ci/{provider}/{subject}
spiffe://can.{env}.azure.example/ccr/{tspId}/{sessionId}
```

---

## 4. Architecture

### 4.1 Path N — AKS Workload Identity + SPIRE mTLS

```
Pod (backend)
  ├─ SPIRE Agent → X.509 SVID → mTLS to trainer / CAN
  └─ Azure SDK: AKS Workload Identity → Entra token → Key Vault / Blob
```

Enable on cluster: OIDC issuer + workload identity; annotate SA with client-id; federate SA subject to user-assigned MI.

### 4.2 Path F — SPIRE JWT-SVID → Entra federation

```
Workload
  → SPIRE Workload API: JWT-SVID (aud = api://AzureADTokenExchange)
  → Entra token endpoint (client assertion = JWT-SVID)
  → Access token → Blob / Key Vault / ARM
```

Federated identity credential (per workload):

| Field | Example |
|-------|---------|
| `issuer` | SPIRE OIDC discovery URL (e.g. `https://oidc.can.dev.example`) |
| `subject` | Exact SPIFFE ID |
| `audiences` | `["api://AzureADTokenExchange"]` |

SDK pattern: Azure Identity **`ClientAssertionCredential`** with a callback that fetches a fresh JWT-SVID (see [Microsoft tutorial](https://learn.microsoft.com/entra/workload-id/workload-identity-federation-spiffe-spire)).

### 4.3 Confidential clean room

```
CCR (confidential VM / container)
  → SPIRE (optional TEE attestor) → SVID for peer mTLS to JCS
  → Path F or MSI inside TEE for Blob ciphertext pull
  → Azure Attestation + SKR / attested TLS for DEK/MEK (separate plane)
```

SPIFFE proves *which workload*; Attestation/SKR proves *what enclave*. Both for production CAN claims.

---

## 5. Phased implementation (target)

| Phase | Deliverable | Repo target |
|-------|-------------|-------------|
| **0** | Design (this doc) + blog | Done |
| **1** | AKS OIDC + Workload Identity UAMIs (Path N) | **Done** — `modules/workload_identity`, `enable_workload_identity` |
| **2** | SPIRE Helm values + TF namespace scaffold | **Partial** — `enable_spire` + `deployment/azure/helm/spire` |
| **3** | Path F: SPIRE OIDC Discovery + Entra federated credentials for SPIFFE subjects | Planned |
| **4** | CCR session SPIFFE IDs + SKR policy binding | Confidential compute module |

---

## 6. Env / settings (target)

| Variable | Example | Notes |
|----------|---------|-------|
| `SPIFFE_TRUST_DOMAIN` | `can.dev.azure.example` | Per env |
| `SPIRE_ENABLED` | `true` | Off until Phase 1 |
| `SPIRE_OIDC_DISCOVERY_URL` | `https://oidc.…` | Path F issuer |
| `AZURE_USE_WORKLOAD_IDENTITY` | `true` | Path N |
| `AZURE_USE_SPIFFE_FEDERATION` | `true` | Path F |
| `AZURE_FEDERATION_AUDIENCE` | `api://AzureADTokenExchange` | Must match FIC |

Add to [config.azure.env.example](../../config/examples/config.azure.env.example) when wiring begins.

---

## 7. Threat notes

| Threat | Mitigation |
|--------|------------|
| Stolen long-lived SP secret | Eliminate — Path N/F only |
| Wildcard federated subject | Exact SPIFFE ID per principal |
| Compromised node issues wrong SVID | SPIRE selectors + node attestation; private AKS |
| Using Entra WIF as “TEE proof” | Reject — pair with Attestation/SKR for DEK/MEK |
| Trust domain shared across prod/dev | Separate SPIRE roots and Entra FICs |

---

## 8. Checklist

- [ ] AKS OIDC issuer + workload identity enabled  
- [ ] SPIRE trust domain per env; OIDC Discovery reachable only as designed  
- [ ] ClusterSPIFFEID for backend, trainer, can-jcs, can-ccr, eso  
- [ ] Path N RBAC on Key Vault / Blob for pilot  
- [ ] Path F federated credentials with exact subjects  
- [ ] No client secrets in pod env for Azure SDK  
- [ ] Document which path each workload uses  
- [ ] Pen test: wrong SPIFFE ID cannot exchange for trainer Blob rights  

---

## 9. References

- [Entra — Federate SPIFFE/SPIRE](https://learn.microsoft.com/entra/workload-id/workload-identity-federation-spiffe-spire)  
- [AKS Workload Identity](https://learn.microsoft.com/azure/aks/workload-identity-overview)  
- [Workload identity federation overview](https://learn.microsoft.com/entra/workload-id/workload-identity-federation)  
- [Three identity planes (blog)](https://gitmujoshi.github.io/Confidential-AI-Network/security/2026/07/28/three-identity-planes/)  
- [OCI SPIFFE/SPIRE + WIF](OCI_SPIFFE_SPIRE_WIF.md)  

← [Deployment](README.md) · [Azure security architecture](../production/AZURE_SECURITY_ARCHITECTURE.md) · [Documentation home](../README.md)
