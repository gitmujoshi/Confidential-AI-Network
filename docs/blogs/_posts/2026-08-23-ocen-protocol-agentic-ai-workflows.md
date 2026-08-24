---
layout: post
title: "Is India’s OCEN protocol the missing blueprint for agentic AI workflows?"
date: 2026-08-23
categories: [architecture, agents, dpi]
tags: [ocen, agentic-ai, dpi, india-stack, andrew-ng, fintech, protocols]
permalink: /architecture/2026/08/23/ocen-protocol-agentic-ai-workflows/
excerpt: "Andrew Ng’s workflow-redesign thesis meets OCEN 4.0: a concrete loan-application state machine (intent → JSON → offer → e-sign → e-NACH)—and an honest look at why that protocol has not become UPI."
---

> Running bottom-up AI point solutions — letting a thousand flowers bloom — has failed to yield major returns. The big gains come from workflow redesign: taking a top-down view of the process and changing how execution steps work together end-to-end.  
> — Andrew Ng

In recent analyses on enterprise AI architecture, Andrew Ng made a compelling case: real breakthrough value doesn't come from using an LLM to speed up an isolated task (like summarizing a PDF). It comes from **top-down workflow redesign**—re-architecting multi-step business operations into agentic execution graphs.

To illustrate this, Ng points to the commercial credit journey. Automating a single review step saves a modest ~5% in costs. But redesigning the entire process so a borrower gets approved in 10 minutes instead of two weeks redefines the product itself.

This raises an essential question for systems architects: if agentic AI requires end-to-end workflow graphs, **what serves as the underlying protocol layer when those workflows cross enterprise boundaries?**

India’s **Open Credit Enablement Network (OCEN 4.0)** is the most concrete public example of that protocol layer for credit—not because it became “UPI for loans,” but because it already specifies roles, async APIs, and a loan-application state machine that agents can invoke without inventing the execution path.

