# Docker Compose stacks

All Compose files live here. Run them from the **repository root** so paths to `config.env`, `backend/`, and `secrets.env` resolve correctly.

```bash
# Preferred: use root wrappers (they set --project-directory automatically)
./dev-start.sh
./start-system.sh

# Manual
docker compose --project-directory .. -f docker/docker-compose.dev.yml config   # from docker/
docker compose --project-directory . -f docker/docker-compose.dev.yml up -d   # from repo root
```

| File | Purpose |
|------|---------|
| `docker-compose.dev.yml` | Local development (Postgres, Keycloak, backend, frontend, dev-tools) |
| `docker-compose.main.yml` | Production-style stack |
| `docker-compose.***REMOVED-KEYCLOAK_DB_PASSWORD***-*.yml` | Keycloak variants (HTTP, HTTPS, persistent) |
| `docker-compose.scitt-ccf-*.yml` | SCITT CCF services |
| `docker-compose.test.yml` | Integration test environment |
| `Dockerfile.dev-tools` | Dev-tools sidecar image |
| `Dockerfile.training` | Training environment image |

Environment files remain at repo root: `config.env`, `secrets.env`.
