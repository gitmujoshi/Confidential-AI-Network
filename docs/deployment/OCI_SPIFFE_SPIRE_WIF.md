# OCI SPIFFE/SPIRE + IAM Workload Identity Federation

**Design and implementation reference** for combining **SPIFFE/SPIRE** (portable identity for services talking to each other under Zero Trust) with **Oracle Cloud Infrastructure (OCI) IAM Workload Identity Federation** and **Oracle Container Engine for Kubernetes (OKE) Workload Identity** — so training and platform workloads get short-lived access to Vault, Object Storage, container registry, and Logging **without static API keys**.

| Item | Value |
|------|--------|
| Status | **Design** — not coded; target for OCI staging/prod |
| Audience | CISOs and security leaders (trust model), platform / security engineers, clean-room operators |
| Maturity | Design (not coded) |
| Complements | [OCI IAM Identity Domains](OCI_IAM_AND_EDGE_CONFIG.md) (human single sign-on) — **does not replace** them |

### Terms used in this document

Spell these out for leadership readers; short forms appear later in engineer checklists only after this table. See also [GLOSSARY.md](../GLOSSARY.md).

| Term | Meaning |
|------|---------|
| **SPIFFE / SPIRE** | Open standard (**SPIFFE**) and software (**SPIRE**) that give each workload a portable identity and short-lived proof of that identity |
| **SVID** | **SPIFFE Verifiable Identity Document** — the certificate or token proving a workload’s SPIFFE ID |
| **Service Account** | Kubernetes identity for a pod or Job (not a human). Prefer over bare “SA” |
| **WIF** | **Workload Identity Federation** — turn a trusted external identity into a short-lived OCI session |
| **OKE Workload Identity** | Native OKE feature that maps a Kubernetes Service Account to OCI permissions |
| **UPST** | OCI **User Principal Session Token** — short-lived cloud session (typically ≤ 60 minutes) |
| **mTLS** | **Mutual TLS** — both sides of a connection authenticate with certificates |
| **IdP** | **Identity provider** for people (here: OCI IAM Identity Domains) |
| **TEE** | **Trusted Execution Environment** — hardware-isolated enclave for confidential compute |
| **CCR** | **Confidential Clean Room** — isolated training environment |
| **DEK / MEK** | **Data / Model Encryption Keys** released only to authorized, attested workloads |

### Document set

| Document | Role |
|----------|------|
| **This doc** | SPIFFE/SPIRE + OCI Workload Identity Federation design, trust model, phased implementation |
| [OCI_SECURITY_ARCHITECTURE.md](../production/OCI_SECURITY_ARCHITECTURE.md) | Overall OCI security topology + env runbook |
| [OCI_IAM_AND_EDGE_CONFIG.md](OCI_IAM_AND_EDGE_CONFIG.md) | Human identity-provider groups, dynamic groups, edge tokens |
| [OCI_FEATURES_AND_CONFIGURATION.md](OCI_FEATURES_AND_CONFIGURATION.md) | Feature catalog + env vars |
| [PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md](../guides/PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md) | Encryption-key and CAN attestation model |
| [config.oci.env.example](../../config/examples/config.oci.env.example) | Target env template |

**Identity layers (do not conflate):**

| Layer | Mechanism | Who / what | Purpose |
|-------|-----------|------------|---------|
| **A. Human / app single sign-on** | OCI IAM Identity Domains (OpenID Connect) | TDC, TDP, CCRP, AppAdmin users | Portal login, API role claims |
| **B. Platform ↔ OCI control plane** | OKE Workload Identity **and/or** OCI IAM Workload Identity Federation | Pods, Jobs, CI | Vault, Object Storage, registry — **no static API keys** |
| **C. Workload ↔ workload** | SPIFFE/SPIRE (X.509 or JWT identity documents) | Backend, trainer, CAN clean room, SCITT, External Secrets | Mutual TLS, attested peer identity, multi-cloud portable IDs |

