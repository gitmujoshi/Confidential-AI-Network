---
layout: post
title: "Where to find CAN security docs (map for reviewers)"
date: 2026-07-28
categories: [security, docs]
tags: [diataxis, review]
canonical: docs/security/README.md
---

Reviewers often ask “where is the security story?” Here is the map.

## Product security (app layer)

Start at [docs/security/](https://github.com/gitmujoshi/Confidential-AI-Network/tree/main/docs/security): IAM design, key management, secrets, user auth architecture.

## Cloud deployment security

| Cloud | Architecture | IAM / edge | Features + env |
|-------|--------------|------------|----------------|
| OCI | [OCI_SECURITY_ARCHITECTURE](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/production/OCI_SECURITY_ARCHITECTURE.md) | [OCI_IAM_AND_EDGE](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/deployment/OCI_IAM_AND_EDGE_CONFIG.md) | [OCI_FEATURES](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/deployment/OCI_FEATURES_AND_CONFIGURATION.md) |
| Azure | [AZURE_SECURITY_ARCHITECTURE](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/production/AZURE_SECURITY_ARCHITECTURE.md) | [AZURE_IAM_AND_EDGE](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/deployment/AZURE_IAM_AND_EDGE_CONFIG.md) | [AZURE_FEATURES](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/deployment/AZURE_FEATURES_AND_CONFIGURATION.md) |
| Workload identity (OCI) | [OCI_SPIFFE_SPIRE_WIF](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/deployment/OCI_SPIFFE_SPIRE_WIF.md) | — | Terraform `modules/spire`, `modules/wif` |

## Lifecycle & crypto narrative

[PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/guides/PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md) ties contracts, DEK/MEK, signing, and CAN escrow together.

This blog is for **orientation**; the markdown files above remain the source of truth for implementation.
