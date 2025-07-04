#!/bin/bash

# Contract Management System - OCI Terraform Destroy Script
# This script destroys the entire infrastructure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Terraform is installed
    if ! command -v terraform &> /dev/null; then
        print_error "Terraform is not installed."
        exit 1
    fi
    
    # Check if terraform.tfvars exists
    if [ ! -f "terraform.tfvars" ]; then
        print_error "terraform.tfvars file not found."
        exit 1
    fi
    
    print_success "Prerequisites check completed"
}

# Function to initialize Terraform
init_terraform() {
    print_status "Initializing Terraform..."
    
    terraform init
    
    if [ $? -eq 0 ]; then
        print_success "Terraform initialized successfully"
    else
        print_error "Failed to initialize Terraform"
        exit 1
    fi
}

# Function to destroy infrastructure
destroy_infrastructure() {
    print_status "Destroying infrastructure..."
    
    # Show what will be destroyed
    terraform plan -destroy
    
    # Ask for confirmation
    echo ""
    print_warning "This will destroy ALL infrastructure including:"
    echo "  - VCN and networking resources"
    echo "  - OKE cluster and node pool"
    echo "  - Autonomous database"
    echo "  - Load balancer"
    echo "  - Container registry"
    echo "  - All Kubernetes resources"
    echo ""
    print_warning "This action is IRREVERSIBLE!"
    echo ""
    
    read -p "Are you sure you want to proceed? Type 'yes' to confirm: " -r
    echo ""
    
    if [[ $REPLY != "yes" ]]; then
        print_warning "Destruction cancelled by user"
        exit 0
    fi
    
    # Destroy infrastructure
    terraform destroy -auto-approve
    
    if [ $? -eq 0 ]; then
        print_success "Infrastructure destroyed successfully"
    else
        print_error "Failed to destroy infrastructure"
        exit 1
    fi
}

# Function to cleanup local files
cleanup_local_files() {
    print_status "Cleaning up local files..."
    
    # Remove Terraform files
    rm -f .terraform.lock.hcl
    rm -rf .terraform/
    rm -f terraform.tfstate*
    rm -f tfplan
    rm -f kubeconfig
    
    print_success "Local files cleaned up"
}

# Function to display completion message
display_completion() {
    print_success "Infrastructure destruction completed!"
    echo ""
    echo "=== Cleanup Summary ==="
    echo ""
    echo "✅ All OCI resources have been destroyed"
    echo "✅ Local Terraform files have been cleaned up"
    echo ""
    echo "Note: If you had any data in the database or container registry,"
    echo "it has been permanently deleted."
    echo ""
}

# Main function
main() {
    echo "=========================================="
    echo "Contract Management System - OCI Destruction"
    echo "=========================================="
    echo ""
    
    # Check prerequisites
    check_prerequisites
    
    # Initialize Terraform
    init_terraform
    
    # Destroy infrastructure
    destroy_infrastructure
    
    # Cleanup local files
    cleanup_local_files
    
    # Display completion message
    display_completion
}

# Run main function
main "$@" 