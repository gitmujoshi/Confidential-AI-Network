# CompliancePulse AI - Deployment Guide

## Prerequisites

### Required Software
- Docker >= 24.0.0
- Docker Compose >= 2.20.0
- Node.js >= 20.0.0 (for development)
- PostgreSQL >= 15.0 (if not using Docker)
- kubectl >= 1.27.0 (for Kubernetes deployment)

### Cloud Requirements (Production)
- GCP Account with:
  - Cloud Run
  - Cloud SQL (PostgreSQL)
  - BigQuery
  - Cloud KMS
  - Cloud Logging

## Local Development Deployment

### 1. Clone Repository

```bash
git clone https://github.com/your-org/compliancepulse-ai.git
cd compliancepulse-ai
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Services with Docker Compose

```bash
# Start all services
docker-compose up -d

# Check service health
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Initialize Database

```bash
# Run migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

### 5. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Health: http://localhost:3001/health
- OPA Console: http://localhost:8181

---

## Production Deployment (GCP)

### Architecture Overview

```
Internet → Cloud Load Balancer
  ↓
Cloud Armor (WAF)
  ↓
Cloud Run (Backend API)
  ↓
  ├─→ Cloud SQL (PostgreSQL)
  ├─→ BigQuery (Audit Logs)
  ├─→ Cloud KMS (Encryption Keys)
  └─→ SPIRE Server (Identity)
```

### 1. Set Up GCP Project

```bash
export PROJECT_ID="your-project-id"
export REGION="us-central1"

gcloud config set project $PROJECT_ID
```

### 2. Enable Required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  sql-component.googleapis.com \
  bigquery.googleapis.com \
  cloudkms.googleapis.com \
  logging.googleapis.com
```

### 3. Create Cloud SQL Instance

```bash
gcloud sql instances create compliancepulse-db \
  --database-version=POSTGRES_15 \
  --tier=db-custom-2-7680 \
  --region=$REGION \
  --storage-type=SSD \
  --storage-size=50GB \
  --backup-start-time=03:00

# Create database
gcloud sql databases create compliancepulse \
  --instance=compliancepulse-db

# Create user
gcloud sql users create complianceuser \
  --instance=compliancepulse-db \
  --password=<secure-password>
```

### 4. Create BigQuery Dataset

```bash
bq mk --dataset \
  --location=$REGION \
  $PROJECT_ID:audit_logs

# Create audit table
bq mk --table \
  $PROJECT_ID:audit_logs.tool_invocations \
  schema.json
```

### 5. Build and Deploy Backend to Cloud Run

```bash
# Build container
gcloud builds submit --tag gcr.io/$PROJECT_ID/compliancepulse-backend backend/

# Deploy to Cloud Run
gcloud run deploy compliancepulse-backend \
  --image gcr.io/$PROJECT_ID/compliancepulse-backend \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL=<cloud-sql-connection-string> \
  --add-cloudsql-instances $PROJECT_ID:$REGION:compliancepulse-db \
  --memory 2Gi \
  --cpu 2 \
  --max-instances 10
```

### 6. Deploy Frontend

```bash
# Build static files
cd frontend
npm run build

# Deploy to Cloud Storage + CDN
gsutil mb gs://$PROJECT_ID-frontend
gsutil -m cp -r dist/* gs://$PROJECT_ID-frontend/
gsutil web set -m index.html -e index.html gs://$PROJECT_ID-frontend

# Configure CDN
gcloud compute backend-buckets create compliancepulse-frontend \
  --gcs-bucket-name=$PROJECT_ID-frontend
```

### 7. Set Up Cloud Armor (WAF)

```bash
# Create security policy
gcloud compute security-policies create compliancepulse-waf \
  --description "WAF for CompliancePulse AI"

# Add rate limiting rule
gcloud compute security-policies rules create 1000 \
  --security-policy compliancepulse-waf \
  --expression "origin.region_code == 'CN'" \
  --action "deny-403"

# Attach to backend service
gcloud compute backend-services update compliancepulse-backend \
  --security-policy compliancepulse-waf \
  --global
```

---

## Kubernetes Deployment

### 1. Prepare Kubernetes Cluster

