# GCP IAM & Edge Configuration — Confidential AI Network

**Implementation reference** for IAM, Identity Platform, Cloud Armor, API Gateway / IAP, HTTPS LB, and **application crypto API surfaces**. Use with [GCP Security Architecture](../production/GCP_SECURITY_ARCHITECTURE.md) and [GCP Features & Configuration](GCP_FEATURES_AND_CONFIGURATION.md).

**Identity:** On GCP, **Identity Platform / Cloud Identity** is the cloud IdP. **Keycloak is local docker-compose / Playwright only.**

---

## 1. Principal catalog

### 1.1 Role claims / groups (per environment)

| Claim / group | Purpose |
|---------------|---------|
| `TDC` / `can-{env}-tdc` | Training Data Consumers |
| `TDP` / `can-{env}-tdp` | Training Data Providers |
| `CCRP` / `can-{env}-ccrp` | Confidential Clean Room Providers |
| `AppAdmin` / `can-{env}-app-admins` | Application administrators |
| `can-{env}-platform-ops` | SRE |
| `can-{env}-security-auditors` | Read-only audit |

### 1.2 Service accounts & Workload Identity

| Identity | Scope | Permissions |
|----------|-------|-------------|
| `can-{env}-backend@…` | Backend pods (WI) | GCS R/W; Secret Manager accessor; Cloud KMS crypto |
| `can-{env}-trainer@…` | Training jobs | GCS datasets/outputs; Artifact Registry reader |
| `can-{env}-cicd@…` | CI WIF | Artifact Registry writer; GKE deploy (dev) |
| `can-{env}-terraform@…` | Pipeline | Scoped project apply |

Prefer **Workload Identity Federation** — avoid long-lived JSON keys in pods/CI.

### 1.3 Identity Platform apps

| App | Type | Notes |
|-----|------|-------|
| `can-{env}-frontend` | SPA | OAuth redirect URIs |
| API resource | OIDC audience = project / custom | Backend JWKS validation |

---

## 2. Edge topology

```
Internet
  → Cloud CDN + Cloud Armor (HTTPS LB)
      → app.{env} → GKE frontend Service
      → api.{env} → API Gateway (OIDC JWT) → GKE backend
  → (optional) IAP on ops.{env}
```

| Host | Service | Auth |
|------|---------|------|
| `app.{env}.example.com` | Frontend | Identity Platform login |
| `api.{env}.example.com` | Backend API | JWT validation |
| `ops.{env}.example.com` | Admin UI | IAP + MFA recommended |

---

## 3. JWT validation (Identity Platform)

Validate:

- Issuer: `https://securetoken.google.com/{projectId}` (or custom OIDC)
- Audience: project id / configured client
- Custom claims `roles` (or Groups) → backend `partyType`

Public exceptions: `/api/health` only (document others).

---

## 4. Cloud Armor

| Policy | Mode (prod) |
|--------|-------------|
| OWASP / preconfigured WAF | Deny |
| Rate limiting (login / API) | Throttle / deny |
| Geo / IP allowlists (ops) | As required |

---

## 5. Cloud KMS & Secret Manager

| Resource | Use |
|----------|-----|
| Key ring `can-{env}` | Platform CMEK |
| Asymmetric sign key | Signing keys (target) |
| Secrets `can-{env}-*` | DB, Redis, confidential client material |

DEK/MEK remain principal-owned for CAN — not long-term platform Secret Manager material.

---

## 6. GCS buckets & IAM

| Bucket | Access |
|--------|--------|
| `can-{env}-datasets` | Backend + trainer SA; uniform bucket-level access; no public |
| `can-{env}-training-outputs` | Same |
| `can-{env}-artifacts` | Same; CMEK staging+ |

Enforce `constraints/storage.publicAccessPrevention`.

---

## 7. Application crypto APIs (shared)

| Area | Routes / services |
|------|-------------------|
| Signing keys | `/api/signing/keys/*` |
| Contract sign | `/api/contracts/:id/sign` |
| CAN escrow | `/api/can/jcs/*` |
| Platform encrypt (demo) | Prefer disabled on GCP CAN prod |

Settings: [GCP_FEATURES_AND_CONFIGURATION.md](GCP_FEATURES_AND_CONFIGURATION.md) §§3.4–3.6.

---

## 8. Related

- [GCP Features & Configuration](GCP_FEATURES_AND_CONFIGURATION.md)
- [GCP Readiness](GCP_READINESS.md)
- [GCP Security Architecture](../production/GCP_SECURITY_ARCHITECTURE.md)
