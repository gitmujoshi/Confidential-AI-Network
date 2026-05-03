import json
import os
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Optional, Tuple


def _env(name: str, default: str | None = None) -> str | None:
    v = os.environ.get(name)
    if v is None or v == "":
        return default
    return v


def _now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _safe_read_json(path: Path) -> Optional[dict]:
    try:
        if not path.exists():
            return None
        return json.loads(path.read_text())
    except Exception:
        return None


def _infer_task(training_params: dict) -> str:
    """
    Decide which trainer to run.
    Supported: tabular | vision | text
    """
    task = training_params.get("taskType") or training_params.get("task") or None
    if isinstance(task, str) and task.strip():
        t = task.strip().lower()
        if t in ("tabular", "table", "structured"):
            return "tabular"
        if t in ("vision", "image", "images"):
            return "vision"
        if t in ("text", "nlp"):
            return "text"

    fw = str(training_params.get("framework") or "").lower()
    arch = str(training_params.get("architecture") or "").lower()
    if "bert" in arch or "gpt" in arch or "transformer" in arch:
        return "text"
    if "resnet" in arch or "cnn" in arch or "conv" in arch:
        return "vision"
    if "xgboost" in fw or "lightgbm" in fw or "sklearn" in fw:
        return "tabular"

    # Default for local testing: tabular is fastest and most reliable.
    return "tabular"


def _fast_dev(training_params: dict) -> bool:
    v = training_params.get("fastDevRun")
    if v is None:
        return True
    return bool(v)


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


def train_tabular_csv_dir(out_dir: Path, data_dir: Path, epochs: int, fast: bool) -> TrainResult:
    """
    Train a simple classifier on the first *.csv found under data_dir.
    Expects numeric feature columns and the last column as integer class labels.
    """
    import csv
    import pickle
    import numpy as np
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import accuracy_score, log_loss
    from sklearn.model_selection import train_test_split

    csv_files = sorted(data_dir.glob("*.csv"))
    if not csv_files:
        raise FileNotFoundError(f"No CSV files under {data_dir}")

    path = csv_files[0]
    rows_x = []
    rows_y = []
    with open(path, newline="") as f:
        reader = csv.reader(f)
        header = next(reader, None)
        for row in reader:
            if not row:
                continue
            feats = [float(x) for x in row[:-1]]
            label = int(float(row[-1]))
            rows_x.append(feats)
            rows_y.append(label)

    X = np.asarray(rows_x, dtype=np.float32)
    y = np.asarray(rows_y, dtype=np.int64)
    if len(X) < 4:
        raise ValueError("Need at least 4 rows in CSV for train/test split")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y if len(set(y)) > 1 else None
    )

    max_iter = 120 if fast else 400
    clf = LogisticRegression(max_iter=max_iter, n_jobs=1)
    clf.fit(X_train, y_train)
    preds = clf.predict(X_test)
    probs = clf.predict_proba(X_test)

    acc = float(accuracy_score(y_test, preds))
    loss = float(log_loss(y_test, probs))

    artifact_path = out_dir / "model.bin"
    artifact_path.write_bytes(pickle.dumps(clf))

    return TrainResult(
        accuracy=acc,
        loss=loss,
        epochsCompleted=max(1, int(epochs)),
        artifactUri=f"file://{artifact_path}",
        extra={
            "taskType": "tabular",
            "dataset": path.name,
            "model": "logistic_regression_csv",
            "source": "artifact_csv",
        },
    )


def train_tabular_iris(out_dir: Path, epochs: int, fast: bool) -> TrainResult:
    """
    Real training on a small open dataset (Iris) using scikit-learn.
    """
    from sklearn.datasets import load_iris
    from sklearn.linear_model import LogisticRegression
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score, log_loss
    import pickle

    data = load_iris()
    X_train, X_test, y_train, y_test = train_test_split(
        data.data, data.target, test_size=0.25, random_state=42, stratify=data.target
    )

    # "epochs" isn't a first-class concept here; use it to scale max_iter a bit.
    max_iter = 80 if fast else 200
    max_iter = max_iter + max(0, epochs - 1) * (40 if fast else 80)

    clf = LogisticRegression(max_iter=max_iter, n_jobs=1)
    clf.fit(X_train, y_train)
    preds = clf.predict(X_test)
    probs = clf.predict_proba(X_test)

    acc = float(accuracy_score(y_test, preds))
    loss = float(log_loss(y_test, probs))

    artifact_path = out_dir / "model.bin"
    artifact_path.write_bytes(pickle.dumps(clf))

    return TrainResult(
        accuracy=acc,
        loss=loss,
        epochsCompleted=epochs,
        artifactUri=f"file://{artifact_path}",
        extra={"taskType": "tabular", "dataset": "iris", "model": "logistic_regression"},
    )


