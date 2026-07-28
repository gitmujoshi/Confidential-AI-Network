# OCI SPIFFE/SPIRE + IAM Workload Identity Federation

**Design and implementation reference** for combining **SPIFFE/SPIRE** (workload identity for service-to-service Zero Trust) with **OCI IAM Workload Identity Federation (WIF)** and **OKE Workload Identity** (short-lived access to OCI APIs: Vault, Object Storage, OCIR, Logging).

| Item | Value |
|------|--------|
| Status | **Design** — not coded; target for OCI staging/prod |
| Audience | Platform / security engineers, CCRP operators |
| Maturity | Design (not coded) |
| Complements | [OCI IAM Identity Domains](OCI_IAM_AND_EDGE_CONFIG.md) (human SSO) — **does not replace** them |

### Document set

| Document | Role |
|----------|------|
| **This doc** | SPIFFE/SPIRE + OCI WIF design, trust model, phased implementation |
| [OCI_SECURITY_ARCHITECTURE.md](../production/OCI_SECURITY_ARCHITECTURE.md) | Overall OCI security topology + env runbook |
| [OCI_IAM_AND_EDGE_CONFIG.md](OCI_IAM_AND_EDGE_CONFIG.md) | Human IdP groups, dynamic groups, edge JWT |
| [OCI_FEATURES_AND_CONFIGURATION.md](OCI_FEATURES_AND_CONFIGURATION.md) | Feature catalog + env vars |
| [PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md](../guides/PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md) | DEK/MEK / CAN attestation model |
| [config.oci.env.example](../../config/examples/config.oci.env.example) | Target env template |

**Identity layers (do not conflate):**

| Layer | Mechanism | Who / what | Purpose |
|-------|-----------|------------|---------|
| **A. Human / app SSO** | OCI IAM Identity Domains (OIDC) | TDC, TDP, CCRP, AppAdmin users | Portal login, API JWT roles |
| **B. Platform ↔ OCI control plane** | OKE Workload Identity **and/or** OCI IAM WIF | Pods, Jobs, CI | Vault, Object Storage, OCIR — **no static API keys** |
| **C. Workload ↔ workload** | SPIFFE/SPIRE (X.509 / JWT-SVID) | Backend, trainer, CAN CCR, SCITT, External Secrets | mTLS, attested peer identity, multi-cloud portable IDs |

**Keycloak** remains **local docker-compose / Playwright only**. Do not deploy Keycloak on OCI as a SPIRE substitute or app IdP.

---

## 1. Why both SPIFFE/SPIRE and OCI WIF?

They solve **orthogonal** problems:

| Need | SPIFFE/SPIRE | OCI WIF / OKE WI |
|------|--------------|------------------|
| “Is this peer the training Job SA I expect?” | Yes (SPIFFE ID + SVID) | No (OCI principal only) |
| “May this pod read `cms-dev-datasets` bucket?” | Indirect (via broker) | Yes (IAM policy on principal) |
| Portable identity across OKE / AKS / GKE / bare CCR | Yes | Cloud-specific |
| Short-lived OCI session (UPST/RPST) without API keys | Via **JWT-SVID → WIF exchange** | Native |
| CAN / TEE peer auth before DEK·MEK release | Strong fit | Insufficient alone |

**Recommended composition for Confidential AI Network on OCI:**

1. **SPIRE** issues SVIDs after node/workload attestation (K8s SA, or TEE attestor for CCR).
2. **Service mesh or app mTLS** uses X.509-SVIDs for east-west traffic (backend ↔ trainer ↔ CAN escrow).
3. **OCI resource access** uses either:
   - **Path N (native):** OKE enhanced-cluster Workload Identity for pods that only need OCI APIs, **or**
   - **Path F (federation):** SPIRE **JWT-SVID** → OCI IAM **Identity Propagation Trust** → **UPST** (WIF), then call OCI APIs with proof-of-possession.

Use **Path N** for standard OKE apps (External Secrets, backend Object Storage). Use **Path F** when the same SPIFFE identity must work **off-OKE** (CI, multi-cloud CCR, self-managed K8s) or when you want a **single portable ID** mapped into OCI via trust rules.

```
┌─────────────────────────────────────────────────────────────────┐
│ Humans: Identity Domain OIDC → API Gateway → backend            │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ SPIRE Server (trust domain: can.oci.{env})                      │
│   ├─ Agents on OKE nodes / CCR nodes                            │
│   ├─ X.509-SVID → mTLS (mesh or app)                            │
│   └─ JWT-SVID  → OCI WIF token exchange → UPST → Vault/OSS     │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ Optional parallel: OKE Workload Identity (native RPST)          │
│   for pods that do not need portable SPIFFE federation          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Design principles

1. **Least privilege per SPIFFE ID** — one ID per K8s ServiceAccount × namespace × env (or finer for CAN sessions).
2. **No long-lived OCI API keys in pods** — prefer OKE WI or WIF UPST (≤ 60 minutes).
3. **Attestation before identity** — SPIRE only issues SVIDs after configured selectors (K8s SA, node, optionally TEE).
4. **Impersonation to Service Users** — WIF maps JWT-SVID claims → Identity Domain **Service Users** with IAM group membership (Vault reader, OSS writer, etc.).
5. **Separate trust domains per env** — `spiffe://can.dev.oci.example`, `spiffe://can.prod.oci.example` (or path-segment env); never share prod SPIRE keys with dev.
6. **Human IdP stays Identity Domains** — SPIRE is not an end-user login path.
7. **CAN key release** — escrow/CCR may require SPIFFE peer auth **and** TEE attestation evidence; OCI WIF alone does not prove enclave state.

