# GCP Security Architecture — Confidential AI Network

Recommended **Google Cloud** security architecture for deploying the Confidential AI Network across **dev, test, staging, and production**. Aligns with Google Cloud security best practices and Zero Trust.

**Identity split:**

| Environment | Identity provider | Notes |
|-------------|-------------------|-------|
| **GCP** (dev → prod) | **Identity Platform / Cloud Identity** | Custom claims/groups → TDC·TDP·CCRP·AppAdmin; API validates OIDC JWTs |
| **Local laptop / docker-compose** | **Keycloak** | E2E/demos only — **do not deploy Keycloak as GCP production IdP** |

### Document set

| Document | Role |
|----------|------|
| **This doc** | Topology, phased setup, crypto/key flows |
| [GCP Features & Configuration](../deployment/GCP_FEATURES_AND_CONFIGURATION.md) | **Feature catalog + env vars / profiles** |
| [GCP IAM & Edge Config](../deployment/GCP_IAM_AND_EDGE_CONFIG.md) | IAM, Identity Platform, Armor, API GW, IAP |
| [GCP Readiness](../deployment/GCP_READINESS.md) | Gap analysis |
| [config.gcp.env.example](../../config/examples/config.gcp.env.example) | Env template |

**Related:** [Multi-cloud security architecture patterns](MULTI_CLOUD_SECURITY_ARCHITECTURE_PATTERNS.md) · [PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md](../guides/PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md) · [Azure Security Architecture](AZURE_SECURITY_ARCHITECTURE.md) (parallel)

---

## 1. Target topology

```
Internet → Cloud CDN + Cloud Armor (HTTPS LB)
              ├─ app.{env} → GKE frontend
              └─ api.{env} → API Gateway (OIDC JWT) → GKE backend
GKE → Cloud SQL PostgreSQL (private) · Memorystore Redis · GCS (CMEK)
    → Secret Manager · Cloud KMS
CCRP / training → GKE Jobs or Confidential Space (phase 3+)
```

**Project layout (recommended):** folder per env under an org; shared services project for Artifact Registry / Terraform state; VPC Service Controls for staging/prod.

---

## 2. Step-by-step setup (new environment)

**Effort:** design + first Terraform scaffold ~2–4 weeks; full edge + Identity Platform + training parity longer.

### Phase 0 — Prerequisites

| Item | Action |
|------|--------|
| GCP org / folder / project | Dev project first |
| Region | e.g. `us-central1`; plan DR for prod |
| Tools | Terraform ≥ 1.0, gcloud, kubectl, Docker |
| DNS | `app`, `api`, `ops` |
| APIs | Enable GKE, Cloud SQL, KMS, Secret Manager, Artifact Registry, IAP as needed |

### Phase 1 — Network & data plane

1. VPC + private subnets + Cloud NAT; Private Google Access.  
2. Cloud SQL PostgreSQL private IP; secret for connection.  
3. GCS buckets + public access prevention + CMEK.  
4. Cloud KMS key ring `can-{env}`.

### Phase 2 — GKE & apps

1. GKE (private control plane in prod).  
2. Artifact Registry images.  
3. Workload Identity for backend/trainer.  
4. Deploy API + UI; migrations.  
5. External Secrets → Secret Manager.

### Phase 3 — Identity & edge

1. Identity Platform; SPA OAuth; role claims.  
2. Backend JWT validation (`AUTH_PROVIDER=gcp-identity`).  
3. HTTPS LB + Cloud Armor + CDN; API Gateway JWT.  
4. Optional IAP for `ops.{env}`.

### Phase 4 — Training & CAN

1. `TRAINING_EXECUTION_MODE=gcp`; GKE Jobs.  
2. Signing keys → Cloud KMS; crypto verify on sign.  
3. Confidential Space / attested DEK·MEK for CAN.  
4. Optional SCITT on GKE.

---

## 3. E2E crypto & key flows (GCP)

| Asset | Owner | Storage | Notes |
|-------|-------|---------|-------|
| Platform secrets | Ops | Secret Manager + KMS | DB, Redis |
| Signing keys | User / platform | Target: Cloud KMS (HSM) | Today: DB |
| DEK | TDP / data principal | Not on API long-term | Attested release into CCR |
| MEK | TDC / model owner | Same | Dual-key escrow |
| Dataset/model ciphertext | Parties | GCS CMEK | Plaintext only inside CCR |

**Maturity matrix**

| Capability | Local today | GCP pilot | GCP CAN prod |
|------------|-------------|-----------|--------------|
| Login IdP | Keycloak | Identity Platform | Identity Platform |
| Crypto verify on sign | No | Optional | Required |
| Signing in KMS/HSM | No | Design | Required |
| DEK/MEK principal custody | Partial | Design | Required |
| Attested key delivery | Simulated | Design | Confidential Space |
| Training | local-docker | GKE Job spike | Confidential compute |
| Keycloak on GCP | N/A | **Do not** (prod IdP) | **Do not** |

---

## 4. Pre-go-live checklist (prod)

- [ ] Org policies: public access prevention, disable SA key creation where possible  
- [ ] Identity Platform MFA; no Keycloak as prod IdP  
- [ ] Cloud Armor deny mode; API JWT on  
- [ ] Private GKE; Cloud SQL private; HA  
- [ ] CMEK; no secrets in Terraform state plaintext  
- [ ] GCS private only  
- [ ] Crypto checklist: signing verify, no DEK/MEK on Node APIs, attestation for CAN  
- [ ] E2E smoke against staging Identity Platform users  

---

## 5. IaC alignment

**Current state:** No `deployment/gcp/terraform/` in-repo. Provider stub: `backend/services/providers/gcpProvider.js`.

| Planned module | Purpose |
|----------------|---------|
| `networking` | VPC, subnets, NAT |
| `gke` | Cluster + node pools |
| `database` | Cloud SQL PostgreSQL |
| `artifact_registry` | Container images |
| `edge` | HTTPS LB, Armor, CDN, API Gateway |
| `kms_secrets` | KMS + Secret Manager |
| `identity` | Identity Platform config |

Env vars: [GCP_FEATURES_AND_CONFIGURATION.md](../deployment/GCP_FEATURES_AND_CONFIGURATION.md).

---

## 6. Reference URLs

- [Google Cloud security best practices](https://cloud.google.com/security/best-practices)
- [Identity Platform](https://cloud.google.com/identity-platform)
- [Google Kubernetes Engine](https://cloud.google.com/kubernetes-engine)
- [Cloud Armor](https://cloud.google.com/armor)
- [Cloud KMS](https://cloud.google.com/kms)
- [Confidential Space](https://cloud.google.com/confidential-computing/confidential-space/docs/confidential-space-overview)
- [Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation)
