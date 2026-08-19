---
layout: default
title: Product tour
description: End-to-end UI tour — registration through prediction on Local Docker, plus Azure architecture references (Entra, Key Vault, confidential compute).
permalink: /product-tour/
---

<section class="hero hero-home">
  <p class="eyebrow">Product tour · UI from end-to-end tests</p>
  <h1>From registration to a live prediction</h1>
  <p class="lede">
    Multi-party path on a runnable <strong>Local Docker</strong> stack (Playwright lifecycle):
    onboard → catalog → contract → train → provenance → deploy/predict → Auditor (Merkle + contract).
    Azure narrative (Entra, Key Vault, confidential compute): slide deck and CC deep dive.
    Local path proves UX and gates; it is not a hardware TEE.
  </p>
  <p class="cta-row" style="margin-top:1.25rem">
    <a class="cta" href="{{ '/assets/decks/azure-e2e-product-tour.html' | relative_url }}">Azure product tour deck</a>
    <a class="cta cta-secondary" href="{% post_url 2026-08-17-azure-confidential-computing-deep-dive %}">Azure confidential computing</a>
    <a class="cta cta-secondary" href="{% post_url 2026-08-17-spiffe-spire-azure-wif %}">SPIFFE / Workload Identity</a>
    <a class="cta cta-secondary" href="{% post_url 2026-08-16-azure-e2e-product-tour-deck %}">Azure deck notes</a>
  </p>
</section>

<section class="home-section">
  <h2>What you will see</h2>
  <p>
    <a href="#local"><strong>Local path</strong></a>
    (runnable screenshots)
    ·
    <a href="{% post_url 2026-08-17-azure-confidential-computing-deep-dive %}">Azure confidential computing</a>
    (threat model · KMS · Secure Key Release · e2e train)
  </p>
  <ol class="tour-toc">
    <li>Party registration — Training Data Consumer, Training Data Provider, Tech Service Provider</li>
    <li>Catalog — dataset publish and model selection for training</li>
    <li>Contract — create, notify, and sign by all parties</li>
    <li>Training — start job, completion, run logs</li>
    <li>Provenance — audit report</li>
    <li>Deploy &amp; test — register artifact, deploy, run a prediction</li>
    <li>Auditor — Merkle audit tree + contract review</li>
  </ol>
  <p>
    Canonical long-form text:
    <a href="https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/guides/lifecycle-user-guide/LIFECYCLE_USER_GUIDE.md">Lifecycle user guide</a>
    ·
    <a href="https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/guides/PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md">Participant onboarding &amp; E2E lifecycle</a>
    ·
    <a href="https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/production/AZURE_SECURITY_ARCHITECTURE.md">Azure security architecture</a>.
  </p>
</section>

<section class="home-section" id="local">
  <h2>Local path</h2>
  <p>
    Tour captured from a real local run (<code>TRAINING_EXECUTION_MODE=local-docker</code>).
    TSP here is the <strong>Local</strong> clean-room provider.
    Screenshots from the Playwright lifecycle guide.
    This path proves contracts, training UX, provenance, inference, and Auditor review —
    it is <strong>not</strong> a hardware TEE. For Azure confidential VMs, Key Vault, and Secure Key Release,
    see the <a href="{% post_url 2026-08-17-azure-confidential-computing-deep-dive %}">Azure deep dive</a>.
  </p>
</section>

