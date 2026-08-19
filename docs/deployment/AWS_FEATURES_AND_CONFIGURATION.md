# AWS features & configuration (target + current)

Canonical catalog of **AWS-oriented product features**, E2E fit, **maturity**, and **configuration / settings**. Use with:

| Doc | Role |
|-----|------|
| [AWS_SECURITY_ARCHITECTURE.md](../production/AWS_SECURITY_ARCHITECTURE.md) | Topology, runbook, crypto flows |
| [AWS_IAM_AND_EDGE_CONFIG.md](AWS_IAM_AND_EDGE_CONFIG.md) | IAM, Cognito, API Gateway, WAF, CloudFront |
| [AWS_READINESS.md](AWS_READINESS.md) | Gap analysis |
| [PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md](../guides/PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md) | DEK/MEK / signing / CAN model |
| [config/examples/config.aws.env.example](../../config/examples/config.aws.env.example) | Env var template for AWS |

**Maturity legend:** `Implemented` · `Partial` · `Design (not coded)` · `Local-only`

**Identity rule:** AWS cloud = **Amazon Cognito** (or IAM Identity Center federation) for SSO + JWT; map groups/claims to `TDC`/`TDP`/`CCRP`/`AppAdmin`. **Keycloak** = local docker-compose / Playwright only — do not run Keycloak as the production IdP on AWS (optional temporary broker only).

**Provider code today:** `backend/services/providers/awsProvider.js` is largely **simulated** (credential field checks + stub environments). Secrets path `AWS_SECRETS` exists in `secretManager.js`. **No** platform Terraform under `deployment/aws/` yet.

---

## 1. Feature catalog (at a glance)

| # | Feature | Maturity | Primary config |
|---|---------|----------|----------------|
| 1 | Cognito / Identity Center auth (JWT) | Design | `AUTH_PROVIDER`, `COGNITO_*` / `AWS_SSO_*` |
| 2 | Edge: CloudFront, WAF, API Gateway, private EKS | Design | Terraform + DNS |
| 3 | Secrets Manager / KMS (platform) | Partial (secretManager hook) | `AWS_REGION`, `SECRET_BACKEND` |
| 4 | Signing keys in KMS/CloudHSM + verify | Design | `SIGNING_KEY_BACKEND` |
| 5 | Principal DEK / MEK + attested release | Design (signals MVP) | `CAN_*`, Nitro / attestation |
| 6 | Contract `kmsConfigs` → AWS KMS | Partial (JSON only) | contract JSON + TSP creds |
| 7 | AWS training (ECS/EKS Job / Nitro Enclaves) | Design / stub provider | `TRAINING_EXECUTION_MODE` |
| 8 | S3 datasets / artifacts | Design | `AWS_S3_*` |
| 9 | SCITT CCF on AWS | Design | `SCITT_*` |
| 10 | AWS-targeted E2E / CI | Design | staging URLs + Cognito users |
| 11 | Local Keycloak demo path | Implemented | `KEYCLOAK_*`, `local-docker` |

---

## 2. End-to-end flow (AWS target)

```
Cognito Hosted UI / IdP federation (MSAL-equivalent)
  → API Gateway validates Cognito JWT + group → role map
  → TDP encrypts dataset with DEK → S3 (SSE-KMS ciphertext)
  → TDC encrypts model with MEK → S3
  → Contract kmsConfigs → AWS KMS key ARNs
  → Parties sign with KMS/CloudHSM–backed keys (crypto verify)
  → Optional SCITT receipt
  → CAN escrow: Nitro/enclave attestation → DEK+MEK release
     OR portal train: EKS Job / ECS with TSP AWS credentials
  → Artifacts → S3 → register / infer
  → Destroy CCR; zeroize; provenance complete
```

Local shortcuts: Keycloak, disk datasets, placeholder signatures, `local-docker`, CAN **signals only**.

---

## 3. Feature details & settings

### 3.1 Amazon Cognito (AWS IdP)

| | |
|--|--|
| **Purpose** | Sole cloud IdP: login, MFA, user pools / groups for party roles |
| **Maturity** | Design — codebase Keycloak-centric |
| **Local** | `AUTH_PROVIDER=keycloak`; do not require Cognito for laptop E2E |

| Variable | Example | Description |
|----------|---------|-------------|
| `AUTH_PROVIDER` | `cognito` \| `keycloak` | `cognito` on AWS |
| `COGNITO_USER_POOL_ID` | `us-east-1_XXXX` | User pool |
| `COGNITO_CLIENT_ID` | app client id | SPA (public + PKCE) |
| `COGNITO_REGION` | `us-east-1` | |
| `COGNITO_DOMAIN` | `can-dev.auth.us-east-1.amazoncognito.com` | Hosted UI |
| `COGNITO_ISSUER` | `https://cognito-idp.{region}.amazonaws.com/{pool}` | JWT issuer |
| `COGNITO_AUDIENCE` | client id | API audience |
| `COGNITO_ROLE_CLAIM` | `cognito:groups` | Groups → `TDC`/`TDP`/`CCRP`/`AppAdmin` |
| `KEYCLOAK_ENABLED` | `false` on AWS | When `AUTH_PROVIDER=cognito` |

