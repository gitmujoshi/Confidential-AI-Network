---
layout: default
title: Product tour
description: End-to-end UI tour — party registration, catalog, contract signing, training, logs, provenance, deploy, and inference.
permalink: /product-tour/
---

<section class="hero hero-home">
  <p class="eyebrow">Product tour · UI from end-to-end tests</p>
  <h1>From registration to a live prediction</h1>
  <p class="lede">
    Screenshots below are captured from a real local run of the Confidential AI Network stack
    (Playwright lifecycle guide). They show the full multi-party path: onboard parties, publish data,
    agree and sign a contract, train, inspect logs and provenance, then deploy and test the model.
  </p>
</section>

<section class="home-section">
  <h2>What you will see</h2>
  <ol class="tour-toc">
    <li><a href="#onboard">Party registration</a> — Training Data Consumer, Training Data Provider, Tech Service Provider</li>
    <li><a href="#catalog">Catalog</a> — dataset publish and model selection for training</li>
    <li><a href="#contract">Contract</a> — create, notify, and sign by all parties</li>
    <li><a href="#train">Training</a> — start job, completion, run logs, provenance report</li>
    <li><a href="#infer">Deploy &amp; test</a> — register artifact, deploy, run a prediction</li>
  </ol>
  <p>
    Canonical long-form text:
    <a href="https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/guides/lifecycle-user-guide/LIFECYCLE_USER_GUIDE.md">Lifecycle user guide</a>
    ·
    <a href="https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/guides/PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md">Participant onboarding &amp; E2E lifecycle</a>.
  </p>
</section>

<section class="home-section tour-section" id="onboard">
  <h2>1. Party registration</h2>
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
    <figcaption>Tech Service Provider (clean-room host) — enterprise registration</figcaption>
  </figure>
  <figure class="shot">
    <img src="{{ '/assets/lifecycle/07-onboard-tsp-local.png' | relative_url }}" alt="Tech Service Provider Local cloud readiness" loading="lazy" />
    <figcaption>Tech Service Provider — Local compute readiness for the demo environment</figcaption>
  </figure>
</section>

<section class="home-section tour-section" id="catalog">
  <h2>2. Dataset &amp; model catalog</h2>
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
  <h2>3. Contract creation &amp; signing by all parties</h2>
  <p>
    The Training Data Consumer proposes terms and chooses the Tech Service Provider.
    The Training Data Provider and Tech Service Provider review notifications and sign.
    Training cannot start until the contract is fully signed.
  </p>
  <figure class="shot">
    <img src="{{ '/assets/lifecycle/09-tdc-create-tsp.png' | relative_url }}" alt="Selecting Tech Service Provider in contract wizard" loading="lazy" />
    <figcaption>Select Tech Service Provider and environment</figcaption>
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
  <h2>4. Training, run logs &amp; provenance</h2>
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
  <h2>5. Deploy &amp; test the model</h2>
  <p>
    Register the trained artifact into the model catalog, deploy it for inference,
    open the Inference app, and run a prediction against the local inferencer.
  </p>
  <figure class="shot">
    <img src="{{ '/assets/lifecycle/20-tdc-register-model.png' | relative_url }}" alt="Register trained model for inference" loading="lazy" />
    <figcaption>Register trained model for inference</figcaption>
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
    <figcaption>Inference app — request ready</figcaption>
  </figure>
  <figure class="shot">
    <img src="{{ '/assets/lifecycle/24-tdc-inference-predict.png' | relative_url }}" alt="Inference prediction result" loading="lazy" />
    <figcaption>Prediction result (quality DistilBERT demo)</figcaption>
  </figure>
</section>

<section class="home-section">
  <h2>How these screenshots are produced</h2>
  <p>
    Regenerated from the live stack with:
  </p>
  <pre class="arch-diagram" style="white-space: pre-wrap;">cd frontend
BACKEND_URL=http://127.0.0.1:5001 npm run test:e2e:lifecycle-guide</pre>
  <p>
    Images live in
    <code>docs/guides/lifecycle-user-guide/screenshots/</code>
    and are copied into this site at Pages build time.
  </p>
</section>
