# OCI IAM, Cloud Gate, API Gateway & WAF — Implementation Reference

**Companion to:** [OCI Security Architecture](../production/OCI_SECURITY_ARCHITECTURE.md)

This document is the **implementable inventory** of OCI identities, IAM policies, dynamic groups, Cloud Gate applications, API Gateway routes, and WAF policies for the Contract Management System. Use it for security review, Terraform/Resource Manager implementation, and pre-go-live checklists.

**Placeholders** (replace per tenancy):

| Placeholder | Example (prod) |
|-------------|----------------|
| `{tenancy}` | `cms` |
| `{env}` | `dev` \| `test` \| `staging` \| `prod` |
| `{region}` | `us-ashburn-1` |
| `app.{env}.example.com` | `app.cms.example.com` |
| `auth.{env}.example.com` | `auth.cms.example.com` |
| `api.{env}.example.com` | `api.cms.example.com` |
| `ops.{env}.example.com` | `ops.cms.example.com` |

**Application constants** (from codebase):

- Keycloak realm: `contract-management`
- App roles: `TDC`, `TDP`, `CCRP`, `AppAdmin`, `ADMIN`
- Backend port: `5001` · Frontend: `3000` · Keycloak: `8080`
- JWT issuer (prod): `https://auth.prod.example.com/realms/contract-management`
- JWKS URL: `https://auth.prod.example.com/realms/contract-management/protocol/openid-connect/certs`

---

## 1. Principal catalog

### 1.1 OCI IAM groups (human & automation)

| Group | Members | Purpose |
|-------|---------|---------|
| `cms-tenancy-admins` | 2–3 platform leads | Bootstrap compartments, initial policies (then remove broad access) |
| `cms-security-admins` | Security engineering | WAF, Cloud Guard, Security Zones, audit read |
| `cms-network-admins` | Network team | VCN, DRG, LB, NSGs, Bastion |
| `cms-platform-dev` | Developers | Full manage in `cms-dev` only |
| `cms-platform-ops` | SRE / platform | OKE, monitoring, Bastion in non-prod |
| `cms-release-managers` | Release engineering | Deploy to test/staging; read prod |
| `cms-prod-ops` | On-call SRE | Prod OKE deploy/restart; no DB DDL |
| `cms-db-admins` | DBA | ADB admin in data compartments |
| `cms-security-auditors` | GRC / audit | Read-only across tenancy |
| `cms-cicd-deployers` | CI/CD service users | OCIR push, OKE deploy in target env |
| `cms-break-glass-admins` | 2 executives + 1 security | Emergency prod access; MFA + ticket |
| `cms-readonly-viewers` | Support / PM | Read workloads in dev/test |

### 1.2 Dynamic groups

| Dynamic group | Matching rule | Used by |
|---------------|---------------|---------|
| `cms-{env}-oke-nodes` | `ALL {instance.compartment.id = '<cms-{env}-compute OCID>', instance.id = '*'}` | Node instance principal → Vault, Object Storage |
| `cms-{env}-oke-workloads` | `ALL {resource.type = 'cluster', resource.compartment.id = '<cms-{env}-compute OCID>'}` | Workload Identity for pods (External Secrets, training jobs) |
| `cms-cicd-runners` | `ALL {instance.compartment.id = '<cms-shared-services OCID>', tag.cms-role.value = 'cicd-runner'}` | Build pipelines pushing to OCIR |
| `cms-external-secrets-{env}` | Tag on OKE namespace SA or workload identity policy | External Secrets Operator → Vault |

### 1.3 Identity Domain groups (per environment)

Map corporate IdP groups → Identity Domain groups → Cloud Gate / optional Keycloak federation.

| Identity Domain group | Maps to app role | Cloud Gate apps |
|----------------------|------------------|-----------------|
| `cms-{env}-all-users` | — | Frontend SSO |
| `cms-{env}-tdc-users` | TDC | Frontend |
| `cms-{env}-tdp-users` | TDP | Frontend |
| `cms-{env}-ccrp-users` | CCRP | Frontend |
| `cms-{env}-app-admins` | AppAdmin | Frontend, Keycloak admin (staging/prod) |
| `cms-{env}-platform-admins` | — | Grafana, Bastion workflow approvers |
| `cms-{env}-break-glass` | — | All admin apps; step-up MFA |

### 1.4 Service accounts (Vault-stored API keys)

