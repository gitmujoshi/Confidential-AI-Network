---
layout: post
title: "Azure GA product tour deck — Entra to governed prediction"
date: 2026-08-16
categories: [product, azure]
tags: [azure, entra, product-tour, deck, can, kms, tee]
permalink: /product/2026/08/16/azure-e2e-product-tour-deck/
excerpt: "Slide deck for the Confidential AI Network end-to-end product tour on Microsoft Azure GA — open in the browser and present with arrow keys."
---

**Present now:** [Open the Azure E2E product tour deck]({{ '/assets/decks/azure-e2e-product-tour.html' | relative_url }}) (full-screen slides · ←/→ or on-screen buttons).

This is the stakeholder / customer narrative for **CAN on Azure** when the deployment is released: Microsoft Entra sign-in through Ricardian contract, Key Vault, confidential compute (attest → DEK/MEK → decrypt-in-memory → train), provenance, then deploy & predict under Open-GMASE—with CompliancePulse ingest on the same decision path.

| Resource | Link |
| --- | --- |
| **Interactive deck** | [assets/decks/azure-e2e-product-tour.html]({{ '/assets/decks/azure-e2e-product-tour.html' | relative_url }}) |
| Slide script + speaker notes | [AZURE_E2E_PRODUCT_TOUR_DECK.md](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/marketing/AZURE_E2E_PRODUCT_TOUR_DECK.md) (repo) |
| UI screenshot tour | [Product tour]({{ '/product-tour/' | relative_url }}) (Local path; Azure captures at GA) |
| Azure Entra architecture | [Azure security architecture]({% post_url 2026-07-28-azure-entra-security-architecture %}) |
| Azure confidential computing | [Threat model · Key Vault · SKR · e2e train]({% post_url 2026-08-17-azure-confidential-computing-deep-dive %}) |
| KMS / TEE | [DEK·MEK escrow]({% post_url 2026-08-16-can-kms-dek-mek-escrow %}) · [TEE attest → decrypt]({% post_url 2026-08-16-can-tee-attest-decrypt-train %}) |

**Inspired by iSPIRT [DEPA](https://depa.world)** — use-bound sharing with evidence, not a central data lake.

> Use arrow keys or the footer buttons. At GA, swap in live Azure screenshots per the appendix in the markdown script.
