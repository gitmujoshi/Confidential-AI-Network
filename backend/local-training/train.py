import json
import os
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


def _env(name: str, default: str | None = None) -> str | None:
    v = os.environ.get(name)
    if v is None or v == "":
        return default
    return v


def _now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _first_catalog_model(contract_inputs: Optional[dict]) -> Optional[dict]:
    if not contract_inputs:
        return None
    models = contract_inputs.get("models") or []
    if not models:
        return None
    first = models[0]
    return first if isinstance(first, dict) else None


def _resolve_architecture(training_params: dict, catalog_model: Optional[dict]) -> str:
    arch = training_params.get("architecture")
    if arch:
        return str(arch)
    if catalog_model and catalog_model.get("architecture"):
        return str(catalog_model["architecture"])
    return ""


def _resolve_hf_dataset_spec(contract_inputs: Optional[dict]) -> Dict[str, Any]:
    """Resolve HF dataset from contract.json dataset rows (dev catalog reference)."""
    default = {
        "repo_id": "ag_news",
        "split_train": "train",
        "split_test": "test",
        "subset": None,
        "revision": None,
        "source": "demo_ag_news",
    }
    if not contract_inputs:
        return default

    datasets = contract_inputs.get("datasets") or []
    for row in datasets:
        if not isinstance(row, dict):
            continue
        hf = row.get("huggingface")
        if isinstance(hf, dict) and hf.get("repoId"):
            return {
                "repo_id": str(hf["repoId"]),
                "split_train": hf.get("splitTrain") or hf.get("split_train") or "train",
                "split_test": hf.get("splitTest") or hf.get("split_test") or "test",
                "subset": hf.get("subset"),
                "revision": hf.get("revision"),
                "source": "catalog_hf_reference",
            }
        meta = row.get("metadata") or {}
        if isinstance(meta, dict):
            ds_id = meta.get("hfDatasetId") or meta.get("huggingfaceDataset")
            if ds_id:
                return {
                    "repo_id": str(ds_id),
                    "split_train": meta.get("splitTrain") or "train",
                    "split_test": meta.get("splitTest") or "test",
                    "subset": meta.get("subset"),
                    "revision": meta.get("revision"),
                    "source": "catalog_metadata",
                }
    return default


def _resolve_hf_model_name(training_params: dict, catalog_model: Optional[dict]) -> str:
    arch = _resolve_architecture(training_params, catalog_model).strip()
    if "/" in arch:
        return arch
    if catalog_model:
        meta = catalog_model.get("metadata") or {}
        if isinstance(meta, dict) and meta.get("huggingfaceModel"):
            return str(meta["huggingfaceModel"])
        hf = catalog_model.get("huggingface")
        if isinstance(hf, dict) and hf.get("repoId"):
            return str(hf["repoId"])
    return "sshleifer/tiny-distilbert-base-cased"


def _is_logistic_arch(architecture: str) -> bool:
    a = (architecture or "").lower()
    return "logistic" in a or a in ("logreg", "logistic-regression")


def _resolve_torch_device(*, dp_enabled: bool = False):
    """
    Pick PyTorch device for host-native runs (MPS on Apple Silicon).

    TRAINER_DEVICE: auto | mps | cpu | cuda
    TRAINER_DP_ON_MPS: when true, attempt DP-SGD on MPS (experimental; Opacus is CUDA-first).
    Default auto: MPS for standard training; CPU for DP-SGD (reliable Opacus path).
    """
    import torch

    pref = (_env("TRAINER_DEVICE") or "auto").strip().lower()

    def mps_available() -> bool:
        mps = getattr(torch.backends, "mps", None)
        return bool(mps and mps.is_available() and mps.is_built())

    if pref == "cpu":
        return torch.device("cpu")
    if pref == "cuda":
        if torch.cuda.is_available():
            return torch.device("cuda")
        print("[trainer] TRAINER_DEVICE=cuda requested but CUDA unavailable; using cpu", flush=True)
        return torch.device("cpu")
    if pref == "mps":
        if mps_available():
            return torch.device("mps")
        print("[trainer] TRAINER_DEVICE=mps requested but MPS unavailable; using cpu", flush=True)
        return torch.device("cpu")

    # auto
    dp_on_mps = str(_env("TRAINER_DP_ON_MPS") or "").lower() in ("1", "true", "yes")
    if dp_enabled and not dp_on_mps:
        if mps_available():
            print(
                "[trainer] DP-SGD: using cpu for Opacus (set TRAINER_DP_ON_MPS=true to try MPS)",
                flush=True,
            )
        return torch.device("cpu")
    if mps_available():
        return torch.device("mps")
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


