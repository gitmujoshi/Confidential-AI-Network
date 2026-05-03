const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');

const { requireCanPrincipal } = require('../middleware/canPrincipalAuth');
const { CANJcsService } = require('../services/canJcsService');

const jcs = new CANJcsService();

function sendValidationError(res, errors) {
  return res.status(400).json({
    success: false,
    error: 'Validation failed',
    details: errors.array()
  });
}

// Create a CAN job (escrow OPEN + simulated attestation)
router.post(
  '/jobs',
  requireCanPrincipal,
  [
    body('contractId').isString().notEmpty().withMessage('contractId is required'),
    body('ccrProvider').optional().isIn(['local']).withMessage('ccrProvider must be local (MVP)')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors);

    try {
      const { contractId, ccrProvider } = req.body;
      const result = await jcs.createJob({ contractId, ccrProvider });
      return res.status(201).json({
        success: true,
        data: {
          job: result.job,
          ccrSession: result.ccrSession,
          attestation: result.attestation
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

// Get job status
router.get(
  '/jobs/:jobId',
  requireCanPrincipal,
  [param('jobId').isUUID().withMessage('jobId must be a UUID')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors);

    try {
      const result = await jcs.getJob(req.params.jobId);
      return res.json({ success: true, data: result });
    } catch (err) {
      return res.status(404).json({ success: false, error: err.message });
    }
  }
);

// Get training job status for a CAN job (no Keycloak)
router.get(
  '/jobs/:jobId/training',
  requireCanPrincipal,
  [param('jobId').isUUID().withMessage('jobId must be a UUID')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors);

    try {
      const result = await jcs.getJob(req.params.jobId);
      const trainingJobId = result.job?.trainingJobId;
      if (!trainingJobId) {
        return res.status(404).json({ success: false, error: 'Training job not started' });
      }
      const db2 = require('../models');
      const trainingJob = await db2.TrainingJob.findOne({ where: { jobId: trainingJobId } });
      if (!trainingJob) return res.status(404).json({ success: false, error: 'Training job not found' });
      return res.json({ success: true, data: trainingJob });
    } catch (err) {
      return res.status(404).json({ success: false, error: err.message });
    }
  }
);

// Get attestation bundle (signed)
router.get(
  '/jobs/:jobId/attestation',
  requireCanPrincipal,
  [param('jobId').isUUID().withMessage('jobId must be a UUID')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors);

    try {
      const attestation = await jcs.getAttestation(req.params.jobId);
      return res.json({
        success: true,
        data: {
          ...attestation.toJSON(),
          attestationReport: attestation.attestationReport.toString('base64')
        }
      });
    } catch (err) {
      return res.status(404).json({ success: false, error: err.message });
    }
  }
);

// Key released signal
router.post(
  '/jobs/:jobId/key-released',
  requireCanPrincipal,
  [
    param('jobId').isUUID().withMessage('jobId must be a UUID'),
    body('keyType').isIn(['DEK', 'MEK']).withMessage('keyType must be DEK or MEK')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors);

    try {
      const result = await jcs.markKeyReleased(req.params.jobId, {
        keyType: req.body.keyType,
        principalId: req.can.principalId
      });
      return res.json({ success: true, data: result });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }
);

// Scheduler ACK / release job to CCR runtime (MVP: flips to RELEASED + CCR RUNNING)
router.post(
  '/jobs/:jobId/release',
  requireCanPrincipal,
  [param('jobId').isUUID().withMessage('jobId must be a UUID')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors);

    try {
      const result = await jcs.releaseToScheduler(req.params.jobId);
      return res.json({ success: true, data: result });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }
);

// SSE events stream
router.get(
  '/jobs/:jobId/events',
  requireCanPrincipal,
  [param('jobId').isUUID().withMessage('jobId must be a UUID')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors);

    const jobId = req.params.jobId;
    const lastEventId = req.headers['last-event-id'];
    let afterSeq = 0;
    if (lastEventId) {
      const parsed = parseInt(String(lastEventId), 10);
      if (!Number.isNaN(parsed)) afterSeq = parsed;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    let closed = false;
    req.on('close', () => {
      closed = true;
    });

    const tickMs = 1500;
    const heartbeatMs = 15000;
    let lastHeartbeat = Date.now();

    async function pump() {
      if (closed) return;

      try {
        const events = await jcs.listEvents(jobId, { afterSeq, limit: 100 });
        for (const evt of events) {
          afterSeq = evt.seq;
          res.write(`id: ${evt.seq}\n`);
          res.write(`event: ${evt.eventType}\n`);
          res.write(`data: ${JSON.stringify(evt.payload)}\n\n`);
        }
      } catch (err) {
        res.write(`event: ERROR\n`);
        res.write(`data: ${JSON.stringify({ message: err.message })}\n\n`);
      }

      if (Date.now() - lastHeartbeat > heartbeatMs) {
        lastHeartbeat = Date.now();
        res.write(`event: HEARTBEAT\n`);
        res.write(`data: {}\n\n`);
      }

      setTimeout(pump, tickMs);
    }

    pump();
  }
);

module.exports = router;

