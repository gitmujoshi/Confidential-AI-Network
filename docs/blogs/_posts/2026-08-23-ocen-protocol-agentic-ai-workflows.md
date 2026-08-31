---
layout: post
title: "When agentic workflows cross firms, what is the protocol layer?"
date: 2026-08-23
categories: [architecture, agents]
tags: [agentic-ai, protocols, credit, architecture, andrew-ng]
permalink: /architecture/2026/08/23/ocen-protocol-agentic-ai-workflows/
published: false
excerpt: "An agent can talk through a cross-company workflow. It cannot be the record of it. The missing layer is a protocol core: one object, roles, signed transitions the model does not skip."
---

> Running bottom-up AI point solutions — letting a thousand flowers bloom — has failed to yield major returns. The big gains come from workflow redesign: taking a top-down view of the process and changing how execution steps work together end-to-end.  
> — Andrew Ng

Inside one company, “redesign the workflow” is a graph you own. Tools, retries, the database row that says the step happened — all yours. LangGraph is a reasonable way to write that graph.

The interesting work does not stay there. Someone else holds the data. Someone else holds the money. Someone else has to live with the legal consequence. The model can narrate those steps. It cannot *be* the record of them, because the other firm never agreed that your process memory is the truth.

That is the gap this note is about. Not “use more tools.” Not a bigger model. What the other firm will execute against when your agent calls out.

---

## Where the record sits today

In practice the originator rebuilds the workflow in glue. Each vendor behind a role has its own object. The “application” is a hashmap in the agent runtime: this id, that id, a boolean you set when a 200 came back. `kyc_ok`. `offer_accepted`. `ready_to_fund`.

That ships. It even looks like an end-to-end graph in a demo, because the demo has one data source, one capital source, and a scripted borrower.

Two things go wrong as soon as it is real.

First, **the next firm is not on that hashmap.** They have their own loan id, their own KYC file, their own notion of whether consent exists. To add them you do not “join a network.” You open another integration: new OAuth, new webhooks, new mapping of *their* statuses onto *your* flags. The agent’s tool list grows. The graph in the slide deck stays the same; the system does not.

Second, **nothing the counterparty signed will stop a bad transition.** If the agent calls disburse after a half-finished KYC, the only brake is an if-statement someone wrote in the originator. The lender did not write that if-statement. The data party did not either. Retries make this worse: agents re-fire tools. Humans at least hesitate. A second `disburse` against a local flag is an incident, not a protocol error with a code the other side understands.

Disputes are the ugly version of the same fact. Six months later the borrower says they never agreed to the pull. The originator has `consented=true`. The data vendor has a session log in a different clock. The lender has a PDF. There is no single object to point at.

Ng’s credit example — shave a few percent off one review step, or actually get a decision in minutes instead of weeks — assumes a *path* that every party already speaks. Glue gives you hops. Hops are not a path.

---

## What a protocol core is for

Put a core in the middle that parties implement, and keep agents on the edge. The core is not an orchestrator you run as a courtesy for everyone else. It is the thing they run against even when they do not trust your LangGraph.

```text
   [ Agent ]
     turns messy intent into a transition request
        │
        ▼
   [ Protocol core ]
     registry    this principal is this role, these keys
     object      one id; everyone names the same work
     machine     from this state, these messages are legal
     evidence    the transition was signed; it can be shown later
        │
        ├──── party that holds data / consent
        ├──── party that holds capital
        └──── party that settles
```

**The object.** Pick one type per network: an application, an order, a claim. Every message names `objectId`. When the lender says “which file?”, they do not mean your Alloy id or their LOS id as the *network* name. They mean this object. Idempotency hangs off the object plus a `requestId`. Two agent retries are one transition, not two loans.

**The machine.** States and transitions are published. `request_offers` is a message with a schema. `disburse` is a different message. The core accepts a call only if (a) the caller’s role may fire it and (b) the object is in a state where that fire is legal. The agent is not asked to remember the rules. If it sends `disburse` while the object is still `OFFERED`, the response is a refusal with a reason the lender’s system can log. Your prompt cannot override that, which is the point.

**The registry.** Joining the network is “here is our role and our keys,” not “please become a client of each of our vendors.” Behind a role, a party can still use whatever KYC or core-banking software they already pay for. The core does not need to love that software. It needs a principal it can authenticate and a mapping from that principal to a role on a given object.

**Evidence.** Each accepted transition is signed by the party that fired it (and acknowledged by the core). When the agent retries, when a lawyer asks, when two logs disagree, you do not reconstruct a story from vendor dashboards. You replay the object.

Consent belongs *on the object* if the workflow has a consent step. Then revoke is another transition on the same id, visible to whoever was allowed to see the original. It is not a checkbox in a product the capital party never had an account on.

Vendors do not disappear. They sit under roles, the way a browser sits under HTTP. The network is not a new KYC company.

---

## Credit, walked

A payment is “move this amount.” A loan is a judgment. The originator cannot invent the rate. Several lenders might look; one will book. Data and settlement are often someone else again. That is already a multi-party graph. Minutes-not-weeks only happens if they share one `application`.

Roles: originator (faces the borrower), data party, lender, settlement. Sketch of the machine:

```text
CREATED
  → CONSENTED          data party / borrower, not the agent’s diary
  → OFFERED            lenders write terms; originator does not
  → ACCEPTED           one lender from here
  → SIGNED
  → REPAYMENT_SET
  → GRANTED
  → DISBURSED
```

The borrower says they need forty-two thousand against a purchase order in two days. The originator’s agent is allowed to turn that into `create` and, once consent exists, `request_offers`. It is not allowed to write `DISBURSED`.

```json
{
  "objectId": "app-e2e-001",
  "requestId": "req-17",
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

`request_offers` fans out to lenders on that product because the machine says so. A new lender implements the messages, puts keys on the registry, and starts seeing objects they are eligible for. Nobody adds a tool to the originator agent for that lender.

If two lenders offer, the object holds both offers. Accept picks one; the machine collapses the conversation. If the agent sends `disburse` before `SIGNED`, the core refuses. The lender’s books never see a ghost drawdown that then has to be unwound by email.

Underwriting stays inside the lender. The protocol does not score the borrower and does not put an interest rate in the originator’s mouth. It only makes the *path* — consent, offer, signature, repayment instruction, grant — the same object on both sides of the boundary. When the yes is no, the object records a reject transition, not a missing webhook.

A year later, if someone asks whether consent existed, you do not argue about three dashboards. You look at whether `CONSENTED` was an accepted, signed transition on `app-e2e-001`.

---

## What this is not

It is not a marketplace. It is not “replace the bank.” It is not an agent framework. LangGraph can still sit on the originator edge and parse email. MCP can still wrap tools. Those are how *one* party builds software. They are not how two parties agree what happened.

It also does not require a public utility. A closed set of banks and originators can run the same core. The test is simple: can a new participant join by implementing the messages, or only by becoming another client in someone else’s glue?

If the answer is still glue, the agent is fast and the workflow is not redesigned. It is the same hops, with a model choosing which hop to fire.
