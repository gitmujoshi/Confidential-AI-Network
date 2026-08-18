# Azure features & configuration (target + current)

Canonical catalog of **Azure-oriented product features**, how they fit the E2E multi-party flow, **maturity**, and **configuration / settings**. Use with:

| Doc | Role |
|-----|------|
| [AZURE_SECURITY_ARCHITECTURE.md](../production/AZURE_SECURITY_ARCHITECTURE.md) | Topology, runbook, §16 crypto flows |
| [AZURE_IAM_AND_EDGE_CONFIG.md](AZURE_IAM_AND_EDGE_CONFIG.md) | Entra groups, RBAC, APIM, WAF |
| [AZURE_SPIFFE_SPIRE_WIF.md](AZURE_SPIFFE_SPIRE_WIF.md) | SPIFFE/SPIRE + AKS WI / Entra WIF design |
| [AZURE_READINESS.md](AZURE_READINESS.md) | Honest gap analysis |
| [PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md](../guides/PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md) | DEK/MEK / signing / CAN model |
| [backend/AZURE_INTEGRATION_GUIDE.md](../../backend/AZURE_INTEGRATION_GUIDE.md) | CCRP Azure SDK / credentials |
| [config/examples/config.azure.env.example](../../config/examples/config.azure.env.example) | Env var template for Azure |

**Maturity legend:** `Implemented` · `Partial` · `Design (not coded)` · `Local-only`

**Identity rule:** Azure = **Microsoft Entra ID**. **Keycloak** = local docker-compose / Playwright only.

---

## 1. Feature catalog (at a glance)

| # | Feature | Maturity | Primary config |
|---|---------|----------|----------------|
| 1 | Entra ID auth (OIDC JWT + redirect) | Implemented | `AUTH_PROVIDER=entra`, `ENTRA_*` |
| 2 | Edge: Front Door, APIM, App Gateway, private AKS | Design / Partial IaC | Terraform + DNS |
| 3 | Platform Key Vault (secrets, CMK) | Partial | `AZURE_KEY_VAULT_*` |
| 4 | Signing keys in Key Vault / HSM + verify on sign | Design | `SIGNING_KEY_BACKEND` |
| 5 | Principal DEK / MEK + attested release | Design (signals MVP) | `CAN_*`, attestation |
| 6 | Contract `kmsConfigs` → real Azure Key Vault | Partial (JSON only) | contract JSON + TSP creds |
| 7 | Azure training (ACI / AKS Job / DCsv3) | Partial | `TRAINING_EXECUTION_MODE`, CCRP Azure |
| 8 | Blob datasets / artifacts | Design / Partial | `AZURE_STORAGE_*` |
| 9 | SCITT CCF on Azure | Design | `SCITT_*` |
| 10 | Azure-targeted E2E / CI | Design | staging URLs + Entra test users |
| 11 | SPIFFE/SPIRE + AKS WI / Entra WIF | Partial (WI IaC; SPIRE scaffold) | `enable_workload_identity`, `enable_spire` |
| 12 | Local Keycloak demo path | Implemented | `KEYCLOAK_*`, `TRAINING_EXECUTION_MODE=local-docker` |

---

## 2. End-to-end flow (Azure target)

```
Entra SSO (MSAL)
  → APIM validates Entra JWT + app roles
  → TDP encrypts dataset with DEK → Blob (ciphertext)
  → TDC publishes / selects model; encrypts with MEK → Blob
  → TDC creates Ricardian contract (kmsConfigs → Azure Key Vault refs)
  → Parties sign with Key Vault–backed signing keys (crypto verify)
  → Optional SCITT receipt on Azure
  → CAN escrow: attestation → DEK+MEK release into confidential compute
     OR portal train: AKS Job / ACI with TSP Azure credentials
  → Artifacts → Blob (CMK) → register / deploy / infer
  → Destroy CCR; zeroize; provenance complete
```

Local today shortcuts: Keycloak login, disk/demo datasets, placeholder signatures, `local-docker` train, CAN key-release **signals only**.

---

## 3. Feature details & settings

