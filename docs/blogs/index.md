---
layout: default
title: Home
description: Confidential AI Network — contract-governed, confidential training so organizations can collaborate on AI without giving up data control.
permalink: /
---

<section class="hero hero-home">
  <p class="eyebrow">Confidential AI Network</p>
  <h1>AI that trains on shared data without shared trust failures</h1>
  <p class="lede">
    The models that matter need data no single company owns.
    Today that usually means exports, NDAs, and hope.
    We build the rails where providers, consumers, and clean-room operators
    agree in writing, train in isolation, and leave a trail regulators can verify.
    This is an active research project; the platform and docs will keep evolving.
  </p>
  <p class="cta-row">
    <a class="cta" href="{% post_url 2026-08-14-governed-ai-enterprise-ciso-overview %}">Executive overview (CISO)</a>
    <a class="cta cta-secondary" href="{{ '/product-tour/' | relative_url }}">Product tour</a>
    <a class="cta cta-secondary" href="{{ '/#notes' | relative_url }}">All notes</a>
  </p>
</section>

<section class="home-section">
  <h2>Why this exists</h2>
  <p>
    Healthcare, finance, public sector, and industrial firms sit on high-value data they cannot freely ship.
    Model builders need that data to improve accuracy and fairness — but a central data lake collapses sovereignty,
    liability, and competitive advantage. Handshake deals do not survive audits.
  </p>
  <p>
    <strong>CAN</strong> treats collaboration as a protocol: discover metadata, negotiate a Ricardian contract,
    sign, train only inside policy-bound environments, and record provenance on a confidential ledger.
    Inspired by India’s iSPIRT <a href="https://depa.world">DEPA</a>
    (Data Empowerment and Protection Architecture) — consent-based sharing for the AI era —
    and built to run on the clouds enterprises already trust.
  </p>
</section>

<section class="home-section">
  <h2>What we are building toward</h2>
  <ul class="vision-list">
    <li>
      <strong>Data stays with its owner.</strong>
      TDPs publish catalogs and policies, not bulk dumps. Access is use-bound and time-bound.
    </li>
    <li>
      <strong>Training happens where policy allows.</strong>
      TSP / CCRP environments (TEE, private cloud, or attested Kubernetes) keep data and model IP isolated.
    </li>
    <li>
      <strong>Every step is accountable.</strong>
      Signatures, job outcomes, and claims land on SCITT CCF so GRC teams get evidence, not screenshots.
    </li>
    <li>
      <strong>Identity is multi-cloud and Zero Trust.</strong>
      Humans use cloud identity providers (Entra, OCI IAM, Identity Platform, Cognito). Workloads use SPIFFE/SPIRE and
      cloud workload identity — not long-lived keys.
    </li>
  </ul>
</section>

<section class="home-section">
  <h2>Architecture at a glance</h2>
  <p>
    One product surface, three trust planes: people, cloud APIs, and peer workloads.
    Contracts bind the economic and legal agreement; confidential compute and cryptography enforce the technical one.
  </p>
  <p>
    Shared control objectives across Azure, Amazon Web Services, Google Cloud, and Oracle Cloud Infrastructure:
    <a href="https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/production/MULTI_CLOUD_SECURITY_ARCHITECTURE_PATTERNS.md">Multi-cloud security architecture patterns</a>
    (full write-up in the repository; this site stays short).
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
      <p>Portal, APIs, contract state machine, catalog, and AppAdmin ops. Humans authenticate via the deployment’s cloud identity provider.</p>
    </div>
    <div>
      <h3>Data &amp; crypto plane</h3>
      <p>Dataset encryption, key escrow patterns, optional differential privacy, and DEPA-aligned entity IDs for parties and assets.</p>
    </div>
    <div>
      <h3>Execution plane</h3>
      <p>Policy-bound training jobs in confidential or segmented environments; SPIFFE/SPIRE for east-west trust where enabled.</p>
    </div>
    <div>
      <h3>Evidence plane</h3>
      <p>SCITT CCF for tamper-evident claims; SIEM export for SOC workflows on Azure, OCI, and beyond.</p>
    </div>
  </div>
</section>

