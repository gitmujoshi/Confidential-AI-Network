# TDC training runtime (API, UI, configuration)

This document describes the **TDC (Training Data Consumer)** training flow implemented in the application: starting jobs from a **signed** contract, monitoring progress, registering a trained artifact as an **`AIModel`**, and related **CCRP** endpoints.

> Note: This doc covers the **portal training runtime** (`/api/tdc/training`, `/tdc/training` UI).
> The **CAN** training flow is separate and is driven via `/api/can/jcs` (JCS escrow → release → `ccrProvider=local` execution).

## Prerequisites

- **Backend** running and reachable at `BACKEND_URL` / `BACKEND_PORT` in `config.env` (see `frontend/load-config.js` and Playwright `global-setup.js`).
- **Keycloak** and synced users for E2E (see project `.cursorrules` / `./fix-auth.sh`).
- Contract must be **`SIGNED`** and include:
  - `environmentSpecs`, `trainingParams`, `ccrpCloudProvider`
  - Non-empty `contractDatasets` and `aiModelIds`

## Environment variables

| Variable | Purpose |
|----------|---------|
| `TRAINING_SIMULATION_MODE` | Default `false` (or unset): uses the **real execution path** (`TrainingService.triggerTrainingRun`) and therefore requires cloud/CCRP credentials and the DB shape expected by that path. Set to `true` to run a **simulated** training pipeline (no cloud provisioning). |
| `TRAINING_EXECUTION_MODE` | Used only when `tspCloudProvider` is **Local**: `local-docker`, `local-native`, or `local-mlx`. A non-local value on a Local TSP still runs `local-docker`. Azure, GCP, and OCI contracts ignore this variable. |
| `LOCAL_TRAINING_IMAGE` | Optional. Docker image used for `TRAINING_EXECUTION_MODE=local-docker`. Defaults to `contractmanagement/local-trainer:latest`. |
| `HF_TOKEN` / `HUGGINGFACE_API_TOKEN` | Optional. Passed into the local trainer container for **gated/private** Hugging Face Hub models/datasets. Store in `secrets.env`, not catalog metadata. |
| `HUGGINGFACE_HUB_URL` | Optional. Custom Hub endpoint; forwarded to the trainer as `HF_ENDPOINT`. |
| `HUGGINGFACE_INTEGRATION_ENABLED` | Dev/test only. Enables `/api/dev/huggingface` Hub validation routes (not production by default). See [HUGGINGFACE.md](../integrations/HUGGINGFACE.md). |
| `BACKEND_URL` / `BACKEND_PORT` | API base URL for Node-side calls and Playwright global setup. |

| `INFERENCE_TIMEOUT_MS` | Optional. Docker/host infer timeout (default **600000** / 10 min — DistilBERT quality cold start + Hub download). |
| `HF_HOME` / `HUGGINGFACE_HUB_CACHE` | Optional. Host cache mounted into trainer/infer containers so Hub models are not re-downloaded every run. |

**TSP routing.** `Local` stays on the host runners above. `Azure`, `GCP`, and `OCI` use that TSP's existing cluster. The contract stores the cluster on `environmentSpecs.cloudAccounts.<Provider>`. The TSP dashboard stores the same fields on `users.cloud_account`, including the kubeconfig path, and that record fills any gap. Azure needs subscription, resource group, and AKS name, and can also store namespace, storage account, and Key Vault URI. An existing `tspAzureSubscriptionId` fills the subscription when the account omits it. GCP needs project, location, and GKE name, and can also store namespace and a GCS bucket. Submit runs only when `AZURE_CCR_KUBECONFIG` / `GCP_CCR_KUBECONFIG` or the account `kubeconfigPath` is set. Attestation stays `simulated` until a guest report is accepted. `POST /api/tdc/training/jobs/:jobId/sev-snp-quote` (TDC, TSP, or AppAdmin) stores `metadata.sevSnp` only when the report signature matches the VCEK and the VCEK chains through the ASK to `SEV_SNP_ARK_PEM`. The gateway exposes that as `POST /v1/ccr/{id}/attestation`. `AWS` returns 501 and does not write a job.

**Differential privacy (NLP):** when `contract.trainingParams.differentialPrivacy.enabled` is true and the job runs the **text** trainer (`ag_news` + DistilBERT demo), `train.py` applies **Opacus DP-SGD**. Docker: rebuild `contractmanagement/local-trainer:latest`. Native Mac: `scripts/setup-native-venv.sh`. Completed jobs surface `results.privacyMetrics` (ε, δ, mechanism) on `TrainingJob.metadata`.