---

## 3. SPIFFE ID taxonomy (CAN on OCI)

Trust domain (example): `can.{env}.oci.dpi-apps.space`  
SPIFFE ID form: `spiffe://{trust-domain}/{path}`

| Workload | Example SPIFFE ID | K8s SA / selector | OCI Service User (WIF) | Typical OCI rights |
|----------|-------------------|-------------------|------------------------|--------------------|
| Backend API | `…/ns/contract-management/sa/backend` | `backend` | `svc-can-{env}-backend` | Vault read (app secrets), OSS read datasets/artifacts metadata |
| Training Job | `…/ns/cms-training/sa/training-job` | `training-job-sa` | `svc-can-{env}-trainer` | OSS read ciphertext; write training outputs |
| CAN JCS / escrow | `…/ns/cms-can/sa/can-jcs` | `can-jcs` | `svc-can-{env}-jcs` | Minimal; prefer no broad Vault master-key access |
| CAN CCR agent | `…/ns/cms-can/sa/can-ccr` | `can-ccr` | `svc-can-{env}-ccr` | Session-scoped OSS; attestation-gated |
| External Secrets | `…/ns/external-secrets/sa/eso` | `external-secrets` | `svc-can-{env}-eso` | Vault secret read only (mapped paths) |
| SCITT CCF client | `…/ns/scitt/sa/scitt-client` | `scitt-client` | `svc-can-{env}-scitt` | Narrow network + optional OSS receipt store |
| CI deploy (off-cluster) | `…/ci/github-actions/{repo}` | JWT from OIDC | `svc-can-{env}-cicd` | OCIR push, OKE deploy (dev/test) |

**Path conventions:**

```
spiffe://can.{env}.oci.example/ns/{namespace}/sa/{serviceAccount}
spiffe://can.{env}.oci.example/ci/{provider}/{subject}
spiffe://can.{env}.oci.example/ccr/{ccrProvider}/{sessionId}   # optional session-scoped
```

Map SPIFFE `sub` (full ID) or a stable claim (`spiffe_id`) in JWT-SVID into WIF **impersonation rules**.

---

## 4. Architecture

### 4.1 In-cluster (OKE) — Path N + SPIRE mTLS

```
Pod (backend)
  ├─ SPIRE Agent sidecar / CSI → X.509-SVID
  ├─ mTLS to trainer / CAN (SPIFFE authz)
  └─ OCI SDK: OKE Workload Identity → RPST → Vault / Object Storage
```

Use when pods run on **OKE enhanced clusters** and only need OCI APIs. SPIRE still provides portable peer identity for CAN.

### 4.2 Federated OCI access — Path F (SPIRE JWT-SVID → WIF)

```
Workload
  → SPIRE Agent: JWT-SVID (aud = OCI trust / token-exchange)
  → Identity Domain /oauth2/v1/token
       grant_type = token-exchange
       subject_token = JWT-SVID
       requested_token_type = urn:oci:token-type:oci-upst
       + PoP public_key
  → UPST (≤ 60m)
  → OCI APIs (Vault, Object Storage, …) signed with PoP private key
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

### 4.3 CAN escrow / CCR (attested)

```
TDC/TDP portal (Identity Domain user JWT)
  → CAN JCS API
  → CCR workload obtains SPIFFE SVID (TEE / K8s attestor)
  → Peer mTLS: JCS ↔ CCR (SPIFFE ID allowlist for contract session)
  → Optional: CCR exchanges JWT-SVID → UPST for Object Storage ciphertext fetch
  → DEK/MEK release only after attestation + contract checks
     (SPIFFE proves workload identity; attestation proves TEE claims)
