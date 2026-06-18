# Local demo runbook — contract to physical training

One-page guide for a **stakeholder demo** on a laptop or VM. Assumes macOS/Linux with Docker Desktop.

**Honest scope:** This is **local Docker training**, not cloud TEE. Customer CSV/image data is used when uploaded; otherwise the trainer falls back to public demo sets (Iris, CIFAR-10, AG News).

---

## Before the demo (15 min)

```bash
# 1. Start stack
./start-system.sh

# 2. Build trainer image (after any train.py change)
docker build -t contractmanagement/local-trainer:latest backend/local-training

# 3. Confirm config (repo root config.env)
#    CAN_LOCAL_TRAINING_MODE=docker
#    TRAINING_EXECUTION_MODE=local-docker
#    LOCAL_TRAINING_IMAGE=contractmanagement/local-trainer:latest

# 4. Restart backend if you changed config.env
#    (stop backend process, then from backend/: npm start)

# 5. Health check
npm run status
curl -s http://localhost:5001/api/debug/env | jq .training
# Expect: canLocalTrainingMode: "docker"
```

**Demo files to prepare**

| Track | Files | Notes |
|-------|--------|--------|
| **Tabular (recommended)** | `demo.csv` — numeric columns + integer label in last column | Fastest; ~1 min training |
| **Vision (optional)** | Folder `class_a/` and `class_b/` with a few `.png` images each | Uses ResNet18 fine-tune; slower first run (weight download) |
| **NLP / HF (optional)** | No upload — uses Hub refs from demo catalog | `demo-ag-news` + `demo-model-text-tiny-distilbert`; see [HF integration](../integrations/HUGGINGFACE.md) |

Example tabular CSV:

```csv
f1,f2,f3,label
1.0,2.1,0.5,0
2.1,1.0,1.2,1
0.5,2.0,1.8,0
1.8,0.9,2.1,1
```

---

## Roles & logins

| Role | How to get an account for demo |
|------|--------------------------------|
| **TDP** | Register at `/register` or use `tdp.e2e@test.com` / `TestNewPassword123!` |
| **TDC** | Register at `/register` or use seeded TDC healthcare user |
| **CCRP** | Use **`ccrp.e2e@test.com`** / `TestNewPassword123!` (required if wizard picks “CCRP E2E User”) |

---

## Live script (~15–20 min)

### 1. TDP — dataset + files (5 min)

1. Login as **TDP** → **Datasets** → **Add dataset**
2. **Basic info:** name e.g. `Demo Clinical Tabular`, category **Tabular**
3. Complete wizard steps; on **Training files** upload `demo.csv`, format **csv**
4. Submit → open **Dataset detail** → confirm **artifact count > 0**

**Talking point:** Metadata-only datasets are allowed; without files, training uses built-in demo data (say this only if you skip upload).

### 2. TDC — contract (5 min)

1. Login as **TDC** → **Contracts** → **Create**
2. Pick a template → select **your dataset** (click dataset **heading**, not outer card)
3. **AI Models:** choose **E2E Logistic Regression** or **Logistic Regression (Demo)**
4. **Environment:** Cloud = **Local (Docker)** → select **CCRP E2E User**
5. Fill KMS fields (any demo values) → review → **Create contract**
6. Note **contract ID** (e.g. `RICARDIAN-...`)

### 3. Signing (3 min)

1. **TDP** opens contract → **Sign as TDP** (or API sign if UI flaky)
2. **CCRP** (`ccrp.e2e@test.com`) signs → status **SIGNED**

### 4. Training (5 min)

**Option A — CAN Jobs (shows escrow story)**

1. **TDC** → `/can/jobs`
2. Paste contract ID → **Create CAN Job**
3. **Release DEK** → **Release MEK** → **Release Job** → **Wait for Training**
4. Status → **COMPLETED**; expand **Training results** (`executionMode: local-docker`)

**Option B — TDC Training (simpler)**

1. **TDC** → **Training & models** (`/tdc/training`)
2. **Start training** on signed contract
3. Poll until **COMPLETED**; download artifact if offered

### 5. Proof points (2 min)

- `backend/local-training/runs/<jobId>/outputs/metrics.json` — accuracy, `source: artifact_csv` if files uploaded
- Contract **provenance** / SCITT claims (if SCITT enabled)
- CAN **provenance events** on job

### Optional: NLP track with Hugging Face (5 min)

1. Seed demo catalog: `node backend/scripts/dev/seed-demo-catalog.js`
2. In `config.env`: `HUGGINGFACE_INTEGRATION_ENABLED=true` (optional Hub API); put `HF_TOKEN` in `secrets.env` for gated org repos
3. Rebuild trainer image after `train.py` changes
4. **TDC** contract: dataset **AG News (Demo)** + model **Tiny DistilBERT (Demo)** → train locally
5. Verify `metrics.json` shows `"dataset": "ag_news"` and `"source": "catalog_hf_reference"` (or `catalog_metadata`)
6. Dev API: `curl -s http://localhost:5001/api/dev/huggingface/datasets/ag_news | jq`

---

## Fallback talking points

| If this happens | Say |
|-----------------|-----|
| Training fast but “not our data” | No artifacts uploaded → demo Iris/CIFAR path by design |
| CCRP sign 403 | Contract assigned to different CCRP than signer |
| Training FAILED, NumPy error | Rebuild trainer image (`numpy<2` in Dockerfile) |
| CAN still ~1s COMPLETED | Backend not restarted; `CAN_LOCAL_TRAINING_MODE` still `simulate` |
| CIFAR download slow | First vision run downloads ~170MB; use tabular track for tight schedule |

---

## What not to claim in this demo

- Real confidential computing / TEE (local Docker only)
- Customer’s arbitrary `.pt` / `.onnx` upload as base weights (catalog **architecture** hints only)
- Multi-cloud CCRP or OCI-deployed training (local path only)

---

## Related docs

- [PHASE_A_LOCAL_ARTIFACTS.md](./PHASE_A_LOCAL_ARTIFACTS.md) — upload & staging design
- [TDC_TRAINING_RUNTIME.md](./TDC_TRAINING_RUNTIME.md) — env vars and APIs
- [../integrations/HUGGINGFACE.md](../integrations/HUGGINGFACE.md) — Hub catalog refs (dev)
- [docs/deployment/README.md](../deployment/README.md) — OCI and production paths
