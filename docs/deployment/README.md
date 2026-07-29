# Deployment documentation hub

Choose the path that matches **where** and **how** you deploy. Script READMEs live outside `docs/`; this page links them together.

## Decision tree

```
Need production? ──no──► getting-started/QUICK_START.md + ./start-system.sh
        │
       yes
        │
        ├── Shared security patterns (all clouds) ► production/MULTI_CLOUD_SECURITY_ARCHITECTURE_PATTERNS.md
        ├── Single Ubuntu VM / docker-compose ──► deployment/ (repo scripts)
        ├── OCI (OKE, ADB, WAF) ──────────────► deployment/oci/terraform/
        ├── Azure (AKS, PostgreSQL, Front Door) ► deployment/azure/terraform/
        ├── AWS (EKS, Cognito) ───────────────► docs (IaC scaffold TBD)
        ├── GCP (GKE, Identity Platform) ─────► docs (IaC scaffold TBD)
        └── Kubernetes multi-service ─────────► deploy/production/ + docs/production/
```

## Cross-cloud (start here for CISOs)

| Doc | Purpose |
|-----|---------|
| [../production/MULTI_CLOUD_SECURITY_ARCHITECTURE_PATTERNS.md](../production/MULTI_CLOUD_SECURITY_ARCHITECTURE_PATTERNS.md) | Common security architecture patterns across Azure, AWS, GCP, OCI |

## Local & VM (docker-compose)

| Doc / script | Purpose |
|--------------|---------|
| [../getting-started/SETUP.md](../getting-started/SETUP.md) | Detailed local setup |
| [../../deployment/README.md](../../deployment/README.md) | All deployment scripts (Keycloak, local VM, Ubuntu) |
| [../../deployment/LOCAL_VM_SETUP_GUIDE.md](../../deployment/LOCAL_VM_SETUP_GUIDE.md) | Local VM environment |
| `./start-system.sh` | Start backend, frontend, Keycloak, SCITT |

## Oracle Cloud Infrastructure (OCI)

| Doc / script | Purpose |
|--------------|---------|
| [../production/OCI_SECURITY_ARCHITECTURE.md](../production/OCI_SECURITY_ARCHITECTURE.md) | Security architecture + **step-by-step new OCI env setup** |
| [OCI_FEATURES_AND_CONFIGURATION.md](OCI_FEATURES_AND_CONFIGURATION.md) | **Feature catalog + env/settings** (OCI IAM, Vault, DEK/MEK, train, Object Storage, SCITT) |
| [OCI_IAM_AND_EDGE_CONFIG.md](OCI_IAM_AND_EDGE_CONFIG.md) | **IAM policies, Cloud Gate, API Gateway, WAF** (implementation reference) |
| [OCI_SPIFFE_SPIRE_WIF.md](OCI_SPIFFE_SPIRE_WIF.md) | **SPIFFE/SPIRE + OCI WIF** design & implementation (workload identity) |
| [OCI_DESIGN_COMPLETE.md](OCI_DESIGN_COMPLETE.md) | **Design/scaffold completeness** (code + docs; no live tenancy required) |
| [OCI_READINESS.md](OCI_READINESS.md) | Honest assessment: design vs live apply |
| [OCI_MARKETPLACE_LISTING_CHECKLIST.md](OCI_MARKETPLACE_LISTING_CHECKLIST.md) | **Oracle Marketplace** listing path (BYOL → paid SaaS / stack) |
| [OCI_TAGGING_AND_VERSIONING.md](OCI_TAGGING_AND_VERSIONING.md) | **cms-* tags, image tags, release versioning** |
| [../../config/examples/config.oci.env.example](../../config/examples/config.oci.env.example) | OCI env var template (target) |
| [../../deployment/oci/terraform/README.md](../../deployment/oci/terraform/README.md) | Terraform modules (OKE, ADB, LB, OCIR) |
| [../../deployment/deploy-oci.sh](../../deployment/deploy-oci.sh) | **Entry point**: `terraform` (OKE) or `vm` (single instance) |
| [../../deploy/oci/deploy-oci.sh](../../deploy/oci/deploy-oci.sh) | OCI CLI VM deploy (simpler path) |

## Microsoft Azure

