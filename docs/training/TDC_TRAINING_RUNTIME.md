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
| `TRAINING_EXECUTION_MODE` | Optional. `local-docker` — Docker container (cross-platform). **`local-native`** — Apple Silicon host, same `train.py`, PyTorch **MPS** + Opacus DP on CPU ([MLX_MAC_DEV.md](./MLX_MAC_DEV.md)). `local-mlx` — MLX-only experiments (no DP). |
| `LOCAL_TRAINING_IMAGE` | Optional. Docker image used for `TRAINING_EXECUTION_MODE=local-docker`. Defaults to `contractmanagement/local-trainer:latest`. |
| `HF_TOKEN` / `HUGGINGFACE_API_TOKEN` | Optional. Passed into the local trainer container for **gated/private** Hugging Face Hub models/datasets. Store in `secrets.env`, not catalog metadata. |
| `HUGGINGFACE_HUB_URL` | Optional. Custom Hub endpoint; forwarded to the trainer as `HF_ENDPOINT`. |
| `HUGGINGFACE_INTEGRATION_ENABLED` | Dev/test only. Enables `/api/dev/huggingface` Hub validation routes (not production by default). See [HUGGINGFACE.md](../integrations/HUGGINGFACE.md). |
| `BACKEND_URL` / `BACKEND_PORT` | API base URL for Node-side calls and Playwright global setup. |

| `TRAINER_DEVICE` | Optional (`train.py`). `auto` \| `mps` \| `cpu` \| `cuda`. Native Mac default: MPS when available; CPU for Opacus DP-SGD unless `TRAINER_DP_ON_MPS=true`. |

**Differential privacy (NLP):** when `contract.trainingParams.differentialPrivacy.enabled` is true and the job runs the **text** trainer (`ag_news` + DistilBERT demo), `train.py` applies **Opacus DP-SGD**. Docker: rebuild `contractmanagement/local-trainer:latest`. Native Mac: `scripts/setup-native-venv.sh`. Completed jobs surface `results.privacyMetrics` (ε, δ, mechanism) on `TrainingJob.metadata`.

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

Local MVP: deploy a registered training artifact and run predictions via `infer.py` (same Docker image as training, or host Python when `INFERENCE_EXECUTION_MODE=host`).

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/deployments` | List models the TDC has deployed for inference. |
| `POST` | `/models/:modelId/deploy` | Mark registered model as **DEPLOYED** (requires local `model.bin` from the training run). |
| `POST` | `/models/:modelId/undeploy` | Mark undeployed. |
| `POST` | `/models/:modelId/predict` | Body `{ "input": { ... } }` — tabular `features`, text `text`, vision `{ "demo": true }` or `imageBase64`. |

**UI:** `/tdc/inference` (sidebar **Inference**). Training page shows **Deploy for inference** after register, then **Open inference app**.

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
- **Deploy for inference** appears after registration; opens the **Inference app** (`/tdc/inference`) for try-it predictions.

## CCRP training API (`/api/ccrp/training/...`)

Mounted under **`/api/ccrp`** with authentication. Used by **Training Environment** (`/ccrp/training-environment`):

- `GET /training/jobs/:userId` — jobs for contracts where the user is TDC or CCRP (`TrainingService.getTrainingJobs`).
- `GET /training/containers/:userId` — currently returns an empty list until container tracking is implemented.
- `POST /training/deploy/:userId` — creates a placeholder `TrainingJob` (manual deploy stub).
- `POST /training/jobs/:jobId/stop`, `DELETE /training/jobs/:jobId`, `GET /training/jobs/:jobId/logs`.

## Implementation notes

- **Container spec snapshot:** `backend/services/tdcTrainingHelpers.js` — `buildContainerSpec(contract)` merges `trainingParams`, `environmentSpecs.compute`, dataset/model refs.
- **Simulation:** phases and results stored on `TrainingJob.metadata` (requires `metadata` column on PostgreSQL).
- **Local Docker execution:** set `TRAINING_EXECUTION_MODE=local-docker` to run a local Python trainer container. The placeholder trainer writes results to `backend/local-training/runs/<jobId>/outputs/metrics.json` on the backend host.
- **Hugging Face catalog refs (dev):** `contractTrainingInputsService` attaches `huggingface` blocks to datasets/models in `metadata.inputs`; `train.py` loads Hub dataset/model IDs from `contract.json` (fallback: `ag_news` + tiny DistilBERT). See [LOCAL_DEMO_RUNBOOK.md](./LOCAL_DEMO_RUNBOOK.md) NLP track.
- **Register model:** `POST .../register-model` writes **`AIModel`** with `metadata.source = 'tdc_training_job'` and links `job.metadata.registeredModelId`.

## Local training runner (Docker)

This repo includes a minimal placeholder trainer (`backend/local-training/train.py`) so you can exercise the end-to-end flow **without** Azure/Terraform.

### Build the trainer image

```bash
docker build -t contractmanagement/local-trainer:latest -f backend/local-training/Dockerfile backend/local-training
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

- `backend/services/tdcTrainingExecutionService.js`
- `backend/services/contractTrainingInputsService.js` — shapes `contract.json` for local Docker (includes HF blocks)
- `backend/services/localDockerTrainingRunner.js` — mounts inputs, passes `HF_TOKEN` to trainer
- `backend/services/huggingfaceIntegrationService.js` — dev Hub adapter
- `backend/routes/tdc-training.js`
- `backend/services/trainingService.js` — `getTrainingJobs`, `deployTrainingJob`, etc.
- `frontend/src/pages/TDCTraining.js`
- `frontend/src/pages/TrainingEnvironment.js` (uses `/api/ccrp/training/...`)

## Related CAN docs

- `CAN_QUICKSTART.md`
- `ARCHITECTURE.md` (CAN section)
- `API_REFERENCE.md` (CAN endpoints)

## Related integrations

- [HUGGINGFACE.md](../integrations/HUGGINGFACE.md) — dev Hub catalog + `/api/dev/huggingface`
- [LOCAL_DEMO_RUNBOOK.md](./LOCAL_DEMO_RUNBOOK.md) — stakeholder demo including optional NLP/HF track
