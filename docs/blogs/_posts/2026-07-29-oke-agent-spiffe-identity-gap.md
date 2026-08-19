---
layout: post
title: "The credential every AI agent fleet on an OKE node ends up sharing (and shouldn't)"
date: 2026-07-29
categories: [security, identity, oci]
permalink: /security/2026/07/29/oke-agent-spiffe-identity-gap/
tags: [spiffe, spire, oke, wif, agents]
canonical: docs/architecture/oci-spiffe-identity-gap.md
---

**The problem we're actually facing:** we're building AI agents on OKE, and each one needs its own scoped access to OCI resources and external APIs — without falling back on one shared credential across the whole agent fleet. That's a straightforward ask on AWS or GCP. On OCI, it means wiring SPIFFE identity through a federation path that exists but isn't built for this out of the box.

In 2021–22, we hit a version of this same problem in a different corner of the platform. We built a custom OCI-native app that needed to talk to multiple Fusion Applications APIs. At the time, Fusion's identity stack ran on a standalone IDCS instance, separate from OCI's own IAM — no unified identity domain to federate through, and no clean supported path for a custom app to bridge the two. So we built one: a broker that exchanged our app's OCI credential for a Fusion-scoped token, with rotation and caching we owned ourselves.

That bridge is largely unnecessary today. Oracle has since folded IDCS directly into OCI IAM as unified Identity Domains, and documented OAuth patterns (authorization-code and client-credentials) for exactly this kind of integration run natively on top of that unified model. What we hand-built as a workaround for two separate identity systems is now mostly a config exercise against one.

That evolution is a good lens for where SPIFFE/SPIRE and OCI IAM stand today: **the primitive exists, but it isn't SPIFFE-native the way it is on AWS and GCP.**

## Quick primer: what SPIFFE/SPIRE actually is

If you haven't run into it: **SPIFFE** (Secure Production Identity Framework for Everyone) is an open spec for giving every workload — a pod, a container, a process — its own cryptographic identity, instead of relying on network location, shared secrets, or static API keys. Each workload gets a **SPIFFE ID** (a URI like `spiffe://oke.example.com/ns/agents-research/sa/agent-a`) and a short-lived credential called an **SVID** (SPIFFE Verifiable Identity Document) — either an X.509 certificate or a JWT — that proves it.

**SPIRE** is the reference implementation. A **SPIRE Server** acts as the trust root; a **SPIRE Agent** runs on each node and does the actual verification — checking Kubernetes namespace, service account, pod labels, or container image hash to confirm a workload really is what it claims, before issuing it an SVID. Identities are typically minutes, not hours, in length, and rotate automatically — nothing is written to disk, and workloads fetch their own identity over a local socket (the Workload API).

The reason this matters for cloud IAM: SPIFFE/SPIRE has become the default way large infra teams solve "prove which specific service or agent instance made this call" — and increasingly, clouds let you exchange that SPIFFE identity for their own native credentials instead of provisioning a separate one. That's the federation pattern the rest of this post is about.

## What actually exists

- **AWS IAM Roles Anywhere** accepts SPIFFE X.509-SVIDs directly — register your SPIRE trust domain's CA as a trust anchor, and workloads present their SVID to assume a role. There's an official SPIFFE-maintained helper for it.
- **GCP Workload Identity Federation** accepts SPIRE-issued JWT-SVIDs via OIDC, exchanged for service account impersonation.
- **OCI IAM** has the same underlying capability — Workload Identity Federation — where an admin registers an external IdP's OIDC issuer as trusted, and a workload exchanges a JWT for a short-lived OCI session token (UPST) via the identity domain's token endpoint.

The OCI path works with SPIRE too: expose SPIRE's OIDC Discovery Provider as the JWT issuer, register it as a trusted IdP in OCI IAM, and a SPIFFE JWT-SVID becomes an OCI UPST the same way it becomes an AWS or GCP token elsewhere.

## What's actually missing

Not the mechanism — the ergonomics:

- **No SPIFFE-specific integration.** AWS and GCP both have documented, named SPIFFE integration paths. OCI's Workload Identity Federation is generic OIDC federation you have to know to point at SPIRE yourself — there's no "SPIFFE" option in the console.
- **Manual, admin-driven trust setup**, not push-button — closer to where AWS's integration looked a few years ago.
- **UPST tokens run up to 60 minutes** — coarser than a typical 15-minute SVID, so per-task scoping still needs to happen at the application layer.

