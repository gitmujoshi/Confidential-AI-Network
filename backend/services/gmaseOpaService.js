/**
 * Open-GMASE OPA client — fail-closed tool authorization for CAN demos.
 * Expects OPA serving policies from open-gmase-core (default localhost:8181).
 */
const axios = require('axios');

const DEFAULT_OPA_URL = process.env.OPA_URL || 'http://localhost:8181';
const DEFAULT_PACKAGE = process.env.OPA_POLICY_PACKAGE || 'open_gmase/tools';

/**
 * Evaluate a tool proposal against Open-GMASE Rego packs.
 * @param {object} proposal
 * @param {string} proposal.tool_name
 * @param {object} [proposal.parameters]
 * @param {string} [proposal.environment]
 * @param {number} [proposal.confidence_score]
 * @param {number} [proposal.cost_estimate_usd]
 * @param {object} [proposal.metadata] — may include contract_id, dry_run, agent_id
 * @returns {Promise<{ allow: boolean, deny: string[], warn: string[], reason: string, opaUrl: string, raw: object|null, error?: string }>}
 */
async function authorizeTool(proposal = {}) {
  const opaUrl = (process.env.OPA_URL || DEFAULT_OPA_URL).replace(/\/$/, '');
  const pkg = String(
    proposal.policy_package || process.env.OPA_POLICY_PACKAGE || DEFAULT_PACKAGE
  ).replace(/\./g, '/');
  const input = {
    tool_name: proposal.tool_name,
    environment: proposal.environment || process.env.NODE_ENV || 'development',
    parameters: proposal.parameters || {},
    confidence_score:
      typeof proposal.confidence_score === 'number' ? proposal.confidence_score : 1,
    cost_estimate_usd:
      typeof proposal.cost_estimate_usd === 'number' ? proposal.cost_estimate_usd : 0,
    metadata: proposal.metadata || {},
  };

  try {
    const response = await axios.post(
      `${opaUrl}/v1/data/${pkg}`,
      { input },
      { timeout: Number(process.env.OPA_TIMEOUT_MS || 2000) }
    );
    const result = response.data?.result || {};
    const deny = Array.isArray(result.deny) ? result.deny : [];
    const warn = Array.isArray(result.warn) ? result.warn : [];
    const allow = Boolean(result.allow) && deny.length === 0;
    return {
      allow,
      deny,
      warn,
      reason: allow
        ? 'Access Granted'
        : deny.join('; ') || 'Denied by default Open-GMASE guardrails',
      opaUrl,
      package: pkg,
      input,
      raw: result,
    };
  } catch (err) {
    return {
      allow: false,
      deny: [`OPA unreachable: ${err.message}`],
      warn: [],
      reason: `Governance engine unreachable — fail closed (${err.message})`,
      opaUrl,
      package: pkg,
      input,
      raw: null,
      error: err.message,
    };
  }
}

/**
 * Lightweight health probe for OPA.
 */
async function checkOpaHealth() {
  const opaUrl = (process.env.OPA_URL || DEFAULT_OPA_URL).replace(/\/$/, '');
  try {
    const response = await axios.get(`${opaUrl}/health`, {
      timeout: Number(process.env.OPA_TIMEOUT_MS || 2000),
      validateStatus: () => true,
    });
    return { ok: response.status >= 200 && response.status < 300, opaUrl, status: response.status };
  } catch (err) {
    return { ok: false, opaUrl, error: err.message };
  }
}

module.exports = {
  authorizeTool,
  checkOpaHealth,
};
