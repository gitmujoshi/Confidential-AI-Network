#!/bin/bash
# Shared helpers for Confidential AI Network cloud deployment scripts.

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

DEPLOY_AUTO_APPROVE=false
DEPLOY_BUILD_IMAGES=false
DEPLOY_PLAN_ONLY=false
DEPLOY_SKIP_KUBECTL=false
DEPLOY_CLEANUP_STATE=false
K8S_NAMESPACE="${K8S_NAMESPACE:-contract-management}"

print_header() {
  echo ""
  echo -e "${CYAN}==========================================${NC}"
  echo -e "${CYAN}  $1${NC}"
  echo -e "${CYAN}==========================================${NC}"
  echo ""
}

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

find_repo_root() {
  local dir="$1"
  while [ "$dir" != "/" ]; do
    if [ -f "$dir/package.json" ] && [ -d "$dir/backend" ] && [ -d "$dir/frontend" ]; then
      echo "$dir"
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  return 1
}

require_cmd() {
  local cmd="$1"
  local hint="${2:-}"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    print_error "$cmd is not installed.${hint:+ $hint}"
    exit 1
  fi
}

parse_deploy_args() {
  while [ $# -gt 0 ]; do
    case "$1" in
      -y|--auto-approve|--yes)
        DEPLOY_AUTO_APPROVE=true
        ;;
      --images)
        DEPLOY_BUILD_IMAGES=true
        ;;
      --no-images)
        DEPLOY_BUILD_IMAGES=false
        ;;
      --plan-only)
        DEPLOY_PLAN_ONLY=true
        ;;
      --skip-kubectl)
        DEPLOY_SKIP_KUBECTL=true
        ;;
      --cleanup-state)
        DEPLOY_CLEANUP_STATE=true
        ;;
      -h|--help)
        return 2
        ;;
      *)
        print_error "Unknown argument: $1"
        return 1
        ;;
    esac
    shift
  done
  return 0
}

print_deploy_usage() {
  local cloud="$1"
  cat <<EOF
Usage: ./deploy.sh [options]

Deploy Confidential AI Network infrastructure on ${cloud} using Terraform.

Options:
  -y, --auto-approve   Apply/destroy without interactive confirmation
  --images             Build and push backend/frontend images after apply
  --no-images          Skip image build (default)
  --plan-only          Run terraform plan only; do not apply
  --skip-kubectl       Skip kubectl configuration after apply
  --cleanup-state      Remove local terraform state files after destroy
  -h, --help           Show this help

Examples:
  ./deploy.sh
  ./deploy.sh -y --images
  ./destroy.sh -y
EOF
}

ensure_tfvars() {
  local tf_dir="$1"
  if [ ! -f "$tf_dir/terraform.tfvars" ]; then
    print_error "terraform.tfvars not found in $tf_dir"
    print_status "Copy terraform.tfvars.example to terraform.tfvars and configure values."
    exit 1
  fi
}

terraform_init_validate() {
  print_status "Initializing Terraform..."
  terraform init -input=false
  print_status "Validating Terraform configuration..."
  terraform validate
  print_success "Terraform configuration is valid"
}

terraform_plan_apply() {
  local plan_file="${1:-tfplan}"

  print_status "Planning Terraform deployment..."
  terraform plan -out="$plan_file"

  if [ "$DEPLOY_PLAN_ONLY" = true ]; then
    print_success "Plan complete (--plan-only). Review $plan_file before applying."
    return 0
  fi

  if [ "$DEPLOY_AUTO_APPROVE" != true ]; then
    echo ""
    read -p "Proceed with deployment? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      print_warning "Deployment cancelled"
      rm -f "$plan_file"
      exit 0
    fi
  fi

  print_status "Applying Terraform deployment..."
  terraform apply -input=false "$plan_file"
  rm -f "$plan_file"
  print_success "Terraform apply complete"
}

terraform_destroy_stack() {
  print_warning "This will destroy ALL infrastructure managed by this Terraform stack."

  if [ "$DEPLOY_AUTO_APPROVE" != true ]; then
    echo ""
    read -p "Type 'yes' to confirm destruction: " -r
    echo ""
    if [[ $REPLY != "yes" ]]; then
      print_warning "Destroy cancelled"
      exit 0
    fi
  fi

  print_status "Destroying infrastructure..."
  terraform destroy -auto-approve
  print_success "Infrastructure destroyed"
}

