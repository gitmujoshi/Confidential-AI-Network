#!/bin/bash

# Quick Production Deployment Script
# This script provides a simplified way to deploy the AI training environment
#
# Usage: ./deploy-production.sh [environment] [cloud_provider] [region]
# Example: ./deploy-production.sh production aws us-east-1
#
# Supported Cloud Providers: aws, azure, gcp, oci
# Supported Environments: production, staging, development

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ENVIRONMENT=${1:-production}
CLOUD_PROVIDER=${2:-aws}
REGION=${3:-us-east-1}

echo "🚀 AI Model Training Environment - Quick Deployment"
echo "=================================================="
echo "Environment: $ENVIRONMENT"
echo "Cloud Provider: $CLOUD_PROVIDER"
echo "Region: $REGION"
echo ""

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
    
    command -v kubectl >/dev/null 2>&1 || error "kubectl is required"
    command -v helm >/dev/null 2>&1 || error "helm is required"
    command -v docker >/dev/null 2>&1 || error "docker is required"
    
    # Check cloud provider CLI
    case $CLOUD_PROVIDER in
        aws)
            command -v aws >/dev/null 2>&1 || error "AWS CLI required"
            aws sts get-caller-identity >/dev/null 2>&1 || error "AWS credentials not configured"
            ;;
        azure)
            command -v az >/dev/null 2>&1 || error "Azure CLI required"
            az account show >/dev/null 2>&1 || error "Azure credentials not configured"
            ;;
        gcp)
            command -v gcloud >/dev/null 2>&1 || error "Google Cloud CLI required"
            gcloud auth list --filter=status:ACTIVE >/dev/null 2>&1 || error "Google Cloud credentials not configured"
            ;;
    esac
    
    success "Prerequisites check passed"
}

# Deploy with Helm
deploy_with_helm() {
    log "Deploying with Helm..."
    
    # Add Helm repositories
    helm repo add bitnami https://charts.bitnami.com/bitnami
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
    helm repo add elastic https://helm.elastic.co
    helm repo add hashicorp https://helm.releases.hashicorp.com
    helm repo update
    
    # Create namespace
    kubectl create namespace training-environment --dry-run=client -o yaml | kubectl apply -f -
    
    # Deploy PostgreSQL
    helm upgrade --install ***REMOVED-DB_PASSWORD***ql bitnami/***REMOVED-DB_PASSWORD***ql \
        --namespace training-environment \
        --set auth.***REMOVED-DB_PASSWORD***Password=training123 \
        --set auth.database=contract_management_production \
        --set primary.persistence.size=100Gi \
        --wait
    
    # Deploy Redis
    helm upgrade --install redis bitnami/redis \
        --namespace training-environment \
        --set auth.password=redis123 \
        --set master.persistence.size=50Gi \
        --wait
    
    # Deploy NGINX Ingress
    helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
        --namespace ingress-nginx \
        --create-namespace \
        --set controller.service.type=LoadBalancer \
        --wait
    
    # Deploy Prometheus
    helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
        --namespace monitoring \
        --create-namespace \
        --set grafana.adminPassword=***REMOVED-KEYCLOAK_ADMIN_PASSWORD*** \
        --wait
    
    # Deploy ELK Stack
    helm upgrade --install elasticsearch elastic/elasticsearch \
        --namespace logging \
        --create-namespace \
        --set replicas=1 \
        --set volumeClaimTemplate.resources.requests.storage=50Gi \
        --wait
    
    helm upgrade --install kibana elastic/kibana \
        --namespace logging \
        --set replicas=1 \
        --wait
    
    # Deploy Vault
    helm upgrade --install vault hashicorp/vault \
        --namespace vault \
        --create-namespace \
        --set server.dev.enabled=true \
        --wait
    
    success "Helm deployments completed"
}

# Deploy AI Training Application
deploy_application() {
    log "Deploying AI Training Application..."
    
    # Create secrets
    kubectl create secret generic database-secret \
        --from-literal=host=***REMOVED-DB_PASSWORD***ql.training-environment.svc.cluster.local \
        --from-literal=password=training123 \
        --namespace=training-environment \
        --dry-run=client -o yaml | kubectl apply -f -
    
    kubectl create secret generic redis-secret \
        --from-literal=password=redis123 \
        --namespace=training-environment \
        --dry-run=client -o yaml | kubectl apply -f -
    
    kubectl create secret generic auth-secret \
        --from-literal=jwt-secret=your-jwt-secret-change-in-production \
        --namespace=training-environment \
        --dry-run=client -o yaml | kubectl apply -f -
    
    kubectl create secret generic encryption-secret \
        --from-literal=encryption-key=your-encryption-key-change-in-production \
        --namespace=training-environment \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # Deploy AI Training API
    kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-training-api
  namespace: training-environment
  labels:
    app: ai-training-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-training-api
  template:
    metadata:
      labels:
        app: ai-training-api
    spec:
      containers:
      - name: ai-training-api
        image: nginx:alpine
        ports:
        - containerPort: 80
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: host
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: password
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: ai-training-service
  namespace: training-environment
spec:
  selector:
    app: ai-training-api
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP
EOF
    
    success "AI Training Application deployed"
}

# Create Ingress
create_ingress() {
    log "Creating Ingress..."
    
    kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ai-training-ingress
  namespace: training-environment
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/ssl-redirect: "false"
spec:
  rules:
  - host: training.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ai-training-service
            port:
              number: 80
EOF
    
    success "Ingress created"
}

# Verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Wait for pods to be ready
    kubectl wait --for=condition=ready pod -l app=ai-training-api -n training-environment --timeout=300s
    
    # Check pod status
    kubectl get pods -n training-environment
    
    # Check services
    kubectl get services -n training-environment
    
    # Check ingress
    kubectl get ingress -n training-environment
    
    success "Deployment verification completed"
}

# Get access information
get_access_info() {
    log "Getting access information..."
    
    # Get load balancer IP
    LB_IP=$(kubectl get service ingress-nginx-controller -n ingress-nginx -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    
    echo ""
    echo "🎉 AI Model Training Environment deployed successfully!"
    echo ""
    echo "📊 Access Information:"
    echo "  - Training API: http://training.local (add to /etc/hosts: $LB_IP training.local)"
    echo "  - Grafana: kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring"
    echo "  - Kibana: kubectl port-forward svc/kibana-kb 5601:5601 -n logging"
    echo "  - Vault: kubectl port-forward svc/vault 8200:8200 -n vault"
    echo ""
    echo "🔧 Management Commands:"
    echo "  - kubectl get pods -n training-environment"
    echo "  - kubectl logs -f deployment/ai-training-api -n training-environment"
    echo "  - helm list -n training-environment"
    echo ""
    echo "📚 Documentation:"
    echo "  - Production Guide: docs/production/PRODUCTION_DEPLOYMENT_GUIDE.md"
    echo "  - Monitoring Guide: docs/production/MONITORING_GUIDE.md"
    echo ""
}

# Main deployment function
main() {
    log "Starting production deployment..."
    
    check_prerequisites
    deploy_with_helm
    deploy_application
    create_ingress
    verify_deployment
    get_access_info
    
    success "Production deployment completed successfully!"
}

# Run main function
main "$@"
