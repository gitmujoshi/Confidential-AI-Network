# Scripts

Operational scripts are grouped by purpose. **Root wrappers** (`./start-system.sh`, `./manage-scitt-ccf.sh`, `./dev-start.sh`, `./fix-auth.sh`) delegate here so docs and CI keep working.

## Layout

| Directory | Contents |
|-----------|----------|
| `startup/` | System start/stop, clean start, environment setup |
| `dev/` | Containerized dev environment (`dev-start.sh`, `dev-setup.sh`) |
| `deploy/` | Production and Ubuntu deployment helpers |
| `scitt/` | SCITT CCF management and test scripts |
| `tools/` | One-off utilities, Keycloak debug, test data helpers |
| `e2e/` | End-to-end test runner (`run-e2e-tests.js`) |
| `lib/` | Shared shell helpers (`common.sh` — repo root + Docker Compose) |

## Common entry points

```bash
./start-system.sh              # → scripts/startup/start-system.sh
./manage-scitt-ccf.sh status   # → scripts/scitt/manage-scitt-ccf.sh
./dev-start.sh                 # → scripts/dev/dev-start.sh
./fix-auth.sh                  # → scripts/fix-auth-unified.sh
npm run status                 # → scripts/status.js
npm run test:e2e               # → scripts/e2e/run-e2e-tests.js
```

## Configuration examples

Copy from `config/examples/` into the repo root as needed:

- `config.env.example` → `config.env`
- `env.example` → `.env`
- `env.scitt-ccf.example` → `.env.scitt-ccf`

Runtime config stays at repo root: `config.env`, `secrets.env`.
