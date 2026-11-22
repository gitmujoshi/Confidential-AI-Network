# Confidential AI Network - Azure Terraform Deployment

Baseline + data-plane infrastructure for deploying the Confidential AI Network on **Microsoft Azure**.

**Identity:** Azure uses **Microsoft Entra ID** (not Keycloak). Full feature/settings catalog: [docs/deployment/AZURE_FEATURES_AND_CONFIGURATION.md](../../../docs/deployment/AZURE_FEATURES_AND_CONFIGURATION.md). Env template: [config/examples/config.azure.env.example](../../../config/examples/config.azure.env.example). SPIFFE design: [AZURE_SPIFFE_SPIRE_WIF.md](../../../docs/deployment/AZURE_SPIFFE_SPIRE_WIF.md).

## Architecture

| Module | Azure resources | Default |
|--------|-----------------|---------|
| `networking` | RG, VNet, public/app/data/**PE** subnets, NAT, NSG | on |
| `aks` | AKS + Calico + **OIDC issuer + Workload Identity** | on |
| `database` | PostgreSQL Flexible Server (private) | on |
| `container_registry` | ACR Premium | on |
| `load_balancer` | Public IP + LB for ingress | on |
| `identity` | Entra SPA + API apps + roles | on |
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

## Quick start

```bash
az login
az account set --subscription "<subscription-id>"

cd deployment/azure/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit subscription_id, tenant_id, db_password

chmod +x deploy.sh destroy.sh
./deploy.sh -y --images
```

From repository root:

```bash
./deployment/deploy-azure.sh terraform -y --images
```

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

## Still operator work

- SPIRE Helm install after `enable_spire=true` (the namespace scaffold does not install the chart)
- Public DNS for the load balancer
- A live `terraform apply` against a subscription, including a confidential pool when a real SEV-SNP report is required
- Training status watch and copying artifacts back from Blob

## Related docs

- [Azure Security Architecture](../../../docs/production/AZURE_SECURITY_ARCHITECTURE.md)
- [Azure SPIFFE/SPIRE + Entra WIF](../../../docs/deployment/AZURE_SPIFFE_SPIRE_WIF.md)
- [Azure Readiness](../../../docs/deployment/AZURE_READINESS.md)
- [Azure Features & Configuration](../../../docs/deployment/AZURE_FEATURES_AND_CONFIGURATION.md)

## Destroy

```bash
./destroy.sh
```
