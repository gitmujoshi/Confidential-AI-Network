#!/usr/bin/env python3
"""
Native Apple Silicon trainer (MLX) — dev path for text classification demos.

Reads the same CONTRACT_JSON_PATH / OUTPUT_DIR contract as train.py but runs on
the host GPU via MLX. Not used inside Docker.

Scope (v1): text task on Hub datasets (e.g. ag_news) with a small MLX MLP.
Differential privacy (Opacus) is PyTorch-only — use TRAINING_EXECUTION_MODE=local-docker for DP.
"""
from __future__ import annotations

import json
import os
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import mlx.core as mx
import mlx.nn as nn
import mlx.optimizers as optim
import numpy as np


def _env(name: str, default: str = "") -> str:
    return os.environ.get(name, default)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _resolve_hf_dataset_spec(contract_inputs: Optional[dict]) -> Dict[str, Any]:
    if not contract_inputs:
        return {"repo_id": "ag_news", "split_train": "train", "split_test": "test"}
    for ds in contract_inputs.get("datasets") or []:
        meta = ds.get("metadata") or {}
        hf = meta.get("huggingface") or {}
        repo_id = hf.get("repoId") or meta.get("hfDatasetId")
        if repo_id:
            return {
                "repo_id": repo_id,
                "split_train": hf.get("splitTrain") or "train",
                "split_test": hf.get("splitTest") or "test",
            }
    return {"repo_id": "ag_news", "split_train": "train", "split_test": "test"}


def _fast_dev(training_params: dict) -> bool:
    v = training_params.get("fastDevRun")
    return v is True or str(v).lower() in ("1", "true", "yes")


def _dp_requested(training_params: dict) -> bool:
    dp = training_params.get("differentialPrivacy") or {}
    if isinstance(dp, dict) and dp.get("enabled"):
        return True
    pt = str(training_params.get("privacyTechnique") or "").lower()
    return "differential" in pt


def _build_vocab(texts: List[str], max_vocab: int = 4000) -> Dict[str, int]:
    freq: Dict[str, int] = {}
    for t in texts:
        for w in str(t).lower().split():
            freq[w] = freq.get(w, 0) + 1
    items = sorted(freq.items(), key=lambda x: (-x[1], x[0]))[: max_vocab - 2]
    vocab = {"<pad>": 0, "<unk>": 1}
    for i, (w, _) in enumerate(items, start=2):
        vocab[w] = i
    return vocab


def _bow_batch(texts: List[str], vocab: Dict[str, int], dim: int) -> mx.array:
    rows = np.zeros((len(texts), dim), dtype=np.float32)
    for i, t in enumerate(texts):
        for w in str(t).lower().split():
            idx = vocab.get(w, 1)
            if idx < dim:
                rows[i, idx] += 1.0
    return mx.array(rows)


@dataclass
class TrainResult:
    accuracy: Optional[float] = None
    loss: Optional[float] = None
    epochsCompleted: Optional[int] = None
    artifactUri: Optional[str] = None
    extra: Optional[Dict[str, Any]] = None

    def to_metrics(self) -> Dict[str, Any]:
        out: Dict[str, Any] = {}
        if self.accuracy is not None:
            out["accuracy"] = float(self.accuracy)
        if self.loss is not None:
            out["loss"] = float(self.loss)
        if self.epochsCompleted is not None:
            out["epochsCompleted"] = int(self.epochsCompleted)
        if self.artifactUri is not None:
            out["artifactUri"] = self.artifactUri
        if self.extra:
            out.update(self.extra)
        return out


class TextMlp(nn.Module):
    def __init__(self, input_dim: int, num_classes: int = 4):
        super().__init__()
        self.layers = [
            nn.Linear(input_dim, 256),
            nn.ReLU(),
            nn.Linear(256, 64),
            nn.ReLU(),
            nn.Linear(64, num_classes),
        ]

    def __call__(self, x: mx.array) -> mx.array:
        for layer in self.layers:
            x = layer(x)
        return x


def _normalize_dataset_repo(repo_id: str) -> str:
    """Map legacy script ids to namespaced Hub repos (newer huggingface_hub)."""
    legacy = {
        "ag_news": "SetFit/ag_news",
    }
    return legacy.get(repo_id, repo_id)