def _load_hf_dataset(repo_id: str, subset: Optional[str], load_kwargs: Dict[str, Any]):
    """Load Hub dataset with legacy id fallback (newer huggingface_hub clients)."""
    from datasets import load_dataset

    legacy_map = {"ag_news": "SetFit/ag_news"}
    candidates = [repo_id]
    mapped = legacy_map.get(repo_id)
    if mapped and mapped not in candidates:
        candidates.append(mapped)
    last_err = None
    for name in candidates:
        try:
            if subset:
                return load_dataset(name, subset, **load_kwargs)
            return load_dataset(name, **load_kwargs)
        except Exception as e:
            last_err = e
    raise last_err  # type: ignore[misc]


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
    if "bert" in arch or "gpt" in arch or "transformer" in arch or "distilbert" in arch:
        return "text"
    if "resnet" in arch or "cnn" in arch or "conv" in arch or arch in ("tinycnn", "tiny-cnn"):
        return "vision"
    if "xgboost" in fw or "lightgbm" in fw or "sklearn" in fw:
        return "tabular"

    return "tabular"


def _fast_dev(training_params: dict) -> bool:
    v = training_params.get("fastDevRun")
    if v is None:
        return True
    return bool(v)


def _image_extensions() -> set:
    return {".jpg", ".jpeg", ".png", ".bmp", ".gif", ".webp"}


def _has_imagefolder_layout(root: Path) -> bool:
    if not root.is_dir():
        return False
    exts = _image_extensions()
    for child in root.iterdir():
        if not child.is_dir():
            continue
        for f in child.iterdir():
            if f.is_file() and f.suffix.lower() in exts:
                return True
    return False


def _resolve_imagefolder_dirs(data_dir: Path) -> Tuple[Path, Optional[Path]]:
    train_dir = data_dir / "train"
    val_dir = data_dir / "val"
    if train_dir.is_dir() and _has_imagefolder_layout(train_dir):
        if val_dir.is_dir() and _has_imagefolder_layout(val_dir):
            return train_dir, val_dir
        return train_dir, None
    if _has_imagefolder_layout(data_dir):
        return data_dir, None
    raise FileNotFoundError(
        f"No ImageFolder layout under {data_dir} (expected class subdirs with images, or train/val/)"
    )


def _find_staged_dataset(contract_inputs: Optional[dict], formats: Tuple[str, ...]) -> Optional[Path]:
    if not contract_inputs:
        return None
    wanted = {f.lower() for f in formats}
    for ds in contract_inputs.get("datasets") or []:
        cpath = ds.get("containerDataPath") or ds.get("container_data_path")
        if not cpath:
            continue
        p = Path(cpath)
        if not p.is_dir():
            continue
        staged = ds.get("stagedForTraining") or ds.get("staged_for_training")
        fmt = str(ds.get("dataFormat") or ds.get("contentFormat") or "").lower()
        if staged and fmt in wanted:
            return p
        if fmt in wanted and _has_imagefolder_layout(p):
            return p
        if "csv" in wanted and list(p.glob("*.csv")):
            return p
    return None


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
        next(reader, None)
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


def train_tabular_iris(
    out_dir: Path, epochs: int, fast: bool, architecture: str = "logistic-regression"
) -> TrainResult:
    import pickle

    from sklearn.datasets import load_iris
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import accuracy_score, log_loss
    from sklearn.model_selection import train_test_split

    data = load_iris()
    X_train, X_test, y_train, y_test = train_test_split(
        data.data, data.target, test_size=0.25, random_state=42, stratify=data.target
    )

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

    model_label = architecture or "logistic-regression"
    return TrainResult(
        accuracy=acc,
        loss=loss,
        epochsCompleted=epochs,
        artifactUri=f"file://{artifact_path}",
        extra={"taskType": "tabular", "dataset": "iris", "model": model_label, "source": "demo_iris"},
    )


