#!/bin/bash

# Production Deployment Script for AI Model Training Environment
# This script deploys the complete training environment to production
# 
# Usage: ./deploy-training-environment.sh [environment] [region] [cloud_provider]
# Example: ./deploy-training-environment.sh production us-east-1 aws
#
# Supported Cloud Providers: aws, azure, gcp, oci
# Supported Regions: Any valid region for the chosen cloud provider

set -e

echo "🚀 Starting production deployment of AI Model Training Environment..."
echo "📋 Deployment Configuration:"
echo "   Environment: ${1:-production}"
echo "   Region: ${2:-us-east-1}"
echo "   Cloud Provider: ${3:-aws}"
echo ""

# Configuration
ENVIRONMENT=${1:-production}
REGION=${2:-us-east-1}
CLOUD_PROVIDER=${3:-aws}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if required tools are installed
    command -v kubectl >/dev/null 2>&1 || error "kubectl is required but not installed"
    command -v helm >/dev/null 2>&1 || error "helm is required but not installed"
    command -v docker >/dev/null 2>&1 || error "docker is required but not installed"
    command -v terraform >/dev/null 2>&1 || error "terraform is required but not installed"
    
    # Check cloud provider CLI
    case $CLOUD_PROVIDER in
        aws)
            command -v aws >/dev/null 2>&1 || error "AWS CLI is required but not installed"
            aws sts get-caller-identity >/dev/null 2>&1 || error "AWS credentials not configured"
            ;;
        azure)
            command -v az >/dev/null 2>&1 || error "Azure CLI is required but not installed"
            az account show >/dev/null 2>&1 || error "Azure credentials not configured"
            ;;
        gcp)
            command -v gcloud >/dev/null 2>&1 || error "Google Cloud CLI is required but not installed"
            gcloud auth list --filter=status:ACTIVE >/dev/null 2>&1 || error "Google Cloud credentials not configured"
            ;;
        oci)
            command -v oci >/dev/null 2>&1 || error "OCI CLI is required but not installed"
            oci iam user get --user-id $(oci iam user list --query 'data[0].id' --raw-output) >/dev/null 2>&1 || error "OCI credentials not configured"
            ;;
    esac
    
    success "Prerequisites check passed"
}

# Setup environment variables
setup_environment() {
    log "Setting up environment variables..."
    
    # Load production configuration
    if [ -f "config.production.env" ]; then
        source config.production.env
    else
        error "Production configuration file not found: config.production.env"
    fi
    
    # Set deployment variables
    export NAMESPACE="training-environment"
    export RELEASE_NAME="ai-training"
    export CHART_VERSION="1.0.0"
    export IMAGE_TAG="latest"
    
    success "Environment variables configured"
}

# Deploy infrastructure
deploy_infrastructure() {
    log "Deploying infrastructure with Terraform..."
    
    cd deploy/production/terraform
    
    # Initialize Terraform
    terraform init
    
    # Plan deployment
    terraform plan -var="environment=${ENVIRONMENT}" -var="region=${REGION}" -var="cloud_provider=${CLOUD_PROVIDER}"
    
    # Apply deployment
    terraform apply -auto-approve -var="environment=${ENVIRONMENT}" -var="region=${REGION}" -var="cloud_provider=${CLOUD_PROVIDER}"
    
    cd ../..
    
    success "Infrastructure deployed successfully"
}

# Build and push Docker images
build_and_push_images() {
    log "Building and pushing Docker images..."
    
    # Build training container image
    docker build -t ${REGISTRY_URL}/ai-training:${IMAGE_TAG} -f Dockerfile.training .
    docker push ${REGISTRY_URL}/ai-training:${IMAGE_TAG}
    
    # Build TEE container image
    docker build -t ${REGISTRY_URL}/tee-environment:${IMAGE_TAG} -f Dockerfile.tee .
    docker push ${REGISTRY_URL}/tee-environment:${IMAGE_TAG}
    
    # Build monitoring image
    docker build -t ${REGISTRY_URL}/training-monitor:${IMAGE_TAG} -f Dockerfile.monitoring .
    docker push ${REGISTRY_URL}/training-monitor:${IMAGE_TAG}
    
    success "Docker images built and pushed"
}

# Deploy to Kubernetes
deploy_to_kubernetes() {
    log "Deploying to Kubernetes..."
    
    # Create namespace
    kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
    
    # Deploy secrets
    kubectl apply -f deploy/production/k8s/secrets.yaml
    
    # Deploy config maps
    kubectl apply -f deploy/production/k8s/configmaps.yaml
    
    # Deploy services
    kubectl apply -f deploy/production/k8s/services.yaml
    
    # Deploy deployments
    kubectl apply -f deploy/production/k8s/deployments.yaml
    
    # Deploy ingress
    kubectl apply -f deploy/production/k8s/ingress.yaml
    
    success "Kubernetes deployment completed"
}