| Name | OCI user / auth | Rotation | Policies via group |
|------|-----------------|----------|-------------------|
| `svc-terraform` | API key + dynamic group | 90d | `cms-cicd-deployers` + `cms-terraform` dynamic group |
| `svc-cicd-github` | API key | 90d | `cms-cicd-deployers` |
| `svc-e2e-playwright` | Identity Domain app client | 90d | Test env only; scoped JWT |
| `svc-monitoring` | Instance principal or API key | 90d | Read metrics/alarms in ops compartments |
| `svc-break-glass` | Sealed API key in Vault | Per incident | `cms-break-glass-admins` |

### 1.5 Keycloak clients (application — not OCI IAM)

| Client ID | Type | Used by |
|-----------|------|---------|
| `contract-management-frontend` | Public (PKCE) | React SPA |
| `contract-management-client` | Confidential | Backend service account |
| `contract-management-api-gateway` | Bearer-only | API Gateway JWT validation audience (optional) |

Store `KEYCLOAK_CLIENT_SECRET` in Vault secret `cms-{env}-keycloak-client-secret`.

---

## 2. Compartment tree (reference)

```
Tenancy
├── cms-security-shared
├── cms-network-shared
├── cms-shared-services
├── cms-identity
├── cms-dev    { network, compute, data, ops }
├── cms-test   { network, compute, data, ops }
├── cms-staging{ network, compute, data, ops }
└── cms-prod   { network, compute, data, ops }
```

All policies below use **compartment names**. Attach policies at the **most specific** compartment that contains the resources.

---

## 3. IAM policies — tenancy root

```text
# --- Auditors ---
Allow group cms-security-auditors to read all-resources in tenancy
Allow group cms-security-auditors to read audit-events in tenancy
Allow group cms-security-auditors to read logs in tenancy

# --- Cloud Guard ---
Allow service cloudguard to read all-resources in tenancy
Allow service cloudguard to use network-security-groups in tenancy
Allow service cloudguard to read vaults in tenancy

# --- Vulnerability Scanning ---
Allow service vulnerability-scanning-service to read repos in tenancy
Allow service vulnerability-scanning-service to read instances in tenancy

# --- Break-glass (explicit deny overlay applied at prod data — see §3.7) ---
Allow group cms-break-glass-admins to manage all-resources in tenancy
  where all {
    request.permission != 'DATABASE_DELETE',
    request.permission != 'DELETE_BUCKET',
    target.compartment.name != 'cms-prod-data'
  }
```

---

## 4. IAM policies — cms-security-shared

```text
Allow group cms-security-admins to manage waf-family in compartment cms-security-shared
Allow group cms-security-admins to manage api-gateway-family in compartment cms-security-shared
Allow group cms-security-admins to manage cloud-guard-family in compartment cms-security-shared
Allow group cms-security-admins to manage security-zone-family in compartment cms-security-shared
Allow group cms-security-admins to manage certificates-family in compartment cms-security-shared
Allow group cms-security-admins to read logs in compartment cms-security-shared

Allow group cms-network-admins to read waf-family in compartment cms-security-shared
Allow group cms-network-admins to use waf-family in compartment cms-security-shared
Allow group cms-network-admins to read api-gateway-family in compartment cms-security-shared

# API Gateway service principal (edge invocation / logging)
Allow service apigateway to use virtual-network-family in compartment cms-security-shared
Allow service apigateway to read repos in compartment cms-shared-services
Allow service apigateway to read secret-bundles in compartment cms-security-shared
```

---

## 5. IAM policies — cms-network-shared

```text
Allow group cms-network-admins to manage virtual-network-family in compartment cms-network-shared
Allow group cms-network-admins to manage dns in compartment cms-network-shared
Allow group cms-network-admins to manage load-balancers in compartment cms-network-shared
Allow group cms-network-admins to manage bastion-family in compartment cms-network-shared
Allow group cms-network-admins to read all-resources in compartment cms-network-shared

Allow group cms-platform-ops to read virtual-network-family in compartment cms-network-shared
Allow group cms-platform-ops to use bastion-session in compartment cms-network-shared
```

---

## 6. IAM policies — cms-shared-services

