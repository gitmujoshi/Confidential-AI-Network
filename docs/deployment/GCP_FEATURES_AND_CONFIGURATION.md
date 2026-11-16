# GCP features & configuration (target + current)

Canonical catalog of **Google Cloud–oriented product features**, E2E fit, **maturity**, and **configuration / settings**. Use with:

| Doc | Role |
|-----|------|
| [GCP_SECURITY_ARCHITECTURE.md](../production/GCP_SECURITY_ARCHITECTURE.md) | Topology, runbook, crypto flows |
| [GCP_IAM_AND_EDGE_CONFIG.md](GCP_IAM_AND_EDGE_CONFIG.md) | IAM, Identity Platform, API Gateway, Cloud Armor, Cloud CDN |
| [GCP_READINESS.md](GCP_READINESS.md) | Gap analysis |
| [PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md](../guides/PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md) | DEK/MEK / signing / CAN model |
| [config/examples/config.gcp.env.example](../../config/examples/config.gcp.env.example) | Env var template for GCP |

**Maturity legend:** `Implemented` · `Partial` · `Design (not coded)` · `Local-only`

**Identity rule:** GCP cloud = **Google Cloud Identity / Identity Platform** (OIDC JWT + custom claims or groups) for SSO. **Keycloak** = local docker-compose / Playwright only — do not run Keycloak as the production IdP on GCP (optional temporary broker only).

**Provider code today:** portal training for a GCP TSP uses `gcpCcrRunner.js` against the GKE cluster named on the contract and the TSP user. `backend/services/providers/gcpProvider.js` is a separate simulated provider and is not that path. Secrets path `GCP_SECRETS` exists in `secretManager.js`. Platform GKE Terraform is not in this repo. Identity Platform Terraform is.

---

## 1. Feature catalog (at a glance)

| # | Feature | Maturity | Primary config |
|---|---------|----------|----------------|
| 1 | Identity Platform / Cloud Identity (JWT) | Implemented | `AUTH_PROVIDER=gcp-identity`, `GCP_OIDC_*` |
| 2 | Edge: Cloud CDN, Cloud Armor, API Gateway, private GKE | Design | Terraform + DNS |
| 3 | Secret Manager / Cloud KMS (platform) | Partial (secretManager hook) | `GCP_PROJECT_ID`, `SECRET_BACKEND` |
| 4 | Signing keys in Cloud KMS/HSM + verify | Design | `SIGNING_KEY_BACKEND` |
| 5 | Principal DEK / MEK + attested release | Design (signals MVP) | `CAN_*`, Confidential Space |
| 6 | Contract `kmsConfigs` → Cloud KMS | Partial (JSON only) | contract JSON + TSP creds |
| 7 | GCP training on an existing GKE cluster | Partial (`gcp-ccr` Job submit; Confidential Space quote is design) | Contract `cloudAccounts.GCP`, TSP `cloudAccount.GCP.kubeconfigPath`, `GCP_CCR_KUBECONFIG` |
| 8 | GCS datasets / artifacts | Design | `GCP_GCS_*` |
| 9 | SCITT CCF on GCP | Design | `SCITT_*` |
| 10 | GCP-targeted E2E / CI | Design | staging URLs + IdP users |
| 11 | Local Keycloak demo path | Implemented | `KEYCLOAK_*`, `local-docker` |

---

## 2. End-to-end flow (GCP target)

```
Identity Platform / IAP-assisted SSO
  → API Gateway / backend validates Google OIDC JWT + role claims
  → TDP encrypts dataset with DEK → GCS (CMEK ciphertext)
  → TDC encrypts model with MEK → GCS
  → Contract kmsConfigs → Cloud KMS key resource names
  → Parties sign with Cloud KMS–backed keys (crypto verify)
  → Optional SCITT receipt
  → CAN escrow: Confidential Space attestation → DEK+MEK release (design)
     OR portal train: Job on the TSP’s existing GKE cluster (`gcp-ccr`)
  → Artifacts → GCS → register / infer
  → Destroy CCR; zeroize; provenance complete
```

Local shortcuts: Keycloak, disk datasets, placeholder signatures, `local-docker`, CAN **signals only**.

---

## 3. Feature details & settings