**Alternative:** IAM Identity Center + SAML/OIDC into Cognito or custom JWT issuer — still map roles the same way.

**API Gateway:** JWT authorizer against Cognito JWKS (see [AWS_IAM_AND_EDGE_CONFIG.md](AWS_IAM_AND_EDGE_CONFIG.md)).

---

### 3.2 Edge & platform Terraform (planned)

| Component | Maturity | Notes |
|-----------|----------|-------|
| VPC, EKS, RDS PostgreSQL, ECR, ALB | Design | Target: `deployment/aws/terraform/` |
| CloudFront + AWS WAF | Design | `app.`, `api.` |
| API Gateway (HTTP/REST) | Design | Cognito JWT |
| Private EKS API | Design (prod) | SSM / Bastion |
| KMS + Secrets Manager modules | Design | CMK + app secrets |
| Nitro Enclaves / confidential pool | Design | CCRP |

**Typical `terraform.tfvars`:**

| Setting | Example | Description |
|---------|---------|-------------|
| `aws_account_id` | `123456789012` | |
| `region` | `us-east-1` | |
| `environment` | `dev` | Name prefix `can-{env}-*` |
| `db_password` | secret | Prefer Secrets Manager |
| `eks_node_count` | `3` | |
| `enable_cloudfront` / `enable_api_gateway` | `true` | When modules land |
| `kms_key_alias` | `alias/can-dev` | Platform CMK |

---

### 3.3 Secrets Manager & KMS (platform)

| Variable | Example | Description |
|----------|---------|-------------|
| `AWS_REGION` | `us-east-1` | Default region |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | — | Prefer IRSA / instance role on EKS |
| `AWS_USE_IRSA` | `true` | Workload identity |
| `SECRET_BACKEND` | `aws-secrets` \| `env` | Maps to `AWS_SECRETS` in code |
| `AWS_SECRETS_PREFIX` | `can/dev/` | Secret name prefix |
| `AWS_KMS_KEY_ID` | ARN or alias | Platform CMK |
| `AWS_S3_SSE_KMS_KEY_ID` | ARN | Bucket default encryption |

**Secret names:** `can/{env}/db-connection`, `can/{env}/cognito-client-secret`, `can/{env}/redis-password`.

---

### 3.4 Signing keys

| Variable | Example | Description |
|----------|---------|-------------|
| `SIGNING_KEY_BACKEND` | `database` \| `aws-kms` \| `aws-cloudhsm` | Prod: KMS/CloudHSM |
| `SIGNING_KMS_KEY_ID` | ARN | Asymmetric signing key |
| `SIGNING_REQUIRE_CRYPTO_VERIFY` | `true` (prod) | |
| `SIGNING_REQUIRE_DID_VERIFY` | `true` when DID claimed | |
| `SIGNING_DEFAULT_ALGORITHM` | `ECDSA_P256` | |

---

### 3.5 DEK / MEK & CAN release

| Variable | Example | Description |
|----------|---------|-------------|
| `CAN_PRINCIPAL_KEY_MODE` | `signals` \| `attested-tls` \| `nitro-enclave` | Prod target |
| `CAN_ESCROW_TIMEOUT_MS` | `600000` | |
| `CAN_ATTESTATION_PROVIDER` | `simulated` \| `aws-nitro` | |
| `CAN_REJECT_KEY_MATERIAL_ON_API` | `true` | |
| `PLATFORM_ENCRYPTION_MODE` | `demo` \| `disabled` | |

---

### 3.6 Contract KMS (`kmsConfigs`)

| Field | Example |
|-------|---------|
| `provider` | `aws-kms` |
| `keyId` | KMS key ARN |
| `region` | `us-east-1` |

| Variable | Example | Description |
|----------|---------|-------------|
| `CONTRACT_KMS_ENFORCE` | `true` (prod) | |
| `CONTRACT_KMS_ALLOWED_PROVIDERS` | `aws-kms` | |

---

### 3.7 AWS training execution

| Mode | Maturity |
|------|----------|
| `local-docker` | Implemented |
| `aws` / EKS Job / ECS | Design |
| `awsProvider.js` | Stub / simulated |

| Variable | Example | Description |
|----------|---------|-------------|
| `TRAINING_EXECUTION_MODE` | `local-docker` \| `aws` | |
| `TRAINING_SIMULATION_MODE` | `false` | |
| `AWS_TRAINING_COMPUTE` | `eks-job` \| `ecs` \| `ec2` \| `nitro-enclave` | |
| `LOCAL_TRAINING_IMAGE` | `{acct}.dkr.ecr.{region}.amazonaws.com/local-trainer:tag` | |
| `AWS_DEFAULT_REGION` | `us-east-1` | |

