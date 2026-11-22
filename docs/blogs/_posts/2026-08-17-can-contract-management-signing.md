---
layout: post
title: "Contract management in CAN — party signing keys, sign gates, and verification"
date: 2026-08-17
categories: [product, security]
tags: [can, contracts, signing, keys, ricardian, verification, key-vault, depa]
permalink: /product/2026/08/17/can-contract-management-signing/
excerpt: "How Confidential AI Network manages Ricardian contracts end to end: party signing keys, multi-party sign gates, database signing by default, and Key Vault signing when that backend is turned on."
canonical: docs/features/contract-signing/CONTRACT_SIGNING_TECHNICAL_REFERENCE.md
---

*Contracts in CAN are not “upload a PDF.” They are lifecycle state: create → party signs → **SIGNED** → train may start. Signing keys are a separate custody story from DEK/MEK.*

**Related:** [Ricardian contracts]({% post_url 2026-08-16-ricardian-contracts-in-can %}) · [Contract → prediction]({% post_url 2026-08-14-can-contract-to-prediction %}) · [KMS DEK/MEK]({% post_url 2026-08-16-can-kms-dek-mek-escrow %}) · [Azure CC / Key Vault]({% post_url 2026-08-17-azure-confidential-computing-deep-dive %}) · [Merkle / Auditor]({% post_url 2026-08-16-merkle-trees-model-audit %}) · [Product tour]({{ '/product-tour/' | relative_url }}) · In-repo: [CONTRACT_SIGNING_TECHNICAL_REFERENCE.md](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/features/contract-signing/CONTRACT_SIGNING_TECHNICAL_REFERENCE.md) · [CONTRACT_SIGNING_USER_GUIDE.md](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/features/contract-signing/CONTRACT_SIGNING_USER_GUIDE.md)

> **Status:** Sign authorization (who may set `tdpSigned` / `tspSigned` and reach `SIGNED`) is **live**. The default signing backend is the database. `SIGNING_KEY_BACKEND=azure-keyvault` or `azure-mhsm` creates an EC P-256 key in Key Vault, stores the public key and key id only, and verifies the signature before it is accepted. Party **signing keys** are distinct from DEK/MEK.

---

## 1. Two key classes (do not conflate)

| Key class | Purpose | Owner | Lives where (target) |
| --- | --- | --- | --- |
| **Party signing key** | Bind a human/org to the Ricardian agreement | Each party (TDC / TDP / TSP) | Database by default. Key Vault or Managed HSM when `SIGNING_KEY_BACKEND` is set; the app then stores the public key and key id |
| **DEK** | Encrypt dataset ciphertext | **TDP** | Customer vault / HSM → TEE only after attestation |
| **MEK** | Encrypt base model ciphertext | **TDC** | Same pattern |

Signing keys answer: *Did this party approve **these** terms?*  
DEK/MEK answer: *May plaintext exist in the clean room for this job?*

Mixing them in one “KMS” slide confuses CISOs.

---

## 2. Contract management lifecycle

```mermaid
stateDiagram-v2
  [*] --> PENDING_TDP_APPROVAL: TDC creates Ricardian
  PENDING_TDP_APPROVAL --> PENDING_TSP_APPROVAL: Linked TDP signs
  PENDING_TSP_APPROVAL --> SIGNED: Assigned TSP signs
  SIGNED --> Training: TDC starts job (gate)
  SIGNED --> Inference: Deploy under contractId
  SIGNED --> Audit: Auditor Merkle + contract review
```

| Stage | What happens | Primary APIs / artifacts |
| --- | --- | --- |
| **Create** | Wizard → legal template + machine bindings → `legalDocumentHash` | `POST /api/contracts/ricardian` |
| **Notify** | Linked TDPs / assigned TSP get signature requests | Notifications |
| **Sign** | Party posts signature payload; status advances | `GET …/signing-data` · `POST …/sign` |
| **SIGNED** | Training allowed | `status === 'SIGNED'` (TSP completion in current flow) |
| **Evidence** | SCITT `contract_approval`, Merkle **contract** leaf, provenance | Auditor UI |

