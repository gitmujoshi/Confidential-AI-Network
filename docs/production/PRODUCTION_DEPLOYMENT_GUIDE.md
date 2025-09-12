# Production Deployment Guide

## 🚀 **Complete Production Deployment Guide for AI Model Training Environment**

This guide provides step-by-step instructions for deploying the complete AI model training environment to production.

## 📋 **Prerequisites**

### **Required Tools**
- **Kubernetes**: v1.24+ with cluster admin access
- **Helm**: v3.8+ for package management
- **Docker**: v20.10+ for container builds
- **Terraform**: v1.3+ for infrastructure
- **kubectl**: v1.24+ for cluster management
- **Cloud CLI**: AWS/Azure/GCP/OCI CLI configured

### **Cloud Provider Requirements**
- **Kubernetes Cluster**: EKS, AKS, GKE, or OKE
- **Container Registry**: ECR, ACR, GCR, or OCI Registry
- **Storage**: S3, Blob Storage, Cloud Storage, or Object Storage
- **Key Management**: KMS, Key Vault, or Vault
- **Monitoring**: CloudWatch, Monitor, or Cloud Monitoring

## 🏗️ **Deployment Architecture**

### **Production Architecture**
```
Internet
    ↓
Load Balancer (ALB/NLB/GLB)
    ↓
Ingress Controller (NGINX/Traefik)
    ↓
Kubernetes Cluster
├── AI Training API (3 replicas)
├── Training Orchestrator (2 replicas)
├── Training Monitor (2 replicas)
├── Provenance Tracker (2 replicas)
├── Training Containers (1 replica)
└── Supporting Services
    ├── PostgreSQL (Primary + Replica)
    ├── Redis (Cluster)
    ├── Prometheus (Monitoring)
    ├── Grafana (Dashboards)
    ├── ELK Stack (Logging)
    └── Vault (Secrets)
```

## 🔧 **Step-by-Step Deployment**

### **Step 1: Infrastructure Setup**

#### **1.1 Create Kubernetes Cluster**
```bash
# AWS EKS
eksctl create cluster \
  --name ai-training-cluster \
  --region us-east-1 \
  --nodegroup-name workers \
  --node-type m5.large \
  --nodes 3 \
  --nodes-min 1 \
  --nodes-max 10 \
  --managed

# Azure AKS
az aks create \
  --resource-group ai-training-rg \
  --name ai-training-cluster \
  --node-count 3 \
  --node-vm-size Standard_D2s_v3 \
  --enable-addons monitoring

# Google GKE
gcloud container clusters create ai-training-cluster \
  --zone us-central1-a \
  --num-nodes 3 \
  --machine-type e2-standard-2 \
  --enable-autoscaling \
  --min-nodes 1 \
  --max-nodes 10
```

#### **1.2 Setup Container Registry**
```bash
# AWS ECR
aws ecr create-repository --repository-name ai-training
aws ecr create-repository --repository-name training-orchestrator
aws ecr create-repository --repository-name training-monitor
aws ecr create-repository --repository-name provenance-tracker

# Azure ACR
az acr create --resource-group ai-training-rg --name aitrainingregistry --sku Basic

# Google GCR
gcloud artifacts repositories create ai-training \
  --repository-format=docker \
  --location=us-central1
```

### **Step 2: Build and Push Images**

#### **2.1 Build Docker Images**
```bash
# Build main training image
docker build -t ai-training:latest -f Dockerfile.training .

# Build orchestrator image
docker build -t training-orchestrator:latest -f Dockerfile.orchestrator .

# Build monitor image
docker build -t training-monitor:latest -f Dockerfile.monitor .

# Build provenance tracker image
docker build -t provenance-tracker:latest -f Dockerfile.provenance .
```

#### **2.2 Tag and Push Images**
```bash
# AWS ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

docker tag ai-training:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/ai-training:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/ai-training:latest

# Azure ACR
az acr login --name aitrainingregistry
docker tag ai-training:latest aitrainingregistry.azurecr.io/ai-training:latest
docker push aitrainingregistry.azurecr.io/ai-training:latest

# Google GCR
gcloud auth configure-docker
docker tag ai-training:latest gcr.io/your-project/ai-training:latest
docker push gcr.io/your-project/ai-training:latest
```

