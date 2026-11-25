# Contract Management System — User Guide

Last updated: 2026-11-15

## 🎯 Getting Started

This guide helps you use the Contract Management System effectively. The system enables secure management of data sharing contracts between Training Data Providers (TDPs), Training Data Consumers (TDCs), and Confidential Clean Room Providers (CCRPs).

## 🔐 User Authentication

### **Logging In**
1. Navigate to the system URL
2. Enter your username and password
3. Change password if prompted (first login)
4. Access your role-specific dashboard

### **User Roles**
- **TDC**: Access and request training data
- **TDP**: Provide and manage training datasets
- **CCRP**: Provide computing environments
- **AppAdmin**: System administration and management
- **Auditor**: Read-only review of contracts and the sealed Merkle audit tree. The public registration form does not list this role. An operator creates it with `partyType` `Auditor`. The screen walk is the [Auditor user guide](guides/role-user-guides/AUDITOR_USER_GUIDE.md).

### **Where to go next**
- **Documentation home**: [README.md](README.md)
- **Per-role UI guides (with screenshots)**: [guides/role-user-guides/README.md](guides/role-user-guides/README.md)
- **Screenshot E2E lifecycle (onboard → sign → train → inference)**: [guides/lifecycle-user-guide/LIFECYCLE_USER_GUIDE.md](guides/lifecycle-user-guide/LIFECYCLE_USER_GUIDE.md)
- **Screenshot multi-model contracts (tabular / NLP+DP / vision)**: [guides/multi-model-user-guide/MULTI_MODEL_USER_GUIDE.md](guides/multi-model-user-guide/MULTI_MODEL_USER_GUIDE.md)
- **Full onboarding + E2E lifecycle (canonical text)**: [guides/PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md](guides/PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md)
- **Training workflows**: [training/USER_TRAINING_GUIDE.md](training/USER_TRAINING_GUIDE.md)
- **Contract signing**: [features/contract-signing/CONTRACT_SIGNING_USER_GUIDE.md](features/contract-signing/CONTRACT_SIGNING_USER_GUIDE.md)
- **Admin operations**: [ADMIN_GUIDE.md](ADMIN_GUIDE.md)
- **CAN MVP APIs**: [features/can/CAN_QUICKSTART.md](features/can/CAN_QUICKSTART.md)

## 📊 Dashboard Overview

### **TDC Dashboard**
- Available Datasets
- My Contracts
- Data Requests
- Notifications

### **TDP Dashboard**
- My Datasets
- Contract Requests
- Data Usage
- Revenue Tracking

### **CCRP Dashboard**
- Environment Management
- Contract Monitoring
- Infrastructure Status
- Resource Usage

### **Admin Dashboard**
- User Management
- System Health
- Contract Overview
- Audit Logs

### **Auditor workspace**
- Every contract, with search by contract id, status, TDC, or DEPA ID
- **Audit tree** for the sealed Merkle root and its leaves
- **Contract** for the Ricardian record, without sign or train controls

## ✅ Role-based “happy path” workflows