Human-readable terms + machine fields are covered in the [Ricardian post]({% post_url 2026-08-16-ricardian-contracts-in-can %}). This post focuses on **keys, sign, and verify**.

---

## 3. How party signing keys are managed today

### 3.1 Data model

Keys are stored as **`UserKey`** rows (`user_keys`):

| Field | Role |
| --- | --- |
| `userId` | Party user who owns the key |
| `keyId` | Unique key id |
| `keyType` | e.g. `ECDSA-P256`, `RSA-2048`, `RSA-4096` |
| `publicKey` | PEM / JWK — what verifiers should use |
| `privateKey` | Optional TEXT — **should not** be platform plaintext in prod |
| `keyStatus` | `active` / `inactive` / `revoked` / `expired` |

APIs under `/api/signing` (authenticated):

| Endpoint | Behavior |
| --- | --- |
| `GET /api/signing/keys` | List active keys (metadata; not private material in list) |
| `POST /api/signing/keys/generate` | Generate pair via `keyManagementService`; persist key metadata |
| `POST /api/signing/keys/import` | Import key material / public |
| Events | `SigningEvent` rows for generate / import / use |

Config is env-driven (`KEY_ALGORITHMS`, `DEFAULT_KEY_ALGORITHM`, `KEY_ID_PREFIX`, …). The service can encrypt private PEM with a password helper; production design is **not** “store raw PEM forever in Postgres.”

### 3.2 What the live Contract Detail path actually does

On the primary UI path (`ContractDetail`):

1. `GET /api/contracts/:id/signing-data` → builds a **message** and **SHA-256 `contractHash`**.  
2. UI sets `signature` to that hash **or** a `ui-{party}-…` placeholder.  
3. `POST /api/contracts/:id/sign` with `{ signature, partyType, did?, walletAddress? }`.  
4. Backend checks **auth**: JWT party type, linked TDP / assigned TSP (`contractSigningGate`).  
5. Appends entry to `legalDocument.signatures[]`, sets `tdpSigned` / `tspSigned`, advances status.  
6. Best-effort SCITT `contract_approval` claim.

The gate that starts training is still **an authenticated party allowed to sign, and status `SIGNED`**. With the Azure signing backend, the API also verifies the Key Vault signature before it accepts the signature.

### 3.3 Richer signing surfaces (partial)

There are additional components (`ContractSigning`, DID modal, `es256sign.js` WebCrypto, `/api/signing/sign`) aimed at stronger crypto/DID flows. Additional scaffolding for stronger crypto/DID; product-tour clicks are not HSM-verified end-to-end.

---

## 4. Sign authorization (what is enforced)

```text
Authenticated user
  → partyType must match claimed partyType (rolesAllowSigning)
  → TDP: must be linked dataset owner (unless AppAdmin)
  → TSP: must be contract.tspId (unless AppAdmin)
  → Append legalDocument.signatures[]
  → TDP → PENDING_TSP_APPROVAL (typical)
  → TSP → SIGNED
```

**Runtime note:** Training checks **`status === 'SIGNED'`**, reached when the **assigned TSP** completes the current flow. A `tdcSigned` column may exist; do not assume “all three roles must crypto-sign” is what local train enforces. Prefer the live path above ([Ricardian §4.2]({% post_url 2026-08-16-ricardian-contracts-in-can %})).

**Auditor** never signs — read-only Merkle + contract review.

---

## 5. Verification — today vs target

### 5.1 Today

| Check | Status |
| --- | --- |
| Role / linkage authz on `POST …/sign` | **Met** |
| Persist signature blob + metadata | **Met** (in `legalDocument.signatures`) |
| `verifyDIDSignature` helper (`didService.verifySignature`) | **Exists** — **not wired** into the main sign route |
| `SIGNING_KEY_BACKEND` | `database` by default. `azure-keyvault` or `azure-mhsm` signs in Key Vault and verifies before accept |
| Independent re-verify of all signatures before train | **Not** the hard gate today — **status** is |

