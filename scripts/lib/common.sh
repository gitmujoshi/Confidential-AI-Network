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

# True if a Docker container with this exact name exists (running or stopped).
container_exists() {
  local name="$1"
  docker ps -a --format '{{.Names}}' 2>/dev/null | grep -qx "$name"
}

# True if a Docker container with this exact name is running.
container_running() {
  local name="$1"
  docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "$name"
}

# Start a named container if it exists but is stopped. No-op if already running.
# Returns 0 if running (or successfully started), 1 if it does not exist.
ensure_container_running() {
  local name="$1"
  if container_running "$name"; then
    echo "   ✅ $name already running — reusing"
    return 0
  fi
  if container_exists "$name"; then
    echo "   ▶️  Starting existing container $name..."
    if docker start "$name" >/dev/null; then
      echo "   ✅ $name started"
      return 0
    fi
    echo "   ⚠️  Failed to start $name; will try compose recreate"
    return 1
  fi
  return 1
}

# Ensure a compose service is up. If a fixed container_name already exists
# (common after prior runs / different compose project labels), reuse it
# instead of failing with "Conflict. The container name is already in use".
ensure_compose_service() {
  local compose_file="$1"
  local service="$2"
  local container_name="$3"

  if ensure_container_running "$container_name"; then
    return 0
  fi

  echo "   Creating $service via $compose_file..."
  if run_compose "$compose_file" up -d "$service"; then
    return 0
  fi

  # Race / orphan: compose failed with name conflict — try start again.
  if container_exists "$container_name"; then
    echo "   ⚠️  Compose reported a conflict; reusing existing $container_name"
    docker start "$container_name" >/dev/null || true
    if container_running "$container_name"; then
      echo "   ✅ $container_name is running"
      return 0
    fi
  fi

  echo "   ❌ Unable to start $service ($container_name)"
  return 1
}

