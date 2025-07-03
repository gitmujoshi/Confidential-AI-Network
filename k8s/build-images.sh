#!/bin/bash

# Build Docker Images for Contract Management System
set -e

echo "🐳 Building Docker images for Contract Management System..."

# Build backend image
echo "🔧 Building backend image..."
docker build -f k8s/Dockerfile.backend -t contract-management-backend:latest .

# Build frontend image
echo "🎨 Building frontend image..."
docker build -f k8s/Dockerfile.frontend -t contract-management-frontend:latest .

echo "✅ Docker images built successfully!"
echo ""
echo "📋 Available images:"
echo "  contract-management-backend:latest"
echo "  contract-management-frontend:latest"
echo ""
echo "🚀 To deploy to Kubernetes:"
echo "  ./k8s/deploy.sh" 