### 3.1 Microsoft Entra ID (Azure IdP)

| | |
|--|--|
| **Purpose** | Sole IdP on Azure: login, MFA/Conditional Access, app roles for TDC/TDP/CCRP/AppAdmin |
| **Maturity** | Implemented — `AUTH_PROVIDER=entra`; OIDC redirect login; JWKS middleware; Terraform `modules/identity` |
| **Local** | Keep `KEYCLOAK_ENABLED=true`; do not use Entra for laptop demos unless explicitly testing SSO |

**Settings (target `config.env` / Key Vault):**

| Variable | Example | Description |
|----------|---------|-------------|
| `AUTH_PROVIDER` | `entra` \| `keycloak` | `entra` on Azure; `keycloak` local |
| `ENTRA_TENANT_ID` | GUID | Entra tenant |
| `ENTRA_CLIENT_ID` | GUID | SPA app registration |
| `ENTRA_API_AUDIENCE` | `api://can-dev-api` | API app ID URI / audience |
| `ENTRA_API_CLIENT_ID` | GUID | API app registration |
| `ENTRA_API_SCOPE` | `api://can-dev-api/access_as_user` | Delegated scope on authorize |
| `ENTRA_CLIENT_SECRET` | secret | Optional API secret (Key Vault); SPA public client needs none for code exchange |
| `ENTRA_AUTHORITY` | `https://login.microsoftonline.com/{tenant}/v2.0` | OIDC authority |
| `ENTRA_REDIRECT_URI` | `https://app.dev.example.com/login` | SPA redirect |
| `ENTRA_ROLE_CLAIM` | `roles` | Claim carrying `TDC`/`TDP`/`CCRP`/`AppAdmin` |
| `KEYCLOAK_ENABLED` | `false` on Azure | Must be false when `AUTH_PROVIDER=entra` |

**Entra app roles (API registration):** `TDC`, `TDP`, `CCRP`, `AppAdmin` — mapped in `entraIdentityService` / `oidcIdentityBase`.

**Terraform:** [`deployment/azure/terraform/modules/identity`](../../deployment/azure/terraform/modules/identity/README.md) creates SPA + API apps and wires ConfigMap `AUTH_PROVIDER=entra`.

**APIM:** validate JWT against Entra OpenID metadata (see [AZURE_IAM_AND_EDGE_CONFIG.md](AZURE_IAM_AND_EDGE_CONFIG.md) §10).

---

### 3.2 Edge & platform Terraform

| Component | Maturity | Settings / notes |
|-----------|----------|------------------|
| VNet, AKS, PostgreSQL, ACR, App Gateway IP | **Implemented** | `deployment/azure/terraform/` |
| Key Vault + secret seed | **Implemented** | `enable_key_vault` (default on) |
| Blob datasets / outputs / artifacts | **Implemented** | `enable_storage` (default on) |
| AKS Workload Identity (Path N) | **Implemented** | `enable_workload_identity` (default on) |
| Front Door + WAF | Partial IaC | `enable_edge` (default off) |
| SPIRE scaffold | Partial IaC | `enable_spire` + `deployment/azure/helm/spire` |
| APIM | Design | JWT Entra; rate limits; route table in IAM doc |
| Private AKS API | Design (prod) | Bastion for admin kubectl |
| Confidential compute pool | Design | DCsv3 / confidential containers for CCRP |

**Terraform inputs (typical `terraform.tfvars`):**

| Setting | Example | Description |
|---------|---------|-------------|
| `subscription_id` | GUID | Target subscription |
| `location` | `eastus` | Home region |
| `environment` | `dev` \| `test` \| `staging` \| `prod` | Name prefix `can-{env}-*` |
| `db_password` | secret | PostgreSQL admin (prefer Key Vault) |
| `aks_node_count` | `3` | Node pool size |
| `aks_private_cluster` | `true` (prod) | Private API server |
| `enable_front_door` | `true` | When module lands |
| `enable_apim` | `true` | When module lands |
| `key_vault_sku` | `standard` \| `premium` | Premium for HSM-backed keys |

