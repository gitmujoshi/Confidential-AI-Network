---
layout: post
title: "Product tour deck — Azure AKS and GCP GKE"
date: 2026-08-16
categories: [product, azure]
tags: [azure, entra, product-tour, deck, can, kms, tee]
permalink: /product/2026/08/16/azure-e2e-product-tour-deck/
excerpt: "Stakeholder slide deck for the Confidential AI Network end-to-end narrative on Azure and GCP — open in the browser and present with arrow keys."
---

[Open the product tour deck]({{ '/assets/decks/azure-e2e-product-tour.html' | relative_url }}) (←/→ or on-screen buttons).

Narrative: Entra or Identity Platform → Ricardian contract → the TSP’s existing AKS or GKE cluster → provenance → deploy/predict under Open-GMASE, with CompliancePulse on the decision path. Azure still carries the Key Vault and confidential-compute target. GCP names the existing GKE cluster the same way Azure names AKS: project, location, cluster, namespace, and GCS bucket on the contract; kubeconfig path on the TSP dashboard. A missing path fails the job. Design/pilot slides are labeled as such in the deck.

| Resource | Link |
| --- | --- |
| **Interactive deck** | [azure-e2e-product-tour.html]({{ '/assets/decks/azure-e2e-product-tour.html' | relative_url }}) |
| Speaker notes | [AZURE_E2E_PRODUCT_TOUR_DECK.md](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/marketing/AZURE_E2E_PRODUCT_TOUR_DECK.md) |
| UI tour | [Product tour]({{ '/product-tour/#ccr' | relative_url }}) (Local, Azure AKS, and GCP GKE captures) |
| Entra architecture | [Azure security architecture]({% post_url 2026-07-28-azure-entra-security-architecture %}) |
| Confidential computing | [Threat model · Key Vault · SKR · e2e]({% post_url 2026-08-17-azure-confidential-computing-deep-dive %}) |
| SPIFFE / WI | [SPIFFE/SPIRE on Azure]({% post_url 2026-08-17-spiffe-spire-azure-wif %}) |
| Terraform (pilot) | [deployment/azure/terraform](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/deployment/azure/terraform/README.md) |
| KMS / TEE | [DEK·MEK]({% post_url 2026-08-16-can-kms-dek-mek-escrow %}) · [TEE attest → decrypt]({% post_url 2026-08-16-can-tee-attest-decrypt-train %}) |

DEPA context: [depa.world](https://depa.world).
