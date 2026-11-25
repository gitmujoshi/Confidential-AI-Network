# Confidential AI Network - Azure Terraform Deployment

Baseline + data-plane infrastructure for deploying the Confidential AI Network on **Microsoft Azure**.

**Identity:** the default is **Microsoft Entra ID**. Set `identity_mode = "keycloak"` to run Keycloak on AKS with its database on the same Azure Postgres server. Full feature/settings catalog: [docs/deployment/AZURE_FEATURES_AND_CONFIGURATION.md](../../../docs/deployment/AZURE_FEATURES_AND_CONFIGURATION.md). Env template: [config/examples/config.azure.env.example](../../../config/examples/config.azure.env.example). SPIFFE design: [AZURE_SPIFFE_SPIRE_WIF.md](../../../docs/deployment/AZURE_SPIFFE_SPIRE_WIF.md).

## Architecture

| Module | Azure resources | Default |
|--------|-----------------|---------|
| `networking` | RG, VNet, public/app/data/**PE** subnets, NAT, NSG | on |
| `aks` | AKS + Calico + **OIDC issuer + Workload Identity** | on |
| `database` | PostgreSQL Flexible Server (private). App database always. `keycloak` database when `identity_mode=keycloak` | on |
| `container_registry` | ACR Premium | on |
| `load_balancer` | Public IP + LB for ingress | on |
| `identity` | Entra SPA + API apps + roles | on when `identity_mode=entra` |
| `key_vault` | Key Vault + seeded DB/Entra secrets | **on** (`enable_key_vault`) |
| `storage` | Storage account + datasets/outputs/artifacts containers | **on** (`enable_storage`) |
| `workload_identity` | UAMI + federated credentials + KV/Blob RBAC | **on** (`enable_workload_identity`) |
| `kubernetes_resources` | Namespace, ConfigMap, secrets, backend SA (WI), deployments | on |
| `private_dns` | `privatelink` zones for Key Vault and Blob | **with** `enable_private_endpoints` |
| `confidential_compute` | DCasv5 user node pool, trainer SA, CCR ConfigMap | **off** (`enable_confidential_compute`) |
| `edge` | Front Door + WAF | **off** (`enable_edge`) |
| `apim` | Consumption API Management and the Entra JWT policy | **off** (`enable_apim`, and only when email and backend URL are set) |
| `external_secrets` | `external-secrets` namespace and Workload Identity service account | **off** (`enable_external_secrets`) |
| `spire` | SPIRE namespace + trust-domain ConfigMaps | **off** (`enable_spire`) |

## Prerequisites

- [Terraform](https://www.terraform.io/downloads.html) ≥ 1.0
- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)
- [Docker](https://docs.docker.com/get-docker/)
- Azure subscription with Contributor (+ permission to create Entra apps if `create_entra_apps=true`)

## Deploy steps

The apply creates the resource group, network, AKS cluster, Postgres, container registry, load balancer, Key Vault, Blob, and the API and UI in namespace `contract-management`. The default `identity_mode` is `entra`: it creates the Entra apps and sets `AUTH_PROVIDER=entra` and `KEYCLOAK_ENABLED=false`.

To use Keycloak instead, set `identity_mode = "keycloak"` and `keycloak_admin_password` in `terraform.tfvars` before the apply. That creates a `keycloak` database on the same Postgres server, runs Keycloak 23 in the namespace, and sets `AUTH_PROVIDER=keycloak` and `KEYCLOAK_ENABLED=true`. The API reaches Keycloak at `http://keycloak-service.contract-management.svc.cluster.local:8080`. The Keycloak service is a load balancer on port 8080. Entra apps are not created in this mode. After the pods are ready, import the realm from a machine that can reach that load balancer:

```bash
export KEYCLOAK_URL="http://$(kubectl get svc keycloak-service -n contract-management -o jsonpath='{.status.loadBalancer.ingress[0].ip}'):8080"
export KEYCLOAK_ADMIN_USERNAME=admin
export KEYCLOAK_ADMIN_PASSWORD="<the keycloak_admin_password from terraform.tfvars>"
export KEYCLOAK_CLIENT_ID=contract-management-client
export KEYCLOAK_CLIENT_SECRET="$(terraform output -raw keycloak_client_secret)"
node backend/scripts/source/setup-keycloak-realm.js
```

The script creates realm `contract-management`, roles TDP, TDC, CCRP, AppAdmin, and Auditor, and a confidential client. People still need a row in the `users` table before login succeeds. The app database and the Keycloak database both stay on Azure Database for PostgreSQL. The server admin is the database user for both.

To run the laptop stack instead of this cluster, use one VM. That path copies this checkout, starts Keycloak and both Postgres databases in Docker, then starts the API and the UI. It does not create AKS or Azure Database for PostgreSQL. `config.env` and `secrets.env` must already exist in the repo root. The network rules allow your address only.

```bash
./deployment/deploy-azure.sh vm -y
```

It does not create DNS, Entra user assignments, database user rows, a kubeconfig mount, a confidential node pool, SPIRE, External Secrets, API Management, Front Door, or the SCITT ledger. Those are the manual steps below. Do them in order.

### 1. Apply

```bash
az login
az account set --subscription "<subscription-id>"

cd deployment/azure/terraform
cp terraform.tfvars.example terraform.tfvars
```

Set `subscription_id`, `tenant_id`, and `db_password` in `terraform.tfvars`. Do not commit that file. `app_domain` is the hostname you will put in DNS later. The default is `app.dev.example.com`.

```bash
chmod +x deploy.sh destroy.sh
./deploy.sh -y --images
```

From the repository root the same apply is `./deployment/deploy-azure.sh terraform -y --images`.

### 2. Read the outputs

```bash
terraform output load_balancer_ip
terraform output aks_cluster_name
terraform output resource_group_name
terraform output entra_client_id
terraform output entra_api_audience
```

`frontend_url` is `http://<load_balancer_ip>:3000`. `backend_url` is `http://<load_balancer_ip>:5001`.

### 3. Confirm the API

```bash
az aks get-credentials --resource-group "$(terraform output -raw resource_group_name)" --name "$(terraform output -raw aks_cluster_name)"
kubectl get pods -n contract-management
curl -sS "http://$(terraform output -raw load_balancer_ip):5001/health"
```

`/health` is the API route. A 200 body has `"status":"healthy"`.

### 4. DNS (manual)

Create an A record for `app_domain` that points at `load_balancer_ip`. Until that record exists, open the frontend and the API by the load balancer IP and the ports above. Entra redirect URIs use `https://<app_domain>/login`. A public hostname is required before that redirect succeeds. TLS for that name is not created by the default apply. Front Door is `enable_edge=true` and stays off until you set it and apply again.

### 5. Entra users (manual)

Terraform creates the app roles `TDC`, `TDP`, `CCRP`, and `AppAdmin` on the API registration. `CCRP` is the tech service provider role. Assign each person to one of those roles in Entra (Enterprise applications → the API app → Users and groups).

Auditor is not an Entra app role. An auditor still needs a database row with `partyType` `Auditor`.

### 6. Database users (manual)

Entra login looks up `users.email`, then `iamUsername`, then `iamUserId`. A missing row returns HTTP 404 `USER_NOT_FOUND`. The apply does not insert users.

Insert the first rows in the `users` table on the Postgres server from `terraform output database_host`. Required columns are `name`, `email`, and `partyType`. `partyType` is `TDP`, `TDC`, `TSP`, `AppAdmin`, or `Auditor`. Use `TSP` for a tech service provider. The email must match the Entra account. The first AppAdmin row has to be inserted this way, because no Entra login can create it.

### 7. Training cluster path (manual)

The apply does not set `AZURE_CCR_KUBECONFIG` and does not mount a kubeconfig into the backend container. Training reads `cloudAccount.Azure.kubeconfigPath` on the tech service provider card, or `AZURE_CCR_KUBECONFIG` on the API process. An empty path fails the job with HTTP 502.

Copy a kubeconfig for this AKS cluster onto a path inside the backend container. Add `AZURE_CCR_KUBECONFIG` to the `app-config` ConfigMap in `contract-management` and roll the backend deployment. On the tech service provider Cloud Provider card, save the cluster name from `terraform output aks_cluster_name` and that same kubeconfig path.

### 8. Key release and a hardware quote (manual)

The ConfigMap does not set `CAN_KEY_RELEASE_PROFILE`, `CAN_PRINCIPAL_KEY_MODE`, or `SEV_SNP_ARK_PEM`.

- Leave the profile unset on a pilot. The mock broker is `CAN_PRINCIPAL_KEY_MODE=signals`.
- Set `CAN_KEY_RELEASE_PROFILE=production` when this cluster must refuse the mock broker. The API will not start on `signals` or `mock` with that profile.
- `CAN_PRINCIPAL_KEY_MODE=azure-skr` verifies an Azure Attestation token and returns an encrypted Key Vault blob. The API does not decrypt the blob. Set `AZURE_ATTESTATION_URL` to the attestation endpoint. A simulated report is refused.
- Put the AMD ARK PEM on the API host and set `SEV_SNP_ARK_PEM` before a hardware quote can be accepted. Until a quote verifies, the job stays simulated.

Add those names to `app-config` or a secret and roll the backend deployment.

### 9. Optional installs (manual)

Each one stays off until you set the flag and apply again, then run the extra command.

| Flag | Then |
|------|------|
| `enable_confidential_compute=true` | Confirm `Standard_DC4as_v5` exists in the region, then apply. The pool is tainted `can.azure/confidential=true:NoSchedule`. A node without `/sys/kernel/config/tsm` fails the training container |
| `enable_spire=true` | Apply, then the Helm command in the SPIRE section below. The namespace scaffold does not install the chart |
| `enable_external_secrets=true` | Apply, then `deployment/azure/scripts/install-external-secrets.sh`. It exits when the vault name, tenant id, client id, or cluster is missing |
| `enable_edge=true` | Apply again for Front Door and WAF |
| `enable_apim=true` | Also set `apim_publisher_email` and `apim_backend_url`, then apply |
| SCITT | `deployment/azure/scripts/install-scitt.sh` with `SCITT_IMAGE` and `DATABASE_URL`. It exits when either is missing. Set `SCITT_CCF_ENABLED=true` only after that install succeeds |

Blob containers are created. The app path `DATASET_STORAGE_BACKEND=azure-blob` is still open, and trained artifacts are not copied back from Blob. Those two are product gaps, not steps you can finish from this page.

### 10. Smoke

1. Open the frontend URL and sign in with an Entra user whose email exists in `users`.
2. Sign in once each as TDC, TDP, TSP, AppAdmin, and Auditor.
3. Start a training job with the kubeconfig path empty and confirm HTTP 502.
4. With `CAN_KEY_RELEASE_PROFILE=production`, confirm the API refuses `CAN_PRINCIPAL_KEY_MODE=signals`.

## Feature flags

| Variable | Default | Purpose |
|----------|---------|---------|
| `enable_key_vault` | `true` | Platform Key Vault + secret seed |
| `enable_storage` | `true` | Blob containers for datasets / outputs / artifacts |
| `enable_workload_identity` | `true` | AKS OIDC + UAMI for `backend`, `training-job`, `external-secrets` |
| `enable_private_endpoints` | `false` | PE for KV + Storage, plus private DNS zones linked to the VNet |
| `enable_confidential_compute` | `false` | AMD SEV-SNP user node pool (`Standard_DC4as_v5`). Tainted so only CCR jobs schedule there. The training Job reads the guest report from the node |
| `enable_edge` | `false` | Azure Front Door + WAF |
| `enable_apim` | `false` | Consumption APIM and the Entra JWT policy. Also set `apim_publisher_email` and `apim_backend_url` |
| `enable_external_secrets` | `false` | Service account only. Install the operator with `deployment/azure/scripts/install-external-secrets.sh` |
| `enable_spire` | `false` | SPIRE namespace scaffold. Helm install is still a separate step |

## SPIRE (optional)

```bash
# terraform.tfvars
enable_spire = true
spiffe_trust_domain = "can.dev.azure.example"

terraform apply
helm repo add spiffe https://spiffe.github.io/helm-charts-hardened/
helm upgrade --install spire spiffe/spire -n spire \
  -f ../../helm/spire/values.yaml
```

## Configure kubectl

```bash
az aks get-credentials \
  --resource-group $(terraform output -raw resource_group_name) \
  --name $(terraform output -raw aks_cluster_name)
kubectl get pods -n contract-management
```

## File structure

```
terraform/
├── main.tf
├── variables.tf
├── outputs.tf
├── terraform.tfvars.example
├── deploy.sh / destroy.sh
├── modules/
│   ├── networking/
│   ├── aks/
│   ├── database/
│   ├── container_registry/
│   ├── load_balancer/
│   ├── identity/
│   ├── key_vault/          # NEW
│   ├── storage/            # NEW
│   ├── workload_identity/  # NEW
│   ├── kubernetes_resources/
│   ├── private_dns/        # with enable_private_endpoints
│   ├── confidential_compute/ # optional DCasv5 pool
│   ├── edge/               # optional
│   ├── apim/               # optional
│   ├── external_secrets/   # optional service account
│   └── spire/              # optional
├── ../apim/can-api-policy.xml.tpl
├── ../helm/external-secrets/values.yaml
├── ../helm/spire/values.yaml
├── ../manifests/external-secrets/
├── ../manifests/scitt/
├── ../scripts/install-external-secrets.sh
└── ../scripts/install-scitt.sh
```

## Confidential pool

```bash
# terraform.tfvars — confirm Standard_DC4as_v5 (or another DCasv5 size) exists in the region
enable_confidential_compute = true
```

The pool is tainted `can.azure/confidential=true:NoSchedule` and labeled `can.azure/pool=confidential`. A ConfigMap `azure-ccr-pool` in `contract-management` records the size and toleration. The training Job mounts `/sys/kernel/config/tsm` and runs `training/azure_guest_quote.py` before training. The job stays simulated until that report verifies. A node without the guest interface fails the container. Key release into the clean room is `CAN_PRINCIPAL_KEY_MODE=azure-skr` and requires a verified Azure Attestation JWT.

## Optional installs after apply

```bash
# External Secrets. Exits before Helm when the vault settings or cluster are missing.
export AZURE_KEY_VAULT_NAME=can-dev-kv AZURE_TENANT_ID=... AZURE_CLIENT_ID=... AZURE_ENVIRONMENT=dev
../../scripts/install-external-secrets.sh

# SCITT ledger from this repo. Exits before apply when the image, database URL, or cluster is missing.
export SCITT_IMAGE=... DATABASE_URL=...
../../scripts/install-scitt.sh
```

## Related docs

- [Azure Security Architecture](../../../docs/production/AZURE_SECURITY_ARCHITECTURE.md)
- [Azure SPIFFE/SPIRE + Entra WIF](../../../docs/deployment/AZURE_SPIFFE_SPIRE_WIF.md)
- [Azure Readiness](../../../docs/deployment/AZURE_READINESS.md)
- [Azure Features & Configuration](../../../docs/deployment/AZURE_FEATURES_AND_CONFIGURATION.md)

## Destroy

```bash
./destroy.sh
```
