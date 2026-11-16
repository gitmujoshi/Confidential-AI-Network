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
| `enable_confidential_compute` | `false` | AMD SEV-SNP user node pool (`Standard_DC4as_v5`). Tainted so only CCR jobs schedule there. Does not collect a hardware quote |
| `enable_edge` | `false` | Azure Front Door + WAF |
| `enable_spire` | `false` | SPIRE namespace scaffold; then Helm install |

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
│   └── spire/              # optional
└── ../helm/spire/values.yaml
```

## Confidential pool

```bash
# terraform.tfvars — confirm Standard_DC4as_v5 (or another DCasv5 size) exists in the region
enable_confidential_compute = true
```

The pool is tainted `can.azure/confidential=true:NoSchedule` and labeled `can.azure/pool=confidential`. A ConfigMap `azure-ccr-pool` in `contract-management` records the size and toleration. Landing a pod on these nodes is not a SEV-SNP quote and does not release Key Vault keys.

## Still out of scope / follow-ups

- Full APIM JWT policy as code (see [AZURE_IAM_AND_EDGE_CONFIG.md](../../../docs/deployment/AZURE_IAM_AND_EDGE_CONFIG.md))
- Guest attestation and Key Vault secure key release for the confidential pool
- External Secrets Operator Helm release (WI principal is ready)
- SCITT on AKS

## Related docs

- [Azure Security Architecture](../../../docs/production/AZURE_SECURITY_ARCHITECTURE.md)
- [Azure SPIFFE/SPIRE + Entra WIF](../../../docs/deployment/AZURE_SPIFFE_SPIRE_WIF.md)
- [Azure Readiness](../../../docs/deployment/AZURE_READINESS.md)
- [Azure Features & Configuration](../../../docs/deployment/AZURE_FEATURES_AND_CONFIGURATION.md)

## Destroy

```bash
./destroy.sh
```
