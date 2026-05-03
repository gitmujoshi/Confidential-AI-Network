const express = require('express');
const router = express.Router();
const { param, query, validationResult } = require('express-validator');
const { Op } = require('sequelize');

const db = require('../models');
const { requireCanPrincipal } = require('../middleware/canPrincipalAuth');

function sendValidationError(res, errors) {
  return res.status(400).json({
    success: false,
    error: 'Validation failed',
    details: errors.array()
  });
}

// List provenance events for a job
router.get(
  '/jobs/:jobId/events',
  requireCanPrincipal,
  [
    param('jobId').isUUID().withMessage('jobId must be a UUID'),
    query('afterSeq').optional().isInt({ min: 0 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 500 }).toInt()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors);

    const jobId = req.params.jobId;
    const afterSeq = req.query.afterSeq || 0;
    const limit = req.query.limit || 200;

    const events = await db.CANProvenanceEvent.findAll({
      where: {
        jobId,
        seq: { [Op.gt]: afterSeq }
      },
      order: [['seq', 'ASC']],
      limit
    });

    return res.json({
      success: true,
      data: events
    });
  }
);

module.exports = router;

