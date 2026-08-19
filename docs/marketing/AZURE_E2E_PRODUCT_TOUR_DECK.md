# Azure — E2E Product Tour Deck

**Confidential AI Network on Microsoft Azure**

> Slide-ready narrative for **customer / partner / executive demos** when the Azure deployment is released.  
> **Live on the blog:** [deck notes](https://gitmujoshi.github.io/Confidential-AI-Network/product/2026/08/16/azure-e2e-product-tour-deck/) · [open slides](https://gitmujoshi.github.io/Confidential-AI-Network/assets/decks/azure-e2e-product-tour.html)  
> Companion HTML in repo: [`azure-e2e-product-tour-deck.html`](./azure-e2e-product-tour-deck.html)  
> Screenshot source (swap in Azure captures at GA): [Product tour](https://gitmujoshi.github.io/Confidential-AI-Network/product-tour/) · Azure CC deep dive: [azure-confidential-computing-deep-dive](https://gitmujoshi.github.io/Confidential-AI-Network/security/2026/08/17/azure-confidential-computing-deep-dive/) · Azure architecture: [AZURE_SECURITY_ARCHITECTURE.md](../production/AZURE_SECURITY_ARCHITECTURE.md) · Features: [AZURE_FEATURES_AND_CONFIGURATION.md](../deployment/AZURE_FEATURES_AND_CONFIGURATION.md)

**How to present:** ~25–35 minutes live tour + 10 minutes Q&A. Keep the **local Docker path** as a fallback if the Azure tenancy is down—but say clearly when you are on confidential compute vs host training.

---

## Slide 1 — Title

**Confidential AI Network**  
**Azure release — end-to-end product tour**

From Entra sign-in to a governed prediction—  
multi-party contracts, Key Vault, confidential compute, and policy gates.

| | |
|--|--|
| Audience | Customers, partners, CISOs, cloud architects |
| Cloud | Microsoft Azure (Entra · AKS · Key Vault · Blob · confidential VMs) |
| Inspiration | iSPIRT **DEPA** (Data Empowerment and Protection Architecture) |

*Speaker note:* Open with “we don’t ask you to export the lake—we ask you to sign a contract and train where policy allows.”

---

## Slide 2 — Agenda

1. Why Azure + CAN  
2. What this tour includes (and what we still label as roadmap)  
3. Azure control plane at a glance  
4. Live E2E tour (registration → prediction)  
5. Keys & TEE (decrypt only after attest + contract)  
6. Open-GMASE + CompliancePulse on the same loop  
7. Demo checklist & next steps  

---

## Slide 3 — The problem (30 seconds)

| Today | What breaks |
| --- | --- |
| Bulk export + NDA | Sovereignty, liability, audit failure |
| “Train in our VPC” handshake | No machine-enforceable terms |
| Shared data lake | Competitive & regulatory non-starter |

**CAN on Azure:** metadata catalog → **Ricardian contract** → **Key Vault–backed crypto** → **confidential compute** → provenance → inference—without a central lake.

---

## Slide 4 — DEPA inspiration (say it clearly)

**Inspired by India’s iSPIRT [DEPA](https://depa.world)**  
Consent-based, accountable data sharing: use-bound access, evidence over screenshots.

| DEPA idea | CAN on Azure |
| --- | --- |
| Data principal keeps control | TDP owns **DEK**; ciphertext in Blob |
| Purpose limitation | Ricardian contract + Entra roles |
| Auditability | SCITT / AuditLogs + optional CompliancePulse ingest |

---

## Slide 5 — What this Azure tour covers

| Capability | Narrative |
| --- | --- |
| **Microsoft Entra ID** | Sole app IdP (SSO, Conditional Access, app roles TDC/TDP/CCRP/AppAdmin) |
| **Edge** | Front Door / WAF → APIM (JWT validation) → private AKS |
| **Key Vault** | Platform secrets, CMK, signing key refs, contract `kmsConfigs` |
| **Blob Storage** | Dataset / model **ciphertext** + training artifacts |
| **Confidential compute** | CCRP path: attest → dual-key escrow → decrypt-in-memory → train |
| **Training jobs** | AKS Job / ACI / confidential VM per TSP offering |
| **Inference** | Register → deploy → predict under Open-GMASE gate |
| **Governance** | OPA fail-closed; decisions → AuditLogs → CompliancePulse ingest |

*Speaker note:* If a bullet is still Partial/Design in [AZURE_FEATURES](../deployment/AZURE_FEATURES_AND_CONFIGURATION.md), mark it **“production target”** on the slide rather than implying every line is already in production.

---

## Slide 6 — Azure control plane (one diagram)

```text
  Users (TDP / TDC / CCRP)
           │  Entra ID (OIDC + app roles)
           ▼
  Front Door / WAF  →  APIM  →  CAN API / UI on AKS
                                    │
           ┌────────────────────────┼────────────────────────┐
           ▼                        ▼                        ▼
     Azure Key Vault          Blob (CMK)              Confidential compute
     secrets · CMK ·          ciphertext              TEE / DCsv* / ACI
     signing refs             datasets · models       attest → decrypt → train
           │                        │                        │
           └────────────────────────┴────────────────────────┘
                                    ▼
                         Provenance · SIEM · CompliancePulse
```

---

## Slide 7 — Roles on the tour

| Role | Entra app role | What they do in the demo |
| --- | --- | --- |
| **TDP** | `TDP` | Publish encrypted dataset metadata; sign; release **DEK** when attested |
| **TDC** | `TDC` | Create contract; select model; sign; release **MEK**; start train; deploy infer |
| **CCRP / TSP** | `CCRP` | Offer Azure confidential capacity; host attested session |
| **Auditor** | `Auditor` | Read-only: Merkle audit tree + contract review after train/predict |
| **AppAdmin** | `AppAdmin` | Tenancy health, constraints (optional slide) |

---

## Slide 8 — Tour map (E2E)

```text
1 Register (Entra) → 2 Catalog (Blob) → 3 Contract + KMS refs
        → 4 Multi-party sign → 5 Attest + DEK/MEK escrow
        → 6 Train in TEE → 7 Provenance → 8 Deploy + predict
        → 9 Open-GMASE ALLOW (+ CompliancePulse)
        → 10 Auditor: Merkle tree + contract review
```

Same story as the [product tour](https://gitmujoshi.github.io/Confidential-AI-Network/product-tour/)—**Azure services underneath**.

---

## Slide 9 — Step 1: Party registration (Entra)

**Show:** Login via **Microsoft Entra ID**; Conditional Access / MFA as customer policy.

- SPA + API app registrations; roles `TDC` / `TDP` / `CCRP` / `AppAdmin`  
- **Keycloak is local-only**—not on the Azure path  

*Screenshot placeholder:* Azure registration / landing (replace with live Azure capture).

---

## Slide 10 — Step 2: Catalog (Blob)

**Show:** TDP publishes dataset **ciphertext** to Blob (CMK); TDC picks catalog model.

- Metadata + policy in CAN; bulk plaintext stays out of the portal  
- Optional: TDC model ciphertext with **MEK**  

*Screenshot placeholder:* Catalog / dataset publish.

---

## Slide 11 — Step 3: Ricardian contract + Key Vault

**Show:** TDC creates contract—use, duration, region, **Azure Key Vault** `kmsConfigs`, CCRP offering.

- Human-readable terms + machine-enforceable state  
- Environment binding: Azure region, confidential SKU, residency  

*Screenshot placeholder:* Contract wizard (TSP = Azure CCRP).

---

## Slide 12 — Step 4: Notify & sign

**Show:** TDP + CCRP notifications; cryptographic sign (Key Vault–backed keys at GA).

- No training until required signatures complete  
- Optional SCITT receipt on Azure  

---

## Slide 13 — Step 5: KMS — DEK & MEK escrow

**Show (diagram or short animation):**

| Key | Owner | Protects |
| --- | --- | --- |
| **DEK** | TDP | Dataset |
| **MEK** | TDC | Model IP |

**Dual-key escrow:** train starts only when **both** are released after policy OK.  
Platform must **not** hold principal key plaintext.

Deep dive: [KMS blog](https://gitmujoshi.github.io/Confidential-AI-Network/security/2026/08/16/can-kms-dek-mek-escrow/)

---

## Slide 14 — Step 6: TEE — attest → verify contract → decrypt

```text
Provision confidential VM / enclave
  → Attestation quote
  → Principals verify quote ∧ contract binding
  → DEK + MEK over attested channel into TEE
  → Decrypt in memory → train → re-encrypt outputs
  → Zeroize → destroy session
```

Deep dive: [TEE blog](https://gitmujoshi.github.io/Confidential-AI-Network/security/2026/08/16/can-tee-attest-decrypt-train/)

*Speaker note:* “Decrypt is a privilege, not a default.”

---

## Slide 15 — Step 7: Training job on Azure

**Show:** Job RUNNING → COMPLETED; logs; metrics (optional DP ε/δ on NLP).

| Target Azure path | Fallback demo |
| --- | --- |
| AKS Job / confidential compute | `local-docker` (label as non-TEE) |

Open-GMASE evaluates **`start_training`** fail-closed before the side effect.

---

## Slide 16 — Step 8: Provenance & audit

**Show:** Provenance / audit report—job created, attested, keys released, started, completed, destroyed.

- SIEM export to customer Sentinel / Log Analytics as configured  
- SCITT CCF claims where enabled  

---

## Slide 16b — Step 8b: Auditor workspace (Merkle + contract)

**Show:** `/auditor/dashboard` → **Merkle audit tree** (root + leaf verify) → open governing **Ricardian contract**.

- Role: **Auditor** (Entra app role) — global read, no sign/train  
- Leaves commit to contract, training jobs, SCITT markers, registered models  
- Product-tour screens: `25-auditor-workspace`, `26-auditor-audit-tree`, `27-auditor-contract-review`  

---

## Slide 17 — Step 9: Register → deploy → predict

**Show:** Register artifact → **Deploy for inference** → Inference app prediction.

| Example | Label |
| --- | --- |
| Tabular iris features | setosa |
| DistilBERT / AG News | Business |
| Vision sample | CIFAR class name |

Open-GMASE **`deploy_inference` / `run_inference`** → Inference UI **ALLOW** panel.

---

## Slide 18 — Governance seam (same decision path)

```text
CAN side effect → Open-GMASE OPA → AuditLogs → CompliancePulse ingest
```

**Forwarded:** allow/deny, tool name, model/contract ids—not pixels or weights.  
Demo: [CAN ↔ Open-GMASE ↔ CompliancePulse](https://gitmujoshi.github.io/Confidential-AI-Network/guides/2026/08/14/can-gmase-demo-slice/)

---

## Slide 19 — Full story in one sentence

**On Azure, CAN binds multi-party training in a Ricardian contract, unlocks DEK/MEK only after Entra-backed parties accept an attested confidential session, trains in the enclave, and serves a prediction under an Open-GMASE policy gate—with evidence for GRC.**

---

## Slide 20 — Live demo checklist (operator)

| # | Check | Owner |
| --- | --- | --- |
| 1 | Entra test users + roles provisioned | Platform |
| 2 | APIM / app healthy; HTTPS | Platform |
| 3 | Key Vault + Blob CMK reachable via workload identity | Platform |
| 4 | CCRP offering published (region + confidential SKU) | CCRP |
| 5 | Sample ciphertext dataset + model in catalog | TDP/TDC |
| 6 | OPA (Open-GMASE) up; gates on | Platform |
| 7 | CompliancePulse ingest URL set (or explicitly off) | Platform |
| 8 | Screenshots / recording backup if live path fails | Presenter |

---

## Slide 21 — Scope boundaries

| In scope / live | Do not imply |
| --- | --- |
| Entra is the Azure IdP | Keycloak runs in customer Azure |
| Local Docker covers UX | Local Docker is a hardware TEE |
| Dual-key escrow is the design | SaaS holds DEK/MEK plaintext |
| Open-GMASE gates side effects | Prompts are the control plane |
| CompliancePulse ingest is evidence path | Full multi-tenant SaaS is done if still roadmap |

---

## Slide 22 — Close / CTA

**Try / read**

- Product tour (UI): https://gitmujoshi.github.io/Confidential-AI-Network/product-tour/  
- Contract → prediction: https://gitmujoshi.github.io/Confidential-AI-Network/product/2026/08/14/can-contract-to-prediction/  
- Azure Entra architecture: https://gitmujoshi.github.io/Confidential-AI-Network/security/2026/07/28/azure-entra-security-architecture/  
- Repo: https://github.com/gitmujoshi/Confidential-AI-Network  

**Ask:** pilot tenancy · Entra app roles · CCRP confidential SKU · GRC evidence pack  

---

## Appendix — Speaker timing

| Block | Minutes |
| --- | --- |
| Problem + DEPA + Azure map | 5 |
| Live tour steps 1–4 | 10 |
| KMS + TEE | 5 |
| Train → infer → GMASE/CP | 8 |
| Checklist + Q&A | 10 |

## Appendix — Screenshot swap list (at GA)

Capture Azure UI into `docs/guides/azure-product-tour/screenshots/` (suggested) and mirror on the blog product-tour Azure section when ready:

1. Entra login / role home  
2. Dataset publish (Blob)  
3. Contract wizard + Key Vault refs  
4. Multi-party sign  
5. Attestation / escrow status  
6. Training COMPLETED  
7. Provenance  
8. Inference + Open-GMASE ALLOW  
