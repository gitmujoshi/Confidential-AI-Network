# Local Kubernetes Deployment Guide

This guide provides step-by-step instructions for deploying the Contract Management System to a local Kubernetes environment.

## 🎯 Quick Start Options

### Option 1: Docker Desktop Kubernetes (Recommended)
If you have Docker Desktop installed, this is the easiest option.

### Option 2: Minikube
For a more isolated local Kubernetes environment.

### Option 3: kind
For a lightweight Kubernetes cluster.

## 🐳 Option 1: Docker Desktop Kubernetes

### Prerequisites
- Docker Desktop installed
- Kubernetes enabled in Docker Desktop

### Setup Steps

1. **Enable Kubernetes in Docker Desktop**
   ```bash
   # Open Docker Desktop
   # Go to Settings > Kubernetes
   # Check "Enable Kubernetes"
   # Click "Apply & Restart"
   ```

2. **Verify Kubernetes is running**
   ```bash
   kubectl cluster-info
   ```

3. **Deploy the application**
   ```bash
   ./k8s/local-setup.sh
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Blockchain: http://localhost:8545

## 🚀 Option 2: Minikube

### Prerequisites
- Minikube installed

### Setup Steps

1. **Install Minikube (if not installed)**
   ```bash
   brew install minikube
   ```

2. **Deploy with Minikube**
   ```bash
   ./k8s/minikube-setup.sh
   ```

3. **Access the application**
   ```bash
   # Get Minikube IP
   minikube ip
   
   # Access services
   Frontend: http://<minikube-ip>:30000
   Backend: http://<minikube-ip>:30001
   Blockchain: http://<minikube-ip>:30002
   ```

4. **Optional: Use Minikube tunnel**
   ```bash
   minikube tunnel
   # Then access via localhost:30000, localhost:30001, localhost:30002
   ```

## 🔧 Option 3: kind

### Prerequisites
- kind installed

### Setup Steps

1. **Install kind (if not installed)**
   ```bash
   brew install kind
   ```

2. **Create cluster**
   ```bash
   kind create cluster
   ```

3. **Deploy the application**
   ```bash
   ./k8s/local-setup.sh
   ```

## 📋 Local Deployment Features

### **Simplified Configuration**
- Development-friendly settings
- Local storage for database
- NodePort services for easy access
- Reduced resource requirements

### **Services**
- **PostgreSQL**: Database with persistent storage
- **Blockchain**: Hardhat development node
- **Backend**: Node.js API server
- **Frontend**: React application

### **Access Methods**
- **LoadBalancer**: Direct access (Docker Desktop)
- **NodePort**: Port mapping (Minikube/kind)
- **Port Forwarding**: Manual port forwarding

## 🛠️ Manual Deployment Steps

If you prefer to deploy manually:

### 1. Build Docker Images
```bash
./k8s/build-images.sh
```

### 2. Create Storage Class
```bash
kubectl apply -f - <<EOF
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: local-storage
provisioner: kubernetes.io/no-provisioner
volumeBindingMode: WaitForFirstConsumer
EOF
```

### 3. Deploy Application
```bash
# For Docker Desktop
kubectl apply -f k8s/local-deployment.yaml

# For Minikube
kubectl apply -f k8s/local-deployment-minikube.yaml
```

### 4. Wait for Pods
```bash
kubectl wait --for=condition=ready pod -l app=***REMOVED-DB_PASSWORD*** -n contract-management --timeout=300s
kubectl wait --for=condition=ready pod -l app=blockchain -n contract-management --timeout=300s
kubectl wait --for=condition=ready pod -l app=backend -n contract-management --timeout=300s
kubectl wait --for=condition=ready pod -l app=frontend -n contract-management --timeout=300s
```

## 🔍 Monitoring & Debugging

### Check Pod Status
```bash
kubectl get pods -n contract-management
```

### View Logs
```bash
# Backend logs
kubectl logs -f deployment/backend -n contract-management

# Frontend logs
kubectl logs -f deployment/frontend -n contract-management

# Blockchain logs
kubectl logs -f deployment/blockchain -n contract-management

