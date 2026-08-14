# CAN ↔ G-MASE / CompliancePulse integration (overview)

**Status:** Research architecture. A **demo slice** exists; full unified production runtime does not.

## Demo slice (live today)

See **[CAN_GMASE_DEMO_SLICE.md](../guides/CAN_GMASE_DEMO_SLICE.md)**.

```text
POST /api/debug/gmase-tool-check
  → Open-GMASE OPA (open_gmase.tools | open_gmase.can_contracts)
  → CAN AuditLogs (eventType = GMASE_TOOL_DECISION)
```

Code: `backend/services/gmaseOpaService.js`, `backend/routes/debug.js`.

## Target integration (roadmap)

1. Humans: Keycloak (unchanged).  
2. Workloads: SPIFFE SVIDs on CCRP/training agents.  
3. Before side effects (training start, export, cloud APIs): `authorizeTool` fail-closed.  
4. OPA input includes `contract_id`, classification, party roles from CAN.  
5. Decisions → AuditLogs + optional SCITT claim.  
6. CompliancePulse: multi-tenant control plane / packs on the same guardrails.

## Related

- [CISO overview](https://gitmujoshi.github.io/Confidential-AI-Network/executive/2026/08/14/governed-ai-enterprise-ciso-overview/)  
- [Open-GMASE Core](../../open-gmase-core/)  
- [VC deck](../marketing/VC_PITCH_DECK_UNIFIED.md)
