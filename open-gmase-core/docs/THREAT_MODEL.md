# Threat Model (summary)

## Assets

- Privileged tool credentials (cloud IAM, SIEM, firewall APIs).
- Production data reachable via agent tools.
- Audit integrity (who proposed what, who allowed it).

## Assumptions

- The LLM is **untrusted**. System prompts are not security boundaries.
- Network isolation of eval sandboxes can fail; production agents must not depend on “you have no internet.”
- Container isolation alone is insufficient for hostile code execution tools.

## Trust boundaries

| Boundary | Enforced by |
| --- | --- |
| Workload identity | SPIFFE/SPIRE attestation → SVID |
| Tool authorization | OPA (or equivalent) before side effects |
| Argument integrity | Typed schemas (BAML templates) |
| Cloud API ceiling | AWS IAM/SCPs, GCP IAM/Org Policy, OCI IAM |
| Blast radius | Per-agent identity, HITL for high impact, circuit breakers |

## Out of scope for Community Edition

- Multi-tenant isolation and CMEK.
- Enterprise IdP (Okta/Entra) product integrations.
- Certified compliance evidence packs (those are CompliancePulse enterprise).

## Primary mitigations shipped as samples

- Default-deny Rego with explicit allows.
- Blocks on destructive SQL / dangerous shell patterns.
- Rate and anti-loop stubs (wire to Redis/telemetry in your deployment).
- Fail-closed guidance when OPA is unreachable.