<section class="home-section tour-section" id="onboard">
  <h2>1. Party registration (Local)</h2>
  <p>Each party registers as an enterprise organization, then lands on a role-specific dashboard.</p>

  <figure class="shot">
    <img src="{{ '/assets/lifecycle/01-onboard-tdc-register.png' | relative_url }}" alt="Enterprise registration for Training Data Consumer" loading="lazy" />
    <figcaption>Training Data Consumer — enterprise registration</figcaption>
  </figure>
  <figure class="shot">
    <img src="{{ '/assets/lifecycle/02-onboard-tdc-dashboard.png' | relative_url }}" alt="Training Data Consumer dashboard after first login" loading="lazy" />
    <figcaption>Training Data Consumer — first-login dashboard</figcaption>
  </figure>
  <figure class="shot">
    <img src="{{ '/assets/lifecycle/03-onboard-tdp-register.png' | relative_url }}" alt="Enterprise registration for Training Data Provider" loading="lazy" />
    <figcaption>Training Data Provider — enterprise registration</figcaption>
  </figure>
  <figure class="shot">
    <img src="{{ '/assets/lifecycle/04-onboard-tdp-dashboard.png' | relative_url }}" alt="Training Data Provider dashboard" loading="lazy" />
    <figcaption>Training Data Provider — dashboard</figcaption>
  </figure>
  <figure class="shot">
    <img src="{{ '/assets/lifecycle/06-onboard-tsp-register.png' | relative_url }}" alt="Enterprise registration for Tech Service Provider" loading="lazy" />
    <figcaption>Tech Service Provider (Local clean-room host) — enterprise registration</figcaption>
  </figure>
  <figure class="shot">
    <img src="{{ '/assets/lifecycle/07-onboard-tsp-local.png' | relative_url }}" alt="Tech Service Provider Local cloud readiness" loading="lazy" />
    <figcaption>Tech Service Provider — Local compute readiness for the demo environment</figcaption>
  </figure>
</section>

<section class="home-section tour-section" id="catalog">
  <h2>2. Dataset &amp; model catalog (Local)</h2>
  <p>
    The Training Data Provider publishes a dataset to the catalog.
    The Training Data Consumer later selects that dataset and a catalog model (here: DistilBERT quality profile) when creating the contract.
  </p>
  <figure class="shot">
    <img src="{{ '/assets/lifecycle/05-tdp-dataset-published.png' | relative_url }}" alt="Training Data Provider published NLP dataset" loading="lazy" />
    <figcaption>Dataset published — NLP catalog entry (AG News reference)</figcaption>
  </figure>
  <figure class="shot">
    <img src="{{ '/assets/lifecycle/08-tdc-create-details.png' | relative_url }}" alt="Contract wizard selecting dataset and model" loading="lazy" />
    <figcaption>Contract wizard — select dataset and model from the catalog</figcaption>
  </figure>
</section>

<section class="home-section tour-section" id="contract">
  <h2>3. Contract creation &amp; signing by all parties (Local)</h2>
  <p>
    The Training Data Consumer proposes terms and chooses the Local Tech Service Provider.
    The Training Data Provider and Tech Service Provider review notifications and sign.
    Training cannot start until the contract is fully signed.
  </p>
  <figure class="shot">
    <img src="{{ '/assets/lifecycle/09-tdc-create-tsp.png' | relative_url }}" alt="Selecting Tech Service Provider in contract wizard" loading="lazy" />
    <figcaption>Select Local Tech Service Provider and environment</figcaption>
  </figure>
  <figure class="shot">
    <img src="{{ '/assets/lifecycle/10-tdc-create-submit.png' | relative_url }}" alt="Submitting the contract wizard" loading="lazy" />
    <figcaption>Submit contract — pending Training Data Provider approval</figcaption>
  </figure>
  <figure class="shot">
    <img src="{{ '/assets/lifecycle/11-tdp-notifications.png' | relative_url }}" alt="Training Data Provider notifications" loading="lazy" />
    <figcaption>Training Data Provider — signature notifications</figcaption>
  </figure>
  <figure class="shot">
    <img src="{{ '/assets/lifecycle/12-tdp-sign.png' | relative_url }}" alt="Training Data Provider signing the contract" loading="lazy" />
    <figcaption>Training Data Provider signs</figcaption>
  </figure>
  <figure class="shot">
    <img src="{{ '/assets/lifecycle/13-tsp-notifications.png' | relative_url }}" alt="Tech Service Provider notifications" loading="lazy" />
    <figcaption>Tech Service Provider — signature notifications</figcaption>
  </figure>
  <figure class="shot">
    <img src="{{ '/assets/lifecycle/14-tsp-sign.png' | relative_url }}" alt="Tech Service Provider signing the contract" loading="lazy" />
    <figcaption>Tech Service Provider signs — contract becomes SIGNED</figcaption>
  </figure>
  <figure class="shot">
    <img src="{{ '/assets/lifecycle/15-tdc-signed-contract.png' | relative_url }}" alt="Signed contract view for Training Data Consumer" loading="lazy" />
    <figcaption>Training Data Consumer — signed contract</figcaption>
  </figure>
