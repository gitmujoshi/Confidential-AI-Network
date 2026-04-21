/**
 * TDC Training API — start and monitor contract-scoped training jobs.
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const TdcTrainingExecutionService = require('../services/tdcTrainingExecutionService');

const service = new TdcTrainingExecutionService();

function handleError(res, err) {
  const status = err.statusCode || 500;
  if (status >= 500) console.error('TDC training error:', err);
  return res.status(status).json({
    success: false,
    error: err.message || 'Internal error',
  });
}

router.post(
  '/contracts/:contractId/start',
  authenticateToken,
  async (req, res) => {
    try {
      const { contractId } = req.params;
      const userId = req.user?.localUser?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      if (req.user?.localUser?.partyType !== 'TDC') {
        return res.status(403).json({ success: false, error: 'TDC role required' });
      }

      const job = await service.startTrainingForContract(contractId, userId);
      return res.json({ success: true, job });
    } catch (err) {
      return handleError(res, err);
    }
  }
);

router.get(
  '/contracts/:contractId/jobs',
  authenticateToken,
  async (req, res) => {
    try {
      const { contractId } = req.params;
      const userId = req.user?.localUser?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      if (req.user?.localUser?.partyType !== 'TDC') {
        return res.status(403).json({ success: false, error: 'TDC role required' });
      }

      const jobs = await service.listJobsForContract(contractId, userId);
      return res.json({ success: true, jobs });
    } catch (err) {
      return handleError(res, err);
    }
  }
);

router.post(
  '/jobs/:jobId/register-model',
  authenticateToken,
  async (req, res) => {
    try {
      const { jobId } = req.params;
      const userId = req.user?.localUser?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      if (req.user?.localUser?.partyType !== 'TDC') {
        return res.status(403).json({ success: false, error: 'TDC role required' });
      }

      const result = await service.registerModelFromJob(jobId, userId, req.body || {});
      return res.status(201).json({ success: true, ...result });
    } catch (err) {
      return handleError(res, err);
    }
  }
);

router.get(
  '/jobs/:jobId',
  authenticateToken,
  async (req, res) => {
    try {
      const { jobId } = req.params;
      const userId = req.user?.localUser?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      if (req.user?.localUser?.partyType !== 'TDC') {
        return res.status(403).json({ success: false, error: 'TDC role required' });
      }

      const job = await service.getJobForUser(jobId, userId);
      return res.json({ success: true, job });
    } catch (err) {
      return handleError(res, err);
    }
  }
);

module.exports = router;