### **Step 3: Deploy to Kubernetes**

#### **3.1 Create Namespace and Secrets**
```bash
# Create namespace
kubectl create namespace training-environment

# Create secrets
kubectl create secret generic database-secret \
  --from-literal=host=***REMOVED-DB_PASSWORD***ql.production.svc.cluster.local \
  --from-literal=password=your-db-password \
  --namespace=training-environment

kubectl create secret generic redis-secret \
  --from-literal=password=your-redis-password \
  --namespace=training-environment

kubectl create secret generic auth-secret \
  --from-literal=jwt-secret=your-jwt-secret \
  --namespace=training-environment

kubectl create secret generic encryption-secret \
  --from-literal=encryption-key=your-encryption-key \
  --namespace=training-environment

kubectl create secret generic aws-secret \
  --from-literal=access-key-id=your-access-key \
  --from-literal=secret-access-key=your-secret-key \
  --namespace=training-environment
```

#### **3.2 Deploy Applications**
```bash
# Deploy AI Training API
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-training-api
  namespace: training-environment
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
        image: 123456789012.dkr.ecr.us-east-1.amazonaws.com/ai-training:latest
        ports:
        - containerPort: 3001
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
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3001
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
    targetPort: 3001
  type: ClusterIP
EOF
```

#### **3.3 Deploy Supporting Services**
```bash
# Deploy PostgreSQL
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install ***REMOVED-DB_PASSWORD***ql bitnami/***REMOVED-DB_PASSWORD***ql \
  --namespace training-environment \
  --set auth.***REMOVED-DB_PASSWORD***Password=your-db-password \
  --set auth.database=contract_management_production \
  --set primary.persistence.size=100Gi

# Deploy Redis
helm install redis bitnami/redis \
  --namespace training-environment \
  --set auth.password=your-redis-password \
  --set master.persistence.size=50Gi

# Deploy Prometheus
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set grafana.adminPassword=***REMOVED-KEYCLOAK_ADMIN_PASSWORD***

# Deploy ELK Stack
helm repo add elastic https://helm.elastic.co
helm install elasticsearch elastic/elasticsearch \
  --namespace logging \
  --create-namespace \
  --set replicas=3 \
  --set volumeClaimTemplate.resources.requests.storage=100Gi

helm install kibana elastic/kibana \
  --namespace logging \
  --set replicas=1

# Deploy Vault
helm repo add hashicorp https://helm.releases.hashicorp.com
helm install vault hashicorp/vault \
  --namespace vault \
  --create-namespace \
  --set server.dev.enabled=true
```

### **Step 4: Configure Ingress and Load Balancer**

#### **4.1 Deploy NGINX Ingress Controller**
```bash
# AWS EKS
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=LoadBalancer \
  --set controller.service.annotations."service\.beta\.kubernetes\.io/aws-load-balancer-type"=nlb

# Azure AKS
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=LoadBalancer

# Google GKE
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=LoadBalancer
```

#### **4.2 Create Ingress Resource**
```bash
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ai-training-ingress
  namespace: training-environment
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - training.example.com
    secretName: training-tls
  rules:
  - host: training.example.com
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
```

### **Step 5: Configure Monitoring and Logging**

#### **5.1 Setup Prometheus Monitoring**
```bash
# Create monitoring configuration
kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    scrape_configs:
    - job_name: 'ai-training-api'
      static_configs:
      - targets: ['ai-training-service.training-environment.svc.cluster.local:80']
    - job_name: 'kubernetes-pods'
      kubernetes_sd_configs:
      - role: pod
      relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
EOF
```

#### **5.2 Setup Grafana Dashboards**
```bash
# Create Grafana dashboard
kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-dashboard
  namespace: monitoring
data:
  dashboard.json: |
    {
      "dashboard": {
        "title": "AI Training Environment",
        "panels": [
          {
            "title": "API Requests",
            "type": "graph",
            "targets": [
              {
                "expr": "rate(http_requests_total[5m])",
                "legendFormat": "{{method}} {{endpoint}}"
              }
            ]
          }
        ]
      }
    }
EOF
```

