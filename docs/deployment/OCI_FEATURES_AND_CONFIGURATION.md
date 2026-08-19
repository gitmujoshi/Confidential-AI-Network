# OCI features & configuration (target + current)

Canonical catalog of **OCI-oriented product features**, E2E fit, **maturity**, and **configuration / settings**. Use with:

| Doc | Role |
|-----|------|
| [OCI_SECURITY_ARCHITECTURE.md](../production/OCI_SECURITY_ARCHITECTURE.md) | Topology, runbook, compartments |
| [OCI_IAM_AND_EDGE_CONFIG.md](OCI_IAM_AND_EDGE_CONFIG.md) | IAM policies, Cloud Gate, API GW, WAF |
| [OCI_SPIFFE_SPIRE_WIF.md](OCI_SPIFFE_SPIRE_WIF.md) | SPIFFE/SPIRE + OCI WIF (workload identity design) |
| [OCI_DESIGN_COMPLETE.md](OCI_DESIGN_COMPLETE.md) | Design/scaffold completeness map |
| [OCI_READINESS.md](OCI_READINESS.md) | Gap analysis (design vs live apply) |
| [OCI_TAGGING_AND_VERSIONING.md](OCI_TAGGING_AND_VERSIONING.md) | `cms-*` tags, image tags |
| [PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md](../guides/PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md) | DEK/MEK / signing / CAN model |
| [config/examples/config.oci.env.example](../../config/examples/config.oci.env.example) | Env var template for OCI |

**Maturity legend:** `Implemented` · `Partial` · `Design scaffold` (code/IaC present; live apply optional) · `Local-only`

**Identity rule (OCI):** Azure-parallel — **OCI IAM Identity Domains** are the sole IdP on OCI (SSO, MFA, groups/app roles for TDC·TDP·CCRP·AppAdmin). **Cloud Gate** optionally fronts browser apps. **Keycloak** = local docker-compose / Playwright only — **do not deploy Keycloak on OCI**.

---

## 1. Feature catalog (at a glance)

| # | Feature | Maturity | Primary config |
|---|---------|----------|----------------|
| 1 | OCI IAM Identity Domains (+ Cloud Gate for SPA) | Partial / Design scaffold (`modules/identity` + app OIDC) | `AUTH_PROVIDER`, `OCI_IDENTITY_*` |
| 2 | Edge: WAF, API Gateway, LB, private OKE | Design scaffold (`modules/edge` + LB) | `enable_edge`, Terraform + DNS |
| 3 | OCI Vault (secrets, master keys) | Design scaffold (`modules/vault`) | `enable_vault`, `OCI_VAULT_*`, `SECRET_BACKEND` |
| 4 | Signing keys in Vault / HSM + verify on sign | Design scaffold (Vault module + env) | `SIGNING_KEY_BACKEND` |
| 5 | Principal DEK / MEK + attested release | Design (signals MVP) | `CAN_*`, attestation |
| 6 | Contract `kmsConfigs` → OCI Vault | Partial (JSON + Vault OCID scaffold) | contract JSON + TSP creds |
| 7 | OCI training (OKE Job) | Design scaffold (`modules/training` + `okeJobTrainingRunner`) | `TRAINING_EXECUTION_MODE=oci-oke-job`, `enable_training` |
| 8 | Object Storage datasets / artifacts | Design scaffold (`modules/object_storage`) | `enable_object_storage`, `OCI_OBJECT_STORAGE_*` |
| 9 | SCITT CCF on OCI | Design scaffold (`modules/scitt`) | `enable_scitt`, `SCITT_*` |
| 10 | OCI-targeted E2E / CI | Design (ops) | staging URLs + IdP users |
| 11 | Local Keycloak demo path | Implemented | `KEYCLOAK_*`, `local-docker` |
| 12 | Platform Terraform (VCN, OKE, ADB, OCIR) | Partial / Design scaffold | `deployment/oci/terraform/` |
| 13 | SPIFFE/SPIRE + OCI WIF / OKE Workload Identity | Design scaffold (`modules/spire`, `modules/wif`, WIF helper) | `enable_spire`, `enable_wif`, `SPIFFE_*`, `OCI_WIF_*` |

---

## 2. End-to-end flow (OCI target)

```
OCI IAM Identity Domain SSO (OIDC) [+ optional Cloud Gate for browser]
  → API Gateway validates Identity Domain JWT + groups/app roles
  → TDP encrypts dataset with DEK → Object Storage (ciphertext)
  → TDC encrypts model with MEK → Object Storage
  → Contract with kmsConfigs → OCI Vault refs
  → Parties sign with Vault-backed keys (crypto verify)
  → Optional SCITT receipt
  → CAN escrow: attestation → DEK+MEK into confidential compute
     OR portal train: OKE Job with TSP OCI credentials
  → Artifacts → Object Storage (SSE-KMS) → register / infer
  → Destroy CCR; zeroize; provenance complete
```

