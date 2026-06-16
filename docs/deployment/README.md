# Deployment documentation hub

Choose the path that matches **where** and **how** you deploy. Script READMEs live outside `docs/`; this page links them together.

## Decision tree

```
Need production? ──no──► getting-started/QUICK_START.md + ./start-system.sh
        │
       yes
        │
        ├── Single Ubuntu VM / docker-compose ──► deployment/ (repo scripts)
        ├── OCI (OKE, ADB, WAF) ──────────────► deployment/oci/terraform/
        └── Kubernetes multi-service ─────────► deploy/production/ + docs/production/
```

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
| [OCI_IAM_AND_EDGE_CONFIG.md](OCI_IAM_AND_EDGE_CONFIG.md) | **IAM policies, Cloud Gate, API Gateway, WAF** (implementation reference) |
| [OCI_READINESS.md](OCI_READINESS.md) | Honest assessment: what is / isn't ready for OCI |
| [../../deployment/oci/terraform/README.md](../../deployment/oci/terraform/README.md) | Terraform modules (OKE, ADB, LB, OCIR) |
| [../../deploy/oci/deploy-oci.sh](../../deploy/oci/deploy-oci.sh) | Alternative OCI CLI VM deploy (simpler) |

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
