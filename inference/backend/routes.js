/**
 * TDC Inference API — deploy registered training models and run local predictions.
 */
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../backend/middleware/auth');
const db = require('../../backend/models');
const inference = require('./localInferenceService');
const { sanitizeProviderAccount } = require('../../shared/services/tspCloudAccount');

const DEPLOY_ACCOUNT_PROVIDERS = ['Azure', 'GCP', 'AWS'];

function handleError(res, err) {
  const status = err.statusCode || 500;
  if (status >= 500) console.error('TDC inference error:', err);
  const payload = {
    success: false,
    error: err.message || 'Internal error',
    details: err.details || undefined,
  };
  if (err.details?.governance) {
    payload.governance = err.details.governance;
  }
  return res.status(status).json(payload);
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

router.get('/accounts', authenticateToken, async (req, res) => {
  try {
    const userId = requireTdc(req, res);
    if (!userId) return;
    const user = await db.User.findByPk(userId);
    const bag = user?.cloudAccount || {};
    const accounts = {};
    for (const provider of DEPLOY_ACCOUNT_PROVIDERS) {
      accounts[provider] = bag[provider] || null;
    }
    return res.json({ success: true, accounts });
  } catch (err) {
    return handleError(res, err);
  }
});

router.put('/accounts', authenticateToken, async (req, res) => {
  try {
    const userId = requireTdc(req, res);
    if (!userId) return;
    const provider = String(req.body?.provider || '');
    if (!DEPLOY_ACCOUNT_PROVIDERS.includes(provider)) {
      return res.status(400).json({ success: false, error: 'Provider must be Azure, GCP, or AWS.' });
    }
    const user = await db.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    let cleaned;
    try {
      cleaned = sanitizeProviderAccount(provider, req.body?.account);
    } catch (accountError) {
      return res.status(accountError.statusCode || 400).json({ success: false, error: accountError.message });
    }
    const cloudAccount = { ...(user.cloudAccount || {}), [provider]: cleaned || {} };
    await user.update({ cloudAccount });
    return res.json({ success: true, provider, account: cloudAccount[provider] });
  } catch (err) {
    return handleError(res, err);
  }
});

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
    const result = await inference.deployModel(req.params.modelId, userId, {
      target: req.body?.target,
    });
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
