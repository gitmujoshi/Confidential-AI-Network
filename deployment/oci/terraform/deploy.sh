#!/bin/bash
# Confidential AI Network - OCI Terraform deployment (OKE + ADB + OCIR)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../../scripts/lib/deploy-common.sh"

CLOUD_NAME="Oracle Cloud Infrastructure"

usage() {
  print_deploy_usage "$CLOUD_NAME"
  cat <<EOF

OCI image push prerequisites:
  export OCI_AUTH_TOKEN="<your-auth-token>"
  export OCI_USERNAME="<tenancy-namespace>/<oci-username>"

Generate an auth token: OCI Console → Profile → Auth Tokens
EOF
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

print_header "Confidential AI Network - OCI Deployment"

require_cmd terraform
if ! command -v oci >/dev/null 2>&1; then
  print_warning "OCI CLI not installed; registry login may require manual docker login"
else
  print_success "OCI CLI found"
fi
ensure_tfvars "$SCRIPT_DIR"

terraform_init_validate
terraform_plan_apply

if [ "$DEPLOY_PLAN_ONLY" = true ]; then
  exit 0
fi

REGISTRY_URL="$(terraform output -raw container_registry_url)"
LB_IP="$(terraform output -raw load_balancer_ip)"
FRONTEND_URL="$(terraform output -raw frontend_url)"
BACKEND_URL="$(terraform output -raw backend_url)"
KEYCLOAK_URL="$(terraform output -raw ***REMOVED-KEYCLOAK_DB_PASSWORD***_url)"
export DEPLOY_ENV_TAG="$(terraform output -raw environment 2>/dev/null || true)"
export IMAGE_TAG="${IMAGE_TAG:-$(terraform output -raw effective_image_tag 2>/dev/null || true)}"

if [ "$DEPLOY_SKIP_KUBECTL" != true ]; then
  require_cmd kubectl
  print_status "Writing kubeconfig from Terraform output..."
  terraform output -raw kubeconfig > kubeconfig
  export KUBECONFIG="${SCRIPT_DIR}/kubeconfig"
  chmod 600 kubeconfig
  kubectl cluster-info
  print_success "kubectl configured for OKE"
fi

if [ "$DEPLOY_BUILD_IMAGES" = true ]; then
  oci_login_ocir() {
    local registry_host="${REGISTRY_URL%%/*}"
    if [ -n "${OCI_AUTH_TOKEN:-}" ] && [ -n "${OCI_USERNAME:-}" ]; then
      print_status "Logging in to OCIR (${registry_host})..."
      echo "$OCI_AUTH_TOKEN" | docker login "$registry_host" -u "$OCI_USERNAME" --password-stdin
      return 0
    fi
    print_warning "Set OCI_AUTH_TOKEN and OCI_USERNAME to push images automatically."
    print_status "Manual login: docker login ${registry_host}"
    return 1
  }

  if oci_login_ocir; then
    build_app_images "$REPO_ROOT" "$REGISTRY_URL"
    if [ "$DEPLOY_SKIP_KUBECTL" != true ]; then
      restart_k8s_deployments
      wait_for_k8s_deployments
    fi
  else
    print_warning "Skipping image push. Build locally with:"
    echo "  docker build -t ${REGISTRY_URL}/backend:latest ${REPO_ROOT}/backend"
    echo "  docker build -t ${REGISTRY_URL}/frontend:latest ${REPO_ROOT}/frontend"
  fi
fi

print_urls_summary "$LB_IP" "$FRONTEND_URL" "$BACKEND_URL" "$KEYCLOAK_URL"

echo "Next steps:"
terraform output -json next_steps | jq -r '.[]' 2>/dev/null || terraform output next_steps
echo ""
print_success "OCI deployment complete"