---

### 3.3 Platform Key Vault (infra secrets & CMK)

| | |
|--|--|
| **Purpose** | DB strings, Entra client secrets, TLS, Blob/PG customer-managed keys — **not** principal DEK/MEK plaintext |
| **Maturity** | Partial (SDK/secretManager scaffolding; not full External Secrets) |

| Variable | Example | Description |
|----------|---------|-------------|
| `AZURE_KEY_VAULT_URL` | `https://can-dev-kv.vault.azure.net/` | Platform vault |
| `AZURE_KEY_VAULT_NAME` | `can-dev-kv` | Vault name |
| `AZURE_USE_MANAGED_IDENTITY` | `true` | AKS workload identity preferred |
| `SECRET_BACKEND` | `azure-keyvault` \| `hashicorp-vault` \| `env` | Where ops secrets load from |
| `AZURE_STORAGE_CMK_KEY_ID` | key URI | CMK for Blob |
| `AZURE_POSTGRES_CMK_KEY_ID` | key URI | Optional CMK for Flexible Server |

**Secret names (convention):**

| Name | Content |
|------|---------|
| `can-{env}-db-connection` | PostgreSQL connection string |
| `can-{env}-entra-api-client-secret` | Entra confidential secret |
| `can-{env}-redis-password` | Redis |
| `can-{env}-scitt-*` | SCITT client material |

---

### 3.4 Signing keys (contract signatures)

| | |
|--|--|
| **Purpose** | ECDSA-P256 / RSA keys for Ricardian signatures + SCITT linkage |
| **Maturity** | Partial API (DB `UserKey`); Design for Key Vault/HSM + verify-on-sign |
| **Today** | Private key in `user_keys`; portal sign often sends hash/placeholder; DID verify not enforced |

| Variable | Example | Description |
|----------|---------|-------------|
| `SIGNING_KEY_BACKEND` | `database` \| `azure-keyvault` \| `azure-mhsm` | Target: Key Vault/MHSM on Azure |
| `SIGNING_KEY_VAULT_URL` | vault URI | When backend ≠ database |
| `SIGNING_REQUIRE_CRYPTO_VERIFY` | `true` (prod) | Reject placeholder signatures |
| `SIGNING_REQUIRE_DID_VERIFY` | `true` when DID claimed | Call DID verify on sign |
| `SIGNING_DEFAULT_ALGORITHM` | `ECDSA_P256` | Preferred algorithm |

**Key naming (target):** `can-{env}-user-sign-{depaId}` in Key Vault. App DB stores key id + public material only.

**APIs:** `/api/signing/keys/*`, `/api/contracts/:id/signing-data`, `/api/contracts/:id/sign` — see [CONTRACT_SIGNING_TECHNICAL_REFERENCE.md](../features/contract-signing/CONTRACT_SIGNING_TECHNICAL_REFERENCE.md).

---

### 3.5 DEK / MEK (principal encryption) & CAN release

| | |
|--|--|
| **DEK** | Dataset encryption key — **TDP / data principal** owned (target) |
| **MEK** | Model encryption key — **TDC / model owner** owned (target) |
| **Maturity** | Design for principal custody; CAN MVP = **release signals only** (no key bytes on Node); platform encrypt = demo only |

| Variable | Example | Description |
|----------|---------|-------------|
| `CAN_PRINCIPAL_KEY_MODE` | `signals` \| `attested-tls` \| `azure-skr` | Prod target: `attested-tls` or `azure-skr` |
| `CAN_ESCROW_TIMEOUT_MS` | `600000` | Dual-key escrow window (~10m) |
| `CAN_PLATFORM_SIGNING_SECRET` | secret | Today: HMAC for **simulated** attestation |
| `CAN_ATTESTATION_PROVIDER` | `simulated` \| `azure-attestation` | Prod: Azure Attestation |
| `AZURE_ATTESTATION_URL` | provider URL | When using Azure Attestation |
| `CAN_REJECT_KEY_MATERIAL_ON_API` | `true` | Keep Node free of DEK/MEK plaintext |
| `PLATFORM_ENCRYPTION_MODE` | `demo` \| `disabled` | On Azure CAN prod: `disabled` or non-authoritative |