**TSP credentials:** `accessKeyId`, `secretAccessKey`, `region` (prefer assumed roles / OIDC later); secret manager `AWS_SECRETS`.

---

### 3.8 S3 storage

| Bucket | Purpose |
|--------|---------|
| `can-{env}-datasets` | Dataset ciphertext |
| `can-{env}-training-outputs` | Job outputs |
| `can-{env}-artifacts` | Registered models |

| Variable | Example | Description |
|----------|---------|-------------|
| `DATASET_STORAGE_BACKEND` | `local` \| `aws-s3` | |
| `AWS_S3_BUCKET_DATASETS` | `can-dev-datasets` | |
| `AWS_S3_BUCKET_OUTPUTS` | `can-dev-training-outputs` | |
| `AWS_S3_BUCKET_ARTIFACTS` | `can-dev-artifacts` | |
| `AWS_S3_ENDPOINT` | optional | Custom / LocalStack |

---

### 3.9 SCITT CCF on AWS

| Variable | Example | Description |
|----------|---------|-------------|
| `SCITT_CCF_ENABLED` | `false` until stood up | |
| `SCITT_CCF_URL` | `https://scitt.{env}.example.com` | |
| `SCITT_DEPLOYMENT` | `eks` \| `ec2` \| `none` | |

---

### 3.10 Inference & E2E

| Variable | Example | Description |
|----------|---------|-------------|
| `INFERENCE_EXECUTION_MODE` | `docker` \| `eks-job` | |
| `INFERENCE_TIMEOUT_MS` | `600000` | |
| `E2E_AUTH_PROVIDER` | `cognito` | Staging |
| `PLAYWRIGHT_BASE_URL` | `https://app.staging.example.com` | |

---

### 3.11 CCRP / TSP AWS credentials

| Setting | Description |
|---------|-------------|
| Access key / secret / region | Per TSP today (encrypt at rest) |
| Target | Prefer IAM role ARN + external ID / OIDC |
| Secret manager | `AWS_SECRETS` |

Code: `backend/services/providers/awsProvider.js`, `secretManager.js`.

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

### 4.2 AWS Pilot (Phase 1)

```bash
AUTH_PROVIDER=cognito
KEYCLOAK_ENABLED=false
COGNITO_USER_POOL_ID=...
COGNITO_CLIENT_ID=...
COGNITO_REGION=us-east-1
AWS_USE_IRSA=true
SECRET_BACKEND=aws-secrets
AWS_REGION=us-east-1
AWS_KMS_KEY_ID=alias/can-dev
DATASET_STORAGE_BACKEND=aws-s3
TRAINING_EXECUTION_MODE=aws
SIGNING_KEY_BACKEND=database
SIGNING_REQUIRE_CRYPTO_VERIFY=false
SCITT_CCF_ENABLED=false
```

### 4.3 AWS CAN production

```bash
SIGNING_KEY_BACKEND=aws-cloudhsm
SIGNING_REQUIRE_CRYPTO_VERIFY=true
CAN_PRINCIPAL_KEY_MODE=nitro-enclave
CAN_ATTESTATION_PROVIDER=aws-nitro
CAN_REJECT_KEY_MATERIAL_ON_API=true
PLATFORM_ENCRYPTION_MODE=disabled
DATASET_STORAGE_BACKEND=aws-s3
AWS_TRAINING_COMPUTE=nitro-enclave
CONTRACT_KMS_ENFORCE=true
CONTRACT_KMS_ALLOWED_PROVIDERS=aws-kms
SCITT_CCF_ENABLED=true
SCITT_DEPLOYMENT=eks
```

---

## 5. Implementation backlog

1. Cognito + JWT adapter; Keycloak local-only  
2. Platform Terraform (VPC, EKS, RDS, ECR, ALB)  
3. S3 dataset backend + IRSA  
4. Signing KMS/CloudHSM + crypto verify  
5. Contract KMS enforce → AWS KMS  
6. EKS/ECS training executor; replace stub `awsProvider`  
7. Nitro attestation for DEK/MEK release  
8. CloudFront + WAF + API Gateway  
9. SCITT on EKS; E2E against staging  

---

## 6. Related code entry points

| Area | Path |
|------|------|
| AWS provider | `backend/services/providers/awsProvider.js` |
| Secrets | `backend/services/secretManager.js` (`AWS_SECRETS`) |
| TEE hints | `backend/services/teeProvisioningService.js`, `teeAttestationService.js` (`AWS_NITRO`) |

---

## 7. Changelog

| Date | Change |
|------|--------|
| 2026-07-26 | Initial AWS feature + configuration catalog |