### 3.1 Google Identity Platform / Cloud Identity

| | |
|--|--|
| **Purpose** | Sole cloud IdP: login, MFA, custom claims / groups for party roles |
| **Maturity** | Implemented — `AUTH_PROVIDER=gcp-identity`; OIDC redirect; JWKS; Terraform identity scaffold |
| **Local** | `AUTH_PROVIDER=keycloak` |

| Variable | Example | Description |
|----------|---------|-------------|
| `AUTH_PROVIDER` | `gcp-identity` \| `keycloak` | `gcp-identity` on GCP |
| `GCP_PROJECT_ID` | `can-dev-123456` | Project |
| `GCP_IDENTITY_API_KEY` | (web) | Identity Platform web API key (not secret for SPA limits) |
| `GCP_IDENTITY_AUTH_DOMAIN` | `can-dev-123456.firebaseapp.com` | Auth domain |
| `GCP_OIDC_CLIENT_ID` | (oauth) | OAuth 2.0 Web client ID |
| `GCP_OIDC_CLIENT_SECRET` | secret | OAuth client secret (backend code exchange) |
| `GCP_OIDC_ISSUER` | `https://securetoken.google.com/{project}` | JWT issuer |
| `GCP_OIDC_AUDIENCE` | project id | JWT audience |
| `GCP_IDENTITY_REDIRECT_URI` | `https://app.dev.example.com/login` | SPA redirect |
| `GCP_USE_IDENTITY_PLATFORM_TOKENS` | `true` | Validate securetoken JWKS |
| `GCP_ROLE_CLAIM` | `roles` | Custom claims / roles |
| `GCP_IAP_ENABLED` | `true` (optional) | IAP in front of SPA / ops |
| `KEYCLOAK_ENABLED` | `false` on GCP | When `AUTH_PROVIDER=gcp-identity` |

**Terraform:** [`deployment/gcp/terraform/modules/identity`](../../deployment/gcp/terraform/modules/identity/README.md) enables Identity Platform; pass Console-created OAuth client IDs via tfvars.

**Workload identity:** GKE pods use Workload Identity Federation → GCP SA (no JSON keys in pods).

---

### 3.2 Edge & platform Terraform (planned)

| Component | Maturity | Notes |
|-----------|----------|-------|
| VPC, GKE, Cloud SQL PostgreSQL, Artifact Registry, HTTPS LB | Design / partial | Identity scaffold lives under `deployment/gcp/terraform/`; compute stack still planned |
| Cloud CDN + Cloud Armor | Design | WAF policies |
| API Gateway | Design | JWT validation |
| Private GKE control plane | Design (prod) | |
| Secret Manager + Cloud KMS modules | Design | CMEK |
| Confidential Space / confidential GKE | Design | CCRP |

**Typical `terraform.tfvars`:**

| Setting | Example | Description |
|---------|---------|-------------|
| `project_id` | `can-dev-123456` | |
| `region` | `us-central1` | |
| `environment` | `dev` | Prefix `can-{env}-*` |
| `db_password` | secret | Prefer Secret Manager |
| `gke_node_count` | `3` | |
| `enable_cloud_armor` / `enable_api_gateway` | `true` | When modules land |
| `kms_keyring` | `can-dev` | |

---

### 3.3 Secret Manager & Cloud KMS (platform)

| Variable | Example | Description |
|----------|---------|-------------|
| `GCP_PROJECT_ID` | `can-dev-123456` | |
| `GOOGLE_APPLICATION_CREDENTIALS` | path (local only) | Prefer Workload Identity on GKE |
| `GCP_USE_WORKLOAD_IDENTITY` | `true` | |
| `SECRET_BACKEND` | `gcp-secrets` \| `env` | Maps to `GCP_SECRETS` |
| `GCP_SECRET_PREFIX` | `can-dev-` | |
| `GCP_KMS_KEY_NAME` | `projects/…/cryptoKeys/…` | Platform CMEK |
| `GCP_GCS_KMS_KEY_NAME` | same or dedicated | Bucket CMEK |

**Secret names:** `can-dev-db-connection`, `can-dev-identity-client-secret`, `can-dev-redis-password`.

---

### 3.4 Signing keys

