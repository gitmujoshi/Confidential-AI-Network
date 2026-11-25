# Confidential AI Network (CAN) — Gap Decision Memo (v0.1)
Date: 2026-04-30  
Owner: Engineering  
Scope: Align this codebase with the “Confidential AI Network — Detailed Design Document” (April 2026)

## Purpose
This memo locks the **non‑negotiable requirements** from the CAN design doc and defines a **phased implementation plan** that coexists with the current Contract Management System (Keycloak + portal workflows + platform encryption) to minimize risk.

## Current State (Summary)

Updated 2026-11-24. The parallel CAN path is in the repo. Portal encryption is still a separate path.

Shipped on the CAN path:

- Job, clean-room session, escrow deadline, and the both-owner barrier. One data-key time and one model-key time. Training stays blocked until both are recorded.
- The Key Orchestrator calls each dataset owner's broker and the model publisher's broker. The caller passes `owners`. The catalog key id and contract `kmsConfigs` do not select a broker. The tech service provider hosts the session and does not hold either key.
- Local broker `MockOwnerKbs` seals to `pk_ccr` with HPKE, signs a receipt, and issues a one-minute lease. The HPKE private key stays in the API process. The attestation bundle stays simulated until a verified SEV-SNP guest report is stored. `CAN_KEY_RELEASE_PROFILE=production` refuses the mock.
- `azure-skr`, Trustee, Confidential Space, and Nitro call their endpoints after the quote check and return ciphertext. They fail closed when the endpoint or quote is missing. `azure-skr` is off unless `CAN_PRINCIPAL_KEY_MODE=azure-skr`.
- `attested-tls` accepts an HPKE-wrapped key only after `verifySevSnpQuote` succeeds. That private key is not inside a hardware TEE.
- Release policy refuses a revoked or expired contract, a replayed nonce, an unbound report, and an exhausted budget.
- SCITT stores the release receipt only when the ledger is enabled.

Still the target, not the local default:

- A hardware TEE that holds `sk_ccr` and decrypts the dataset and the model only inside that guest.
- Machine principals that authenticate without Keycloak. CAN calls still use `X-CAN-Principal-Id`.
- No-egress network enforcement for the clean room.

