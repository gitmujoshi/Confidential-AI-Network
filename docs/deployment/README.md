# Deploy Confidential AI Network

Start here for every environment. Copy two files, fill the required values below, then follow the block for the target. Security, IAM, and SPIRE documents are references at the bottom.

## 1. Create the two env files

From the repository root:

```bash
cp config/examples/config.env.example config.env
cp secrets.env.example secrets.env
```

The process reads `config.env` and `secrets.env` in the repository root. `./start-system.sh` stops when `config.env` is missing. Do not commit `secrets.env`.

Cloud overlays are merged into the same `config.env`. They do not replace it.

| Target | Overlay |
|--------|---------|
| Local | none |
| Azure | `config/examples/config.azure.env.example` |
| Google Cloud | `config/examples/config.gcp.env.example` |
| AWS | `config/examples/config.aws.env.example` |
| OCI | `config/examples/config.oci.env.example` |

## 2. Common parameters

**Required** means `./start-system.sh` needs it for Postgres and Keycloak login. **Optional** means the example value is enough until that feature is used.

### config.env

| Name | Need | Purpose |
|------|------|---------|
| `DB_HOST` | Required | Application Postgres host |
| `DB_PORT` | Required | Application Postgres port (`5432`) |
| `DB_NAME` | Required | Application database name |
| `DB_USER` | Required | Application database user |
| `KEYCLOAK_DB_PORT` | Optional | Keycloak Postgres port (`5433`) |
| `KEYCLOAK_DB_NAME` | Optional | Keycloak database name |
| `KEYCLOAK_DB_USER` | Optional | Keycloak database user |
| `PORT` | Required | API listen port (`5001`) |
| `BACKEND_PORT` | Required | API port used by startup and the UI |
| `NODE_ENV` | Optional | `development` locally |
| `TRAINING_SIMULATION_MODE` | Optional | `true` runs a simulated local job. Cloud jobs ignore this |
| `JWT_EXPIRES_IN` | Optional | Access token lifetime |
| `KEYCLOAK_URL` | Required | Local IdP URL (`https://localhost:8443`) |
| `KEYCLOAK_REALM` | Required | Keycloak realm |
| `KEYCLOAK_CLIENT_ID` | Required | Frontend client id |
| `KEYCLOAK_ADMIN_USER` | Required | Keycloak admin user |
| `KEYCLOAK_ENABLED` | Required | `true` locally. `false` on a cloud IdP |
| `EMAIL_HOST` | Optional | SMTP host |
| `EMAIL_PORT` | Optional | SMTP port |
| `EMAIL_USER` | Optional | SMTP user |
| `EMAIL_FROM` | Optional | From address |
| `BLOCKCHAIN_ENABLED` | Optional | Turn the chain client on |
| `BLOCKCHAIN_NETWORK` | Optional | Chain network name |
| `BLOCKCHAIN_RPC_URL` | Optional | Chain RPC URL |
| `CONTRACT_ADDRESS` | Optional | Deployed chain contract |
| `SCITT_CCF_ENABLED` | Optional | Ledger client on or off |
| `SCITT_CCF_URL` | Optional | Ledger base URL |
| `SCITT_CCF_DASHBOARD_URL` | Optional | Ledger dashboard URL |
| `DID_WEB_DOMAIN` | Optional | did:web host |
| `DID_WEB_PATH` | Optional | did:web document path |
| `DEPA_ENABLED` | Optional | DEPA id features |
| `DEPA_BASE_URL` | Optional | Public app origin used in DEPA ids |
| `DEPLOYMENT_ID` | Optional | Deployment label stamped on records |
| `DEPLOYMENT_PREFIX` | Optional | Prefix on generated DEPA ids |
| `DEPLOYMENT_REGION` | Optional | Region label |
| `DEPLOYMENT_COUNTRY` | Optional | Country label |
| `DEPLOYMENT_JURISDICTION` | Optional | Jurisdiction label |
| `DEPLOYMENT_DATA_RESIDENCY` | Optional | Residency label |
| `DEPLOYMENT_REGULATORY_FRAMEWORK` | Optional | Framework labels |
| `DEPLOYMENT_TIMEZONE` | Optional | Time zone |
| `DEPLOYMENT_CURRENCY` | Optional | Currency shown on dashboards (`USD` or `INR`) |
| `DEPLOYMENT_LANGUAGE` | Optional | Locale |
| `LOG_LEVEL` | Optional | Log verbosity |
| `CORS_ORIGIN` | Optional | Browser origin allowed to call the API |
| `RATE_LIMIT_WINDOW_MS` | Optional | Rate-limit window |
| `RATE_LIMIT_MAX_REQUESTS` | Optional | Requests allowed per window |
| `VAULT_ADDR` | Optional | HashiCorp Vault address |
| `HUGGINGFACE_INTEGRATION_ENABLED` | Optional | Hugging Face catalog calls |
| `HF_TOKEN` | Optional | Hugging Face token for gated repos. Put the value in `secrets.env` |
| `HUGGINGFACE_ORG_NAMESPACE` | Optional | Hugging Face org |

### secrets.env