Local shortcuts: Keycloak docker, disk datasets, placeholder signatures, `local-docker` train, CAN **signals only**.

---

## 3. Feature details & settings

### 3.1 OCI IAM Identity Domains (cloud IdP)

| | |
|--|--|
| **Purpose** | Sole IdP on OCI: login, MFA, groups / application roles for TDC/TDP/CCRP/AppAdmin |
| **Maturity** | Design — codebase is Keycloak-centric; OCI Terraform still includes a Keycloak Deployment (remove for target) |
| **Local** | Keep `AUTH_PROVIDER=keycloak`; do not require Identity Domains for laptop E2E |

| Variable | Example | Description |
|----------|---------|-------------|
| `AUTH_PROVIDER` | `oci-iam` \| `keycloak` | `oci-iam` on OCI; `keycloak` local only |
| `KEYCLOAK_ENABLED` | `false` on OCI | Must be false when `AUTH_PROVIDER=oci-iam` |
| `OCI_IDENTITY_DOMAIN_URL` | `https://idcs-….identity.oraclecloud.com` | Identity Domain base URL |
| `OCI_IDENTITY_CLIENT_ID` | app client id | SPA (public + PKCE) |
| `OCI_IDENTITY_API_CLIENT_ID` | resource / API audience | Backend API app |
| `OCI_IDENTITY_ISSUER` | `{domain}/oauth2/v1` or domain issuer | JWT issuer |
| `OCI_IDENTITY_AUDIENCE` | API client / audience | API Gateway + backend |
| `OCI_IDENTITY_JWKS_URL` | `{domain}/admin/v1/SigningCert/jwk` (or OIDC JWKS) | JWT validation |
| `OCI_IDENTITY_ROLE_CLAIM` | `groups` \| custom | Groups → `TDC`/`TDP`/`CCRP`/`AppAdmin` |
| `OCI_CLOUD_GATE_ENABLED` | `true` | Optional browser SSO front for `app.` / `ops.` |
| `OCI_TENANCY_OCID` | `ocid1.tenancy…` | Tenancy |
| `OCI_COMPARTMENT_OCID` | `ocid1.compartment…` | Env compartment (`cms-dev-*`) |

**App roles:** define Identity Domain groups (or application roles) `cms-{env}-tdc-users`, `…-tdp-users`, `…-ccrp-users`, `…-app-admins` and map in the backend to Keycloak `partyType` equivalents.

**API Gateway:** validate JWT against **Identity Domain** JWKS — not Keycloak.

See [OCI_IAM_AND_EDGE_CONFIG.md](OCI_IAM_AND_EDGE_CONFIG.md) for groups, Cloud Gate apps, JWT policies.

---

### 3.2 Edge & platform Terraform

| Component | Maturity | Notes |
|-----------|----------|-------|
| VCN, OKE, ADB, LB, OCIR, K8s apps | Partial | `deployment/oci/terraform/` |
| WAF + API Gateway | Design | JWT → **Identity Domain** JWKS |
| Cloud Gate | Design | `app.`, `ops.` (no Keycloak upstream) |
| Bastion / private OKE API | Design (prod) | |
| Vault module | Design | Secrets + master encryption keys |
| Confidential compute pool | Design | For CCRP |

**Typical `terraform.tfvars`:**

| Setting | Example | Description |
|---------|---------|-------------|
| `tenancy_ocid` | OCID | Tenancy |
| `region` | `us-ashburn-1` | Home region |
| `compartment_ocid` | OCID | `cms-dev-compute` etc. |
| `app_domain` | `dev.example.com` | DNS base |
| `oke_node_count` | `3` | Node pool |
| `adb_password` | secret | Prefer Vault |
| `enable_waf` / `enable_api_gateway` | `true` | When modules land |

---

### 3.3 OCI Vault (platform secrets & keys)

| Variable | Example | Description |
|----------|---------|-------------|
| `SECRET_BACKEND` | `oci-vault` \| `env` | Platform secret source |
| `OCI_VAULT_OCID` | `ocid1.vault…` | Vault |
| `OCI_VAULT_KEY_OCID` | `ocid1.key…` | Master / CMK |
| `OCI_VAULT_COMPARTMENT_OCID` | OCID | Data compartment |
| `OCI_CONFIG_FILE` | `~/.oci/config` | CLI/SDK (ops only) |
| `OCI_AUTH_MODE` | `instance_principal` \| `api_key` | Prefer instance/workload identity on OKE |

