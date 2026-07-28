---
layout: default
title: Security blog
permalink: /
---

<section class="hero">
  <h1>Security &amp; identity notes</h1>
  <p>
    Short posts on Zero Trust, multi-cloud IdPs, SPIFFE/SPIRE, and confidential AI.
    Long-form specs stay in the repository <code>docs/</code> tree.
  </p>
</section>

<ul class="post-list">
  {% for post in site.posts %}
  <li>
    <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
    <p class="meta">{{ post.date | date: "%B %-d, %Y" }}{% if post.categories.size > 0 %} · {{ post.categories | join: ", " }}{% endif %}</p>
  </li>
  {% endfor %}
</ul>
