# VC Pitch Deck — Unified Platform

**Confidential AI Network · Open-GMASE · CompliancePulse AI**

> Slide-ready narrative for investors. Companion HTML: [`vc-deck-unified.html`](./vc-deck-unified.html)  
> Older CAN-only product pitch: [`PRODUCT_PITCH_DECK.md`](./PRODUCT_PITCH_DECK.md)

---

## Slide 1 — Title

**Governed AI for the enterprise**  
Train on shared data without losing control. Run autonomous agents without losing the control plane.

**Three offerings. One trust stack.**

- **CAN** — Confidential AI Network  
- **Open-GMASE** — Open agent execution security  
- **CompliancePulse AI** — Enterprise governance control plane  

---

## Slide 2 — The problem (two failures, one root cause)

| Failure mode | What breaks |
| --- | --- |
| **Data collaboration** | High-value data stays siloed. Exports, NDAs, and handshake deals don’t survive audits. Models that need multi-party data never ship. |
| **Agentic execution** | Agents need write access to infra. System prompts and RBAC are not security boundaries. Eval incidents (Anthropic / OpenAI) showed harness + privilege failure, not “the model was evil.” |

**Root cause:** Enterprises treat *policy text* and *alignment* as controls. Production needs **deterministic, auditable enforcement** — for contracts *and* for every tool call.

---

## Slide 3 — Why now

1. **Multi-party AI is mandatory** in healthcare, finance, public sector, industrial — single-tenant lakes are a dead end.  
2. **Agent fleets are shipping** (MCP, LangChain, AutoGen) with privileged tools before identity and policy catch up.  
3. **Regulators and boards** want evidence: who used what data, which agent changed what, under which policy.  
4. **Cloud IAM alone is insufficient** for LLM intent (SQL text, confidence, loops, HITL). Inner gates are required.

---

## Slide 4 — Vision

**One platform thesis:**

> Decouple trust from hope.  
> Contracts govern *who may train on what*.  
> Sidecars govern *what agents may execute*.  
> Ledgers and cognitive telemetry prove both.

We sell the rails for **confidential collaboration** and **governed autonomy** — not another chatbot.

---

## Slide 5 — Solution: three offerings, one stack

```text
┌──────────────────────────────────────────────────────────┐
│  CompliancePulse AI          Enterprise control plane    │
│  Multi-tenant · IdP · compliance packs · SOC dashboard   │
└────────────────────────────┬─────────────────────────────┘
                             │ builds on
┌────────────────────────────▼─────────────────────────────┐
│  Open-GMASE Core             Community / PLG runtime     │
│  SPIFFE · OPA · typed tools · starter SecOps agents      │
└────────────────────────────┬─────────────────────────────┘
                             │ secures jobs & agents inside
┌────────────────────────────▼─────────────────────────────┐
│  Confidential AI Network (CAN)   Multi-party training    │
│  Contracts · CCRP/TEE · Keycloak · SCITT provenance      │
└──────────────────────────────────────────────────────────┘
```

---

## Slide 6 — Offering A: CAN (Confidential AI Network)

**What it is:** Marketplace + workflow for governed AI training across distrusting parties.

| Party | Job |
| --- | --- |
| **TDP** | Publish datasets & terms; approve contracts; monetize without bulk export |
| **TDC** | Contract for access; train in clean rooms; receive attested outcomes |
| **CCRP** | Host isolated / confidential compute; attestation & ops |

**Differentiation:** Ricardian contracts + clean-room execution + ledger-backed provenance (SCITT) — not “upload to our lake.”

**Buyer:** Data platforms, regulated enterprises, AI builders who need third-party data legally and safely.

---

## Slide 7 — Offering B: Open-GMASE (community / PLG)

**What it is:** Open-source reference architecture for **governed multi-agent SecOps execution** (Apache 2.0).

**Primitives:**
- SPIFFE/SPIRE workload identity blueprints  
- OPA/Rego tool guardrails (rate limits, destructive CLI/SQL, HITL hooks)  
- Typed tool schemas (BAML templates)  
- Starter orchestrator / triage / responder agents  

**Why open:** Sets the standard for *agent execution security*, reduces pilot friction, invites policy-pack contributions.  
**Funnel:** Clone → `docker compose up` → contribute packs → upgrade to CompliancePulse.

---

## Slide 8 — Offering C: CompliancePulse AI (enterprise)

**What it is:** Commercial control plane on top of Open-GMASE (+ optional CAN integration).

| Open-GMASE | CompliancePulse |
| --- | --- |
| Local SPIFFE / base Rego | Okta / Entra / Ping, cross-cloud federation, HSM |
| Starter agents | Managed swarm, advanced SecOps workflows |
| File / local audit | Multi-tenant SaaS, RLS, CMEK, SOC dashboard |
| Community packs | SOC2 / HIPAA / PCI / NIST policy packs |

**Buyer:** CISO, SOC lead, DevSecOps — “agents in production without prompt-as-firewall.”

---

## Slide 9 — How they integrate (unified story)

