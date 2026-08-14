# Contributing to Open-GMASE Core

Thanks for helping define **agent execution security** as an open standard.

## High-value contributions

- OPA/Rego policy packs for common tools (`kubectl`, AWS/GCP/OCI IAM, Cloudflare, Sentinel, GitHub Actions).
- BAML (or equivalent) schemas for tool argument validation.
- MCP agent starters that call the guardrail path before side effects.
- Threat-model notes and diagram improvements.
- Hardening of the local `docker compose` SPIRE + OPA stack.

## Guidelines

1. Keep Community Edition free of proprietary IdP or multi-tenant control-plane code.
2. Prefer Apache 2.0–compatible dependencies.
3. Document each policy pack with an example `input` JSON and expected allow/deny.
4. Do not commit secrets, live credentials, or customer telemetry.

## Policy pack layout

```text
execution-guardrails/opa-policies/
  base-tool-guardrails.rego          # already present
  kubectl-destructive.rego           # example contribution
  aws-iam-escalation.rego
```

Include a short header comment: package name, tools covered, and author/date.
