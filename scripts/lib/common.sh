#!/bin/bash
# Shared helpers for scripts run from scripts/* subdirectories or repo root.

resolve_repo_root() {
  if [ -n "${REPO_ROOT:-}" ]; then
    cd "$REPO_ROOT"
    return
  fi

  local caller="${BASH_SOURCE[1]:-${BASH_SOURCE[0]}}"
  local script_dir
  script_dir="$(cd "$(dirname "$caller")" && pwd)"

  if [[ "$script_dir" == */scripts/* ]]; then
    REPO_ROOT="$(cd "$script_dir/../.." && pwd)"
  else
    REPO_ROOT="$(cd "$script_dir" && pwd)"
  fi

  export REPO_ROOT
  cd "$REPO_ROOT"
}

compose_path() {
  echo "$REPO_ROOT/docker/$1"
}

run_compose() {
  local file="$1"
  shift
  local compose_file
  compose_file="$(compose_path "$file")"

  if docker compose version >/dev/null 2>&1; then
    docker compose --project-directory "$REPO_ROOT" -f "$compose_file" "$@"
  else
    docker-compose --project-directory "$REPO_ROOT" -f "$compose_file" "$@"
  fi
}
