# Kubernetes Deployment Guide

This guide provides comprehensive instructions for deploying the Contract Management System to Kubernetes.

## 🏗️ Architecture Overview

The system is deployed as a microservices architecture with the following components:

- **PostgreSQL Database**: Persistent storage for application data
- **Keycloak IAM**: Identity and access management
- **Blockchain Node**: Hardhat development blockchain
- **Backend API**: Node.js/Express API server
- **Frontend**: React application served via Nginx
- **Monitoring**: Prometheus and Grafana for observability

## 📋 Prerequisites

### Required Tools
- `kubectl` (Kubernetes CLI)
- `docker` (for building images)
- Kubernetes cluster (local or cloud)

### Cluster Requirements
- Kubernetes 1.20+
- Ingress controller (NGINX recommended)
- Cert-manager (for SSL certificates)
- Metrics server (for HPA)

## 🚀 Quick Start

### 1. Build Docker Images

```bash
# Make scripts executable
chmod +x k8s/*.sh

# Build images
./k8s/build-images.sh
```

### 2. Update Configuration

Edit the following files to match your environment:

- `k8s/configmap.yaml` - Application configuration
- `k8s/secrets.yaml` - Sensitive data (update with real values)
- `k8s/ingress.yaml` - Domain names and SSL settings

### 3. Deploy to Kubernetes

```bash
# Deploy all components
./k8s/deploy.sh
```

### 4. Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n contract-management

# Check services
kubectl get services -n contract-management

# Check ingress
kubectl get ingress -n contract-management
```

## 🔧 Configuration

### Environment Variables

The system uses ConfigMaps and Secrets for configuration:

**ConfigMap (`configmap.yaml`)**:
- Database connection settings
- Blockchain configuration
- IAM settings
- Server configuration
- Frontend environment variables

**Secrets (`secrets.yaml`)**:
- Database passwords
- JWT secrets
- Keycloak credentials
- Private keys

### Domain Configuration

Update the ingress configuration with your domain names:

```yaml
spec:
  tls:
  - hosts:
    - your-domain.com
    - api.your-domain.com
    - keycloak.your-domain.com
```

## 📊 Monitoring & Observability

### Prometheus Metrics

The system exposes metrics on:
- Backend: `/metrics` endpoint
- Frontend: Built-in web vitals
- Keycloak: Built-in metrics

### Grafana Dashboards

Access Grafana at `http://your-domain.com/grafana`:
- Default credentials: `admin/admin`
- Pre-configured dashboards for:
  - Application performance
  - Database metrics
  - Blockchain node status
  - User activity

### Health Checks

All services include health check endpoints:
- Backend: `/health`
- Frontend: `/health`
- Database: Built-in PostgreSQL health
- Keycloak: Built-in health endpoint

## 🔄 Scaling

### Horizontal Pod Autoscaling

The system includes HPA configurations:
- Backend: 3-10 replicas based on CPU/Memory
- Frontend: 3-10 replicas based on CPU/Memory

### Manual Scaling

```bash
# Scale backend
kubectl scale deployment backend --replicas=5 -n contract-management

# Scale frontend
kubectl scale deployment frontend --replicas=5 -n contract-management
```

## 🔒 Security

### Network Policies

The system uses network policies to restrict communication:
- Database only accessible from backend
- Backend only accessible from frontend and ingress
- Keycloak accessible from backend and external

### RBAC

Role-based access control is configured for:
- Service accounts
- Pod security policies
- Resource quotas

### Secrets Management

Sensitive data is stored in Kubernetes Secrets:
- Base64 encoded (for development)
- Consider using external secret managers for production

## 🛠️ Maintenance

### Logs

```bash
# View backend logs
kubectl logs -f deployment/backend -n contract-management

# View frontend logs
kubectl logs -f deployment/frontend -n contract-management

# View database logs
kubectl logs -f deployment/postgres -n contract-management
```

### Database Backup

```bash
# Create backup
kubectl exec deployment/postgres -n contract-management -- pg_dump -U postgres contract_management > backup.sql

# Restore backup
kubectl exec -i deployment/postgres -n contract-management -- psql -U postgres contract_management < backup.sql
```

### Updates

```bash
# Update backend
kubectl set image deployment/backend backend=contract-management-backend:new-version -n contract-management

# Update frontend
kubectl set image deployment/frontend frontend=contract-management-frontend:new-version -n contract-management
```

## 🧹 Cleanup

To remove the entire deployment:

```bash
./k8s/cleanup.sh
```

## 🐛 Troubleshooting

### Common Issues

1. **Pods not starting**
   ```bash
   kubectl describe pod <pod-name> -n contract-management
   kubectl logs <pod-name> -n contract-management
   ```

2. **Database connection issues**
   ```bash
   kubectl exec deployment/postgres -n contract-management -- psql -U postgres -c "\l"
   ```

3. **Ingress not working**
   ```bash
   kubectl describe ingress contract-management-ingress -n contract-management
   ```

4. **SSL certificate issues**
   ```bash
   kubectl get certificates -n contract-management
   kubectl describe certificate contract-management-tls -n contract-management
   ```

### Performance Issues

1. **High CPU/Memory usage**
   ```bash
   kubectl top pods -n contract-management
   kubectl describe hpa -n contract-management
   ```

2. **Slow database queries**
   ```bash
   kubectl exec deployment/postgres -n contract-management -- psql -U postgres -c "SELECT * FROM pg_stat_activity;"
   ```

## 📈 Production Considerations

### High Availability

- Use multiple availability zones
- Configure pod disruption budgets
- Set up proper resource limits
- Use persistent volumes with replication

### Security

- Enable pod security policies
- Use network policies
- Implement proper RBAC
- Use external secret management
- Enable audit logging

### Monitoring

- Set up alerting rules
- Configure log aggregation
- Monitor resource usage
- Set up backup monitoring

### Backup Strategy

- Database backups
- Configuration backups
- Disaster recovery plan
- Regular testing of restore procedures

## 🔗 Useful Commands

```bash
# Get all resources
kubectl get all -n contract-management

# Port forward for local access
kubectl port-forward service/backend-service 5000:5000 -n contract-management
kubectl port-forward service/frontend-service 3000:3000 -n contract-management

# Execute commands in pods
kubectl exec -it deployment/backend -n contract-management -- /bin/sh
kubectl exec -it deployment/postgres -n contract-management -- psql -U postgres

# View events
kubectl get events -n contract-management --sort-by='.lastTimestamp'
```

## 📚 Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Helm Charts](https://helm.sh/docs/)
- [Prometheus Monitoring](https://prometheus.io/docs/)
- [Grafana Dashboards](https://grafana.com/docs/)
- [Keycloak Documentation](https://www.keycloak.org/documentation) 