resolve_image_tag() {
  local repo_root="$1"

  if [ -n "${IMAGE_TAG:-}" ]; then
    echo "$IMAGE_TAG"
    return 0
  fi

  if command -v git >/dev/null 2>&1 && git -C "$repo_root" rev-parse --short HEAD >/dev/null 2>&1; then
    git -C "$repo_root" rev-parse --short HEAD
    return 0
  fi

  echo "latest"
}

push_image_with_aliases() {
  local registry_url="$1"
  local component="$2"
  local source_tag="$3"
  local env_alias="${DEPLOY_ENV_TAG:-}"

  docker push "${registry_url}/${component}:${source_tag}"

  if [ -n "$env_alias" ] && [ "$source_tag" != "$env_alias" ]; then
    print_status "Publishing environment alias ${component}:${env_alias}"
    docker tag "${registry_url}/${component}:${source_tag}" "${registry_url}/${component}:${env_alias}"
    docker push "${registry_url}/${component}:${env_alias}"
  fi
}

build_app_images() {
  local repo_root="$1"
  local registry_url="$2"
  local tag
  tag="$(resolve_image_tag "$repo_root")"

  require_cmd docker "Install Docker: https://docs.docker.com/get-docker/"

  if [ "$tag" = "latest" ] && [ "${DEPLOY_ENV_TAG:-}" = "prod" ]; then
    print_error "Refusing to push :latest to production. Set IMAGE_TAG or release_version in terraform.tfvars."
    exit 1
  fi

  print_status "Using image tag: ${tag}"
  [ -n "${DEPLOY_ENV_TAG:-}" ] && print_status "Environment alias tag: ${DEPLOY_ENV_TAG}"

  print_status "Building backend image..."
  docker build -t "${registry_url}/backend:${tag}" "$repo_root/backend"

  print_status "Building frontend image (REACT_APP_API_URL=${REACT_APP_API_URL:-} same-origin /api)..."
  docker build \
    --build-arg "REACT_APP_API_URL=${REACT_APP_API_URL:-}" \
    --build-arg "REACT_APP_AUTH_PROVIDER=${REACT_APP_AUTH_PROVIDER:-oci-iam}" \
    -t "${registry_url}/frontend:${tag}" \
    "$repo_root/frontend"

  print_status "Pushing images to ${registry_url}..."
  push_image_with_aliases "$registry_url" "backend" "$tag"
  push_image_with_aliases "$registry_url" "frontend" "$tag"

  print_success "Images published (tag=${tag}${DEPLOY_ENV_TAG:+, alias=${DEPLOY_ENV_TAG}})"
}

wait_for_k8s_deployments() {
  local timeout="${1:-600}"

  print_status "Waiting for deployments in namespace ${K8S_NAMESPACE}..."
  for deployment in backend frontend; do
    if kubectl get deployment "$deployment" -n "$K8S_NAMESPACE" >/dev/null 2>&1; then
      kubectl wait --for=condition=available --timeout="${timeout}s" \
        "deployment/${deployment}" -n "$K8S_NAMESPACE" || print_warning "Timed out waiting for ${deployment}"
    else
      print_warning "Deployment ${deployment} not found in ${K8S_NAMESPACE}"
    fi
  done
}

restart_k8s_deployments() {
  print_status "Restarting application deployments..."
  for deployment in backend frontend; do
    if kubectl get deployment "$deployment" -n "$K8S_NAMESPACE" >/dev/null 2>&1; then
      kubectl rollout restart "deployment/${deployment}" -n "$K8S_NAMESPACE"
    fi
  done
}

print_urls_summary() {
  local lb_ip="$1"
  local frontend_url="$2"
  local backend_url="$3"
  local identity_line="$4"

  echo ""
  print_header "Deployment Summary"
  echo "Load balancer IP: ${lb_ip}"
  echo ""
  echo "Application URLs:"
  echo "  Frontend:  ${frontend_url}"
  echo "  Backend:   ${backend_url}"
  echo "  Identity:  ${identity_line}"
  echo ""
  echo "Kubernetes:"
  echo "  Namespace: ${K8S_NAMESPACE}"
  echo "  kubectl get pods -n ${K8S_NAMESPACE}"
  echo ""
}

cleanup_terraform_local_files() {
  print_status "Cleaning up local Terraform files..."
  rm -f tfplan kubeconfig
  if [ "$DEPLOY_CLEANUP_STATE" = true ]; then
    rm -f .terraform.lock.hcl
    rm -rf .terraform/
    rm -f terraform.tfstate terraform.tfstate.backup
  fi
  print_success "Local cleanup complete"
}
