---
layout: default
title: About
permalink: /about/
---

# About Confidential AI Network

**Confidential AI Network (CAN)** is infrastructure and documentation for multi-party AI training when data cannot move into a shared lake. TDPs, TDCs, and TSP / CCRPs negotiate **Ricardian contracts**, run jobs in policy-bound environments, and retain an **auditable trail**.

Thesis: **governed collaboration without a central data lake**, informed by India’s iSPIRT [DEPA](https://depa.world), deployable on enterprise clouds with native IdPs.

This site: architecture notes plus a **[product tour]({{ '/product-tour/' | relative_url }})** (Local Docker UI path; Azure CC in the [deep dive]({% post_url 2026-08-17-azure-confidential-computing-deep-dive %})). Source: [`docs/blogs/`](https://github.com/gitmujoshi/Confidential-AI-Network/tree/main/docs/blogs) → GitHub Pages.

## Canonical documentation

| Area | Start here |
|------|------------|
| Docs home | [docs/README.md](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/README.md) |
| Multi-cloud security patterns | [MULTI_CLOUD_SECURITY_ARCHITECTURE_PATTERNS.md](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/production/MULTI_CLOUD_SECURITY_ARCHITECTURE_PATTERNS.md) |
| **NIST / CIS / OWASP control mapping** | [SECURITY_CONTROLS_NIST_CIS_MAPPING.md](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/compliance/SECURITY_CONTROLS_NIST_CIS_MAPPING.md) |
| Security index | [docs/security/](https://github.com/gitmujoshi/Confidential-AI-Network/tree/main/docs/security) |
| OCI security | [OCI_SECURITY_ARCHITECTURE.md](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/production/OCI_SECURITY_ARCHITECTURE.md) |
| Azure security | [AZURE_SECURITY_ARCHITECTURE.md](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/production/AZURE_SECURITY_ARCHITECTURE.md) |
| Azure confidential computing (blog) | [Azure CC deep dive]({% post_url 2026-08-17-azure-confidential-computing-deep-dive %}) |
| OCI IAM & edge | [OCI_IAM_AND_EDGE_CONFIG.md](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/deployment/OCI_IAM_AND_EDGE_CONFIG.md) |
| SPIFFE + Azure / Entra WIF | [AZURE_SPIFFE_SPIRE_WIF.md](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/deployment/AZURE_SPIFFE_SPIRE_WIF.md) · [blog]({% post_url 2026-08-17-spiffe-spire-azure-wif %}) |
| SPIFFE + OCI WIF | [OCI_SPIFFE_SPIRE_WIF.md](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/deployment/OCI_SPIFFE_SPIRE_WIF.md) |
| OCI design complete | [OCI_DESIGN_COMPLETE.md](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/deployment/OCI_DESIGN_COMPLETE.md) |
| Product tour (UI screenshots) | [product-tour.md](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/blogs/product-tour.md) · [Lifecycle guide](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/guides/lifecycle-user-guide/LIFECYCLE_USER_GUIDE.md) |

**IdP map:** Azure → Entra; OCI → Identity Domains; GCP → Identity Platform; AWS → Cognito. **Keycloak** = local compose / Playwright only.