def train_vision_cifar10_small(out_dir: Path, epochs: int, fast: bool) -> TrainResult:
    """
    Real training on CIFAR-10 (downloaded). Uses a tiny CNN for speed.
    Falls back to torchvision FakeData if CIFAR cannot be downloaded.
    """
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import DataLoader, Subset
    import torchvision
    from torchvision import transforms

    device = torch.device("cpu")
    torch.manual_seed(42)

    tfm = transforms.Compose([transforms.ToTensor()])
    root = Path("/tmp/datasets")
    root.mkdir(parents=True, exist_ok=True)

    dataset_name = "cifar10"
    try:
        train_ds = torchvision.datasets.CIFAR10(root=str(root), train=True, download=True, transform=tfm)
        test_ds = torchvision.datasets.CIFAR10(root=str(root), train=False, download=True, transform=tfm)
    except Exception:
        dataset_name = "fakedata"
        train_ds = torchvision.datasets.FakeData(size=2000, image_size=(3, 32, 32), num_classes=10, transform=tfm)
        test_ds = torchvision.datasets.FakeData(size=500, image_size=(3, 32, 32), num_classes=10, transform=tfm)

    # Keep it small for dev/test.
    if fast:
        train_ds = Subset(train_ds, list(range(512)))
        test_ds = Subset(test_ds, list(range(256)))

    train_loader = DataLoader(train_ds, batch_size=64, shuffle=True)
    test_loader = DataLoader(test_ds, batch_size=128, shuffle=False)

    class TinyCNN(nn.Module):
        def __init__(self):
            super().__init__()
            self.net = nn.Sequential(
                nn.Conv2d(3, 16, 3, padding=1),
                nn.ReLU(),
                nn.MaxPool2d(2),
                nn.Conv2d(16, 32, 3, padding=1),
                nn.ReLU(),
                nn.MaxPool2d(2),
                nn.Flatten(),
                nn.Linear(32 * 8 * 8, 128),
                nn.ReLU(),
                nn.Linear(128, 10),
            )

        def forward(self, x):
            return self.net(x)

    model = TinyCNN().to(device)
    criterion = nn.CrossEntropyLoss()
    opt = optim.Adam(model.parameters(), lr=1e-3)

    epochs = max(1, int(epochs))
    for _ in range(epochs):
        model.train()
        for xb, yb in train_loader:
            xb, yb = xb.to(device), yb.to(device)
            opt.zero_grad()
            logits = model(xb)
            loss = criterion(logits, yb)
            loss.backward()
            opt.step()

    model.eval()
    correct = 0
    total = 0
    losses = []
    with torch.no_grad():
        for xb, yb in test_loader:
            xb, yb = xb.to(device), yb.to(device)
            logits = model(xb)
            loss = criterion(logits, yb)
            losses.append(float(loss.item()))
            pred = logits.argmax(dim=1)
            correct += int((pred == yb).sum().item())
            total += int(yb.size(0))

    acc = float(correct / max(1, total))
    avg_loss = float(sum(losses) / max(1, len(losses)))

    artifact_path = out_dir / "model.bin"
    torch.save({"state_dict": model.state_dict(), "arch": "tinycnn"}, str(artifact_path))

    return TrainResult(
        accuracy=acc,
        loss=avg_loss,
        epochsCompleted=epochs,
        artifactUri=f"file://{artifact_path}",
        extra={"taskType": "vision", "dataset": dataset_name, "model": "tinycnn"},
    )


def train_text_agnews_tiny(out_dir: Path, epochs: int, fast: bool) -> TrainResult:
    """
    Real training on AG News (downloaded) using a tiny DistilBERT model for speed.
    """
    import torch
    from datasets import load_dataset
    from transformers import AutoModelForSequenceClassification, AutoTokenizer

    torch.manual_seed(42)
    device = torch.device("cpu")

    model_name = "sshleifer/tiny-distilbert-base-cased"
    ds = load_dataset("ag_news")
    train_ds = ds["train"]
    test_ds = ds["test"]

    if fast:
        train_ds = train_ds.select(range(256))
        test_ds = test_ds.select(range(256))

    tok = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSequenceClassification.from_pretrained(model_name, num_labels=4).to(device)

    def encode(batch):
        return tok(batch["text"], truncation=True, padding="max_length", max_length=128)

    train_enc = train_ds.map(encode, batched=True)
    test_enc = test_ds.map(encode, batched=True)

    cols = ["input_ids", "attention_mask", "label"]
    train_enc.set_format(type="torch", columns=cols)
    test_enc.set_format(type="torch", columns=cols)

    train_loader = torch.utils.data.DataLoader(train_enc, batch_size=16, shuffle=True)
    test_loader = torch.utils.data.DataLoader(test_enc, batch_size=32, shuffle=False)

    opt = torch.optim.AdamW(model.parameters(), lr=2e-4)
    loss_fn = torch.nn.CrossEntropyLoss()

    epochs = max(1, int(epochs))
    for _ in range(epochs):
        model.train()
        for batch in train_loader:
            opt.zero_grad()
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["label"].to(device)
            logits = model(input_ids=input_ids, attention_mask=attention_mask).logits
            loss = loss_fn(logits, labels)
            loss.backward()
            opt.step()

    model.eval()
    correct = 0
    total = 0
    losses = []
    with torch.no_grad():
        for batch in test_loader:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["label"].to(device)
            logits = model(input_ids=input_ids, attention_mask=attention_mask).logits
            loss = loss_fn(logits, labels)
            losses.append(float(loss.item()))
            preds = logits.argmax(dim=1)
            correct += int((preds == labels).sum().item())
            total += int(labels.size(0))

    acc = float(correct / max(1, total))
    avg_loss = float(sum(losses) / max(1, len(losses)))

    artifact_path = out_dir / "model.bin"
    torch.save(
        {"state_dict": model.state_dict(), "model_name": model_name, "task": "ag_news"},
        str(artifact_path),
    )

    return TrainResult(
        accuracy=acc,
        loss=avg_loss,
        epochsCompleted=epochs,
        artifactUri=f"file://{artifact_path}",
        extra={"taskType": "text", "dataset": "ag_news", "model": model_name},
    )


