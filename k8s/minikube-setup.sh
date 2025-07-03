#!/bin/bash

# Minikube Setup for Contract Management System
set -e

echo "🚀 Setting up Minikube for Contract Management System..."

# Check if minikube is installed
if ! command -v minikube &> /dev/null; then
    echo "❌ Minikube is not installed!"
    echo ""
    echo "Please install Minikube:"
    echo "  brew install minikube"
    echo ""
    exit 1
fi

# Check if minikube is running
if ! minikube status | grep -q "Running"; then
    echo "🔧 Starting Minikube..."
    minikube start --memory=4096 --cpus=2 --disk-size=20g
    
    # Enable addons
    echo "🔧 Enabling Minikube addons..."
    minikube addons enable ingress
    minikube addons enable metrics-server
else
    echo "✅ Minikube is already running!"
fi

# Set up Docker environment
echo "🐳 Setting up Docker environment..."
eval $(minikube docker-env)

# Create local storage class
echo "💾 Setting up local storage..."
kubectl apply -f - <<EOF
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: local-storage
provisioner: kubernetes.io/no-provisioner
volumeBindingMode: WaitForFirstConsumer
EOF

# Create ***REMOVED-DB_PASSWORD*** data directory in minikube
echo "📁 Creating ***REMOVED-DB_PASSWORD*** data directory..."
minikube ssh "sudo mkdir -p /tmp/***REMOVED-DB_PASSWORD***-data && sudo chmod 777 /tmp/***REMOVED-DB_PASSWORD***-data"

# Build Docker images in minikube context
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

echo "✅ Minikube deployment completed successfully!"
echo ""
echo "📋 Service URLs:"
echo "  Minikube IP: $(minikube ip)"
echo "  Frontend: http://$(minikube ip):30000"
echo "  Backend API: http://$(minikube ip):30001"
echo "  Blockchain: http://$(minikube ip):30002"
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
echo "🌐 Open Minikube dashboard:"
echo "  minikube dashboard"
echo ""
echo "🚪 Access Minikube:"
echo "  minikube tunnel" 