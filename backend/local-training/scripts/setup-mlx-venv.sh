#!/usr/bin/env bash
# Create/update a host-side MLX venv for Apple Silicon dev (arm64 macOS).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENV="${ROOT}/.venv-mlx"

if [[ "$(uname -s)" != "Darwin" ]] || [[ "$(uname -m)" != "arm64" ]]; then
  echo "MLX dev venv is intended for Apple Silicon macOS (Darwin arm64)." >&2
  echo "Use TRAINING_EXECUTION_MODE=local-docker on Linux/CI." >&2
  exit 1
fi

python3 -m venv "${VENV}"
"${VENV}/bin/pip" install --upgrade pip
"${VENV}/bin/pip" install -r "${ROOT}/requirements-mlx.txt"

echo ""
echo "✅ MLX venv ready: ${VENV}"
echo "   Smoke: ${VENV}/bin/python -c \"import mlx.core as mx; print(mx.default_device())\""
echo "   Trainer: LOCAL_MLX_PYTHON=${VENV}/bin/python TRAINING_EXECUTION_MODE=local-mlx"