| Doc / script | Purpose |
|--------------|---------|
| [../production/AZURE_SECURITY_ARCHITECTURE.md](../production/AZURE_SECURITY_ARCHITECTURE.md) | Security architecture + **step-by-step new Azure env setup** |
| [AZURE_FEATURES_AND_CONFIGURATION.md](AZURE_FEATURES_AND_CONFIGURATION.md) | **Feature catalog + env/settings** (Entra, KV, DEK/MEK, train, Blob, SCITT) |
| [AZURE_IAM_AND_EDGE_CONFIG.md](AZURE_IAM_AND_EDGE_CONFIG.md) | **Entra ID, RBAC, Front Door, APIM, WAF** (implementation reference) |
| [AZURE_READINESS.md](AZURE_READINESS.md) | Honest assessment: what is / isn't ready for Azure |
| [../../config/examples/config.azure.env.example](../../config/examples/config.azure.env.example) | Azure env var template (target) |
| [../../deployment/azure/terraform/README.md](../../deployment/azure/terraform/README.md) | Terraform modules (AKS, PostgreSQL, ACR) |
| [../../deployment/deploy-azure.sh](../../deployment/deploy-azure.sh) | **Entry point**: `terraform` (AKS) or `vm` (single VM) |
| [../../deploy/azure/deploy-azure.sh](../../deploy/azure/deploy-azure.sh) | Azure CLI VM deploy (simpler path) |
| [../../backend/AZURE_INTEGRATION_GUIDE.md](../../backend/AZURE_INTEGRATION_GUIDE.md) | CCRP training / confidential computing integration |

## Amazon Web Services (AWS)

| Doc / script | Purpose |
|--------------|---------|
| [../production/AWS_SECURITY_ARCHITECTURE.md](../production/AWS_SECURITY_ARCHITECTURE.md) | Security architecture + phased AWS env setup |
| [AWS_FEATURES_AND_CONFIGURATION.md](AWS_FEATURES_AND_CONFIGURATION.md) | **Feature catalog + env/settings** (Cognito, KMS, DEK/MEK, train, S3, SCITT) |
| [AWS_IAM_AND_EDGE_CONFIG.md](AWS_IAM_AND_EDGE_CONFIG.md) | **Cognito, IRSA, CloudFront, API Gateway, WAF** |
| [AWS_READINESS.md](AWS_READINESS.md) | Honest assessment: what is / isn't ready for AWS |
| [../../config/examples/config.aws.env.example](../../config/examples/config.aws.env.example) | AWS env var template (target) |

## Google Cloud (GCP)

| Doc / script | Purpose |
|--------------|---------|
| [../production/GCP_SECURITY_ARCHITECTURE.md](../production/GCP_SECURITY_ARCHITECTURE.md) | Security architecture + phased GCP env setup |
| [GCP_FEATURES_AND_CONFIGURATION.md](GCP_FEATURES_AND_CONFIGURATION.md) | **Feature catalog + env/settings** (Identity Platform, KMS, DEK/MEK, train, GCS, SCITT) |
| [GCP_IAM_AND_EDGE_CONFIG.md](GCP_IAM_AND_EDGE_CONFIG.md) | **IAM, Identity Platform, Cloud Armor, API Gateway, IAP** |
| [GCP_READINESS.md](GCP_READINESS.md) | Honest assessment: what is / isn't ready for GCP |
| [../../config/examples/config.gcp.env.example](../../config/examples/config.gcp.env.example) | GCP env var template (target) |

## Kubernetes / production

| Doc | Purpose |
|-----|---------|
| [../production/README.md](../production/README.md) | Production doc index |
| [../production/PRODUCTION_DEPLOYMENT_GUIDE.md](../production/PRODUCTION_DEPLOYMENT_GUIDE.md) | Step-by-step K8s deploy |
| [../production/PRODUCTION_ARCHITECTURE.md](../production/PRODUCTION_ARCHITECTURE.md) | Production topology |
| [../../deploy/production/README.md](../../deploy/production/README.md) | Deploy scripts for training environment |

## After deploy

- Auth issues: `./fix-auth.sh` or `./scripts/fix-auth-unified.sh`
- Health: `npm run status`
- Production troubleshooting: [../production/TROUBLESHOOTING_GUIDE.md](../production/TROUBLESHOOTING_GUIDE.md)