**Flow (target):** encrypt locally → Blob ciphertext → CCR attest → principals release DEK/MEK into TEE → train → zeroize. Details: [PARTICIPANT_ONBOARDING…](../guides/PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md) §2, §9–10.

---

### 3.6 Contract KMS configuration (wizard / JSON)

Stored on the contract as `kmsConfigs` / `environmentSpecs.kms` (provider + key id + metadata).

| Field | Example | Description |
|-------|---------|-------------|
| `provider` | `azure-key-vault` \| `hashicorp-vault` \| `aws-kms` \| `gcp-kms` | Selected in create wizard |
| `keyId` | `can-dev-contract-kek` | Logical key / secret name |
| `vaultUrl` | `https://….vault.azure.net/` | Azure Key Vault URI |
| `algorithm` | `AES-256-GCM` | Documented intent |
| `rotationPeriod` | `90` | Days (policy metadata) |

| Variable | Example | Description |
|----------|---------|-------------|
| `CONTRACT_KMS_ENFORCE` | `true` (prod) | Fail train if provider unreachable |
| `CONTRACT_KMS_ALLOWED_PROVIDERS` | `azure-key-vault` | Restrict on Azure |

**Maturity:** JSON persisted; training does **not** yet call the provider. TSP Azure credentials (separate) use secret encryption paths — see CCRP guide.

---

### 3.7 Azure training execution (CCRP / TSP)

| Mode | When | Maturity |
|------|------|----------|
| `local-docker` | Laptop demos | Implemented |
| `azure-aci` / Azure SDK path | Signed contract + TSP Azure creds | Partial (`azureProvider.js`, `trainingService.js`) |
| AKS Job | Platform train on cluster | Design |
| DCsv3 confidential VM | CAN clean-room | Design |

| Variable | Example | Description |
|----------|---------|-------------|
| `TRAINING_EXECUTION_MODE` | `local-docker` \| `azure` | Azure deploy: `azure` (target name) |
| `TRAINING_SIMULATION_MODE` | `false` | Must be false for real runs |
| `LOCAL_TRAINING_IMAGE` | `….azurecr.io/local-trainer:tag` | Push trainer to ACR for Azure |
| `AZURE_SUBSCRIPTION_ID` | GUID | Platform or per-TSP |
| `AZURE_TENANT_ID` | GUID | |
| `AZURE_CLIENT_ID` / `AZURE_CLIENT_SECRET` | SP | Prefer MSI on AKS; TSP stores own SP encrypted |
| `AZURE_DEFAULT_LOCATION` | `eastus` | Region for ACI/VM |
| `AZURE_TRAINING_COMPUTE` | `aci` \| `aks-job` \| `dcsv3` | Target executor |
| `AZURE_ACI_CPU` / `AZURE_ACI_MEMORY_GB` | `2` / `8` | ACI sizing |
| `AZURE_CONFIDENTIAL_VM_SIZE` | `Standard_DC2s_v3` | Confidential SKU |

**TSP UI:** Azure credentials page → encrypted at rest; used when `ccrpCloudProvider=Azure`.

---

### 3.8 Blob Storage (datasets, outputs, artifacts)

| Container | Purpose | Access |
|-----------|---------|--------|
| `can-{env}-datasets` | Dataset ciphertext | Private endpoint; TDP upload SAS / API |
| `can-{env}-training-outputs` | Job metrics / model.bin | Private; TDC/TSP MSI |
| `can-{env}-artifacts` | Registered models / exports | Private; CMK staging/prod |

