#!/bin/bash
# Confidential AI Network - Azure Terraform Deployment Script

set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

check_prerequisites() {
  print_status "Checking prerequisites..."
  command -v terraform >/dev/null || { print_error "Terraform not installed"; exit 1; }
  command -v az >/dev/null || { print_warning "Azure CLI not installed"; }
  az account show >/dev/null 2>&1 || { print_error "Run 'az login' first"; exit 1; }
  [ -f terraform.tfvars ] || { print_error "Copy terraform.tfvars.example to terraform.tfvars"; exit 1; }
  print_success "Prerequisites OK"
}

main() {
  echo "=========================================="
  echo "Confidential AI Network - Azure Deployment"
  echo "=========================================="
  check_prerequisites
  terraform init
  terraform validate
  terraform plan -out=tfplan
  echo ""
  read -p "Proceed with deployment? (y/N): " -n 1 -r
  echo ""
  [[ $REPLY =~ ^[Yy]$ ]] || { print_warning "Cancelled"; exit 0; }
  terraform apply tfplan
  print_success "Deployment complete"
  terraform output next_steps
  rm -f tfplan
}

main "$@"
