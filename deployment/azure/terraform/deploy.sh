#!/bin/bash
# Confidential AI Network - Azure Terraform deployment (AKS + PostgreSQL + ACR)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../../scripts/lib/deploy-common.sh"

CLOUD_NAME="Microsoft Azure"

usage() {
  print_deploy_usage "$CLOUD_NAME"
}

set +e
parse_deploy_args "$@"
rc=$?
set -e
if [ "$rc" = "2" ]; then
  usage
  exit 0
elif [ "$rc" != "0" ]; then
  usage
  exit 1
fi

REPO_ROOT="$(find_repo_root "$SCRIPT_DIR")" || {
  print_error "Could not locate repository root"
  exit 1
}

cd "$SCRIPT_DIR"

print_header "Confidential AI Network - Azure Deployment"

require_cmd terraform
require_cmd az "Install: https://learn.microsoft.com/cli/azure/install-azure-cli"
ensure_tfvars "$SCRIPT_DIR"

print_status "Checking Azure login..."
az account show >/dev/null 2>&1 || {
  print_error "Not logged in to Azure. Run: az login"
  exit 1
}
print_success "Azure CLI authenticated as: $(az account show --query name -o tsv)"

terraform_init_validate
terraform_plan_apply

if [ "$DEPLOY_PLAN_ONLY" = true ]; then
  exit 0
fi

RESOURCE_GROUP="$(terraform output -raw resource_group_name)"
AKS_CLUSTER="$(terraform output -raw aks_cluster_name)"
REGISTRY_URL="$(terraform output -raw container_registry_url)"
LB_IP="$(terraform output -raw load_balancer_ip)"
FRONTEND_URL="$(terraform output -raw frontend_url)"
BACKEND_URL="$(terraform output -raw backend_url)"
AUTH_PROVIDER="$(terraform output -raw auth_provider 2>/dev/null || echo entra)"
ENTRA_AUTHORITY="$(terraform output -raw entra_authority 2>/dev/null || true)"
export DEPLOY_ENV_TAG="$(terraform output -raw environment 2>/dev/null || true)"
export IMAGE_TAG="${IMAGE_TAG:-$(terraform output -raw effective_image_tag 2>/dev/null || true)}"

if [ "$DEPLOY_SKIP_KUBECTL" != true ]; then
  require_cmd kubectl
  print_status "Configuring kubectl for AKS cluster ${AKS_CLUSTER}..."
  az aks get-credentials \
    --resource-group "$RESOURCE_GROUP" \
    --name "$AKS_CLUSTER" \
    --overwrite-existing
  kubectl cluster-info
  print_success "kubectl configured"
fi

if [ "$DEPLOY_BUILD_IMAGES" = true ]; then
  print_status "Logging in to Azure Container Registry..."
  ACR_NAME="${REGISTRY_URL%%.azurecr.io}"
  az acr login --name "$ACR_NAME"
  build_app_images "$REPO_ROOT" "$REGISTRY_URL"
  if [ "$DEPLOY_SKIP_KUBECTL" != true ]; then
    restart_k8s_deployments
    wait_for_k8s_deployments
  fi
fi

print_urls_summary "$LB_IP" "$FRONTEND_URL" "$BACKEND_URL" "(IdP: ${AUTH_PROVIDER}${ENTRA_AUTHORITY:+ — ${ENTRA_AUTHORITY}})"

echo "Next steps:"
terraform output -json next_steps | jq -r '.[]' 2>/dev/null || terraform output next_steps
echo ""
print_success "Azure deployment complete"