# Deploy with Helm
deploy_with_helm() {
    log "Deploying with Helm..."
    
    # Add Helm repository
    helm repo add ai-training https://charts.ai-training.com
    helm repo update
    
    # Deploy training environment
    helm upgrade --install ${RELEASE_NAME} ai-training/ai-training \
        --namespace ${NAMESPACE} \
        --set image.tag=${IMAGE_TAG} \
        --set environment=${ENVIRONMENT} \
        --set cloud.provider=${CLOUD_PROVIDER} \
        --set cloud.region=${REGION} \
        --values deploy/production/helm/values.yaml
    
    success "Helm deployment completed"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Deploy Prometheus
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
        --namespace monitoring \
        --create-namespace \
        --values deploy/production/monitoring/prometheus-values.yaml
    
    # Deploy Grafana
    helm repo add grafana https://grafana.github.io/helm-charts
    helm upgrade --install grafana grafana/grafana \
        --namespace monitoring \
        --values deploy/production/monitoring/grafana-values.yaml
    
    success "Monitoring setup completed"
}

# Setup logging
setup_logging() {
    log "Setting up logging..."
    
    # Deploy ELK stack
    helm repo add elastic https://helm.elastic.co
    helm upgrade --install elasticsearch elastic/elasticsearch \
        --namespace logging \
        --create-namespace \
        --values deploy/production/logging/elasticsearch-values.yaml
    
    helm upgrade --install kibana elastic/kibana \
        --namespace logging \
        --values deploy/production/logging/kibana-values.yaml
    
    helm upgrade --install logstash elastic/logstash \
        --namespace logging \
        --values deploy/production/logging/logstash-values.yaml
    
    success "Logging setup completed"
}

# Setup security
setup_security() {
    log "Setting up security..."
    
    # Deploy Vault
    helm repo add hashicorp https://helm.releases.hashicorp.com
    helm upgrade --install vault hashicorp/vault \
        --namespace vault \
        --create-namespace \
        --values deploy/production/security/vault-values.yaml
    
    # Deploy Falco for runtime security
    helm repo add falcosecurity https://falcosecurity.github.io/charts
    helm upgrade --install falco falcosecurity/falco \
        --namespace falco \
        --create-namespace \
        --values deploy/production/security/falco-values.yaml
    
    success "Security setup completed"
}

# Verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Check pods
    kubectl get pods -n ${NAMESPACE}
    
    # Check services
    kubectl get services -n ${NAMESPACE}
    
    # Check ingress
    kubectl get ingress -n ${NAMESPACE}
    
    # Run health checks
    kubectl run health-check --image=curlimages/curl --rm -i --restart=Never -- \
        curl -f http://ai-training-service.${NAMESPACE}.svc.cluster.local/health
    
    success "Deployment verification completed"
}

# Setup backup
setup_backup() {
    log "Setting up backup..."
    
    # Deploy Velero for backup
    helm repo add vmware-tanzu https://vmware-tanzu.github.io/helm-charts
    helm upgrade --install velero vmware-tanzu/velero \
        --namespace velero \
        --create-namespace \
        --values deploy/production/backup/velero-values.yaml
    
    success "Backup setup completed"
}

# Main deployment function
main() {
    log "Starting production deployment..."
    
    check_prerequisites
    setup_environment
    deploy_infrastructure
    build_and_push_images
    deploy_to_kubernetes
    deploy_with_helm
    setup_monitoring
    setup_logging
    setup_security
    setup_backup
    verify_deployment
    
    success "Production deployment completed successfully!"
    
    echo ""
    echo "🎉 AI Model Training Environment is now deployed to production!"
    echo ""
    echo "📊 Access URLs:"
    echo "  - Training API: https://training.${DOMAIN}"
    echo "  - Monitoring: https://monitoring.${DOMAIN}"
    echo "  - Logging: https://logging.${DOMAIN}"
    echo "  - Security: https://vault.${DOMAIN}"
    echo ""
    echo "🔧 Management Commands:"
    echo "  - kubectl get pods -n ${NAMESPACE}"
    echo "  - helm list -n ${NAMESPACE}"
    echo "  - kubectl logs -f deployment/ai-training -n ${NAMESPACE}"
    echo ""
    echo "📚 Documentation:"
    echo "  - Production Guide: docs/production/PRODUCTION_GUIDE.md"
    echo "  - Monitoring Guide: docs/production/MONITORING_GUIDE.md"
    echo "  - Security Guide: docs/production/SECURITY_GUIDE.md"
}

# Run main function
main "$@"