```text
Allow group cms-cicd-deployers to manage repos in compartment cms-shared-services
Allow group cms-cicd-deployers to read repos in compartment cms-shared-services
Allow group cms-cicd-deployers to use repos in compartment cms-shared-services

Allow group cms-release-managers to read repos in compartment cms-shared-services
Allow group cms-platform-dev to read repos in compartment cms-shared-services

Allow group cms-cicd-deployers to manage object-family in compartment cms-shared-services
  where all { target.bucket.name = 'cms-terraform-state', any { request.permission = 'OBJECT_READ', request.permission = 'OBJECT_WRITE', request.permission = 'OBJECT_DELETE' } }

Allow dynamic-group cms-cicd-runners to manage repos in compartment cms-shared-services
Allow dynamic-group cms-cicd-runners to read secret-bundles in compartment cms-shared-services

# Logging / audit archive
Allow group cms-security-admins to manage log-groups in compartment cms-shared-services
Allow group cms-platform-ops to read log-groups in compartment cms-shared-services
```

---

## 7. IAM policies — per environment (`cms-{env}-*`)

Repeat for `dev`, `test`, `staging`, `prod`. **Tighten prod** using Deny statements in §7.4.

### 7.1 cms-{env}-network

```text
Allow group cms-network-admins to manage virtual-network-family in compartment cms-{env}-network
Allow group cms-network-admins to manage load-balancers in compartment cms-{env}-network
Allow group cms-platform-ops to read virtual-network-family in compartment cms-{env}-network
Allow group cms-platform-ops to use load-balancers in compartment cms-{env}-network

# WAF attachment to env LB
Allow group cms-security-admins to use waf-family in compartment cms-{env}-network
```

### 7.2 cms-{env}-compute

```text
# Developers — dev only
Allow group cms-platform-dev to manage cluster-family in compartment cms-dev-compute
Allow group cms-platform-dev to manage instance-family in compartment cms-dev-compute
Allow group cms-platform-dev to use virtual-network-family in compartment cms-dev-network

# Ops — non-prod
Allow group cms-platform-ops to manage cluster-family in compartment cms-test-compute
Allow group cms-platform-ops to manage cluster-family in compartment cms-staging-compute
Allow group cms-release-managers to use cluster-family in compartment cms-staging-compute

# Prod ops — no cluster delete
Allow group cms-prod-ops to use cluster-family in compartment cms-prod-compute
Allow group cms-prod-ops to manage cluster-family in compartment cms-prod-compute
Deny group cms-prod-ops to delete cluster-family in compartment cms-prod-compute

Allow group cms-cicd-deployers to use cluster-family in compartment cms-{env}-compute

# Bastion
Allow group cms-platform-ops to manage bastion-family in compartment cms-{env}-compute
Allow group cms-prod-ops to use bastion-session in compartment cms-prod-compute
```

### 7.3 cms-{env}-data

```text
Allow group cms-db-admins to manage autonomous-database-family in compartment cms-{env}-data
Allow group cms-db-admins to manage autonomous-backup-family in compartment cms-{env}-data

Allow group cms-prod-ops to read autonomous-database-family in compartment cms-prod-data
Allow group cms-prod-ops to use autonomous-database-family in compartment cms-prod-data
Deny group cms-prod-ops to manage autonomous-database-family in compartment cms-prod-data
  where request.permission != 'AUTONOMOUS_DATABASE_CONNECT'

Allow group cms-platform-dev to manage autonomous-database-family in compartment cms-dev-data
Allow group cms-platform-ops to read autonomous-database-family in compartment cms-test-data
Allow group cms-platform-ops to read autonomous-database-family in compartment cms-staging-data

# Vault & secrets
Allow group cms-db-admins to manage vaults in compartment cms-{env}-data
Allow group cms-db-admins to manage keys in compartment cms-{env}-data
Allow group cms-security-admins to read vaults in compartment cms-{env}-data
Allow group cms-prod-ops to read secret-bundles in compartment cms-prod-data

# Object Storage — datasets & training artifacts
Allow group cms-platform-dev to manage objects in compartment cms-dev-data
  where all { target.bucket.name = 'cms-dev-artifacts-*' }
Allow group cms-cicd-deployers to read objects in compartment cms-{env}-data
  where all { target.bucket.name = 'cms-{env}-artifacts-*' }

# Dynamic group — OKE nodes & workloads
Allow dynamic-group cms-{env}-oke-nodes to read secret-bundles in compartment cms-{env}-data
Allow dynamic-group cms-{env}-oke-nodes to use keys in compartment cms-{env}-data
Allow dynamic-group cms-{env}-oke-workloads to manage objects in compartment cms-{env}-data
  where all {
    target.bucket.name = 'cms-{env}-datasets-*',
    any { request.permission = 'OBJECT_READ', request.permission = 'OBJECT_WRITE', request.permission = 'OBJECT_INSPECT' }
  }
Allow dynamic-group cms-{env}-oke-workloads to manage objects in compartment cms-{env}-data
  where all {
    target.bucket.name = 'cms-{env}-training-outputs-*',
    any { request.permission = 'OBJECT_READ', request.permission = 'OBJECT_WRITE' }
  }
Allow dynamic-group cms-external-secrets-{env} to read secret-bundles in compartment cms-{env}-data
```