*Note: This essay is adjacent to Confidential AI Network (CAN). CAN applies a similar “protocol + governed execution” idea to multi-party **training**; OCEN applies it to multi-party **credit**. Both sit in the broader India Stack / iSPIRT design lineage (alongside [DEPA](https://depa.world)).*

---

## The bottleneck: why agentic software graphs hit an execution wall

When developers build agentic workflows in code frameworks (LangGraph, AutoGen, CrewAI), they define execution nodes, state transitions, and tool calls within a **single software environment**.

The moment an AI agent attempts to execute a financial workflow across **independent companies**, it hits an interoperability wall:

```text
                  [ SOFTWARE AGENTIC GRAPH ]
                     (LangGraph / AutoGen)
                     Conversational Intent
                             │
                             ▼
  ┌──────────────────────────┼──────────────────────────┐
  │                          │                          │
  ▼                          ▼                          ▼
[Data Extraction]     [Risk Scoring]         [Offer Matching]
  │                          │                          │
  └──────────────────────────┼──────────────────────────┘
                             │
                             ▼
                     [ EXECUTION WALL ]
          (No standard APIs to talk to external banks,
           consent platforms, or repayment rails)
```

Without a unified network protocol:

- An agent cannot pull verified, real-time cash-flow data without manual document uploads.
- It cannot broadcast structured loan requests to multiple independent lenders simultaneously.
- It lacks a universal settlement rail to execute e-signatures and automated repayment mandates.

An agentic software graph is only as powerful as the **network protocol** it can invoke outside its own environment.

---

## Bridging Silicon Valley “brains” with DPI “rails”

The key to solving this execution bottleneck is synthesizing two different technology philosophies:

| Layer | Strength | Examples |
|-------|----------|----------|
| **Silicon Valley intelligence** | Think, plan, adapt | Frontier LLMs, multi-modal reasoning, agentic orchestration |
| **India DPI protocol** | Open rails to *act* at population scale | Aadhaar, UPI, Account Aggregator, **OCEN**, ONDC |

Without open protocols, AI agents risk becoming “brains in a jar”—strong at reasoning, blocked whenever they touch banking, identity, or settlement.

Without agents on the edges, open protocols remain static rails waiting for human-driven software. The breakthrough is connecting the two: **autonomous reasoning at the edges driving deterministic, protocol-based execution at the core.**

---

## Why OCEN can be read as a protocol answer to workflow graphs

Developed as part of India’s DPI (by [iSPIRT](https://ispirt.in/)), **OCEN 4.0** takes the core components of a workflow graph and codifies them into an open, multi-party network protocol.

### 1. A protocol *is* a network-level graph

In software, a graph consists of nodes, edges, and state objects. OCEN standardizes those primitives across independent market participants:

```text
                            ┌────────────────────────────────┐
                            │     Participant Registry       │
                            │  (Identity & Public Key Auth)  │
                            └───────────────┬────────────────┘
                                            │
                                            ▼
┌──────────────────┐               ┌─────────────────┐               ┌──────────────────┐
│ Loan Agent (LA)  │ ────────────► │  Product Reg.   │ ◄──────────── │ Lenders (Banks)  │
│ (Embeds Credit)  │  Offer Req.   │  (Offer Bids)   │  Publishes    │ (Capital Engine) │
└────────┬─────────┘               └─────────────────┘               └────────┬─────────┘
         │                                                                    │
         │               ┌────────────────────────────────────┐               │
         ├─────────────► │  Derived Data Partner / AA (Data)  │ ◄─────────────┤
         │               └────────────────────────────────────┘               │
         │               ┌────────────────────────────────────┐               │
         └─────────────► │ Disbursement & Collections Partner │ ◄─────────────┘
                         └────────────────────────────────────┘
```

- **Nodes (actors):** Loan Agents (borrower interfaces), Derived Data Partners (consent / derived credit inputs), Lenders (capital), Collections Partners.
- **Edges (transitions):** Open, standardized REST/JSON APIs for offer request, evaluate, e-sign, e-NACH.
- **Graph state:** Standardized objects that track a loan deterministically from intent to collection.

### 2. Deterministic protocol core + agentic edges

Financial regulators demand strict auditability—an LLM cannot invent interest rates or skip compliance steps.

OCEN-style designs decouple reasoning from execution:

- **Protocol core (deterministic):** Enforces state machines for origination, consent verification, and repayment setup.
- **Network edges (agentic):** Agents translate unstructured voice, regional language, or invoice scans into the precise JSON the protocol graph requires.

That pattern—**deterministic core, agentic edges**—is the architectural lesson beyond India credit.

### 3. Walkthrough: intent → OCEN JSON → e-sign / e-NACH

Take a GeM-style working-capital ask—the kind of flow OCEN was actually built to carry:

> “Purchase order GEMC-5116877-5754010-1, ₹4.2 lakh, need funds in 48 hours against the PO.”

An LLM at the Loan Agent edge can parse GSTIN, amount, tenure, and product-network membership. It cannot invent an interest rate, skip Account Aggregator consent, or mark the loan disbursed. Those steps belong to the protocol.

**Step 1 — the agent emits a `CreateLoanApplicationRequest`.** Fields below are an illustrative subset of [OCEN 4.0](https://ocen.dev/docs/api_design_principles/); live calls are async, JWS-signed, and keyed by `requestId` for idempotency.

```json
{
  "metadata": {
    "version": "4.0.0",
    "originatorOrgId": "org-loan-agent-gem",
    "originatorParticipantId": "la-gem-sahay",
    "timestamp": "2026-08-24T12:01:00Z",
    "traceId": "trc-9f3a…",
    "requestId": "req-e2e-001"
  },
  "productData": {
    "productId": "po-working-capital-30d",
    "productNetworkId": "pn-gem-sahay"
  },
  "loanApplications": [{
    "borrower": {
      "primaryId": "AAACU1234F",
      "primaryIdType": "PAN",
      "category": "ORGANIZATION",
      "name": "Usha Components Pvt Ltd",
      "aaIdentifier": "aa-id-…"
    },
    "terms": {
      "requestedAmount": 420000,
      "currency": "INR",
      "tenure": { "duration": 30, "unit": "DAY" }
    },
    "pledgedDocuments": {
      "source": "GSTN",
      "type": "GSTN_B2B_INVOICE",
      "format": "JSON",
      "reference": "GEMC-5116877-5754010-1"
    }
  }]
}
```

**Step 2 — the network, not the model, advances state.** The Loan Agent fans the application to every lender in the product network. Each lender returns `CreateLoanApplicationResponse` (`PROCESSING` or reject). Consent APIs collect one AA consent and forward it. Offer APIs return machine-readable bids. After the borrower accepts, the conversation collapses from many lenders to one, and the application walks a published status machine:

```text
intent (voice / PO / invoice)
        │  agent → structured JSON
        ▼
CreateLoanApplicationRequest  ──►  lenders in product network
        │  async ack (requestId)
        ▼
AA consent  →  offers  →  accept offer
        ▼
KYC  →  loan agreement (e-sign)
        ▼
repayment setup (e-NACH / UPI mandate)
        ▼
disbursement account  →  grant  →  disburse
```

Statuses the graph already knows: `CREATED` → `CONSENT_RECEIVED` → `OFFERED` → `OFFER_ACCEPTED` → `KYC_COMPLETED` → `LOAN_AGREEMENT_COMPLETED` → `REPAYMENT_SETUP_COMPLETED` → `GRANTED` → `DISBURSEMENT_COMPLETED`.

The agent’s job is to fill JSON the state machine will accept. The lender’s job is to underwrite. The protocol’s job is to refuse illegal transitions—no model is allowed to jump from `OFFERED` to `DISBURSEMENT_COMPLETED`.

---

## Why OCEN is a blueprint, not UPI for credit

OCEN has not become UPI, and pretending otherwise makes the architecture claim weaker. UPI is a payment instruction with an operator (NPCI), monthly public volumes, an existing bank participant set, and years of fiscal support for adoption. A loan is an underwriting decision every lender wants to keep proprietary; a protocol can standardise the *pipes* (application, consent, offer, e-sign, e-NACH) and cannot standardise the *yes*. OCEN is a specification with no NPCI-equivalent switch, so it has no public origination dashboard. Its data layer—Account Aggregator—took until the mid-2020s to reach reliable bank coverage, years after the 2020 launch. What actually shipped at scale is still mostly government-anchored working capital (GeM Sahay, GST Sahay), not an open marketplace where any Loan Agent talks to any lender the way any UPI app talks to any bank. Lenders still prefer bilateral NBFC/fintech contracts where risk-sharing and default-loss guarantees are negotiated once, not left implicit in a shared spec.

That gap is the point for agentic systems: **the protocol shape is usable even when the market is not UPI-scale.** Agents need a deterministic graph they can call. OCEN already wrote that graph down. Adoption is a separate, harder problem—and it is why “blueprint” is the right word, not “the missing rail.”

---

## How could the US implement this blueprint?

Replicating a state-backed network protocol in the US faces structural hurdles: the market runs on **private abstraction layers** rather than public infrastructure.

| Concern | India (public rail) | US (private layer) |
|---------|---------------------|--------------------|
| Data consent | Account Aggregator | Plaid, MX |
| Identity | Aadhaar | Alloy, Persona, etc. |
| Capital execution | OCEN lender registry | BaaS APIs (Column, Cross River, …) |

### A composable private graph in the US

US builders do not need a public mandate to *test* the pattern. They do need the part OCEN actually contributed—a shared schema and registry—not just three vendor SDKs in one agent:

```text
                              ┌──────────────────────┐
                              │  US Borrower Agent   │  (LLM reasoning node)
                              │ (LangGraph / AutoGen)│
                              └──────────┬───────────┘
                                         │ Structured API payloads
       ┌─────────────────────────────────┼─────────────────────────────────┐
       ▼                                 ▼                                 ▼
┌──────────────┐                 ┌──────────────┐                 ┌──────────────┐
│ Data Consent │                 │ Risk Engine  │                 │ BaaS Lenders │
│ (Plaid / MX) │ ──────────────► │ (Alloy / …)  │ ──────────────► │ (Column / …) │
└──────────────┘                 └──────────────┘                 └──────────────┘
```

Composing Plaid + Alloy + Column is ordinary bilateral integration. The OCEN lesson is a **shared** participant/product registry and one loan-application schema every lender in the network accepts. Without that, each edge is a custom deal—and the agent is back at the execution wall. The US can test the pattern privately; it does not get the pattern for free by wiring three vendor APIs into LangGraph.

---

## Takeaway

OCEN is not the only way to build agentic financial systems, and it has not won the way UPI did. It is still the clearest public spec of a pattern agents actually need:

**Reasoning at the edges, a deterministic multi-party protocol at the core, and a state machine that will not let the model skip e-sign or e-NACH.** Without that graph, “workflow redesign” stops at the first bank that does not speak the agent’s tools.

---

## Glossary

| Term | Meaning |
|------|---------|
| **Aadhaar** | India’s national biometric digital identity used for e-KYC. |
| **Account Aggregator (AA)** | RBI-regulated DPI for consent-based financial data streaming. |
| **Agentic graph** | Architecture where agents use routing, memory, and tool loops for multi-step work. |
| **BaaS** | Banking-as-a-Service—licensed bank APIs for accounts, lending, payments. |
| **Derived Data Partner (DDP)** | OCEN node that turns raw telemetry (e.g. GST, cash flow) into underwriting inputs. |
| **DPI** | Digital Public Infrastructure—open interoperable rails at national scale. |
| **e-NACH** | NPCI electronic auto-debit mandates for recurring repayment. |
| **iSPIRT** | Think tank that helped design India Stack components including OCEN. |
| **Loan Agent (LA)** | Embeds credit in a product surface as borrower advocate. |
| **OCEN** | Open Credit Enablement Network—unbundles credit into standardized APIs. |
| **ONDC** | Open Network for Digital Commerce (Beckn-based commerce protocol). |
| **Product Network** | OCEN grouping of lenders and other roles around a product; the LA auctions an application across it. |
| **Product Registry** | Where lenders publish machine-readable credit products. |
| **UPI** | India’s real-time interoperable payment network (NPCI). |

---

## References

- Ng, Andrew. (2026). *Winning in the Agentic Era* — Bain & Company Insights.
- Ng, Andrew. (2026). *AI Won't Replace Workers. It Will Redesign Work* — keynote.
- iSPIRT Foundation. [OCEN 4.0](https://ocen.dev) — [API design principles](https://ocen.dev/docs/api_design_principles/) (async `CreateLoanApplicationRequest` / `Response`, idempotent `requestId`, JWS).
- iSPIRT. [Loan journey: auction and offer](https://github.com/iSPIRT/OCEN-Documentation/blob/main/docs/9-loan_journey/4-auction_and_offer.md) — one-to-many create / consent / offer, then collapse to one lender.
- iSPIRT / ProductNation. [Open Credit Enablement Network](https://pn.ispirt.in/open-credit-enablement-network-ocen/) — roles (LA, lender, DDP) and GeM Sahay as PO cash-flow pilot.
- Sahamati. Account Aggregator architecture and ecosystem reporting.
- NPCI. UPI product statistics — contrast: operator + public monthly volumes, which OCEN as a spec does not have.
