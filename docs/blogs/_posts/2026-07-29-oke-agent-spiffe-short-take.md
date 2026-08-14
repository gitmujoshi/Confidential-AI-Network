---
layout: post
title: "Short take: per-node credentials break multi-agent fleets on OKE"
date: 2026-07-29
categories: [security, identity, oci]
permalink: /security/2026/07/29/oke-agent-spiffe-short-take/
tags: [spiffe, oke, linkedin]
canonical: docs/architecture/oci-spiffe-linkedin-post.md
---

**The problem:** AI agents on OKE each need scoped access to OCI (and external APIs) — without one shared credential for the whole fleet. On AWS/GCP that path is named and documented. On OCI you wire SPIFFE through generic Workload Identity Federation yourself.

We hit a related bridge problem in 2021–22 (custom app ↔ Fusion / standalone IDCS). Unified **Identity Domains** largely retired that hand-built broker. Same shape today, one layer over: **SPIFFE/SPIRE has no first-class console option in OCI IAM**, while AWS Roles Anywhere and GCP WIF do.

OpenAI’s Workload Identity Federation supports OCI — but on OKE, **instance principals identify the worker node, not the pod**. Three agents on one node look identical unless SPIFFE issues per-workload SVIDs.

Native SPIFFE support in Identity Domains (Roles Anywhere–class ergonomics) would let IAM evaluate per-agent, not per-node.

**Full writeup** (SPIRE install, trust API, token examples, FastMCP east-west):  
[The credential every AI agent fleet on an OKE node ends up sharing]({% post_url 2026-07-29-oke-agent-spiffe-identity-gap %})

CAN scaffolding: [SPIFFE/SPIRE + OCI WIF design](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/deployment/OCI_SPIFFE_SPIRE_WIF.md)