### 7.4 cms-{env}-ops

```text
Allow group cms-platform-ops to manage alarms in compartment cms-{env}-ops
Allow group cms-platform-ops to manage notifications in compartment cms-{env}-ops
Allow group cms-prod-ops to manage alarms in compartment cms-prod-ops
Allow group cms-security-auditors to read alarms in compartment cms-{env}-ops
```

### 7.5 Prod-only Deny policies (cms-prod)

```text
Deny group cms-platform-dev to any-resource in compartment cms-prod
Deny group cms-cicd-deployers to delete cluster-family in compartment cms-prod-compute
Deny any-user to manage object-family in compartment cms-prod-data
  where all { target.bucket.publicAccessType = 'ObjectRead', request.permission = 'OBJECT_CREATE' }
Deny any-user to manage public-ips in compartment cms-prod-compute
```

### 7.6 Tag-based authorization (optional cross-compartment)

```text
Allow group cms-cicd-deployers to read repos in tenancy
  where all { target.resource.tag.cms-environment.value = '{env}', target.resource.tag.cms-project.value = 'confidential-ai-network' }

Allow dynamic-group cms-{env}-oke-workloads to use keys in tenancy
  where all { target.resource.tag.cms-environment.value = '{env}', target.resource.tag.cms-data-classification.value != 'restricted' }
```

---

## 8. Kubernetes RBAC (OKE — complements OCI IAM)

| Namespace | ServiceAccount | ClusterRole / Role | Notes |
|-----------|----------------|-------------------|-------|
| `cms-ingress` | `ingress-nginx` | `ingress-nginx` chart defaults | LB → ingress only |
| `cms-app` | `backend-sa` | read secrets (ESO synced) | No cluster-admin |
| `cms-app` | `frontend-sa` | minimal | No API access |
| `cms-iam` | `keycloak-sa` | read secrets | DB creds from Vault |
| `cms-data` | `redis-sa` | minimal | Internal only |
| `cms-training` | `training-job-sa` | create Jobs, read ConfigMaps | Workload Identity → Object Storage |
| `cms-ops` | `prometheus-sa` | `prometheus-operator` defaults | Scrape internal targets |

**Bind OCI workload identity** (per env) so `cms-training` SA maps to `cms-{env}-oke-workloads` dynamic group.

---

## 9. Cloud Gate configuration

Cloud Gate protects **browser-facing** traffic. API Gateway handles **machine / SPA API** traffic.

### 9.1 DNS & upstream mapping

| Hostname | Cloud Gate app | Upstream (private LB backend set) | TLS |
|----------|----------------|-------------------------------------|-----|
| `app.{env}.example.com` | `cms-frontend-{env}` | OKE ingress → frontend:3000 | Terminated at WAF + CG |
| `auth.{env}.example.com` | `cms-keycloak-{env}` | OKE ingress → keycloak:8080 | Terminated at WAF + CG |
| `auth.{env}.example.com/admin/*` | `cms-keycloak-admin-{env}` | Same Keycloak upstream | MFA + IP allowlist |
| `ops.{env}.example.com` | `cms-grafana-{env}` | OKE ingress → grafana | Identity Domain `platform-admins` only |

**Do not** put `api.{env}.example.com` behind Cloud Gate — route it to **API Gateway** (§10).

### 9.2 Identity Domain integration (per env)

| Setting | dev | test | staging | prod |
|---------|-----|------|---------|------|
| Identity Domain | `cms-dev-id` | `cms-test-id` | `cms-staging-id` | `cms-prod-id` |
| Federation | Optional | Corporate IdP (SAML/OIDC) | Corporate IdP | Corporate IdP **required** |
| MFA | Off | Optional | Required admins | **Required all users** |
| Session idle timeout | 8h | 4h | 2h | **30 min** |
| Max session | 24h | 12h | 8h | **8h** |
| Step-up MFA | Off | Off | Admin paths | Admin + signing URLs |