### **Step 6: Configure Security**

#### **6.1 Setup Network Policies**
```bash
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ai-training-network-policy
  namespace: training-environment
spec:
  podSelector:
    matchLabels:
      app: ai-training-api
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 3001
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: training-environment
    ports:
    - protocol: TCP
      port: 5432
    - protocol: TCP
      port: 6379
EOF
```

#### **6.2 Setup Pod Security Policies**
```bash
kubectl apply -f - <<EOF
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: ai-training-psp
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'downwardAPI'
    - 'persistentVolumeClaim'
  runAsUser:
    rule: 'MustRunAsNonRoot'
  seLinux:
    rule: 'RunAsAny'
  fsGroup:
    rule: 'RunAsAny'
EOF
```

### **Step 7: Configure Backup and Recovery**

#### **7.1 Setup Velero for Backup**
```bash
# Install Velero
helm repo add vmware-tanzu https://vmware-tanzu.github.io/helm-charts
helm install velero vmware-tanzu/velero \
  --namespace velero \
  --create-namespace \
  --set configuration.provider=aws \
  --set configuration.backupStorageLocation.bucket=ai-training-backups \
  --set configuration.backupStorageLocation.config.region=us-east-1 \
  --set configuration.volumeSnapshotLocation.config.region=us-east-1

# Create backup schedule
velero schedule create daily-backup \
  --schedule="0 2 * * *" \
  --include-namespaces training-environment \
  --ttl 30d
```

#### **7.2 Setup Database Backup**
```bash
# Create database backup job
kubectl apply -f - <<EOF
apiVersion: batch/v1
kind: CronJob
metadata:
  name: ***REMOVED-DB_PASSWORD***-backup
  namespace: training-environment
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: ***REMOVED-DB_PASSWORD***-backup
            image: ***REMOVED-DB_PASSWORD***:13
            command:
            - /bin/bash
            - -c
            - |
              pg_dump -h ***REMOVED-DB_PASSWORD***ql.training-environment.svc.cluster.local -U ***REMOVED-DB_PASSWORD*** contract_management_production > /backup/backup-$(date +%Y%m%d).sql
              aws s3 cp /backup/backup-$(date +%Y%m%d).sql s3://ai-training-backups/database/
            env:
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: database-secret
                  key: password
            volumeMounts:
            - name: backup-storage
              mountPath: /backup
          volumes:
          - name: backup-storage
            emptyDir: {}
          restartPolicy: OnFailure
EOF
```

### **Step 8: Verify Deployment**

#### **8.1 Check Pod Status**
```bash
kubectl get pods -n training-environment
kubectl get services -n training-environment
kubectl get ingress -n training-environment
```

#### **8.2 Run Health Checks**
```bash
# Get load balancer URL
kubectl get ingress ai-training-ingress -n training-environment

# Test API endpoints
curl https://training.example.com/health
curl https://training.example.com/api/training/jobs
```

#### **8.3 Check Monitoring**
```bash
# Access Grafana
kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring

# Access Kibana
kubectl port-forward svc/kibana-kb 5601:5601 -n logging
```

## 🔧 **Configuration Management**

### **Environment Variables**
```bash
# Production configuration
export NODE_ENV=production
export TEE_MODE=cloud
export CLOUD_PROVIDER=aws
export AWS_REGION=us-east-1
export DB_HOST=***REMOVED-DB_PASSWORD***ql.training-environment.svc.cluster.local
export REDIS_HOST=redis.training-environment.svc.cluster.local
export MONITORING_ENABLED=true
export PRIVACY_ENABLED=true
export PROVENANCE_ENABLED=true
```

### **Secrets Management**
```bash
# Store secrets in Vault
vault kv put secret/ai-training/database \
  host=***REMOVED-DB_PASSWORD***ql.training-environment.svc.cluster.local \
  password=your-db-password

vault kv put secret/ai-training/redis \
  password=your-redis-password

vault kv put secret/ai-training/encryption \
  encryption-key=your-encryption-key
```

## 📊 **Monitoring and Alerting**