def _build_vision_model(architecture: str, num_classes: int, fast: bool):
    import torch
    import torch.nn as nn
    import torchvision.models as tv_models

    arch = (architecture or "tinycnn").lower()

    class TinyCNN(nn.Module):
        def __init__(self, classes: int):
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
                nn.Linear(128, classes),
            )

        def forward(self, x):
            return self.net(x)

    if arch in ("tinycnn", "tiny-cnn") or "tiny" in arch:
        return TinyCNN(num_classes), "tinycnn", 32

    if "resnet" in arch:
        use50 = "50" in arch and not fast
        if use50:
            backbone = tv_models.resnet50(weights=tv_models.ResNet50_Weights.DEFAULT)
            label = "resnet50"
        else:
            backbone = tv_models.resnet18(weights=tv_models.ResNet18_Weights.DEFAULT)
            label = "resnet18"
        in_features = backbone.fc.in_features
        backbone.fc = nn.Linear(in_features, num_classes)
        return backbone, label, 224

    return TinyCNN(num_classes), "tinycnn", 32


def _run_vision_training(
    out_dir: Path,
    train_loader,
    test_loader,
    architecture: str,
    num_classes: int,
    epochs: int,
    fast: bool,
    dataset_label: str,
    source: str,
) -> TrainResult:
    import torch
    import torch.nn as nn
    import torch.optim as optim

    device = _resolve_torch_device(dp_enabled=False)
    print(f"[trainer] vision device={device}", flush=True)
    torch.manual_seed(42)

    model, model_label, _ = _build_vision_model(architecture, num_classes, fast)
    model = model.to(device)
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
    losses: List[float] = []
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
    torch.save(
        {"state_dict": model.state_dict(), "arch": model_label, "num_classes": num_classes},
        str(artifact_path),
    )

    return TrainResult(
        accuracy=acc,
        loss=avg_loss,
        epochsCompleted=epochs,
        artifactUri=f"file://{artifact_path}",
        extra={
            "taskType": "vision",
            "dataset": dataset_label,
            "model": model_label,
            "catalogArchitecture": architecture or None,
            "source": source,
        },
    )


def train_vision_image_folder(
    out_dir: Path, data_dir: Path, epochs: int, fast: bool, architecture: str
) -> TrainResult:
    import torch
    from torch.utils.data import DataLoader, random_split
    import torchvision
    from torchvision import transforms
    from torchvision.datasets import ImageFolder

    train_root, val_root = _resolve_imagefolder_dirs(data_dir)
    _, _, image_size = _build_vision_model(architecture, 2, fast)

    tfm = transforms.Compose(
        [
            transforms.Resize((image_size, image_size)),
            transforms.ToTensor(),
        ]
    )

    train_ds = ImageFolder(root=str(train_root), transform=tfm)
    num_classes = len(train_ds.classes)
    if num_classes < 2:
        raise ValueError(f"ImageFolder needs at least 2 classes, found {num_classes}")

    if val_root is not None:
        val_ds = ImageFolder(root=str(val_root), transform=tfm)
    else:
        n_val = max(1, int(0.2 * len(train_ds)))
        n_train = len(train_ds) - n_val
        train_ds, val_ds = random_split(
            train_ds, [n_train, n_val], generator=torch.Generator().manual_seed(42)
        )

    if fast:
        batch = 16
    else:
        batch = 32

    train_loader = DataLoader(train_ds, batch_size=batch, shuffle=True)
    test_loader = DataLoader(val_ds, batch_size=batch, shuffle=False)

    return _run_vision_training(
        out_dir=out_dir,
        train_loader=train_loader,
        test_loader=test_loader,
        architecture=architecture,
        num_classes=num_classes,
        epochs=epochs,
        fast=fast,
        dataset_label=str(data_dir.name),
        source="artifact_image_folder",
    )


