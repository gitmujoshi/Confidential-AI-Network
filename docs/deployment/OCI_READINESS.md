# OCI deployment readiness

Assessment of whether the Contract Management System is ready to deploy to **Oracle Cloud Infrastructure** as of the current codebase.

**Design & code scaffolds:** complete — see [OCI_DESIGN_COMPLETE.md](OCI_DESIGN_COMPLETE.md).  
**Live tenancy apply / soak:** not required for architecture sign-off; still needed for production cutover.

---

## Summary

| Layer | Design / code | Live tenancy |
|-------|---------------|--------------|
| **Architecture & security design** | Complete | — |
| **Terraform / OKE + PostgreSQL + Identity** | Baseline apply path implemented | Needs compartment + quotas |
| **Core app on OCI (UI + API + OCI IAM + DB)** | K8s + nginx `/api` proxy + OCIR repos | Image push + IdP users |
| **Vault / Object Storage / edge / training / SCITT** | Modules + app hooks | Opt-in `enable_*` |
| **SPIFFE/SPIRE + WIF** | Modules + credential helper | Opt-in apply |
| **One-click production** | Near — `./deployment/deploy-oci.sh terraform -y --images` | DNS + IdP seed users |

**Identity:** OCI environments use **OCI IAM Identity Domains** only. **Keycloak** stays on local docker-compose for demos/E2E — not part of OCI deploy.

**Database:** **OCI Database with PostgreSQL** (not Autonomous DB) — required for Sequelize `postgres`.

**Verdict:** Baseline OCI deploy path is **implementation-complete in-repo** (Postgres, OKE node images, OCIR pull secret, frontend `/api` proxy). Still required from operators: tenancy apply, image push, Identity Domain user assignment, DNS/TLS.

---

## What exists today

### Documentation

- [OCI_DESIGN_COMPLETE.md](OCI_DESIGN_COMPLETE.md) — **design completeness map**
- [OCI Security Architecture](../production/OCI_SECURITY_ARCHITECTURE.md) — step-by-step runbook + topology
- [OCI Features & Configuration](OCI_FEATURES_AND_CONFIGURATION.md) — feature catalog + env/settings
- [OCI IAM & Edge Config](OCI_IAM_AND_EDGE_CONFIG.md) — IAM policies, Cloud Gate, API Gateway, WAF
- [OCI SPIFFE/SPIRE + WIF](OCI_SPIFFE_SPIRE_WIF.md) — workload identity
- [OCI Marketplace listing checklist](OCI_MARKETPLACE_LISTING_CHECKLIST.md) — Oracle Marketplace publish path for CAN
- [config/examples/config.oci.env.example](../../config/examples/config.oci.env.example) — env template

### Infrastructure code (`deployment/oci/terraform/`)

| Module | Purpose | Default |
|--------|---------|---------|
| `networking` / `oke` / `database` / `load_balancer` / `container_registry` | Platform baseline | On |
| `identity` | Identity Domain + OIDC apps + role groups | On |
| `kubernetes_resources` | Backend/frontend/Redis (no Keycloak) | On |
| `spire` / `wif` | Workload identity | `enable_spire` / `enable_wif` |
| `vault` / `object_storage` | Secrets CMK + dataset buckets | `enable_vault` / `enable_object_storage` |
| `edge` | WAF/API Gateway design ConfigMap | `enable_edge` |
| `training` | OKE Job template + SA | `enable_training` |
| `scitt` | SCITT ConfigMap scaffold | `enable_scitt` |

### Application hooks

- `okeJobTrainingRunner.js` — `TRAINING_EXECUTION_MODE=oci` / `oci-oke-job`
- `ociWifCredentialProvider.js` — WIF token-exchange scaffold
- `ociIdentityService.js` — Identity Domains OIDC

---

## Remaining for live production (operations)

1. `terraform apply` in a dev compartment; push images to OCIR  
2. DNS + Identity Domain user/group assignment; smoke SSO  
3. Flip `enable_*` for Vault, Object Storage, training, edge as needed  
4. Optional SPIRE/WIF and SCITT when those paths are required  
5. OCI-targeted E2E against staging URLs  

---

## Quick decision

| Your goal | Recommendation |
|-----------|----------------|
| **Architecture / CISO review** | [OCI_DESIGN_COMPLETE.md](OCI_DESIGN_COMPLETE.md) + security architecture |
| **Demo to customer next week** | [LOCAL_DEMO_RUNBOOK.md](../training/LOCAL_DEMO_RUNBOOK.md) locally |
| **OCI pilot apply** | `deployment/oci/terraform/` in a **dev** compartment |
| **Zero-trust workload identity** | [OCI_SPIFFE_SPIRE_WIF.md](OCI_SPIFFE_SPIRE_WIF.md) after Identity Domains + OKE |

---

## Related links

- [Multi-cloud security patterns](../production/MULTI_CLOUD_SECURITY_ARCHITECTURE_PATTERNS.md)
- [Azure Readiness](AZURE_READINESS.md) · [AWS Readiness](AWS_READINESS.md) · [GCP Readiness](GCP_READINESS.md)
- [deployment/oci/terraform/README.md](../../deployment/oci/terraform/README.md)
