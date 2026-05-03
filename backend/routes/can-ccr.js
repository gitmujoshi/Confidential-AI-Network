const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');

const db = require('../models');
const { requireCanPrincipal } = require('../middleware/canPrincipalAuth');

function sendValidationError(res, errors) {
  return res.status(400).json({
    success: false,
    error: 'Validation failed',
    details: errors.array()
  });
}

/**
 * CCR key delivery endpoint (MVP)
 *
 * IMPORTANT: For Phase 1 (local/simulated), this endpoint only accepts a *signal*
 * that a principal delivered a key to the CCR. We intentionally do NOT accept
 * key material here to avoid accidental “platform sees keys” behavior.
 *
 * Later phases: this endpoint would live inside the CCR boundary and terminate
 * attested TLS directly in the TEE, not in this Node service.
 */
router.post(
  '/:ccrSessionId/keys',
  requireCanPrincipal,
  [
    param('ccrSessionId').isUUID().withMessage('ccrSessionId must be a UUID'),
    body('keyType').isIn(['DEK', 'MEK']).withMessage('keyType must be DEK or MEK'),
    body('keyMaterial').optional().isEmpty().withMessage('Do not send keyMaterial to platform')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors);

    try {
      const { ccrSessionId } = req.params;
      const { keyType } = req.body;

      const ccr = await db.CANCcrSession.findByPk(ccrSessionId);
      if (!ccr) {
        return res.status(404).json({ success: false, error: 'CCR session not found' });
      }

      if (ccr.state === 'DESTROYED') {
        return res.status(400).json({ success: false, error: 'CCR session already destroyed' });
      }

      const updates = {};
      if (keyType === 'DEK') updates.dekReceived = true;
      if (keyType === 'MEK') updates.mekReceived = true;

      // Minimal lifecycle bump: if both received, session is READY.
      const dekReceived = updates.dekReceived ?? ccr.dekReceived;
      const mekReceived = updates.mekReceived ?? ccr.mekReceived;
      if (dekReceived && mekReceived && ccr.state !== 'READY' && ccr.state !== 'RUNNING') {
        updates.state = 'READY';
      }

      await ccr.update(updates);

      return res.json({
        success: true,
        message: 'Key release signal accepted (no key material stored)',
        data: {
          ccrSessionId,
          keyType,
          state: ccr.state,
          dekReceived: ccr.dekReceived,
          mekReceived: ccr.mekReceived
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

module.exports = router;