## Why it matters more for AI agents

This isn't hypothetical anymore. OpenAI shipped Workload Identity Federation for its own API on May 26, 2026 — trusted workloads exchange a cloud-issued OIDC token for a short-lived OpenAI access token, no stored API key. OCI is one of the supported providers: an OCI instance principal signs a token exchange with the identity domain, and the resulting token maps to an OpenAI service account. Same pattern, one hop further downstream.

Oracle's own setup docs for this flag the exact limitation that matters for agents: on OKE, the instance principal signer identifies the *worker node*, not the individual pod. So three different agent pods on the same node — each running a different task, for a different user, with different intended scope — present as the same identity to that federation flow. That's the multi-agent-per-node picture from the diagram below, and it's precisely the gap SPIFFE's per-workload attestation is built to close: distinct SVIDs per pod, derived from actual process/namespace attestation rather than node-level metadata, so "which agent did this" survives all the way through the token exchange instead of collapsing to "some agent on this node."

Layer SPIFFE identity underneath these node-level federation flows — to OpenAI, to OCI IAM, to any OIDC-federated API — and attribution moves from node-level to agent-level without inventing a separate credential store.

## Closing the last mile: tool invocation

Everything above covers **north-south** identity — an agent calling out to OCI or OpenAI. Multi-agent systems also need **east-west** identity: an orchestrator calling a sub-agent, or an agent calling a tool server. That's where a FastMCP-based tool server fits.

FastMCP is designed to run as an OAuth 2.1 resource server, and its own guidance is to delegate token issuance to an external, standards-compliant authorization server rather than build one in. SPIRE's OIDC Discovery Provider already *is* that authorization server — the same JWKS endpoint you'd register with OCI or OpenAI's Workload Identity Federation. Point FastMCP's `JWTVerifier` at it, and a FastMCP tool server can validate an agent's JWT-SVID directly as the bearer token for a tool call — no separate auth flow, no shared API key across tools.

That gives you the full chain, identity-consistent end to end: agent pod gets a per-workload SVID from SPIRE → calls a FastMCP tool server, which validates that same SVID against SPIRE's JWKS → the tool server (or the agent itself) exchanges the SVID for a scoped OCI or OpenAI token when it needs to reach outside. One identity, three checkpoints, no shared credentials at any of them.

*(Diagram: multiple agent pods on one OKE node sharing a node-level principal unless SPIFFE issues per-workload SVIDs.)*

Canonical design for CAN: [OCI SPIFFE/SPIRE + WIF](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/deployment/OCI_SPIFFE_SPIRE_WIF.md) · [repo scaffolding post]({% post_url 2026-07-28-spiffe-spire-oci-wif %}).

## Runtime authentication and authorization

Everything above covers *getting* an identity. Here's what happens on every actual call, for both directions.

### North-south: agent → OCI / OpenAI

**Authentication happens twice, not once.** First at token exchange — OCI validates the JWT-SVID's signature against SPIRE's JWKS, checks issuer and audience, confirms it hasn't expired. Second, on every subsequent OCI API call — the UPST embeds the public key you generated (the `jwk` claim), so each request has to be signed with the matching private key. A stolen UPST alone isn't enough; without the private key, it can't produce a valid request signature.

**Authorization is a policy decision, evaluated per call.** Once the UPST is validated, standard OCI IAM policies apply against whichever principal it represents — the impersonated service user, or (with the newer RPST flow) the workload's own session identity. RPST goes further: up to three claims from the incoming JWT-SVID can be copied straight into the session token and referenced directly in IAM policy — so a policy can say "allow if `spiffe_ns = agents-finance`" without needing a dedicated service user per agent. That's the mechanism that actually delivers per-agent least privilege, rather than per-shared-service-user privilege.

For OpenAI, authorization is simpler and coarser: the exchanged token maps to one OpenAI service account with its own project and quota — there's no equivalent per-agent claim propagation on that side yet, so scoping there still happens at the application layer.

### East-west: agent → FastMCP tool server

