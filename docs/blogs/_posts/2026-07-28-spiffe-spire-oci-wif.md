---
layout: post
title: "SPIFFE/SPIRE with OCI IAM workload identity — scaffolding what we ship"
date: 2026-07-28
categories: [security, oci]
permalink: /security/2026/07/28/spiffe-spire-oci-wif/
tags: [spiffe, spire, wif, oke]
canonical: docs/deployment/OCI_SPIFFE_SPIRE_WIF.md
---

We published a dedicated design for combining **SPIFFE/SPIRE** (portable workload identity)
with **Oracle Cloud Infrastructure IAM Workload Identity Federation** so Confidential AI Network
training and clean-room paths can avoid long-lived keys.

## What is in the repo today

| Phase | Artifact | Flag |
|-------|----------|------|
| 1 | Helm values + `modules/spire` (Server/Agent, OpenID Connect Discovery, ClusterSPIFFEID) | `enable_spire` |
| 3 | `modules/wif` (token-exchange app, Service Users, Identity Propagation Trust) | `enable_wif` |

Both default **off** so existing OCI applies stay unchanged.

## Mental model

1. SPIRE issues verifiable identity documents after Kubernetes (or Trusted Execution Environment) attestation  
2. Service-to-service traffic uses X.509 identity documents with mutual TLS  
3. OCI APIs use either native OKE Workload Identity **or** a JWT identity document exchanged for a short-lived session token via Identity Propagation Trust  

Impersonation rules use **exact** SPIFFE IDs — never a wildcard subject in production.

## Links

- Design: [OCI_SPIFFE_SPIRE_WIF.md](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/deployment/OCI_SPIFFE_SPIRE_WIF.md)
- Terraform: `deployment/oci/terraform/modules/spire`, `modules/wif`
- Helm: `deployment/oci/helm/spire`
