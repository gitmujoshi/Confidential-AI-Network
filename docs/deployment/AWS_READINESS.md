# AWS deployment readiness

Assessment of whether the Confidential AI Network is ready to deploy to **Amazon Web Services** as of the current codebase.

---

## Summary

| Layer | Ready? | Notes |
|-------|--------|--------|
| **Architecture & security design** | Yes (doc) | [AWS_SECURITY_ARCHITECTURE.md](../production/AWS_SECURITY_ARCHITECTURE.md) |
| **Terraform / EKS scaffold** | No | No `deployment/aws/terraform/` yet — design only |
| **Core app on AWS (UI + API + Cognito + DB)** | No | App is Keycloak-centric; Cognito adapter not built |
| **SCITT CCF on AWS** | No | Local compose only |
| **Physical training on AWS** | Partial (stub) | `awsProvider.js` simulates environments; not real SDK provisioning |
| **CAN / CCRP on AWS** | Design | Nitro / enclave path documented, not wired |
| **One-click production** | No | Edge stack (CloudFront, API GW, WAF) design-only |

**Identity:** AWS environments use **Amazon Cognito** (or IAM Identity Center federation). **Keycloak** stays on local docker-compose for demos/E2E.

**Verdict:** Ready for **design reviews and backlog planning**. Not ready for an AWS infrastructure pilot until Terraform scaffold + Cognito auth land. Prefer Azure/OCI pilots if you need cloud infra sooner (those have Terraform scaffolds).

---

## What exists today

### Documentation

- [AWS Security Architecture](../production/AWS_SECURITY_ARCHITECTURE.md)
- [AWS Features & Configuration](AWS_FEATURES_AND_CONFIGURATION.md) — **feature catalog + env/settings**
- [AWS IAM & Edge Config](AWS_IAM_AND_EDGE_CONFIG.md)
- [config/examples/config.aws.env.example](../../config/examples/config.aws.env.example)

### Application code

| Component | Path | Maturity |
|-----------|------|----------|
| Training provider | `backend/services/providers/awsProvider.js` | Stub / simulated |
| Secrets | `backend/services/secretManager.js` (`AWS_SECRETS`) | Hook present |
| TEE / Nitro hints | `teeProvisioningService.js`, `teeAttestationService.js` | Partial enums |

---

## Gaps for AWS production

1. **No platform Terraform** — VPC, EKS, RDS, ECR, ALB, Cognito, KMS must be created  
2. **Auth** — Cognito MSAL-equivalent SPA + backend JWT validation  
3. **Storage** — S3 backend for datasets (today: local disk)  
4. **Training** — Replace stub provider with EKS Job / ECS / real AWS SDK  
5. **Signing / KMS** — Keys still in DB; no crypto verify on portal sign  
6. **SCITT** — No AWS deployment model  
7. **E2E** — Tests target localhost only  

---

## Recommended AWS rollout phases

### Phase 1 — Platform pilot

- [ ] Create `deployment/aws/terraform/` (VPC, EKS, RDS PostgreSQL, ECR, ALB)
- [ ] Cognito user pool + app client; SPA + API JWT
- [ ] Map Cognito groups → party types
- [ ] Smoke: login, contract create, sign

### Phase 2 — Security hardening

- [ ] CloudFront + AWS WAF
- [ ] API Gateway JWT authorizer
- [ ] Private EKS; Secrets Manager + External Secrets
- [ ] KMS CMK for RDS/S3

### Phase 3 — Training & CAN

- [ ] S3 dataset path
- [ ] EKS Job training; real `awsProvider`
- [ ] Nitro / attestation spike for CAN
- [ ] SCITT on EKS evaluation

### Phase 4 — Production cutover

- [ ] Multi-AZ RDS + DR
- [ ] Pen test; E2E against staging Cognito users

---

## Related

- [AWS Features & Configuration](AWS_FEATURES_AND_CONFIGURATION.md)
- [Azure Readiness](AZURE_READINESS.md) · [OCI Readiness](OCI_READINESS.md) · [GCP Readiness](GCP_READINESS.md)
- [docs/deployment/README.md](README.md)
