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
  </p>
  <p class="cta-row">
    <a class="cta" href="{{ '/product-tour/' | relative_url }}">See the end-to-end product tour</a>
    <a class="cta cta-secondary" href="https://github.com/gitmujoshi/Confidential-AI-Network">Explore the codebase</a>
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
    from party registration through training, provenance, and a live prediction.
  </p>
</section>

<section class="home-section notes-section" id="notes">
  <h2>Security &amp; identity notes</h2>
  <p class="section-intro">
    Design posts for operators and reviewers. Long-form specs remain in the repository
    <code>docs/</code> tree.
  </p>
  <ul class="post-list">
    {% for post in site.posts %}
    <li>
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
      <p class="meta">{{ post.date | date: "%B %-d, %Y" }}{% if post.categories.size > 0 %} · {{ post.categories | join: ", " }}{% endif %}</p>
    </li>
    {% endfor %}
  </ul>
</section>
