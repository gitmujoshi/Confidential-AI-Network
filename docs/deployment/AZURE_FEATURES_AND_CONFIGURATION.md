# Azure features & configuration (target + current)

Canonical catalog of **Azure-oriented product features**, how they fit the E2E multi-party flow, **maturity**, and **configuration / settings**. Use with:

| Doc | Role |
|-----|------|
| [AZURE_SECURITY_ARCHITECTURE.md](../production/AZURE_SECURITY_ARCHITECTURE.md) | Topology, runbook, §16 crypto flows |
| [AZURE_IAM_AND_EDGE_CONFIG.md](AZURE_IAM_AND_EDGE_CONFIG.md) | Entra groups, RBAC, APIM, WAF |
| [AZURE_SPIFFE_SPIRE_WIF.md](AZURE_SPIFFE_SPIRE_WIF.md) | SPIFFE/SPIRE + AKS WI / Entra WIF design |
| [AZURE_READINESS.md](AZURE_READINESS.md) | Gap analysis |
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
| 2 | Edge: Front Door, APIM, App Gateway, private AKS | Partial IaC (Front Door and APIM modules, both default off) | Terraform + DNS |
| 3 | Platform Key Vault (secrets, CMK) | Partial (REST client; External Secrets install is a separate script) | `AZURE_KEY_VAULT_*` |
| 4 | Signing keys in Key Vault / HSM + verify on sign | Partial (on when `SIGNING_KEY_BACKEND=azure-keyvault` or `azure-mhsm`) | `SIGNING_KEY_BACKEND` |
| 5 | Principal DEK / MEK + attested release | Partial (`azure-skr` verifies an Azure Attestation JWT, then releases an encrypted blob) | `CAN_*`, attestation |
| 6 | Contract `kmsConfigs` → real Azure Key Vault | Partial (Azure provider is looked up before submit; other providers stay JSON) | contract JSON + TSP creds |
| 7 | Azure training on an existing AKS cluster | Partial (Job reads the node SEV-SNP report and submits it; status stays simulated until the report verifies) | Contract `cloudAccounts.Azure`, TSP `cloudAccount.Azure.kubeconfigPath`, `AZURE_CCR_KUBECONFIG` |
| 8 | Blob datasets / artifacts | Design / Partial | `AZURE_STORAGE_*` |
| 9 | SCITT ledger on AKS | Partial (manifest and install script; this repo's service, not a Microsoft CCF network) | `SCITT_*`, `install-scitt.sh` |
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
  → CAN escrow: attestation → DEK+MEK release into confidential compute (design)
     OR portal train: Job on the TSP’s existing AKS cluster (`azure-ccr`)
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
| APIM | Partial IaC | `enable_apim` creates Consumption APIM and the Entra JWT policy when `apim_publisher_email` and `apim_backend_url` are set |
| Private AKS API | Design (prod) | Bastion for admin kubectl |
| Confidential compute pool | Opt-in IaC | `enable_confidential_compute`. The Job reads the guest report; a missing interface fails the Job |

**Terraform inputs (typical `terraform.tfvars`):**

| Setting | Example | Description |
|---------|---------|-------------|
| `subscription_id` | GUID | Target subscription |
| `location` | `eastus` | Home region |
| `environment` | `dev` \| `test` \| `staging` \| `prod` | Name prefix `can-{env}-*` |
| `db_password` | secret | PostgreSQL admin (prefer Key Vault) |
| `aks_node_count` | `3` | Node pool size |
| `aks_private_cluster` | `true` (prod) | Private API server |
| `enable_edge` | `true` | Front Door + WAF. Default off |
| `enable_apim` | `true` | Also set `apim_publisher_email` and `apim_backend_url`. Default off |
| `key_vault_sku` | `standard` \| `premium` | Premium for HSM-backed keys |

---

### 3.3 Platform Key Vault (infra secrets & CMK)

| | |
|--|--|
| **Purpose** | DB strings, Entra client secrets, TLS, Blob/PG customer-managed keys — **not** principal DEK/MEK plaintext |
| **Maturity** | Partial. Sign, get, create, and secure key release call the Key Vault REST API and fail closed. External Secrets has a Helm values file and `install-external-secrets.sh`. Terraform apply does not run that script. |

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
| **Maturity** | Partial. `SIGNING_KEY_BACKEND=database` (default) keeps the private key in `user_keys`. `azure-keyvault` and `azure-mhsm` create an EC P-256 key in Key Vault, store the public key and key id only, sign in the vault, and reject the signature when local ES256 verification fails. |
| **Today** | Database backend remains the local and demo path. DID verify is still not enforced. |

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
| **Maturity** | Partial. Default `CAN_PRINCIPAL_KEY_MODE=signals` still stores the release time and discards wrapped key bytes. `azure-skr` accepts a key only after Azure Attestation verifies the JWT, calls Key Vault secure key release, and returns the encrypted blob. The API does not decrypt it. `reportFormat` on that path is `AZURE_ATTESTATION`. A simulated report is not accepted as a guest quote. |

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

**Maturity:** JSON is still stored for every provider. When the provider is `azure-key-vault`, `azure-keyvault`, `azure`, or `azure-mhsm`, training calls Key Vault and gets the key before `kubectl apply`. A missing vault URL, key id, or a failed lookup marks the job failed and does not submit it. `CONTRACT_KMS_ENFORCE=true` requires that Azure provider even when the contract names another KMS. The job environment receives the vault URI and key id. Credentials are not copied into the Job. TSP Azure credentials remain a separate store.

---

### 3.7 Azure training execution (CCRP / TSP)

A signed contract whose TSP is **Azure** submits `azure-ccr` to the AKS cluster that TSP already runs. Start does not create a subscription, resource group, or cluster. `TRAINING_EXECUTION_MODE` is ignored for this provider.

| Source | What it supplies |
|--------|------------------|
| Contract `environmentSpecs.cloudAccounts.Azure` | Subscription ID, resource group, AKS name, and optional namespace, region, storage account, Key Vault URI. A blank field is filled from the TSP user account |
| TSP dashboard **Cloud Provider** card | Same identifiers plus `kubeconfigPath`, stored on `users.cloud_account.Azure` |
| `AZURE_CCR_KUBECONFIG` | Kubeconfig path on the API host when the dashboard field is empty |

Required before submit: subscription, resource group, and AKS name, plus a kubeconfig path. A missing path marks the `TrainingJob` **FAILED** and returns HTTP 502. `kubectl apply` runs only when that path is set and, when Azure KMS is configured, only after Key Vault returns the contract key. The Job mounts `/sys/kernel/config/tsm` from the node and runs `training/azure_guest_quote.py` before training. That script submits the report to `POST /api/tdc/training/jobs/:jobId/sev-snp-quote`. The job status stays `simulated` until the report signature matches the VCEK and the VCEK chains to `SEV_SNP_ARK_PEM`. A missing guest interface fails the container and does not create a report. The confidential node pool in `deployment/azure/terraform/` is opt-in and is not applied by training start.

The **Cloud credentials** page is a separate store. `azure-ccr` does not read it.

TDC inference deploy is a separate step. The TDC can select **Azure** on the training page and submit an inference Job to an AKS cluster stored on that TDC’s `users.cloud_account.Azure`. The contract TSP is not that target. A missing `kubeconfigPath` or `AZURE_CCR_KUBECONFIG` returns HTTP 502 and leaves the model undeployed. The score is not copied back.

| Mode | When | Maturity |
|------|------|----------|
| `local-docker` | TSP provider is Local | Implemented |
| `azure-ccr` | TSP provider is Azure and the existing cluster is named | Job spec and submit are live; hardware quote is design |
| DCsv3 confidential VM | CAN clean-room | Design |

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
| **Maturity** | Local docker-compose is implemented. AKS deployment is `deployment/azure/manifests/scitt/scitt.yaml`, applied by `deployment/azure/scripts/install-scitt.sh`. The script refuses to apply without `SCITT_IMAGE`, `DATABASE_URL`, and a reachable cluster. This is the repo's ledger service, not a Microsoft CCF network. |

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
# Azure jobs ignore TRAINING_EXECUTION_MODE. Name the existing AKS cluster on the
# TSP Cloud Provider card and set AZURE_CCR_KUBECONFIG or cloudAccount.Azure.kubeconfigPath.
AZURE_CCR_KUBECONFIG=/var/secrets/aks.kubeconfig
SIGNING_KEY_BACKEND=database    # set azure-keyvault to sign in Key Vault
SIGNING_REQUIRE_CRYPTO_VERIFY=false  # Azure Key Vault signing always verifies ES256
CAN_ATTESTATION_PROVIDER=simulated
# CAN_PRINCIPAL_KEY_MODE=azure-skr
# AZURE_ATTESTATION_URL=https://sharedeus2.eus2.attest.azure.net
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
2. **Blob storage backend** — containers exist in Terraform. The app path `DATASET_STORAGE_BACKEND=azure-blob` is still open.
3. ~~**Signing Key Vault + verify**~~ — coded. Off unless `SIGNING_KEY_BACKEND=azure-keyvault` or `azure-mhsm`.
4. ~~**Contract KMS enforce**~~ — an Azure Key Vault `kmsConfigs` provider is read before the Job is submitted.
5. **Azure training follow-through** — the Job submits and reads a SEV-SNP report from the node. Still open: status watch and copying artifacts back from Blob.
6. ~~**Attested DEK/MEK release**~~ — `CAN_PRINCIPAL_KEY_MODE=azure-skr` verifies an Azure Attestation JWT and returns the encrypted Key Vault blob. Default remains `signals`.
7. ~~**SCITT ledger manifest**~~ — `install-scitt.sh`. This repo's service. A live apply still needs an image and `DATABASE_URL`.
8. ~~**Terraform modules**~~ — Key Vault, Front Door, APIM, confidential pool, and the External Secrets service account are in the stack. APIM, the pool, and External Secrets default off. SPIRE Helm is still installed by hand.
9. **E2E against staging** — Entra users; `PLAYWRIGHT_BASE_URL` / API HTTPS.
10. **Operator apply** — public DNS, SPIRE Helm, and a live `terraform apply` on a subscription.

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
| Azure CCR runner | `training/azureCcrRunner.js` |
| TSP cloud account | `shared/services/tspCloudAccount.js`, `users.cloud_account` |
| Training router | `training/trainingExecutionRouter.js`, `training/tdcTrainingExecutionService.js` |
| Secret backends | `backend/services/secretManager.js` |
| Azure config example | `backend/config/azure-config.example.js` |

---

## 7. Changelog

| Date | Change |
|------|--------|
| 2026-11-16 | Portal Azure training submits `azure-ccr` to the TSP’s existing AKS cluster. Kubeconfig stays on the TSP user. A missing path fails the job |
| 2026-07-27 | Entra auth implemented (OIDC + Terraform identity); Keycloak removed from Azure TF |
| 2026-07-26 | Initial feature + configuration catalog; Entra-only Azure; Keycloak local-only |
