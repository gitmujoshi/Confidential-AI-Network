"""Training container entry.

GUEST_DECRYPT=1 generates sk_ccr inside this container, publishes only pk_ccr,
waits for owner keys sealed to that public key, decrypts CANSEAL1 files into
container memory, then starts train.py. The private key is not written to the
mounted output or input directories.
"""

import json
import os
import sys
import time
from pathlib import Path


def _fail(code: str) -> None:
    print(f"[guest] {code}", file=sys.stderr, flush=True)
    raise SystemExit(1)


def _wait_for_release(path: Path, seconds: int) -> dict:
    deadline = time.time() + seconds
    while time.time() < deadline:
        if path.is_file() and path.stat().st_size > 0:
            return json.loads(path.read_text())
        time.sleep(0.2)
    _fail("GUEST_RELEASE_TIMEOUT")
    return {}


def _decrypt_tree(root: Path, keys: dict, dest_root: Path) -> int:
    from guest_key import decrypt_canseal, _zero

    count = 0
    if not root.is_dir():
        return 0
    for source in root.rglob("*"):
        if not source.is_file() or not source.name.endswith(".canseal"):
            continue
        blob = source.read_bytes()
        header_line = blob.split(b"\n", 2)[1]
        header = json.loads(header_line.decode("utf-8"))
        owner_id = str(header.get("ownerId") or "")
        key_type = str(header.get("keyType") or "DEK")
        material = keys.get((key_type, owner_id)) or keys.get((key_type, ""))
        if material is None:
            _fail("GUEST_KEY_MISSING")
        plaintext = decrypt_canseal(bytes(material), blob)
        relative = source.relative_to(root).with_suffix("")
        dest = dest_root / relative
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(bytes(plaintext))
        _zero(plaintext)
        count += 1
    return count


def _rewrite_contract(contract_path: Path, dataset_dest: Path, model_dest: Path) -> Path:
    contract = json.loads(contract_path.read_text()) if contract_path.is_file() else {}
    for row in contract.get("datasets") or []:
        if isinstance(row, dict):
            row["containerDataPath"] = str(dataset_dest)
            row["stagedForTraining"] = True
    has_model = model_dest.is_dir() and any(model_dest.iterdir())
    for row in contract.get("models") or []:
        if isinstance(row, dict) and has_model:
            row["containerDataPath"] = str(model_dest)
    out = Path("/tmp/guest-plain/contract.json")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(contract))
    return out


def main() -> None:
    if os.environ.get("GUEST_DECRYPT") != "1":
        os.execv(sys.executable, [sys.executable, "/app/train.py"])

    from guest_key import generate_keypair, open_wrapped, _zero

    raw_private, public = generate_keypair()
    output_dir = Path(os.environ.get("OUTPUT_DIR", "/outputs"))
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "guest-public.json").write_text(json.dumps({
        "hpkePublicKey": public,
        "guestHeld": True,
        "reportFormat": "SIMULATED",
    }))

    sealed_path = Path(os.environ.get("GUEST_SEALED_PATH", "/inputs/guest/sealed-release.json"))
    sealed = _wait_for_release(sealed_path, int(os.environ.get("GUEST_WAIT_SECONDS", "180")))
    keys = {}
    for item in sealed.get("keys") or []:
        wrapped = item.get("wrappedKey")
        if not wrapped:
            _fail("GUEST_KEY_MISSING")
        opened = open_wrapped(raw_private, wrapped)
        keys[(str(item.get("keyType") or ""), str(item.get("ownerId") or ""))] = opened
    _zero(raw_private)

    plain = Path("/tmp/guest-plain")
    dataset_dest = plain / "datasets"
    model_dest = plain / "models"
    dataset_dest.mkdir(parents=True, exist_ok=True)
    model_dest.mkdir(parents=True, exist_ok=True)
    decrypted = 0
    for root in sealed.get("datasetRoots") or []:
        decrypted += _decrypt_tree(Path(root), keys, dataset_dest / Path(root).name)
    for root in sealed.get("modelRoots") or []:
        decrypted += _decrypt_tree(Path(root), keys, model_dest / Path(root).name)
    for material in keys.values():
        _zero(material)
    if decrypted == 0:
        _fail("GUEST_CIPHERTEXT_REQUIRED")

    contract_path = Path(os.environ.get("CONTRACT_JSON_PATH", "/inputs/contract.json"))
    rewritten = _rewrite_contract(contract_path, dataset_dest, model_dest)
    os.environ["CONTRACT_JSON_PATH"] = str(rewritten)
    os.execve(sys.executable, [sys.executable, "/app/train.py"], os.environ)


if __name__ == "__main__":
    main()
