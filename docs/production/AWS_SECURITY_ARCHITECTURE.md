# AWS Security Architecture — Confidential AI Network

Recommended **Amazon Web Services** security architecture for deploying the Confidential AI Network across **dev, test, staging, and production**. Aligns with the AWS Well-Architected Security Pillar and Zero Trust.

**Identity split:**

| Environment | Identity provider | Notes |
|-------------|-------------------|-------|
| **AWS** (dev → prod) | **Amazon Cognito** (+ optional IAM Identity Center federation) | Groups → TDC·TDP·CCRP·AppAdmin; API Gateway validates JWTs |
| **Local laptop / docker-compose** | **Keycloak** | E2E/demos only — **do not deploy Keycloak as AWS production IdP** |

### Document set

| Document | Role |
|----------|------|
| **This doc** | Topology, phased setup, crypto/key flows |
| [AWS Features & Configuration](../deployment/AWS_FEATURES_AND_CONFIGURATION.md) | **Feature catalog + env vars / profiles** |
| [AWS IAM & Edge Config](../deployment/AWS_IAM_AND_EDGE_CONFIG.md) | Cognito, IAM/IRSA, CloudFront, API GW, WAF |
| [AWS Readiness](../deployment/AWS_READINESS.md) | Gap analysis |
| [config.aws.env.example](../../config/examples/config.aws.env.example) | Env template |

**Related:** [PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md](../guides/PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md) · [Azure Security Architecture](AZURE_SECURITY_ARCHITECTURE.md) (parallel)

---

## 1. Target topology

```
Internet → CloudFront + WAF
              ├─ app.{env} → ALB → EKS frontend
              └─ api.{env} → API Gateway (Cognito JWT) → ALB → EKS backend
EKS → RDS PostgreSQL (private) · ElastiCache Redis · S3 (CMK)
    → Secrets Manager · KMS
CCRP / training → EKS Jobs or Nitro Enclaves (phase 3+)
```

**Account layout (recommended):** shared services + per-env accounts (`can-dev`, `can-staging`, `can-prod`) under AWS Organizations; SCPs for prod deny public S3 / disable root keys.

---

## 2. Step-by-step setup (new environment)

**Effort:** design + first Terraform scaffold ~2–4 weeks; full edge + Cognito + training parity longer.

### Phase 0 — Prerequisites

| Item | Action |
|------|--------|
| AWS Organization / account | Dev account first |
| Region | e.g. `us-east-1`; plan DR region for prod |
| Tools | Terraform ≥ 1.0, AWS CLI, kubectl, Docker |
| DNS | `app`, `api`, `ops` under customer domain |
| Quotas | EKS, Elastic IPs, NAT as needed |

### Phase 1 — Network & data plane

1. VPC (public/private/data subnets), NAT, VPC endpoints (S3, Secrets, KMS, ECR).  
2. RDS PostgreSQL private; Secrets Manager connection string.  
3. S3 buckets (datasets, outputs, artifacts) + Block Public Access + SSE-KMS.  
4. KMS CMK `alias/can-{env}`.

### Phase 2 — EKS & apps

1. EKS + managed node group (private).  
2. ECR images for backend/frontend/trainer.  
3. IRSA for backend/trainer SAs.  
4. Deploy API + UI; run migrations.  
5. External Secrets → Secrets Manager.

### Phase 3 — Identity & edge

1. Cognito user pool + groups; SPA client (PKCE).  
2. Backend JWT validation (`AUTH_PROVIDER=cognito`).  
3. API Gateway JWT authorizer; CloudFront + WAF.  
4. MFA / Conditional access via Cognito or federated IdP.

### Phase 4 — Training & CAN

1. `TRAINING_EXECUTION_MODE=aws`; EKS Jobs.  
2. Signing keys → KMS/CloudHSM; crypto verify on sign.  
3. Nitro / attested DEK·MEK release for CAN claims.  
4. Optional SCITT on EKS.

---

## 3. E2E crypto & key flows (AWS)

| Asset | Owner | Storage | Notes |
|-------|-------|---------|-------|
| Platform secrets | Ops | Secrets Manager + KMS | DB, Redis, Cognito confidential |
| Signing keys | User / platform | Target: KMS asymmetric / CloudHSM | Today: DB (`SIGNING_KEY_BACKEND=database`) |
| DEK | TDP / data principal | Never long-lived on API | CAN: attested release into enclave |
| MEK | TDC / model owner | Same | Dual-key escrow |
| Dataset/model ciphertext | Parties | S3 SSE-KMS | Plaintext only inside CCR |

**Maturity matrix**

| Capability | Local today | AWS pilot | AWS CAN prod |
|------------|-------------|-----------|--------------|
| Login IdP | Keycloak | Cognito | Cognito |
| Crypto verify on sign | No | Optional | Required |
| Signing in HSM/KMS | No | Design | Required |
| DEK/MEK principal custody | Partial | Design | Required |
| Attested key delivery | Simulated | Design | Nitro / attested TLS |
| Training | local-docker | EKS Job spike | Enclave / isolated compute |
| Keycloak on AWS | N/A | **Do not** (prod IdP) | **Do not** |

---

## 4. Pre-go-live checklist (prod)

- [ ] Org SCPs + prod deny public buckets  
- [ ] Cognito MFA; no Keycloak as prod IdP  
- [ ] CloudFront WAF Prevention; API GW JWT on  
- [ ] Private EKS; RDS private only; multi-AZ  
- [ ] KMS CMK; no secrets in Terraform state plaintext  
- [ ] S3 private + TLS-only policies  
- [ ] Crypto checklist: signing verify, no DEK/MEK on Node APIs, attestation for CAN  
- [ ] E2E smoke against staging Cognito users  

---

## 5. IaC alignment

**Current state:** No `deployment/aws/terraform/` in-repo. Provider stub: `backend/services/providers/awsProvider.js`.

| Planned module | Purpose |
|----------------|---------|
| `networking` | VPC, subnets, endpoints |
| `eks` | Cluster + node groups |
| `database` | RDS PostgreSQL |
| `ecr` | Container registry |
| `edge` | CloudFront, WAF, API Gateway |
| `kms_secrets` | CMK + Secrets Manager |
| `cognito` | User pool + clients |

Env vars: [AWS_FEATURES_AND_CONFIGURATION.md](../deployment/AWS_FEATURES_AND_CONFIGURATION.md).

---

## 6. Reference URLs

- [AWS Well-Architected — Security](https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/welcome.html)
- [Amazon Cognito](https://docs.aws.amazon.com/cognito/)
- [Amazon EKS](https://docs.aws.amazon.com/eks/)
- [AWS WAF](https://docs.aws.amazon.com/waf/)
- [API Gateway JWT authorizers](https://docs.aws.amazon.com/apigateway/)
- [AWS KMS](https://docs.aws.amazon.com/kms/)
- [Nitro Enclaves](https://docs.aws.amazon.com/enclaves/)
