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
2. The dataset owner sends `{ "keyType": "DEK" }` and the model owner sends `{ "keyType": "MEK" }` to `POST /api/can/jcs/jobs/{jobId}/key-released`. The API stores the time and the principal id. It does not store key material.
3. One signal moves the job to `DEK_RECEIVED` or `MEK_RECEIVED`. Both move it to `BOTH_READY`.
4. `POST /api/can/jcs/jobs/{jobId}/release` is accepted only in `BOTH_READY`. The job becomes `RELEASED` and the clean-room session becomes `RUNNING`. Any other state is rejected.
5. After the deadline the state is `EXPIRED` or `CANCELLED`. A later signal is refused.
6. Portal **Start training** and **Deploy for inference** do not run this escrow. Cloud attestation on those paths stays **simulated** until a verified SEV-SNP quote is stored.

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