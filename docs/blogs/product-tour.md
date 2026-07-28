---
layout: default
title: Product tour
description: End-to-end UI tour — from registration to a live prediction on Local Docker and on OCI (Vault KMS + confidential compute).
permalink: /product-tour/
---

<section class="hero hero-home">
  <p class="eyebrow">Product tour · UI from end-to-end tests</p>
  <h1>From registration to a live prediction</h1>
  <p class="lede">
    The same multi-party path on two execution environments:
    <strong>Local Docker</strong> (Playwright lifecycle guide against a live stack) and
    <strong>OCI</strong> (Identity Domains, OCI Vault KMS, confidential compute on OKE).
    Onboard parties, publish data, agree and sign a contract, train, inspect logs and provenance,
    then deploy and test the model.
  </p>
</section>

<section class="home-section">
  <h2>What you will see</h2>
  <p>
    <a href="#local">Local path</a>
    ·
    <a href="#oci">OCI path</a>
  </p>
  <ol class="tour-toc">
    <li>Party registration — Training Data Consumer, Training Data Provider, Tech Service Provider</li>
    <li>Catalog — dataset publish and model selection for training</li>
    <li>Contract — create, notify, and sign by all parties</li>
    <li>Training — start job, completion, run logs</li>
    <li>Provenance — audit report</li>
    <li>Deploy &amp; test — register artifact, deploy, run a prediction</li>
  </ol>
  <p>
    Canonical long-form text:
    <a href="https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/guides/lifecycle-user-guide/LIFECYCLE_USER_GUIDE.md">Lifecycle user guide</a>
    ·
    <a href="https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/guides/PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md">Participant onboarding &amp; E2E lifecycle</a>
    ·
    <a href="https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/deployment/OCI_DESIGN_COMPLETE.md">OCI design complete</a>.
  </p>
</section>

<section class="home-section" id="local">
  <h2>Local path</h2>
  <p>
    Captured from a real local run (<code>TRAINING_EXECUTION_MODE=local-docker</code>).
    Screenshots from Playwright lifecycle guide.
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

<section class="home-section" id="oci">
  <h2>OCI path</h2>
  <p>
    Same end-to-end stages with an <strong>OCI infrastructure TSP</strong>
    (confidential-vm on OKE, OCI Vault KMS — not Local Docker): Identity Domains SSO,
    Object Storage ciphertext, and SPIFFE-gated key release.
    Live UI walkthrough: <code>/demo/oci-scaffolds</code>
    (design complete — no live tenancy required for the demo screens).
    Static OCI TSP for the app: <code>tsp.oci.e2e@test.com</code>.
  </p>
</section>

<section class="home-section tour-section" id="oci-onboard">
  <h2>1. Party registration (OCI)</h2>
  <p>
    TDC, TDP, and TSP register with OCI IAM Identity Domains. Signing keys and secrets use OCI Vault;
    the TSP is an <strong>OCI infrastructure provider</strong> offering confidential compute on OKE (not Local Docker).
  </p>
  <figure class="shot">
    <img src="{{ '/assets/oci/01-registration.png' | relative_url }}" alt="OCI path — party registration for TDC, TDP, and TSP" loading="lazy" />
    <figcaption>Enterprise registration — three parties with DEPA IDs; TSP offers OCI confidential compute</figcaption>
  </figure>
</section>

<section class="home-section tour-section" id="oci-catalog">
  <h2>2. Dataset &amp; model catalog (OCI)</h2>
  <p>TDP publishes a dataset to Object Storage; TDC selects dataset and catalog model for the contract.</p>
  <figure class="shot">
    <img src="{{ '/assets/oci/02-catalog.png' | relative_url }}" alt="OCI path — dataset and model catalog" loading="lazy" />
    <figcaption>Catalog — Object Storage dataset + DistilBERT model selection</figcaption>
  </figure>
</section>

<section class="home-section tour-section" id="oci-contract">
  <h2>3. Contract creation &amp; signing (OCI)</h2>
  <p>
    Contract binds <code>tspCloudProvider=OCI</code>, confidential-vm compute, Object Storage buckets,
    and OCI Vault KMS. All parties sign before training.
  </p>
  <figure class="shot">
    <img src="{{ '/assets/oci/03-contract.png' | relative_url }}" alt="OCI path — signed contract with Vault KMS and confidential compute" loading="lazy" />
    <figcaption>Signed contract — environmentSpecs and kmsConfigs with Vault OCID and SPIFFE</figcaption>
  </figure>
</section>

<section class="home-section tour-section" id="oci-train">
  <h2>4. Training &amp; run logs (OCI)</h2>
  <p>
    TDC starts an <code>oci-oke-job</code>. Runner logs echo the same Vault OCID, SPIFFE ID, and buckets
    as the contract.
  </p>
  <figure class="shot">
    <img src="{{ '/assets/oci/04-training.png' | relative_url }}" alt="OCI path — training job and runner logs" loading="lazy" />
    <figcaption>Training completed — environment summary and OKE runner log</figcaption>
  </figure>
</section>

<section class="home-section tour-section" id="oci-provenance">
  <h2>5. Provenance (OCI)</h2>
  <p>
    Audit bundle includes <code>contract.environmentSpecs</code>, <code>kmsConfigs</code>, and
    <code>trainingJobs.environmentSummary</code> with OCI Vault and confidential compute detail.
  </p>
  <figure class="shot">
    <img src="{{ '/assets/oci/05-provenance.png' | relative_url }}" alt="OCI path — provenance audit report" loading="lazy" />
    <figcaption>Provenance audit report</figcaption>
  </figure>
</section>

<section class="home-section tour-section" id="oci-infer">
  <h2>6. Deploy &amp; test the model (OCI)</h2>
  <p>Register the artifact, deploy inference, and run a prediction — same end state as Local.</p>
  <figure class="shot">
    <img src="{{ '/assets/oci/06-deploy-predict.png' | relative_url }}" alt="OCI path — deployed model and prediction result" loading="lazy" />
    <figcaption>Deployed inference — prediction result (Business / AG News demo)</figcaption>
  </figure>
</section>

<section class="home-section">
  <h2>How these screenshots are produced</h2>
  <p>Local path (full stack — backend, frontend, Keycloak, trainer):</p>
  <pre class="arch-diagram" style="white-space: pre-wrap;">cd frontend
BACKEND_URL=http://127.0.0.1:5001 npm run test:e2e:lifecycle-guide</pre>
  <p>OCI path (frontend demo at <code>/demo/oci-scaffolds</code>):</p>
  <pre class="arch-diagram" style="white-space: pre-wrap;">cd frontend
npm run test:e2e:oci-demo</pre>
  <p>
    Images live in
    <code>docs/guides/lifecycle-user-guide/screenshots/</code>
    and
    <code>docs/guides/oci-scaffold-demo/screenshots/</code>,
    and are copied into this site at Pages build time.
  </p>
</section>
