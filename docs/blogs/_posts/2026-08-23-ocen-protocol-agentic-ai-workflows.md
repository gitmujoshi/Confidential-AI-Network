---
layout: post
title: "When agentic workflows cross firms, what is the protocol layer?"
date: 2026-08-23
categories: [architecture, agents]
tags: [agentic-ai, protocols, credit, architecture, andrew-ng]
permalink: /architecture/2026/08/23/ocen-protocol-agentic-ai-workflows/
excerpt: "Agent graphs stop at the firm boundary. The layer on the other side is a protocol: one shared object, roles, signed transitions the model does not get to skip."
---

> Running bottom-up AI point solutions — letting a thousand flowers bloom — has failed to yield major returns. The big gains come from workflow redesign: taking a top-down view of the process and changing how execution steps work together end-to-end.  
> — Andrew Ng

Inside one repo that redesign is a graph of tools you own.

It breaks when a step has to land at another company — their data, their yes, their ledger. The model can describe the step. It cannot be the record of it.

Today the record lives in the originator’s glue: a pile of vendor ids and flags (`kyc_ok`, `offer_accepted`) that the next firm never signed. Add a counterparty and you duplicate the glue. That is an integration, not a path they already speak.

---

## Architecture

Put a **protocol core** in the middle. Agents stay on the edge.

```text
   [ Agent ]  intent → transition request
        │
        ▼
   [ Protocol core ]
     registry     who is this role, with which keys
     object       one id every party uses
     machine      which transitions exist from this state
     evidence     signed, so the other side can verify
        │
        ├──── data / consent party
        ├──── capital party
        └──── settlement party
```

The core holds the **workflow object** (an application, an order, a claim — one type per network). Every participant reads and writes *that* object, not a private foreign key in someone else’s orchestrator.

Transitions are named and typed. `request_offers` is a message. `disburse` is a message. The core accepts a transition only from a role that is allowed to fire it in the current state. The agent’s job is to emit a valid message. If it emits `disburse` from `OFFERED`, the core returns a refusal. Not a prompt reminder — a refusal.

Identity on the core is a **role on the registry**, not an OAuth client to each vendor behind the scenes. Vendors can still exist under a role. The network does not care which KYC product a party uses, any more than TCP cares which browser you run. It cares that the party is bound, the object is shared, and the transition is legal.

Consent, if the workflow needs it, is a transition on the same object — so revoke and audit trail sit with the application, not in a side product the lender never sees.

---

## Credit, as a walkthrough

A loan is a *yes* each lender keeps, not a payment instruction. The parties are already split: whoever faces the borrower, whoever holds data, several lenders, whoever settles. Ng’s ten-minute path only exists if those parties share one application.

Object: `application`. Roles: originator, data party, lender, settlement. Machine (sketch):

```text
CREATED
  → CONSENTED
  → OFFERED          (lenders write; originator does not invent a rate)
  → ACCEPTED         (one lender from here)
  → SIGNED
  → REPAYMENT_SET
  → GRANTED
  → DISBURSED
```

The originator’s agent turns “need $42k against this PO in two days” into a create/consent/request-offers payload. It does not set `DISBURSED`.

```json
{
  "objectId": "app-e2e-001",
  "from": "role:originator",
  "transition": "request_offers",
  "body": {
    "amount": 42000,
    "currency": "USD",
    "tenureDays": 30,
    "purpose": "po-working-capital"
  }
}
```

Fan-out is a property of the machine (`request_offers` goes to lenders on the product), not a sales cycle of new integrations. A new lender implements the messages and joins the registry. The agent’s tool list does not grow.

Underwriting stays with the lender. The protocol never commoditises the *yes*. It only makes the *path* to that yes the same object on both sides.

---

Same shape for any cross-firm graph: one object, roles, signed transitions, agents only at the edge. The model fills the request. The core decides if the next state is allowed.
