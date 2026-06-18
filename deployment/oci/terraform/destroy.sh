#!/bin/bash
# Confidential AI Network - OCI Terraform destroy

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../../scripts/lib/deploy-common.sh"

parse_deploy_args "$@" || true
rc=$?

cd "$SCRIPT_DIR"

print_header "Confidential AI Network - OCI Destroy"

require_cmd terraform
ensure_tfvars "$SCRIPT_DIR"

terraform init -input=false
terraform_destroy_stack
cleanup_terraform_local_files

print_success "OCI stack destroyed"
