# Phase A — Local dataset artifacts & physical training (implementation runbook)

**Status:** Implemented (backend + UI). Run DB migration `20260502140000-dataset-artifact-columns.js`, then smoke-test uploads and `TRAINING_EXECUTION_MODE=local-docker`.

**Related:** [`TDC_TRAINING_RUNTIME.md`](./TDC_TRAINING_RUNTIME.md) (env vars, APIs, local Docker image).

---

## 1. Goal

Move from **catalog-only dataset rows** to **real files on disk** that the **local Docker trainer** reads, while keeping the existing **TDC training flow** (`/tdc/training`, `POST /api/tdc/training/contracts/:contractId/start`) and job outputs (`metrics.json`, artifacts).

**Phase A scope:** **Local environment only** — filesystem storage + **full-stack UI** (TDP upload, visibility, TDC start training without curl).

**Out of scope for Phase A:** AWS / Azure / GCP staging, IAM, Batch/SageMaker/Vertex (defer to Phase B).

---

## 2. Success criteria

### Product

- **TDP** can publish a dataset with **uploaded files**, see **artifact status** (count, size, format readiness), and understand **“ready for physical training.”**
- **TDC** can complete **Create contract → sign → Start training** entirely via the **UI**, without APIs-only workflows.
- **`TRAINING_EXECUTION_MODE=local-docker`** runs a container that consumes **staged paths**, not only demo loaders inside `train.py`.

### Technical

- `Dataset` rows reference **stored artifacts** (paths or canonical URIs for future clouds).
- **`expandContractTrainingInputs`** (or job `metadata.inputs`) includes **resolved paths** for the runner.
- **`localDockerTrainingRunner`** mounts staged **`inputs/`** read-only; **`train.py`** loads **path-driven** data when inputs specify format/path.
- Regression path: metadata-only datasets either **fail clearly** (“no artifacts”) or **documented** demo fallback — **pick one behavior** and test it.

---

## 3. Prerequisites

- Merge stabilized bug-fix branch; run usual smoke (`./start-system.sh`, `npm run keycloak:sync`, login, contract flow).
- Docker available on the backend host for local-docker mode.
- Optional DB migration helper if `training_jobs.metadata` missing: `npm run db:ensure-training-metadata --prefix backend` (see `TDC_TRAINING_RUNTIME.md`).

---

## 4. Backend workstream

### 4.1 Database & model

- Migration + Sequelize model updates on **`datasets`** (names illustrative — adjust to naming conventions):

  - `storageBackend` — Phase A: enforce **`local`** only or allow enum with single active value.
  - `storageUri` or `localRelativePath` — canonical pointer under app-managed storage root.
  - Optional: `artifactBytes`, `artifactCount`, `contentFormat` (`csv`, `parquet`, `image_folder`, etc.).

- **Canonical layout** (example): `uploads/datasets/<datasetId>/` plus optional `manifest.json` (checksums, relative paths).

### 4.2 Upload API

- Authenticated **TDP owner** (or **AppAdmin**): multipart endpoint, e.g.  
  `POST /api/datasets/:datasetId/artifacts`  
  or **two-step**: existing `POST /api/datasets` (JSON) then upload.

- Validate size/type; persist files; update `Dataset` columns.

### 4.3 Job staging (recommended)

- On training **start**, **copy or hardlink** dataset files into  
  `backend/local-training/runs/<jobId>/inputs/datasets/<datasetId>/`  
  so runs are **immutable** if TDP replaces files later.

### 4.4 Training inputs

- Extend **`contractTrainingInputsService`** (`expandContractTrainingInputs`, `shapeInputsForLocalTrainerContainer`) so each dataset includes **container-visible paths** (e.g. `/inputs/datasets/...`) and format hints.

### 4.5 Local Docker runner

- **`localDockerTrainingRunner.js`**: mount staged `inputs/` into the container; keep `outputs/` mount; ensure **`contract.json`** lists per-dataset roots inside the container.

### 4.6 Trainer

- **`backend/local-training/train.py`**: **path-driven mode** — if `contract.json` supplies `dataPath` / `format`, load real data; retain **demo fallbacks** only when explicitly allowed or when no paths exist (align with success criteria).

---

## 5. Frontend workstream (required for Phase A)

### 5.1 API client

- **`frontend/src/services/api.js`** (or equivalent):  
  `uploadDatasetArtifacts(datasetId, formData)` — **do not** set `Content-Type` manually for multipart; preserve **Authorization**.

### 5.2 TDP — Add dataset (`frontend/src/pages/AddDataset.js`)

- Add step or section **“Data files”** (or equivalent): file picker, list with remove, aggregate size display.
- Submit flow aligned with backend:

  - **Option A:** `POST /api/datasets` (JSON) → then multipart **artifacts** upload with returned `datasetId`.
  - **Option B:** Single multipart including metadata + files.

- Upload progress (indeterminate or `onUploadProgress`) and toasts.

### 5.3 TDP — Dataset detail (`frontend/src/pages/DatasetDetail.js`)

- Section **Artifacts:** count, size, format, timestamps; show **storage status**.
- **Owner-only:** “Add / replace files” → modal or dedicated route.
- Empty state: **“Not ready for physical training”** when no artifacts (copy consistent with backend errors).

### 5.4 Datasets list (`frontend/src/pages/Datasets.js`)

- Optional **chip**: e.g. “Files uploaded” vs “Metadata only”.

### 5.5 TDC — Training (`frontend/src/pages/TDCTraining.js`)

- Prefer API field(s) for **readiness** (e.g. `datasetsReady`, per-dataset reasons).
- **Disable** “Start training” with **Tooltip** when blocked (unsigned, missing artifacts, wrong role).
- Link/help text toward **dataset detail** or upload guidance.

### 5.6 Contract flow

- **`MultiDatasetSelector.js`** (and contract wizard): **warn** if selected dataset has **no artifacts** (avoid silent train failures).

---

## 6. Configuration (local physical training)

Backend environment (see `TDC_TRAINING_RUNTIME.md` for full table):

```bash
export TRAINING_SIMULATION_MODE=false
export TRAINING_EXECUTION_MODE=local-docker
export LOCAL_TRAINING_IMAGE=contractmanagement/local-trainer:latest   # after docker build
```

Build image:

```bash
docker build -t contractmanagement/local-trainer:latest -f backend/local-training/Dockerfile backend/local-training
```

---

## 7. Implementation order (recommended)

1. Migration + local storage layout + **upload API** (minimal contract for UI).
2. **`apiService` + AddDataset upload UI + DatasetDetail** (read-only artifacts first).
3. **Staging + runner mounts + `contract.json` shape**.
4. **`train.py` path loaders** + tighten error messages.
5. **TDCTraining** readiness + contract selector warnings.
6. End-to-end manual test; add **integration/E2E** if CI stability allows.

---

## 8. Testing checklist

- [ ] TDP uploads fixture files → detail page shows artifacts.
- [ ] TDC creates contract with that dataset → sign → **Start** on `/tdc/training` → job **COMPLETED**, outputs under `backend/local-training/runs/<jobId>/outputs/`.
- [ ] Wrong role / unsigned / missing files → **clear UI + API errors**.
- [ ] Disk: document cleanup policy for `uploads/` and `runs/` (quotas later).

---

## 9. Risks & follow-ups

- **Large files:** cap upload size in Phase A; document; add chunked upload later.
- **Security:** path traversal checks on extract if using zip uploads; owner-only access to artifact routes.
- **Phase B:** map same logical manifest to **S3 / Azure Blob / GCS** + cloud runners (reuse trainer image where possible).

---

**Last updated:** 2026-05-02
