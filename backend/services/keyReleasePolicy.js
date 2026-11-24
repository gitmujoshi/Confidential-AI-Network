/**
 * Deny-by-default release policy.
 * Local mock claims are allowed. A production profile rejects a mock TEE and debug mode.
 * A budget, when present, is reserved in the same decision as the release.
 */

function deny(message, code) {
  const err = new Error(message);
  err.code = code;
  err.statusCode = 409;
  throw err;
}

function reserveReleaseBudget(budget) {
  if (!budget) return null;
  const cap = Number(budget.cap);
  const consumed = Number(budget.consumed || 0);
  const cost = Number(budget.cost || 0);
  if (!Number.isFinite(cap) || cap < 0 || !Number.isFinite(consumed) || !Number.isFinite(cost) || cost < 0) {
    deny('Release budget is missing or not a number.', 'BUDGET_EXHAUSTED');
  }
  if (consumed + cost > cap) {
    deny('Release budget is exhausted. The key was not released.', 'BUDGET_EXHAUSTED');
  }
  return {
    reserved: true,
    cap,
    consumed: consumed + cost,
    cost,
  };
}

function evaluateReleasePolicy({ profile, claims = {}, contract, budget, now = new Date() } = {}) {
  if (profile === 'production' && claims.tee_type === 'mock') {
    deny('Production policy refuses a mock TEE.', 'MOCK_TEE_REFUSED');
  }
  if (profile === 'production' && claims.debug_enabled) {
    deny('Production policy refuses a debug-enabled TEE.', 'DEBUG_REFUSED');
  }
  if (claims.nonce_fresh === false) {
    deny('Release nonce was already used.', 'NONCE_REPLAY');
  }
  if (claims.report_data_bound === false) {
    deny('Attestation report data is not bound to this release.', 'REPORT_UNBOUND');
  }
  if (contract) {
    const status = String(contract.status || 'valid').toUpperCase();
    if (['REVOKED', 'EXPIRED', 'INVALID', 'CANCELLED'].includes(status)) {
      deny('Contract is not valid for key release.', 'CONTRACT_NOT_VALID');
    }
    if (contract.expires_at && new Date(contract.expires_at).getTime() <= now.getTime()) {
      deny('Contract expired before key release.', 'CONTRACT_EXPIRED');
    }
  }
  if (budget && budget.reserved === false) {
    deny('Release budget was not reserved.', 'BUDGET_EXHAUSTED');
  }
  return { allow: true };
}

module.exports = {
  reserveReleaseBudget,
  evaluateReleasePolicy,
};
