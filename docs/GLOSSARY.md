# Glossary — technical vocabulary

Canonical definitions for terms used across CAN documentation, code, and UI. For a short subset, see the [root README glossary](../README.md#glossary-essential-terms).

---

## Platform and parties

| Term | Meaning |
|------|---------|
| **CAN** | **Confidential AI Network** — this multi-party contract and training platform. |
| **TDC** | **Training Data Consumer** — organization that contracts to train models on a TDP’s data. |
| **TDP** | **Training Data Provider** — organization that publishes datasets and approves use under contract. |
| **TSP** | **Tech Service Provider** — hosts isolated training environments (TEE, private cloud, or local Docker). Samyog/DEPA term; replaces legacy **CCRP**. |
| **AppAdmin** | Platform administrator (users, health, configuration). |
| **DEPA** | [Data Empowerment and Protection Architecture](https://depa.world) — India’s consent and data-governance framework; CAN aligns with DEPA-style multi-party data sharing. |
| **Ricardian contract** | Human-readable legal terms bound to machine-enforceable structure (datasets, training params, privacy, CCRP). |
| **AIModel** | Catalog entry for a base or trained model referenced by contracts and training jobs. |

---

## Ledger, provenance, and audit

| Term | Meaning |
|------|---------|
| **SCITT CCF** | Microsoft **Secure Coordination of Integrity and Transparency for Confidential Consortium Framework** — confidential ledger for tamper-evident contract and training claims. |
| **Provenance** | Cryptographic and metadata trail linking contracts, datasets, training jobs, artifacts, and parties. |
| **SIEM** | **Security Information and Event Management** — enterprise log/analytics stack; CAN exports canonical audit events (Splunk, Sentinel, OCI Logging, webhooks). |
| **privacyMetrics** | Job result fields (`epsilon`, `delta`, `mechanism`, etc.) surfaced after privacy-preserving training; shown in the TDC **Privacy metrics** panel. |

---

## Training execution (local dev and runtime)

| Term | Meaning |
|------|---------|
| **TRAINING_EXECUTION_MODE** | Backend env var selecting how signed contracts run: `local-docker`, `local-native`, `local-mlx`, simulation, or cloud/CCRP path. |
| **local-docker** | Training in a **Linux Docker container** on the backend host (`train.py`). Cross-platform; PyTorch **CPU** in the published image; supports **Opacus DP-SGD** and full E2E tests. |
| **local-native** | **Host-native** training on **Apple Silicon** — same `train.py` as Docker, macOS PyTorch with **MPS** (GPU) for non-DP jobs; Opacus DP-SGD on **CPU**. See [MLX_MAC_DEV.md](training/MLX_MAC_DEV.md). |
| **local-mlx** | Host-native **Apple MLX** path (`train_mlx.py`) for fast GPU experiments on Mac; **no** Opacus DP. |
| **TRAINING_SIMULATION_MODE** | When `true`, jobs complete without real trainer execution (demo/CI-friendly). |
| **TRAINER_DEVICE** | `train.py` env: `auto` \| `mps` \| `cpu` \| `cuda` — device selection for PyTorch (native Mac defaults to MPS except when DP is enabled). |
| **train.py** | Canonical Python trainer (tabular, vision, NLP/HF); used in Docker and `local-native`. |
| **train_mlx.py** | Lightweight MLX text trainer for `local-mlx` only. |
| **metrics.json** | Trainer output written under `backend/local-training/runs/<jobId>/outputs/`; backend maps into `TrainingJob.metadata.results`. |

---

## Privacy and PETs

| Term | Meaning |
|------|---------|
| **PET** | **Privacy-Enhancing Technology** — techniques (DP, federated learning, secure MPC, etc.) declared in contracts and training params. |
| **Differential privacy (DP)** | Mathematical guarantee limiting what can be inferred about any single training record; controlled by **ε** (epsilon) and **δ** (delta). |
| **ε (epsilon)** | Privacy budget — lower spent ε generally means stronger privacy (often traded off against utility). |
| **δ (delta)** | Failure probability in (ε, δ)-DP; typically very small (e.g. `1e-5`). |
| **DP-SGD** | **Differentially Private Stochastic Gradient Descent** — trains with per-sample gradient clipping and noise. |
| **Opacus** | Meta’s PyTorch library implementing **DP-SGD** (`PrivacyEngine`, `make_private`); used in `train.py` for NLP when `differentialPrivacy.enabled` is set. |
| **maxGradNorm** | Gradient clipping threshold in DP-SGD (contract / `trainingParams.differentialPrivacy`). |
| **noise multiplier** | Opacus parameter scaling Gaussian noise added to clipped gradients. |
| **differentialPrivacy.enabled** | Contract/training flag that turns on Opacus in the text trainer path. |

---

## ML stack and integrations

| Term | Meaning |
|------|---------|
| **MLX** | Apple’s open-source array/NN framework optimized for **Apple Silicon** unified memory and GPU. |
| **mlx-lm** | Python package on top of MLX for LLM inference and **LoRA** fine-tuning; integrates with Hugging Face Hub. |
| **MPS** | **Metal Performance Shaders** — PyTorch device backend (`device=mps`) for GPU acceleration on macOS. |
| **Hugging Face (HF) Hub** | Public model/dataset registry; CAN catalog can reference Hub repos (`hfDatasetId`, `huggingfaceModel`) for dev training. |
| **transformers** | Hugging Face library used in `train.py` for NLP (e.g. DistilBERT on AG News). |
| **HF_TOKEN** | Hub access token for gated/private repos; passed into trainers via backend env (`secrets.env`). |
| **LoRA** | **Low-Rank Adaptation** — parameter-efficient fine-tuning (common with `mlx-lm`; not yet in contract runner). |
| **QLoRA** | LoRA on **quantized** weights — lower memory fine-tuning. |
| **fastDevRun** | Contract/training flag for small subsets and fewer epochs (demos and E2E). |

---

## Security and confidential compute

| Term | Meaning |
|------|---------|
| **TEE** | **Trusted Execution Environment** — hardware-isolated enclave (SGX, SEV, confidential VMs) for decrypt-and-train inside attested boundaries. |
| **Attestation** | Cryptographic proof that a TEE or workload runs expected software before keys/data are released. |
| **LUKS** | Linux disk encryption used for large dataset artifacts at rest. |
| **KMS** | **Key Management Service** — vault-backed keys referenced in contract `kmsConfigs` / `environmentSpecs`. |
| **Keycloak** | OIDC identity provider for CAN authentication and role mapping. |

---

## CAN / JCS (job coordination)

| Term | Meaning |
|------|---------|
| **CAN JCS** | **Job Coordination Service** — API for confidential training job lifecycle (keys released, scheduler, physical Docker runner in opt-in tests). |
| **DEK / MEK** | Data / model encryption keys released to authorized principals during CAN JCS flows. |

---

## Cloud and deployment (pointers)

Extended infra vocabulary (OKE, AKS, WAF, compartments, etc.) lives in:

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [OCI_SECURITY_ARCHITECTURE.md](production/OCI_SECURITY_ARCHITECTURE.md)
- [AZURE_SECURITY_ARCHITECTURE.md](production/AZURE_SECURITY_ARCHITECTURE.md)

---

*Last updated: 2026-06-18*