| Variable | Example | Description |
|----------|---------|-------------|
| `SIGNING_KEY_BACKEND` | `database` \| `gcp-kms` | Prod: Cloud KMS (HSM protection level) |
| `SIGNING_KMS_KEY_NAME` | full resource name | Asymmetric sign key |
| `SIGNING_REQUIRE_CRYPTO_VERIFY` | `true` (prod) | |
| `SIGNING_REQUIRE_DID_VERIFY` | `true` when DID claimed | |
| `SIGNING_DEFAULT_ALGORITHM` | `ECDSA_P256` | |

---

### 3.5 DEK / MEK & CAN release

| Variable | Example | Description |
|----------|---------|-------------|
| `CAN_PRINCIPAL_KEY_MODE` | `signals` \| `attested-tls` \| `confidential-space` | |
| `CAN_ESCROW_TIMEOUT_MS` | `600000` | |
| `CAN_ATTESTATION_PROVIDER` | `simulated` \| `gcp-confidential-space` | |
| `CAN_REJECT_KEY_MATERIAL_ON_API` | `true` | |
| `PLATFORM_ENCRYPTION_MODE` | `demo` \| `disabled` | |

---

### 3.6 Contract KMS (`kmsConfigs`)

| Field | Example |
|-------|---------|
| `provider` | `gcp-kms` |
| `keyId` | Cloud KMS key resource name |

| Variable | Example | Description |
|----------|---------|-------------|
| `CONTRACT_KMS_ENFORCE` | `true` (prod) | |
| `CONTRACT_KMS_ALLOWED_PROVIDERS` | `gcp-kms` | |

---

### 3.7 GCP training execution

A signed contract whose TSP is **GCP** submits `gcp-ccr` to the GKE cluster that TSP already runs. Start does not create a project or a cluster. `TRAINING_EXECUTION_MODE` is ignored for this provider.

| Source | What it supplies |
|--------|------------------|
| Contract `environmentSpecs.cloudAccounts.GCP` | Project ID, location, GKE name, and optional namespace and GCS bucket. A blank field is filled from the TSP user account |
| TSP dashboard **Cloud Provider** card | Same identifiers plus `kubeconfigPath`, stored on `users.cloud_account.GCP` |
| `GCP_CCR_KUBECONFIG` | Kubeconfig path on the API host when the dashboard field is empty |

Required before submit: project, location, and GKE name, plus a kubeconfig path. A missing path marks the `TrainingJob` **FAILED** and returns HTTP 502. `kubectl apply` runs only when that path is set. Attestation on this path is `simulated`. No Confidential Space quote is collected. `gcpProvider.js` remains a simulated provider and is not this path.

TDC inference deploy is a separate step. The TDC can select **GCP** and submit an inference Job to a GKE cluster stored on that TDC’s `users.cloud_account.GCP`. The contract TSP is not that target. A missing `kubeconfigPath` or `GCP_CCR_KUBECONFIG` returns HTTP 502 and leaves the model undeployed. The score is not copied back.

| Mode | Maturity |
|------|----------|
| `local-docker` | Implemented when the TSP provider is Local |
| `gcp-ccr` | Job spec and submit to the named GKE cluster are live; guest quote is design |
| Confidential Space | Design |

---

### 3.8 Cloud Storage (GCS)

| Bucket | Purpose |
|--------|---------|
| `can-{env}-datasets` | Dataset ciphertext |
| `can-{env}-training-outputs` | Job outputs |
| `can-{env}-artifacts` | Registered models |

| Variable | Example | Description |
|----------|---------|-------------|
| `DATASET_STORAGE_BACKEND` | `local` \| `gcp-gcs` | |
| `GCP_GCS_BUCKET_DATASETS` | `can-dev-datasets` | |
| `GCP_GCS_BUCKET_OUTPUTS` | `can-dev-training-outputs` | |
| `GCP_GCS_BUCKET_ARTIFACTS` | `can-dev-artifacts` | |

---

### 3.9 SCITT CCF on GCP

| Variable | Example | Description |
|----------|---------|-------------|
| `SCITT_CCF_ENABLED` | `false` until stood up | |
| `SCITT_CCF_URL` | `https://scitt.{env}.example.com` | |
| `SCITT_DEPLOYMENT` | `gke` \| `vm` \| `none` | |

