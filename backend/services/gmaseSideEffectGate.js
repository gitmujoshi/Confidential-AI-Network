/**
 * Shared Open-GMASE side-effect gate for CAN (training + inference).
 * Fail-closed when enabled; writes GMASE_TOOL_DECISION to AuditLogs;
 * optionally forwards to CompliancePulse ingest when COMPLIANCEPULSE_INGEST_URL is set.
 */
const axios = require('axios');
const { authorizeTool } = require('./gmaseOpaService');
const AuditService = require('./auditService');

const auditService = new AuditService();

function envFlagEnabled(name, defaultOn = true) {
  const v = process.env[name];
  if (v === 'false' || v === '0') return false;
  if (v === 'true' || v === '1') return true;
  return defaultOn;
}

function isInferenceGateEnabled() {
  return envFlagEnabled('GMASE_INFERENCE_GATE', true);
}

function isTrainingGateEnabled() {
  return envFlagEnabled('GMASE_TRAINING_GATE', true);
}

/**
 * @param {object} opts
 * @param {string} opts.toolName
 * @param {string} [opts.userId]
 * @param {object} [opts.contract]
 * @param {object} [opts.metadata] — merged into OPA input.metadata
 * @param {object} [opts.parameters]
 * @param {string} [opts.slice]
 * @param {boolean} [opts.enabled]
 */
async function authorizeCanSideEffect({
  toolName,
  userId,
  contract,
  metadata = {},
  parameters = {},
  slice = 'can-side-effect-gate',
  enabled = true,
}) {
  if (!enabled) {
    return { skipped: true, allow: true, reason: 'Open-GMASE gate disabled' };
  }

  const decision = await authorizeTool({
    tool_name: toolName,
    policy_package: 'open_gmase/can_contracts',
    environment: process.env.NODE_ENV || 'development',
    parameters,
    metadata: {
      contract_id: contract?.contractId || metadata.contract_id || null,
      contract_status: contract?.status || metadata.contract_status || null,
      dataset_classification:
        metadata.dataset_classification ||
        contract?.metadata?.datasetClassification ||
        null,
      training_region:
        metadata.training_region ||
        contract?.environmentSpecs?.region ||
        contract?.tspCloudProvider ||
        null,
      ...metadata,
      slice,
    },
  });

  let auditId = null;
  const auditPayload = {
    tool_name: toolName,
    allow: decision.allow,
    reason: decision.reason,
    deny: decision.deny,
    warn: decision.warn,
    opaUrl: decision.opaUrl,
    package: decision.package,
    input: decision.input,
    contract_id: contract?.contractId || metadata.contract_id || null,
    model_id: metadata.model_id || null,
    slice,
  };

  try {
    const auditLog = await auditService.logEvent(
      'GMASE_TOOL_DECISION',
      auditPayload,
      userId || null
    );
    auditId = auditLog?.id || null;
  } catch (err) {
    console.warn('GMASE side-effect audit log failed:', err.message);
  }

  // Best-effort forward to CompliancePulse research ingest (non-blocking).
  const ingestUrl = (process.env.COMPLIANCEPULSE_INGEST_URL || '').replace(/\/$/, '');
  if (ingestUrl) {
    setImmediate(() => {
      axios
        .post(
          `${ingestUrl}/api/v1/audit/ingest`,
          {
            source: 'confidential-ai-network',
            eventType: 'GMASE_TOOL_DECISION',
            ...auditPayload,
            auditId,
            receivedAt: new Date().toISOString(),
          },
          { timeout: Number(process.env.COMPLIANCEPULSE_INGEST_TIMEOUT_MS || 2000) }
        )
        .catch((err) => {
          console.warn('CompliancePulse ingest forward failed:', err.message);
        });
    });
  }

  if (!decision.allow) {
    const err = new Error(decision.reason || 'Denied by Open-GMASE policy gate');
    err.statusCode = 403;
    err.details = {
      governance: {
        allow: false,
        reason: decision.reason,
        deny: decision.deny,
        warn: decision.warn,
        package: decision.package,
        auditId,
      },
    };
    throw err;
  }

  return {
    skipped: false,
    allow: true,
    reason: decision.reason,
    deny: decision.deny,
    warn: decision.warn,
    package: decision.package,
    opaUrl: decision.opaUrl,
    auditId,
  };
}

module.exports = {
  authorizeCanSideEffect,
  isInferenceGateEnabled,
  isTrainingGateEnabled,
};