### 9.3 Cloud Gate applications

#### App: `cms-frontend-{env}`

```yaml
name: cms-frontend-prod
type: OIDC
identity_domain: cms-prod-id
client_id: cloudgate-cms-frontend-prod          # provision in Identity Domain
redirect_uris:
  - https://app.prod.example.com/cloudgate/callback
post_logout_redirect_uris:
  - https://app.prod.example.com/
upstream_url: https://<private-lb-hostname>/     # or http://ingress-internal:443
cookie_domain: app.prod.example.com
session_timeout_minutes: 30
idle_timeout_minutes: 30
scopes: openid profile email
groups_allowed:
  - cms-prod-all-users
  - cms-prod-tdc-users
  - cms-prod-tdp-users
  - cms-prod-ccrp-users
  - cms-prod-app-admins
headers_to_upstream:
  - X-Forwarded-User
  - X-Forwarded-Groups
```

#### App: `cms-keycloak-{env}` (user realm paths)

```yaml
name: cms-keycloak-prod
type: OIDC
identity_domain: cms-prod-id
upstream_url: https://<private-lb-hostname>/realms/
paths:
  - /realms/contract-management/*
  - /resources/*
  - /js/*
groups_allowed:
  - cms-prod-all-users
```

#### App: `cms-keycloak-admin-{env}`

```yaml
name: cms-keycloak-admin-prod
type: OIDC
identity_domain: cms-prod-id
upstream_url: https://<private-lb-hostname>/admin/
paths:
  - /admin/*
groups_allowed:
  - cms-prod-app-admins
  - cms-prod-break-glass
ip_allowlist_cidrs:
  - 203.0.113.0/24          # corporate egress
  - 10.0.0.0/8              # VPN
require_mfa: true
step_up_auth: true
```

#### App: `cms-grafana-{env}`

```yaml
name: cms-grafana-prod
type: OIDC
identity_domain: cms-prod-id
upstream_url: https://<private-lb-hostname>/grafana/
groups_allowed:
  - cms-prod-platform-admins
require_mfa: true
```

### 9.4 Cloud Gate ↔ Keycloak broker (prod)

1. Corporate IdP → Identity Domain (SAML 2.0 or OIDC).
2. Cloud Gate → Identity Domain (OIDC) for browser SSO at `app.*`.
3. Keycloak **Identity Provider** brokering: trust Identity Domain OIDC for workforce users.
4. SPA still obtains API tokens via Keycloak client `contract-management-frontend` (authorization code + PKCE).
5. Map IdP groups → Keycloak realm roles (`TDC`, `TDP`, `CCRP`, `AppAdmin`) via Keycloak mappers.

### 9.5 Cloud Gate headers & CSP

Add response headers at ingress (Cloud Gate or nginx):

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.prod.example.com https://auth.prod.example.com; frame-ancestors 'none'
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

---

## 10. API Gateway configuration

One **API Gateway deployment** per environment in `cms-security-shared` or `cms-{env}-network`, subnet: **DMZ / edge private subnet**.

### 10.1 Gateway endpoints

| Setting | Value |
|---------|-------|
| Gateway name | `cms-api-gw-{env}` |
| Hostname | `api.{env}.example.com` |
| TLS certificate | OCI Certificates or imported cert for `api.{env}.example.com` |
| Access | Public via WAF only |
| Subnet | `cms-{env}-network` DMZ subnet (private) + public LB listener |

### 10.2 JWT authentication policy

```json
{
  "type": "JWT_AUTHENTICATION",
  "tokenHeader": "Authorization",
  "tokenPrefix": "Bearer ",
  "issuers": [
    "https://auth.{env}.example.com/realms/contract-management"
  ],
  "jwksUri": "https://auth.{env}.example.com/realms/contract-management/protocol/openid-connect/certs",
  "audiences": ["contract-management-frontend", "account"],
  "maxClockSkewInSeconds": 60,
  "isAnonymousAccessAllowed": false
}
```

**Role extraction** (for route-level authorization): map JWT claim `realm_access.roles` or custom `party_type` claim. API Gateway supports **scope/claim validation** per route; backend `requireRole()` remains authoritative — gateway is first line of defense.

### 10.3 CORS policy (gateway-level)

