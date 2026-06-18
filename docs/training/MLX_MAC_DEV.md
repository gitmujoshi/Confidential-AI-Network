# Apple Silicon training — local dev guide

> **Vocabulary:** [GLOSSARY.md](../GLOSSARY.md) — MLX, MPS, Opacus, `local-native`, `local-docker`, `privacyMetrics`, …

On **Apple Silicon Macs**, use host-native training instead of Docker CPU for day-to-day dev. Two modes:

| Mode | Best for |
|------|----------|
| **`local-native`** (recommended) | Same `train.py` as Docker — Hugging Face DistilBERT, **Opacus DP-SGD**, privacy metrics, tabular/vision |
| **`local-mlx`** | Fast MLX GPU experiments, `mlx-lm` LoRA (manual); no DP |
| **`local-docker`** | Linux CI, teammates without Mac, production-like containers |

**Validated on dev hardware:** Apple **M3 Pro**, macOS **26.3**, `arm64`.

---

## Why not Docker on Mac?

`local-docker` uses a **Linux container with PyTorch CPU**. Metal/MPS does not pass through to the container, so NLP training on an M3 was CPU-bound.

| | `local-docker` | `local-native` | `local-mlx` |
|--|----------------|----------------|-------------|
| **Same `train.py` / HF / Opacus** | ✅ | ✅ | ❌ (`train_mlx.py`) |
| **GPU acceleration** | ❌ CPU | ✅ MPS (non-DP) | ✅ MLX |
| **DP + `privacyMetrics`** | ✅ | ✅ (Opacus on **CPU**) | ❌ |
| **CI / Linux** | ✅ | ❌ | ❌ |

---

## `local-native` — PyTorch MPS + HF/DP parity

### Setup

```bash
cd backend/local-training
chmod +x scripts/setup-native-venv.sh
./scripts/setup-native-venv.sh
```

Creates `backend/local-training/.venv-native` with the same packages as `Dockerfile` (macOS PyTorch wheels include MPS).

### Configure CAN

```bash
# config.env
TRAINING_EXECUTION_MODE=local-native
TRAINING_SIMULATION_MODE=false
# Optional:
# LOCAL_NATIVE_PYTHON=/path/to/.venv-native/bin/python
# TRAINER_DEVICE=auto          # auto | mps | cpu (passed to train.py)
# TRAINER_DP_ON_MPS=false        # Opacus DP-SGD defaults to CPU (reliable)
```

Restart the backend, then:

```bash
curl -s http://localhost:5001/api/debug/env | jq '.training.native'
```

### Device behaviour (`train.py`)

- **`TRAINER_DEVICE=auto`** (default): **MPS** for standard NLP/vision; **CPU** when differential privacy is enabled (Opacus is CUDA-first; MPS DP is experimental).
- **`TRAINER_DP_ON_MPS=true`**: attempt DP-SGD on MPS (may fail — use for experiments only).
- Logs include `[trainer] text device=mps` or `device=cpu`.

### Standalone smoke (no backend)

```bash
mkdir -p /tmp/native-smoke/{inputs,outputs}
cat > /tmp/native-smoke/inputs/contract.json <<'EOF'
{
  "contract": {
    "trainingParams": {
      "taskType": "text",
      "fastDevRun": true,
      "maxEpochs": 1,
      "differentialPrivacy": { "enabled": true, "epsilon": 0.5, "delta": 1e-5 }
    }
  },
  "datasets": [{ "metadata": { "hfDatasetId": "ag_news" } }]
}
EOF

TRAINING_JOB_ID=smoke CONTRACT_ID=SMOKE \
  CONTRACT_JSON_PATH=/tmp/native-smoke/inputs/contract.json \
  OUTPUT_DIR=/tmp/native-smoke/outputs \
  .venv-native/bin/python train.py

jq '.privacyMetrics, .accuracy' /tmp/native-smoke/outputs/metrics.json
```

E2E NLP DP tests accept `local-native` when `E2E_WAIT_FOR_LOCAL_TRAINING=true`.

---

## `local-mlx` — MLX GPU (no DP)

For lightweight GPU iteration or manual `mlx-lm` work:

```bash
./scripts/setup-mlx-venv.sh
# TRAINING_EXECUTION_MODE=local-mlx
```

See `train_mlx.py` and [mlx-lm LORA docs](https://github.com/ml-explore/mlx-lm/blob/main/mlx_lm/LORA.md). **Do not enable differential privacy** on MLX contracts (trainer exits with code 2).

---

## Choosing a mode

| Goal | Mode |
|------|------|
| **HF + Opacus DP on your Mac (recommended dev)** | `local-native` |
| Fast non-DP GPU without full HF stack | `local-mlx` |
| Stakeholder demo / Linux CI | `local-docker` |
| Production cloud / CCRP | default cloud path |

---

## Related docs

- [LOCAL_DEMO_RUNBOOK.md](./LOCAL_DEMO_RUNBOOK.md)
- [TDC_TRAINING_RUNTIME.md](./TDC_TRAINING_RUNTIME.md)
- [HUGGINGFACE.md](../integrations/HUGGINGFACE.md)
