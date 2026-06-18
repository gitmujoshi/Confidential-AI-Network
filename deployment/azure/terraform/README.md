# Confidential AI Network - Azure Terraform Deployment

Baseline infrastructure for deploying the Confidential AI Network on **Microsoft Azure**.

## Architecture

| Module | Azure resources |
|--------|-----------------|
| `networking` | Resource group, VNet, public/app/data subnets, NAT Gateway, NSGs |
| `aks` | Azure Kubernetes Service (Calico network policy) |
| `database` | PostgreSQL Flexible Server (private endpoint) |
| `load_balancer` | Standard public IP + LB for ingress |
| `container_registry` | Azure Container Registry (Premium) |
| `kubernetes_resources` | Namespace, secrets, backend/frontend deployments |

## Prerequisites

- [Terraform](https://www.terraform.io/downloads.html) ≥ 1.0
- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)
- [Docker](https://docs.docker.com/get-docker/)
- Azure subscription with Contributor on target resource group

## Quick start

```bash
az login
az account set --subscription "<subscription-id>"

cd deployment/azure/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit subscription_id, tenant_id, db_password, ***REMOVED-KEYCLOAK_DB_PASSWORD***_admin_password

chmod +x deploy.sh destroy.sh
./deploy.sh -y --images
```

From repository root:

```bash
./deployment/deploy-azure.sh terraform -y --images
```

## Configure kubectl

```bash
az aks get-credentials \
  --resource-group $(terraform output -raw resource_group_name) \
  --name $(terraform output -raw aks_cluster_name)
kubectl get pods -n contract-management
```

## Build and push images

```bash
ACR=$(terraform output -raw container_registry_url)
az acr login --name ${ACR%%.azurecr.io}
docker build -t $ACR/backend:latest ../../../backend/
docker build -t $ACR/frontend:latest ../../../frontend/
docker push $ACR/backend:latest
docker push $ACR/frontend:latest
kubectl rollout restart deployment/backend -n contract-management
kubectl rollout restart deployment/frontend -n contract-management
```

Or use the top-level script:

```bash
./deployment/deploy-azure.sh terraform -y --images
```

## File structure

```
terraform/
├── main.tf
├── variables.tf
├── outputs.tf
├── terraform.tfvars.example
├── deploy.sh
├── destroy.sh
├── README.md
└── modules/
    ├── networking/
    ├── aks/
    ├── database/
    ├── load_balancer/
    ├── container_registry/
    └── kubernetes_resources/
```

## Security hardening (post-baseline)

After `terraform apply`, follow [Azure Security Architecture](../../../docs/production/AZURE_SECURITY_ARCHITECTURE.md) for:

- Azure Front Door + WAF
- API Management JWT validation
- Private AKS cluster + Azure Bastion
- Key Vault + External Secrets Operator
- Microsoft Defender for Cloud

## Alternative: single-VM deploy

For a simpler path without AKS:

```bash
./deploy/azure/deploy-azure.sh
```

## Related docs

- [Azure Security Architecture](../../../docs/production/AZURE_SECURITY_ARCHITECTURE.md)
- [Azure IAM & Edge Config](../../../docs/deployment/AZURE_IAM_AND_EDGE_CONFIG.md)
- [Azure Readiness](../../../docs/deployment/AZURE_READINESS.md)
- [CCRP Azure integration](../../../backend/AZURE_INTEGRATION_GUIDE.md)

## Destroy

```bash
./destroy.sh
```
