#!/bin/bash

# Contract Management System - OCI Terraform Deployment Script
# This script deploys the entire infrastructure to Oracle Cloud Infrastructure

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
        print_error "Terraform is not installed. Please install Terraform first."
        exit 1
    fi
    
    # Check if OCI CLI is installed
    if ! command -v oci &> /dev/null; then
        print_warning "OCI CLI is not installed. Some features may not work properly."
    fi
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        print_warning "kubectl is not installed. You won't be able to interact with the cluster directly."
    fi
    
    # Check if terraform.tfvars exists
    if [ ! -f "terraform.tfvars" ]; then
        print_error "terraform.tfvars file not found. Please copy terraform.tfvars.example and configure it."
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

# Function to validate Terraform configuration
validate_terraform() {
    print_status "Validating Terraform configuration..."
    
    terraform validate
    
    if [ $? -eq 0 ]; then
        print_success "Terraform configuration is valid"
    else
        print_error "Terraform configuration validation failed"
        exit 1
    fi
}

# Function to plan Terraform deployment
plan_terraform() {
    print_status "Planning Terraform deployment..."
    
    terraform plan -out=tfplan
    
    if [ $? -eq 0 ]; then
        print_success "Terraform plan created successfully"
    else
        print_error "Failed to create Terraform plan"
        exit 1
    fi
}

# Function to apply Terraform deployment
apply_terraform() {
    print_status "Applying Terraform deployment..."
    
    terraform apply tfplan
    
    if [ $? -eq 0 ]; then
        print_success "Terraform deployment completed successfully"
    else
        print_error "Terraform deployment failed"
        exit 1
    fi
}

# Function to configure kubectl
configure_kubectl() {
    print_status "Configuring kubectl for OKE cluster..."
    
    # Get kubeconfig from Terraform output
    terraform output -raw kubeconfig > kubeconfig
    
    # Set KUBECONFIG environment variable
    export KUBECONFIG=$(pwd)/kubeconfig
    
    # Test kubectl connection
    if kubectl cluster-info &> /dev/null; then
        print_success "kubectl configured successfully"
    else
        print_warning "kubectl configuration may have issues"
    fi
}

# Function to build and push Docker images
build_and_push_images() {
    print_status "Building and pushing Docker images..."
    
    # Get registry URL from Terraform output
    REGISTRY_URL=$(terraform output -raw container_registry_url)
    
    # Build backend image
    print_status "Building backend image..."
    docker build -t ${REGISTRY_URL}/backend:latest ../backend/
    
    # Build frontend image
    print_status "Building frontend image..."
    docker build -t ${REGISTRY_URL}/frontend:latest ../frontend/
    
    # Push images
    print_status "Pushing images to registry..."
    docker push ${REGISTRY_URL}/backend:latest
    docker push ${REGISTRY_URL}/frontend:latest
    
    print_success "Docker images built and pushed successfully"
}

# Function to deploy application
deploy_application() {
    print_status "Deploying application to Kubernetes..."
    
    # Apply Kubernetes resources
    kubectl apply -f ../k8s/
    
    # Wait for deployments to be ready
    print_status "Waiting for deployments to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/backend -n contract-management
    kubectl wait --for=condition=available --timeout=300s deployment/frontend -n contract-management
    kubectl wait --for=condition=available --timeout=300s deployment/keycloak -n contract-management
    
    print_success "Application deployed successfully"
}

# Function to display deployment information
display_deployment_info() {
    print_status "Deployment completed successfully!"
    echo ""
    echo "=== Deployment Information ==="
    echo ""
    
    # Get load balancer IP
    LB_IP=$(terraform output -raw load_balancer_ip)
    
    echo "Load Balancer IP: $LB_IP"
    echo ""
    echo "Application URLs:"
    echo "  Frontend: http://$LB_IP:3000"
    echo "  Backend API: http://$LB_IP:5000"
    echo "  Keycloak Admin: http://$LB_IP:8080"
    echo ""
    echo "Database Information:"
    echo "  Host: $(terraform output -raw database_host)"
    echo "  Port: $(terraform output -raw database_port)"
    echo "  Name: $(terraform output -raw database_name)"
    echo ""
    echo "Next Steps:"
    echo "  1. Configure DNS to point your domain to $LB_IP"
    echo "  2. Access Keycloak admin console and set up realm"
    echo "  3. Configure environment variables in Kubernetes secrets"
    echo "  4. Test the application endpoints"
    echo ""
}

# Function to cleanup
cleanup() {
    print_status "Cleaning up temporary files..."
    rm -f tfplan kubeconfig
    print_success "Cleanup completed"
}

# Main deployment function
main() {
    echo "=========================================="
    echo "Contract Management System - OCI Deployment"
    echo "=========================================="
    echo ""
    
    # Check prerequisites
    check_prerequisites
    
    # Initialize Terraform
    init_terraform
    
    # Validate configuration
    validate_terraform
    
    # Plan deployment
    plan_terraform
    
    # Ask for confirmation
    echo ""
    read -p "Do you want to proceed with the deployment? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Deployment cancelled by user"
        cleanup
        exit 0
    fi
    
    # Apply deployment
    apply_terraform
    
    # Configure kubectl
    configure_kubectl
    
    # Build and push images (optional)
    read -p "Do you want to build and push Docker images? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        build_and_push_images
    fi
    
    # Deploy application (optional)
    read -p "Do you want to deploy the application to Kubernetes? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        deploy_application
    fi
    
    # Display deployment information
    display_deployment_info
    
    # Cleanup
    cleanup
    
    print_success "Deployment completed successfully!"
}

# Run main function
main "$@" 