**Keycloak** remains **local docker-compose / Playwright only**. Do not deploy Keycloak on OCI as a SPIRE substitute or application identity provider.

---

## 1. Why both SPIFFE/SPIRE and OCI Workload Identity Federation?

They solve **different** problems:

| Question a security leader asks | SPIFFE/SPIRE | OCI Workload Identity Federation / OKE Workload Identity |
|--------------------------------|--------------|------------------------------------------------------------|
| “Is this peer the **training Job’s Kubernetes Service Account** I expect?” | Yes (SPIFFE ID + verifiable identity document) | No (OCI cloud principal only) |
| “May this pod read the `cms-dev-datasets` bucket?” | Indirect (via a broker) | Yes (IAM policy on the cloud principal) |
| “Will the same identity work on OKE, AKS, GKE, or a bare clean room?” | Yes | Cloud-specific |
| “Can we get a short-lived OCI session without API keys?” | Via JWT identity document → federation exchange | Native |
| “Before we release data or model encryption keys, can peers prove who they are (and ideally TEE state)?” | Strong fit for peer identity | Insufficient alone |

**Recommended composition for Confidential AI Network on OCI:**

1. **SPIRE** issues verifiable identity documents after node/workload attestation (Kubernetes Service Account, or a TEE attestor for the confidential clean room).
2. **Service mesh or application mutual TLS** uses X.509 identity documents for east-west traffic (backend ↔ trainer ↔ CAN escrow).
3. **OCI resource access** uses either:
   - **Path N (native):** OKE enhanced-cluster Workload Identity for pods that only need OCI APIs, **or**
   - **Path F (federation):** SPIRE **JWT identity document** → OCI IAM **Identity Propagation Trust** → short-lived **User Principal Session Token**, then call OCI APIs with proof-of-possession.

Use **Path N** for standard OKE apps (External Secrets, backend Object Storage). Use **Path F** when the same SPIFFE identity must work **off OKE** (CI, multi-cloud clean rooms, self-managed Kubernetes) or when you want a **single portable ID** mapped into OCI via trust rules.

```
┌─────────────────────────────────────────────────────────────────┐
│ Humans: Identity Domain OpenID Connect → API Gateway → backend  │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ SPIRE Server (trust domain: can.oci.{env})                      │
│   ├─ Agents on OKE nodes / clean-room nodes                     │
│   ├─ X.509 identity document → mutual TLS (mesh or app)         │
│   └─ JWT identity document → OCI federation → session → Vault   │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ Optional parallel: OKE Workload Identity (native short-lived    │
│   session) for pods that do not need portable SPIFFE federation │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Design principles

1. **Least privilege per SPIFFE ID** — one ID per Kubernetes Service Account × namespace × environment (or finer for CAN sessions).
2. **No long-lived OCI API keys in pods** — prefer OKE Workload Identity or federation session tokens (≤ 60 minutes).
3. **Attestation before identity** — SPIRE only issues identity documents after configured selectors (Kubernetes Service Account, node, optionally TEE).
4. **Impersonation to Service Users** — federation maps JWT identity claims → Identity Domain **Service Users** with IAM group membership (Vault reader, Object Storage writer, etc.).
5. **Separate trust domains per environment** — `spiffe://can.dev.oci.example`, `spiffe://can.prod.oci.example` (or path-segment env); never share production SPIRE keys with development.
6. **Human identity provider stays Identity Domains** — SPIRE is not an end-user login path.
7. **CAN key release** — escrow / confidential clean room may require SPIFFE peer authentication **and** TEE attestation evidence; OCI federation alone does not prove enclave state.

---

## 3. SPIFFE ID taxonomy (CAN on OCI)

Trust domain (example): `can.{env}.oci.dpi-apps.space`  
SPIFFE ID form: `spiffe://{trust-domain}/{path}`