The portal still has Keycloak, platform-managed encryption, and local Docker training. Those paths do not call the orchestrator. The operator guide is [Datasets, models, and the clean room](../../USER_GUIDE.md#datasets-models-and-the-clean-room).

## Non‑Negotiables (v1)
These MUST be true for CAN jobs in production.

### 1) Platform cannot see principal keys or plaintext assets
- Platform services must never hold or generate **principal-owned DEK/MEK**, and must never receive plaintext datasets/models.
- Decryption happens **only inside CCR** (TEE boundary) and **keys never persist to disk**.

### 2) Attested key delivery to CCR (attestation-bound endpoint)
- CCR generates an **ephemeral TLS keypair inside TEE**.
- Attestation report must bind the ephemeral public key to the TEE identity/measurement.
- Principals verify attestation independently and only then deliver DEK/MEK over **attested TLS** to the CCR endpoint.

### 3) Dual-key escrow gating (hard timeout + teardown)
- A job cannot transition to RUNNING until **both** DEK and MEK are released.
- A hard escrow deadline (default 10 minutes) is enforced.
- On expiry/cancel, CCR session is destroyed and key material is explicitly zeroized.

### 4) Provenance / audit trail is append-only and tamper-evident
- Every major lifecycle event emits an immutable provenance record (job created, attestation ready, key released, started, completed, destroyed, escrow expired, etc.).
- Provenance must be queryable by job/contract and suitable for compliance audit.

### 5) Separation of identities
- Keycloak remains for **human portal users**.
- CAN introduces a separate notion of **machine principals** (Data Provider, Model Owner, CCR Provider, Consumer) using cryptographic identity.

## Negotiables (defer to v1.1+ unless required)
- Specific TEE backend support set (TDX vs SEV-SNP vs Nitro) can start with **local simulation** and one real provider later.
- Marketplace/billing/rate-limiting stack (Kafka/ClickHouse, etc.) can be stubbed initially.
- Post-quantum “hybrid” migration path can be planned but not implemented in v1.
- Full no-egress network enforcement can be staged, provided the functional boundary exists and is testable locally.

## Delivery Plan (Incremental, Low-Risk)

### Phase 0 — Decision + scaffolding (this sprint)
Deliverables:
- `/api/can/*` namespace in backend, isolated from existing routes.
- Minimal storage models for CAN job, CCR session, attestation.
- JCS (Job Coordination Service) state machine with hard deadline behavior.

Exit criteria:
- A CAN job can be created and transitions through escrow states in a deterministic way (even with simulated attestation + simulated CCR).

### Phase 1 — CAN MVP vertical slice (local/simulated) — shipped

The job, the session, the simulated attestation, the DEK and MEK signals, release, expiry, and provenance events are in the API. The orchestrator, the owner-broker SDK, HPKE, leases, and signed receipts are also in this phase's local path. A hardware guest quote is not.
Deliverables:
- JCS endpoints:
  - Create job (escrow OPEN, deadline set)
  - Fetch job events via SSE
  - Fetch attestation bundle (signed response)
  - Post key release signals (DEK/MEK) → BOTH_READY
  - Trigger CCR “start” once BOTH_READY → RUNNING
  - Expiry path → DESTROYED + provenance event
- CCR session state machine persisted and reconciled with JCS.
- Provenance event emission for all above events (initially to existing provenance mechanism or a dedicated append-only table).

Exit criteria:
- End-to-end demo: create job → attestation ready → DEK/MEK released → job runs → completes → destroyed.
- Expiry demo: create job → no key release → EXPIRED → CCR destroyed.

### Phase 2 — Replace key custody for CAN jobs (real) — partial

`azure-skr` returns an encrypted Key Vault blob after an Azure Attestation JWT verifies. Trustee, Confidential Space, and Nitro fail closed without their endpoint or quote. `attested-tls` requires a verified SEV-SNP quote and an `hpke1.` wrapped key. The clean-room private key is still in the API process, and the default attestation bundle is still simulated. Delivery into a hardware TEE remains the exit criterion below.
Deliverables:
- Remove any platform-generated DEK/MEK behavior from the CAN path.
- Implement principal-facing key delivery endpoint in CCR and validation logic for attested TLS binding.

Exit criteria:
- Keys are never visible to platform services in logs/memory dumps (reasonable assurance).
- Integration test proves keys are only accepted when bound to a valid attestation bundle.

### Phase 3 — Principal identity & auth
Deliverables:
- Principal registry (DID + cert chain fields) + auth endpoints (challenge/nonce, token issuance).
- Short-lived tokens for principal API calls, plus verification of contract party membership per request.

Exit criteria:
- Principals can authenticate without Keycloak; portal users continue to use Keycloak.

### Phase 4 — Infrastructure enforcement
Deliverables:
- IaC/network policies to enforce no-egress CCR nodes, VPC endpoints only, internal mTLS, WORM provenance retention, etc.

Exit criteria:
- Network controls demonstrably prevent CCR from reaching the public internet.

## Key Decisions to Confirm (defaults)
- **Parallel path**: CAN runs under `/api/can/*` without breaking existing `/api/platform-encryption/*`.
- **Local-first**: Phase 1 uses simulated attestation/CCR to validate correctness and state machine behavior.
- **Cryptography**: Align CAN path to ES256/ECDSA-P256 and 15-min JWT TTL as we implement principal auth (existing portal auth can remain RS256 initially).

## Open Risks
- The repo contains multiple overlapping implementations (TEE, encryption, training). We must avoid “accidental mixing” of CAN and legacy paths.
- Secure key handling is hard to validate without dedicated security testing; we’ll need explicit logging hygiene and test harnesses.

