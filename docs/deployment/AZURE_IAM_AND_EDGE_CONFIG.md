# Azure IAM & Edge Configuration — Confidential AI Network

**Implementation reference** for Entra ID groups, RBAC assignments, Front Door, API Management, Application Gateway, WAF rules, and **application crypto API surfaces** (signing keys, DEK/MEK escrow, CCRP). Use alongside [Azure Security Architecture](../production/AZURE_SECURITY_ARCHITECTURE.md) (§16 E2E crypto flows) for design context, and [Azure Features & Configuration](AZURE_FEATURES_AND_CONFIGURATION.md) for the full env-var / settings catalog.

**Identity:** On Azure, **Microsoft Entra ID** is the only IdP (SSO + JWT + app roles). **Keycloak is local docker-compose / Playwright only** — do not provision Keycloak app registrations, namespaces, or hostnames in Azure.

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

### 1.3 App registrations (Entra ID)

| App | Type | Redirect URIs / notes |
|-----|------|------------------------|
| `can-{env}-frontend` | SPA (public, PKCE) | `https://app.{env}.example.com/*` — MSAL |
| `can-{env}-api` | API (expose scopes) | App roles: `TDC`, `TDP`, `CCRP`, `AppAdmin` |
| `can-{env}-backend` | Confidential (optional) | Client credentials for service-to-service |

**Do not create** a Keycloak broker app registration on Azure. Local Keycloak remains outside this catalog.

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
| `can-app` | `frontend-sa` | ConfigMap read (public config only) |
| `can-training` | `training-sa` | Job create in `can-training`; no ingress |
| `can-ingress` | `ingress-nginx-sa` | ClusterRole for ingress controller |

**Do not create** a `can-iam` / Keycloak namespace on Azure.

Workload Identity federation: `can-{env}-aks-identity` → Key Vault, Storage, ACR.

---

## 9. Application Gateway routing

| Path | Backend pool | Port |
|------|--------------|------|
| `/` | `frontend-pool` | 3000 |
| `/api/*` | `backend-pool` | 5001 |

Health probes: frontend `/`, backend `/api/health` (or `/health`). Login is **Entra-hosted** (login.microsoftonline.com) — not a path on App Gateway.

---

## 10. API Management routes

| Route | Method | Backend | Auth |
|-------|--------|---------|------|
| `/api/health` | GET | `backend-pool` | None |
| `/api/auth/*` | * | `backend-pool` | Rate limit (bootstrap / link APIs only) |
| `/api/contracts/*` | * | `backend-pool` | JWT (**Entra ID**) |
| `/api/signing/*` | * | `backend-pool` | JWT + authenticated party |
| `/api/can/jcs/*` | * | `backend-pool` | JWT + CAN principal claims |
| `/api/tdc/training/*` | * | `backend-pool` | JWT + app role `TDC` |
| `/api/tdc/inference/*` | * | `backend-pool` | JWT + app role `TDC` |
| `/api/ccrp/*` | * | `backend-pool` | JWT + app role `CCRP` |

**JWT validation policy (APIM) — Entra ID:**

```xml
<validate-jwt header-name="Authorization" failed-validation-httpcode="401">
  <openid-config url="https://login.microsoftonline.com/{tenant-id}/v2.0/.well-known/openid-configuration" />
  <audiences>
    <audience>api://can-{env}-api</audience>
  </audiences>
  <required-claims>
    <claim name="roles" match="any">
      <value>TDC</value>
      <value>TDP</value>
      <value>CCRP</value>
      <value>AppAdmin</value>
    </claim>
  </required-claims>
</validate-jwt>
```

Map Entra **app roles** (or group OIDs) to party types in the backend. Local Keycloak JWKS URLs must **not** appear in Azure APIM policies.

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
- [ ] Entra groups + **app roles** created per §1; SPA/API registrations (MSAL)
- [ ] RBAC assignments applied per §3–§6
- [ ] Conditional Access policies for staging/prod per §7
- [ ] AKS namespaces and workload identity per §8 (**no Keycloak namespace**)
- [ ] App Gateway backends and probes per §9 (frontend + API only)
- [ ] APIM routes and **Entra** JWT policy per §10
- [ ] Front Door WAF attached per §11
- [ ] Blob containers with private endpoints per §12
- [ ] Diagnostic settings → Log Analytics for all edge resources
- [ ] Confirm no Keycloak containers / `auth.*` hostnames in Azure

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

- [Azure Security Architecture](../production/AZURE_SECURITY_ARCHITECTURE.md) — §16 E2E crypto; Entra-only on Azure
- [Azure Readiness](AZURE_READINESS.md)
- [Participant onboarding & E2E lifecycle](../guides/PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md) — DEK/MEK / signing model
- [deployment/azure/terraform/README.md](../../deployment/azure/terraform/README.md)
- [deploy/azure/deploy-azure.sh](../../deploy/azure/deploy-azure.sh)