</section>

<section class="home-section tour-section" id="train">
  <h2>4. Training, run logs &amp; provenance (Local)</h2>
  <p>
    After signatures, the Training Data Consumer starts training, waits for completion,
    then opens the provenance report and trainer logs for auditability.
  </p>
  <figure class="shot">
    <img src="{{ '/assets/lifecycle/16-tdc-training-ready.png' | relative_url }}" alt="Start training on signed contract" loading="lazy" />
    <figcaption>Start training on the signed contract</figcaption>
  </figure>
  <figure class="shot">
    <img src="{{ '/assets/lifecycle/17-tdc-training-completed.png' | relative_url }}" alt="Training job completed" loading="lazy" />
    <figcaption>Training completed</figcaption>
  </figure>
  <figure class="shot">
    <img src="{{ '/assets/lifecycle/18-tdc-provenance.png' | relative_url }}" alt="Full provenance report for the training job" loading="lazy" />
    <figcaption>Provenance report — datasets, model, privacy metrics, artifacts</figcaption>
  </figure>
  <figure class="shot">
    <img src="{{ '/assets/lifecycle/19-tdc-training-logs.png' | relative_url }}" alt="Training run logs" loading="lazy" />
    <figcaption>Training run logs</figcaption>
  </figure>
</section>

<section class="home-section tour-section" id="infer">
  <h2>5. Deploy &amp; test the model (Local)</h2>
  <p>
    This tour trains a <strong>quality DistilBERT</strong> text classifier on
    <strong>AG News</strong> (World / Sports / Business / Sci/Tech) under a signed
    Ricardian contract, then registers the artifact, deploys it for local inference,
    and runs a headline prediction. The default example
    (<code>"Wall Street rallies…"</code>) predicts <strong>Business</strong>.
    Register → deploy → open the Inference app → run prediction against
    <code>infer.py</code> in the local trainer image.
  </p>
  <figure class="shot">
    <img src="{{ '/assets/lifecycle/20-tdc-register-model.png' | relative_url }}" alt="Register trained model for inference" loading="lazy" />
    <figcaption>Register trained DistilBERT artifact for inference</figcaption>
  </figure>
  <figure class="shot">
    <img src="{{ '/assets/lifecycle/21-tdc-deploy-inference.png' | relative_url }}" alt="Deploy model for inference" loading="lazy" />
    <figcaption>Deploy for inference</figcaption>
  </figure>
  <figure class="shot">
    <img src="{{ '/assets/lifecycle/22-tdc-inference-deployed.png' | relative_url }}" alt="Inference deployed confirmation" loading="lazy" />
    <figcaption>Deployed — open Inference app</figcaption>
  </figure>
  <figure class="shot">
    <img src="{{ '/assets/lifecycle/23-tdc-inference-app.png' | relative_url }}" alt="Inference app with example request" loading="lazy" />
    <figcaption>Inference app — AG News headline request ready</figcaption>
  </figure>
  <figure class="shot">
    <img src="{{ '/assets/lifecycle/24-tdc-inference-predict.png' | relative_url }}" alt="Inference prediction result with Open-GMASE gate" loading="lazy" />
    <figcaption>Prediction <strong>Business</strong> (quality DistilBERT) — includes Open-GMASE policy gate when OPA is running</figcaption>
  </figure>
</section>

