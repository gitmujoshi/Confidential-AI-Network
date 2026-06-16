#!/bin/bash
# Confidential AI Network - Azure Terraform Destroy Script

set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

main() {
  echo "=========================================="
  echo "Confidential AI Network - Azure Destroy"
  echo "=========================================="
  command -v terraform >/dev/null || { print_error "Terraform not installed"; exit 1; }
  [ -f terraform.tfvars ] || { print_error "terraform.tfvars not found"; exit 1; }
  terraform init
  print_warning "This will destroy ALL Azure resources in this stack!"
  read -p "Type 'yes' to confirm: " -r
  [[ $REPLY == "yes" ]] || { print_warning "Cancelled"; exit 0; }
  terraform destroy -auto-approve
  print_success "Infrastructure destroyed"
}

main "$@"
