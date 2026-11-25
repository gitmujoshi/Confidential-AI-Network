# Role user guides (screenshot tours)

Auto-generated on **2026-11-24** by `npm run test:e2e:user-guides`.

Each guide starts with that role's registration, then walks the primary screens. Screenshots are captured from a live local stack (Chromium desktop).

| Role | Guide |
|------|-------|
| TDC | [TDC User Guide — Training Data Consumer](TDC_USER_GUIDE.md) |
| TDP | [TDP User Guide — Training Data Provider](TDP_USER_GUIDE.md) |
| TSP | [TSP / CCRP User Guide — Tech Service Provider](TSP_USER_GUIDE.md) |
| AppAdmin | [AppAdmin User Guide — Platform Administrator](APPADMIN_USER_GUIDE.md) |
| Auditor | [Auditor User Guide — Contract and Merkle review](AUDITOR_USER_GUIDE.md) |

## Regenerate

```bash
# From repo root: stack must be up (backend :5001, frontend :3000, Keycloak)
cd frontend
npm run test:e2e:user-guides
```

Screenshots land in `screenshots/<role>/`. The TDC, TDP, TSP, and AppAdmin markdown files are overwritten on each run.
The Auditor guide is written by `npm run test:e2e:auditor-guide`.

← [Guides index](../README.md)
