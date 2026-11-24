# Owner Key Broker SDK

The CCR Key Orchestrator calls this SDK once per owner. The broker decides whether to release. The orchestrator does not.

Module: `backend/sdk/owner-kbs.js`.

## Local broker

`MockOwnerKbs` is the local and dev broker. `holdKey` keeps the owner key in that process. `issueNonce` returns a single-use nonce. `release` checks the nonce, the contract, the bound report data, and the release budget, then seals the key to an `hpke1.` public key with HPKE and zeroes the local copy. An older RSA public key still uses RSA-OAEP. The response includes a signed receipt and a one-minute lease. `renewLease` extends that lease only while it is still valid. `keyStored` is `false`. A production profile refuses this broker.

`ProductionOwnerKbs` is the owner process. It refuses a mock quote. After `verifyOwnerEvidence` accepts the quote, its provider returns the key and the broker seals it with HPKE. A provider may instead return an already encrypted cloud blob. That blob is not decrypted.

## Owner HTTP service

`ownerKbsHandlers(kbs)` returns `nonce`, `release`, and `lease` Express handlers.

```js
const express = require('express');
const { MockOwnerKbs, ownerKbsHandlers } = require('./owner-kbs');

const kbs = new MockOwnerKbs({ ownerId: 'did:can:tdp', keyType: 'DEK' });
const handlers = ownerKbsHandlers(kbs);
const app = express();
app.use(express.json());
app.post('/kbs/nonce', handlers.nonce);
app.post('/kbs/release', handlers.release);
app.post('/kbs/lease', handlers.lease);
```

An owner can replace `MockOwnerKbs` with their own object that implements `issueNonce()` and `release({ nonce, pkCcr, contract, evidence, budget })`.

## Orchestrator

`HttpOwnerKbsClient` posts to `{endpoint}/nonce`, `{endpoint}/release`, and `{endpoint}/lease`. A connection failure is `KBS_UNAVAILABLE` and does not release a key. `orchestrateRenew` blocks output when one owner refuses to renew.

`orchestrateRelease({ owners, pkCcr, contract })` calls every owner in parallel. `owners[]` entries are `{ ownerId, keyType, endpoint }` or `{ ownerId, keyType, client }`. One refusal drops the wrapped keys from that round.

`POST /api/can/jcs/jobs/{jobId}/orchestrate` runs that against the job's clean-room public key. The response does not include key bytes.
