#!/bin/bash

# Local Kubernetes Cleanup for Contract Management System
set -e

echo "🧹 Cleaning up Contract Management System from Local Kubernetes..."

# Delete all resources
echo "🗑️ Deleting all resources..."
kubectl delete -f k8s/local-deployment.yaml --ignore-not-found=true

# Delete storage class
echo "💾 Deleting storage class..."
kubectl delete storageclass local-storage --ignore-not-found=true

# Remove ***REMOVED-DB_PASSWORD*** data directory
echo "📁 Removing ***REMOVED-DB_PASSWORD*** data directory..."
rm -rf /tmp/***REMOVED-DB_PASSWORD***-data

echo "✅ Cleanup completed successfully!"
echo ""
echo "💡 To completely reset your local cluster:"
echo "  - Docker Desktop: Restart Docker Desktop"
echo "  - Minikube: minikube delete && minikube start"
echo "  - kind: kind delete cluster && kind create cluster" 