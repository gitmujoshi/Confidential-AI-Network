# Azure IAM & Edge Configuration — Confidential AI Network

**Implementation reference** for Entra ID groups, RBAC assignments, Front Door, API Management, Application Gateway, and WAF rules. Use alongside [Azure Security Architecture](../production/AZURE_SECURITY_ARCHITECTURE.md) for design context.

---

## 1. Principal catalog

### 1.1 Entra ID security groups (per environment)

| Group | Members | Purpose |
|-------|---------|---------|
| `can-{env}-tdc-users` | Training Data Consumers | Contract create, training requests |
| `can-{env}-tdp-users` | Training Data Providers | Dataset upload, contract sign |
| `can-{env}-ccrp-users` | Confidential Clean Room Providers | Environment provision, training monitor |
| `can-{env}-app-admins` | Application administrators | User management, system config |
| `can-{env}-platform-dev` | Engineers (dev/test only) | Deploy to dev/test resource groups |
| `can-{env}-platform-ops` | SRE / ops | kubectl via Bastion, read-only prod data |
| `can-{env}-security-auditors` | Security team | Read-only audit, Log Analytics |
| `can-tenancy-admins` | Bootstrap admins | Break-glass; PIM-eligible in prod |

### 1.2 Service principals & managed identities

| Identity | Scope | Permissions |
|----------|-------|-------------|
| `can-{env}-aks-identity` | AKS kubelet | AcrPull on ACR; Key Vault Secrets User |
| `can-{env}-cicd-sp` | `can-shared-services-rg` | AcrPush; Contributor on dev compute RG only |
| `can-{env}-terraform-sp` | Per-env RGs | Contributor (dev); custom role (prod apply via pipeline) |
| `can-{env}-external-secrets` | Key Vault | Get/List secrets |

### 1.3 App registrations

| App | Type | Redirect URIs |
|-----|------|---------------|
| `can-{env}-frontend` | SPA (public, PKCE) | `https://app.{env}.example.com/*` |
| `can-{env}-backend` | Confidential | N/A (client credentials for service-to-service) |
| `can-{env}-keycloak-broker` | SAML/OIDC federation | Keycloak broker endpoints |

---

## 2. Management group & resource group tree

```
Tenant Root
├── can-platform-rg              # Policy definitions, diagnostic settings templates
├── can-shared-services-rg       # ACR, Terraform state storage, CI agents
├── can-dev-network-rg
├── can-dev-compute-rg
├── can-dev-data-rg
├── can-dev-ops-rg
├── can-test-*                   # Same pattern
├── can-staging-*
└── can-prod-*
```

---

## 3. RBAC — shared services

```text
# CI/CD push images
Role Assignment: AcrPush
Principal: can-cicd-sp
Scope: /subscriptions/{sub}/resourceGroups/can-shared-services-rg/providers/Microsoft.ContainerRegistry/registries/cancontractmgmt

# Terraform state
Role Assignment: Storage Blob Data Contributor
Principal: can-terraform-sp
Scope: /subscriptions/{sub}/resourceGroups/can-shared-services-rg/providers/Microsoft.Storage/storageAccounts/canterraformstate
```

---

## 4. RBAC — dev environment

```text
# Platform developers
Role Assignment: Contributor
Principal: can-dev-platform-dev (group)
Scope: /subscriptions/{sub}/resourceGroups/can-dev-network-rg
Scope: /subscriptions/{sub}/resourceGroups/can-dev-compute-rg
Scope: /subscriptions/{sub}/resourceGroups/can-dev-data-rg

# Read shared ACR
Role Assignment: AcrPull
Principal: can-dev-platform-dev
Scope: can-shared-services-rg / ACR

# AKS cluster admin (dev only — use Azure RBAC for Kubernetes in prod)
Role Assignment: Azure Kubernetes Service Cluster Admin Role
Principal: can-dev-platform-dev
Scope: can-dev-compute-rg / AKS cluster
```

---

## 5. RBAC — data compartment

```text
# AKS workload → Key Vault
Role Assignment: Key Vault Secrets User
Principal: can-dev-aks-identity (managed identity)
Scope: can-dev-data-rg / Key Vault

# AKS workload → Blob datasets
Role Assignment: Storage Blob Data Contributor
Principal: can-dev-aks-identity
Scope: can-dev-data-rg / Storage account (container: datasets-*)

# Deny direct DB admin for ops
Role Assignment: PostgreSQL Flexible Server Contributor (DENY via ABAC/custom)
Principal: can-dev-platform-ops
Condition: exclude can-dev-data-rg / PostgreSQL connect-only custom role
```

---

## 6. RBAC — production deny overlays