| Variable | Example | Description |
|----------|---------|-------------|
| `AZURE_STORAGE_ACCOUNT` | `candevdata` | Account name |
| `AZURE_STORAGE_CONNECTION_STRING` | secret | Prefer MSI + account URL instead |
| `AZURE_STORAGE_BLOB_ENDPOINT` | `https://….blob.core.windows.net` | |
| `AZURE_STORAGE_DATASETS_CONTAINER` | `can-dev-datasets` | |
| `AZURE_STORAGE_OUTPUTS_CONTAINER` | `can-dev-training-outputs` | |
| `AZURE_STORAGE_ARTIFACTS_CONTAINER` | `can-dev-artifacts` | |
| `DATASET_STORAGE_BACKEND` | `local` \| `azure-blob` | `azure-blob` on Azure |

---

### 3.9 SCITT CCF on Azure

| | |
|--|--|
| **Purpose** | Tamper-evident receipts for signatures / provenance |
| **Maturity** | Local docker-compose Implemented; Azure Design |

| Variable | Example | Description |
|----------|---------|-------------|
| `SCITT_CCF_ENABLED` | `true` \| `false` | Enable ledger integration |
| `SCITT_CCF_URL` | `https://scitt.{env}.example.com` | Azure service URL |
| `SCITT_CCF_DASHBOARD_URL` | ops URL | Optional |
| `SCITT_CCF_TIMEOUT` | `5000` | ms |
| `SCITT_DEPLOYMENT` | `aks` \| `vm` \| `none` | How CCF is hosted on Azure |

---

### 3.10 Inference on Azure

| Variable | Example | Description |
|----------|---------|-------------|
| `INFERENCE_EXECUTION_MODE` | `docker` \| `aks-job` \| `host` | Align with trainer image in ACR |
| `INFERENCE_TIMEOUT_MS` | `600000` | DistilBERT cold start |
| `HF_HOME` / cache volume | PVC or Azure Files | Avoid re-download per predict |

---

### 3.11 E2E / CI against Azure

| Setting | Local | Azure staging |
|---------|-------|---------------|
| IdP | Keycloak | Entra test users / app roles |
| `BACKEND_URL` | `http://127.0.0.1:5001` | `https://api.staging.example.com` |
| `FRONTEND_URL` | `http://localhost:3000` | `https://app.staging.example.com` |
| Training | `local-docker` | `azure` + ACR image |
| Secrets | `secrets.env` | Key Vault → CI OIDC |

| Variable | Description |
|----------|-------------|
| `E2E_AUTH_PROVIDER` | `keycloak` \| `entra` |
| `E2E_WAIT_FOR_LOCAL_TRAINING` | Local docker waits |
| `PLAYWRIGHT_BASE_URL` | Frontend under test |

---

### 3.12 CCRP / TSP Azure credentials (per tenant)

| Setting | Description |
|---------|-------------|
| Subscription ID, Tenant ID, Client ID, Client Secret | Stored encrypted per TSP user |
| Resource group / location defaults | Used by provisioners |
| Key Vault for TSP-owned secrets | Optional customer vault |

See [AZURE_INTEGRATION_GUIDE.md](../../backend/AZURE_INTEGRATION_GUIDE.md) and `backend/config/azure-config.example.js`.

**Platform MSI vars (when app runs on Azure):**

| Variable | Description |
|----------|-------------|
| `AZURE_SUBSCRIPTION_ID` | Platform subscription |
| `AZURE_TENANT_ID` | Tenant |
| `AZURE_USE_MANAGED_IDENTITY` | `true` on AKS |
| `AZURE_CLIENT_ID` | User-assigned MSI client id (if used) |

---

## 4. Environment profiles (recommended defaults)

### 4.1 Local docker (current demos)

```bash
AUTH_PROVIDER=keycloak
KEYCLOAK_ENABLED=true
TRAINING_EXECUTION_MODE=local-docker
TRAINING_SIMULATION_MODE=false
DATASET_STORAGE_BACKEND=local
SIGNING_KEY_BACKEND=database
SIGNING_REQUIRE_CRYPTO_VERIFY=false
CAN_ATTESTATION_PROVIDER=simulated
SCITT_CCF_ENABLED=true   # if local SCITT compose up
```

### 4.2 Azure Pilot (Phase 1 — platform)

