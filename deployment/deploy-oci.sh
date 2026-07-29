#!/bin/bash
# Confidential AI Network - OCI deployment entry point
#
# Modes:
#   terraform (default) - OKE + PostgreSQL + OCIR via Terraform
#   vm                  - Single-compute-instance via OCI CLI

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MODE="${1:-terraform}"
shift || true

usage() {
  cat <<EOF
Confidential AI Network - OCI Deployment

Usage:
  ./deployment/deploy-oci.sh [mode] [options]

Modes:
  terraform   Deploy OKE + PostgreSQL + Identity Domains (default)
              Options: -y --images --plan-only --skip-kubectl
  vm          Single-instance quick start (OCI CLI + docker-compose) [legacy]
  destroy     Tear down Terraform stack (-y for auto-approve)
  help        Show this message

OCI image push (with --images):
  export OCI_AUTH_TOKEN="<auth-token>"
  export OCI_USERNAME="<tenancy-namespace>/<username>"
  export TF_VAR_ocir_username="\$OCI_USERNAME"
  export TF_VAR_ocir_auth_token="\$OCI_AUTH_TOKEN"

Examples:
  ./deployment/deploy-oci.sh terraform -y --images
  ./deployment/deploy-oci.sh destroy -y

Docs:
  deployment/oci/terraform/README.md
  docs/deployment/OCI_READINESS.md
  docs/deployment/OCI_MARKETPLACE_LISTING_CHECKLIST.md
EOF
}

case "$MODE" in
  terraform|tf|k8s|oke)
    exec "$SCRIPT_DIR/oci/terraform/deploy.sh" "$@"
    ;;
  destroy|teardown)
    exec "$SCRIPT_DIR/oci/terraform/destroy.sh" "$@"
    ;;
  vm|single-vm)
    exec "$REPO_ROOT/deploy/oci/deploy-oci.sh" "$@"
    ;;
  help|-h|--help)
    usage
    ;;
  -y|--auto-approve|--images|--plan-only|--skip-kubectl|--no-images)
    exec "$SCRIPT_DIR/oci/terraform/deploy.sh" "$MODE" "$@"
    ;;
  *)
    print_error() { echo "[ERROR] $1" >&2; }
    print_error "Unknown mode: $MODE"
    usage
    exit 1
    ;;
esac
