# The Credential Every AI Agent Fleet on an OKE Node Ends Up Sharing (And Shouldn't)

> **Blog short take:** [per-node credentials break multi-agent fleets on OKE](https://gitmujoshi.github.io/Confidential-AI-Network/security/2026/07/29/oke-agent-spiffe-short-take/)  
> **Full technical writeup:** [long post](https://gitmujoshi.github.io/Confidential-AI-Network/security/2026/07/29/oke-agent-spiffe-identity-gap/)

**The problem we're actually facing:** we're building AI agents on OKE, and each one needs its own scoped access to OCI resources and external APIs — without falling back on one shared credential across the whole agent fleet. That's a straightforward ask on AWS or GCP. On OCI, it means wiring SPIFFE identity through a federation path that exists, but isn't built for this out of the box.

We hit a version of this problem before — in 2021-22 we built a custom OCI-native app that needed to talk to multiple Fusion Applications APIs, back when Fusion's identity stack was still a standalone IDCS instance with no unified path to OCI IAM. We hand-built the bridge ourselves. Oracle has since folded IDCS into unified Identity Domains, and that bridge is now mostly a config exercise.

Same shape of problem, one layer over, today: **SPIFFE/SPIRE has no native bridge into OCI IAM.** AWS IAM Roles Anywhere and GCP Workload Identity Federation both have documented, named SPIFFE integrations. OCI has the same underlying capability — Workload Identity Federation — but it's generic OIDC trust you have to know to point at SPIRE yourself. No SPIFFE option in the console.

This isn't hypothetical. OpenAI shipped Workload Identity Federation in May 2026, and OCI is a supported provider — but Oracle's own docs flag that on OKE, the instance principal identifies the *worker node*, not the individual pod. So three agent pods on one node, each doing something different for a different user, look identical to that federation flow. That's exactly the gap SPIFFE's per-workload attestation is built to close.

Native SPIFFE support in OCI Identity Domains — the same role Roles Anywhere plays for AWS — would let IAM policy evaluate per-agent, per-task, not per-node. Until then, teams running SPIRE on OKE are maintaining a bridge that shouldn't need to be bespoke.

Anyone else hitting this with agent workloads on OCI? Curious how others are handling it.

*(Full technical writeup — SPIRE install steps, the OCI trust config, decoded token examples, runtime auth — in the comments.)*
