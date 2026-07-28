# OCI scaffold demo screenshots

Playwright captures of the public mock UI at `/demo/oci-scaffolds`.

One shared context (`OCI_SHARED` in `frontend/src/data/ociScaffoldMock.js`) drives:

1. Onboarding (Vault-backed signing key)
2. TSP confidential env (`OCI` + `OCI_VAULT`)
3. Contract `environmentSpecs` / `kmsConfigs`
4. Training logs (same Vault OCID / SPIFFE / buckets)
5. Provenance audit report (same shape as live `buildProvenanceAuditReport`)

Regenerate:

```bash
cd frontend
npm run test:e2e:oci-demo
```

Copied into the GitHub Pages product tour at build time
(`docs/blogs/assets/oci/` via `pages-blogs.yml`).
