# Azure deployment readiness

Assessment of whether the Confidential AI Network is ready to deploy to **Microsoft Azure** as of the current codebase.

---

## Summary

| Layer | Ready? | Notes |
|-------|--------|--------|
| **Architecture & security design** | Yes (doc) | [AZURE_SECURITY_ARCHITECTURE.md](../production/AZURE_SECURITY_ARCHITECTURE.md) |
| **Terraform / AKS scaffold** | Partial | [deployment/azure/terraform/README.md](../../deployment/azure/terraform/README.md) |
| **Core app on Azure (UI + API + Keycloak + DB)** | Partial | K8s manifests in Terraform module; needs validation & hardening |
| **SCITT CCF on Azure** | No | Not in Azure Terraform; required if `SCITT_CCF_ENABLED=true` locally |
| **Physical training on Azure** | Partial | CCRP `azureProvider.js` + runtime Terraform in `terraformService.js`; not platform baseline |
| **CAN / CCRP on Azure** | Partial | [azure_confidential_computing_integration.md](../contracts/azure_confidential_computing_integration.md) |
| **One-click production** | No | Full edge stack (Front Door, APIM) is design-only in Terraform |

**Verdict:** Ready for an **Azure infrastructure pilot** (VNet, AKS, PostgreSQL, App Gateway, ACR) with engineering effort to validate secrets, DNS, and Keycloak. **Not** ready for full production cutover with SCITT + training parity to local demo without additional work.

---

## What exists today

### Documentation

- [Azure Security Architecture](../production/AZURE_SECURITY_ARCHITECTURE.md) — step-by-step runbook + reference architecture
- [Azure IAM & Edge Config](AZURE_IAM_AND_EDGE_CONFIG.md) — RBAC, Entra ID, Front Door, APIM, WAF
- [deployment/azure/terraform/README.md](../../deployment/azure/terraform/README.md) — module list and deploy flow
- [backend/AZURE_INTEGRATION_GUIDE.md](../../backend/AZURE_INTEGRATION_GUIDE.md) — CCRP credential and training integration

### Infrastructure code (`deployment/azure/terraform/`)

| Module | Purpose |
|--------|---------|
| `networking` | VNet, subnets, NAT Gateway, NSGs |
| `aks` | AKS cluster + node pool |
| `database` | PostgreSQL Flexible Server |
| `load_balancer` | Public IP for ingress / App Gateway frontend |
| `container_registry` | ACR |
| `kubernetes_resources` | Namespace, ConfigMaps, Secrets, Deployments |

### Deployment scripts

| Script | Purpose |
|--------|---------|
| [deployment/azure/terraform/deploy.sh](../../deployment/azure/terraform/deploy.sh) | Full Terraform apply wrapper |
| [deployment/azure/terraform/destroy.sh](../../deployment/azure/terraform/destroy.sh) | Tear down infrastructure |
| [deploy/azure/deploy-azure.sh](../../deploy/azure/deploy-azure.sh) | Single-VM docker-compose deploy via `az` CLI (simpler) |
| [docs/contracts/azure-confidential-computing-setup.sh](../contracts/azure-confidential-computing-setup.sh) | DCsv3 confidential VM + Key Vault for CCRP |

### Application code

| Component | Path |
|-----------|------|
| Training provider | `backend/services/providers/azureProvider.js` |
| CCRP credentials | `backend/services/ccrpAzureCredentialsService.js` |
| Runtime Terraform (per-env) | `backend/services/terraformService.js` → `deployment/azure/terraform/environments/` |

> **Note:** Runtime per-contract Terraform writes to `deployment/azure/terraform/environments/{id}/` and is separate from the platform baseline in `deployment/azure/terraform/modules/`.

---

## Gaps for Azure production

### 1. Application stack

- Terraform K8s resources need images built and pushed to **ACR**
- **PostgreSQL Flexible Server** vs Sequelize migrations — verify extensions and connection SSL
- **Keycloak** realm export, HTTPS, persistent store differ from local docker-compose
- **Environment sync:** `config.env` / `secrets.env` → Key Vault + K8s Secrets mapping

### 2. SCITT CCF

- Local stack uses Docker Compose (`manage-scitt-ccf.sh`)
- **No SCITT module** in Azure Terraform — disable SCITT or deploy separate AKS workload

### 3. Training workloads

| Local | Azure target |
|-------|--------------|
| Disk uploads | **Blob Storage** + SAS or API upload |
| `docker run` on backend | **AKS Jobs** or confidential **DCsv3** VMs |
| Local trainer image | Push to **ACR** |
| CAN local CCRP | `azureProvider.js` + compartment-isolated compute |

CCRP path is partially implemented; platform Terraform does not automate training jobs.

### 4. Security architecture vs implementation

Docs describe Front Door, APIM, Bastion, multi-RG layout — **most edge services are not codified** in Terraform yet (design-only).

### 5. Testing & CI

- No regular `terraform apply` against live subscription in CI
- E2E tests target **localhost**, not Azure endpoints

---

## Recommended Azure rollout phases

### Phase 1 — Platform pilot (4–8 weeks)

- [ ] `terraform apply` in `can-dev-compute-rg`
- [ ] Build/push backend + frontend images to ACR
- [ ] Deploy AKS workloads; connect PostgreSQL; run migrations
- [ ] Keycloak + TLS + DNS
- [ ] `fix-auth-unified.sh` adapted for Azure Keycloak URL
- [ ] Manual smoke test: login, contract create, sign

### Phase 2 — Security hardening (2–4 weeks)

- [ ] Front Door + WAF in front of App Gateway
- [ ] APIM with JWT validation
- [ ] Private AKS cluster; Azure Bastion for admin
- [ ] Key Vault + External Secrets Operator
- [ ] Defender for Cloud alerts → on-call

### Phase 3 — Training & SCITT (TBD)

- [ ] Blob upload path for datasets
- [ ] AKS training jobs or DCsv3 integration
- [ ] SCITT CCF on AKS evaluation
- [ ] Staging environment mirrors prod

### Phase 4 — Production cutover

- [ ] Geo-redundant PostgreSQL + DR runbook
- [ ] Prod deny assignments + Azure Policy enforce mode
- [ ] Pen test sign-off
- [ ] E2E against staging URLs in CI

---

## Quick start (pilot)

```bash
# Prerequisites
az login
az account set --subscription "<subscription-id>"

# Platform Terraform
cd deployment/azure/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit subscription_id, location, db_password, keycloak_admin_password
./deploy.sh

# Or simpler VM path
./deploy/azure/deploy-azure.sh
```

---

## Related

- [OCI Readiness](OCI_READINESS.md) — parallel assessment for Oracle Cloud
- [docs/deployment/README.md](README.md) — deployment decision tree
