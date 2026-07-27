# AWS IAM & Edge Configuration — Confidential AI Network

**Implementation reference** for IAM roles/policies, Cognito, CloudFront, API Gateway, ALB, WAF, and **application crypto API surfaces**. Use with [AWS Security Architecture](../production/AWS_SECURITY_ARCHITECTURE.md) and [AWS Features & Configuration](AWS_FEATURES_AND_CONFIGURATION.md).

**Identity:** On AWS, **Amazon Cognito** (or IAM Identity Center → Cognito/OIDC) is the cloud IdP. **Keycloak is local docker-compose / Playwright only.**

---

## 1. Principal catalog

### 1.1 Cognito groups (per environment)

| Group | Purpose |
|-------|---------|
| `can-{env}-tdc` | Training Data Consumers |
| `can-{env}-tdp` | Training Data Providers |
| `can-{env}-ccrp` | Confidential Clean Room Providers |
| `can-{env}-app-admins` | Application administrators |
| `can-{env}-platform-ops` | SRE (ops console) |
| `can-{env}-security-auditors` | Read-only audit |

### 1.2 IAM roles & IRSA

| Identity | Scope | Permissions |
|----------|-------|-------------|
| `can-{env}-eks-node` | Node instance profile | ECR pull, basic CNI |
| `can-{env}-backend-sa` (IRSA) | Backend pods | S3 R/W buckets; Secrets Manager read; KMS decrypt/sign as needed |
| `can-{env}-trainer-sa` (IRSA) | Training jobs | S3 datasets/outputs; ECR pull |
| `can-{env}-cicd` | CI OIDC | ECR push; deploy to EKS (dev) |
| `can-{env}-terraform` | Pipeline | Scoped account/VPC apply |

### 1.3 Cognito app clients

| App | Type | Notes |
|-----|------|-------|
| `can-{env}-frontend` | Public SPA + PKCE | Hosted UI / federated IdP |
| `can-{env}-api` | Resource server | Scopes; JWT audience for API GW |

---

## 2. Edge topology

```
Internet
  → CloudFront (+ AWS WAF)
      → app.{env} → ALB → frontend Service
      → api.{env} → API Gateway (Cognito JWT) → ALB → backend Service
  → (optional) auth.{env} → Cognito Hosted UI
```

| Host | Service | Auth |
|------|---------|------|
| `app.{env}.example.com` | Frontend | Cognito login redirect |
| `api.{env}.example.com` | Backend API | API Gateway JWT authorizer |
| `ops.{env}.example.com` | Admin UI | Cognito + MFA; tighter WAF |

---

## 3. API Gateway JWT (Cognito)

Validate:

- Issuer: `https://cognito-idp.{region}.amazonaws.com/{userPoolId}`
- Audience: SPA / API client id
- Map `cognito:groups` → backend `partyType`

Deny anonymous except documented public routes (`/api/health`, JWKS-free health).

---

## 4. WAF (AWS WAF on CloudFront)

| Rule set | Mode (prod) |
|----------|-------------|
| AWS Managed Common Rule Set | Block |
| Known Bad Inputs | Block |
| Rate-based (login / API) | Block after threshold |
| Geo / IP allowlists (ops) | As required |

---

## 5. KMS & Secrets

| Resource | Use |
|----------|-----|
| `alias/can-{env}` | Platform CMK (RDS, S3 SSE-KMS, Secrets) |
| Asymmetric KMS / CloudHSM | Signing keys (target) |
| Secrets Manager `can/{env}/*` | DB, Redis, Cognito confidential secrets |

Never store DEK/MEK plaintext in Secrets Manager as the long-term principal model — see CAN docs.

---

## 6. S3 buckets & policies

| Bucket | Access |
|--------|--------|
| `can-{env}-datasets` | Backend + trainer IRSA; no public |
| `can-{env}-training-outputs` | Same |
| `can-{env}-artifacts` | Same; CMEK required staging+ |

Block Public Access on; TLS-only bucket policy.

---

## 7. Application crypto APIs (shared)

Same surfaces as Azure/OCI:

| Area | Routes / services |
|------|-------------------|
| Signing keys | `/api/signing/keys/*` |
| Contract sign | `/api/contracts/:id/sign` |
| CAN escrow | `/api/can/jcs/*` |
| Platform encrypt (demo) | Prefer disabled on AWS CAN prod |

Settings: [AWS_FEATURES_AND_CONFIGURATION.md](AWS_FEATURES_AND_CONFIGURATION.md) §§3.4–3.6.

---

## 8. Related

- [AWS Features & Configuration](AWS_FEATURES_AND_CONFIGURATION.md)
- [AWS Readiness](AWS_READINESS.md)
- [AWS Security Architecture](../production/AWS_SECURITY_ARCHITECTURE.md)
