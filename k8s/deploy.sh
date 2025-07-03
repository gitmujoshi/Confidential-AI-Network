#!/bin/bash

# Contract Management System Kubernetes Deployment Script
set -e

echo "🚀 Deploying Contract Management System to Kubernetes..."

# Create namespace
echo "📦 Creating namespace..."
kubectl apply -f namespace.yaml

# Create ConfigMap and Secrets
echo "🔧 Creating ConfigMap and Secrets..."
kubectl apply -f configmap.yaml
kubectl apply -f secrets.yaml

# Create storage
echo "💾 Creating persistent storage..."
kubectl apply -f ***REMOVED-DB_PASSWORD***-persistent-volume.yaml

# Deploy database
echo "🗄️ Deploying PostgreSQL..."
kubectl apply -f ***REMOVED-DB_PASSWORD***-deployment.yaml

# Wait for database to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=***REMOVED-DB_PASSWORD*** -n contract-management --timeout=300s

# Deploy blockchain
echo "⛓️ Deploying blockchain node..."
kubectl apply -f blockchain-deployment.yaml

# Deploy Keycloak
echo "🔐 Deploying Keycloak IAM..."
kubectl apply -f ***REMOVED-KEYCLOAK_DB_PASSWORD***-deployment.yaml

# Wait for Keycloak to be ready
echo "⏳ Waiting for Keycloak to be ready..."
kubectl wait --for=condition=ready pod -l app=***REMOVED-KEYCLOAK_DB_PASSWORD*** -n contract-management --timeout=300s

# Deploy backend
echo "🔧 Deploying backend API..."
kubectl apply -f backend-deployment.yaml

# Deploy frontend
echo "🎨 Deploying frontend..."
kubectl apply -f frontend-deployment.yaml

# Deploy autoscalers
echo "📈 Deploying autoscalers..."
kubectl apply -f hpa.yaml

# Deploy ingress
echo "🌐 Deploying ingress..."
kubectl apply -f ingress.yaml

echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Service URLs:"
echo "  Frontend: https://contract-management.example.com"
echo "  API: https://api.contract-management.example.com"
echo "  Keycloak: https://***REMOVED-KEYCLOAK_DB_PASSWORD***.contract-management.example.com"
echo ""
echo "🔍 Check deployment status:"
echo "  kubectl get pods -n contract-management"
echo "  kubectl get services -n contract-management"
echo "  kubectl get ingress -n contract-management" 