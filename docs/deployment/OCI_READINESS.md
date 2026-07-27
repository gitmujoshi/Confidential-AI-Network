# OCI deployment readiness

Assessment of whether the Contract Management System is ready to deploy to **Oracle Cloud Infrastructure** as of the current codebase.

---

## Summary

| Layer | Ready? | Notes |
|-------|--------|--------|
| **Architecture & security design** | Yes (doc) | [OCI_SECURITY_ARCHITECTURE.md](../production/OCI_SECURITY_ARCHITECTURE.md) |
| **Terraform / OKE scaffold** | Partial | [deployment/oci/terraform/README.md](../../deployment/oci/terraform/README.md) |
| **Core app on OCI (UI + API + OCI IAM + DB)** | Partial | Keycloak removed from OCI TF; `AUTH_PROVIDER=oci-iam` + OIDC/JWKS wired; needs live Identity Domain validation |
| **SCITT CCF on OCI** | No | Not in OCI Terraform; required if `SCITT_CCF_ENABLED=true` locally |
| **Physical training on OCI** | No | Local-docker trainer assumes host Docker + disk uploads |
| **CAN / CCRP on OCI** | No | Local CCRP executor only |
| **One-click production** | No | Docs still reference AWS/K8s scripts; OCI path is scaffold + manual steps |

**Identity:** OCI environments use **OCI IAM Identity Domains** only. **Keycloak** stays on local docker-compose for demos/E2E — not part of OCI deploy (same split as Azure/Entra).

**Verdict:** Ready for an **OCI infrastructure pilot** (network, OKE, ADB, LB, OCIR) with engineering effort to validate secrets, DNS, and **OCI IAM** integration. **Not** ready for a full production cutover with SCITT + physical training parity to local demo without additional work.

---

## What exists today

### Documentation

- [OCI Security Architecture](../production/OCI_SECURITY_ARCHITECTURE.md) — **step-by-step new-env setup runbook** + compartments, WAF, API Gateway, Cloud Gate, OKE, Vault
- [OCI Features & Configuration](OCI_FEATURES_AND_CONFIGURATION.md) — **feature catalog + env/settings**
- **[OCI IAM & Edge Config](OCI_IAM_AND_EDGE_CONFIG.md)** — full IAM policies, Cloud Gate, API Gateway routes, WAF rules
- [config/examples/config.oci.env.example](../../config/examples/config.oci.env.example) — OCI env template (target)
- [deployment/oci/terraform/README.md](../../deployment/oci/terraform/README.md) — module list and deploy flow
- [docs/deployment/README.md](README.md) — decision tree (VM vs OCI vs Azure vs AWS vs GCP)

### Infrastructure code (`deployment/oci/terraform/`)

| Module | Purpose |
|--------|---------|
| `networking` | VCN, subnets, gateways |
| `oke` | Kubernetes cluster + node pool |
| `database` | Autonomous Database |
| `load_balancer` | Public LB, backend sets |
| `container_registry` | OCIR |
| `kubernetes_resources` | Namespace, ConfigMaps, Secrets, Deployments (backend, frontend, Redis; **Keycloak still in TF — remove for OCI IAM target**) |

### Alternative path

- [deploy/oci/deploy-oci.sh](../../deploy/oci/deploy-oci.sh) — single-VM style OCI CLI deploy (simpler than OKE)

---

## Gaps for OCI production

### 1. Application stack

- Terraform K8s resources target a **generic** deployment; images, tags, and health probes must be built and pushed to **OCIR**
- **Autonomous DB** vs app’s PostgreSQL-specific migrations/Sequelize — verify compatibility and connection wallet
- **OCI IAM Identity Domains** — OIDC SPA + backend JWT validation; group → partyType map (code is still Keycloak-centric)
- **Do not** port Keycloak realm to OKE — keep Keycloak for local docker only; remove Keycloak Deployment from OCI Terraform
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
- [ ] **OCI IAM** Identity Domain + SPA/API OIDC apps; Cloud Gate optional for `app.*`
- [ ] Map Identity Domain groups → party types; API Gateway JWT = Identity Domain JWKS
- [ ] Remove Keycloak from OCI K8s manifests
- [ ] Smoke: Identity Domain login, contract create, sign (SCITT optional/off)

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

- [OCI Features & Configuration](OCI_FEATURES_AND_CONFIGURATION.md)
- [Azure Readiness](AZURE_READINESS.md) · [AWS Readiness](AWS_READINESS.md) · [GCP Readiness](GCP_READINESS.md)
- [Production README](../production/README.md)
- [LOCAL_DEMO_RUNBOOK.md](../training/LOCAL_DEMO_RUNBOOK.md)
- [deployment/oci/terraform/README.md](../../deployment/oci/terraform/README.md)
