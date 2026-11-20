const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');

const db = require('../models');
const { requireCanPrincipal } = require('../middleware/canPrincipalAuth');
const { CANJcsService } = require('../services/canJcsService');
const { assertNoRawKeyFields } = require('../services/canKeyDelivery');

const jcs = new CANJcsService();

function sendValidationError(res, errors) {
  return res.status(400).json({
    success: false,
    error: 'Validation failed',
    details: errors.array()
  });
}

/**
 * CCR key delivery.
 * The caller sends a key wrapped to the attestation public key.
 * The service decrypts it only to prove that binding, zeroes the bytes, and stores the release time.
 */
router.post(
  '/:ccrSessionId/keys',
  requireCanPrincipal,
  [
    param('ccrSessionId').isUUID().withMessage('ccrSessionId must be a UUID'),
    body('keyType').isIn(['DEK', 'MEK']).withMessage('keyType must be DEK or MEK'),
    body('attestedPublicKey').isString().notEmpty().withMessage('attestedPublicKey is required'),
    body('wrappedKey').isString().notEmpty().withMessage('wrappedKey is required'),
    body('keyMaterial').optional().isEmpty().withMessage('Do not send keyMaterial to the API')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors);

    try {
      assertNoRawKeyFields(req.body);
      const { ccrSessionId } = req.params;
      const job = await db.CANJcsJob.findOne({ where: { ccrSessionId } });
      if (!job) {
        return res.status(404).json({ success: false, error: 'CCR session not found' });
      }
      const result = await jcs.markKeyReleased(job.jobId, {
        keyType: req.body.keyType,
        principalId: req.can.principalId,
        attestedPublicKey: req.body.attestedPublicKey,
        wrappedKey: req.body.wrappedKey,
      });
      return res.json({
        success: true,
        keyStored: false,
        message: 'Wrapped key accepted and discarded. Release time stored.',
        data: {
          ccrSessionId,
          keyType: req.body.keyType,
          state: result.ccrSession?.state,
          escrowState: result.job?.escrowState,
        },
      });
    } catch (err) {
      return res.status(err.statusCode || 400).json({
        success: false,
        error: err.message,
        code: err.code,
      });
    }
  }
);

module.exports = router;