| Workload | Example SPIFFE ID | Kubernetes Service Account / selector | OCI Service User (federation) | Typical OCI rights |
|----------|-------------------|---------------------------------------|-------------------------------|--------------------|
| Backend API | `…/ns/contract-management/sa/backend` | `backend` | `svc-can-{env}-backend` | Vault read (app secrets), Object Storage read datasets/artifacts metadata |
| Training Job | `…/ns/cms-training/sa/training-job` | `training-job-sa` | `svc-can-{env}-trainer` | Object Storage read ciphertext; write training outputs |
| CAN Job Coordination / escrow | `…/ns/cms-can/sa/can-jcs` | `can-jcs` | `svc-can-{env}-jcs` | Minimal; prefer no broad Vault master-key access |
| CAN clean-room agent | `…/ns/cms-can/sa/can-ccr` | `can-ccr` | `svc-can-{env}-ccr` | Session-scoped Object Storage; attestation-gated |
| External Secrets | `…/ns/external-secrets/sa/eso` | `external-secrets` | `svc-can-{env}-eso` | Vault secret read only (mapped paths) |
| SCITT CCF client | `…/ns/scitt/sa/scitt-client` | `scitt-client` | `svc-can-{env}-scitt` | Narrow network + optional Object Storage receipt store |
| CI deploy (off-cluster) | `…/ci/github-actions/{repo}` | Token from OpenID Connect | `svc-can-{env}-cicd` | Registry push, OKE deploy (dev/test) |

**Path conventions:**

```
spiffe://can.{env}.oci.example/ns/{namespace}/sa/{serviceAccount}
spiffe://can.{env}.oci.example/ci/{provider}/{subject}
spiffe://can.{env}.oci.example/ccr/{ccrProvider}/{sessionId}   # optional session-scoped
```

Map SPIFFE `sub` (full ID) or a stable claim (`spiffe_id`) in the JWT identity document into federation **impersonation rules**.

---

## 4. Architecture

### 4.1 In-cluster (OKE) — Path N + SPIRE mutual TLS

```
Pod (backend)
  ├─ SPIRE Agent sidecar / CSI → X.509 identity document
  ├─ Mutual TLS to trainer / CAN (SPIFFE authorization)
  └─ OCI SDK: OKE Workload Identity → short-lived session → Vault / Object Storage
```

Use when pods run on **OKE enhanced clusters** and only need OCI APIs. SPIRE still provides portable peer identity for CAN.

### 4.2 Federated OCI access — Path F (SPIRE JWT identity document → Workload Identity Federation)

```
Workload
  → SPIRE Agent: JWT identity document (audience = OCI trust / token-exchange)
  → Identity Domain /oauth2/v1/token
       grant_type = token-exchange
       subject_token = JWT identity document
       requested_token_type = urn:oci:token-type:oci-upst
       + proof-of-possession public key
  → User Principal Session Token (≤ 60m)
  → OCI APIs (Vault, Object Storage, …) signed with proof-of-possession private key
```

**Trust configuration (one-time, Identity Domain admin):**

| Field | Target value |
|-------|--------------|
| `issuer` | SPIRE OIDC Discovery issuer (SPIRE OIDC Discovery Provider) |
| `publicKeyEndpoint` | SPIRE JWKS URL (cluster-internal or private LB; or pin `publicCertificate`) |
| `type` | `JWT` |
| `oauthClients` | Token-exchange confidential app client ID |
| `allowImpersonation` | `true` (recommended) |
| `impersonationServiceUsers` | Rules on `sub` / SPIFFE path → Service User OCIDs |
| `clientClaimName` / `Values` | Optional extra gate (e.g. `aud`) |
| Session duration | Cap ≤ 60 minutes |

