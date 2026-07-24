/**
 * TDC Inference API — deploy registered training models and run local predictions.
 */
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const inference = require('../services/localInferenceService');

function handleError(res, err) {
  const status = err.statusCode || 500;
  if (status >= 500) console.error('TDC inference error:', err);
  return res.status(status).json({
    success: false,
    error: err.message || 'Internal error',
    details: err.details || undefined,
  });
}

function requireTdc(req, res) {
  const userId = req.user?.localUser?.id;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return null;
  }
  if (req.user?.localUser?.partyType !== 'TDC') {
    res.status(403).json({ success: false, error: 'TDC role required' });
    return null;
  }
  return userId;
}

router.get('/deployments', authenticateToken, async (req, res) => {
  try {
    const userId = requireTdc(req, res);
    if (!userId) return;
    const deployments = await inference.listDeployments(userId);
    return res.json({ success: true, deployments });
  } catch (err) {
    return handleError(res, err);
  }
});

router.post('/models/:modelId/deploy', authenticateToken, async (req, res) => {
  try {
    const userId = requireTdc(req, res);
    if (!userId) return;
    const result = await inference.deployModel(req.params.modelId, userId);
    return res.status(201).json({ success: true, ...result });
  } catch (err) {
    return handleError(res, err);
  }
});

router.post('/models/:modelId/undeploy', authenticateToken, async (req, res) => {
  try {
    const userId = requireTdc(req, res);
    if (!userId) return;
    const result = await inference.undeployModel(req.params.modelId, userId);
    return res.json({ success: true, ...result });
  } catch (err) {
    return handleError(res, err);
  }
});

router.post('/models/:modelId/predict', authenticateToken, async (req, res) => {
  try {
    const userId = requireTdc(req, res);
    if (!userId) return;
    const input = req.body?.input ?? req.body;
    const result = await inference.predict(req.params.modelId, userId, input);
    return res.json({ success: true, ...result });
  } catch (err) {
    return handleError(res, err);
  }
});

module.exports = router;
