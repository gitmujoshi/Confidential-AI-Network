# OCI architecture & design — complete (code + docs)

**Purpose:** Declare that Confidential AI Network’s **OCI architecture and design are complete** in-repo (Terraform scaffolds, Helm templates, env templates, app hooks, and docs). **Live tenancy apply and soak tests are out of scope** for this milestone — operators enable modules when they have a compartment.

| Item | Value |
|------|--------|
| Audience | Architects, platform engineers, CISOs reviewing design completeness |
| Maturity | **Design scaffold complete** — opt-in Terraform (`enable_* = false` by default) |
| Not claimed | Production cutover, live OKE smoke, SCITT CCF HA on OCI |

---

## Completeness map

| Architecture concern | Design doc | Code / IaC scaffold |
|---------------------|------------|---------------------|
| Human identity (Identity Domains) | [OCI_IAM_AND_EDGE_CONFIG.md](OCI_IAM_AND_EDGE_CONFIG.md) | `modules/identity` + `ociIdentityService.js` |
| Edge (WAF, API Gateway, Cloud Gate) | Same + security architecture §6 | `modules/edge` (ConfigMap + operator checklist) |
| Network / OKE / ADB / LB / OCIR | [OCI_SECURITY_ARCHITECTURE.md](../production/OCI_SECURITY_ARCHITECTURE.md) | `modules/networking`, `oke`, `database`, `load_balancer`, `container_registry`, `kubernetes_resources` |
| Vault / CMK | Security architecture §8.3 | `modules/vault` |
| Object Storage datasets/artifacts | Features catalog § Object Storage | `modules/object_storage` |
| Training as OKE Job | Readiness Phase 3 | `modules/training` + `helm/training` + `okeJobTrainingRunner.js` |
| SPIFFE/SPIRE peer identity | [OCI_SPIFFE_SPIRE_WIF.md](OCI_SPIFFE_SPIRE_WIF.md) | `modules/spire` + `helm/spire` |
| Workload Identity Federation | Same §4.2 | `modules/wif` + `ociWifCredentialProvider.js` |
| SCITT CCF on OCI | Features § SCITT | `modules/scitt` (ConfigMap scaffold) |
| Env / feature catalog | [OCI_FEATURES_AND_CONFIGURATION.md](OCI_FEATURES_AND_CONFIGURATION.md) | [config.oci.env.example](../../config/examples/config.oci.env.example) |
| Cross-cloud patterns | [MULTI_CLOUD_SECURITY_ARCHITECTURE_PATTERNS.md](../production/MULTI_CLOUD_SECURITY_ARCHITECTURE_PATTERNS.md) | Pattern P8 clean rooms = design complete; cloud TEE product apply remains operator-led |

---

## Terraform opt-in flags (all default `false` except identity/platform baseline)

| Variable | Module |
|----------|--------|
| `enable_spire` | `modules/spire` |
| `enable_wif` | `modules/wif` |
| `enable_vault` | `modules/vault` |
| `enable_object_storage` | `modules/object_storage` |
| `enable_edge` | `modules/edge` |
| `enable_training` | `modules/training` |
| `enable_scitt` | `modules/scitt` |

Baseline (always in root stack): networking, OKE, database, load balancer, OCIR, identity, kubernetes_resources.

---

## Application hooks

| Hook | Path | Behavior |
|------|------|----------|
| OKE Job training | `backend/services/okeJobTrainingRunner.js` | `TRAINING_EXECUTION_MODE=oci` or `oci-oke-job`; simulates when `TRAINING_SIMULATION_MODE=true`; otherwise fails with pointer to Job template |
| WIF credentials | `backend/services/ociWifCredentialProvider.js` | Documents token-exchange; simulates in test / `OCI_WIF_SIMULATION_MODE` |
| Identity Domains OIDC | `backend/services/ociIdentityService.js` | Implemented for JWT/JWKS |

---

## What “complete” does **not** mean

- A successful `terraform apply` in your tenancy  
- GPU node pools or confidential-compute shapes provisioned  
- Full HTTP token-exchange client against Identity Domain in production  
- SCITT CCF cluster installed and HA-tested on OKE  

Those are **apply / operations** work tracked in [OCI_READINESS.md](OCI_READINESS.md).

---

## Document history

| Date | Change |
|------|--------|
| 2026-07-28 | Design/scaffold completeness declaration + module map |

← [OCI readiness](OCI_READINESS.md) · [OCI Terraform README](../../deployment/oci/terraform/README.md)
