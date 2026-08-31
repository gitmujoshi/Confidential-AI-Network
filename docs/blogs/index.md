---
layout: default
title: Home
description: Confidential AI Network — research notes on contract-governed, confidential multi-party training without a central data lake.
permalink: /
---

<section class="hero hero-home">
  <p class="eyebrow">Confidential AI Network</p>
  <h1>Governed multi-party training without a central data lake</h1>
  <p class="lede">
    High-value models often need data that cannot be freely centralized.
    <strong>Confidential AI Network (CAN)</strong> explores a control model where providers,
    consumers, and clean-room operators negotiate a machine-enforceable contract,
    train only in policy-bound environments, and retain provenance for verification.
  </p>
  <p class="cta-row">
    <a class="cta" href="{% post_url 2026-08-14-governed-ai-enterprise-ciso-overview %}">Executive overview (CISO)</a>
    <a class="cta cta-secondary" href="{% post_url 2026-08-16-ricardian-contracts-in-can %}">Ricardian contracts</a>
    <a class="cta cta-secondary" href="{% post_url 2026-08-14-can-contract-to-prediction %}">CAN: contract to prediction</a>
    <a class="cta cta-secondary" href="{{ '/product-tour/' | relative_url }}">Product tour</a>
  </p>
</section>

<section class="home-section">
  <h2>Problem</h2>
  <p>
    Healthcare, finance, public sector, and industrial organizations hold data that cannot be freely exported.
    Model builders need that data, but a shared central lake concentrates sovereignty, liability, and competitive risk.
  </p>
  <p>
    <strong>CAN</strong> treats collaboration as a protocol: catalog metadata → Ricardian contract →
    signed, policy-bound training → provenance on a confidential ledger.
    Informed by India’s iSPIRT <a href="https://depa.world">DEPA</a>
    (Data Empowerment and Protection Architecture); intended to run on enterprise clouds with native IdPs.
  </p>
</section>

<section class="home-section">
  <h2>Design objectives</h2>
  <ul class="vision-list">
    <li>
      <strong>Data remains with its owner.</strong>
      TDPs publish catalogs and use policies; access is use-bound and time-bound.
    </li>
    <li>
      <strong>Training runs where policy allows.</strong>
      TSP / CCRP environments (TEE, private cloud, or attested Kubernetes).
    </li>
    <li>
      <strong>Steps are attributable.</strong>
      Signatures, job outcomes, and claims toward SCITT CCF for GRC evidence.
    </li>
    <li>
      <strong>Split identity planes.</strong>
      Humans via cloud IdP (Entra, OCI IAM, Identity Platform, Cognito);
      workloads via SPIFFE/SPIRE and cloud workload identity.
    </li>
  </ul>
</section>

<section class="home-section">
  <h2>Architecture at a glance</h2>
  <p>
    One control surface, three trust planes: people, cloud APIs, and peer workloads.
    Contracts bind the commercial agreement; confidential compute and cryptography enforce the technical one.
  </p>
  <p>
    Shared control objectives across Azure, AWS, GCP, and OCI:
    <a href="https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/production/MULTI_CLOUD_SECURITY_ARCHITECTURE_PATTERNS.md">Multi-cloud security architecture patterns</a>.
  </p>

  <figure class="arch-figure" aria-label="High-level Confidential AI Network architecture">
<pre class="arch-diagram">
  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
  │     TDP     │     │     TDC     │     │  TSP/CCRP   │
  │  datasets   │     │   models    │     │ clean rooms │
  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
         │                   │                   │
         └─────────┬─────────┴─────────┬─────────┘
                   ▼                   ▼
         ┌─────────────────────────────────────┐
         │  Portal + APIs  ·  Ricardian terms  │
         │  Cloud identity provider SSO · roles│
         └──────────────────┬──────────────────┘
                            ▼
         ┌─────────────────────────────────────┐
         │  Contract lifecycle → training jobs │
         │  DEK/MEK · DP options · provenance  │
         └──────────┬───────────────┬──────────┘
                    ▼               ▼
         ┌────────────────┐  ┌─────────────────┐
         │ Isolated train │  │ SCITT CCF ledger│
         │ TEE / K8s / VM │  │ claims &amp; audit  │
         └────────────────┘  └─────────────────┘