def main() -> int:
    job_id = _env("TRAINING_JOB_ID", "job-local")
    contract_id = _env("CONTRACT_ID", "CONTRACT-local")
    contract_json_path = _env("CONTRACT_JSON_PATH", "/inputs/contract.json")
    out_dir = Path(_env("OUTPUT_DIR", "/outputs"))
    out_dir.mkdir(parents=True, exist_ok=True)

    # Load the contract-driven input bundle if present.
    contract_inputs = None
    try:
        p = Path(contract_json_path)
        if p.exists():
            contract_inputs = json.loads(p.read_text())
            tp = contract_inputs.get("contract", {}).get("trainingParams")
            if isinstance(tp, dict) and "maxEpochs" in tp:
                os.environ["MAX_EPOCHS"] = str(tp["maxEpochs"])
    except Exception as e:
        print(f"[trainer] warning: failed reading CONTRACT_JSON_PATH: {e}", file=sys.stderr, flush=True)

    max_epochs = int(_env("MAX_EPOCHS", "5"))
    tp = (contract_inputs.get("contract", {}).get("trainingParams") if contract_inputs else None) or {}
    if not isinstance(tp, dict):
        tp = {}
    fast = _fast_dev(tp)
    task = _infer_task(tp)

    # For dev/test: keep real training fast unless explicitly configured otherwise.
    if fast and max_epochs > 2:
        max_epochs = 1

    print(f"[trainer] starting job={job_id} contract={contract_id}", flush=True)
    print(f"[trainer] writing outputs to {out_dir}", flush=True)
    if contract_inputs:
        ds = contract_inputs.get("datasets") or []
        ms = contract_inputs.get("models") or []
        print(f"[trainer] contract inputs loaded: datasets={len(ds)} models={len(ms)}", flush=True)
    print(f"[trainer] selected task={task} fastDevRun={fast} epochs={max_epochs}", flush=True)

    started = time.time()

    # Phase A: contract supplies staged dataset paths under /inputs/datasets/<datasetId>
    artifact_ds = None
    if contract_inputs:
        for ds in contract_inputs.get("datasets") or []:
            cpath = ds.get("containerDataPath") or ds.get("container_data_path")
            if not cpath:
                continue
            p = Path(cpath)
            staged = ds.get("stagedForTraining") or ds.get("staged_for_training")
            fmt = str(ds.get("dataFormat") or ds.get("contentFormat") or "").lower()
            if p.is_dir() and staged and fmt in ("csv", "tabular"):
                artifact_ds = p
                break
            if p.is_dir() and list(p.glob("*.csv")):
                artifact_ds = p
                break

    if artifact_ds is not None:
        res = train_tabular_csv_dir(
            out_dir=out_dir, data_dir=artifact_ds, epochs=max_epochs, fast=fast
        )
    elif task == "vision":
        res = train_vision_cifar10_small(out_dir=out_dir, epochs=max_epochs, fast=fast)
    elif task == "text":
        res = train_text_agnews_tiny(out_dir=out_dir, epochs=max_epochs, fast=fast)
    else:
        res = train_tabular_iris(out_dir=out_dir, epochs=max_epochs, fast=fast)
    elapsed_s = round(time.time() - started, 3)

    artifact_path = out_dir / "model.bin"
    metrics = {
        "jobId": job_id,
        "contractId": contract_id,
        **res.to_metrics(),
        "elapsedSeconds": elapsed_s,
        "inputs": {
            "datasets": (contract_inputs.get("datasets") if contract_inputs else None),
            "models": (contract_inputs.get("models") if contract_inputs else None),
            "trainingParams": (contract_inputs.get("contract", {}).get("trainingParams") if contract_inputs else None),
            "environmentSpecs": (contract_inputs.get("contract", {}).get("environmentSpecs") if contract_inputs else None),
        },
        "generatedAt": _now_iso(),
    }
    (out_dir / "metrics.json").write_text(json.dumps(metrics, indent=2))

    print("[trainer] completed", flush=True)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as e:
        print(f"[trainer] failed: {e}", file=sys.stderr, flush=True)
        raise

