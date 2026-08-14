# Confidential AI Network — GitHub Pages site

Published via **GitHub Pages** from `docs/blogs/`. Includes:

- Homepage vision + architecture overview
- **[Product tour](product-tour.md)** — end-to-end UI (registration → prediction) for Local and OCI
- Security / identity notes (`_posts/`)

Canonical Diátaxis docs remain under [`docs/README.md`](../README.md).

| Item | Value |
|------|--------|
| Source | `docs/blogs/` |
| Screenshot source | [`docs/guides/lifecycle-user-guide/screenshots/`](../guides/lifecycle-user-guide/screenshots/) + [`docs/guides/oci-scaffold-demo/screenshots/`](../guides/oci-scaffold-demo/screenshots/) (copied at Pages build) |
| Publish | [`.github/workflows/pages-blogs.yml`](../../.github/workflows/pages-blogs.yml) |
| Live URL | https://gitmujoshi.github.io/Confidential-AI-Network/ |

## Local preview

```bash
# Sync lifecycle + OCI mock screenshots (same step as CI)
mkdir -p docs/blogs/assets/lifecycle docs/blogs/assets/oci docs/blogs/assets/gmase
cp -f docs/guides/lifecycle-user-guide/screenshots/*.png docs/blogs/assets/lifecycle/
cp -f docs/guides/oci-scaffold-demo/screenshots/*.png docs/blogs/assets/oci/
cp -f docs/guides/gmase-integration/screenshots/*.png docs/blogs/assets/gmase/ 2>/dev/null || true

cd docs/blogs
bundle install
bundle exec jekyll serve --baseurl /Confidential-AI-Network
# http://127.0.0.1:4000/Confidential-AI-Network/
```

## Publishing

1. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**
2. Push to `main` (changes under `docs/blogs/**`, `docs/guides/lifecycle-user-guide/**`, or `docs/guides/oci-scaffold-demo/**`)
3. Site: `https://gitmujoshi.github.io/Confidential-AI-Network/`

## Regenerating the product tour screenshots

```bash
# Lifecycle path — stack must be up: backend :5001, frontend :3000, Keycloak, Docker trainer
cd frontend
BACKEND_URL=http://127.0.0.1:5001 npm run test:e2e:lifecycle-guide

# OCI mock UI — frontend only
npm run test:e2e:oci-demo
```

That refreshes `docs/guides/lifecycle-user-guide/` and `docs/guides/oci-scaffold-demo/` (PNGs). The next Pages deploy copies images into the site.

## Writing a security note

Add `_posts/YYYY-MM-DD-slug.md`. Prefer short narrative posts that link to long-form design docs under `docs/production/`, `docs/deployment/`, and `docs/security/`.
