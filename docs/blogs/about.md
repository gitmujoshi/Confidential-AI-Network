---
layout: default
title: About
permalink: /about/
---

# About this blog

The **Confidential AI Network (CAN)** is a multi-party platform for contract-governed AI training:
Training Data Providers (TDPs), Training Data Consumers (TDCs), and Confidential Clean Room Providers (CCRPs)
negotiate Ricardian contracts, train in protected environments, and leave an auditable trail.

This site publishes **security and identity design notes** for operators and reviewers.
It is generated from [`docs/blogs/`](https://github.com/gitmujoshi/Confidential-AI-Network/tree/main/docs/blogs) via GitHub Pages.

CAN is inspired by India’s **iSPIRT** **DEPA** (**Data Empowerment and Protection Architecture**).

## Canonical documentation

| Area | Start here |
|------|------------|
| Docs home | [docs/README.md](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/README.md) |
| Security index | [docs/security/](https://github.com/gitmujoshi/Confidential-AI-Network/tree/main/docs/security) |
| OCI security | [OCI_SECURITY_ARCHITECTURE.md](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/production/OCI_SECURITY_ARCHITECTURE.md) |
| Azure security | [AZURE_SECURITY_ARCHITECTURE.md](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/production/AZURE_SECURITY_ARCHITECTURE.md) |
| SPIFFE + OCI WIF | [OCI_SPIFFE_SPIRE_WIF.md](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/deployment/OCI_SPIFFE_SPIRE_WIF.md) |

**Identity rule (cloud):** Azure → Microsoft Entra ID; OCI → OCI IAM Identity Domains; GCP → Identity Platform; AWS → Cognito. **Keycloak** is local docker-compose / Playwright only.
