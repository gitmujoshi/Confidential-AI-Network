# OCI product-tour screenshots

Playwright captures of `/demo/oci-scaffolds` — full path matching the Local lifecycle tour:

1. Registration (TDC / TDP / TSP on OCI Identity Domains + Vault)
2. Catalog (Object Storage dataset + model)
3. Contract (OCI Vault KMS + confidential compute bound in)
4. Training (oci-oke-job logs)
5. Provenance (audit bundle)
6. Deploy & predict

Regenerate:

```bash
cd frontend
npm run test:e2e:oci-demo
```

Copied into the GitHub Pages product tour at build time
(`docs/blogs/assets/oci/` via `pages-blogs.yml`).
