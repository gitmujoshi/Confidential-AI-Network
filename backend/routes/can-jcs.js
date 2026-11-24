const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');

const { requireCanPrincipal } = require('../middleware/canPrincipalAuth');
const { CANJcsService } = require('../services/canJcsService');
const { assertNoRawKeyFields } = require('../services/canKeyDelivery');
const { requestKeyRelease, assertKeyReleaseProfile } = require('../services/keyReleaseClient');

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
    body('keyType').isIn(['DEK', 'MEK']).withMessage('keyType must be DEK or MEK'),
    body('attestedPublicKey').isString().notEmpty().withMessage('attestedPublicKey is required'),
    body('wrappedKey').isString().notEmpty().withMessage('wrappedKey is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors);

    try {
      assertNoRawKeyFields(req.body);
      assertKeyReleaseProfile();
      const result = await jcs.markKeyReleased(req.params.jobId, {
        keyType: req.body.keyType,
        principalId: req.can.principalId,
        attestedPublicKey: req.body.attestedPublicKey,
        wrappedKey: req.body.wrappedKey
      });
      return res.json({ success: true, keyStored: false, data: result });
    } catch (err) {
      return res.status(err.statusCode || 400).json({
        success: false,
        error: err.message,
        code: err.code
      });
    }
  }
);

// Azure Key Vault secure key release. The blob stays encrypted to the attested runtime.
router.post(
  '/jobs/:jobId/azure-key-release',
  requireCanPrincipal,
  [
    param('jobId').isUUID().withMessage('jobId must be a UUID'),
    body('keyType').isIn(['DEK', 'MEK']).withMessage('keyType must be DEK or MEK'),
    body('vaultUrl').isString().notEmpty().withMessage('vaultUrl is required'),
    body('keyId').isString().notEmpty().withMessage('keyId is required'),
    body('attestationToken').isString().notEmpty().withMessage('attestationToken is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors);
    try {
      assertNoRawKeyFields(req.body);
      const released = await requestKeyRelease({
        backend: 'azure-skr',
        keyType: req.body.keyType,
        vaultUrl: req.body.vaultUrl,
        keyId: req.body.keyId,
        attestationToken: req.body.attestationToken
      });
      const result = await jcs.recordAzureKeyRelease(req.params.jobId, {
        keyType: req.body.keyType,
        principalId: req.can.principalId,
        release: released
      });
      return res.json({
        success: true,
        keyStored: false,
        reportFormat: released.reportFormat,
        attestationType: released.attestationType,
        releaseBlobSha256: released.releaseBlobSha256,
        encryptedRelease: released.encryptedRelease,
        data: result
      });
    } catch (err) {
      return res.status(err.statusCode || 400).json({
        success: false,
        error: err.message,
        code: err.code
      });
    }
  }
);

// Record a sealed output. The body is ciphertext plus the plaintext hash. The API does not accept the artifact.
router.post(
  '/jobs/:jobId/seal-output',
  requireCanPrincipal,
  [
    param('jobId').isUUID().withMessage('jobId must be a UUID'),
    body('sealedOutput').isString().notEmpty().withMessage('sealedOutput is required'),
    body('outputSha256').isString().notEmpty().withMessage('outputSha256 is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors);
    try {
      assertNoRawKeyFields(req.body);
      const result = await jcs.recordSealedOutput(req.params.jobId, {
        sealedOutput: req.body.sealedOutput,
        outputSha256: req.body.outputSha256
      });
      return res.json({ success: true, keyStored: false, data: result });
    } catch (err) {
      return res.status(err.statusCode || 400).json({
        success: false,
        error: err.message,
        code: err.code
      });
    }
  }
);

// Ask each owner's Key Broker Service. One refusal leaves the job unreleased.
router.post(
  '/jobs/:jobId/orchestrate',
  requireCanPrincipal,
  [
    param('jobId').isUUID().withMessage('jobId must be a UUID'),
    body('owners').isArray({ min: 1 }).withMessage('owners must list at least one KBS')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors);
    try {
      assertNoRawKeyFields(req.body);
      const result = await jcs.orchestrateOwners(req.params.jobId, {
        owners: req.body.owners,
        contract: req.body.contract,
        evidence: req.body.evidence,
        budget: req.body.budget
      });
      return res.json({
        success: true,
        keyStored: false,
        data: {
          ok: result.ok,
          releases: result.releases.map((item) => ({
            ownerId: item.ownerId,
            keyType: item.keyType,
            namespace: item.namespace,
            keyStored: false,
            receipt: item.receipt
          }))
        }
      });
    } catch (err) {
      return res.status(err.statusCode || 409).json({
        success: false,
        error: err.message,
        code: err.code,
        owners: err.owners
      });
    }
  }
);

router.post(
  '/jobs/:jobId/renew-leases',
  requireCanPrincipal,
  [
    param('jobId').isUUID().withMessage('jobId must be a UUID'),
    body('owners').isArray({ min: 1 }).withMessage('owners must list at least one lease')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors);
    try {
      const result = await jcs.renewOwnerLeases(req.params.jobId, { owners: req.body.owners });
      return res.json({ success: true, keyStored: false, data: result });
    } catch (err) {
      return res.status(err.statusCode || 409).json({
        success: false,
        error: err.message,
        code: err.code
      });
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

