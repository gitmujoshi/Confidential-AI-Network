# CAN ↔ G-MASE / CompliancePulse integration (overview)

**Status:** Research architecture with a **live demo slice** (training + inference gates + optional ingest). Full multi-tenant SaaS / SPIRE / swarm UI are still roadmap.

## Demo slice (live today)

See **[CAN_GMASE_DEMO_SLICE.md](../guides/CAN_GMASE_DEMO_SLICE.md)**.

```text
TDC start_training / deploy_inference / run_inference
  → Open-GMASE OPA (open_gmase.can_contracts)
  → CAN AuditLogs (GMASE_TOOL_DECISION)
  → optional CompliancePulse POST /api/v1/audit/ingest
```

Also: `POST /api/debug/gmase-tool-check` for ad-hoc tool proposals (`open_gmase.tools`).

Code:

- `backend/services/gmaseOpaService.js`
- `backend/services/gmaseSideEffectGate.js`
- `backend/services/tdcTrainingExecutionService.js` (training gate)
- `backend/services/localInferenceService.js` (inference gate)
- `compliancepulse-ai/backend/src/api/routes.ts` (`/audit/ingest`)

## Target integration (roadmap)

1. Humans: Keycloak (unchanged).  
2. Workloads: SPIFFE SVIDs on CCRP/training agents.  
3. ~~Before side effects: `authorizeTool` fail-closed~~ — **done** for train/deploy/predict.  
4. OPA input includes `contract_id`, classification, party roles from CAN (partial today).  
5. Decisions → AuditLogs + optional SCITT claim.  
6. CompliancePulse: multi-tenant control plane / packs (ingest stub exists; SaaS UI still roadmap).

## Related

- [CISO overview](https://gitmujoshi.github.io/Confidential-AI-Network/executive/2026/08/14/governed-ai-enterprise-ciso-overview/)  
- [Demo slice blog](https://gitmujoshi.github.io/Confidential-AI-Network/guides/2026/08/14/can-gmase-demo-slice/)  
- [Open-GMASE Core](../../open-gmase-core/)  
- [VC deck](../marketing/VC_PITCH_DECK_UNIFIED.md)
