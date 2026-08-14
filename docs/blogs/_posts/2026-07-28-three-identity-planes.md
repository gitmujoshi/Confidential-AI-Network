---
layout: post
title: "Three identity planes: humans, cloud APIs, and workloads"
date: 2026-07-28
categories: [security, identity]
permalink: /security/2026/07/28/three-identity-planes/
tags: [zero-trust, spiffe, entra, oci-iam]
canonical: docs/deployment/OCI_SPIFFE_SPIRE_WIF.md
---

Confidential AI systems fail open when “identity” means one login screen.
In CAN we separate **three planes** so policies stay least-privilege and portable.

## 1. Humans and the portal

Interactive users (Training Data Consumer, Training Data Provider, Tech Service Provider / clean-room operator, AppAdmin) authenticate with the **cloud identity provider**:

| Cloud | Identity provider |
|-------|-------------------|
| Azure | Microsoft Entra ID |
| OCI | OCI IAM Identity Domains |
| GCP | Identity Platform |
| AWS | Cognito |

**Keycloak** stays on the laptop for demos and automated tests — it is not the production identity provider on any cloud.

## 2. Workloads calling cloud control planes

Pods and jobs need Vault, Object Storage, and registries **without static API keys**.
On Oracle Cloud that is **OKE Workload Identity** and/or **IAM Workload Identity Federation**
(SPIRE issues a short-lived JWT identity document, exchanged for a short-lived OCI session token).

## 3. Workload-to-workload Zero Trust

Peers (backend ↔ trainer ↔ confidential clean room) prove who they are with **SPIFFE/SPIRE**
verifiable identity documents and **mutual TLS**.
SPIFFE does not replace Trusted Execution Environment attestation for data/model encryption-key release — it complements it.

## Read the design

- [OCI SPIFFE/SPIRE + Workload Identity Federation](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/deployment/OCI_SPIFFE_SPIRE_WIF.md)
- [OCI Security Architecture](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/production/OCI_SECURITY_ARCHITECTURE.md)
- [Azure Security Architecture](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/production/AZURE_SECURITY_ARCHITECTURE.md)