| Name | Need | Purpose |
|------|------|---------|
| `DB_PASSWORD` | Required | Application database password |
| `POSTGRES_PASSWORD` | Required | Postgres container password |
| `KEYCLOAK_DB_PASSWORD` | Required | Keycloak database password |
| `JWT_SECRET` | Required | Signs API tokens |
| `KEYCLOAK_CLIENT_SECRET` | Required | Keycloak client secret |
| `KEYCLOAK_ADMIN_PASSWORD` | Required | Keycloak admin password |
| `EMAIL_PASS` | Optional | SMTP password |
| `VAULT_TOKEN` | Optional | Vault token |
| `BLOCKCHAIN_PRIVATE_KEY` | Optional | Chain deployer key |
| `EXTERNAL_API_KEY` | Optional | Spare external API key |
| `DATA_ENCRYPTION_KEY` | Optional | Required only when platform encryption services start |

## 3. Local

Identity is Keycloak. Leave `KEYCLOAK_ENABLED=true`.

```bash
./start-system.sh
```

Confirm `http://localhost:5001/health` returns success and open `http://localhost:3000`. Auth failures: `./fix-auth.sh`.

## 4. Azure

Merge `config/examples/config.azure.env.example` into `config.env`. Set `AUTH_PROVIDER=entra` and `KEYCLOAK_ENABLED=false`. Fill `ENTRA_TENANT_ID`, `ENTRA_CLIENT_ID`, `ENTRA_API_CLIENT_ID`, `AZURE_SUBSCRIPTION_ID`, and `AZURE_TENANT_ID`.

Terraform inputs are a second file, not env vars. Copy `deployment/azure/terraform/terraform.tfvars.example` to `terraform.tfvars` and set `subscription_id`, `tenant_id`, and `db_password`.

```bash
./deployment/deploy-azure.sh terraform -y --images
```

A training job uses the AKS cluster already named on the contract and on the TSP Cloud Provider card. The kubeconfig path is on that card, or `AZURE_CCR_KUBECONFIG` on the API host. A missing path fails the job.

Signing stays in the database until `SIGNING_KEY_BACKEND=azure-keyvault`. Key release stays on recorded times until `CAN_PRINCIPAL_KEY_MODE=azure-skr`. A guest report is read from the confidential node. The job stays simulated until that report verifies. Set `SEV_SNP_ARK_PEM` on the API host before a hardware quote can be accepted.

Still operator work: public DNS, a SPIRE Helm install after `enable_spire=true`, and a live apply onto a confidential pool when a real SEV-SNP report is required. External Secrets and the SCITT ledger are `deployment/azure/scripts/install-external-secrets.sh` and `install-scitt.sh`. Both exit when their settings or the cluster are missing.

Confirm the API health URL for the host you published.

## 5. Google Cloud

Merge `config/examples/config.gcp.env.example` into `config.env`. Set `AUTH_PROVIDER=gcp-identity` and `KEYCLOAK_ENABLED=false`. Fill `GCP_PROJECT_ID` and the OIDC client settings in that file.

A training job uses the GKE cluster already named on the contract and on the TSP Cloud Provider card. The kubeconfig path is on that card, or `GCP_CCR_KUBECONFIG` on the API host. A missing path fails the job. There is no GCP Terraform apply script in this repository.

## 6. AWS

Merge `config/examples/config.aws.env.example` into `config.env` when Cognito is the IdP. Set `AUTH_PROVIDER=cognito` and `KEYCLOAK_ENABLED=false`.

AWS training is not implemented. The API returns 501 and does not create a training job.

## 7. OCI

Merge `config/examples/config.oci.env.example` into `config.env`. Set `AUTH_PROVIDER=oci-iam` and `KEYCLOAK_ENABLED=false`. Fill the tenancy, compartment, and identity domain values in that file.

```bash
./deployment/deploy-oci.sh terraform
```

Training uses the existing OKE runner. A missing kubeconfig fails the job.

## 8. After deploy

- Health: `npm run status` and the API `/health` route.
- Local auth: `./fix-auth.sh`.

## Further reading

These are references. They are not required to start a deploy.

| Topic | Document |
|-------|----------|
| Azure modules and flags | [../../deployment/azure/terraform/README.md](../../deployment/azure/terraform/README.md) |
| Azure feature catalog | [AZURE_FEATURES_AND_CONFIGURATION.md](AZURE_FEATURES_AND_CONFIGURATION.md) |
| Azure readiness | [AZURE_READINESS.md](AZURE_READINESS.md) |
| Azure security architecture | [../production/AZURE_SECURITY_ARCHITECTURE.md](../production/AZURE_SECURITY_ARCHITECTURE.md) |
| GCP, AWS, and OCI feature catalogs | [GCP_FEATURES_AND_CONFIGURATION.md](GCP_FEATURES_AND_CONFIGURATION.md), [AWS_FEATURES_AND_CONFIGURATION.md](AWS_FEATURES_AND_CONFIGURATION.md), [OCI_FEATURES_AND_CONFIGURATION.md](OCI_FEATURES_AND_CONFIGURATION.md) |
| Local VM scripts | [../../deployment/README.md](../../deployment/README.md) |
| Production Kubernetes | [../production/PRODUCTION_DEPLOYMENT_GUIDE.md](../production/PRODUCTION_DEPLOYMENT_GUIDE.md) |