def train_vision_cifar10_small(out_dir: Path, epochs: int, fast: bool, architecture: str) -> TrainResult:
    import torch
    from torch.utils.data import DataLoader, Subset
    import torchvision
    from torchvision import transforms

    tfm = transforms.Compose([transforms.Resize((32, 32)), transforms.ToTensor()])
    root = Path("/tmp/datasets")
    root.mkdir(parents=True, exist_ok=True)

    # fastDevRun: synthetic images only — skip ~170MB CIFAR-10 download (E2E / demos).
    if fast:
        dataset_name = "fakedata"
        train_ds = torchvision.datasets.FakeData(
            size=512, image_size=(3, 32, 32), num_classes=10, transform=tfm
        )
        test_ds = torchvision.datasets.FakeData(
            size=256, image_size=(3, 32, 32), num_classes=10, transform=tfm
        )
    else:
        dataset_name = "cifar10"
        try:
            train_ds = torchvision.datasets.CIFAR10(root=str(root), train=True, download=True, transform=tfm)
            test_ds = torchvision.datasets.CIFAR10(root=str(root), train=False, download=True, transform=tfm)
        except Exception:
            dataset_name = "fakedata"
            train_ds = torchvision.datasets.FakeData(
                size=2000, image_size=(3, 32, 32), num_classes=10, transform=tfm
            )
            test_ds = torchvision.datasets.FakeData(
                size=500, image_size=(3, 32, 32), num_classes=10, transform=tfm
            )
            train_ds = Subset(train_ds, list(range(min(512, len(train_ds)))))
            test_ds = Subset(test_ds, list(range(min(256, len(test_ds)))))

    train_loader = DataLoader(train_ds, batch_size=64, shuffle=True)
    test_loader = DataLoader(test_ds, batch_size=128, shuffle=False)

    arch = architecture or "tinycnn"
    # Avoid downloading torchvision ResNet weights during fastDevRun E2E.
    if fast and "resnet" in arch.lower():
        arch = "tinycnn"

    if "resnet" in arch.lower():
        return _run_vision_training(
            out_dir=out_dir,
            train_loader=train_loader,
            test_loader=test_loader,
            architecture=arch,
            num_classes=10,
            epochs=epochs,
            fast=fast,
            dataset_label=dataset_name,
            source="demo_cifar10",
        )

    return _run_vision_training(
        out_dir=out_dir,
        train_loader=train_loader,
        test_loader=test_loader,
        architecture="tinycnn",
        num_classes=10,
        epochs=epochs,
        fast=fast,
        dataset_label=dataset_name,
        source="demo_cifar10" if dataset_name == "cifar10" else "demo_fakedata",
    )


def _resolve_dp_config(training_params: dict) -> Dict[str, Any]:
    """Read differential-privacy settings from contract trainingParams."""
    dp = training_params.get("differentialPrivacy")
    if not isinstance(dp, dict):
        dp = {}
    enabled = bool(dp.get("enabled"))
    if not enabled:
        pt = str(training_params.get("privacyTechnique") or "").lower()
        if "differential" in pt or pt in ("dp", "differential-privacy"):
            enabled = True
    try:
        epsilon = float(dp.get("epsilon", 1.0))
    except (TypeError, ValueError):
        epsilon = 1.0
    try:
        delta = float(dp.get("delta", 1e-5))
    except (TypeError, ValueError):
        delta = 1e-5
    try:
        max_grad_norm = float(dp.get("maxGradNorm") or dp.get("clipNorm") or 1.0)
    except (TypeError, ValueError):
        max_grad_norm = 1.0
    if epsilon <= 0:
        epsilon = 1.0
    if delta <= 0:
        delta = 1e-5
    if max_grad_norm <= 0:
        max_grad_norm = 1.0
    return {
        "enabled": enabled,
        "epsilon": epsilon,
        "delta": delta,
        "max_grad_norm": max_grad_norm,
        "mechanism": str(dp.get("mechanism") or "dp-sgd").lower(),
        "target_epsilon": epsilon,
    }


def _positive_int(value: Any, default: Optional[int] = None) -> Optional[int]:
    if value is None:
        return default
    try:
        n = int(value)
    except (TypeError, ValueError):
        return default
    return n if n > 0 else default