**Secret names (convention):** `cms-{env}-db-connection`, `cms-{env}-oci-identity-client-secret` (confidential clients only), `cms-{env}-redis-password`.

---

### 3.4 Signing keys

| Variable | Example | Description |
|----------|---------|-------------|
| `SIGNING_KEY_BACKEND` | `database` \| `oci-vault` | Target: Vault/HSM |
| `SIGNING_KEY_VAULT_OCID` | OCID | When not database |
| `SIGNING_REQUIRE_CRYPTO_VERIFY` | `true` (prod) | Reject placeholders |
| `SIGNING_REQUIRE_DID_VERIFY` | `true` when DID claimed | |
| `SIGNING_DEFAULT_ALGORITHM` | `ECDSA_P256` | |

**Key naming:** `cms-{env}-user-sign-{depaId}`.

---

### 3.5 DEK / MEK & CAN release

| Variable | Example | Description |
|----------|---------|-------------|
| `CAN_PRINCIPAL_KEY_MODE` | `signals` \| `attested-tls` | Prod: attested delivery |
| `CAN_ESCROW_TIMEOUT_MS` | `600000` | Dual-key window |
| `CAN_ATTESTATION_PROVIDER` | `simulated` \| `oci-attestation` | Target provider |
| `CAN_REJECT_KEY_MATERIAL_ON_API` | `true` | Node stays signal-only |
| `PLATFORM_ENCRYPTION_MODE` | `demo` \| `disabled` | CAN prod: `disabled` |

---

### 3.6 Contract KMS (`kmsConfigs`)

| Field | Example |
|-------|---------|
| `provider` | `oci-vault` |
| `keyId` / vault OCID | Vault key reference |
| `algorithm` | `AES-256-GCM` |

| Variable | Example | Description |
|----------|---------|-------------|
| `CONTRACT_KMS_ENFORCE` | `true` (prod) | Fail train if Vault unreachable |
| `CONTRACT_KMS_ALLOWED_PROVIDERS` | `oci-vault` | Restrict on OCI |

---

### 3.7 OCI training execution

| Mode | Maturity |
|------|----------|
| `local-docker` | Implemented (laptop) |
| `oci` / OKE Job | Design |
| `ociProvider.js` create env | Partial (simulated/stub patterns) |

| Variable | Example | Description |
|----------|---------|-------------|
| `TRAINING_EXECUTION_MODE` | `local-docker` \| `oci` | OCI deploy target: `oci` |
| `TRAINING_SIMULATION_MODE` | `false` | |
| `OCI_REGION` | `us-ashburn-1` | |
| `OCI_TRAINING_COMPUTE` | `oke-job` \| `compute` \| `confidential` | |
| `LOCAL_TRAINING_IMAGE` | `{region}.ocir.io/{ns}/local-trainer:tag` | OCIR |
| `OCI_NAMESPACE` | Object Storage / OCIR namespace | |

**TSP:** per-tenant OCI credentials (tenancy, user, fingerprint, private key, region) stored encrypted — secret manager type `OCI_VAULT`.

---

### 3.8 Object Storage

| Bucket | Purpose |
|--------|---------|
| `cms-{env}-datasets` | Dataset ciphertext |
| `cms-{env}-training-outputs` | Job outputs |
| `cms-{env}-artifacts` | Registered models |

| Variable | Example | Description |
|----------|---------|-------------|
| `DATASET_STORAGE_BACKEND` | `local` \| `oci-object` | `oci-object` on OCI |
| `OCI_OBJECT_STORAGE_NAMESPACE` | namespace | |
| `OCI_OBJECT_STORAGE_BUCKET_DATASETS` | `cms-dev-datasets` | |
| `OCI_OBJECT_STORAGE_BUCKET_OUTPUTS` | `cms-dev-training-outputs` | |
| `OCI_OBJECT_STORAGE_BUCKET_ARTIFACTS` | `cms-dev-artifacts` | |

---

### 3.9 SCITT CCF on OCI

| Variable | Example | Description |
|----------|---------|-------------|
| `SCITT_CCF_ENABLED` | `false` until stood up | |
| `SCITT_CCF_URL` | `https://scitt.{env}.example.com` | |
| `SCITT_DEPLOYMENT` | `oke` \| `vm` \| `none` | |

---

### 3.10 Inference & E2E

| Variable | Example | Description |
|----------|---------|-------------|
| `INFERENCE_EXECUTION_MODE` | `docker` \| `oke-job` | Align with OCIR trainer |
| `INFERENCE_TIMEOUT_MS` | `600000` | |
| `E2E_AUTH_PROVIDER` | `oci-iam` | Staging Identity Domain test users |
| `PLAYWRIGHT_BASE_URL` | `https://app.staging.example.com` | |

