# TDC training runtime (API, UI, configuration)

This document describes the **TDC (Training Data Consumer)** training flow implemented in the application: starting jobs from a **signed** contract, monitoring progress, registering a trained artifact as an **`AIModel`**, and related **CCRP** endpoints.

## Prerequisites

- **Backend** running and reachable at `BACKEND_URL` / `BACKEND_PORT` in `config.env` (see `frontend/load-config.js` and Playwright `global-setup.js`).
- **Keycloak** and synced users for E2E (see project `.cursorrules` / `./fix-auth.sh`).
- Contract must be **`SIGNED`** and include:
  - `environmentSpecs`, `trainingParams`, `ccrpCloudProvider`
  - Non-empty `contractDatasets` and `aiModelIds`

## Environment variables

| Variable | Purpose |
|----------|---------|
| `TRAINING_SIMULATION_MODE` | Default `true` (or unset): runs a **simulated** training pipeline (no cloud provisioning). Set to `false` to call `TrainingService.triggerTrainingRun` (requires Azure/CCRP and DB shape expected by that path). |
| `BACKEND_URL` / `BACKEND_PORT` | API base URL for Node-side calls and Playwright global setup. |

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

## TDC UI

- **Route:** `/tdc/training` (TDC sidebar: **Training**).
- Shows signed contracts, **Start training**, job list, live job detail (container spec, training params, results).
- **Register trained model for inference** appears when the job is **COMPLETED** and not yet registered.

## CCRP training API (`/api/ccrp/training/...`)

Mounted under **`/api/ccrp`** with authentication. Used by **Training Environment** (`/ccrp/training-environment`):

- `GET /training/jobs/:userId` — jobs for contracts where the user is TDC or CCRP (`TrainingService.getTrainingJobs`).
- `GET /training/containers/:userId` — currently returns an empty list until container tracking is implemented.
- `POST /training/deploy/:userId` — creates a placeholder `TrainingJob` (manual deploy stub).
- `POST /training/jobs/:jobId/stop`, `DELETE /training/jobs/:jobId`, `GET /training/jobs/:jobId/logs`.

## Implementation notes

- **Container spec snapshot:** `backend/services/tdcTrainingHelpers.js` — `buildContainerSpec(contract)` merges `trainingParams`, `environmentSpecs.compute`, dataset/model refs.
- **Simulation:** phases and results stored on `TrainingJob.metadata` (requires `metadata` column on PostgreSQL).
- **Register model:** `POST .../register-model` writes **`AIModel`** with `metadata.source = 'tdc_training_job'` and links `job.metadata.registeredModelId`.

## Related code

- `backend/services/tdcTrainingExecutionService.js`
- `backend/routes/tdc-training.js`
- `backend/services/trainingService.js` — `getTrainingJobs`, `deployTrainingJob`, etc.
- `frontend/src/pages/TDCTraining.js`
- `frontend/src/pages/TrainingEnvironment.js` (uses `/api/ccrp/training/...`)
