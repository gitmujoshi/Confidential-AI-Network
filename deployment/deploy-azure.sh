#!/bin/bash
# Confidential AI Network - Azure deployment entry point
#
# Modes:
#   terraform (default) - AKS + PostgreSQL + ACR via Terraform
#   vm                  - Single-VM docker-compose via Azure CLI

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MODE="${1:-terraform}"
shift || true

usage() {
  cat <<EOF
Confidential AI Network - Azure Deployment

Usage:
  ./deployment/deploy-azure.sh [mode] [options]

Modes:
  terraform   Deploy AKS infrastructure (default)
              Options: -y --images --plan-only --skip-kubectl
  vm          Single-VM quick start (Azure CLI + docker-compose)
  destroy     Tear down Terraform stack (-y for auto-approve)
  help        Show this message

Examples:
  ./deployment/deploy-azure.sh terraform -y --images
  ./deployment/deploy-azure.sh vm
  ./deployment/deploy-azure.sh destroy -y

Docs:
  deployment/azure/terraform/README.md
  docs/deployment/AZURE_READINESS.md
EOF
}

case "$MODE" in
  terraform|tf|k8s|aks)
    exec "$SCRIPT_DIR/azure/terraform/deploy.sh" "$@"
    ;;
  destroy|teardown)
    exec "$SCRIPT_DIR/azure/terraform/destroy.sh" "$@"
    ;;
  vm|single-vm)
    exec "$REPO_ROOT/deploy/azure/deploy-azure.sh" "$@"
    ;;
  help|-h|--help)
    usage
    ;;
  -y|--auto-approve|--images|--plan-only|--skip-kubectl|--no-images)
    exec "$SCRIPT_DIR/azure/terraform/deploy.sh" "$MODE" "$@"
    ;;
  *)
    print_error() { echo "[ERROR] $1" >&2; }
    print_error "Unknown mode: $MODE"
    usage
    exit 1
    ;;
esac