```json
{
  "allowedOrigins": ["https://app.{env}.example.com"],
  "allowedMethods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  "allowedHeaders": ["Authorization", "Content-Type", "X-Request-Id"],
  "exposedHeaders": ["X-Request-Id"],
  "maxAgeSeconds": 3600
}
```

### 10.4 Rate limiting (gateway-level defaults)

| Tier | Requests / minute | Burst | Applies to |
|------|-------------------|-------|------------|
| `anonymous` | 30 | 10 | `/api/health`, `/api/auth/register` |
| `authenticated` | 300 | 50 | Most `/api/*` |
| `sensitive` | 10 | 3 | Sign, training, CAN release |
| `admin` | 60 | 15 | `/api/admin/*`, `/api/constraints/*` |

### 10.5 Route table

Upstream base: `http://<private-lb-ip>:5001` or `https://backend.cms-{env}.internal:5001`

| Route | Methods | Auth | Rate tier | Required JWT role (claim) | Notes |
|-------|---------|------|-----------|---------------------------|-------|
| `/api/health` | GET | None | anonymous | — | Health probe |
| `/api/debug/env` | GET | JWT | admin | `AppAdmin` | **Disable in prod** or remove route |
| `/api/auth/register` | POST | None | anonymous | — | WAF stricter limit |
| `/api/auth/login` | POST | None | sensitive | — | 20/min/IP at WAF + gateway |
| `/api/auth/refresh` | POST | None | anonymous | — | |
| `/api/auth/logout` | POST | JWT | authenticated | — | |
| `/api/users/*` | * | JWT | authenticated | — | |
| `/api/contracts` | GET, POST | JWT | authenticated | `TDC` POST | |
| `/api/contracts/*/sign` | POST | JWT | sensitive | `TDP` or `CCRP` | |
| `/api/contracts/*` | GET, PUT, DELETE | JWT | authenticated | — | Backend enforces party |
| `/api/datasets/*` | * | JWT | authenticated | `TDP` write | Upload 25MB limit |
| `/api/ai-models/*` | * | JWT | authenticated | `TDC` write | |
| `/api/signing/*` | * | JWT | sensitive | `TDP`, `CCRP`, `TDC` | |
| `/api/tdc/training/*` | * | JWT | sensitive | `TDC` | |
| `/api/tdc/*` | * | JWT | authenticated | `TDC` | |
| `/api/tdp/*` | * | JWT | authenticated | `TDP` | |
| `/api/ccrp/*` | * | JWT | sensitive | `CCRP` | |
| `/api/can/jcs/*` | * | JWT | sensitive | `TDC`, `CCRP` | Optional mTLS for CCRP principal |
| `/api/can/ccr/*` | * | JWT | sensitive | `CCRP` | |
| `/api/can/provenance/*` | GET | JWT | authenticated | — | |
| `/api/scitt-ccf/*` | * | JWT | admin | `AppAdmin` | |
| `/api/platform-encryption/*` | * | JWT | sensitive | role-specific | |
| `/api/admin/*` | * | JWT | admin | `AppAdmin` | |
| `/api/constraints/*` | * | JWT | admin | `AppAdmin` | |
| `/api/infrastructure/*` | * | JWT | admin | `AppAdmin`, `CCRP` | |
| `/api/notifications/*` | * | JWT | authenticated | — | |
| `/api/contract-templates/*` | GET | JWT | authenticated | — | |
| `/api/did/*` | * | JWT / None | anonymous+auth | — | Public read routes limited |
| `/api/blockchain/status` | GET | None | anonymous | — | |

### 10.6 Sample API Gateway deployment spec (OpenAPI fragment)

```yaml
openapi: 3.0.0
info:
  title: CMS API Gateway - prod
  version: 1.0.0
servers:
  - url: https://api.prod.example.com
paths:
  /api/health:
    get:
      x-oci-apigateway-policy:
        authentication:
          type: ANONYMOUS
        rateLimiting:
          rateInRequestsPerSecond: 5
      x-oci-backend:
        type: HTTP_BACKEND
        url: http://10.40.10.10:5001/api/health
  /api/auth/login:
    post:
      x-oci-apigateway-policy:
        authentication:
          type: ANONYMOUS
        rateLimiting:
          rateInRequestsPerSecond: 1
      x-oci-backend:
        type: HTTP_BACKEND
        url: http://10.40.10.10:5001/api/auth/login
  /api/contracts/{contractId}/sign:
  post:
    parameters:
      - name: contractId
        in: path
        required: true
        schema:
          type: string
    x-oci-apigateway-policy:
      authentication:
        type: JWT_AUTHENTICATION
        jwtPolicy:
          issuers: ["https://auth.prod.example.com/realms/contract-management"]
          jwksUri: "https://auth.prod.example.com/realms/contract-management/protocol/openid-connect/certs"
      rateLimiting:
        rateInRequestsPerSecond: 1
    x-oci-backend:
      type: HTTP_BACKEND
      url: http://10.40.10.10:5001/api/contracts/{request.path[contractId]}/sign
```