### 5.2 Azure signing backend

This path is implemented and stays off until `SIGNING_KEY_BACKEND` is `azure-keyvault` or `azure-mhsm`.

| Step | Behavior |
| --- | --- |
| Generate | Create an EC P-256 key in **Key Vault / Managed HSM**; the app stores the **key id and public key** |
| Sign | The API calls Key Vault **sign** and verifies the signature before it is stored |
| Verify | A failed verification is rejected |
| Audit | SCITT claim + Merkle contract leaf include hash + signature metadata |

Naming pattern (Azure): `can-{env}-user-sign-{depaId}` — see [Azure security architecture §16.4](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/production/AZURE_SECURITY_ARCHITECTURE.md).

```mermaid
sequenceDiagram
  participant Party
  participant UI
  participant CAN as CAN API
  participant KV as Key Vault / MHSM
  participant DB

  Party->>UI: Approve terms
  UI->>CAN: GET signing-data (message / hash)
  UI->>CAN: POST sign (signature, partyType, keyId/did)
  CAN->>KV: Sign and verify when the Azure backend is on
  KV-->>CAN: Signature
  CAN->>CAN: Authz gate
  CAN->>DB: signatures[] + status
  CAN-->>UI: SIGNED or next pending
```

---

## 6. What “verification” means for auditors

| Question | Mechanism |
| --- | --- |
| Was this party allowed to approve? | Authz + linkage at sign time |
| What exact legal bytes? | `legalDocumentHash` |
| Who recorded approval? | `legalDocument.signatures[]` + SCITT `contract_approval` |
| Is the hash in the audit tree? | Auditor **Verify** = Merkle **inclusion** under published root — not “model was ethical” ([Merkle post]({% post_url 2026-08-16-merkle-trees-model-audit %})) |
| Was the ECDSA signature valid? | Verified when the Azure signing backend is on. The default database path records the signature after the authorization check |

---

## 7. Maturity matrix

| Capability | Local demo today | Azure / prod target |
| --- | --- | --- |
| Create Ricardian + hash | Live | Live |
| Multi-party sign → SIGNED | Live (authz) | Live + crypto verify |
| Party keys in `UserKey` | Live (public / partial private) | Key id + public only |
| Private key in Postgres | Gap / demo risk | **Forbidden** — HSM only |
| WebCrypto / DID verify on sign | Partial / not main UI | Required when claimed |
| Key Vault sign ops | Off unless `SIGNING_KEY_BACKEND` is set | On for production |
| Train gated on SIGNED | Live | Live |
| DEK/MEK escrow | Separate path | Separate path + SKR |

---

## 8. Operator checklist (signing go-live)

- [ ] `SIGNING_KEY_BACKEND=azure-keyvault` (or MHSM); no private PEM in DB  
- [ ] `SIGNING_REQUIRE_CRYPTO_VERIFY=true`  
- [ ] `SIGNING_REQUIRE_DID_VERIFY=true` when DID is present  
- [ ] Sign message binds **`legalDocumentHash`** (not only a timestamp string)  
- [ ] Train start optionally re-checks signature set / status  
- [ ] Pen test: forged signature blob with wrong role / wrong party rejected  
- [ ] Keep DEK/MEK release APIs free of signing-key material and vice versa  

---

## 9. Takeaways

1. **Party signing keys** prove agreement; **DEK/MEK** unlock clean-room plaintext — different custody.  
2. **Contract management** is a state machine: create → TDP → TSP → **SIGNED** → train/infer/audit.  
3. **The hard gate for training** is **authenticated authorization and status `SIGNED`**.  
4. **Key Vault signing** is implemented. It stays off until `SIGNING_KEY_BACKEND` is `azure-keyvault` or `azure-mhsm`, and then the private key is not stored in the database.  
5. Auditors verify **lineage under Merkle** and read the Ricardian. That check is separate from the signing backend.

**One sentence:** CAN manages contracts as lifecycle state, gates training on who may mark a contract **SIGNED**, and can sign that approval in Key Vault when the Azure signing backend is turned on.
