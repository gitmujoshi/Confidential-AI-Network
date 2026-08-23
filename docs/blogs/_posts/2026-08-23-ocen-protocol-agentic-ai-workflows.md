---
layout: post
title: "Is India’s OCEN protocol the missing blueprint for agentic AI workflows?"
date: 2026-08-23
categories: [architecture, agents, dpi]
tags: [ocen, agentic-ai, dpi, india-stack, andrew-ng, fintech, protocols]
permalink: /architecture/2026/08/23/ocen-protocol-agentic-ai-workflows/
excerpt: "Andrew Ng’s top-down workflow redesign thesis meets India’s OCEN 4.0—deterministic multi-party credit rails as a protocol layer agentic graphs can invoke across enterprise boundaries."
---

> Running bottom-up AI point solutions — letting a thousand flowers bloom — has failed to yield major returns. The big gains come from workflow redesign: taking a top-down view of the process and changing how execution steps work together end-to-end.  
> — Andrew Ng

In recent analyses on enterprise AI architecture, Andrew Ng made a compelling case: real breakthrough value doesn't come from using an LLM to speed up an isolated task (like summarizing a PDF). It comes from **top-down workflow redesign**—re-architecting multi-step business operations into agentic execution graphs.

To illustrate this, Ng points to the commercial credit journey. Automating a single review step saves a modest ~5% in costs. But redesigning the entire process so a borrower gets approved in 10 minutes instead of two weeks redefines the product itself.

This raises an essential question for systems architects: if agentic AI requires end-to-end workflow graphs, **what serves as the underlying protocol layer when those workflows cross enterprise boundaries?**

Could India’s **Open Credit Enablement Network (OCEN 4.0)** offer a real-world blueprint for how multi-party credit graphs can operate at scale?

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

---

## How could the US implement this blueprint?

Replicating a state-backed network protocol in the US faces structural hurdles: the market runs on **private abstraction layers** rather than public infrastructure.

| Concern | India (public rail) | US (private layer) |
|---------|---------------------|--------------------|
| Data consent | Account Aggregator | Plaid, MX |
| Identity | Aadhaar | Alloy, Persona, etc. |
| Capital execution | OCEN lender registry | BaaS APIs (Column, Cross River, …) |

### A composable private graph in the US

US builders do not need a public mandate to test the thesis. Orchestrating private API nodes into standardized handoffs yields a **composable credit graph**:

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

When private US APIs share handoff schemas, the end goal is the same: replace slow, point-automated underwriting with an autonomous **execution** graph—not only an internal chat graph.

---

## Takeaway

Is OCEN definitively the only way to build agentic financial systems? No. It is a compelling framework for a fundamental software challenge:

**AI agents cannot execute end-to-end workflow redesigns in a vacuum.** Complex multi-party operations need intelligent reasoning at the edges **and** standardized, deterministic protocol graphs at the core.

Related on this site: [G-MASE deep dive]({% post_url 2026-08-14-gmase-deep-dive %}) (governed agent execution) · [CAN CISO overview]({% post_url 2026-08-14-governed-ai-enterprise-ciso-overview %}) (contracts for multi-party AI) · LinkedIn companion: [`docs/marketing/LINKEDIN_OCEN_AGENTIC_WORKFLOWS.md`](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/marketing/LINKEDIN_OCEN_AGENTIC_WORKFLOWS.md).

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
| **Product Registry** | Where lenders publish machine-readable credit products. |
| **UPI** | India’s real-time interoperable payment network (NPCI). |

---

## References

- Ng, Andrew. (2026). *Winning in the Agentic Era* — Bain & Company Insights.
- Ng, Andrew. (2026). *AI Won't Replace Workers. It Will Redesign Work* — keynote.
- iSPIRT Foundation. (2023–2024). [OCEN 4.0](https://ocen.dev) API specifications & product network docs.
- Sahmati / India Stack. Account Aggregator architecture.
- GeM Sahay pilot reports — PO cash-flow lending via OCEN for MSMEs.
