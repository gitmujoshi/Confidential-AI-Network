---
layout: post
title: "Three identity planes: humans, cloud APIs, and workloads"
date: 2026-07-28
categories: [security, identity]
tags: [zero-trust, spiffe, entra, oci-iam]
canonical: docs/deployment/OCI_SPIFFE_SPIRE_WIF.md
---

Confidential AI systems fail open when “identity” means one login screen.
In CAN we separate **three planes** so policies stay least-privilege and portable.

## 1. Humans and the portal

Interactive users (TDC, TDP, CCRP/TSP, AppAdmin) authenticate with the **cloud IdP**:

| Cloud | IdP |
|-------|-----|
| Azure | Microsoft Entra ID |
| OCI | OCI IAM Identity Domains |
| GCP | Identity Platform |
| AWS | Cognito |

**Keycloak** stays on the laptop for demos and Playwright — it is not the production IdP on any cloud.

## 2. Workloads calling cloud control planes

Pods and jobs need Vault, Object Storage, and registries **without static API keys**.
On OCI that is **OKE Workload Identity** and/or **IAM Workload Identity Federation (WIF)**
(SPIRE JWT-SVID → short-lived UPST).

## 3. Workload-to-workload Zero Trust

Peers (backend ↔ trainer ↔ CAN CCR) prove who they are with **SPIFFE/SPIRE** SVIDs and mTLS.
SPIFFE does not replace TEE attestation for DEK/MEK release — it complements it.

## Read the design

- [OCI SPIFFE/SPIRE + WIF](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/deployment/OCI_SPIFFE_SPIRE_WIF.md)
- [OCI Security Architecture](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/production/OCI_SECURITY_ARCHITECTURE.md)
- [Azure Security Architecture](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/production/AZURE_SECURITY_ARCHITECTURE.md)
