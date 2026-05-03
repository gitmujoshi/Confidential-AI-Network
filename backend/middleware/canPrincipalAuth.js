/**
 * CAN (Confidential AI Network) principal auth (MVP)
 *
 * This is intentionally separate from Keycloak/portal auth.
 * For Phase 1 (local/simulated), we only require a principal identifier header.
 *
 * Later phases should replace this with cert-based challenge/nonce and short-lived tokens.
 */

function requireCanPrincipal(req, res, next) {
  const principalId = req.headers['x-can-principal-id'];
  if (!principalId || typeof principalId !== 'string') {
    return res.status(401).json({
      success: false,
      error: 'CAN principal authentication required',
      code: 'CAN_PRINCIPAL_MISSING',
      details: 'Provide X-CAN-Principal-Id header'
    });
  }

  req.can = {
    principalId
  };
  next();
}

module.exports = {
  requireCanPrincipal
};

