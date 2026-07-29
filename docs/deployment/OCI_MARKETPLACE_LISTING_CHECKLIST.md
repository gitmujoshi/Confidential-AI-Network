# OCI Marketplace listing checklist — Confidential AI Network (CAN)

Practical path to list **CAN** on [Oracle Marketplace](https://marketplace.oracle.com), grounded in what already exists in this repo.

**Related:** [OCI_READINESS.md](OCI_READINESS.md) · [OCI_DESIGN_COMPLETE.md](OCI_DESIGN_COMPLETE.md) · [OCI Terraform](../../deployment/oci/terraform/README.md) · [Product tour](../blogs/product-tour.md)

Official docs: [Become a publisher](https://docs.oracle.com/en-us/iaas/Content/Marketplace/become-oci-partner.htm) · [Console publishing](https://docs.oracle.com/en-us/iaas/Content/Marketplace/Tasks/publish-a-listing.htm)

---

## Recommendation for CAN


| Phase         | Listing                                       | Why                                                             |
| ------------- | --------------------------------------------- | --------------------------------------------------------------- |
| **A (first)** | **BYOL / free SaaS** or **stack (Terraform)** | Discovery + Oracle AE conversations; no billing integration yet |
| **B**         | **Paid SaaS + private offers**                | First revenue; Oracle bills the customer                        |
| **C**         | Public paid tiers + co-sell                   | Scale after 1–2 reference deals                                 |


Do **not** wait for full production soak before Phase A. Marketplace review needs a credible product story, security narrative, and a deployable or reachable service — not every `enable_`* flag live.

---

## 0. Business & partner prerequisites

- [ ] Legal entity ready (paid listings: typically **US-domiciled** entity, USD bank, iSupplier)
- [ ] Oracle account + [Oracle Partner Network (OPN)](https://partner.oracle.com) membership
- [ ] Accept **Oracle Cloud Marketplace Agreement (OCMA)**
- [ ] Paid OCI tenancy (PAYG); home region **US East (Ashburn)** subscribed for Publisher console
- [ ] Register as Marketplace **publisher** (company profile + OPN ID)
- [ ] Name one technical owner + one commercial owner for Oracle review emails

---

## 1. Choose listing shape(s)

### Option A — SaaS (managed CAN)

Buyer subscribes → lands on your hosted CAN (multi-tenant or per-customer tenancy).


| Need                        | Status in repo                                     | Gap to close                                  |
| --------------------------- | -------------------------------------------------- | --------------------------------------------- |
| Hosted UI + API             | App exists; OCI Identity Domains wiring scaffolded | Staging URL with OCI IdP (not Keycloak)       |
| Entitlement after subscribe | Not built                                          | Subscribe webhook → create org / enable login |
| Metering (optional Phase B) | Not built                                          | Meter contracts, seats, or training jobs      |
| Support / SLA page          | Pitch + docs exist                                 | Public support email + severity matrix        |


### Option B — Customer-deployed stack (Terraform / OKE)

Buyer launches into **their** OCI compartment.


| Artifact                                          | Repo path                   | Marketplace-ready?                                             |
| ------------------------------------------------- | --------------------------- | -------------------------------------------------------------- |
| Root Terraform                                    | `deployment/oci/terraform/` | Baseline apply path (Postgres, OKE images, OCIR, `/api` proxy) |
| Identity Domains                                  | `modules/identity`          | Design complete; needs live SSO + user seed                    |
| OKE / PostgreSQL / OCIR / K8s                     | baseline modules            | Operator: compartment apply + `--images`                       |
| Vault / Object Storage / training / SPIRE / SCITT | opt-in modules              | Document as optional SKUs or later versions                    |
| Helm (SPIRE, training)                            | `deployment/oci/helm/`      | Templates; package versions for listing                        |


**Pragmatic first stack listing:** “CAN platform baseline” = networking + OKE + **OCI PostgreSQL** + Identity Domain + UI/API images. Mark confidential training / SCITT / SPIRE as **Phase 2 stack versions**.

### Option C — Hybrid (recommended narrative)

- Marketplace **SaaS listing** for managed trials / demos  
- Marketplace **stack listing** for enterprise self-host in customer tenancy  
- Private offers for either

---

## 2. Product packaging checklist

### Listing copy (reuse marketing + docs)

- [x] Short description (≤ ~200 chars): multi-party governed AI training (TDP / TDC / CCRP), Ricardian contracts, SCITT provenance, OCI confidential compute  
- [x] Long description: problem → roles → contract → training → provenance  
- [x] Categories: AI/ML, Security, Data Governance (confirm current Oracle taxonomy)  
- [x] Screenshots: use [OCI product-tour captures](../guides/oci-scaffold-demo/) + lifecycle screenshots  
- [x] Demo / docs links: GitHub Pages product tour + this repo’s OCI security architecture  
- [x] Support: email, hours, severity response targets  
- [x] Privacy / data processing summary (what leaves the customer tenancy)

### Technical artifacts

- [x] Versioned container images in **OCIR** (frontend, backend, trainer) with tags per [OCI_TAGGING_AND_VERSIONING.md](OCI_TAGGING_AND_VERSIONING.md)
- [x] Terraform release tag (e.g. `oci-marketplace-v0.1.0`) with `enable_*` defaults documented
- [x] Install / upgrade / uninstall runbook (point at OCI security architecture + terraform README)
- [x] Architecture diagram (WAF → API → OKE → ADB / Vault / Object Storage / SCITT)
- [x] Known limitations page (honest: design scaffolds vs live apply — see [OCI_READINESS.md](OCI_READINESS.md))

### Security & compliance narrative

- [ ] One-pager: identity (OCI Identity Domains), secrets (Vault), network isolation, workload identity (SPIFFE/WIF)
- [ ] Map to customer questions using [NIST/CIS controls mapping](../compliance/SECURITY_CONTROLS_NIST_CIS_MAPPING.md)
- [ ] Data residency / jurisdiction story (DEPA-aligned IDs, contract geography)
- [ ] Vulnerability / dependency process (how you patch images)
- [ ] Optional later: SOC 2 / ISO path — not required for first BYOL listing, expected for enterprise paid

---

## 3. Engineering work before submit

### Minimum for Phase A (BYOL SaaS or stack)


| Work item                                          | Owner | Done when                               |
| -------------------------------------------------- | ----- | --------------------------------------- |
| Staging CAN on OCI with Identity Domains           | Eng   | Login as TDC/TDP/TSP without Keycloak   |
| Push images to OCIR; deploy via Terraform baseline | Eng   | Health checks green                     |
| Document `terraform apply` path for buyer tenancy  | Eng   | Fresh compartment deploy from README    |
| Marketplace landing URL + “Get started” CTA        | GTM   | Links to docs or trial signup           |
| Publisher IAM policies in tenancy                  | Ops   | Can create listing in Console Publisher |


### Phase B (paid SaaS)


| Work item                                    | Done when                                          |
| -------------------------------------------- | -------------------------------------------------- |
| Subscribe / unsubscribe fulfillment handlers | Marketplace events create/disable tenant           |
| Entitlement gate on login + APIs             | Unsubscribed users cannot use CAN                  |
| Metering model chosen                        | e.g. seats / active contracts / training job-hours |
| Private offer flow tested                    | Test subscription → invoice path with Oracle       |
| Tax / supplier registration complete         | Payouts can clear                                  |


Suggested metering units for CAN (pick one primary):

1. **Named seats** (simplest)
2. **Active contracts / month**
3. **Training job-hours** (aligns with OKE Job usage; harder to meter accurately)

---

## 4. Oracle Console publishing steps

1. OCI Console → **Marketplace** / **Publisher** (Ashburn)
2. Create listing → package type **SaaS** and/or **Stack** (Terraform)
3. Upload icons, screenshots, support info, terms
4. Attach artifacts (stack ZIP / Terraform package, or SaaS fulfillment URL)
5. Submit for Oracle review; respond to findings
6. Publish as **private** or limited audience first (pilot customers)
7. Promote to **public**; enable **private offers** for AE-led deals

Contact (Oracle docs): `marketplace-help_us_grp@oracle.com` for publisher issues.

---

## 5. Go-to-market after listing

- [ ] One-pager for Oracle AEs (problem, OCI services used, deal size, reference story)
- [ ] Co-sell registration in OPN (solution practice / opportunity share)
- [ ] Pilot offer: 30–90 day BYOL or discounted private offer
- [ ] Reference architecture blog on GitHub Pages (already have vision + OCI tour)
- [ ] Track: listing views → trials → private offers → closed-won

OCI services to highlight in AE one-pager (already in CAN design):

- Identity Domains · Vault / KMS · OKE · Autonomous DB · Object Storage  
- Confidential computing path · WAF / API Gateway (edge module) · Workload Identity / SPIFFE

---

## 6. Suggested timeline


| Week | Focus                                                                      |
| ---- | -------------------------------------------------------------------------- |
| 1–2  | OPN + publisher registration; listing draft copy; Ashburn publisher access |
| 2–4  | Staging OCI deploy (Identity Domains + baseline Terraform + OCIR images)   |
| 4–5  | Stack package or SaaS BYOL submit; screenshots + security one-pager        |
| 5–8  | Oracle review iterations; private pilot listing                            |
| 8–12 | First private offer; start Phase B entitlement/metering if deals need paid |


---

## 7. Honest gaps (do not overclaim on listing)

From current readiness:

- Terraform / Helm / app hooks are **design-complete scaffolds**; live tenancy apply and soak are operator follow-through  
- SCITT HA on OKE, full edge WAF cutover, and production SPIRE soak are **not** claimed as live  
- Keycloak is **local-only**; marketplace OCI story must use **Identity Domains**  
- Environment “marketplace” inside the app (`EnvironmentMarketplace`) is a **product feature**, not Oracle Marketplace

List what buyers get **today** vs **roadmap** on the listing to pass review and build trust.

so 

## 8. Immediate next actions (this week)

1. Confirm entity + OPN membership eligibility for paid vs BYOL-only
2. Decide Phase A: **SaaS BYOL**, **Terraform stack**, or both
3. Stand up one OCI staging compartment and apply baseline Terraform
4. Cut listing draft (copy + OCI tour screenshots + security one-pager)
5. Open Publisher console and create a draft listing (do not submit until staging is reachable)

When Phase A shape is chosen, add a short `deployment/oci/marketplace/` folder later with: listing metadata template, stack packaging script, and (for SaaS) entitlement webhook stubs.