def _apply_text_subset(
    train_ds,
    test_ds,
    *,
    fast: bool,
    train_subset_size: Optional[int],
    test_subset_size: Optional[int],
):
    """Slice AG News (or other HF) splits for fast E2E vs quality demo profiles."""
    if fast:
        n_train = min(256, len(train_ds))
        n_test = min(256, len(test_ds))
        print(f"[trainer] fastDevRun subset train={n_train} test={n_test}", flush=True)
        return train_ds.select(range(n_train)), test_ds.select(range(n_test))

    if train_subset_size is not None:
        n_train = min(int(train_subset_size), len(train_ds))
        train_ds = train_ds.select(range(n_train))
        print(f"[trainer] trainSubsetSize={n_train}", flush=True)
    if test_subset_size is not None:
        n_test = min(int(test_subset_size), len(test_ds))
        test_ds = test_ds.select(range(n_test))
        print(f"[trainer] testSubsetSize={n_test}", flush=True)
    return train_ds, test_ds


def train_text_hf(
    out_dir: Path,
    epochs: int,
    fast: bool,
    model_name: str,
    dataset_spec: Optional[Dict[str, Any]] = None,
    dp_config: Optional[Dict[str, Any]] = None,
    train_subset_size: Optional[int] = None,
    test_subset_size: Optional[int] = None,
    learning_rate: Optional[float] = None,
) -> TrainResult:
    import torch
    from transformers import AutoModelForSequenceClassification, AutoTokenizer

    dp = dp_config if isinstance(dp_config, dict) else {}
    dp_enabled = bool(dp.get("enabled"))

    torch.manual_seed(42)
    device = _resolve_torch_device(dp_enabled=dp_enabled)
    print(f"[trainer] text device={device}", flush=True)

    hf_name = model_name or "sshleifer/tiny-distilbert-base-cased"
    spec = dataset_spec or _resolve_hf_dataset_spec(None)
    repo_id = spec.get("repo_id") or "ag_news"
    split_train = spec.get("split_train") or "train"
    split_test = spec.get("split_test") or "test"
    subset = spec.get("subset")
    revision = spec.get("revision")

    load_kwargs: Dict[str, Any] = {}
    if revision:
        load_kwargs["revision"] = revision
    if subset:
        ds = _load_hf_dataset(repo_id, subset, load_kwargs)
    else:
        ds = _load_hf_dataset(repo_id, None, load_kwargs)

    train_ds = ds[split_train]
    test_ds = ds[split_test]

    train_ds, test_ds = _apply_text_subset(
        train_ds,
        test_ds,
        fast=fast,
        train_subset_size=train_subset_size,
        test_subset_size=test_subset_size,
    )

    tok = AutoTokenizer.from_pretrained(hf_name)
    model = AutoModelForSequenceClassification.from_pretrained(
        hf_name, num_labels=4, ignore_mismatched_sizes=True
    ).to(device)

    if dp_enabled:
        import torch.nn as nn

        # Fresh classifier + frozen backbone: Opacus per-sample grads are reliable on the head only.
        hidden = model.config.hidden_size
        model.classifier = nn.Linear(hidden, 4)
        model.classifier.reset_parameters()
        if hasattr(model, "pre_classifier") and model.pre_classifier is not None:
            for p in model.pre_classifier.parameters():
                p.requires_grad = False
        for name, param in model.named_parameters():
            param.requires_grad = name.startswith("classifier")
        print("[trainer] DP-SGD: classifier head only (frozen backbone)", flush=True)

    def encode(batch):
        return tok(batch["text"], truncation=True, padding="max_length", max_length=128)

    train_enc = train_ds.map(encode, batched=True)
    test_enc = test_ds.map(encode, batched=True)

    cols = ["input_ids", "attention_mask", "label"]
    train_enc.set_format(type="torch", columns=cols)
    test_enc.set_format(type="torch", columns=cols)

    train_loader = torch.utils.data.DataLoader(train_enc, batch_size=16, shuffle=True)
    test_loader = torch.utils.data.DataLoader(test_enc, batch_size=32, shuffle=False)

    loss_fn = torch.nn.CrossEntropyLoss()

    privacy_engine = None
    dp_target_delta = float(dp.get("delta", 1e-5))
    dp_target_epsilon = float(dp.get("target_epsilon", dp.get("epsilon", 1.0)))
    dp_max_grad_norm = float(dp.get("max_grad_norm", 1.0))
    noise_multiplier = 1.0

    if dp_enabled:
        try:
            from opacus import PrivacyEngine
            from opacus.accountants.utils import get_noise_multiplier
        except ImportError as e:
            raise RuntimeError(
                "Differential privacy requires opacus. "
                "Docker: rebuild contractmanagement/local-trainer:latest. "
                "Native Mac: run backend/local-training/scripts/setup-native-venv.sh"
            ) from e

        sample_rate = 16 / max(1, len(train_enc))
        epochs_for_budget = max(1, int(epochs))
        try:
            noise_multiplier = get_noise_multiplier(
                target_epsilon=dp_target_epsilon,
                target_delta=dp_target_delta,
                sample_rate=sample_rate,
                epochs=epochs_for_budget,
            )
        except Exception:
            noise_multiplier = 1.0

    trainable = [p for p in model.parameters() if p.requires_grad]
    lr = float(learning_rate) if learning_rate and learning_rate > 0 else (2e-4 if dp_enabled else 5e-5)
    opt = torch.optim.AdamW(trainable if dp_enabled else model.parameters(), lr=lr)
    print(f"[trainer] text lr={lr} trainable_params={sum(p.numel() for p in (trainable if dp_enabled else model.parameters()))}", flush=True)
    if dp_enabled:
        from opacus import PrivacyEngine

        model.train()
        privacy_engine = PrivacyEngine(accountant="rdp", secure_mode=False)
        model, opt, train_loader = privacy_engine.make_private(
            module=model,
            optimizer=opt,
            data_loader=train_loader,
            noise_multiplier=noise_multiplier,
            max_grad_norm=dp_max_grad_norm,
        )
        print(
            f"[trainer] DP-SGD enabled noise_multiplier={noise_multiplier:.4f} "
            f"target_epsilon={dp_target_epsilon} delta={dp_target_delta}",
            flush=True,
        )

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
    losses: List[float] = []
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
        {"state_dict": model.state_dict(), "model_name": hf_name, "task": repo_id},
        str(artifact_path),
    )

    # Offline-friendly export so infer.py does not need Hugging Face Hub on predict.
    try:
        hf_export = out_dir / "hf_export"
        hf_export.mkdir(parents=True, exist_ok=True)
        # Unwrap Opacus GradSampleModule if present
        to_save = model
        if hasattr(model, "_module"):
            to_save = model._module
        to_save.save_pretrained(str(hf_export))
        tok.save_pretrained(str(hf_export))
        print(f"[trainer] wrote offline HF export to {hf_export}", flush=True)
    except Exception as e:
        print(f"[trainer] warning: hf_export save failed: {e}", file=sys.stderr, flush=True)

    extra: Dict[str, Any] = {
        "taskType": "text",
        "dataset": repo_id,
        "model": hf_name,
        "catalogArchitecture": model_name,
        "source": spec.get("source") or "demo_ag_news",
        "huggingfaceDataset": spec,
    }

    if dp_enabled and privacy_engine is not None:
        try:
            spent_epsilon = float(privacy_engine.get_epsilon(dp_target_delta))
        except Exception:
            spent_epsilon = dp_target_epsilon
        extra["privacyEnhancedTraining"] = True
        extra["privacyMetrics"] = {
            "technique": "differential-privacy",
            "mechanism": "dp-sgd",
            "epsilon": spent_epsilon,
            "delta": dp_target_delta,
            "targetEpsilon": dp_target_epsilon,
            "maxGradNorm": dp_max_grad_norm,
            "noiseMultiplier": float(noise_multiplier) if dp_enabled else None,
        }

    return TrainResult(
        accuracy=acc,
        loss=avg_loss,
        epochsCompleted=epochs,
        artifactUri=f"file://{artifact_path}",
        extra=extra,
    )


