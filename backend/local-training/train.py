import json
import os
import random
import sys
import time
from pathlib import Path


def _env(name: str, default: str | None = None) -> str | None:
    v = os.environ.get(name)
    if v is None or v == "":
        return default
    return v


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

    # Minimal "real" work: deterministic-ish loop + metrics/artifact output.
    # This is a placeholder until you drop in a real training script.
    max_epochs = int(_env("MAX_EPOCHS", "5"))
    sleep_s = float(_env("EPOCH_SLEEP_SECONDS", "0.6"))

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

    random.seed(f"{job_id}:{contract_id}")
    loss = 1.0
    acc = 0.5

    for epoch in range(1, max_epochs + 1):
        time.sleep(sleep_s)
        # Fake-but-sane learning curve
        loss = max(0.02, loss * (0.72 + random.random() * 0.08))
        acc = min(0.99, acc + (0.08 + random.random() * 0.03))
        print(f"[trainer] epoch={epoch}/{max_epochs} loss={loss:.4f} acc={acc:.4f}", flush=True)

    artifact_path = out_dir / "model.bin"
    artifact_path.write_bytes(os.urandom(256))

    metrics = {
        "jobId": job_id,
        "contractId": contract_id,
        "epochsCompleted": max_epochs,
        "accuracy": acc,
        "loss": loss,
        "artifactUri": f"file://{artifact_path}",
        "inputs": {
            "datasets": (contract_inputs.get("datasets") if contract_inputs else None),
            "models": (contract_inputs.get("models") if contract_inputs else None),
            "trainingParams": (contract_inputs.get("contract", {}).get("trainingParams") if contract_inputs else None),
            "environmentSpecs": (contract_inputs.get("contract", {}).get("environmentSpecs") if contract_inputs else None),
        },
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
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

