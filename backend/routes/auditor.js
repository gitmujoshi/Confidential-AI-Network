'use strict';

/**
 * Auditor APIs — read-only contract list, provenance report, Merkle audit tree, proof verify.
 */

const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { buildProvenanceAuditReport } = require('../services/provenanceAuditReportService');
const {
  buildContractAuditTree,
  verifyInclusionProof,
} = require('../services/auditorAuditTreeService');

const requireAuditorOrAdmin = requireRole(['Auditor', 'AppAdmin']);

function resolveCaller(req) {
  const lu = req.user?.localUser;
  if (lu?.id != null) {
    return { id: lu.id, partyType: lu.partyType };
  }
  return {
    id: req.user?.id,
    partyType: req.user?.partyType,
  };
}

/** List all contracts (read-only). */
router.get('/contracts', authenticateToken, requireAuditorOrAdmin, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    const where = {};
    if (status) where.status = status;

    const { count, rows } = await db.Contract.findAndCountAll({
      where,
      limit: Math.min(parseInt(limit, 10) || 50, 200),
      offset: parseInt(offset, 10) || 0,
      order: [['updatedAt', 'DESC']],
      include: [
        { model: db.User, as: 'tdc', attributes: ['id', 'name', 'email', 'depaId'], required: false },
        { model: db.User, as: 'tsp', attributes: ['id', 'name', 'email', 'depaId'], required: false },
      ],
    });

    res.json({
      success: true,
      total: count,
      contracts: rows.map((r) => {
        const p = r.get({ plain: true });
        return {
          contractId: p.contractId,
          status: p.status,
          depaId: p.depaId,
          tdcId: p.tdcId,
          tspId: p.tspId,
          tdcName: p.tdc?.name || null,
          tspName: p.tsp?.name || null,
          legalDocumentHash: p.legalDocumentHash,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        };
      }),
    });
  } catch (error) {
    console.error('Auditor list contracts failed:', error);
    res.status(500).json({ error: error.message || 'Failed to list contracts' });
  }
});

/** Contract provenance audit report (JSON). */
router.get(
  '/contracts/:contractId/provenance-report',
  authenticateToken,
  requireAuditorOrAdmin,
  async (req, res) => {
    try {
      const caller = resolveCaller(req);
      const report = await buildProvenanceAuditReport(req.params.contractId, caller.id, {
        partyType: caller.partyType,
      });
      res.json({ success: true, report });
    } catch (error) {
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message || 'Failed to load provenance report' });
    }
  }
);

/** Merkle audit tree for a contract (leaves + inclusion proofs + root). */
router.get(
  '/contracts/:contractId/audit-tree',
  authenticateToken,
  requireAuditorOrAdmin,
  async (req, res) => {
    try {
      const caller = resolveCaller(req);
      const tree = await buildContractAuditTree(req.params.contractId, caller.id, {
        partyType: caller.partyType,
      });
      res.json({ success: true, auditTree: tree });
    } catch (error) {
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message || 'Failed to build audit tree' });
    }
  }
);

/** Verify a Merkle inclusion proof (body: { proof, rootHash? }). */
router.post('/verify-proof', authenticateToken, requireAuditorOrAdmin, async (req, res) => {
  try {
    const { proof, rootHash } = req.body || {};
    if (!proof) {
      return res.status(400).json({ error: 'Missing proof' });
    }
    const result = verifyInclusionProof(proof, rootHash);
    res.json({ success: true, verification: result });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Verification failed' });
  }
});

module.exports = router;
