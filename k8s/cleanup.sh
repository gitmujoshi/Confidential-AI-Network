#!/bin/bash

# Contract Management System Kubernetes Cleanup Script
set -e

echo "🧹 Cleaning up Contract Management System from Kubernetes..."

# Delete ingress
echo "🌐 Deleting ingress..."
kubectl delete -f ingress.yaml --ignore-not-found=true

# Delete autoscalers
echo "📈 Deleting autoscalers..."
kubectl delete -f hpa.yaml --ignore-not-found=true

# Delete frontend
echo "🎨 Deleting frontend..."
kubectl delete -f frontend-deployment.yaml --ignore-not-found=true

# Delete backend
echo "🔧 Deleting backend..."
kubectl delete -f backend-deployment.yaml --ignore-not-found=true

# Delete Keycloak
echo "🔐 Deleting Keycloak..."
kubectl delete -f ***REMOVED-KEYCLOAK_DB_PASSWORD***-deployment.yaml --ignore-not-found=true

# Delete blockchain
echo "⛓️ Deleting blockchain..."
kubectl delete -f blockchain-deployment.yaml --ignore-not-found=true

# Delete database
echo "🗄️ Deleting PostgreSQL..."
kubectl delete -f ***REMOVED-DB_PASSWORD***-deployment.yaml --ignore-not-found=true

# Delete storage
echo "💾 Deleting persistent storage..."
kubectl delete -f ***REMOVED-DB_PASSWORD***-persistent-volume.yaml --ignore-not-found=true

# Delete ConfigMap and Secrets
echo "🔧 Deleting ConfigMap and Secrets..."
kubectl delete -f configmap.yaml --ignore-not-found=true
kubectl delete -f secrets.yaml --ignore-not-found=true

# Delete namespace
echo "📦 Deleting namespace..."
kubectl delete -f namespace.yaml --ignore-not-found=true

echo "✅ Cleanup completed successfully!" 