<section class="home-section">
  <h2>Who it is for</h2>
  <p>
    Organizations that must collaborate on AI under regulation — and the infrastructure partners who host
    that collaboration. If your bottleneck is “we cannot move the data,” this stack is the alternative path:
    contract first, compute second, proof always.
  </p>
  <p>
    Prefer screenshots?
    <a href="{{ '/product-tour/' | relative_url }}">Walk the full UI path</a>
    from party registration through training, provenance, and a live prediction —
    on <a href="{{ '/product-tour/#local' | relative_url }}">Local</a> and
    <a href="{{ '/product-tour/#oci' | relative_url }}">OCI</a>.
  </p>
</section>

<section class="home-section notes-section" id="notes">
  <h2>Notes &amp; whitepapers</h2>
  <p class="section-intro">
    Start with the executive overview. Everything else is optional depth for architects and reviewers.
    This site documents an <strong>active research project</strong>—designs and implementations will keep evolving.
    Long-form specs remain in the repository <code>docs/</code> tree.
  </p>

  <div class="post-group start-here" id="series-start">
    <p class="series-label">Start here</p>
    <h3>Executive overview</h3>
    <p class="group-lede">Written for CISOs, risk leaders, and non-technical stakeholders. Six minutes; no prerequisite reading.</p>
    <ol class="post-list ordered">
      <li>
        <a href="{% post_url 2026-08-14-governed-ai-enterprise-ciso-overview %}">Governed AI for the enterprise — a CISO’s overview</a>
        <p class="meta">August 14, 2026 · Combined CAN + Open-GMASE + CompliancePulse value story</p>
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
    <a href="#series-agents">Agent governance</a>
    <a href="#series-identity">Identity</a>
    <a href="#series-cloud">Cloud security</a>
    <a href="#series-compliance">Compliance</a>
    <a href="#all-posts">All posts</a>
  </nav>

  <p class="depth-intro">Deeper reading <span class="muted-inline">(skip unless you need the detail)</span></p>

  <div class="post-group" id="series-platform">
    <h3>Platform — Confidential AI Network</h3>
    <p class="group-lede">Product and architecture detail for CAN.</p>
    <ol class="post-list ordered">
      <li>
        <a href="{% post_url 2026-07-29-building-confidential-ai-network %}">Building Confidential AI Network — governed multi-party training without a data lake</a>
        <p class="meta">July 29, 2026 · Technical product walkthrough</p>
      </li>
    </ol>
  </div>

  <div class="post-group" id="series-agents">
    <h3>Agent governance — G-MASE &amp; CompliancePulse</h3>
    <p class="group-lede">For security architects and platform engineers.</p>
    <ol class="post-list ordered">
      <li>
        <a href="{% post_url 2026-07-31-governing-autonomous-ai-agents-cybersecurity %}">Governing autonomous AI agents in cybersecurity operations</a>
        <p class="meta">July 31, 2026 · G-MASE reference architecture</p>
      </li>
      <li>
        <a href="{% post_url 2026-08-14-unified-governed-agentic-secops-framework %}">Unified Governed Agentic SecOps Framework</a>
        <p class="meta">August 14, 2026 · Swarm + control plane whitepaper</p>
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
        <a href="{% post_url 2026-07-28-azure-entra-security-architecture %}">Azure security architecture — Entra-only identity on cloud</a>
        <p class="meta">July 28, 2026 · Azure / Entra</p>
      </li>
    </ol>
  </div>

  <div class="post-group" id="series-compliance">
    <h3>Compliance &amp; documentation map</h3>
    <p class="group-lede">Where reviewers find controls evidence and how requirements map to NIST and CIS.</p>
    <ol class="post-list ordered">
      <li>
        <a href="{% post_url 2026-07-28-security-docs-map %}">Where to find CAN security docs (map for reviewers)</a>
        <p class="meta">July 28, 2026 · Docs index</p>
      </li>
      <li>
        <a href="{% post_url 2026-07-28-nist-cis-controls-mapping %}">Requirements met — NIST CSF, SP 800-53, and CIS Controls mapping</a>
        <p class="meta">July 28, 2026 · GRC mapping</p>
      </li>
    </ol>
  </div>

  <div class="post-group all-posts" id="all-posts">
    <h3>All posts by date</h3>
    <p class="group-lede">Newest first. Prefer the executive overview unless you need a specialist topic.</p>
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
