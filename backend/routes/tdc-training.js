/**
 * TDC Training API — start and monitor contract-scoped training jobs.
 */

const express = require('express');
const path = require('path');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const TdcTrainingExecutionService = require('../services/tdcTrainingExecutionService');
const fs = require('fs');
const db = require('../models');

const service = new TdcTrainingExecutionService();

function handleError(res, err) {
  const status = err.statusCode || 500;
  if (status >= 500) console.error('TDC training error:', err);
  return res.status(status).json({
    success: false,
    error: err.message || 'Internal error',
  });
}

router.get(
  '/contracts/:contractId/readiness',
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

      const readiness = await service.getTrainingReadiness(contractId, userId);
      return res.json({ success: true, readiness });
    } catch (err) {
      return handleError(res, err);
    }
  }
);

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

router.get(
  '/jobs/:jobId/logs',
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

      // Authorization check (ensures requesting user owns the contract as TDC).
      await service.getJobForUser(jobId, userId);

      const row = await db.TrainingJob.findOne({ where: { jobId } });
      if (!row) {
        return res.status(404).json({ success: false, error: 'Training job not found' });
      }

      const plain = row.get({ plain: true });
      const logPath = plain?.metadata?.local?.logFile || null;
      const inlineLog = plain?.metadata?.runnerLog || null;

      if (!logPath && inlineLog) {
        res.setHeader('X-Log-Truncated', '0');
        res.setHeader('X-Log-Bytes', String(Buffer.byteLength(inlineLog, 'utf8')));
        return res.type('text/plain').send(inlineLog);
      }

      if (!logPath) {
        return res.status(404).json({ success: false, error: 'Logs not available for this job' });
      }

      if (!fs.existsSync(logPath)) {
        return res.status(404).json({ success: false, error: 'Log file not found' });
      }

      // Default: return tail bytes (to keep UI responsive). Clients can request full logs via `?full=1`.
      // Safety: cap full response to avoid huge payloads.
      const stat = fs.statSync(logPath);
      const full = String(req.query?.full || '').toLowerCase();
      const wantFull = full === '1' || full === 'true' || full === 'yes';

      const tailBytesRaw = req.query?.tailBytes ?? req.query?.tail_bytes ?? null;
      const tailBytes = tailBytesRaw ? Math.max(0, parseInt(String(tailBytesRaw), 10) || 0) : 200 * 1024;

      // Full logs are needed for E2E artifacts. Keep a safety cap, but higher than typical docker logs.
      const maxFullBytes = 25 * 1024 * 1024; // 25MB
      const maxTailBytes = 2 * 1024 * 1024; // 2MB

      const maxBytes = wantFull ? maxFullBytes : Math.min(tailBytes, maxTailBytes);
      const start = stat.size > maxBytes ? stat.size - maxBytes : 0;
      const buf = Buffer.alloc(stat.size - start);
      const fd = fs.openSync(logPath, 'r');
      try {
        fs.readSync(fd, buf, 0, buf.length, start);
      } finally {
        fs.closeSync(fd);
      }

      // Signal truncation to clients if we hit the cap.
      res.setHeader('X-Log-Truncated', start > 0 ? '1' : '0');
      res.setHeader('X-Log-Bytes', String(stat.size));
      return res.type('text/plain').send(buf.toString('utf8'));
    } catch (err) {
      return handleError(res, err);
    }
  }
);

router.get(
  '/jobs/:jobId/artifact',
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

      // Authorization check (ensures requesting user owns the contract as TDC).
      await service.getJobForUser(jobId, userId);

      const row = await db.TrainingJob.findOne({ where: { jobId } });
      if (!row) {
        return res.status(404).json({ success: false, error: 'Training job not found' });
      }

      const plain = row.get({ plain: true });
      const outDir = plain?.metadata?.local?.outDir || null;
      if (!outDir) {
        return res.status(404).json({ success: false, error: 'Artifact not available for this job' });
      }

      const artifactPath = `${outDir}/model.bin`;
      if (!fs.existsSync(artifactPath)) {
        return res.status(404).json({ success: false, error: 'Artifact file not found' });
      }

      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${String(jobId).replace(/[^a-zA-Z0-9._-]/g, '_')}-model.bin"`
      );
      return fs.createReadStream(artifactPath).pipe(res);
    } catch (err) {
      return handleError(res, err);
    }
  }
);

router.get(
  '/jobs/:jobId/provenance-report',
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

      await service.getJobForUser(jobId, userId);

      const row = await db.TrainingJob.findOne({ where: { jobId } });
      if (!row) {
        return res.status(404).json({ success: false, error: 'Training job not found' });
      }

      const plain = row.get({ plain: true });
      const outDir = plain?.metadata?.local?.outDir || null;
      const filePath = outDir ? path.join(outDir, 'provenance-report.json') : null;

      if (filePath && fs.existsSync(filePath)) {
        return res.type('application/json').send(fs.readFileSync(filePath, 'utf8'));
      }

      const { buildJobTrainingProvenanceBundle } = require('../services/provenanceAuditReportService');
      const bundle = await buildJobTrainingProvenanceBundle(jobId);
      if (filePath) {
        try {
          fs.writeFileSync(filePath, JSON.stringify(bundle, null, 2), 'utf8');
        } catch (_) {
          // ignore disk write failures; still return JSON
        }
      }
      return res.json(bundle);
    } catch (err) {
      return handleError(res, err);
    }
  }
);

module.exports = router;