### **TDC (Training Data Consumer)**
- **Browse datasets**: Datasets → Catalog → filter/search → open dataset detail
- **Create a contract**: Contracts → Create → choose template → pick datasets → select the TSP → name the Azure or GCP cluster when that TSP is selected → submit
- **Sign contract** (if required): Contracts → Pending Signatures → Sign
- **Run training**: Training → **Start training** on a **SIGNED** contract. A Local TSP runs on this machine. An Azure or GCP TSP submits to that TSP’s existing cluster. See [Clean-room provider and training](#clean-room-provider-and-training).
- **Review outputs**: Training → Job Detail → download artifacts + reports (and provenance where enabled)

### **TDP (Training Data Provider)**
- **Publish datasets**: Datasets → Upload → metadata + classification + access controls → publish
- **Respond to contract requests**: Contracts → Incoming Requests → review terms → approve/reject
- **Issue access tokens / approvals** (where applicable): Datasets/Contracts → Access controls → grant access
- **Monitor usage**: Analytics/Reports → dataset access + revenue + audit trail

### **CCRP (Confidential Clean Room Provider)**
- **Name the cluster you already run**: Dashboard → **Cloud Provider** → edit → Local, Azure, or GCP. Azure and GCP include the cluster name and the kubeconfig path on this host.
- **Review contracts for compliance**: Contracts → Review Queue → verify requirements (TEE, residency, policies)
- **Sign** when you can host the job. Training uses the cluster recorded on the contract and on your Cloud Provider card. It does not create a new subscription or project.

### **AppAdmin**
- **Manage users/roles**: Admin → Users → create/update/disable → role assignment
- **Monitor health**: Admin → System Health → investigate alerts/logs
- **Audit & compliance**: Admin → Audit Logs → export/retain evidence
- **Operational scripts**: see `docs/ADMIN_GUIDE.md` (includes DEPA tooling and CAN operations)

### **Auditor**
- **Open the workspace**: `/auditor/dashboard`. The list is every contract.
- **Inspect the sealed tree**: **Audit tree**. A **Published root** was written once, when a model was registered or when a completed training job was first reviewed. Leaves are the contract, each training job, each SCITT claim, and each registered model.
- **Verify a leaf**: **Verify** checks that leaf under the saved root and reports the leaf hash, both roots, the check time, and whether the current database row still matches the sealed leaf.
- **Read the contract**: **Contract** opens the Ricardian record. This role does not sign, train, or deploy.
- **Tombstone**: `POST /api/auditor/provenance/{id}/tombstone` keeps the Merkle leaf and records the reason in this database. The same id returns the first record. The workspace has no button for this call.

The screenshot walk and the leaf contents are in the [Auditor user guide](guides/role-user-guides/AUDITOR_USER_GUIDE.md). The API table is [Auditor role](features/AUDITOR_ROLE.md).

## 📝 Contract Management

### **Creating Contracts**
1. Navigate to Contracts → Create New Contract
2. Select template and fill details
3. Add parties (TDC, TDP, CCRP)
4. Define terms and conditions
5. Submit for approval and signing

The environment step records which TSP hosts the job. Cluster fields appear only for the provider that TSP offers. Details are in [Clean-room provider and training](#clean-room-provider-and-training).

### **Clean-room provider and training**

The TSP selected on the contract decides where training runs.

| TSP provider | Where the job runs |
|---|---|
| Local | This machine. `TRAINING_EXECUTION_MODE` chooses `local-docker`, `local-native`, or `local-mlx`. |
| Azure | That TSP’s existing AKS cluster |
| GCP | That TSP’s existing GKE cluster |
| OCI | That TSP’s existing OKE cluster |
| AWS | Training is not started |

#### TSP: save the cluster on your dashboard

1. Sign in as the TSP and open the dashboard.
2. On the **Cloud Provider** card, click edit and choose one provider.
3. For **Azure**, enter Subscription ID, Resource group, AKS cluster name, Namespace, Region, Storage account, Key Vault URI, and Kubeconfig path.
4. For **GCP**, enter Project ID, Location, GKE cluster name, Namespace, GCS bucket, and Kubeconfig path.
5. Save. Local and OCI keep the provider selection. Those two do not ask for an AKS or GKE cluster on this card.

The kubeconfig path is a file on the TSP host. The contract stores the cluster name and account identifiers. Azure needs a subscription, resource group, and AKS name. GCP needs a project, location, and GKE name. A blank contract field is filled from this saved account.

#### TDC: what the contract asks for

1. Choose a template, then set price, duration, terms, and privacy (epsilon, minimum accuracy, and technique when you use differential privacy or federated learning).
2. Select **1–3 datasets**. An AI model is optional on the form. Starting training still requires a model on the contract.
3. On **Configure Environment & TSP**, filter **Cloud Provider** and select the TSP. That choice sets the provider for the job.
4. Enter environment size: Environment Type, Instance Type, CPU, Memory, Storage, GPU, and notes.
5. Enter KMS: provider, key id, algorithm, and rotation. An OCI TSP also asks for the vault OCID and region.
6. When the TSP is **Azure**, fill **Azure cluster**: Subscription ID, Resource group, AKS cluster name, Namespace, Region, Storage account, and Key Vault URI.
7. When the TSP is **GCP**, fill **GCP cluster**: Project ID, Location, GKE cluster name, Namespace, and GCS bucket.
8. A **Local** TSP hides both cluster sections.

#### Start training

1. The dataset owner (TDP) signs, then the TSP signs. The contract status becomes **SIGNED**.
2. Open **Training** and click **Start training** on that contract.
3. A Local TSP runs here. Azure and GCP submit a job to the named cluster. The job detail shows `azure-ccr` or `gcp-ccr`.
4. If the kubeconfig path is missing, the start fails and the job is **FAILED**. No cluster is created.
5. Cloud job attestation is marked **simulated** until a verified SEV-SNP quote is stored. A TDC, TSP, or AppAdmin submits the guest report, VCEK, and ASK to `POST /api/tdc/training/jobs/{jobId}/sev-snp-quote`. The API host must have `SEV_SNP_ARK_PEM` set. The gateway path is `POST /v1/ccr/{jobId}/attestation`.
6. With the training policy gate enabled, the start is refused when the policy engine is unreachable. That refusal happens before any cluster submit.

#### Deploy the trained model

The TSP on the contract is where training ran. Deploy is a separate choice on the completed job.

1. Register the model, then set **Deploy target** to **Local**, **Azure**, **GCP**, or **AWS**.
2. **Local** scores on this host. Open the Inference app and run a prediction.
3. For Azure, GCP, or AWS, open **Inference** first and save that cluster: name, the account identifiers above, namespace, and kubeconfig path. Save, then deploy.
4. A missing kubeconfig leaves the model undeployed. No cluster is created. The score stays in the cluster and is not copied back to the Inference app.
5. Cloud job attestation is marked **simulated**. The local `model.bin` is not mounted into the Job.

### Before a new TSP or TDC starts

The screenshot tours follow a **Local** demo. Confidential training and a privacy-preserving run need the cluster and the contract fields below. CAN does not create a cloud subscription, project, or cluster.

#### Operator stack the app expects

1. Keycloak, the API, and the console are up (`./start-system.sh`). Users sign in with the party signing key created at enterprise registration.
2. For a real run, `TRAINING_SIMULATION_MODE` is `false`. A Local TSP also sets `TRAINING_EXECUTION_MODE` to `local-docker`, `local-native`, or `local-mlx`.
3. Build the trainer image so local training and local scoring share it. The inference scorer is a named build context:

```bash
docker build -t contractmanagement/local-trainer:latest \
  -f backend/local-training/Dockerfile \
  --build-context inference=inference/backend \
  backend/local-training
```

4. When the training or inference policy gate is on, Open-GMASE must answer before the job or prediction starts. A refused or unreachable gate stops the side effect.

#### TSP: prepare the confidential pool

1. On an existing AKS or GKE cluster, label the pool `can.azure/pool=confidential` or `can.gcp/pool=confidential`, and allow the toleration `can.azure/confidential` or `can.gcp/confidential`.
2. Create service account `training-job` in the namespace you will save. The default namespace is `contract-management`. OCI uses `training-job-sa` when the contract does not name one.
3. Put the kubeconfig file on the API host. Save that path on the dashboard **Cloud Provider** card. `AZURE_CCR_KUBECONFIG` or `GCP_CCR_KUBECONFIG` is the fallback when the card path is blank.
4. A missing path fails the job. No cluster is created. Attestation stays **simulated** until a guest report is accepted. Set `SEV_SNP_ARK_PEM` on the API host, then post the report, VCEK, and ASK to `POST /api/tdc/training/jobs/{jobId}/sev-snp-quote`.
5. AWS training is not started.

#### TDC: turn on differential privacy

On the contract, set the privacy technique to **Differential Privacy**, or set `trainingParams.differentialPrivacy.enabled` to true. The text trainer (AG News and DistilBERT) then runs Opacus DP-SGD.

| Field | Meaning | If you leave it blank |
|---|---|---|
| `epsilon` | Privacy budget | `1.0` |
| `delta` | Failure probability | `1e-5` |
| `maxGradNorm` | Per-sample clip | `1.0` |

A completed job shows `results.privacyMetrics`. The lifecycle screenshot tour leaves differential privacy off on the quality DistilBERT profile so the topic labels stay meaningful. The fast NLP path keeps it on (`ε=0.5`).

#### TDC: deploy inference on your own cluster

1. Open **Inference** and save Azure, GCP, or AWS: cluster name, account identifiers, namespace, and kubeconfig path. Azure needs a subscription, resource group, and AKS name. GCP needs a project, location, and GKE name. AWS needs a region and EKS name. Env fallbacks are `AZURE_CCR_KUBECONFIG`, `GCP_CCR_KUBECONFIG`, and `AWS_CCR_KUBECONFIG`.
2. The pool label is `can.azure/pool=confidential`, `can.gcp/pool=confidential`, or `can.aws/pool=confidential`, with the matching toleration. The Job uses service account `training-job`. The image is `INFERENCE_CCR_IMAGE`, or the local trainer image when that is unset.
3. **Local** scores in the Inference app. A cloud deploy does not mount `model.bin`, does not copy the score back, and records attestation as **simulated**. **Run prediction** on that deployment returns **409**.

The variable list is in [TDC training runtime](training/TDC_TRAINING_RUNTIME.md).

### **Digital signing**

Registration creates the key. There is no separate unlock password.

1. On `/register`, choose **User Type = Enterprise**, your role, and **Signing algorithm**: `ECDSA-P256` (default), `RSA-2048`, or `RSA-4096`.
2. `POST /api/auth/register` stores an active `UserKey` for TDP, TDC, and TSP in the same transaction. The response field `signingKeyCreated` is `true`. The private key stays on that row and is not returned.
3. Create or sign a contract only after that key exists. Otherwise the API returns `SIGNING_KEY_REQUIRED`.
4. If the account was created before this step, sign in and call `POST /api/signing/keys/generate` with `{ "keyType": "ECDSA-P256" }`. The same call is what **Profile → Key Management → Generate** uses. Import uses `POST /api/signing/keys/import` with PEM `publicKey` and `privateKey`. Neither response includes the private key.
5. On the contract, the TDP signs first, then the TSP. Each request is `POST /api/contracts/{contractId}/sign` with the party type. Status moves `PENDING_TDP_APPROVAL` → `PENDING_TSP_APPROVAL` → `SIGNED`.

### **Dataset and model encryption**

| What you do in the portal | What is stored | Who can decrypt |
|---|---|---|
| Publish a dataset with the default flags | `encryption_at_rest` and `encryption_in_transit` default on. Algorithm defaults to AES-256-GCM. `encryption_key_id` is optional. | Catalog only, until a key is attached |
| Upload through platform encryption | The platform generates and holds the data key | The platform, for demo uploads. This is not a principal-held clean-room key |
| Contract KMS fields | Provider, key id, algorithm, and rotation recorded on the contract | A reference. Filling the form does not release key material into the trainer |

A TDP-held data key (DEK) and a TDC-held model key (MEK) that exist only inside an attested job are the clean-room target. The portal does not accept those key bytes. Local training reads the artifact on this host.

### **Key release policy**

Release is a signal on a CAN job, not a copy of the key.

1. Create the job with `POST /api/can/jcs/jobs`. Escrow opens as `OPEN` and expires about **10 minutes** later.
2. Read `GET /api/can/jcs/jobs/{jobId}/attestation` and encrypt the DEK or MEK to `tlsPublicKey` with RSA-OAEP SHA-256. The dataset owner and the model owner each POST `{ "keyType", "attestedPublicKey", "wrappedKey" }` to `POST /api/can/jcs/jobs/{jobId}/key-released`. The API checks the wrap, zeroes the key bytes, and stores the time and the principal id.
3. One signal moves the job to `DEK_RECEIVED` or `MEK_RECEIVED`. Both move it to `BOTH_READY`.
4. `POST /api/can/jcs/jobs/{jobId}/release` is accepted only in `BOTH_READY`. The job becomes `RELEASED` and the clean-room session becomes `RUNNING`. Any other state is rejected.
5. After the deadline the state is `EXPIRED` or `CANCELLED`. A later signal is refused.
6. Portal **Start training** and **Deploy for inference** do not run this escrow. Cloud attestation on those paths stays **simulated** until a verified SEV-SNP quote is stored.
7. A revoked or expired contract, a replayed nonce, an unbound attestation, or an exhausted release budget (`cap`, `consumed`, `cost`) returns 409 and does not release the key.
8. `POST /api/can/jcs/jobs/{jobId}/seal-output` records sealed ciphertext and a sha256 after both keys are in and the escrow deadline is still open. The API stores the hash and the ciphertext length, not the artifact.
9. Local and dev use `CAN_PRINCIPAL_KEY_MODE=signals` or `mock`. `CAN_KEY_RELEASE_PROFILE=production` refuses that mock at startup. `azure-skr`, `trustee`, `confidential-space`, `nitro-enclave`, and `attested-tls` stay off unless selected. Each one returns a key only after its attestation check. A missing endpoint or quote fails closed.

### Key Orchestrator

The **Key Orchestrator** is the coordination engine running **inside** the Confidential Clean Room (CCR) Trusted Execution Environment (TEE). It is the conductor of a multi-party handshake: it validates contracts, generates a temporary one-run encryption keypair inside protected memory, talks to **each owner's Key Broker Service (KBS)** independently in parallel, enforces an **all-or-nothing barrier** before training starts, and keeps key leases alive while the job runs.

The **Key Orchestrator does not make trust or release decisions on its own**. Each data owner and model owner runs or configures their own KBS and verifier, and that service decides whether this CCR is trustworthy for their data or model.

**What runs today.** Local and dev stay on the mock KMS (`signals` or `mock`). The API records the release time and stores no key bytes. The clean-room HPKE key is an X25519 key in the API process. The attestation bundle stays **simulated** until a verified SEV-SNP guest report is stored. `MockOwnerKbs` seals to `pk_ccr` with HPKE (RFC 9180, X25519, HKDF-SHA256, AES-128-GCM) when the key is `hpke1.`, and still accepts the older RSA-OAEP wrap. It signs a release receipt, issues a one-minute lease, and renews that lease only while it is still valid. An expired lease blocks sealed output. The receipt is appended to SCITT only when `SCITT_CCF_ENABLED=true` and the ledger returns a claim id. Otherwise the signature stays on the job event and no claim id is invented. `ProductionOwnerKbs` is the owner process. It refuses a mock quote, checks the owner verifier, then seals. `azure-skr`, `trustee`, `confidential-space`, and `nitro-enclave` call their endpoints only after the attestation check and return an encrypted blob. They do not decrypt it. A missing endpoint, root certificate, or quote fails closed. `attested-tls` accepts an HPKE-wrapped key only after `verifySevSnpQuote` succeeds. A GPU measurement string is not a quote. A signed GPU token is verified against the owner's reference.

#### What the Key Orchestrator does

* **Validates contracts up front.** It checks signatures, validity windows, and revocation status for every contract in the run. If anything fails, it halts.
* **Generates an ephemeral keypair (`sk_ccr`, `pk_ccr`).** One keypair for the run, inside TEE memory. Each owner's KBS wraps its data encryption keys to `pk_ccr`, so only that CCR instance can unwrap them with `sk_ccr`.
* **Drives parallel per-owner requests.** It contacts each owner's KBS on its own. It does not route one owner's keys through another owner's infrastructure.
* **Enforces the all-required barrier.** Training starts only after every required data owner and the model owner have released their keys. If one refuses or times out, the CCR tears down and zeroizes memory.
* **Manages short-lived leases.** It renews key leases with each KBS during the job so a revocation can still block output.

#### How it talks to each owner's KBS

Each owner — data owner A, data owner B, and the model owner as a first-class owner — operates an **Owner Key Domain**: their own KMS or HSM, KBS, verifier, reference values, and release policy.

**1. Challenge and bound attestation**

For each owner `i`, in parallel, the CCR:

1. Requests a fresh single-use nonce `n_i` from `KBS_i`.
2. Generates hardware evidence whose report data binds `n_i`, `pk_ccr`, the `contract_hash`, and `owner_id_i`.
3. Sends the evidence, `pk_ccr`, and the contract bundle to `KBS_i`.

**2. Verification, policy, and budget on the KBS**

`KBS_i`, with its verifier and the contract service, checks:

* **Hardware and TCB.** The hardware signature chain is valid, the TCB version is acceptable, debug mode is off, and the CCR image and init-data measurements match the owner's reference values. GPU runs include composite CPU and GPU evidence.
* **Binding and freshness.** The report data matches the expected binding, and the nonce has not been used.
* **Policy and contract.** The owner's release policy holds: approved contract hash, active contract, unexpired terms, and, for the model owner, the approved pipeline and output types.
* **Privacy budget.** When a budget applies, `KBS_i` reserves it in the same transaction as the release.

**3. Wrapped key, receipt, and log**

* When the checks pass, `KBS_i` wraps the DEKs to `pk_ccr` with HPKE, returns the wrapped keys and a signed release receipt, and appends the receipt to the transparency log.
* Owners can use different backends in one run, for example Trustee for one owner and Azure or GCP for another. The CCR uses one key-release client. Each owner still applies their own policy to the verified claims.

#### Why this shape

* **No cross-owner trust.** A data owner is not on the model-key path. The model owner is not on a data-key path.
* **Fail closed.** If a KBS is down, a policy fails, or a contract is revoked during the run, keys are not released and leases are not renewed, so output stays blocked.
* **Zeroized on exit.** Keys stay in TEE memory for the run and are wiped at teardown.

The CCR calls one owner SDK per owner. The module is `backend/sdk/owner-kbs.js`. `MockOwnerKbs` is the local broker. `HttpOwnerKbsClient` posts `POST {endpoint}/nonce` and `POST {endpoint}/release` to an owner's process. `orchestrateRelease` runs those calls in parallel. If one owner refuses or does not answer, every wrapped key from that round is dropped and the job stays unreleased. `POST /api/can/jcs/jobs/{jobId}/orchestrate` uses the job's clean-room public key and does not return key bytes.

#### Datasets, models, and the clean room

A signed contract is the list the clean room works from. The training data consumer selects one to three datasets and a base model, and names the tech service provider who hosts the room. The orchestrator then asks the owner of each of those assets for a key. The provider hosts the room. The provider does not hold the data key or the model key.

| Asset | Who owns it | Key the broker releases | Who the clean room asks |
|---|---|---|---|
| Dataset | The training data provider on the dataset's `ownerId` | DEK, the data encryption key for that dataset | That provider's Key Broker |
| Base model | The training data consumer who published the model | MEK, the model encryption key | That consumer's Key Broker |
| Clean-room session | Created for this job. The tech service provider hosts it | One-run `sk_ccr` / `pk_ccr` | No broker. This is the room the brokers attest |

`POST /api/can/jcs/jobs` with `contractId` and `ccrProvider` opens the job and a clean-room session in `REQUESTED`. Escrow starts `OPEN` and expires about 10 minutes later. The session id is stored on the job. The attestation bundle and the one-run public key belong to that session. Locally the report stays simulated. On the default path the HPKE private key stays in the API process under that session id. The API opens a wrapped key only to check the binding, then zeroes those bytes.

The catalog and the contract name the assets. They do not name a broker. `encryption_key_id` and `attestation_policy` on a dataset, and `kmsConfigs` on the contract, are references stored with the row. `POST /api/can/jcs/jobs/{jobId}/orchestrate` does not read `datasetSelections`, `aiModelIds`, or those fields. The caller supplies `owners`:

* One `{ ownerId, keyType: "DEK", endpoint }` for each dataset owner.
* One `{ ownerId, keyType: "MEK", endpoint }` for the model owner.

`endpoint` is `mock` for the local broker, or the base URL of that owner's process (`POST /nonce`, `POST /release`, `POST /lease`). Two datasets from one provider are one data-key owner. Two datasets from two providers are two data-key owners, and each broker is called on its own. The model owner is a separate call.

The job records one data-key time and one model-key time. The orchestrator records those signals only after every owner in the request has returned a key wrapped to `pk_ccr`. One refusal drops the wrapped keys from that round and leaves escrow unchanged. The first accepted data-key signal and the first accepted model-key signal move the job to `BOTH_READY` and the session to `READY`. `POST /api/can/jcs/jobs/{jobId}/release` then moves the job to `RELEASED` and the session to `RUNNING`.

An owner who keeps the key in Azure Key Vault has that owner's broker present the room's Azure Attestation token. Key Vault returns an encrypted blob. `POST /api/can/jcs/jobs/{jobId}/azure-key-release` records that release when `CAN_PRINCIPAL_KEY_MODE=azure-skr`. The blob is not decrypted and is not wrapped again. Portal **Start training** does not create this job and does not call the brokers. It reads the artifacts on the host.

#### Local guest in the training container

`CAN_GUEST_DECRYPT=true` together with `CAN_LOCAL_TRAINING_MODE=docker` is the path that decrypts inside the training container. The container is the guest. It is not a hardware TEE, and `reportFormat` stays `SIMULATED`.

1. The image entry is `guest_entry.py`. Rebuild `contractmanagement/local-trainer:latest` after this change. Without `GUEST_DECRYPT=1` that entry starts `train.py`, so portal **Start training** is unchanged.
2. With the flag, the container generates `sk_ccr` in its own memory and writes only `pk_ccr` to `/outputs/guest-public.json`.
3. The API drops its copy of the private key, then asks each owner broker to seal to that guest public key. It does not open the wrap. The HTTP orchestrate route still returns no key bytes. The docker executor writes the sealed keys to `/inputs/guest/sealed-release.json` for this container only.
4. The guest opens the seals, decrypts `CANSEAL1` files into `/tmp/guest-plain` (not the host mount), zeroes the keys, and starts `train.py` on those files.

A dataset or model file must be a `CANSEAL1` envelope: the line `CANSEAL1`, one JSON line (`alg` `AES-256-GCM`, `nonce`, `keyType`, `ownerId`), then the AES-256-GCM ciphertext. A directory with no envelope stops the job with `GUEST_CIPHERTEXT_REQUIRED`. A mock broker with no key file stops the job with `GUEST_KEY_MISSING` and the container is stopped. Put the raw 32-byte owner key in `CAN_GUEST_KEY_DIR` as `encodeURIComponent(ownerId)__DEK` or `__MEK`. A remote broker uses `CAN_DATASET_KBS_URL` or `CAN_MODEL_KBS_URL`, or `kbsEndpoint` on the row. `CAN_KEY_RELEASE_PROFILE=production` still refuses the mock broker.

### **Contract Status**
- **Draft**: Being prepared
- **Pending Signatures**: Waiting for signatures
- **Fully Signed**: All signatures received
- **Active**: Legally binding
- **Completed**: Contract ended

## 📁 Dataset Management

### **TDP: Managing Datasets**
1. Navigate to Datasets → Upload Dataset
2. Select files and add metadata
3. Set permissions and access controls
4. Submit and publish dataset

### **TDC: Accessing Datasets**
1. Browse dataset catalog
2. Search and filter datasets
3. Request access to desired datasets
4. Wait for approval and access data

### **Dataset Categories**
- Healthcare
- Financial
- Education
- Technology
- Other

## 👥 User Management

### **Profile Management**
- Update personal details
- Change password
- Set preferences
- Manage security settings

### **Key Management (for Signing)**
- The registration algorithm is the key you sign with
- Generate a replacement with `POST /api/signing/keys/generate` or Profile → Key Management
- Import a PEM key pair with `POST /api/signing/keys/import`
- There is no unlock password and the private key is not returned by the API

## 🔒 Security Best Practices

### **Account Security**
- Use strong, unique passwords
- Change passwords regularly
- Access from trusted devices only
- Always logout when finished

### **Data Security**
- Dataset rows default to encryption-at-rest and in-transit flags (AES-256-GCM)
- Platform encryption on upload holds the key on the platform. A principal-held DEK or MEK is the CAN target and is not uploaded
- Key release is the CAN escrow signal described above. It does not deliver key bytes
- Role-based access controls and audit logging

## 🚨 Troubleshooting

### **Common Issues**
- **Login Problems**: Use password reset or contact admin
- **Contract Issues**: Check permissions and key status
- **Dataset Issues**: Verify access rights and file formats

### **Getting Help**
- Check FAQ section
- Refer to this user guide
- Contact support team
- Use help desk system

## 📱 Mobile Access

- Responsive design for mobile devices
- Full functionality on smartphones/tablets
- Secure access with same security as desktop
- VPN recommended for remote work

## 📊 Reporting

- Contract status and progress reports
- Dataset usage analytics
- User activity logs
- Compliance and audit reports

## 🎯 Best Practices

### **General Usage**
- Keep profile updated
- Follow security practices
- Backup important data
- Stay informed of updates

### **Contract Management**
- Review contracts carefully before signing
- Verify all parties and terms
- Monitor contract progress
- Keep records of activities

### **Data Management**
- Provide accurate metadata
- Set appropriate access controls
- Monitor data usage
- Ensure compliance

## 📞 Support

### **Documentation**
- User Guide (this document)
- Quick Start Guide
- API Documentation
- Video Tutorials

### **Support Channels**
- Help Desk
- Technical Support
- User Support
- Emergency Support

---

### **Related documents**
- **System overview**: `docs/SYSTEM_OVERVIEW.md`
- **Technical reference**: `docs/TECHNICAL_REFERENCE.md`
- **API reference**: `docs/API_REFERENCE.md`