def train_text_mlx(
    out_dir: Path,
    epochs: int,
    fast: bool,
    dataset_spec: Dict[str, Any],
) -> TrainResult:
    from datasets import load_dataset

    repo_id = _normalize_dataset_repo(dataset_spec.get("repo_id") or "ag_news")
    split_train = dataset_spec.get("split_train") or "train"
    split_test = dataset_spec.get("split_test") or "test"

    ds = load_dataset(repo_id)
    train_ds = ds[split_train]
    test_ds = ds[split_test]

    if fast:
        train_ds = train_ds.select(range(512))
        test_ds = test_ds.select(range(256))

    train_texts = [row["text"] for row in train_ds]
    test_texts = [row["text"] for row in test_ds]
    train_labels = np.array([int(row["label"]) for row in train_ds], dtype=np.int32)
    test_labels = np.array([int(row["label"]) for row in test_ds], dtype=np.int32)

    vocab = _build_vocab(train_texts + test_texts)
    input_dim = max(vocab.values()) + 1

    model = TextMlp(input_dim=input_dim)
    optimizer = optim.Adam(learning_rate=1e-3)

    def loss_fn(model, x, y):
        logits = model(x)
        return nn.losses.cross_entropy(logits, y, reduction="mean")

    loss_and_grad = nn.value_and_grad(model, loss_fn)

    batch_size = 64
    n_train = len(train_texts)

    for epoch in range(epochs):
        perm = np.random.permutation(n_train)
        epoch_loss = 0.0
        steps = 0
        for start in range(0, n_train, batch_size):
            idx = perm[start : start + batch_size]
            batch_texts = [train_texts[i] for i in idx]
            batch_y = mx.array(train_labels[idx])
            batch_x = _bow_batch(batch_texts, vocab, input_dim)
            loss, grads = loss_and_grad(model, batch_x, batch_y)
            optimizer.update(model, grads)
            mx.eval(model.parameters(), optimizer.state, loss)
            epoch_loss += float(loss.item())
            steps += 1
        print(
            f"[trainer-mlx] epoch {epoch + 1}/{epochs} train_loss={epoch_loss / max(steps, 1):.4f}",
            flush=True,
        )

    # Evaluate
    test_x = _bow_batch(test_texts, vocab, input_dim)
    test_y = mx.array(test_labels)
    logits = model(test_x)
    preds = mx.argmax(logits, axis=1)
    acc = float(mx.mean(preds == test_y).item())
    eval_loss = float(nn.losses.cross_entropy(logits, test_y, reduction="mean").item())

    artifact_path = out_dir / "model_mlx.safetensors"
    # Minimal artifact marker (weights not serialized in v1 — metrics + provenance path only)
    artifact_path.write_bytes(b"mlx-text-mlp-v1")

    return TrainResult(
        accuracy=acc,
        loss=eval_loss,
        epochsCompleted=epochs,
        artifactUri=f"file://{artifact_path}",
        extra={
            "framework": "mlx",
            "device": str(mx.default_device()),
            "modelType": "text-mlp-bow",
            "dataset": repo_id,
        },
    )


def main() -> int:
    job_id = _env("TRAINING_JOB_ID", "job-local-mlx")
    contract_id = _env("CONTRACT_ID", "CONTRACT-local")
    contract_json_path = _env("CONTRACT_JSON_PATH", "/inputs/contract.json")
    out_dir = Path(_env("OUTPUT_DIR", "/outputs"))
    out_dir.mkdir(parents=True, exist_ok=True)

    contract_inputs = None
    tp: dict = {}
    try:
        p = Path(contract_json_path)
        if p.exists():
            contract_inputs = json.loads(p.read_text())
            raw_tp = contract_inputs.get("contract", {}).get("trainingParams")
            if isinstance(raw_tp, dict):
                tp = raw_tp
    except Exception as e:
        print(f"[trainer-mlx] warning: failed reading CONTRACT_JSON_PATH: {e}", file=sys.stderr, flush=True)

    if _dp_requested(tp):
        print(
            "[trainer-mlx] differential privacy requested — use TRAINING_EXECUTION_MODE=local-docker "
            "(Opacus DP-SGD is PyTorch-only)",
            file=sys.stderr,
            flush=True,
        )
        return 2

    max_epochs = int(_env("MAX_EPOCHS", str(tp.get("maxEpochs") or 3)))
    fast = _fast_dev(tp)
    if fast and max_epochs > 2:
        max_epochs = 2

    print(f"[trainer-mlx] device={mx.default_device()} job={job_id} contract={contract_id}", flush=True)
    print(f"[trainer-mlx] epochs={max_epochs} fastDevRun={fast}", flush=True)

    started = time.time()
    dataset_spec = _resolve_hf_dataset_spec(contract_inputs)
    res = train_text_mlx(out_dir=out_dir, epochs=max_epochs, fast=fast, dataset_spec=dataset_spec)
    elapsed_s = round(time.time() - started, 3)

    metrics = {
        "jobId": job_id,
        "contractId": contract_id,
        **res.to_metrics(),
        "elapsedSeconds": elapsed_s,
        "inputs": {
            "datasets": (contract_inputs.get("datasets") if contract_inputs else None),
            "models": (contract_inputs.get("models") if contract_inputs else None),
            "trainingParams": tp or None,
        },
        "generatedAt": _now_iso(),
    }
    (out_dir / "metrics.json").write_text(json.dumps(metrics, indent=2))
    print("[trainer-mlx] completed", flush=True)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as e:
        print(f"[trainer-mlx] failed: {e}", file=sys.stderr, flush=True)
        raise
