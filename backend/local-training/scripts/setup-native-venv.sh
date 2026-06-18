#!/usr/bin/env bash
# PyTorch + Hugging Face + Opacus on Apple Silicon (MPS). Same train.py as Docker.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENV="${ROOT}/.venv-native"

if [[ "$(uname -s)" != "Darwin" ]] || [[ "$(uname -m)" != "arm64" ]]; then
  echo "Native MPS venv is for Apple Silicon macOS. Use local-docker elsewhere." >&2
  exit 1
fi

PYTHON_BIN="${PYTHON_BIN:-}"
if [[ -z "${PYTHON_BIN}" ]]; then
  if command -v python3.11 >/dev/null 2>&1; then
    PYTHON_BIN="python3.11"
  else
    PYTHON_BIN="python3"
  fi
fi

echo "Using ${PYTHON_BIN} ($(${PYTHON_BIN} --version))"

"${PYTHON_BIN}" -m venv "${VENV}"
"${VENV}/bin/pip" install --upgrade pip
"${VENV}/bin/pip" install -r "${ROOT}/requirements-native.txt"

echo ""
"${VENV}/bin/python" - <<'PY'
import torch
mps = getattr(torch.backends, "mps", None)
ok = bool(mps and mps.is_available() and mps.is_built())
print(f"PyTorch {torch.__version__}  MPS available: {ok}")
PY

echo ""
echo "✅ Native trainer venv: ${VENV}"
echo "   Set TRAINING_EXECUTION_MODE=local-native in config.env and restart the backend."