```bash
# Create GKE cluster
gcloud container clusters create compliancepulse-cluster \
  --region $REGION \
  --num-nodes 3 \
  --machine-type n2-standard-4 \
  --enable-autoscaling \
  --min-nodes 3 \
  --max-nodes 10

# Get credentials
gcloud container clusters get-credentials compliancepulse-cluster
```

### 2. Deploy PostgreSQL with Helm

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami

helm install postgresql bitnami/postgresql \
  --set auth.username=complianceuser \
  --set auth.password=<secure-password> \
  --set auth.database=compliancepulse
```

### 3. Deploy SPIRE Server

```bash
kubectl apply -f infrastructure/k8s/spire-server.yaml
```

### 4. Deploy OPA

```bash
kubectl apply -f infrastructure/k8s/opa-server.yaml
```

### 5. Deploy Backend Application

```bash
kubectl apply -f infrastructure/k8s/backend-deployment.yaml
kubectl apply -f infrastructure/k8s/backend-service.yaml
```

### 6. Deploy Frontend

```bash
kubectl apply -f infrastructure/k8s/frontend-deployment.yaml
kubectl apply -f infrastructure/k8s/frontend-service.yaml
```

### 7. Configure Ingress

```bash
kubectl apply -f infrastructure/k8s/ingress.yaml
```

---

## Post-Deployment Tasks

### 1. Initialize Policies

```bash
# Upload default OPA policies
curl -X PUT http://your-backend-url/api/v1/policies \
  -H "Authorization: Bearer $TOKEN" \
  -d @backend/src/opa/policies/default-policies.json
```

### 2. Create Admin User

```bash
curl -X POST http://your-backend-url/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@compliancepulse.ai",
    "password": "secure-password",
    "name": "Admin User",
    "role": "admin"
  }'
```

### 3. Configure Monitoring

```bash
# Set up Cloud Monitoring alerts
gcloud alpha monitoring policies create \
  --notification-channels=$CHANNEL_ID \
  --display-name="High Policy Violations" \
  --condition-threshold-value=10
```

---

## Security Checklist

- [ ] Change default JWT secret
- [ ] Configure HTTPS/TLS certificates
- [ ] Enable Cloud Armor WAF
- [ ] Set up VPC Private Service Connect
- [ ] Configure Customer-Managed Encryption Keys (CMEK)
- [ ] Enable audit logging
- [ ] Set up Cloud IAM roles
- [ ] Configure secret rotation
- [ ] Enable binary authorization
- [ ] Set up backup and disaster recovery

---

## Troubleshooting

### Backend Not Starting

Check logs:
```bash
docker-compose logs backend
# or
kubectl logs -l app=compliancepulse-backend
```

### Database Connection Errors

Verify connection string and credentials:
```bash
psql $DATABASE_URL
```

### OPA Policies Not Loading

Check OPA server logs:
```bash
docker-compose logs opa-server
```

### SPIRE Server Issues

Verify SPIRE server is running:
```bash
/opt/spire/bin/spire-server healthcheck
```

---

## Scaling Considerations

### Horizontal Scaling

- Backend: Scale Cloud Run instances based on CPU/memory
- Frontend: CDN automatically scales
- Database: Use Cloud SQL read replicas

### Performance Optimization

- Enable PostgreSQL connection pooling
- Configure Redis caching
- Use Cloud CDN for static assets
- Optimize OPA policy evaluation

---

## Backup and Recovery

### Database Backups

```bash
# Automated daily backups (GCP)
gcloud sql backups create \
  --instance=compliancepulse-db \
  --description="Manual backup"

# Restore from backup
gcloud sql backups restore <BACKUP_ID> \
  --backup-instance=compliancepulse-db \
  --backup-instance-instance=compliancepulse-db
```

### Audit Log Retention

BigQuery audit logs are retained for 90 days by default. Configure retention policy:

```bash
bq update --default_table_expiration 7776000 \
  $PROJECT_ID:audit_logs
```

---

## Support

For deployment issues:
- Documentation: [docs/](../docs/)
- GitHub Issues: https://github.com/your-org/compliancepulse-ai/issues
- Email: support@compliancepulse.ai