def main() -> int:
    job_id = _env("TRAINING_JOB_ID", "job-local")
    contract_id = _env("CONTRACT_ID", "CONTRACT-local")
    contract_json_path = _env("CONTRACT_JSON_PATH", "/inputs/contract.json")
    out_dir = Path(_env("OUTPUT_DIR", "/outputs"))
    out_dir.mkdir(parents=True, exist_ok=True)

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

    catalog_model = _first_catalog_model(contract_inputs)
    architecture = _resolve_architecture(tp, catalog_model)

    fast = _fast_dev(tp)
    task = _infer_task(tp)
    dp_config = _resolve_dp_config(tp)

    if fast and max_epochs > 2:
        max_epochs = 1

    print(f"[trainer] starting job={job_id} contract={contract_id}", flush=True)
    print(f"[trainer] writing outputs to {out_dir}", flush=True)
    dp_enabled = _env("DP_ENABLED", "0")
    if dp_enabled in ("1", "true", "True", "yes", "YES"):
        print(
            f"[trainer] differential_privacy enabled epsilon={_env('DP_EPSILON')} delta={_env('DP_DELTA')} "
            f"mechanism={_env('DP_MECHANISM')} clip_norm={_env('DP_CLIP_NORM')}",
            flush=True,
        )
    if contract_inputs:
        ds = contract_inputs.get("datasets") or []
        ms = contract_inputs.get("models") or []
        print(f"[trainer] contract inputs loaded: datasets={len(ds)} models={len(ms)}", flush=True)
    if catalog_model:
        print(
            f"[trainer] catalog model: name={catalog_model.get('name')} "
            f"architecture={catalog_model.get('architecture')}",
            flush=True,
        )
    print(
        f"[trainer] selected task={task} architecture={architecture or '(default)'} "
        f"fastDevRun={fast} epochs={max_epochs} "
        f"dp={'on' if dp_config.get('enabled') else 'off'}",
        flush=True,
    )

    started = time.time()

    staged_tabular = _find_staged_dataset(contract_inputs, ("csv", "tabular"))
    staged_vision = _find_staged_dataset(contract_inputs, ("image_folder", "images", "vision"))

    if staged_tabular is not None:
        res = train_tabular_csv_dir(
            out_dir=out_dir, data_dir=staged_tabular, epochs=max_epochs, fast=fast
        )
    elif staged_vision is not None:
        res = train_vision_image_folder(
            out_dir=out_dir,
            data_dir=staged_vision,
            epochs=max_epochs,
            fast=fast,
            architecture=architecture,
        )
    elif task == "vision":
        res = train_vision_cifar10_small(
            out_dir=out_dir, epochs=max_epochs, fast=fast, architecture=architecture
        )
    elif task == "text":
        hf_name = _resolve_hf_model_name(tp, catalog_model)
        hf_dataset = _resolve_hf_dataset_spec(contract_inputs)
        demo_profile = str(tp.get("demoProfile") or "").strip().lower()
        train_subset = _positive_int(tp.get("trainSubsetSize"))
        test_subset = _positive_int(tp.get("testSubsetSize"))
        if demo_profile == "quality":
            # Meaningful AG News demos: real DistilBERT head + larger slice than fastDevRun.
            if train_subset is None:
                train_subset = 2000
            if test_subset is None:
                test_subset = 500
            print(
                f"[trainer] demoProfile=quality "
                f"trainSubsetSize={train_subset} testSubsetSize={test_subset}",
                flush=True,
            )
        try:
            learning_rate = float(tp.get("learningRate")) if tp.get("learningRate") is not None else None
        except (TypeError, ValueError):
            learning_rate = None
        res = train_text_hf(
            out_dir=out_dir,
            epochs=max_epochs,
            fast=fast,
            model_name=hf_name,
            dataset_spec=hf_dataset,
            dp_config=dp_config if dp_config.get("enabled") else None,
            train_subset_size=train_subset,
            test_subset_size=test_subset,
            learning_rate=learning_rate,
        )
    else:
        res = train_tabular_iris(
            out_dir=out_dir, epochs=max_epochs, fast=fast, architecture=architecture
        )

    elapsed_s = round(time.time() - started, 3)

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
    if res.extra and res.extra.get("privacyMetrics"):
        metrics["privacyMetrics"] = res.extra["privacyMetrics"]
        metrics["privacyEnhancedTraining"] = True
    (out_dir / "metrics.json").write_text(json.dumps(metrics, indent=2))

    print("[trainer] completed", flush=True)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as e:
        print(f"[trainer] failed: {e}", file=sys.stderr, flush=True)
        raise