**Authentication is stateless, per request.** FastMCP's `JWTVerifier` checks the JWT-SVID's signature against SPIRE's JWKS, issuer, and audience on every tool call — no session, no cookie, nothing cached server-side. If the SVID rotates mid-task (SPIRE rotates them automatically, typically every 15 minutes), the next call just carries the new one; nothing has to be re-established.

**Authorization is not automatic, and this is the part worth being deliberate about.** A validated SVID only proves *which* agent is calling — it says nothing about whether that agent is *allowed* to call this particular tool. That decision has to be enforced separately, typically one of two ways: a policy check inside the FastMCP server itself, mapping the SPIFFE ID (or its namespace) to an allow-list of tools, or an OPA (Open Policy Agent) sidecar evaluating the request against a written policy — "agents-orchestrator can call `delegate_to_subagent`; agents-research can call `web_search` but not `write_object_storage`." SPIFFE and OPA are commonly paired for exactly this reason: SPIFFE answers "who," OPA answers "allowed to do what."

**Revocation is attestation-based, not a token blocklist.** If an agent's behavior looks wrong mid-task, there's no UPST or SVID to individually revoke in real time — instead, you disable its SPIRE registration entry (or its `ClusterSPIFFEID` selector stops matching), which stops *future* SVID issuance immediately. Whatever SVID it already holds is still valid until it expires — which is the practical argument for keeping SVID TTLs short: a 15-minute SVID bounds the damage window in a way a 60-minute UPST, let alone a static credential, doesn't.

## Installing SPIRE on OKE

Before any of the OCI trust config below matters, SPIRE has to be running on your cluster. The official `helm-charts-hardened` project deploys the whole stack — server, agent, CSI driver, and the OIDC Discovery Provider you'll federate with OCI — in one shot.

**1. Confirm your OKE cluster supports Projected Service Account Tokens.** This is standard on current Kubernetes versions (including OKE), so it's usually already on — no action needed unless you're on an old cluster image.

**2. Install the SPIRE CRDs, then the stack:**

```bash
helm upgrade --install --create-namespace -n spire spire-crds spire-crds \
  --repo https://spiffe.github.io/helm-charts-hardened/

helm upgrade --install -n spire spire spire \
  --repo https://spiffe.github.io/helm-charts-hardened/ \
  -f your-values.yaml
```

**3. Set your trust domain and cluster name in `your-values.yaml`:**

```yaml
global:
  spire:
    recommendations:
      enabled: true
    namespaces:
      create: true
    clusterName: oke-agents-cluster
    trustDomain: oke.example.com
    caSubject:
      country: US
      organization: YourOrg
      commonName: oke.example.com
```

This deploys SPIRE Server, the per-node SPIRE Agent DaemonSet, the SPIFFE CSI driver (which exposes the Workload API socket to pods without a hostPath mount), and the OIDC Discovery Provider — the piece OCI federates against.

**4. Register your agent pods for automatic identity issuance.** Rather than registering each workload by hand, the SPIRE Controller Manager watches for a `ClusterSPIFFEID` resource and auto-issues SVIDs to matching pods:

{% raw %}
```yaml
apiVersion: spire.spiffe.io/v1alpha1
kind: ClusterSPIFFEID
metadata:
  name: agents-research
spec:
  spiffeIDTemplate: "spiffe://{{ .TrustDomain }}/ns/{{ .PodMeta.Namespace }}/sa/{{ .PodSpec.ServiceAccountName }}"
  podSelector:
    matchLabels:
      app: agent-research
```
{% endraw %}

One of these per agent namespace (matching the `agents-research` / `agents-finance` / `agents-orchestrator` split from the diagram) gets every matching pod its own SVID automatically, with no manual registration step per pod.

**5. Confirm it's working** from inside a pod, using the Workload API socket the CSI driver mounted:

```bash
kubectl exec -it <agent-pod> -- /opt/spire/bin/spire-agent api fetch jwt \
  -audience oci-wif -socketPath /run/spire/agent-sockets/spire-agent.sock
```

A returned JWT-SVID means the pod side is done — the rest is the OCI trust configuration below.

## Setting this up in practice

The trust relationship is built through a couple of API calls, not a console click-through — worth knowing going in. Here's the simple version.

