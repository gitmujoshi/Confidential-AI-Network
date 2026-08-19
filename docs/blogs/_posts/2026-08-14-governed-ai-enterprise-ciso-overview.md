---
layout: post
title: "Governed AI for the enterprise — a CISO’s overview"
date: 2026-08-14
categories: [executive]
tags: [ciso, can, g-mase, compliancepulse, overview]
permalink: /executive/2026/08/14/governed-ai-enterprise-ciso-overview/
excerpt: "Two enterprise risks—unsafe multi-party data use and unbounded AI agents—and how CAN, Open-GMASE, and CompliancePulse address them as one trust problem."
---

Two questions that usually get separate vendor answers:

1. *How do we improve models on partner data we do not own—without concentrating breach and audit risk?*  
2. *How do we let AI agents act in the SOC—without unconstrained production privilege?*

This note treats them as one problem: **policy text is not enforcement.** NDAs and system prompts are not control planes. The stack under discussion is **CAN** (multi-party training), **Open-GMASE** (open execution reference), and **CompliancePulse** (enterprise agent control plane). Research maturity; live vs design called out below and in linked posts.

---

## Problem shape

**Data:** Partner corpora improve models; a shared lake concentrates sovereignty and liability. Bilateral agreements do not gate compute at machine speed.

**Agents:** Value requires write-capable tools. That makes the agent a privileged identity. Eval-harness disclosures (Anthropic, OpenAI, and peers) showed models exploiting ordinary weaknesses when “sandbox” assumptions failed—prompt text was never the boundary.

Needed for both: **agreements the runtime can enforce**, **isolation**, and **decision evidence**.

---

## Three layers

### 1. CAN — multi-party training under contract

Catalog metadata → Ricardian contract → policy-bound train → provenance for GRC. Roles: TDP / TDC / TSP·CCRP. Design roots: iSPIRT [DEPA](https://depa.world). UI path: [product tour]({{ '/product-tour/' | relative_url }}).

### 2. Open-GMASE — agents propose; infrastructure decides

Workload identity, pre-tool policy (OPA), typed parameters. Apache 2.0 reference under [`open-gmase-core`](https://github.com/gitmujoshi/Confidential-AI-Network/tree/main/open-gmase-core).

### 3. CompliancePulse — enterprise control plane

Policy packs, multi-tenant ops, IdP integrations, investigation-oriented audit views on top of the open foundation.

---

## How the layers relate

| Question | Layer |
| --- | --- |
| Who may train on whose data? | **CAN** contracts and roles |
| Where does training run? | Clean rooms / isolated environments under those contracts |
| May this agent change production *now*? | **Open-GMASE / CompliancePulse** gate *before* the tool |
| What do auditors see? | Contract trail + job provenance + agent decision logs |

Enterprise IdP for humans; short-lived attested identities for workloads. Cloud IAM is necessary outer fence, not sufficient when the model invents the action.

---

## Live today (local)

Open-GMASE OPA gates **training start** and **inference deploy/predict**; decisions land in CAN AuditLogs and forward by default to CompliancePulse at `http://localhost:3001` (`COMPLIANCEPULSE_INGEST_URL=false` to disable). Swarm UI, SPIRE attestation, and multi-tenant CP SaaS remain research.

→ [Demo slice]({% post_url 2026-08-14-can-gmase-demo-slice %}) · [Product tour]({{ '/product-tour/' | relative_url }}) · [Contract → prediction]({% post_url 2026-08-14-can-contract-to-prediction %})

Deeper: [Building CAN]({% post_url 2026-07-29-building-confidential-ai-network %}) · [G-MASE]({% post_url 2026-08-14-gmase-deep-dive %}) · [CompliancePulse]({% post_url 2026-08-14-compliancepulse-ai-deep-dive %}) · [Agent attack matrix]({% post_url 2026-07-31-governing-autonomous-ai-agents-cybersecurity %}) · [Unified framework]({% post_url 2026-08-14-unified-governed-agentic-secops-framework %})