<section class="home-section tour-section" id="auditor">
  <h2>6. Auditor — Merkle tree &amp; contract review (Local)</h2>
  <p>
    After training and inference, a read-only <strong>Auditor</strong> opens the workspace,
    inspects the <strong>Merkle audit tree</strong> (root + leaf inclusion proofs) for the
    contract that produced the model, and reviews the Ricardian contract terms the training
    was based on. No sign / train / deploy rights.
  </p>
  <figure class="shot">
    <img src="{{ '/assets/lifecycle/25-auditor-workspace.png' | relative_url }}" alt="Auditor workspace listing contracts" loading="lazy" />
    <figcaption>Auditor workspace — pick a contract for audit tree or contract review</figcaption>
  </figure>
  <figure class="shot">
    <img src="{{ '/assets/lifecycle/26-auditor-audit-tree.png' | relative_url }}" alt="Merkle audit tree with root hash and leaves" loading="lazy" />
    <figcaption>Merkle audit tree — root hash, leaves (contract / jobs / SCITT / models), Verify</figcaption>
  </figure>
  <figure class="shot">
    <img src="{{ '/assets/lifecycle/27-auditor-contract-review.png' | relative_url }}" alt="Auditor reviewing the Ricardian contract" loading="lazy" />
    <figcaption>Contract review — the agreement the problem model’s training was based on</figcaption>
  </figure>
</section>

<section class="home-section tour-section" id="gmase">
  <h2>7. Open-GMASE gate + CompliancePulse ingest (research demo)</h2>
  <p>
    The gate screenshots below use a faster <strong>tabular logistic regression</strong>
    model (Iris-style features → label <strong>setosa</strong>) so the seam is easy to
    reproduce. A <strong>vision</strong> path (TinyCNN + CIFAR-10 sample image) is available
    in the Inference app / API E2E. Before predict runs, CAN asks Open-GMASE OPA
    (<code>open_gmase/can_contracts</code>). The Inference app shows ALLOW/DENY with
    package and audit id. The same <em>governance decision</em> (not pixels or weights) is
    <strong>forwarded by default</strong> to CompliancePulse
    (<code>POST /api/v1/audit/ingest</code> on <code>localhost:3001</code>).
    Details:
    <a href="{% post_url 2026-08-14-can-gmase-demo-slice %}">demo slice guide</a>.
  </p>
  <figure class="shot">
    <img src="{{ '/assets/gmase/01-tdc-deploy-inference.png' | relative_url }}" alt="Deploy for inference under Open-GMASE gate" loading="lazy" />
    <figcaption>Deploy for inference — gated by OPA; decision forwarded to CompliancePulse (not the model artifact)</figcaption>
  </figure>
  <figure class="shot">
    <img src="{{ '/assets/gmase/03-tdc-inference-predict-gmase.png' | relative_url }}" alt="Open-GMASE ALLOW on prediction" loading="lazy" />
    <figcaption>Prediction <strong>setosa</strong> with Open-GMASE ALLOW — same decision event in CP audit trail</figcaption>
  </figure>
</section>

<section class="home-section">
  <h2>How these screenshots are produced</h2>
  <p>Local path (full stack — backend, frontend, Keycloak, trainer):</p>
  <pre class="arch-diagram" style="white-space: pre-wrap;">cd frontend
BACKEND_URL=http://127.0.0.1:5001 npm run test:e2e:lifecycle-guide</pre>
  <p>Auditor screenshots only (reuses an existing contract):</p>
  <pre class="arch-diagram" style="white-space: pre-wrap;">cd frontend
BACKEND_URL=http://127.0.0.1:5001 npm run test:e2e:auditor-guide</pre>
  <p>Open-GMASE gate screenshots:</p>
  <pre class="arch-diagram" style="white-space: pre-wrap;">cd frontend
E2E_WAIT_FOR_LOCAL_TRAINING=true BACKEND_URL=http://127.0.0.1:5001 npm run test:e2e:inference</pre>
  <p>
    Images live in
    <code>docs/guides/lifecycle-user-guide/screenshots/</code>
    and
    <code>docs/guides/gmase-integration/screenshots/</code>,
    and are copied into this site at Pages build time.
  </p>
</section>
