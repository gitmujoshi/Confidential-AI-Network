---
layout: default
title: About
permalink: /about/
---

# About Confidential AI Network

**CAN** is infrastructure for multi-party AI training when data cannot simply be copied.
Training Data Providers (TDPs), Training Data Consumers (TDCs), and Tech Service Providers / CCRPs
negotiate **Ricardian contracts**, train in protected environments, and leave an **auditable trail**.

The product vision is simple: **governed collaboration without a central data lake** —
aligned with India’s iSPIRT [DEPA](https://depa.world) (Data Empowerment and Protection Architecture),
and deployable on enterprise clouds with their native identity systems.

This site publishes **security and identity design notes** for operators and reviewers,
plus a **[product tour]({{ '/product-tour/' | relative_url }})** of end-to-end UI screenshots
(from registration through training, provenance, and inference).
It is generated from [`docs/blogs/`](https://github.com/gitmujoshi/Confidential-AI-Network/tree/main/docs/blogs) via GitHub Pages.
The homepage carries the architecture overview and the “why”; posts go deep on identity and Zero Trust.

## Canonical documentation

| Area | Start here |
|------|------------|
| Docs home | [docs/README.md](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/README.md) |
| Multi-cloud security patterns | [MULTI_CLOUD_SECURITY_ARCHITECTURE_PATTERNS.md](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/production/MULTI_CLOUD_SECURITY_ARCHITECTURE_PATTERNS.md) |
| Security index | [docs/security/](https://github.com/gitmujoshi/Confidential-AI-Network/tree/main/docs/security) |
| OCI security | [OCI_SECURITY_ARCHITECTURE.md](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/production/OCI_SECURITY_ARCHITECTURE.md) |
| Azure security | [AZURE_SECURITY_ARCHITECTURE.md](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/production/AZURE_SECURITY_ARCHITECTURE.md) |
| SPIFFE + OCI WIF | [OCI_SPIFFE_SPIRE_WIF.md](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/deployment/OCI_SPIFFE_SPIRE_WIF.md) |
| Product tour (UI screenshots) | [product-tour.md](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/blogs/product-tour.md) · [Lifecycle guide](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/guides/lifecycle-user-guide/LIFECYCLE_USER_GUIDE.md) |

**Identity rule (cloud):** Azure → Microsoft Entra ID; OCI → OCI IAM Identity Domains; GCP → Identity Platform; AWS → Cognito. **Keycloak** is local docker-compose / Playwright only.