---

### 3.11 CCRP / TSP OCI credentials

| Setting | Description |
|---------|-------------|
| Tenancy OCID, User OCID, fingerprint, private key PEM, region | Per TSP; encrypt at rest |
| Compartment OCID | Training isolation |
| Secret manager | `OCI_VAULT` |

Code: `backend/services/providers/ociProvider.js`, `secretManager.js` (`OCI_VAULT`).

---

## 4. Environment profiles

### 4.1 Local docker

```bash
AUTH_PROVIDER=keycloak
KEYCLOAK_ENABLED=true
TRAINING_EXECUTION_MODE=local-docker
DATASET_STORAGE_BACKEND=local
SIGNING_KEY_BACKEND=database
CAN_ATTESTATION_PROVIDER=simulated
SCITT_CCF_ENABLED=true
```

### 4.2 OCI Pilot (Phase 1)

```bash
AUTH_PROVIDER=oci-iam
KEYCLOAK_ENABLED=false
OCI_IDENTITY_DOMAIN_URL=https://idcs-XXXX.identity.oraclecloud.com
OCI_IDENTITY_CLIENT_ID=...
OCI_IDENTITY_AUDIENCE=...
OCI_CLOUD_GATE_ENABLED=true
SECRET_BACKEND=oci-vault
OCI_VAULT_OCID=ocid1.vault...
DATASET_STORAGE_BACKEND=oci-object
TRAINING_EXECUTION_MODE=local-docker   # or oci when Jobs ready
SIGNING_KEY_BACKEND=database
SIGNING_REQUIRE_CRYPTO_VERIFY=false
SCITT_CCF_ENABLED=false
```

### 4.3 OCI CAN production

```bash
AUTH_PROVIDER=oci-iam
KEYCLOAK_ENABLED=false
SIGNING_KEY_BACKEND=oci-vault
SIGNING_REQUIRE_CRYPTO_VERIFY=true
CAN_PRINCIPAL_KEY_MODE=attested-tls
CAN_ATTESTATION_PROVIDER=oci-attestation
CAN_REJECT_KEY_MATERIAL_ON_API=true
PLATFORM_ENCRYPTION_MODE=disabled
DATASET_STORAGE_BACKEND=oci-object
TRAINING_EXECUTION_MODE=oci
OCI_TRAINING_COMPUTE=confidential
CONTRACT_KMS_ENFORCE=true
CONTRACT_KMS_ALLOWED_PROVIDERS=oci-vault
SCITT_CCF_ENABLED=true
SCITT_DEPLOYMENT=oke
```

---

## 5. Implementation backlog

1. ~~**OCI IAM auth adapter**~~ — `AUTH_PROVIDER=oci-iam`; `/api/auth/oidc/*`; JWKS validation in middleware (API Gateway JWT still design)  
2. ~~**Remove Keycloak from OCI Terraform / K8s**~~ — done; Keycloak remains local docker only  
3. ~~**Terraform Identity Domains module**~~ — `modules/identity` creates domain, role groups, SPA/API apps; outputs → K8s  
4. Validate OKE + ADB + TLS/DNS; Vault → External Secrets  
5. Object Storage dataset backend  
6. Signing keys in Vault + crypto verify on sign  
7. Contract KMS enforce against OCI Vault  
8. OKE Job training executor + OCIR trainer image  
9. **SPIFFE/SPIRE + OCI WIF** — [OCI_SPIFFE_SPIRE_WIF.md](OCI_SPIFFE_SPIRE_WIF.md)  
10. Attested DEK/MEK release on OCI confidential compute  
11. WAF + API Gateway + Cloud Gate Terraform  
12. SCITT on OKE; E2E against staging Identity Domain users  

---

## 6. Related code entry points

| Area | Path |
|------|------|
| OCI provider | `backend/services/providers/ociProvider.js` |
| Secret backends | `backend/services/secretManager.js` (`OCI_VAULT`) |
| Platform Terraform | `deployment/oci/terraform/` |
| SPIFFE/WIF design | `docs/deployment/OCI_SPIFFE_SPIRE_WIF.md` |
| Portal sign / CAN | `backend/routes/contracts.js`, `can-jcs.js` |

---

## 7. Changelog

| Date | Change |
|------|--------|
| 2026-07-28 | SPIFFE/SPIRE + OCI WIF design doc linked; feature #13; env template vars |
| 2026-07-26 | Initial OCI feature + configuration catalog |
| 2026-07-26 | Identity: **OCI IAM Identity Domains only** on OCI; Keycloak local-only (parity with Azure/Entra) |
