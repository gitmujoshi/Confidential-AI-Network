# GCP deployment readiness

Assessment of whether the Confidential AI Network is ready to deploy to **Google Cloud** as of the current codebase.

---

## Summary

| Layer | Ready? | Notes |
|-------|--------|--------|
| **Architecture & security design** | Yes (doc) | [GCP_SECURITY_ARCHITECTURE.md](../production/GCP_SECURITY_ARCHITECTURE.md) |
| **Terraform / GKE scaffold** | No | No `deployment/gcp/terraform/` yet — design only |
| **Core app on GCP (UI + API + Identity Platform + DB)** | No | App is Keycloak-centric; Identity Platform adapter not built |
| **SCITT CCF on GCP** | No | Local compose only |
| **Physical training on GCP** | Partial (stub) | `gcpProvider.js` simulates environments |
| **CAN / CCRP on GCP** | Design | Confidential Space path documented, not wired |
| **One-click production** | No | Cloud Armor / API Gateway / CDN design-only |

**Identity:** GCP environments use **Identity Platform / Cloud Identity**. **Keycloak** stays on local docker-compose for demos/E2E.

**Verdict:** Ready for **design reviews and backlog planning**. Not ready for a GCP infrastructure pilot until Terraform scaffold + Identity Platform auth land. Prefer Azure/OCI pilots for nearer-term cloud infra.

---

## What exists today

### Documentation

- [GCP Security Architecture](../production/GCP_SECURITY_ARCHITECTURE.md)
- [GCP Features & Configuration](GCP_FEATURES_AND_CONFIGURATION.md) — **feature catalog + env/settings**
- [GCP IAM & Edge Config](GCP_IAM_AND_EDGE_CONFIG.md)
- [config/examples/config.gcp.env.example](../../config/examples/config.gcp.env.example)

### Application code

| Component | Path | Maturity |
|-----------|------|----------|
| Training provider | `backend/services/providers/gcpProvider.js` | Stub / simulated |
| Secrets | `backend/services/secretManager.js` (`GCP_SECRETS`) | Hook present |
| TEE hints | `teeProvisioningService.js` (`GCP_PROJECT_ID`) | Partial |

---

## Gaps for GCP production

1. **No platform Terraform** — VPC, GKE, Cloud SQL, Artifact Registry, LB  
2. **Auth** — Identity Platform SPA + backend JWT validation  
3. **Storage** — GCS backend for datasets  
4. **Training** — Replace stub provider with GKE Job / Batch / real GCP SDK  
5. **Signing / KMS** — Keys in DB; no crypto verify on portal sign  
6. **SCITT** — No GCP deployment model  
7. **E2E** — Tests target localhost only  

---

## Recommended GCP rollout phases

### Phase 1 — Platform pilot

- [ ] Create `deployment/gcp/terraform/` (VPC, GKE, Cloud SQL PostgreSQL, Artifact Registry, HTTPS LB)
- [ ] Identity Platform; SPA + API JWT; role claims
- [ ] Smoke: login, contract create, sign

### Phase 2 — Security hardening

- [ ] Cloud Armor + Cloud CDN
- [ ] API Gateway JWT / IAP for ops
- [ ] Private GKE; Secret Manager + External Secrets
- [ ] CMEK for Cloud SQL / GCS

### Phase 3 — Training & CAN

- [ ] GCS dataset path
- [ ] GKE Job training; real `gcpProvider`
- [ ] Confidential Space spike for CAN
- [ ] SCITT on GKE evaluation

### Phase 4 — Production cutover

- [ ] HA Cloud SQL + DR
- [ ] Pen test; E2E against staging Identity Platform users

---

## Related

- [GCP Features & Configuration](GCP_FEATURES_AND_CONFIGURATION.md)
- [Azure Readiness](AZURE_READINESS.md) · [OCI Readiness](OCI_READINESS.md) · [AWS Readiness](AWS_READINESS.md)
- [docs/deployment/README.md](README.md)