```text
# Deny public IP on prod data subnet
Role Assignment: Deny Assignment
Principal: all users except can-tenancy-admins
Scope: can-prod-data-rg
Actions: Microsoft.Network/publicIPAddresses/write

# Deny AKS admin to prod for developers
Role Assignment: (none — no Cluster Admin on prod for can-*-platform-dev)
```

---

## 7. Conditional Access (staging + prod)

| Policy | Users | Conditions |
|--------|-------|------------|
| Require MFA | All prod groups | All cloud apps |
| Block legacy auth | All | Any |
| Require compliant device | `can-prod-*` admins | Azure portal, kubectl via Bastion |
| Geo block | Prod | Block countries outside allow-list |

---

## 8. Kubernetes RBAC (AKS)

| Namespace | Service account | Role |
|-----------|-----------------|------|
| `can-app` | `backend-sa` | ConfigMap/Secret read in `can-app` |
| `can-iam` | `keycloak-sa` | PVC read/write in `can-iam` |
| `can-training` | `training-sa` | Job create in `can-training`; no ingress |
| `can-ingress` | `ingress-nginx-sa` | ClusterRole for ingress controller |

Workload Identity federation: `can-{env}-aks-identity` → Key Vault, Storage, ACR.

---

## 9. Application Gateway routing

| Path | Backend pool | Port |
|------|--------------|------|
| `/` | `frontend-pool` | 3000 |
| `/api/*` | `backend-pool` | 5001 |
| `/auth/*`, `/realms/*` | `keycloak-pool` | 8080 |

Health probes: frontend `/`, backend `/api/health`, keycloak `/health/ready`.

---

## 10. API Management routes

| Route | Method | Backend | Auth |
|-------|--------|---------|------|
| `/api/health` | GET | `backend-pool` | None |
| `/api/auth/*` | * | `backend-pool` | Rate limit |
| `/api/contracts/*` | * | `backend-pool` | JWT (Keycloak JWKS) |
| `/api/tdc/training/*` | * | `backend-pool` | JWT + role `TDC` |
| `/api/ccrp/training/*` | * | `backend-pool` | JWT + role `CCRP` |

**JWT validation policy (APIM):**

```xml
<validate-jwt header-name="Authorization" failed-validation-httpcode="401">
  <openid-config url="https://auth.{env}.example.com/realms/contract-management/.well-known/openid-configuration" />
  <audiences>
    <audience>contract-management-frontend</audience>
  </audiences>
</validate-jwt>
```

---

## 11. Front Door WAF rules

| Rule | Mode (dev) | Mode (prod) |
|------|------------|-------------|
| OWASP 3.2 Core Rule Set | Detection | Prevention |
| Bot protection | Off | On |
| Rate limit `/api/auth/login` | 100/min/IP | 20/min/IP |
| Block `/api/debug` | Log | Block |
| Geo filter | Off | Allow-list only |

---

## 12. Blob Storage containers

| Container | RG | Access |
|-----------|-----|--------|
| `tfstate` | shared | Private; terraform SP only |
| `can-{env}-datasets` | data | Private endpoint; AKS identity |
| `can-{env}-training-outputs` | data | Private endpoint; AKS identity |
| `can-{env}-artifacts` | data | Private endpoint; CMK in staging/prod |

---

## 13. Implementation checklist

- [ ] Management groups and resource groups created per §2
- [ ] Entra groups created per §1.1; IdP federation configured
- [ ] RBAC assignments applied per §3–§6
- [ ] Conditional Access policies for staging/prod per §7
- [ ] AKS namespaces and workload identity per §8
- [ ] App Gateway backends and probes per §9
- [ ] APIM routes and JWT policy per §10
- [ ] Front Door WAF attached per §11
- [ ] Blob containers with private endpoints per §12
- [ ] Diagnostic settings → Log Analytics for all edge resources

---

## 14. Terraform module mapping

| Module (planned) | Config section |
|------------------|----------------|
| `modules/policy` | §6 deny overlays, tagging |
| `modules/key_vault` | §5 data RBAC |
| `modules/front_door` | §11 WAF |
| `modules/apim` | §10 routes/JWT |

**Baseline today:** `deployment/azure/terraform/modules/` — networking, aks, database, load_balancer, container_registry, kubernetes_resources.

---

## 15. Related docs

- [Azure Security Architecture](../production/AZURE_SECURITY_ARCHITECTURE.md)
- [Azure Readiness](AZURE_READINESS.md)
- [deployment/azure/terraform/README.md](../../deployment/azure/terraform/README.md)
- [deploy/azure/deploy-azure.sh](../../deploy/azure/deploy-azure.sh)
