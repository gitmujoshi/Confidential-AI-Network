# Confidential AI Network — GitHub Pages site

Published via **GitHub Pages** from `docs/blogs/`. Includes:

- Homepage — product landing (Local, existing Azure AKS, existing GCP GKE). **Open the app** goes to the portal landing page at `https://can.dpi-apps.space/`
- **[Notes](notes.md)** — architecture and security write-ups (`_posts/`)
- **[Product tour](product-tour.md)** — end-to-end UI, including the clean-room cluster screenshots

Canonical Diátaxis docs remain under [`docs/README.md`](../README.md).

| Item | Value |
|------|--------|
| Source | `docs/blogs/` |
| Screenshot source | [`docs/guides/lifecycle-user-guide/screenshots/`](../guides/lifecycle-user-guide/screenshots/) + [`docs/guides/gmase-integration/screenshots/`](../guides/gmase-integration/screenshots/) (copied at Pages build) |
| Publish | [`.github/workflows/pages-blogs.yml`](../../.github/workflows/pages-blogs.yml) |
| Live URL | https://gitmujoshi.github.io/Confidential-AI-Network/ |

## Local preview

```bash
# Sync lifecycle + GMASE screenshots (same step as CI)
mkdir -p docs/blogs/assets/lifecycle docs/blogs/assets/gmase
cp -f docs/guides/lifecycle-user-guide/screenshots/*.png docs/blogs/assets/lifecycle/
cp -f docs/guides/gmase-integration/screenshots/*.png docs/blogs/assets/gmase/ 2>/dev/null || true

cd docs/blogs
bundle install
bundle exec jekyll serve --baseurl /Confidential-AI-Network
# http://127.0.0.1:4000/Confidential-AI-Network/
```

## Publishing

1. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**
2. Push to `main` (changes under `docs/blogs/**` or `docs/guides/lifecycle-user-guide/**`)
3. Site: `https://gitmujoshi.github.io/Confidential-AI-Network/`

## Regenerating the product tour screenshots

```bash
# Lifecycle path — stack must be up: backend :5001, frontend :3000, Keycloak, Docker trainer
cd frontend
BACKEND_URL=http://127.0.0.1:5001 npm run test:e2e:lifecycle-guide

# Clean-room cluster shots (Local / Azure / GCP) → docs/blogs/assets/ccr/
npx playwright test tests/e2e/tsp-ccr-providers.spec.js --project=chromium
```

That refreshes `docs/guides/lifecycle-user-guide/` (PNGs). The next Pages deploy copies images into the site.