# Database logs
kubectl logs -f deployment/***REMOVED-DB_PASSWORD*** -n contract-management
```

### Port Forwarding (if services don't work)
```bash
# Frontend
kubectl port-forward service/frontend-service 3000:3000 -n contract-management

# Backend
kubectl port-forward service/backend-service 5000:5000 -n contract-management

# Blockchain
kubectl port-forward service/blockchain-service 8545:8545 -n contract-management
```

### Access Pod Shell
```bash
# Backend pod
kubectl exec -it deployment/backend -n contract-management -- /bin/sh

# Database pod
kubectl exec -it deployment/***REMOVED-DB_PASSWORD*** -n contract-management -- psql -U ***REMOVED-DB_PASSWORD***
```

## 🧹 Cleanup

### Quick Cleanup
```bash
./k8s/local-cleanup.sh
```

### Manual Cleanup
```bash
# Delete all resources
kubectl delete -f k8s/local-deployment.yaml

# Delete storage class
kubectl delete storageclass local-storage

# Remove data directory
rm -rf /tmp/***REMOVED-DB_PASSWORD***-data
```

### Complete Reset
```bash
# Docker Desktop
# Restart Docker Desktop

# Minikube
minikube delete
minikube start

# kind
kind delete cluster
kind create cluster
```

## 🐛 Troubleshooting

### Common Issues

1. **Pods not starting**
   ```bash
   kubectl describe pod <pod-name> -n contract-management
   kubectl logs <pod-name> -n contract-management
   ```

2. **Services not accessible**
   ```bash
   kubectl get services -n contract-management
   kubectl describe service <service-name> -n contract-management
   ```

3. **Storage issues**
   ```bash
   kubectl get pv,pvc -n contract-management
   kubectl describe pvc ***REMOVED-DB_PASSWORD***-pvc -n contract-management
   ```

4. **Image pull errors**
   ```bash
   # Rebuild images
   ./k8s/build-images.sh
   
   # Check if images exist
   docker images | grep contract-management
   ```

### Resource Issues

1. **Insufficient memory**
   ```bash
   # Check resource usage
   kubectl top pods -n contract-management
   
   # Scale down if needed
   kubectl scale deployment backend --replicas=1 -n contract-management
   ```

2. **Port conflicts**
   ```bash
   # Check what's using ports
   lsof -i :3000
   lsof -i :5000
   lsof -i :8545
   ```

### Network Issues

1. **Service connectivity**
   ```bash
   # Test service connectivity
   kubectl run test-pod --image=busybox -n contract-management --rm -it --restart=Never -- wget -O- http://backend-service:5000/health
   ```

2. **DNS resolution**
   ```bash
   # Test DNS
   kubectl run test-pod --image=busybox -n contract-management --rm -it --restart=Never -- nslookup backend-service
   ```

## 📊 Performance Optimization

### Resource Limits
The local deployment uses conservative resource limits:
- Backend: 256Mi-512Mi RAM, 250m-500m CPU
- Frontend: 128Mi-256Mi RAM, 100m-200m CPU
- Database: Default PostgreSQL limits

### Scaling
```bash
# Scale backend
kubectl scale deployment backend --replicas=2 -n contract-management

# Scale frontend
kubectl scale deployment frontend --replicas=2 -n contract-management
```

### Monitoring
```bash
# Enable metrics server (if available)
kubectl top pods -n contract-management

# View resource usage
kubectl describe nodes
```

## 🔒 Security Notes

### Development Environment
- Uses development secrets (not for production)
- CORS set to allow all origins
- No SSL/TLS encryption
- Database accessible from cluster

### Production Considerations
- Use proper secrets management
- Enable RBAC
- Configure network policies
- Use SSL/TLS certificates
- Restrict CORS origins

## 📚 Additional Resources

- [Docker Desktop Kubernetes](https://docs.docker.com/desktop/kubernetes/)
- [Minikube Documentation](https://minikube.sigs.k8s.io/docs/)
- [kind Documentation](https://kind.sigs.k8s.io/)
- [Kubernetes Local Development](https://kubernetes.io/docs/tasks/tools/)

## 🎉 Next Steps

After successful local deployment:

1. **Test the application**
   - Register a new user
   - Connect MetaMask wallet
   - Create a contract
   - Test blockchain interactions

2. **Explore the system**
   - Check API endpoints
   - Monitor logs
   - Test different user roles

3. **Customize for your needs**
   - Modify configuration
   - Add new features
   - Adjust resource limits

4. **Prepare for production**
   - Review security settings
   - Plan scaling strategy
   - Set up monitoring 