### 10.7 Request validation

1. Export OpenAPI from backend (future) or maintain `docs/api/COMPLETE_API_SPECIFICATIONS.md` as source.
2. Attach **request validation policy** to routes with JSON body (`POST /api/contracts`, `/api/datasets`, `/api/can/*`).
3. Reject `Content-Type` other than `application/json` / `multipart/form-data` on upload routes.

### 10.8 Logging

| Log | Destination | Retention |
|-----|-------------|-----------|
| Access log | Logging service `cms-{env}-api-gw-access` | 90d (prod: 1y) |
| Execution log | Same log group | 30d |
| PII | Redact `Authorization`, `password`, `client_secret` fields | — |

---

## 11. WAF configuration

One **WAF policy** per environment, attached to the **public Load Balancer** fronting Cloud Gate + API Gateway.

### 11.1 Policy naming & attachment

| Env | Policy name | Attached to | Mode |
|-----|-------------|-------------|------|
| dev | `cms-waf-dev` | `cms-dev-public-lb` | **Detection** (log only) |
| test | `cms-waf-test` | `cms-test-public-lb` | Prevention |
| staging | `cms-waf-staging` | `cms-staging-public-lb` | Prevention |
| prod | `cms-waf-prod` | `cms-prod-public-lb` | Prevention |

### 11.2 Protected hostnames

| Hostname | Backend target |
|----------|----------------|
| `app.{env}.example.com` | Cloud Gate → frontend |
| `auth.{env}.example.com` | Cloud Gate → Keycloak |
| `api.{env}.example.com` | API Gateway |
| `ops.{env}.example.com` | Cloud Gate → Grafana |

### 11.3 Core rule sets

| Rule set | dev | test+ | Action |
|----------|-----|-------|--------|
| OWASP Core Rule Set 3.2 | Log | Block | SQLi, XSS, RFI, LFI |
| Protocol violations | Log | Block | Bad HTTP |
| Malicious IPs (OCI threat feed) | Off | On | Block known bad actors |
| Bot management | Off | Basic (staging), Advanced (prod) | Challenge / block scrapers |

### 11.4 Custom WAF rules

| Rule name | Condition | Action | Env |
|-----------|-----------|--------|-----|
| `rate-limit-login` | Path `/api/auth/login` AND method POST | Rate limit **20/min/IP** | all |
| `rate-limit-register` | Path `/api/auth/register` | Rate limit **5/min/IP** | all |
| `rate-limit-sign` | Path matches `/api/contracts/*/sign` | Rate limit **10/min/IP** | staging, prod |
| `rate-limit-can-release` | Path matches `/api/can/*/release*` | Rate limit **5/min/IP** | staging, prod |
| `block-admin-paths` | Path `/admin` AND NOT IP in allowlist | Block | prod |
| `geo-block` | Country NOT in allowlist | Block | prod (if compliance requires) |
| `limit-upload-size` | Path `/api/datasets` upload, body > 25MB | Block | all |
| `block-debug-prod` | Path `/api/debug` | Block | **prod only** |
| `require-json-api` | Path `/api/*`, missing Content-Type on POST | Block | test+ |

### 11.5 WAF environment profiles

| Control | dev | test | staging | prod |
|---------|-----|------|---------|------|
| OWASP CRS | Log | Block | Block | Block |
| Bot management | Off | Basic | Basic | Advanced |
| Rate limiting (global) | 1000/min/IP | 500/min/IP | 300/min/IP | 200/min/IP |
| Geo blocking | Off | Off | Optional | Per compliance |
| File upload max | 50 MB | 50 MB | 25 MB | 25 MB |
| Argument validation | Relaxed | Standard | Standard | Strict |

### 11.6 WAF ↔ API Gateway coordination

