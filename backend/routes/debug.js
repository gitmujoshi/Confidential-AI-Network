const express = require('express');
const fs = require('fs');
const path = require('path');
const { authorizeTool, checkOpaHealth } = require('../services/gmaseOpaService');
const AuditService = require('../services/auditService');

const router = express.Router();
const auditService = new AuditService();

function defaultMlxPythonPath() {
  return (
    process.env.LOCAL_MLX_PYTHON ||
    path.join(__dirname, '..', 'local-training', '.venv-mlx', 'bin', 'python')
  );
}

function defaultNativePythonPath() {
  return (
    process.env.LOCAL_NATIVE_PYTHON ||
    path.join(__dirname, '..', 'local-training', '.venv-native', 'bin', 'python')
  );
}

router.get('/env', (req, res) => {
  const mlxPython = defaultMlxPythonPath();
  const nativePython = defaultNativePythonPath();
  res.json({
    keycloak: {
      url: process.env.KEYCLOAK_URL,
      realm: process.env.KEYCLOAK_REALM,
      clientId: process.env.KEYCLOAK_CLIENT_ID,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET ? 'SET' : 'NOT_SET',
      adminUsername: process.env.KEYCLOAK_ADMIN_USERNAME,
      adminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD ? 'SET' : 'NOT_SET',
      enabled: process.env.KEYCLOAK_ENABLED
    },
    database: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      name: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD ? 'SET' : 'NOT_SET'
    },
    scitt: {
      enabled: process.env.SCITT_CCF_ENABLED,
      nodeUrl: process.env.CCF_NODE_URL,
      platform: process.env.CCF_PLATFORM
    },
    gmase: {
      opaUrl: process.env.OPA_URL || 'http://localhost:8181',
      policyPackage: process.env.OPA_POLICY_PACKAGE || 'open_gmase/tools',
      inferenceGate:
        process.env.GMASE_INFERENCE_GATE === 'false' || process.env.GMASE_INFERENCE_GATE === '0'
          ? false
          : true,
      note: 'TDC deploy/predict call open_gmase/can_contracts when inferenceGate=true; POST /api/debug/gmase-tool-check for manual demos',
    },
    training: {
      canLocalTrainingMode: process.env.CAN_LOCAL_TRAINING_MODE || 'simulate',
      trainingSimulationMode: process.env.TRAINING_SIMULATION_MODE ?? '(unset)',
      trainingExecutionMode: process.env.TRAINING_EXECUTION_MODE ?? '(unset)',
      localTrainingImage:
        process.env.LOCAL_TRAINING_IMAGE || 'contractmanagement/local-trainer:latest',
      mlx: {
        appleSilicon: process.platform === 'darwin' && process.arch === 'arm64',
        pythonPath: mlxPython,
        venvExists: fs.existsSync(mlxPython),
      },
      native: {
        appleSilicon: process.platform === 'darwin' && process.arch === 'arm64',
        pythonPath: nativePython,
        venvExists: fs.existsSync(nativePython),
        trainerDevice: process.env.LOCAL_NATIVE_TRAINER_DEVICE || process.env.TRAINER_DEVICE || 'auto',
      },
    },
    huggingface: {
      integrationEnabled: process.env.HUGGINGFACE_INTEGRATION_ENABLED === 'true',
      tokenConfigured: Boolean(process.env.HF_TOKEN || process.env.HUGGINGFACE_API_TOKEN),
      orgNamespace: process.env.HUGGINGFACE_ORG_NAMESPACE || '',
      sovereigntyMode: process.env.HUGGINGFACE_SOVEREIGNTY_MODE || 'dev-catalog-reference',
    },
    nodeEnv: process.env.NODE_ENV,
    workingDir: process.cwd()
  });
});

/**
 * GET /api/debug/gmase-opa-health
 * Probe Open-GMASE OPA (does not write audit).
 */
router.get('/gmase-opa-health', async (req, res) => {
  const health = await checkOpaHealth();
  res.status(health.ok ? 200 : 503).json(health);
});

/**
 * POST /api/debug/gmase-tool-check
 * Demo slice: tool proposal → Open-GMASE OPA → CAN AuditLogs.
 */
router.post('/gmase-tool-check', async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.tool_name || typeof body.tool_name !== 'string') {
      return res.status(400).json({
        error: 'tool_name is required',
        example: {
          tool_name: 'execute_sql',
          environment: 'production',
          parameters: { query: 'DROP TABLE users;' },
          confidence_score: 0.99,
          metadata: { contract_id: 'demo-contract-1' },
        },
      });
    }

    const previousPkg = process.env.OPA_POLICY_PACKAGE;
    if (body.policy_package) {
      process.env.OPA_POLICY_PACKAGE = String(body.policy_package).replace(/\./g, '/');
    }

    let decision;
    try {
      decision = await authorizeTool({
        tool_name: body.tool_name,
        parameters: body.parameters || {},
        environment: body.environment,
        confidence_score: body.confidence_score,
        cost_estimate_usd: body.cost_estimate_usd,
        metadata: body.metadata || {},
      });
    } finally {
      if (body.policy_package) {
        if (previousPkg === undefined) delete process.env.OPA_POLICY_PACKAGE;
        else process.env.OPA_POLICY_PACKAGE = previousPkg;
      }
    }

    const auditLog = await auditService.logEvent(
      'GMASE_TOOL_DECISION',
      {
        tool_name: body.tool_name,
        allow: decision.allow,
        reason: decision.reason,
        deny: decision.deny,
        warn: decision.warn,
        opaUrl: decision.opaUrl,
        package: decision.package,
        input: decision.input,
        contract_id: body.metadata?.contract_id || null,
        slice: 'can-open-gmase-demo',
      },
      req.user?.id || null,
      req.ip,
      req.get('user-agent')
    );

    return res.status(decision.allow ? 200 : 403).json({
      allow: decision.allow,
      reason: decision.reason,
      deny: decision.deny,
      warn: decision.warn,
      opa: {
        url: decision.opaUrl,
        package: decision.package,
        reachable: !decision.error,
        error: decision.error || null,
      },
      audit: {
        eventType: 'GMASE_TOOL_DECISION',
        id: auditLog?.id || null,
        note: 'Query AuditLogs where eventType = GMASE_TOOL_DECISION (or GET /api/debug/gmase-tool-decisions)',
      },
      researchNote:
        'Demo slice only — not a full unified production runtime. Start OPA via open-gmase-core docker compose.',
    });
  } catch (err) {
    console.error('gmase-tool-check failed:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/debug/gmase-tool-decisions
 * Recent GMASE_TOOL_DECISION rows from CAN AuditLogs.
 */
router.get('/gmase-tool-decisions', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const result = await auditService.getAuditLogs({ eventType: 'GMASE_TOOL_DECISION' }, 1, limit);
    return res.json({
      total: result.total,
      page: result.page,
      limit: result.limit || limit,
      decisions: (result.logs || []).map((row) => {
        let parsed = {};
        try {
          parsed = typeof row.eventData === 'string' ? JSON.parse(row.eventData) : row.eventData;
        } catch (_) {
          parsed = { raw: row.eventData };
        }
        return {
          id: row.id,
          timestamp: row.timestamp,
          userId: row.userId,
          ...parsed,
        };
      }),
    });
  } catch (err) {
    console.error('gmase-tool-decisions failed:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