**1. Turn on SPIRE's OIDC side.** Enable the SPIRE OIDC Discovery Provider and set `jwt_issuer` to a public HTTPS URL you control, e.g. `https://spire-oidc.example.com`. Confirm the JWKS endpoint responds: `https://spire-oidc.example.com/keys`.

**2. Create two Confidential Applications in the OCI console.** Identity Domain → Integrated Applications → Add Application → Confidential Application. One is for trust administration, one is for the actual token exchange. This part *is* point-and-click.

**3. Create the trust, via one API call.** `POST <IAM-DOMAIN-URL>/admin/v1/IdentityPropagationTrusts` with:

```json
{
  "active": true,
  "allowImpersonation": true,
  "issuer": "https://spire-oidc.example.com",
  "name": "SPIRE JWT-SVID Trust",
  "oauthClients": ["<OAuth Client ID from step 2>"],
  "publicKeyEndpoint": "https://spire-oidc.example.com/keys",
  "impersonationServiceUsers": [
    { "rule": "sub eq *", "value": "<service-user-id>" }
  ],
  "subjectType": "User",
  "type": "JWT",
  "schemas": ["urn:ietf:params:scim:schemas:oracle:idcs:IdentityPropagationTrust"]
}
```

Start with the wildcard rule (`sub eq *`) to prove the flow end-to-end. Once it works, tighten it to key off the SPIFFE ID claim so each agent maps to its own scoped OCI service user, instead of everyone sharing one.

**4. Exchange an SVID for an OCI token.** `POST <IAM-DOMAIN-URL>/oauth2/v1/token`, passing the agent's JWT-SVID as `subject_token`, `subject_token_type=jwt`, and `requested_token_type=urn:oci:token-type:oci-upst`. A working exchange returns a UPST, usable with OCI SDKs for the next 60 minutes.

### What actually goes in and comes out

The exchange only runs one direction — SPIRE issues the SVID from its own workload attestation; OCI never issues something back that SPIRE would accept as an SVID. Decoded, illustrative examples of each side:

**In: the agent's JWT-SVID (decoded), presented as `subject_token`:**

```json
{
  "header": {
    "alg": "RS256",
    "kid": "spire-oidc-key-1",
    "typ": "JWT"
  },
  "payload": {
    "iss": "https://spire-oidc.example.com",
    "sub": "spiffe://oke.example.com/ns/agents-research/sa/agent-a",
    "aud": ["oci-wif"],
    "exp": 1732739400,
    "iat": 1732738500
  }
}
```

**Out: what OCI returns.** The response itself is just `{"token": "<opaque-token-id>"}` — Oracle doesn't publish the full internal UPST claim schema, so this is illustrative based on the documented fields:

```json
{
  "header": {
    "alg": "RS256",
    "kid": "oci-iam-signing-key",
    "typ": "JWT"
  },
  "payload": {
    "iss": "https://idcs-<domain>.identity.oraclecloud.com",
    "sub": "<mapped-oci-service-user-id>",
    "source_authn_prin": "spiffe://oke.example.com/ns/agents-research/sa/agent-a",
    "jwk": "<public key you submitted, embedded for proof-of-possession>",
    "exp": 1732742100,
    "iat": 1732738500
  }
}
```

Two fields do the identity work worth noticing: `source_authn_prin` preserves the original SPIFFE ID even after impersonation maps the call to a service user — that's the provenance chain from earlier in this post, intact end to end. And `jwk` embeds the public key you generated in Step 5, which is why the UPST alone can't be replayed by someone else — every API call signed with it has to be signed by the matching private key, which never leaves the workload.

**Three things that trip people up, per Oracle's own troubleshooting notes:**
- The public key you submit has to be raw base64 — strip the `-----BEGIN/END PUBLIC KEY-----` lines or the exchange fails.
- The `issuer` string has to match SPIRE's issuer *exactly*, including trailing slashes — a mismatch fails trust lookup silently.
- Only one active trust per issuer is allowed — a leftover test trust will block a new one from matching.

Turn on **Identity Domain → Settings → Diagnostics** before you start — it shows exactly which validation step failed rather than leaving you to guess.

## The ask