</pre>
  </figure>

  <div class="arch-grid">
    <div>
      <h3>Control plane</h3>
      <p>Portal, APIs, contract state machine, catalog, AppAdmin; cloud IdP for humans.</p>
    </div>
    <div>
      <h3>Data &amp; crypto plane</h3>
      <p>Dataset encryption, key escrow, optional DP, DEPA-aligned entity IDs.</p>
    </div>
    <div>
      <h3>Execution plane</h3>
      <p>Policy-bound training; SPIFFE/SPIRE for east-west where enabled.</p>
    </div>
    <div>
      <h3>Evidence plane</h3>
      <p>SCITT CCF claims; SIEM export for SOC workflows.</p>
    </div>
  </div>
</section>

<section class="home-section">
  <h2>Start here</h2>
  <p>
    <a href="{{ '/product-tour/' | relative_url }}">Product tour</a>
    (Local path) ·
    <a href="{% post_url 2026-08-17-azure-confidential-computing-deep-dive %}">Azure confidential computing</a>
    (threat model · Key Vault · SKR).
  </p>
</section>

<section class="home-section notes-section" id="notes">
  <h2>Notes &amp; whitepapers</h2>
  <p class="section-intro">
    Long-form specs live in the repository <code>docs/</code> tree; this site is the short path.
  </p>

  <div class="post-group start-here" id="series-start">
    <p class="series-label">Start here</p>
    <h3>Executive overview</h3>
    <p class="group-lede">Executive path — start here before specialist notes.</p>
    <ol class="post-list ordered">
      <li>
        <a href="{% post_url 2026-08-17-can-contract-management-signing %}">Contract management in CAN — party signing keys, sign gates, and verification</a>
        <p class="meta">August 17, 2026 · UserKey · authz vs crypto verify · Key Vault target</p>
      </li>
      <li>
        <a href="{% post_url 2026-08-16-ricardian-contracts-in-can %}">Ricardian contracts in CAN — legal prose the runtime can enforce</a>
        <p class="meta">August 16, 2026 · Dual-layer legal + machine binding · sign → SIGNED → train</p>
      </li>
      <li>
        <a href="{% post_url 2026-08-16-azure-e2e-product-tour-deck %}">Azure product tour deck — Entra to governed prediction</a>
        <p class="meta">August 16, 2026 · Stakeholder slide deck for the Azure deployment narrative</p>
      </li>
      <li>
        <a href="{% post_url 2026-08-14-can-contract-to-prediction %}">Confidential AI Network: from signed contract to governed prediction</a>
        <p class="meta">August 14, 2026 · Train → infer under Open-GMASE, with CompliancePulse ingest</p>
      </li>
      <li>
        <a href="{% post_url 2026-08-14-governed-ai-enterprise-ciso-overview %}">Governed AI for the enterprise — a CISO’s overview</a>
        <p class="meta">August 14, 2026 · Executive brief on CAN, Open-GMASE, and CompliancePulse</p>
      </li>
      <li>
        <a href="{{ '/product-tour/' | relative_url }}">Product tour</a>
        <p class="meta">Screenshots · CAN end-to-end path</p>
      </li>
      <li>
        <a href="{% post_url 2026-08-14-can-gmase-demo-slice %}">Try it: CAN ↔ Open-GMASE ↔ CompliancePulse (demo slice)</a>
        <p class="meta">August 14, 2026 · Live OPA → AuditLogs → CP ingest seam (research demo)</p>
      </li>
    </ol>
  </div>

  <nav class="notes-toc" aria-label="Deeper topic guides">
    <a href="#series-platform">Platform detail</a>
    <a href="#series-crypto">KMS, TEE &amp; provenance</a>
    <a href="#series-agents">Agent governance</a>
    <a href="#series-essays">Architecture essays</a>
    <a href="#series-identity">Identity</a>
    <a href="#series-cloud">Cloud security</a>
    <a href="#series-compliance">Compliance</a>
    <a href="#all-posts">All posts</a>
  </nav>

  <p class="depth-intro">Specialist notes</p>

  <div class="post-group" id="series-platform">
    <h3>Platform — Confidential AI Network</h3>
    <p class="group-lede">Product and architecture detail for CAN.</p>
    <ol class="post-list ordered">
      <li>
        <a href="{% post_url 2026-08-17-can-contract-management-signing %}">Contract management in CAN — party signing keys, sign gates, and verification</a>
        <p class="meta">August 17, 2026 · What signs the agreement vs what unlocks DEK/MEK</p>
      </li>
      <li>
        <a href="{% post_url 2026-08-16-ricardian-contracts-in-can %}">Ricardian contracts in CAN — legal prose the runtime can enforce</a>
        <p class="meta">August 16, 2026 · What the agreement is and how train/infer/audit hang off it</p>
      </li>
      <li>
        <a href="{% post_url 2026-08-14-can-contract-to-prediction %}">Confidential AI Network: from signed contract to governed prediction</a>
        <p class="meta">August 14, 2026 · Current product surface — contract through governed inference</p>
      </li>
      <li>
        <a href="{% post_url 2026-07-29-building-confidential-ai-network %}">Building Confidential AI Network — governed multi-party training without a data lake</a>
        <p class="meta">July 29, 2026 · Technical product walkthrough</p>
      </li>
    </ol>
  </div>

  <div class="post-group" id="series-crypto">
    <h3>KMS, TEE &amp; provenance</h3>
    <p class="group-lede">Keys, clean-room decrypt gates, and tamper-evident audit when models misbehave.</p>
    <ol class="post-list ordered">
      <li>
        <a href="{% post_url 2026-08-17-azure-confidential-computing-deep-dive %}">Azure confidential computing for CAN — threat model, Key Vault, SKR, e2e training</a>
        <p class="meta">August 17, 2026 · Attestation · Secure Key Release · dual-key escrow on Azure</p>
      </li>
      <li>
        <a href="{% post_url 2026-08-16-can-kms-dek-mek-escrow %}">KMS for Confidential AI Network — DEK, MEK, and dual-key escrow</a>
        <p class="meta">August 16, 2026 · Principal-owned keys · escrow · cloud KMS</p>
      </li>
      <li>
        <a href="{% post_url 2026-08-16-can-tee-attest-decrypt-train %}">TEE training in CAN — attest, verify contract, then decrypt</a>
        <p class="meta">August 16, 2026 · Hardware attestation · decrypt-in-memory · live vs target</p>
      </li>
      <li>
        <a href="{% post_url 2026-08-16-merkle-trees-model-audit %}">Merkle trees for model audit — when the model misbehaves</a>
        <p class="meta">August 16, 2026 · Tamper-evident provenance · inclusion proofs · incident playbook</p>
      </li>
    </ol>
  </div>

  <div class="post-group" id="series-agents">
    <h3>Agent governance — G-MASE &amp; CompliancePulse</h3>
    <p class="group-lede">For security architects and platform engineers.</p>
    <ol class="post-list ordered">
      <li>
        <a href="{% post_url 2026-08-14-gmase-deep-dive %}">G-MASE deep dive: Governed Multi-Agent SecOps Environment</a>
        <p class="meta">August 14, 2026 · Swarm topology, control order, Open-GMASE Core</p>
      </li>
      <li>
        <a href="{% post_url 2026-08-14-compliancepulse-ai-deep-dive %}">CompliancePulse AI deep dive: zero-trust control plane</a>
        <p class="meta">August 14, 2026 · Open-core product path, ingest, roadmap</p>
      </li>
      <li>
        <a href="{% post_url 2026-07-31-governing-autonomous-ai-agents-cybersecurity %}">Governing autonomous AI agents in cybersecurity operations</a>
        <p class="meta">July 31, 2026 · Attack matrix &amp; multi-cloud IAM whitepaper</p>
      </li>
      <li>
        <a href="{% post_url 2026-08-14-unified-governed-agentic-secops-framework %}">Unified Governed Agentic SecOps Framework</a>
        <p class="meta">August 14, 2026 · Swarm + control plane together</p>
      </li>
      <li>
        <a href="{% post_url 2026-08-14-can-gmase-demo-slice %}">Try it: CAN ↔ Open-GMASE ↔ CompliancePulse (demo slice)</a>
        <p class="meta">August 14, 2026 · Runnable seam for stakeholders (incl. CP ingest)</p>
      </li>
    </ol>
  </div>

  <div class="post-group" id="series-identity">
    <h3>Identity — humans, cloud APIs, workloads</h3>
    <p class="group-lede">Zero-trust identity for people and for agent fleets on Kubernetes.</p>
    <ol class="post-list ordered">
      <li>
        <a href="{% post_url 2026-07-28-three-identity-planes %}">Three identity planes: humans, cloud APIs, and workloads</a>
        <p class="meta">July 28, 2026 · Conceptual model</p>
      </li>
      <li>
        <a href="{% post_url 2026-08-17-spiffe-spire-azure-wif %}">SPIFFE/SPIRE with Azure — AKS Workload Identity and Entra federation</a>
        <p class="meta">August 17, 2026 · Path N / Path F · exact SPIFFE subjects</p>
      </li>
      <li>
        <a href="{% post_url 2026-07-28-spiffe-spire-oci-wif %}">SPIFFE/SPIRE with OCI IAM workload identity</a>
        <p class="meta">July 28, 2026 · CAN scaffolding</p>
      </li>
      <li>
        <a href="{% post_url 2026-07-29-oke-agent-spiffe-identity-gap %}">The credential every AI agent fleet on an OKE node ends up sharing</a>
        <p class="meta">July 29, 2026 · Full write-up</p>
      </li>
      <li>
        <a href="{% post_url 2026-07-29-beyond-instance-principals-oke-spiffe %}">Beyond instance principals: fixing the pod identity gap in OKE</a>
        <p class="meta">July 29, 2026 · Deep dive</p>
      </li>
      <li>
        <a href="{% post_url 2026-07-29-oke-agent-spiffe-short-take %}">Short take: per-node credentials break multi-agent fleets on OKE</a>
        <p class="meta">July 29, 2026 · LinkedIn-length summary</p>
      </li>
    </ol>
  </div>

  <div class="post-group" id="series-cloud">
    <h3>Cloud security architectures</h3>
    <p class="group-lede">Deployment-shaped notes for cloud identity and edge controls.</p>
    <ol class="post-list ordered">
      <li>
        <a href="{% post_url 2026-08-17-spiffe-spire-azure-wif %}">SPIFFE/SPIRE with Azure — AKS Workload Identity and Entra federation</a>
        <p class="meta">August 17, 2026 · Design · <a href="https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/deployment/AZURE_SPIFFE_SPIRE_WIF.md">AZURE_SPIFFE_SPIRE_WIF.md</a></p>
      </li>
      <li>
        <a href="{% post_url 2026-08-17-azure-confidential-computing-deep-dive %}">Azure confidential computing for CAN — threat model, Key Vault, SKR, e2e training</a>
        <p class="meta">August 17, 2026 · Attestation · Secure Key Release · dual-key train path</p>
      </li>
      <li>
        <a href="{% post_url 2026-08-16-azure-e2e-product-tour-deck %}">Azure product tour deck — Entra to governed prediction</a>
        <p class="meta">August 16, 2026 · E2E stakeholder deck · <a href="{{ '/assets/decks/azure-e2e-product-tour.html' | relative_url }}">open slides</a></p>
      </li>
      <li>
        <a href="{% post_url 2026-07-28-azure-entra-security-architecture %}">Azure security architecture — Entra-only identity on cloud</a>
        <p class="meta">July 28, 2026 · Azure / Entra</p>
      </li>
    </ol>
  </div>

  <div class="post-group" id="series-compliance">
    <h3>Compliance &amp; documentation map</h3>
    <p class="group-lede">Where reviewers find controls evidence and how requirements map to NIST, CIS, and OWASP (incl. LLM).</p>
    <ol class="post-list ordered">
      <li>
        <a href="{% post_url 2026-07-28-security-docs-map %}">Where to find CAN security docs (map for reviewers)</a>
        <p class="meta">July 28, 2026 · Docs index</p>
      </li>
      <li>
        <a href="{% post_url 2026-07-28-nist-cis-controls-mapping %}">Requirements met — NIST, CIS &amp; OWASP (incl. LLM) mapping</a>
        <p class="meta">July 28, 2026 · GRC mapping</p>
      </li>
    </ol>
  </div>

  <div class="post-group all-posts" id="all-posts">
    <h3>All posts by date</h3>
    <p class="group-lede">Newest first.</p>
    <ul class="post-list">
      {% assign posts_by_date = site.posts | sort: 'date' | reverse %}
      {% for post in posts_by_date %}
      <li>
        <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
        <p class="meta">{{ post.date | date: "%B %-d, %Y" }}{% if post.categories.size > 0 %} · {{ post.categories | join: ", " }}{% endif %}</p>
      </li>
      {% endfor %}
    </ul>
  </div>
</section>
