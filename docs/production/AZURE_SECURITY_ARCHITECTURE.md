# Azure Security Architecture — Confidential AI Network

This document defines the **recommended Microsoft Azure security architecture** for deploying the Confidential AI Network across **dev, test, staging, and production** environments. It aligns with the [Azure Well-Architected Framework](https://learn.microsoft.com/azure/well-architected/security/) security pillar, Zero Trust principles, and the application stack (React frontend, Node.js API, Keycloak, PostgreSQL, Redis, optional SCITT CCF, CAN/training workloads on AKS).

### Document set

| Document | Role |
|----------|------|
| **This doc** | **Step-by-step setup runbook**, architecture rationale, topology, environment profiles, governance |
| [Azure IAM & Edge Config](../deployment/AZURE_IAM_AND_EDGE_CONFIG.md) | **Implementation reference** — Entra ID groups, RBAC, Front Door, APIM, WAF rules |
| [Azure Terraform](../../deployment/azure/terraform/README.md) | Baseline IaC (VNet, AKS, PostgreSQL, App Gateway, ACR, K8s manifests) |
| [Azure Readiness](../deployment/AZURE_READINESS.md) | Gap analysis and rollout phases |

**Related docs**

- [Production Security Guide](SECURITY_GUIDE.md) — application-layer controls
- [Production Architecture](PRODUCTION_ARCHITECTURE.md) — service topology
- [CCRP Azure integration](../../backend/AZURE_INTEGRATION_GUIDE.md) — per-contract training workloads (separate from platform deploy)

---

## Step-by-step: Azure infrastructure setup (new environment)

Use this runbook when onboarding a **new Azure subscription** or standing up a **new environment** (`dev` first, then test → staging → prod).

**Estimated effort:** dev pilot ~1–2 weeks; full four-env stack with edge hardening ~4–8 weeks.

### Phase 0 — Prerequisites

| Item | Action |
|------|--------|
| Azure subscription | Dedicated subscription or management group per customer; billing enabled |
| Region | Choose home region (e.g. `eastus`); plan paired region for prod DR |
| Quota | Request increases for AKS nodes, PostgreSQL, public IPs if needed |
| Tools | Terraform ≥ 1.0, Azure CLI (`az`), `kubectl`, Docker |
| DNS | Control of `example.com` for `app`, `auth`, `api`, `ops` subdomains |
| Corporate IdP | Microsoft Entra ID tenant (or federated Okta / SAML IdP) |

```bash
az login
az account set --subscription "<subscription-id>"
az account show
```

Collect: **subscription ID**, **tenant ID**, bootstrap **service principal** or user with `Owner` on dev resource groups (temporary).

---

### Phase 1 — Management groups, subscriptions & RBAC

**Goal:** Least-privilege structure before any workloads.

1. **Create management group tree** per §3 (`can-platform`, `can-dev`, `can-test`, `can-staging`, `can-prod`).
2. **Create resource group pattern** per environment — [Azure IAM & Edge Config §2](../deployment/AZURE_IAM_AND_EDGE_CONFIG.md).
3. **Create Entra ID security groups** — platform-dev, platform-ops, env users (TDC/TDP/CCRP/AppAdmin) per §1.
4. **Assign RBAC** at resource-group scope — [§3–§7](../deployment/AZURE_IAM_AND_EDGE_CONFIG.md).
5. **Enable Microsoft Defender for Cloud** on subscription; configure regulatory compliance dashboard.
6. **Tagging** — enforce `can-project`, `can-environment`, `can-data-classification` via Azure Policy.

**Exit criteria:** Platform-dev can manage `can-dev-*` resource groups only; cannot modify prod groups.

---

### Phase 2 — Shared services

**Goal:** Registry, secrets, logging, Terraform state — shared across envs.

1. **ACR** — create `cancontractmgmt` in `can-shared-services-rg`; enable geo-replication for prod.
2. **Key Vault** — create vault in `can-dev-data-rg`; enable purge protection in staging/prod.
3. **Key Vault secrets** (dev placeholders):
   - `can-dev-db-password`
   - `can-dev-***REMOVED-KEYCLOAK_DB_PASSWORD***-client-secret`
   - `can-dev-***REMOVED-KEYCLOAK_DB_PASSWORD***-admin-password`
4. **Storage accounts** — Terraform state (`canterraformstate`), datasets, training artifacts per env.
5. **Log Analytics** — workspace `can-dev-logs`; diagnostic settings on all edge resources.
6. **Configure Terraform remote state** → Azure Storage backend.

```bash
cd deployment/azure/terraform
cp terraform.tfvars.example terraform.tfvars
# Set subscription_id, tenant_id, location, resource_group_name
```

---

### Phase 3 — Network (per environment)

**Goal:** Isolated VNet, private AKS nodes, controlled egress.

1. **Choose CIDRs** per §5.1 (dev: `10.10.0.0/16`; no overlap across envs).
2. **Run Terraform networking module**:

```bash
cd deployment/azure/terraform
terraform init
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

Creates: VNet, public + private subnets, NAT Gateway, NSGs, private DNS zones.

3. **Apply NSG default-deny model** — §5.4 (`nsg-appgw-ingress`, `nsg-aks-nodes`, `nsg-***REMOVED-DB_PASSWORD***`).
4. **Private DNS** — `backend.can-dev.internal`, `***REMOVED-KEYCLOAK_DB_PASSWORD***.can-dev.internal`.
5. **Azure Bastion** — in `can-dev-network-rg`; no SSH from `0.0.0.0/0`.

**Exit criteria:** Private subnet routes `0.0.0.0/0` → NAT; AKS nodes have no public IPs.

---

### Phase 4 — Data layer

**Goal:** PostgreSQL Flexible Server and blob storage with private access only.

1. **PostgreSQL Flexible Server** — Terraform `database` module; **public access disabled**; delegated subnet + private DNS.
2. **Store connection string** in Key Vault `can-dev-db-connection`.
3. **Run DB migrations** from Bastion jump or CI job with `can-dev-db-admin` RBAC only.
4. **Blob Storage** — private endpoints; customer-managed keys from Key Vault in staging/prod.
5. **Defender for SQL** — enable on staging/prod databases.

**Exit criteria:** App subnet reaches PostgreSQL on `5432` via private endpoint only.

---

### Phase 5 — Compute (AKS)

**Goal:** Hardened Kubernetes cluster for app workloads.

1. **AKS cluster** — private cluster API; Azure CNI + Calico network policy; workload identity enabled.
2. **Node pool** — private subnet only; `Standard_D4s_v5`; no spot nodes in prod.
3. **Configure kubectl**:

```bash
az aks get-credentials --resource-group can-dev-compute-rg --name can-dev-aks
kubectl get nodes
```

4. **Namespaces** — `can-ingress`, `can-app`, `can-iam`, `can-data`, `can-training`, `can-ops`.
5. **Workload Identity** — bind AKS SA to Key Vault and Storage RBAC per env.
6. **Install ingress-nginx** (or AGIC) in `can-ingress`.
7. **Install External Secrets Operator** → sync Key Vault secrets into K8s.

**Exit criteria:** `kubectl get pods -A` healthy; nodes have no public IPs.

---

### Phase 6 — Application Gateway & in-cluster apps

1. **Application Gateway WAF v2** — listeners for frontend, backend, Keycloak paths.
2. **Build & push images to ACR**:

```bash
az acr login --name cancontractmgmt
docker build -t cancontractmgmt.azurecr.io/backend:latest backend/
docker build -t cancontractmgmt.azurecr.io/frontend:latest frontend/
docker push cancontractmgmt.azurecr.io/backend:latest
docker push cancontractmgmt.azurecr.io/frontend:latest
```

3. **Deploy K8s manifests** — Terraform `kubernetes_resources` module or `kubectl apply`.
4. **Health checks** — `GET /api/health` on backend; frontend `/`.

**Exit criteria:** `curl -k https://<appgw-fqdn>/api/health` returns 200 from VPN or Bastion port-forward.

---

### Phase 7 — Edge security (Front Door, APIM, WAF)

**Order:** TLS certs → App Gateway listeners → Front Door origin → APIM routes.

1. **TLS certificates** — Key Vault or Azure-managed; hostnames: `app.dev`, `auth.dev`, `api.dev`, `ops.dev`.
2. **Azure Front Door WAF** `can-waf-dev` — OWASP 3.2; **Detection** mode in dev.
3. **API Management** `can-apim-dev`:
   - Hostname `api.dev.example.com`
   - JWT validation → Keycloak JWKS
   - Routes: `/api/health`, `/api/auth/*`, `/api/contracts/*`
4. **Entra ID app registrations** — SPA, API, Easy Auth on App Service (if used) per §9.
5. **Custom WAF rules** — login rate limit; block `/api/debug` in prod.

---

### Phase 8 — Identity (Entra ID + Keycloak)

1. **Entra ID groups** per env — TDC, TDP, CCRP, AppAdmin; conditional access policies.
2. **Keycloak realm** `contract-management` — clients, roles, Vault-stored secrets.
3. **APIM JWT** issuer/JWKS → `https://auth.dev.example.com/realms/contract-management`.
4. **Sync seed users** — adapt `scripts/fix-auth-unified.sh` for Azure Keycloak URL.

**Exit criteria:** User logs in via Entra ID → SPA → Keycloak token → API call succeeds.

---

### Phase 9 — DNS & go-live validation

| Host | Target |
|------|--------|
| `app.dev.example.com` | Front Door / App Gateway public IP |
| `auth.dev.example.com` | Front Door / App Gateway |
| `api.dev.example.com` | Front Door → APIM |
| `ops.dev.example.com` | Front Door (Grafana if deployed) |

Smoke tests: login as TDC/TDP/CCRP; create → sign → training path; rate limits; 401 on unsigned API calls.

---

### Phase 10 — Promote to test / staging / prod

| Env | Azure Policy | WAF mode | MFA |
|-----|--------------|----------|-----|
| dev | Audit | Detection | Off |
| test | Audit | Prevention | Optional |
| staging | Enforce on data RG | Prevention | Admins |
| prod | Enforce + deny assignments | Prevention + bot protection | All users |

- **New resource group subtree** per env; **never** reuse VNet CIDRs.
- **Separate Entra ID app registrations** or distinct redirect URIs per env.
- **Separate Key Vault keys** and ACR image tags (`:staging`, `:prod`).

---

## 1. Design goals

| Goal | Implementation on Azure |
|------|------------------------|
| **Strong environment isolation** | Management groups, separate subscriptions (prod), resource groups, VNets, Key Vaults per env |
| **Least privilege** | Entra ID groups, RBAC, workload identity, deny assignments in prod |
| **Defense in depth** | Front Door WAF → APIM → App Gateway → AKS ingress → network policies |
| **Observable & auditable** | Log Analytics, Microsoft Sentinel, Defender for Cloud, diagnostic settings |
| **Data protection** | Key Vault, PostgreSQL TDE, Blob encryption, private endpoints |
| **Operational safety** | Azure Bastion, PIM for break-glass, change control per env |

---

## 2. High-level reference architecture

```mermaid
flowchart TB
  Users[Users / TDC TDP CCRP]
  Admins[Platform Admins]

  subgraph Edge["can-edge-shared"]
    FD[Azure Front Door + WAF]
    APIM[API Management]
    AGW[Application Gateway]
  end

  subgraph EnvProd["can-prod"]
    VNet[Prod VNet]
    AKS[AKS Cluster]
    PG[(PostgreSQL Flexible)]
    KV[Key Vault]
  end

  subgraph Shared["can-shared-services"]
    ACR[Container Registry]
    LA[Log Analytics]
    Defender[Defender for Cloud]
    Bastion[Azure Bastion]
  end

  Users --> FD
  FD -->|api.*| APIM --> AGW
  FD -->|app.* auth.*| AGW
  AGW --> AKS
  AKS --> PG
  AKS --> KV
  Admins --> Bastion --> AKS
  ACR --> AKS
  Defender -. monitors .-> EnvProd
```

**Traffic path (production)**

1. **DNS** — `app.{env}`, `auth.{env}`, `api.{env}`, `ops.{env}`.
2. **Front Door WAF** — TLS termination, OWASP, bot management, geo filtering.
3. **APIM** (`api.{env}`) — JWT validation (Keycloak JWKS), rate limits, CORS → App Gateway → backend `:5001`.
4. **App Gateway** — path-based routing to AKS ingress for frontend `:3000`, Keycloak `:8080`.
5. **AKS** — private nodes; egress via NAT; PostgreSQL via **private endpoint** only.

---

## 3. Management group & resource group hierarchy

```
Tenant Root Group
├── can-platform                    # Policy definitions, shared monitoring
├── can-shared-services             # ACR, Terraform state, CI/CD agents
├── can-dev
│   ├── can-dev-network-rg
│   ├── can-dev-compute-rg          # AKS, Bastion
│   ├── can-dev-data-rg             # PostgreSQL, Storage, Key Vault
│   └── can-dev-ops-rg              # Alerts, Action Groups
├── can-test  (+ network, compute, data, ops RGs)
├── can-staging
└── can-prod
```

| Resource group | Resources |
|----------------|-----------|
| `can-{env}-network-rg` | VNet, subnets, NSGs, NAT, App Gateway, private DNS |
| `can-{env}-compute-rg` | AKS, node pools, Bastion |
| `can-{env}-data-rg` | PostgreSQL Flexible Server, Blob Storage, Key Vault |
| `can-{env}-ops-rg` | Monitor alerts, Log Analytics diagnostics, on-call Action Groups |

---

## 4. Identity (Microsoft Entra ID)

| Environment | Entra app / group prefix | Purpose |
|-------------|--------------------------|---------|
| dev | `can-dev-*` | Developer SSO, Keycloak sync testing |
| test | `can-test-*` | QA automation, Playwright service accounts |
| staging | `can-staging-*` | Pre-prod UAT, partner demos |
| prod | `can-prod-*` | Production TDC / TDP / CCRP / AppAdmin |

Keycloak remains **application authorization** (roles: TDC, TDP, CCRP, AppAdmin). Entra ID provides **enterprise SSO** and conditional access.

| Layer | Component | Responsibility |
|-------|-----------|----------------|
| Corporate IdP | Entra ID / federated SAML | Workforce & partner federation |
| Entra ID | Groups + Conditional Access | MFA, device compliance, per-env lifecycle |
| App Gateway / Front Door | TLS + routing | Public ingress to AKS |
| Keycloak | Realm `contract-management` | App roles, client credentials, token issuance |
| Backend API | JWT validation | `authenticateToken` middleware |

---

## 5. Network segmentation

### 5.1 One VNet per environment

| Environment | VNet CIDR | AKS service CIDR | Pod CIDR (overlay) |
|-------------|-----------|------------------|---------------------|
| dev | `10.10.0.0/16` | `10.96.0.0/16` | `10.244.0.0/16` |
| test | `10.20.0.0/16` | `10.97.0.0/16` | `10.245.0.0/16` |
| staging | `10.30.0.0/16` | `10.98.0.0/16` | `10.246.0.0/16` |
| prod | `10.40.0.0/16` | `10.99.0.0/16` | `10.247.0.0/16` |

### 5.2 Subnet tiers

| Tier | Purpose | Route |
|------|---------|-------|
| Public | App Gateway frontend only | Internet via IGW |
| Private app | AKS nodes | Egress `0.0.0.0/0` → NAT Gateway |
| Private data | PostgreSQL delegated subnet | No internet route |

### 5.3 NSGs — default deny

| NSG | Ingress | Egress |
|-----|---------|--------|
| `nsg-appgw-ingress` | 443 from Front Door / Internet | To AKS ingress |
| `nsg-aks-nodes` | From App Gateway only | NAT + Azure services |
| `nsg-***REMOVED-DB_PASSWORD***` | 5432 from AKS subnet only | Deny all |

---

## 6. Edge security

| Service | Hostname | Role |
|---------|----------|------|
| Front Door + WAF | All public hostnames | TLS, OWASP, bot management, DDoS |
| API Management | `api.{env}` | JWT validation, rate limits, API versioning |
| Application Gateway | Internal routing | Path-based backend pools to AKS ingress |

Full route tables and JWT policies: [Azure IAM & Edge Config §9–§11](../deployment/AZURE_IAM_AND_EDGE_CONFIG.md).

---

## 7. Compute & container security (AKS)

| Control | Setting |
|---------|---------|
| API server | Private endpoint (prod); authorized IP ranges (dev) |
| Nodes | Private subnet only; no public IPs |
| Identity | Workload Identity + managed identity for ACR pull |
| Network policy | Calico enabled |
| Pod security | Restricted baseline; non-root containers |
| Secrets | External Secrets Operator → Key Vault |

---

## 8. Data security

| Resource | Control |
|----------|---------|
| PostgreSQL Flexible Server | Private endpoint; TDE; automated backups; geo-redundant in prod |
| Blob Storage | Private endpoint; SSE with Key Vault CMK in staging/prod |
| Key Vault | Purge protection (prod); HSM pool for prod keys |
| Redis (if on AKS) | Password in Key Vault; ClusterIP service only |

---

## 9. Security operations

| Service | Scope |
|---------|-------|
| **Microsoft Defender for Cloud** | Subscription-wide; alerts on public exposure, weak TLS, crypto mining |
| **Azure Policy** | Deny public blob access, require HTTPS, enforce tags on `can-{env}-data-rg` |
| **Log Analytics / Sentinel** | Central audit; WAF, APIM, AKS, Keycloak logs exported. App audit: [SIEM Integration Framework](SIEM_INTEGRATION_FRAMEWORK.md). |
| **Azure Bastion** | Admin kubectl/SSH; session logging; no open port 22 |

---

## 10. Environment profiles

Same posture progression as OCI: dev (permissive) → test → staging (prod-like) → prod (enforce all policies, MFA, geo-redundant DB).

---

## 11. Multi-region & disaster recovery (prod)

| Component | Primary | DR region |
|-----------|---------|-----------|
| AKS | Active | Standby cluster (scaled down) |
| PostgreSQL | Active | Geo-redundant backup / read replica |
| Blob Storage | Active | GRS or RA-GRS |
| ACR | Primary region | Geo-replication enabled |
| Front Door | Active-active | Built-in global anycast |

RTO target: **4 h** | RPO target: **15 min** (adjust per SLA).

---

## 12. Application mapping

| Component | Azure service | Security notes |
|-----------|---------------|----------------|
| React frontend | AKS + Front Door | CSP at ingress; no secrets in bundle |
| Backend API | AKS + APIM | JWT via Keycloak; signing gate for TDP/CCRP |
| Keycloak | AKS | External DB on PostgreSQL; Key Vault for client secrets |
| PostgreSQL | Flexible Server | Private endpoint; Defender for SQL |
| Redis | AKS or Azure Cache | Key Vault password; private access |
| SCITT CCF | AKS or dedicated VM | Isolated namespace; mTLS to backend |
| CAN / training | AKS `can-training` | Confidential VMs (DCsv3) where required |
| Playwright E2E | test RG CI | Seeded users only; no prod credentials |

---

## 13. Deployment & IaC alignment

**Current state:** `deployment/azure/terraform/` provisions VNet, AKS, PostgreSQL, App Gateway public IP, ACR, and baseline K8s workloads. It does **not** yet create management groups, Entra app registrations, Front Door, or APIM.

| Planned module | Purpose |
|----------------|---------|
| `modules/front_door` | Global WAF + routing |
| `modules/apim` | API Management + JWT policies |
| `modules/key_vault` | Per-env secrets and CMK |
| `modules/policy` | Azure Policy initiative assignments |

**Alternative path:** [deploy/azure/deploy-azure.sh](../../deploy/azure/deploy-azure.sh) — single-VM docker-compose deploy via Azure CLI (simpler than AKS).

---

## 14. Pre-go-live checklist (prod)

- [ ] Management group RBAC applied; prod deny assignments active
- [ ] Entra conditional access + MFA for all prod users
- [ ] Front Door WAF in Prevention mode; APIM JWT validation enabled
- [ ] AKS private cluster; no public node IPs
- [ ] PostgreSQL private endpoint only; backups geo-redundant
- [ ] Key Vault purge protection; no secrets in Terraform state plaintext
- [ ] Blob containers private; Azure Policy enforced on data RG
- [ ] Defender for Cloud alerts routed to on-call
- [ ] Keycloak realm configured; `fix-auth-unified.sh` adapted for Azure URLs
- [ ] E2E smoke tests pass against staging before prod promotion

---

## 15. Reference URLs

Verified **2026-06-16**.

- [Azure Well-Architected — Security](https://learn.microsoft.com/azure/well-architected/security/)
- [Microsoft Entra ID](https://learn.microsoft.com/entra/identity/)
- [Azure Kubernetes Service](https://learn.microsoft.com/azure/aks/)
- [Azure Application Gateway WAF](https://learn.microsoft.com/azure/web-application-firewall/ag/ag-overview)
- [Azure Front Door](https://learn.microsoft.com/azure/frontdoor/)
- [API Management](https://learn.microsoft.com/azure/api-management/)
- [Azure Key Vault](https://learn.microsoft.com/azure/key-vault/)
- [PostgreSQL Flexible Server](https://learn.microsoft.com/azure/***REMOVED-DB_PASSWORD***ql/flexible-server/)
- [Microsoft Defender for Cloud](https://learn.microsoft.com/azure/defender-for-cloud/)
- [Azure Bastion](https://learn.microsoft.com/azure/bastion/bastion-overview)
- [Azure Policy](https://learn.microsoft.com/azure/governance/policy/)