```

SPIFFE does **not** replace CAN attestation providers (`CAN_ATTESTATION_PROVIDER`). It **complements** them for network-level principal binding.

### 4.4 Multi-cloud CCRP (future)

Same SPIFFE trust domain (or federated SPIRE) across Azure/GCP CCR; each cloud’s WIF trusts SPIRE OIDC:

| Cloud | Federation target |
|-------|-------------------|
| OCI | Identity Propagation Trust → UPST |
| Azure | Entra federated credential → AAD token |
| GCP | WIF → SA access token |

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

TTL: X.509-SVID 1h (rotate aggressively); JWT-SVID ≤ 15–30m for exchange.

### 5.4 Identity Domain artifacts (WIF)

| Artifact | Purpose |
|----------|---------|
| Domain Admin OAuth client | Create trusts + Service Users (break-glass / Terraform) |
| Token Exchange OAuth client | Workloads authenticate to `/oauth2/v1/token` |
| Service Users `svc-can-{env}-*` | Impersonation targets; members of IAM groups |
| IdentityPropagationTrust | Trust SPIRE issuer + JWKS + impersonation rules |

### 5.5 IAM policies (sketch)

Bind **groups** that Service Users belong to (not SPIFFE strings — OCI IAM sees the Service User / UPST principal):

```text
Allow group cms-{env}-spiffe-backend to read secret-family in compartment cms-{env}-security
Allow group cms-{env}-spiffe-trainer to read objects in compartment cms-{env}-data where target.bucket.name='cms-{env}-datasets'
Allow group cms-{env}-spiffe-trainer to manage objects in compartment cms-{env}-data where target.bucket.name='cms-{env}-training-outputs'
```

Align group names with [OCI_IAM_AND_EDGE_CONFIG.md](OCI_IAM_AND_EDGE_CONFIG.md) dynamic groups; prefer **Service User + group** for Path F, **workload identity + policy conditions** for Path N.

### 5.6 Application integration

| Component | Change (target) |
|-----------|-----------------|
| Backend | Optional mTLS client cert from SPIRE Workload API; OCI SDK credential provider: WI or WIF UPST refresh |
| Training runner | Fetch SVID; mTLS to backend callbacks; OSS via WI/WIF |
| CAN JCS / CCR | Allowlist peer SPIFFE IDs per contract/session; reject unsigned peers |
| External Secrets | Prefer Path N; or ESO + WIF if off-cluster |
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

- [ ] Annotate SAs for OKE Workload Identity
- [ ] IAM policies for `cms-{env}-oke-workloads` / SA conditions
- [ ] Backend + ESO read Vault **without** API keys
- [ ] Keep SPIRE for peer mTLS even when Path N supplies OCI creds

### Phase 3 — OCI Path F / WIF (1–2 weeks)

Scaffolding **in repo** (opt-in):

| Path | Purpose |
|------|---------|
| [`deployment/oci/terraform/modules/wif/`](../../deployment/oci/terraform/modules/wif/) | Token-exchange app, Service Users, IdentityPropagationTrust, K8s `oci-wif-*` |
| Root `enable_wif` | Requires Identity Domain URL + SPIRE issuer/JWKS (or pinned cert) |

- [x] Terraform: Domain Token Exchange OAuth client (no admin role)
- [x] Terraform: Service Users `svc-can-{env}-backend` / `trainer`
- [x] Terraform: `IdentityPropagationTrust` with SPIRE issuer + JWKS + exact `sub` impersonation
- [x] K8s ConfigMap/Secret `OCI_WIF_*`
- [ ] Workload library: JWT-SVID → token-exchange → UPST + PoP key (application code)
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

- [ ] Trainer Job: SVID + mTLS callbacks to backend
- [ ] CAN JCS/CCR: peer SPIFFE allowlist; optional session SPIFFE IDs
- [ ] Gate DEK/MEK release on attestation **and** SPIFFE peer match
- [ ] Turn on `CAN_REQUIRE_SPIFFE_MTLS` in staging
- [ ] Runbooks for SVID outage / SPIRE Server restore

### Phase 5 — Prod + multi-cloud (as needed)

- [ ] Separate trust domains; break-glass procedures
- [ ] Prod Deny overlays if SPIRE OIDC exposed beyond private network
- [ ] Federate Azure/GCP WIF to same SPIRE OIDC for CCRP portability
- [ ] SIEM: Audit UPST usage + SPIRE registration events

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
| Stolen JWT-SVID | Short TTL; audience bound to OCI trust; PoP on UPST; revoke via SPIRE |
| Over-broad impersonation rules | Prefer exact `sub eq spiffe://…`; avoid `sub eq *` in prod |
| JWKS public exposure | Private endpoint or pin cert in trust; WAF allowlist Identity Domain egress |
| Confused deputy (token exchange client) | Restrict `oauthClients`; store client secret in Vault |
| Mixing human JWT and workload SVID | Separate issuers; never accept Identity Domain user tokens as SPIRE SVIDs |
| CAN without attestation | SPIFFE ≠ TEE proof; keep `CAN_ATTESTATION_PROVIDER` path |

---

## 10. Validation checklist

### SPIRE

- [ ] Agent healthy on all nodes; Workload API socket present in test pod
- [ ] `spire-server entry show` lists backend + trainer IDs
- [ ] X.509-SVID rotates before expiry
- [ ] OIDC discovery returns issuer + JWKS; keys verify a JWT-SVID

### Path N (OKE WI)

- [ ] Pod without API key lists bucket / reads Vault secret
- [ ] Audit log principal = workload identity

### Path F (WIF)

- [ ] Token exchange returns UPST
- [ ] UPST calls succeed; fail when SPIFFE ID not in impersonation map
- [ ] UPST expires ≤ 60m; refresh path works
- [ ] PoP signature required (unsigned requests rejected)

### CAN / app

- [ ] Trainer ↔ backend mTLS succeeds only for allowlisted SPIFFE IDs
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
| 2026-07-28 | Initial design + implementation doc (SPIFFE/SPIRE + OCI WIF / OKE WI) |
