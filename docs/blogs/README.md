# Confidential AI Network — Security Blog

Markdown blog published via **GitHub Pages**. Posts highlight architecture and security design from the main `docs/` tree (they do not replace the canonical Diátaxis docs).

| Item | Value |
|------|--------|
| Source | `docs/blogs/` |
| Canonical docs | [`docs/README.md`](../README.md) |
| Publish | GitHub Actions → GitHub Pages (see [Publishing](#publishing)) |

## Local preview

```bash
cd docs/blogs
bundle install
bundle exec jekyll serve
# http://127.0.0.1:4000
```

## Publishing

1. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**
2. Push to `main`; workflow [`.github/workflows/pages-blogs.yml`](../../.github/workflows/pages-blogs.yml) builds this folder and deploys
3. Site URL: `https://<org>.github.io/<repo>/` (or custom domain)

Optional custom domain: add a `CNAME` file in this directory and configure DNS.

## Writing a post

Add a file under `_posts/` named `YYYY-MM-DD-slug.md`:

```markdown
---
layout: post
title: "Your title"
date: 2026-07-28
categories: [security, oci]
tags: [spiffe, wif]
canonical: /deployment/OCI_SPIFFE_SPIRE_WIF.md
---

Short intro for readers…

## Deep dive

Link to the full design doc in the repo for implementers.
```

Prefer **short narrative posts** here and **link** to long-form design docs under `docs/production/`, `docs/deployment/`, and `docs/security/`.

## Post index

See [index.md](index.md) (rendered as the blog home on Pages).