```bash
AUTH_PROVIDER=entra
KEYCLOAK_ENABLED=false
ENTRA_TENANT_ID=...
ENTRA_CLIENT_ID=...
ENTRA_API_AUDIENCE=api://can-dev-api
AZURE_USE_MANAGED_IDENTITY=true
AZURE_KEY_VAULT_URL=https://can-dev-kv.vault.azure.net/
DATASET_STORAGE_BACKEND=azure-blob
TRAINING_EXECUTION_MODE=azure   # or keep local-docker only for hybrid spike
SIGNING_KEY_BACKEND=database    # migrate to azure-keyvault in Phase 2
SIGNING_REQUIRE_CRYPTO_VERIFY=false  # enable after Key Vault signing
CAN_ATTESTATION_PROVIDER=simulated
SCITT_CCF_ENABLED=false
```

### 4.3 Azure CAN production (Phase 3+)

```bash
AUTH_PROVIDER=entra
KEYCLOAK_ENABLED=false
SIGNING_KEY_BACKEND=azure-mhsm
SIGNING_REQUIRE_CRYPTO_VERIFY=true
SIGNING_REQUIRE_DID_VERIFY=true
CAN_PRINCIPAL_KEY_MODE=attested-tls   # or azure-skr
CAN_ATTESTATION_PROVIDER=azure-attestation
CAN_REJECT_KEY_MATERIAL_ON_API=true
PLATFORM_ENCRYPTION_MODE=disabled
DATASET_STORAGE_BACKEND=azure-blob
AZURE_TRAINING_COMPUTE=dcsv3
CONTRACT_KMS_ENFORCE=true
CONTRACT_KMS_ALLOWED_PROVIDERS=azure-key-vault
SCITT_CCF_ENABLED=true
SCITT_DEPLOYMENT=aks
```

---

## 5. Implementation backlog (docs → code)

Order matches engineering priority:

1. ~~**Entra auth adapter**~~ — done (`AUTH_PROVIDER=entra`; OIDC SPA redirect; JWKS; Terraform identity module; Keycloak local-only).
2. **Blob storage backend** — `DATASET_STORAGE_BACKEND=azure-blob`; containers + MSI.
3. **Signing Key Vault + verify** — `SIGNING_KEY_BACKEND=azure-keyvault`; enforce crypto on sign.
4. **Contract KMS enforce** — resolve `kmsConfigs` against Azure Key Vault at train start.
5. **Azure training executor** — `TRAINING_EXECUTION_MODE=azure` + ACI/AKS Job; ACR trainer image.
6. **Attested DEK/MEK release** — Azure Attestation + SKR/attested TLS; keep Node signal-only.
7. **SCITT on AKS** — enable receipts for Azure staging/prod.
8. **Terraform modules** — Front Door, APIM, Key Vault, confidential pool.
9. **E2E against staging** — Entra users; `PLAYWRIGHT_BASE_URL` / API HTTPS.

---

## 6. Related code entry points (today)

| Area | Path |
|------|------|
| Entra IdP service | `backend/services/entraIdentityService.js` |
| Cloud IdP registry | `backend/services/cloudIdpRegistry.js` |
| OIDC routes | `backend/routes/auth.js` (`/oidc/config`, `/oidc/callback`) |
| Portal sign | `backend/routes/contracts.js` |
| Signing service | `backend/services/contractSigningService.js` |
| Platform encrypt (demo) | `backend/services/platformEncryptionService.js` |
| CAN escrow | `backend/services/canJcsService.js`, `backend/routes/can-jcs.js` |
| Azure provider | `backend/services/providers/azureProvider.js` |
| TSP Azure creds | `backend/services/tspAzureCredentialsService.js` |
| Training modes | `backend/services/tdcTrainingExecutionService.js` |
| Secret backends | `backend/services/secretManager.js` |
| Azure config example | `backend/config/azure-config.example.js` |

---

## 7. Changelog

| Date | Change |
|------|--------|
| 2026-07-27 | Entra auth implemented (OIDC + Terraform identity); Keycloak removed from Azure TF |
| 2026-07-26 | Initial feature + configuration catalog; Entra-only Azure; Keycloak local-only |
