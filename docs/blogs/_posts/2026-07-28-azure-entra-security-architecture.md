---
layout: post
title: "Azure security architecture — Entra-only identity on cloud"
date: 2026-07-28
categories: [security, azure]
tags: [entra, aks, key-vault]
canonical: docs/production/AZURE_SECURITY_ARCHITECTURE.md
---

On Azure, CAN uses **Microsoft Entra ID** as the sole application IdP (SSO, Conditional Access, app roles).
The same split as OCI: **Keycloak is local-only**.

## What the architecture doc covers

- Environment profiles (dev → prod) and compartment-style resource organization on Azure  
- Front Door / APIM / WAF edge patterns  
- Workload identity for AKS → Key Vault and Storage  
- Crypto and key flows aligned with the participant lifecycle (DEK/MEK, signing, CAN escrow)

## Companion references

| Doc | Role |
|-----|------|
| [AZURE_SECURITY_ARCHITECTURE.md](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/production/AZURE_SECURITY_ARCHITECTURE.md) | Topology + runbook |
| [AZURE_IAM_AND_EDGE_CONFIG.md](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/deployment/AZURE_IAM_AND_EDGE_CONFIG.md) | Entra groups, APIM, WAF |
| [AZURE_FEATURES_AND_CONFIGURATION.md](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/deployment/AZURE_FEATURES_AND_CONFIGURATION.md) | Feature maturity + env vars |

App roles on the API registration: `TDC`, `TDP`, `CCRP`, `AppAdmin` — mirrored in Identity Domain groups on OCI.