### **Key Metrics to Monitor**
- **API Performance**: Response time, throughput, error rate
- **Resource Usage**: CPU, memory, disk, network
- **Training Jobs**: Success rate, duration, resource consumption
- **Security**: Authentication failures, unauthorized access
- **Compliance**: Privacy budget usage, audit log completeness

### **Alert Rules**
```yaml
# Prometheus alert rules
groups:
- name: ai-training-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"
  
  - alert: HighCPUUsage
    expr: cpu_usage_percent > 80
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High CPU usage detected"
```

## 🔒 **Security Best Practices**

### **Network Security**
- Use network policies to restrict traffic
- Enable TLS for all communications
- Use service mesh for advanced traffic management
- Implement rate limiting and DDoS protection

### **Data Security**
- Encrypt data at rest and in transit
- Use proper key management
- Implement data anonymization
- Regular security audits

### **Access Control**
- Use RBAC for Kubernetes resources
- Implement least privilege access
- Regular access reviews
- Multi-factor authentication

## 🚀 **Scaling and Performance**

### **Horizontal Pod Autoscaling**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ai-training-api-hpa
  namespace: training-environment
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ai-training-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### **Vertical Pod Autoscaling**
```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: ai-training-api-vpa
  namespace: training-environment
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ai-training-api
  updatePolicy:
    updateMode: "Auto"
```

## 📋 **Maintenance and Updates**

### **Rolling Updates**
```bash
# Update deployment
kubectl set image deployment/ai-training-api \
  ai-training-api=123456789012.dkr.ecr.us-east-1.amazonaws.com/ai-training:v2.0.0 \
  -n training-environment

# Check rollout status
kubectl rollout status deployment/ai-training-api -n training-environment

# Rollback if needed
kubectl rollout undo deployment/ai-training-api -n training-environment
```

### **Database Migrations**
```bash
# Run database migrations
kubectl run migration-job \
  --image=123456789012.dkr.ecr.us-east-1.amazonaws.com/ai-training:latest \
  --env="NODE_ENV=production" \
  --command -- npm run migrate:up \
  -n training-environment
```

## 🎯 **Production Checklist**

### **Pre-Deployment**
- [ ] Kubernetes cluster configured
- [ ] Container registry setup
- [ ] Secrets and configuration ready
- [ ] Monitoring and logging configured
- [ ] Backup strategy implemented
- [ ] Security policies applied
- [ ] Load balancer configured
- [ ] SSL certificates installed

### **Post-Deployment**
- [ ] All pods running
- [ ] Services accessible
- [ ] Health checks passing
- [ ] Monitoring working
- [ ] Logs flowing
- [ ] Alerts configured
- [ ] Backup tested
- [ ] Performance validated

## 🆘 **Troubleshooting**

### **Common Issues**
1. **Pods not starting**: Check resource limits and secrets
2. **Services not accessible**: Verify ingress and network policies
3. **Database connection issues**: Check secrets and network connectivity
4. **High resource usage**: Review resource limits and scaling policies
5. **Security issues**: Verify RBAC and network policies

### **Debug Commands**
```bash
# Check pod logs
kubectl logs -f deployment/ai-training-api -n training-environment

# Check pod status
kubectl describe pod <pod-name> -n training-environment

# Check service endpoints
kubectl get endpoints -n training-environment

# Check ingress status
kubectl describe ingress ai-training-ingress -n training-environment
```

## 📚 **Additional Resources**

- **Kubernetes Documentation**: https://kubernetes.io/docs/
- **Helm Charts**: https://helm.sh/docs/
- **Prometheus Monitoring**: https://prometheus.io/docs/
- **Grafana Dashboards**: https://grafana.com/docs/
- **ELK Stack**: https://www.elastic.co/guide/
- **Vault Documentation**: https://www.vaultproject.io/docs/

---

**Production Deployment Status**: ✅ **READY**  
**Security Level**: ✅ **ENTERPRISE-GRADE**  
**Scalability**: ✅ **AUTO-SCALING**  
**Monitoring**: ✅ **COMPREHENSIVE**  
**Backup**: ✅ **AUTOMATED**