Not "please build this" — it's built, and the industry pattern (cloud-native workload → external API via OIDC token exchange) is now mainstream enough that OpenAI shipped it as a day-one multi-provider feature. What would help: native SPIFFE support as a first-class option in OCI Identity Domains' Workload Identity Federation, the way it's a named integration on AWS and GCP, so per-agent identity doesn't require bolting SPIRE on top of node-level instance principals by hand.

Anyone else running SPIRE federated into OCI IAM today — or hitting the node-vs-pod identity gap with instance-principal-based federation? Curious what the setup looked like in practice.

## References

**SPIFFE / SPIRE**
- [SPIFFE specification](https://github.com/spiffe/spiffe)
- [SPIRE documentation](https://spiffe.io/docs/latest/spire-about/)
- [SPIRE OIDC Discovery Provider](https://github.com/spiffe/spire/blob/main/support/oidc-discovery-provider/README.md)
- [SPIFFE Helm Charts (hardened)](https://github.com/spiffe/helm-charts-hardened)
- [SPIRE Controller Manager / ClusterSPIFFEID](https://github.com/spiffe/spire-controller-manager)

**OAuth 2.x / OIDC / JWT**
- [RFC 6749 — The OAuth 2.0 Authorization Framework](https://datatracker.ietf.org/doc/html/rfc6749)
- [RFC 8693 — OAuth 2.0 Token Exchange](https://datatracker.ietf.org/doc/html/rfc8693)
- [RFC 8705 — OAuth 2.0 Mutual-TLS Client Authentication and Certificate-Bound Access Tokens](https://datatracker.ietf.org/doc/html/rfc8705)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [OpenID Connect Discovery 1.0](https://openid.net/specs/openid-connect-discovery-1_0.html)
- [RFC 7519 — JSON Web Token (JWT)](https://datatracker.ietf.org/doc/html/rfc7519)
- [RFC 7517 — JSON Web Key (JWK)](https://datatracker.ietf.org/doc/html/rfc7517)

**OCI**
- [OCI IAM Identity Domains overview](https://docs.oracle.com/en-us/iaas/Content/Identity/domains/overview-of-identity-domains.htm)
- [JWT assertion / token exchange with OCI IAM](https://docs.oracle.com/en-us/iaas/Content/Identity/api-getstarted/json_web_token_exchange.htm)
- [OCI Instance Principals](https://docs.oracle.com/en-us/iaas/Content/Identity/Tasks/callingservicesfrominstances.htm)
- [OCI Resource Principals](https://docs.oracle.com/en-us/iaas/Content/Functions/Tasks/functionsaccessingociresources.htm)
- [Configure OAuth Using the Fusion Applications Identity Domain](https://docs.oracle.com/en/cloud/saas/applications-common/26a/farca/configure_oauth.html)
- [Overview of Using the Fusion Cloud Applications Identity Domain to Build Extensions](https://docs.oracle.com/en/cloud/saas/applications-common/25c/oaext/overview-of-using-oracle-fusion-cloud-applications-identity-domain-to-build-extensions.html)

**AWS**
- [AWS IAM Roles Anywhere](https://docs.aws.amazon.com/rolesanywhere/latest/userguide/introduction.html)
- [AWS STS AssumeRoleWithWebIdentity (OIDC federation)](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRoleWithWebIdentity.html)
- [spiffe/aws-spiffe-workload-helper](https://github.com/spiffe/aws-spiffe-workload-helper) — official tool exchanging X.509-SVIDs for AWS credentials via Roles Anywhere

**GCP**
- [GCP Workload Identity Federation overview](https://cloud.google.com/iam/docs/workload-identity-federation)
- [Configuring workload identity federation with an OIDC provider](https://cloud.google.com/iam/docs/workload-identity-federation-with-other-clouds)

**OpenAI**
- [OpenAI Workload Identity Federation overview](https://developers.openai.com/api/docs/guides/workload-identity-federation)
- [Configuring workload identity federation for Oracle Cloud Infrastructure](https://developers.openai.com/api/docs/guides/workload-identity-federation/oracle-cloud)
- [Configuring workload identity federation for Kubernetes](https://developers.openai.com/api/docs/guides/workload-identity-federation/kubernetes)
- [Configuring workload identity federation for AWS](https://developers.openai.com/api/docs/guides/workload-identity-federation/aws)
