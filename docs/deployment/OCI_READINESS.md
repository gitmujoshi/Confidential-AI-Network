# OCI deployment readiness

Assessment of whether the Contract Management System is ready to deploy to **Oracle Cloud Infrastructure** as of the current codebase.

---

## Summary

| Layer | Ready? | Notes |
|-------|--------|--------|
| **Architecture & security design** | Yes (doc) | [OCI_SECURITY_ARCHITECTURE.md](../production/OCI_SECURITY_ARCHITECTURE.md) |
| **Terraform / OKE scaffold** | Partial | [deployment/oci/terraform/README.md](../../deployment/oci/terraform/README.md) |
| **Core app on OCI (UI + API + Keycloak + DB)** | Partial | K8s manifests in Terraform module; needs validation & hardening |
| **SCITT CCF on OCI** | No | Not in OCI Terraform; required if `SCITT_CCF_ENABLED=true` locally |
| **Physical training on OCI** | No | Local-docker trainer assumes host Docker + disk uploads |
| **CAN / CCRP on OCI** | No | Local CCRP executor only |
| **One-click production** | No | Docs still reference AWS/K8s scripts; OCI path is scaffold + manual steps |

**Verdict:** Ready for an **OCI infrastructure pilot** (network, OKE, ADB, LB, OCIR) with engineering effort to validate and wire secrets, DNS, and Keycloak. **Not** ready for a full production cutover with SCITT + physical training parity to local demo without additional work.

---

## What exists today

### Documentation

- [OCI Security Architecture](../production/OCI_SECURITY_ARCHITECTURE.md) — **step-by-step new-env setup runbook** + compartments, WAF, API Gateway, Cloud Gate, OKE, Vault
- **[OCI IAM & Edge Config](OCI_IAM_AND_EDGE_CONFIG.md)** — full IAM policies, Cloud Gate, API Gateway routes, WAF rules
- [deployment/oci/terraform/README.md](../../deployment/oci/terraform/README.md) — module list and deploy flow
- [docs/deployment/README.md](../deployment/README.md) — decision tree (VM vs OCI vs K8s)

### Infrastructure code (`deployment/oci/terraform/`)

| Module | Purpose |
|--------|---------|
| `networking` | VCN, subnets, gateways |
| `oke` | Kubernetes cluster + node pool |
| `database` | Autonomous Database |
| `load_balancer` | Public LB, backend sets |
| `container_registry` | OCIR |
| `kubernetes_resources` | Namespace, ConfigMaps, Secrets, Deployments (backend, frontend, Keycloak, Redis) |

### Alternative path

- [deploy/oci/deploy-oci.sh](../../deploy/oci/deploy-oci.sh) — single-VM style OCI CLI deploy (simpler than OKE)

---

## Gaps for OCI production

### 1. Application stack

- Terraform K8s resources target a **generic** deployment; images, tags, and health probes must be built and pushed to **OCIR**
- **Autonomous DB** vs app’s PostgreSQL-specific migrations/Sequelize — verify compatibility and connection wallet
- **Keycloak** realm export, HTTPS, and persistent identity store differ from local `docker-compose.***REMOVED-KEYCLOAK_DB_PASSWORD***-*.yml`
- **Environment sync:** `config.env` / `secrets.env` patterns need OCI Vault + K8s Secrets mapping

### 2. SCITT CCF (enabled in local `config.env`)

- Local stack runs SCITT via Docker Compose (`manage-scitt-ccf.sh`)
- **No SCITT module** in OCI Terraform — production either disables SCITT or needs a separate OKE deployment / managed service plan

### 3. Training workloads

Local demo uses:

- `backend/uploads/datasets/` on disk
- `localDockerTrainingRunner` spawning containers on the **backend host**
- `contractmanagement/local-trainer:latest` image

On OCI this requires **new design**:

| Local | OCI target |
|-------|------------|
| Disk uploads | **Object Storage** + pre-signed upload or API gateway |
| `docker run` on backend pod | **Kubernetes Jobs** on GPU/CPU node pool, or OCI Data Science / custom worker |
| Local trainer image | Push to **OCIR**; pull from job spec |
| CAN local CCRP | Real compartment-isolated compute or partner CCRP integration |

None of this is automated in current OCI Terraform.

### 4. Security architecture vs implementation

The security doc describes WAF, API Gateway, Cloud Gate, Bastion, multi-compartment — **most are not codified** in Terraform modules yet (design-only).

### 5. Testing & CI

- No evidence of regular `terraform apply` against a live tenancy in CI
- E2E tests target **localhost**, not OCI endpoints

---

## Recommended OCI rollout phases

### Phase 1 — Platform pilot (4–8 weeks engineering)

- [ ] `terraform apply` in dev compartment
- [ ] Build/push backend + frontend images to OCIR
- [ ] Deploy OKE workloads; connect ADB; run migrations
- [ ] Keycloak + TLS + DNS (`app_domain`)
- [ ] `./fix-auth.sh` equivalent for OCI Keycloak URLs
- [ ] Smoke: login, contract create, sign (SCITT optional/off)

### Phase 2 — Data & artifacts

- [ ] Dataset artifacts → Object Storage
- [ ] Backend staging for training inputs from bucket
- [ ] Remove dependency on backend pod Docker socket

### Phase 3 — Training on OKE

- [ ] Trainer as K8s Job; OCIR image
- [ ] CAN executor triggers OKE job instead of `localDockerTrainingRunner`
- [ ] GPU node pool (optional)

### Phase 4 — Security hardening (per OCI_SECURITY_ARCHITECTURE.md)

- [ ] WAF + API Gateway or Cloud Gate in front of LB
- [ ] Vault keys, separate compartments per env
- [ ] Cloud Guard, logging to SIEM

### Phase 5 — SCITT / confidential computing (if required)

- [ ] SCITT CCF deployment model on OCI or hybrid (ledger in cloud, training in CCRP)

---

## Quick decision

| Your goal | Recommendation |
|-----------|----------------|
| **Demo to customer next week** | Use [LOCAL_DEMO_RUNBOOK.md](../training/LOCAL_DEMO_RUNBOOK.md) locally |
| **OCI “hello world” app** | Start Phase 1 with `deployment/oci/terraform/` in a **dev** compartment |
| **OCI production with training** | Plan Phases 1–3; budget 2–3 months after Phase 1 is stable |
| **Full security reference architecture** | Use OCI_SECURITY_ARCHITECTURE.md as target; implement incrementally |

---

## Related links

- [Production README](../production/README.md)
- [LOCAL_DEMO_RUNBOOK.md](../training/LOCAL_DEMO_RUNBOOK.md)
- [deployment/oci/terraform/README.md](../../deployment/oci/terraform/README.md)