```
Internet
   │
   ▼
[ WAF Policy cms-waf-prod ]
   │
   ├── host api.prod.example.com ──► API Gateway cms-api-gw-prod ──► private LB ──► backend:5001
   │
   └── host app.prod.example.com ──► Cloud Gate ──► private LB ──► frontend:3000
       host auth.prod.example.com ──► Cloud Gate ──► private LB ──► keycloak:8080
```

- Terminate TLS at **WAF** (recommended) or LB — single cert per hostname.
- Pass `X-Forwarded-For`, `X-Forwarded-Proto` to origins.
- Enable **WAF logging** to `cms-{env}-waf-access` log group.

### 11.7 Sample Terraform resource names (for `modules/waf`)

```hcl
resource "oci_waf_web_app_firewall" "cms_waf_prod" {
  compartment_id = var.security_compartment_id
  display_name   = "cms-waf-prod"
  backend_type   = "LOAD_BALANCER"
  load_balancer_id = var.prod_public_lb_id
  web_app_firewall_policy_id = oci_waf_web_app_firewall_policy.cms_waf_policy_prod.id
}
```

---

## 12. Object Storage buckets (IAM-related)

| Bucket | Compartment | Access |
|--------|-------------|--------|
| `cms-{env}-datasets-{suffix}` | `cms-{env}-data` | TDP upload; training SA read |
| `cms-{env}-training-outputs-{suffix}` | `cms-{env}-data` | Training SA write; TDC read |
| `cms-{env}-artifacts-{suffix}` | `cms-{env}-data` | CI/CD, backend |
| `cms-terraform-state` | `cms-shared-services` | Terraform only |
| `cms-{env}-audit-archive` | `cms-{env}-ops` | Audit export |

All buckets: **private**, SSE-KMS with `cms-{env}-artifacts` Vault key, no pre-authenticated requests in staging/prod.

---

## 13. Implementation checklist

### IAM & identity

- [ ] Create compartment tree
- [ ] Create all groups (§1.1) and assign users via corporate IdP federation
- [ ] Create dynamic groups with matching rules (§1.2)
- [ ] Apply policies §3–§7 per compartment
- [ ] Provision Identity Domains per env; configure MFA
- [ ] Create Keycloak clients; store secrets in Vault
- [ ] Map IdP groups → Keycloak roles

### Edge

- [ ] Issue TLS certs for `app`, `auth`, `api`, `ops` hostnames
- [ ] Deploy WAF policies (§11); attach to public LB
- [ ] Deploy API Gateway with JWT policy (§10)
- [ ] Configure Cloud Gate apps (§9)
- [ ] Verify traffic flow: no direct public access to OKE workers

### Validation

- [ ] `curl https://api.{env}.example.com/api/health` returns 200
- [ ] Unauthenticated `POST /api/contracts/*/sign` → 401 at gateway
- [ ] Login rate limit triggers at 21st request/min from single IP
- [ ] `GET /api/debug/env` blocked at WAF in prod
- [ ] TDP user JWT can sign; TDC cannot sign as TDP
- [ ] Cloud Gate admin console requires MFA + allowlist
- [ ] OKE pod can read Vault secret via workload identity
- [ ] Cloud Guard reports no public buckets

---

## 14. Terraform module mapping (proposed)

| Module | Creates |
|--------|---------|
| `modules/compartments` | Compartment tree |
| `modules/iam` | Groups, dynamic groups, all policies in §3–§7 |
| `modules/waf` | WAF policies + LB attachment per §11 |
| `modules/api_gateway` | Gateway, deployment, routes per §10 |
| `modules/cloud_gate` | Documented as manual / OCI Console — no official TF resource at time of writing |
| `modules/identity` | Identity Domain apps (OCI SDK / `null_resource`) |
| `modules/vault` | Keys referenced in §7.3 |

---

## 15. Related documents

- [OCI Security Architecture](../production/OCI_SECURITY_ARCHITECTURE.md) — design rationale
- [OCI_READINESS.md](OCI_READINESS.md) — deployment readiness assessment
- [SECURITY_GUIDE.md](../production/SECURITY_GUIDE.md) — application-layer controls
- [deployment/oci/terraform/README.md](../../deployment/oci/terraform/README.md) — baseline IaC

---

**Document version:** 1.0  
**Last updated:** 2026-06-15  
**Owner:** Platform / Security Engineering  
**Status:** Implementation reference — apply per environment with change control
