---
layout: default
title: Home
description: Confidential AI Network — contract-governed training on a Local machine or on the Azure or GCP cluster a clean-room provider already runs.
permalink: /
---

<section class="hero hero-home">
  <p class="eyebrow">Confidential AI Network</p>
  <h1>Train on confidential data without moving it into a shared lake</h1>
  <p class="lede">
    Data providers, model builders, and clean-room operators agree a Ricardian contract,
    then train only where that contract allows.
    A <strong>Local</strong> provider trains on this machine.
    An <strong>Azure</strong> or <strong>GCP</strong> provider submits the job to the cluster they already run.
  </p>
  <p class="cta-row">
    <a class="cta" href="{{ site.app_url }}">Open the app</a>
    <a class="cta cta-secondary" href="{{ '/product-tour/' | relative_url }}">Product tour</a>
    <a class="cta cta-secondary" href="{{ '/notes/' | relative_url }}">Research notes</a>
  </p>
</section>

<section class="home-section">
  <h2>Use the cluster you already run</h2>
  <p>
    The contract names the cluster. The kubeconfig path is a file on the provider’s host,
    saved from the TSP dashboard <strong>Cloud Provider</strong> card. It is not stored on the contract.
    A missing path fails the job. No subscription, project, or cluster is created for the job.
  </p>
  <div class="arch-grid">
    <div>
      <h3>Local</h3>
      <p>Training stays on this host. The contract wizard hides the cluster sections.</p>
    </div>
    <div>
      <h3>Azure</h3>
      <p>Existing AKS cluster: subscription, resource group, cluster name, namespace, region, storage account, and Key Vault URI.</p>
    </div>
    <div>
      <h3>Google Cloud</h3>
      <p>Existing GKE cluster: project, location, cluster name, namespace, and GCS bucket.</p>
    </div>
    <div>
      <h3>Oracle Cloud</h3>
      <p>Existing OKE cluster. AWS does not start a training job.</p>
    </div>
  </div>
</section>

<section class="home-section">
  <h2>How a job starts</h2>
  <ul class="vision-list">
    <li>
      <strong>The data provider publishes a catalog.</strong>
      The dataset stays with its owner. The contract records price, privacy terms, and who may train.
    </li>
    <li>
      <strong>The consumer names the clean room.</strong>
      Choosing an Azure or GCP provider opens the cluster fields. A blank field is filled from that provider’s saved account.
    </li>
    <li>
      <strong>Both parties sign.</strong>
      Training starts only after the contract is signed and the policy engine can be reached.
    </li>
    <li>
      <strong>The job lands on that cluster.</strong>
      Azure and GCP show <code>azure-ccr</code> or <code>gcp-ccr</code>. Attestation on this submit path is marked simulated until a hardware quote is attached.
    </li>
  </ul>
  <p>
    <a href="{{ '/product-tour/#ccr' | relative_url }}">Clean-room screenshots</a>
    ·
    <a href="{% post_url 2026-08-17-azure-confidential-computing-deep-dive %}">Azure confidential computing</a>
  </p>
</section>

<section class="home-section">
  <h2>Open the product</h2>
  <p>
    The app landing page is where you register, sign in, and run a contract.
    These notes stay here for the architecture and the security write-ups.
  </p>
  <p class="cta-row">
    <a class="cta" href="{{ site.app_url }}">Open the app</a>
    <a class="cta cta-secondary" href="{{ '/notes/' | relative_url }}">Read the notes</a>
  </p>
</section>