**Demo profiles (text / AG News):**

| Profile | When | Model | Subset / epochs | Purpose |
|---------|------|-------|-----------------|---------|
| **fast** (`demoProfile: fast`, `fastDevRun: true`) | NLP DP E2E, CI | `sshleifer/tiny-distilbert-base-cased` | 256 samples, 1 epoch | Pipeline smoke (labels may be weak) |
| **quality** (`demoProfile: quality`) | Lifecycle guide / stakeholder demos | `distilbert-base-uncased` | `trainSubsetSize=2000`, 2 epochs, full fine-tune (DP off for label fidelity) | Meaningful topic labels (e.g. Wall Street → **Business**) |

Lifecycle screenshot tour defaults to **quality**; set `LIFECYCLE_DEMO_QUALITY=false` for the fast path.

After pulling changes that add `training_jobs.metadata`, ensure the column exists:

```bash
npm run db:ensure-training-metadata --prefix backend
```

## TDC API (`/api/tdc/training`)

All routes require **Bearer** token and **TDC** role.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/contracts/:contractId/start` | Start training for the contract. |
| `GET` | `/contracts/:contractId/jobs` | List jobs for that contract. |
| `GET` | `/jobs/:jobId` | Job detail (container spec, params, results, `registeredModelId`). |
| `POST` | `/jobs/:jobId/register-model` | After **COMPLETED**, create an **`ai_models`** row from job results (optional body: `name`, `description`, `modelId`, `metadata`). |

## Inference API (`/api/tdc/inference`)

The contract TSP is the training target. The TDC chooses the deploy target on the registered model. **Local** scores on this host with `infer.py` (Docker, or host Python when `INFERENCE_EXECUTION_MODE=host`). **Azure**, **GCP**, and **AWS** submit a Job to a cluster saved on the TDC user. That record is `users.cloud_account.Azure|GCP|AWS`. It is not `contract.tspCloudProvider`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/accounts` | Azure, GCP, and AWS clusters saved for this TDC. |
| `PUT` | `/accounts` | Body `{ provider, account }`. Saves one of those clusters. |
| `GET` | `/deployments` | List models the TDC has deployed for inference. |
| `POST` | `/models/:modelId/deploy` | Body `{ target }` is `Local` (default), `Azure`, `GCP`, or `AWS`. Requires local `model.bin`. A cloud target needs a complete account. A missing kubeconfig returns **502** and leaves the model undeployed. |
| `POST` | `/models/:modelId/undeploy` | Mark undeployed. A submitted cloud Job is deleted when the kubeconfig is still set. |
| `POST` | `/models/:modelId/predict` | Local deployments only. Body `{ "input": { ... } }` — tabular `features`, text `text`, vision `{ "demo": true }` or `imageBase64`. A cloud deployment returns **409**. The score is not copied back. |

Azure needs subscription, resource group, and AKS name. GCP needs project, location, and GKE name. AWS needs region and EKS name. Each can also store namespace and `kubeconfigPath`. Env fallbacks are `AZURE_CCR_KUBECONFIG`, `GCP_CCR_KUBECONFIG`, and `AWS_CCR_KUBECONFIG`. The Job is labeled for that cloud’s confidential pool. Attestation stays `simulated`. `model.bin` is not mounted into the Job.

**UI:** `/tdc/inference` (sidebar **Inference**) saves the three clusters. Training page **Deploy target** chooses Local, Azure, GCP, or AWS, then **Deploy for inference**. Try-it predictions stay on Local.

### E2E (opt-in)

```bash
# Backend + frontend up; local-docker trainer image includes infer.py
cd frontend
E2E_WAIT_FOR_LOCAL_TRAINING=true BACKEND_URL=http://127.0.0.1:5001 npm run test:e2e:inference
```

Specs: `inference-deploy-api.spec.js`, `inference-deploy-ui.spec.js` (see `frontend/tests/e2e/README.md`).

## TDC UI

- **Route:** `/tdc/training` (TDC sidebar: **Training**).
- Shows signed contracts, **Start training**, job list, live job detail (container spec, training params, results).
- **Register trained model for inference** appears when the job is **COMPLETED** and not yet registered.
- **Deploy target** and **Deploy for inference** appear after registration. Local opens the **Inference app** (`/tdc/inference`) for try-it predictions. Azure, GCP, and AWS use the cluster saved on that page.