References: [OCI Workload Identity Federation (A-Team)](https://www.ateam-oracle.com/workload-identity-federation), Identity Propagation Trust SCIM APIs, token-exchange grant.

### 4.3 CAN escrow / confidential clean room (attested)

```
TDC/TDP portal (Identity Domain user token)
  → CAN Job Coordination Service API
  → Clean-room workload obtains SPIFFE identity document (TEE / Kubernetes attestor)
  → Peer mutual TLS: Job Coordination ↔ clean room (SPIFFE ID allowlist for contract session)
  → Optional: clean room exchanges JWT identity document → session token for Object Storage ciphertext fetch
  → DEK/MEK release only after attestation + contract checks
     (SPIFFE proves which workload is calling; attestation proves Trusted Execution Environment claims)
```

SPIFFE does **not** replace CAN attestation providers (`CAN_ATTESTATION_PROVIDER`). It **complements** them for network-level principal binding.

### 4.4 Multi-cloud CCRP (future)

Same SPIFFE trust domain (or federated SPIRE) across Azure/GCP clean rooms; each cloud’s workload identity federation trusts SPIRE OpenID Connect:

| Cloud | Federation target |
|-------|-------------------|
| OCI | Identity Propagation Trust → User Principal Session Token |
| Azure | Entra federated credential → AAD token |
| GCP | Workload Identity Federation → service-account access token |

App policies authorize by **SPIFFE ID**; cloud policies authorize by **mapped cloud principal**.

---

## 5. Component design

### 5.1 SPIRE Server

| Item | Recommendation |
|------|----------------|
| Placement | `cms-{env}-compute` OKE namespace `spire` (or dedicated identity node pool) |
| HA | ≥ 2 replicas; datastore = SQL (ADB) or embedded with PVC only for **dev** |
| Trust domain | `can.{env}.oci.<org-domain>` |
| Upstream authority | Optional nested SPIRE for multi-cluster |
| OIDC Discovery Provider | Enabled for WIF (exposes `/.well-known/openid-configuration` + JWKS) |
| Network | Private; JWKS reachable from Identity Domain **or** pin cert in trust config |

### 5.2 SPIRE Agent

| Mode | Use |
|------|-----|
| DaemonSet on OKE nodes | Standard workloads |
| Nested / join token | Ephemeral Jobs |
| TEE / custom attestor | Confidential CCR nodes (phase 2+) |

Workload API socket mounted into pods that need SVIDs (`/spire-agent-socket` or CSI driver).

### 5.3 Registration entries (examples)

```text
# Backend
spiffe_id: spiffe://can.dev.oci.example/ns/contract-management/sa/backend
selectors: k8s:ns:contract-management k8s:sa:backend

# Training job
spiffe_id: spiffe://can.dev.oci.example/ns/cms-training/sa/training-job
selectors: k8s:ns:cms-training k8s:sa:training-job-sa
```

TTL: X.509 identity document 1h (rotate aggressively); JWT identity document ≤ 15–30m for exchange.

### 5.4 Identity Domain artifacts (Workload Identity Federation)

| Artifact | Purpose |
|----------|---------|
| Domain Admin OAuth client | Create trusts + Service Users (break-glass / Terraform) |
| Token Exchange OAuth client | Workloads authenticate to `/oauth2/v1/token` |
| Service Users `svc-can-{env}-*` | Impersonation targets; members of IAM groups |
| IdentityPropagationTrust | Trust SPIRE issuer + JWKS + impersonation rules |

### 5.5 IAM policies (sketch)

Bind **groups** that Service Users belong to (not SPIFFE strings — OCI IAM sees the Service User / session-token principal):

```text
Allow group cms-{env}-spiffe-backend to read secret-family in compartment cms-{env}-security
Allow group cms-{env}-spiffe-trainer to read objects in compartment cms-{env}-data where target.bucket.name='cms-{env}-datasets'
Allow group cms-{env}-spiffe-trainer to manage objects in compartment cms-{env}-data where target.bucket.name='cms-{env}-training-outputs'
```

Align group names with [OCI_IAM_AND_EDGE_CONFIG.md](OCI_IAM_AND_EDGE_CONFIG.md) dynamic groups; prefer **Service User + group** for Path F, **workload identity + policy conditions** for Path N.

### 5.6 Application integration

| Component | Change (target) |
|-----------|-----------------|
| Backend | Optional mutual-TLS client cert from SPIRE Workload API; OCI SDK credential provider: OKE Workload Identity or federation session refresh |
| Training runner | Fetch identity document; mutual TLS to backend callbacks; Object Storage via Workload Identity or federation |
| CAN Job Coordination / clean room | Allowlist peer SPIFFE IDs per contract/session; reject unsigned peers |
| External Secrets | Prefer Path N; or External Secrets Operator + federation if off-cluster |
| Terraform | Modules: `spire`, `wif_trust` (IdentityPropagationTrust), Service Users |

---

## 6. Configuration (target env vars)

Add to OCI runtime ConfigMap / Vault (see also [config.oci.env.example](../../config/examples/config.oci.env.example)):

| Variable | Example | Description |
|----------|---------|-------------|
| `SPIFFE_ENABLED` | `true` | Master switch for SPIFFE client usage |
| `SPIFFE_TRUST_DOMAIN` | `can.dev.oci.example` | Trust domain |
| `SPIFFE_SOCKET_PATH` | `/spire-agent-socket/agent.sock` | Workload API |
| `SPIFFE_SERVER_ADDRESS` | `spire-server.spire.svc:8081` | Agent→server (cluster) |
| `SPIRE_OIDC_ISSUER` | `https://oidc.spire.dev.example` | Issuer registered in WIF trust |
| `SPIRE_OIDC_JWKS_URL` | `https://oidc.spire.dev.example/keys` | JWKS for IdentityPropagationTrust |
| `OCI_WIF_ENABLED` | `true` | Use Path F token exchange |
| `OCI_WIF_DOMAIN_URL` | Identity Domain URL | Token endpoint base |
| `OCI_WIF_TOKEN_EXCHANGE_CLIENT_ID` | GUID | Confidential client |
| `OCI_WIF_TOKEN_EXCHANGE_CLIENT_SECRET` | Vault ref | Never in git |
| `OCI_WIF_SUBJECT_TOKEN_TYPE` | `jwt` | JWT-SVID |
| `OCI_WIF_REQUESTED_TOKEN_TYPE` | `urn:oci:token-type:oci-upst` | UPST |
| `OCI_AUTH_MODE` | `workload` \| `wif` \| `instance_principal` | SDK credential selection |
| `OCI_OKE_WORKLOAD_IDENTITY` | `true` | Prefer Path N when on OKE |
| `CAN_SPIFFE_PEER_ALLOWLIST` | CSV of SPIFFE IDs | CCR/JCS peer gate |
| `CAN_REQUIRE_SPIFFE_MTLS` | `false` → `true` in staging+ | Enforce mTLS for CAN routes |

Local demos: leave `SPIFFE_ENABLED=false`; Keycloak + docker train unchanged.

---

## 7. Implementation plan

### Phase 0 — Prerequisites (1–3 days)

- [ ] OKE **enhanced** cluster (for Path N) in `cms-{env}-compute`
- [ ] Identity Domain with admin rights to create OAuth apps + Propagation Trusts
- [ ] Decide trust domain DNS / private hostname for SPIRE OIDC
- [ ] Confirm no Keycloak on OCI

### Phase 1 — SPIRE platform (1–2 weeks)

Scaffolding **in repo** (opt-in):

| Path | Purpose |
|------|---------|
| [`deployment/oci/helm/spire/`](../../deployment/oci/helm/spire/) | Helm values + ClusterSPIFFEID manifests + smoke Job |
| [`deployment/oci/terraform/modules/spire/`](../../deployment/oci/terraform/modules/spire/) | Namespace, Helm release, CRDs, `spiffe-config` ConfigMap |
| Root `enable_spire` | `terraform.tfvars` flag (default `false`) |

- [x] Helm/Terraform scaffolding: SPIRE Server + Agent + `spire` namespace
- [x] Register entry manifests for `backend` and `training-job-sa` (ClusterSPIFFEID)
- [ ] Issue X.509-SVIDs on a live OKE cluster; smoke mTLS between two debug pods
- [x] Enable SPIRE OIDC Discovery Provider in values (ClusterIP; private LB later)
- [x] Document SPIFFE ID inventory (ConfigMap `spiffe-id-inventory` + module output)

```hcl
enable_spire = true
spiffe_trust_domain = "can.dev.oci.example"
```

```bash
kubectl -n spire get pods
kubectl -n contract-management get configmap spiffe-config -o yaml
kubectl apply -f deployment/oci/helm/spire/manifests/smoke-job.yaml
```

### Phase 2 — OCI Path N (parallel, 3–5 days)

- [ ] Annotate Kubernetes Service Accounts for OKE Workload Identity
- [ ] IAM policies for `cms-{env}-oke-workloads` / Service Account conditions
- [ ] Backend + ESO read Vault **without** API keys
- [ ] Keep SPIRE for peer mutual TLS even when Path N supplies OCI credentials

### Phase 3 — OCI Path F / Workload Identity Federation (1–2 weeks)

Scaffolding **in repo** (opt-in):

| Path | Purpose |
|------|---------|
| [`deployment/oci/terraform/modules/wif/`](../../deployment/oci/terraform/modules/wif/) | Token-exchange app, Service Users, IdentityPropagationTrust, K8s `oci-wif-*` |
| Root `enable_wif` | Requires Identity Domain URL + SPIRE issuer/JWKS (or pinned cert) |

- [x] Terraform: Domain Token Exchange OAuth client (no admin role)
- [x] Terraform: Service Users `svc-can-{env}-backend` / `trainer`
- [x] Terraform: `IdentityPropagationTrust` with SPIRE issuer + JWKS + exact `sub` impersonation
- [x] K8s ConfigMap/Secret `OCI_WIF_*`
- [ ] Workload library: JWT identity document → token-exchange → User Principal Session Token + proof-of-possession key (application code)
- [ ] Integrate OCI SDK custom credential provider
- [ ] Validate Object Storage + Vault calls; confirm Audit shows Service User
- [ ] Classic IAM policies binding Service Users to Vault/OSS compartments

```hcl
enable_spire = true
enable_wif   = true
# If JWKS is private to the cluster, pin the SPIRE OIDC cert instead:
# wif_spire_public_certificate = file("spire-oidc.pem")
# wif_spire_jwks_url            = ""
```

### Phase 4 — CAN / training hardening (2–4 weeks)

- [ ] Trainer Job: identity document + mutual-TLS callbacks to backend
- [ ] CAN Job Coordination / clean room: peer SPIFFE allowlist; optional session SPIFFE IDs
- [ ] Gate DEK/MEK release on attestation **and** SPIFFE peer match
- [ ] Turn on `CAN_REQUIRE_SPIFFE_MTLS` in staging
- [ ] Runbooks for identity-document outage / SPIRE Server restore

### Phase 5 — Prod + multi-cloud (as needed)

- [ ] Separate trust domains; break-glass procedures
- [ ] Prod Deny overlays if SPIRE OIDC exposed beyond private network
- [ ] Federate Azure/GCP workload identity to same SPIRE OpenID Connect for clean-room portability
- [ ] SIEM: Audit session-token usage + SPIRE registration events

---

## 8. Terraform / Helm sketch

```
deployment/oci/
  helm/spire/                 # Phase 1 values + ClusterSPIFFEID + smoke Job
  terraform/
    modules/
      spire/                  # Phase 1 — Helm + ConfigMaps + CRDs (implemented)
      wif/                    # Phase 3 — IdentityPropagationTrust + Service Users (implemented)
      identity/               # Human IdP (Identity Domains)
      kubernetes_resources/
```

**`modules/spire` (Phase 1):** set `enable_spire = true` in root tfvars. Outputs: `trust_domain`, `oidc_issuer`, `oidc_jwks_url`, `spiffe_id_inventory`.

**`modules/wif` (Phase 3):** set `enable_wif = true` after SPIRE OIDC is up. Inputs consume SPIRE + Identity Domain URL. Outputs: `token_exchange_client_id`, `service_user_*`, `trust_name`, K8s `oci-wif-config` / `oci-wif-secret`.

| Variable | Description |
|----------|-------------|
| `spire_oidc_issuer` | Issuer URL (from `module.spire`) |
| `spire_jwks_url` | JWKS (or empty + `spire_public_certificate`) |
| `spiffe_id_inventory` | map(role → spiffe_id) for impersonation rules |
| `environment` | `dev` \| `test` \| … |

Wire into pods: envFrom `spiffe-config` + `oci-wif-config` + secret `oci-wif-secret`; `OCI_AUTH_MODE=wif`.

---

## 9. Security considerations

| Risk | Mitigation |
|------|------------|
| SPIRE Server compromise | HA + HSM/Vault for CA; network isolation; audit registration APIs |
| Stolen JWT identity document | Short TTL; audience bound to OCI trust; proof-of-possession on session token; revoke via SPIRE |
| Over-broad impersonation rules | Prefer exact `sub eq spiffe://…`; avoid `sub eq *` in prod |
| JWKS public exposure | Private endpoint or pin cert in trust; WAF allowlist Identity Domain egress |
| Confused deputy (token exchange client) | Restrict `oauthClients`; store client secret in Vault |
| Mixing human tokens and workload identity documents | Separate issuers; never accept Identity Domain user tokens as SPIRE identity documents |
| CAN without attestation | SPIFFE is not TEE proof; keep `CAN_ATTESTATION_PROVIDER` path |

---

## 10. Validation checklist

### SPIRE

- [ ] Agent healthy on all nodes; Workload API socket present in test pod
- [ ] `spire-server entry show` lists backend + trainer IDs
- [ ] X.509 identity document rotates before expiry
- [ ] OpenID Connect discovery returns issuer + JWKS; keys verify a JWT identity document

### Path N (OKE Workload Identity)

- [ ] Pod without API key lists bucket / reads Vault secret
- [ ] Audit log principal = workload identity

### Path F (Workload Identity Federation)

- [ ] Token exchange returns User Principal Session Token
- [ ] Session-token calls succeed; fail when SPIFFE ID not in impersonation map
- [ ] Session token expires ≤ 60m; refresh path works
- [ ] Proof-of-possession signature required (unsigned requests rejected)

### CAN / app

- [ ] Trainer ↔ backend mutual TLS succeeds only for allowlisted SPIFFE IDs
- [ ] Portal human login still Identity Domain only
- [ ] Local Keycloak E2E still passes with `SPIFFE_ENABLED=false`

---

## 11. Non-goals

- Replacing **OCI IAM Identity Domains** for interactive user login
- Running **Keycloak** on OCI for workload identity
- Using SPIFFE as the sole DEK/MEK release condition without attestation
- Committing Token Exchange client secrets or SPIRE CA keys to git

---

## 12. Related Oracle / SPIFFE references

- [Granting workloads access to OCI resources (OKE Workload Identity)](https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contenggrantingworkloadaccesstoresources.htm)
- [Workload Identity Federation (OCI A-Team)](https://www.ateam-oracle.com/workload-identity-federation)
- [SPIFFE / SPIRE](https://spiffe.io/) — Workload API, JWT-SVID, OIDC Discovery Provider
- Internal: [OCI_IAM_AND_EDGE_CONFIG.md](OCI_IAM_AND_EDGE_CONFIG.md) §1.2 dynamic groups, §8 OKE RBAC

---

## 13. Changelog

| Date | Change |
|------|--------|
| 2026-07-28 | Phase 3 `modules/wif` (Propagation Trust, Service Users, token-exchange app) |
| 2026-07-28 | Phase 1 Terraform/Helm scaffolding (`modules/spire`, `helm/spire`) |
| 2026-07-28 | Initial design + implementation doc (SPIFFE/SPIRE + OCI Workload Identity Federation / OKE Workload Identity) |
| 2026-07-28 | Leadership-facing language: expand SA, SVID, WIF, UPST, mTLS, and related abbreviations |
