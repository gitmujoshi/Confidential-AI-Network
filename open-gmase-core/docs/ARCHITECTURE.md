# Architecture

Open-GMASE separates **probabilistic reasoning** (the LLM / agent) from **deterministic execution** (sidecars).

```text
┌─────────────┐     propose tool      ┌──────────────────┐
│  Agent /    │ ───────────────────►  │  Execution       │
│  Orchestrator│                      │  Guardrails      │
└─────────────┘                       │  ┌────────────┐  │
                                      │  │ SPIFFE SVID│  │
                                      │  │ OPA / Rego │  │
                                      │  │ BAML types │  │
                                      │  └────────────┘  │
                                      └────────┬─────────┘
                                               │ allow only
                                               ▼
                                      ┌──────────────────┐
                                      │  Cloud / SaaS /  │
                                      │  CLI tools       │
                                      └──────────────────┘
```

## Control order

1. Attest workload → issue short-lived SPIFFE SVID.
2. Validate typed tool args (BAML schema or equivalent).
3. Evaluate OPA on the full proposal (identity, target, confidence, rate/loop).
4. Only then federate a short-lived cloud credential or invoke the tool.
5. Emit local structured audit (prompt hash, decision, SPIFFE ID).

Cloud IAM (AWS/GCP/OCI) remains the **outer wall**. OPA remains the **inner gate**. See the G-MASE whitepaper for the full multi-cloud mapping.