1. **CAN contracts** define data use, residency, and parties.  
2. **Training / CCRP jobs** that call tools (APIs, kubectl, exports) egress through **Open-GMASE** (SPIFFE → typed args → OPA).  
3. **OPA inputs** carry `contract_id`, classification, and party roles from CAN.  
4. **Decisions + payloads** land in CAN audit / SCITT *and* CompliancePulse cognitive telemetry.  
5. **G-MASE swarm** optionally operates the platform (triage CCRP alerts, remediations with HITL).

**Humans stay on Keycloak. Workloads get SPIFFE. Cloud IAM stays the outer wall.**

---

## Slide 10 — Architecture (investor view)

```text
[ Humans: Keycloak ]     [ Agents: SPIFFE SVID ]
         │                         │
         ▼                         ▼
   CAN control plane      Propose tool (LLM)
   contracts · jobs                │
         │                  BAML / types
         │                         │
         └──────────► OPA allow/deny ◄── Rego packs
                           │
              ┌────────────┴────────────┐
           ALLOW                      DENY / HITL
              │                         │
         Cloud / SaaS / Git        Escalate / PR
              │
         Audit → Postgres / BigQuery / SCITT
```

---

## Slide 11 — Business model (open-core + marketplace)

| Stream | Offering | Motion |
| --- | --- | --- |
| **Transaction / take rate** | CAN | % of training / data contracts |
| **CCRP / infra** | CAN | Clean-room compute margin or partner revenue share |
| **Open-core SaaS** | CompliancePulse | Seat + policy pack + control-plane subscription |
| **Enterprise packs** | CompliancePulse | SOC2/HIPAA/PCI/NIST, IdP, CMEK, premium support |
| **PLG** | Open-GMASE | Free runtime → paid Control Plane |

Land with Open-GMASE or a CAN pilot; expand to CompliancePulse + full multi-party network.

---

## Slide 12 — Market wedge

**Not competing as:**
- Another LLM wrapper  
- Another generic MLOps lake  
- Cloud IAM alone  

**Competing as:**
- Category: **Governed AI collaboration + agent execution security**  
- Wedge: deterministic sidecars + contracts + provenance, where LangChain/AutoGen stop  

Comparable spend: confidential computing, DSPM, AI governance, SecOps automation — we connect **data rights** to **runtime enforcement**.

---

## Slide 13 — Traction / build status (honest)

| Layer | Status |
| --- | --- |
| **CAN** | Working product path: contracts, roles, training jobs, SCITT, multi-cloud deploy docs |
| **G-MASE whitepaper / blog** | Published reference architecture |
| **Open-GMASE Core** | Repo scaffold: OPA packs, starters, Compose, open-core positioning |
| **CompliancePulse AI** | Early SaaS shell — **not** full PRD yet (SPIRE/BAML/Headroom/BigQuery still stubs) |

**Investor takeaway:** Clear product architecture and open-core funnel; enterprise runtime depth is the build ahead — not a science project without a thesis.

---

## Slide 14 — Go-to-market

1. **PLG:** Open-GMASE + LinkedIn/whitepaper → DevSecOps & platform engineers.  
2. **Design partners:** 3–5 regulated CAN pilots (healthcare / finance / public).  
3. **CCRPs / clouds:** OCI-first, then AWS/GCP clean-room partners.  
4. **Upsell:** CompliancePulse control plane + compliance packs on the same guardrails.  
5. **Network effects:** More TDPs/TDCs → more contracts → more agents needing governance.

---

## Slide 15 — The ask

**Use of funds (illustrative Series A themes):**
- Finish zero-trust egress path (real SPIRE, sidecar, BAML, durable audit)  
- Harden CAN multi-cloud production (OKE/EKS/GKE)  
- 5–10 design-partner deployments  
- Open-source community + policy-pack ecosystem  
- Security/compliance evidence for enterprise sales  

**What we want from you:** Capital + regulated enterprise / cloud intros + AI governance network.

---

## Slide 16 — Close

**Train with strangers. Trust the rails.**  
**Automate SecOps. Don’t automate privilege abuse.**

| | | |
| --- | --- | --- |
| **CAN** | Confidential multi-party training | can / contracts / CCRP |
| **Open-GMASE** | Open agent execution security | Apache 2.0 PLG |
| **CompliancePulse** | Enterprise governance plane | Open-core upgrade |

Demo · Pilot · Open-source · Invest

---

## Appendix — one-liner blurbs

- **CAN:** Contract-governed, confidential AI training so organizations collaborate without giving up data control.  
- **Open-GMASE:** Open reference architecture where the model proposes and sidecars dispose.  
- **CompliancePulse:** Enterprise zero-trust control plane for autonomous agents — identity, policy, audit, SecOps swarm.

## Appendix — links

- Blog / G-MASE article: https://gitmujoshi.github.io/Confidential-AI-Network/  
- Repo: https://github.com/gitmujoshi/Confidential-AI-Network  
- Open-GMASE: `open-gmase-core/`  
- CompliancePulse: `compliancepulse-ai/`  