---

### 3.10 Inference & E2E

| Variable | Example | Description |
|----------|---------|-------------|
| `INFERENCE_EXECUTION_MODE` | `docker` \| `gke-job` | |
| `INFERENCE_TIMEOUT_MS` | `600000` | |
| `E2E_AUTH_PROVIDER` | `gcp-identity` | Staging |
| `PLAYWRIGHT_BASE_URL` | `https://app.staging.example.com` | |

---

### 3.11 CCRP / TSP GCP credentials

| Setting | Description |
|---------|-------------|
| Project ID + service account key JSON | Per TSP today (encrypt at rest) |
| Target | Short-lived tokens / WIF / SA impersonation |
| Secret manager | `GCP_SECRETS` |

Code: `backend/services/providers/gcpProvider.js`, `secretManager.js`.

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

### 4.2 GCP Pilot (Phase 1)

```bash
AUTH_PROVIDER=gcp-identity
KEYCLOAK_ENABLED=false
GCP_PROJECT_ID=can-dev-123456
GCP_USE_WORKLOAD_IDENTITY=true
SECRET_BACKEND=gcp-secrets
GCP_KMS_KEY_NAME=projects/.../cryptoKeys/can-dev
DATASET_STORAGE_BACKEND=gcp-gcs
TRAINING_EXECUTION_MODE=gcp
SIGNING_KEY_BACKEND=database
SIGNING_REQUIRE_CRYPTO_VERIFY=false
SCITT_CCF_ENABLED=false
```

### 4.3 GCP CAN production

```bash
SIGNING_KEY_BACKEND=gcp-kms
SIGNING_REQUIRE_CRYPTO_VERIFY=true
CAN_PRINCIPAL_KEY_MODE=confidential-space
CAN_ATTESTATION_PROVIDER=gcp-confidential-space
CAN_REJECT_KEY_MATERIAL_ON_API=true
PLATFORM_ENCRYPTION_MODE=disabled
DATASET_STORAGE_BACKEND=gcp-gcs
GCP_TRAINING_COMPUTE=confidential-space
CONTRACT_KMS_ENFORCE=true
CONTRACT_KMS_ALLOWED_PROVIDERS=gcp-kms
SCITT_CCF_ENABLED=true
SCITT_DEPLOYMENT=gke
```

---

## 5. Implementation backlog

1. ~~Identity Platform + JWT adapter~~ — done (`AUTH_PROVIDER=gcp-identity`; OIDC; Terraform identity scaffold; Keycloak local-only)  
2. Platform Terraform (VPC, GKE, Cloud SQL, Artifact Registry, LB)  
3. GCS dataset backend + Workload Identity  
4. Signing Cloud KMS + crypto verify  
5. Contract KMS enforce → Cloud KMS  
6. Confidential Space quote, status watch, and GCS mount. `gcp-ccr` already submits to the named GKE cluster. `gcpProvider.js` stays off this path  
7. Confidential Space attestation for DEK/MEK  
8. Cloud Armor + API Gateway / IAP  
9. SCITT on GKE; E2E against staging  

---

## 6. Related code entry points

| Area | Path |
|------|------|
| GCP IdP service | `backend/services/gcpIdentityService.js` |
| Cloud IdP registry | `backend/services/cloudIdpRegistry.js` |
| GCP CCR runner | `training/gcpCcrRunner.js` |
| TSP cloud account | `shared/services/tspCloudAccount.js`, `users.cloud_account` |
| Training router | `training/trainingExecutionRouter.js` |
| Secrets | `backend/services/secretManager.js` (`GCP_SECRETS`) |
| TEE hints | `backend/services/teeProvisioningService.js` (`GCP_PROJECT_ID`) |
| Terraform identity | `deployment/gcp/terraform/modules/identity/` |

---

## 7. Changelog

| Date | Change |
|------|--------|
| 2026-11-16 | Portal GCP training submits `gcp-ccr` to the TSP’s existing GKE cluster. Kubeconfig stays on the TSP user. A missing path fails the job |
| 2026-07-27 | Identity Platform auth implemented (OIDC + TF identity scaffold); Keycloak local-only |
| 2026-07-26 | Initial GCP feature + configuration catalog |
