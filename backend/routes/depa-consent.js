const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { DepaConsentService } = require('../services/depaConsentService');

const consent = new DepaConsentService(db.DepaPersonalOffer);

function sendError(res, error) {
  const status = error.statusCode || 500;
  if (status >= 500) console.error('DEPA consent error:', error);
  return res.status(status).json({
    success: false,
    error: error.message || 'Consent request failed',
    code: error.code || 'CONSENT_ERROR',
  });
}

router.post('/offers', authenticateToken, async (req, res) => {
  try {
    const user = req.user?.localUser;
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    if (user.partyType !== 'TDP' && user.partyType !== 'AppAdmin') {
      return res.status(403).json({
        success: false,
        error: 'Only a data provider can open a personal-data offer',
        code: 'ACCESS_DENIED',
      });
    }
    const offer = await consent.createOffer({
      contractId: req.body?.contractId,
      providerUserId: user.id,
      purpose: req.body?.purpose,
      fields: req.body?.fields,
      personalData: req.body?.personalData,
    });
    return res.status(201).json({ success: true, offer });
  } catch (error) {
    return sendError(res, error);
  }
});

router.post('/offers/:offerId/consent', authenticateToken, async (req, res) => {
  try {
    const offer = await consent.recordConsent(req.params.offerId, {
      principalId: req.body?.principalId,
      publicKey: req.body?.publicKey,
      signature: req.body?.signature,
      expiresAt: req.body?.expiresAt,
    });
    return res.json({ success: true, offer });
  } catch (error) {
    return sendError(res, error);
  }
});

router.post('/offers/:offerId/release', authenticateToken, async (req, res) => {
  try {
    const released = await consent.release(req.params.offerId);
    return res.json({ success: true, ...released });
  } catch (error) {
    return sendError(res, error);
  }
});

router.post('/offers/:offerId/withdraw', authenticateToken, async (req, res) => {
  try {
    const offer = await consent.withdraw(req.params.offerId);
    return res.json({ success: true, offer });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
