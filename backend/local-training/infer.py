#!/usr/bin/env python3
"""
Local inference CLI for CAN training artifacts (model.bin).

Usage:
  python infer.py --artifact /path/model.bin --task tabular --input '{"features":[5.1,3.5,1.4,0.2]}'
  python infer.py --artifact /path/model.bin --task text --input '{"text":"Wall Street gains on tech news"}'
  python infer.py --artifact /path/model.bin --task vision --input '{"demo":true}'

Prints one JSON object to stdout.
"""
from __future__ import annotations

import argparse
import json
import pickle
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional


IRIS_LABELS = ["setosa", "versicolor", "virginica"]
AG_NEWS_LABELS = ["World", "Sports", "Business", "Sci/Tech"]


def _load_json_input(raw: str) -> Dict[str, Any]:
    data = json.loads(raw)
    if not isinstance(data, dict):
        raise ValueError("input must be a JSON object")
    return data


def infer_tabular(artifact: Path, payload: Dict[str, Any]) -> Dict[str, Any]:
    features = payload.get("features")
    if not isinstance(features, list) or len(features) < 1:
        raise ValueError("tabular input requires features: number[]")
    row = [float(x) for x in features]
    clf = pickle.loads(artifact.read_bytes())
    pred = clf.predict([row])[0]
    probs = None
    if hasattr(clf, "predict_proba"):
        probs = [float(x) for x in clf.predict_proba([row])[0]]
    label_idx = int(pred)
    labels = IRIS_LABELS if hasattr(clf, "classes_") and len(getattr(clf, "classes_", [])) == 3 else None
    label = labels[label_idx] if labels and 0 <= label_idx < len(labels) else str(label_idx)
    return {
        "taskType": "tabular",
        "prediction": label_idx,
        "label": label,
        "probabilities": probs,
        "labels": labels,
    }


def infer_text(artifact: Path, payload: Dict[str, Any]) -> Dict[str, Any]:
    import torch
    from transformers import AutoModelForSequenceClassification, AutoTokenizer

    text = payload.get("text")
    if not isinstance(text, str) or not text.strip():
        raise ValueError("text input requires text: string")

    ckpt = torch.load(str(artifact), map_location="cpu")
    model_name = ckpt.get("model_name") or "sshleifer/tiny-distilbert-base-cased"
    state = ckpt.get("state_dict") or ckpt
    if not isinstance(state, dict):
        raise ValueError("text artifact missing state_dict")

    # Opacus wraps modules as `_module.*` — normalize keys for bare HF models.
    clean_state = {}
    for key, tensor in state.items():
        nk = key[len("_module.") :] if str(key).startswith("_module.") else key
        clean_state[nk] = tensor

    num_labels = 4
    for key, tensor in clean_state.items():
        if str(key).endswith("classifier.weight") or str(key).endswith("classifier.out_proj.weight"):
            try:
                num_labels = int(tensor.shape[0])
            except Exception:
                num_labels = 4
            break

    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSequenceClassification.from_pretrained(
        model_name,
        num_labels=num_labels,
        ignore_mismatched_sizes=True,
    )
    missing, unexpected = model.load_state_dict(clean_state, strict=False)
    model.eval()

    enc = tokenizer(text, return_tensors="pt", truncation=True, max_length=128, padding=True)
    with torch.no_grad():
        logits = model(**enc).logits[0]
        probs_t = torch.softmax(logits, dim=0)
        pred = int(torch.argmax(probs_t).item())
        probs = [float(x) for x in probs_t.tolist()]

    labels = AG_NEWS_LABELS if num_labels == 4 else [str(i) for i in range(num_labels)]
    return {
        "taskType": "text",
        "prediction": pred,
        "label": labels[pred] if pred < len(labels) else str(pred),
        "probabilities": probs,
        "labels": labels,
        "modelName": model_name,
        "note": f"strict=False load (missing={len(missing)} unexpected={len(unexpected)})",
    }


def _build_tinycnn(num_classes: int):
    import torch.nn as nn

    class TinyCNN(nn.Module):
        def __init__(self, n: int):
            super().__init__()
            self.net = nn.Sequential(
                nn.Conv2d(3, 16, 3, padding=1),
                nn.ReLU(),
                nn.MaxPool2d(2),
                nn.Conv2d(16, 32, 3, padding=1),
                nn.ReLU(),
                nn.MaxPool2d(2),
                nn.Flatten(),
                nn.Linear(32 * 8 * 8, 64),
                nn.ReLU(),
                nn.Linear(64, n),
            )

        def forward(self, x):
            return self.net(x)

    return TinyCNN(num_classes)


def infer_vision(artifact: Path, payload: Dict[str, Any]) -> Dict[str, Any]:
    import torch
    from torchvision import transforms

    ckpt = torch.load(str(artifact), map_location="cpu")
    arch = ckpt.get("arch") or "tinycnn"
    num_classes = int(ckpt.get("num_classes") or 10)
    state = ckpt.get("state_dict") or ckpt

    if arch in ("tinycnn", "tiny-cnn") or "tiny" in str(arch):
        model = _build_tinycnn(num_classes)
    else:
        # Fallback tiny for demos when ResNet weights aren't packaged for inference
        model = _build_tinycnn(num_classes)
    model.load_state_dict(state, strict=False)
    model.eval()

    tfm = transforms.Compose([transforms.Resize((32, 32)), transforms.ToTensor()])

    if payload.get("demo") is True or payload.get("imageBase64") in (None, ""):
        # Synthetic sample when no image provided
        xb = torch.rand(1, 3, 32, 32)
        source = "demo_random"
    else:
        import base64
        import io

        from PIL import Image

        raw = str(payload["imageBase64"])
        if "," in raw and raw.strip().startswith("data:"):
            raw = raw.split(",", 1)[1]
        img = Image.open(io.BytesIO(base64.b64decode(raw))).convert("RGB")
        xb = tfm(img).unsqueeze(0)
        source = "imageBase64"

    with torch.no_grad():
        logits = model(xb)[0]
        probs_t = torch.softmax(logits, dim=0)
        pred = int(torch.argmax(probs_t).item())
        probs = [float(x) for x in probs_t.tolist()]

    return {
        "taskType": "vision",
        "prediction": pred,
        "label": str(pred),
        "probabilities": probs,
        "arch": arch,
        "source": source,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="CAN local model inference")
    parser.add_argument("--artifact", required=True, help="Path to model.bin")
    parser.add_argument("--task", required=True, choices=["tabular", "text", "vision", "auto"])
    parser.add_argument("--input", required=True, help="JSON input string")
    args = parser.parse_args()

    artifact = Path(args.artifact)
    if not artifact.exists():
        print(json.dumps({"error": f"artifact not found: {artifact}"}), file=sys.stderr)
        return 2

    payload = _load_json_input(args.input)
    task = args.task
    if task == "auto":
        # Heuristic: pickle starts with protocol; torch zip starts with PK
        head = artifact.read_bytes()[:2]
        if head == b"PK" or head == b"\x80\x02" or head[:1] == b"\x80":
            # Prefer trying tabular pickle first for sklearn
            try:
                pickle.loads(artifact.read_bytes())
                task = "tabular"
            except Exception:
                task = "text"
        else:
            task = "text"

    try:
        if task == "tabular":
            result = infer_tabular(artifact, payload)
        elif task == "text":
            result = infer_text(artifact, payload)
        else:
            result = infer_vision(artifact, payload)
        result["success"] = True
        print(json.dumps(result))
        return 0
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
