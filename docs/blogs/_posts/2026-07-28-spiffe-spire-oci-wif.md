---
layout: post
title: "SPIFFE/SPIRE with OCI IAM WIF — scaffolding what we ship"
date: 2026-07-28
categories: [security, oci]
tags: [spiffe, spire, wif, oke]
canonical: docs/deployment/OCI_SPIFFE_SPIRE_WIF.md
---

We published a dedicated design for combining **SPIFFE/SPIRE** (portable workload identity)
with **OCI IAM Workload Identity Federation** so CAN training and CCR paths can avoid long-lived keys.

## What is in the repo today

| Phase | Artifact | Flag |
|-------|----------|------|
| 1 | Helm values + `modules/spire` (Server/Agent, OIDC Discovery, ClusterSPIFFEID) | `enable_spire` |
| 3 | `modules/wif` (token-exchange app, Service Users, IdentityPropagationTrust) | `enable_wif` |

Both default **off** so existing OCI applies stay unchanged.

## Mental model

1. SPIRE issues SVIDs after K8s (or TEE) attestation  
2. East-west traffic uses X.509-SVIDs  
3. OCI APIs use either native OKE Workload Identity **or** JWT-SVID → UPST via Propagation Trust  

Impersonation rules use **exact** `sub eq 'spiffe://…'` — never `sub eq *` in production.

## Links

- Design: [OCI_SPIFFE_SPIRE_WIF.md](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/deployment/OCI_SPIFFE_SPIRE_WIF.md)
- Terraform: `deployment/oci/terraform/modules/spire`, `modules/wif`
- Helm: `deployment/oci/helm/spire`
