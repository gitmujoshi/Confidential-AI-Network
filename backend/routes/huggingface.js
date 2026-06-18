/**
 * Hugging Face Hub integration routes (development / test only).
 */

const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const hf = require('../services/huggingfaceIntegrationService');

function requireHfDevEnabled(req, res, next) {
  if (!hf.isEnabled()) {
    return res.status(403).json({
      error: 'Hugging Face integration disabled',
      message:
        'Set HUGGINGFACE_INTEGRATION_ENABLED=true and NODE_ENV=development|test. Not available in production by default.',
      config: hf.getConfig(),
    });
  }
  return next();
}

router.use(requireHfDevEnabled);

router.get('/status', (req, res) => {
  res.json({
    success: true,
    ...hf.getConfig(),
    vault: hf.resolveTokenFromVaultHint(),
  });
});

router.get(
  '/models/:repoId(*)',
  param('repoId').isString().notEmpty(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const meta = await hf.fetchHubMetadata('model', req.params.repoId);
      return res.json({ success: true, metadata: meta });
    } catch (error) {
      return res.status(error.statusCode === 401 ? 401 : 502).json({
        error: 'Failed to fetch model metadata from Hugging Face Hub',
        message: error.message,
      });
    }
  }
);

router.get(
  '/datasets/:repoId(*)',
  param('repoId').isString().notEmpty(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const meta = await hf.fetchHubMetadata('dataset', req.params.repoId);
      return res.json({ success: true, metadata: meta });
    } catch (error) {
      return res.status(error.statusCode === 401 ? 401 : 502).json({
        error: 'Failed to fetch dataset metadata from Hugging Face Hub',
        message: error.message,
      });
    }
  }
);

router.post(
  '/validate',
  body('repoType').isIn(['model', 'dataset']),
  body('repoId').isString().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { repoType, repoId } = req.body;
    const normalized = hf.normalizeHfBlock({ repoId, repoType }, repoType);
    if (!normalized) {
      return res.status(400).json({ error: 'Invalid repoId format' });
    }

    try {
      const metadata = await hf.fetchHubMetadata(repoType, normalized.repoId);
      return res.json({ success: true, normalized, metadata });
    } catch (error) {
      return res.status(502).json({
        success: false,
        normalized,
        error: error.message,
        hint: 'For gated/private repos set HF_TOKEN with org read access.',
      });
    }
  }
);

module.exports = router;