## CCRP training API (`/api/ccrp/training/...`)

Mounted under **`/api/ccrp`** with authentication. Used by **Training Environment** (`/ccrp/training-environment`):

- `GET /training/jobs/:userId` — jobs for contracts where the user is TDC or CCRP (`TrainingService.getTrainingJobs`).
- `GET /training/containers/:userId` — currently returns an empty list until container tracking is implemented.
- `POST /training/deploy/:userId` — creates a placeholder `TrainingJob` (manual deploy stub).
- `POST /training/jobs/:jobId/stop`, `DELETE /training/jobs/:jobId`, `GET /training/jobs/:jobId/logs`.

## Implementation notes

- **Container spec snapshot:** `training/tdcTrainingHelpers.js` — `buildContainerSpec(contract)` merges `trainingParams`, `environmentSpecs.compute`, dataset/model refs.
- **Simulation:** phases and results stored on `TrainingJob.metadata` (requires `metadata` column on PostgreSQL).
- **Local Docker execution:** set `TRAINING_EXECUTION_MODE=local-docker` to run the local Python trainer container. It writes results to `backend/local-training/runs/<jobId>/outputs/metrics.json` on the backend host.
- **Hugging Face catalog refs (dev):** `contractTrainingInputsService` attaches `huggingface` blocks to datasets/models in `metadata.inputs`; `train.py` loads Hub dataset/model IDs from `contract.json` (fallback: `ag_news` + tiny DistilBERT). See [LOCAL_DEMO_RUNBOOK.md](./LOCAL_DEMO_RUNBOOK.md) NLP track.
- **Register model:** `POST .../register-model` writes **`AIModel`** with `metadata.source = 'tdc_training_job'` and links `job.metadata.registeredModelId`.

## Local training runner (Docker)

The local trainer is `backend/local-training/train.py`. It runs the contract-to-training flow on the machine that hosts the API.

### Build the trainer image

```bash
docker build -t contractmanagement/local-trainer:latest \
  -f backend/local-training/Dockerfile \
  --build-context inference=inference/backend \
  backend/local-training
```

### Run training through the app runtime

Set environment variables for the backend:

```bash
export TRAINING_SIMULATION_MODE=false
export TRAINING_EXECUTION_MODE=local-docker
export LOCAL_TRAINING_IMAGE=contractmanagement/local-trainer:latest
```

Then start training as normal via UI (`/tdc/training`) or API:

```bash
curl -X POST "http://localhost:5001/api/tdc/training/contracts/<contractId>/start" \
  -H "Authorization: Bearer <token>"
```

## Related code

- `training/tdcTrainingExecutionService.js`
- `training/contractTrainingInputsService.js` — shapes `contract.json` for local Docker (includes HF blocks)
- `training/localDockerTrainingRunner.js` — mounts inputs, passes `HF_TOKEN` to trainer
- `backend/services/huggingfaceIntegrationService.js` — dev Hub adapter
- `training/routes.js` — mounted at `/api/tdc/training`
- `training/ui/TDCTraining.js`
- `inference/backend/localInferenceService.js` — Local deploy runs `inference/backend/infer.py`
- `inference/backend/inferenceCcrRunner.js` — Azure, GCP, and AWS Job submit
- `inference/backend/routes.js` — mounted at `/api/tdc/inference`
- `inference/ui/TDCInference.js`
- `shared/services/tspCloudAccount.js` — TSP and TDC cluster records
- `shared/services/gmaseSideEffectGate.js` — train, deploy, and predict gate
- `backend/services/trainingService.js` — `getTrainingJobs`, `deployTrainingJob`, etc.
- `frontend/src/pages/TrainingEnvironment.js` (uses `/api/ccrp/training/...`)

## Related CAN docs

- `CAN_QUICKSTART.md`
- `ARCHITECTURE.md` (CAN section)
- `API_REFERENCE.md` (CAN endpoints)

## Related integrations

- [HUGGINGFACE.md](../integrations/HUGGINGFACE.md) — dev Hub catalog + `/api/dev/huggingface`
- [LOCAL_DEMO_RUNBOOK.md](./LOCAL_DEMO_RUNBOOK.md) — stakeholder demo including optional NLP/HF track
