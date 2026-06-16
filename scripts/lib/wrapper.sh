#!/bin/bash
# Resolve repo root from a root-level wrapper script.
ROOT="$(cd "$(dirname "${BASH_SOURCE[1]}")" && pwd)"
export REPO_ROOT="$ROOT"
cd "$ROOT"
