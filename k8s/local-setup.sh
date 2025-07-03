#!/bin/bash

# Local Kubernetes Setup for Contract Management System
set -e

echo "🚀 Setting up Contract Management System for Local Kubernetes..."

# Check if we have a local Kubernetes cluster
echo "🔍 Checking Kubernetes cluster..."

if ! kubectl cluster-info &> /dev/null; then
    echo "❌ No Kubernetes cluster found!"
    echo ""
    echo "Please set up a local Kubernetes cluster:"
    echo ""
    echo "Option 1: Docker Desktop Kubernetes"
    echo "  1. Open Docker Desktop"
    echo "  2. Go to Settings > Kubernetes"
    echo "  3. Enable Kubernetes"
    echo "  4. Wait for it to start"
    echo ""
    echo "Option 2: Minikube"
    echo "  brew install minikube"
    echo "  minikube start"
    echo ""
    echo "Option 3: kind"
    echo "  brew install kind"
    echo "  kind create cluster"
    echo ""
    exit 1
fi

echo "✅ Kubernetes cluster found!"

# Create local storage class if it doesn't exist
echo "💾 Setting up local storage..."
kubectl apply -f - <<EOF
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: local-storage
provisioner: kubernetes.io/no-provisioner
volumeBindingMode: WaitForFirstConsumer
EOF

# Create ***REMOVED-DB_PASSWORD*** data directory
echo "📁 Creating ***REMOVED-DB_PASSWORD*** data directory..."
mkdir -p /tmp/***REMOVED-DB_PASSWORD***-data

# Build Docker images
echo "🐳 Building Docker images..."
./k8s/build-images.sh

# Deploy to Kubernetes
echo "📦 Deploying to Kubernetes..."
kubectl apply -f k8s/local-deployment.yaml

# Wait for pods to be ready
echo "⏳ Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod -l app=***REMOVED-DB_PASSWORD*** -n contract-management --timeout=300s
kubectl wait --for=condition=ready pod -l app=blockchain -n contract-management --timeout=300s
kubectl wait --for=condition=ready pod -l app=backend -n contract-management --timeout=300s
kubectl wait --for=condition=ready pod -l app=frontend -n contract-management --timeout=300s

echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Service URLs:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:5000"
echo "  Blockchain: http://localhost:8545"
echo ""
echo "🔍 Check deployment status:"
echo "  kubectl get pods -n contract-management"
echo "  kubectl get services -n contract-management"
echo ""
echo "📊 View logs:"
echo "  kubectl logs -f deployment/backend -n contract-management"
echo "  kubectl logs -f deployment/frontend -n contract-management"
echo "  kubectl logs -f deployment/blockchain -n contract-management"
echo ""
echo "🌐 Port forwarding (if LoadBalancer doesn't work):"
echo "  kubectl port-forward service/frontend-service 3000:3000 -n contract-management"
echo "  kubectl port-forward service/backend-service 5000:5000 -n contract-management"
echo "  kubectl port-forward service/blockchain-service 8545:8545 -n contract-management" 