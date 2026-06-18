# E2E test run archives

Playwright runs with **video**, **trace**, and **screenshot** recording (see `frontend/playwright.config.js`).

## Latest run

| Field | Value |
|-------|--------|
| **Folder** | `20260618-071124-full/` |
| **Project** | Chromium (desktop) |
| **Result** | 41 passed · 1 failed · 3 skipped |
| **Duration** | ~3.5 min |
| **Size** | ~207 MB (videos + traces) |

### View results

```bash
# HTML report (videos, traces, screenshots per test)
open e2e-runs/20260618-071124-full/playwright-report/index.html

# Interactive trace for a specific test (example: failed UI flow)
cd frontend
npx playwright show-trace ../e2e-runs/20260618-071124-full/test-results/can-contract-to-training-u-94314-d-UI-then-run-CAN-job-in-UI-chromium/trace.zip
```

### Failed test

- `can-contract-to-training-ui.spec.js` — strict mode: two "Create Contract" buttons (nav + wizard). Recordings in `test-results/can-contract-to-training-u-94314-*/`.

### Machine-readable

- `run-summary.json` — counts and artifact paths
- `test-results/e2e-results.json` — Playwright JSON reporter
- `test-results/e2e-results.xml` — JUnit for CI

## Re-run and archive

```bash
# Start stack (Docker + backend + Keycloak)
./start-system.sh

# From frontend/
RUN_TS=$(date +%Y%m%d-%H%M%S)
PW_WORKERS=1 npx playwright test --project=chromium | tee ../e2e-runs/$RUN_TS/playwright-console.log
cp -R test-results playwright-report ../e2e-runs/${RUN_TS}-full/
```

Or: `npm run test:e2e:chromium` then copy `test-results/` and `playwright-report/` manually.
