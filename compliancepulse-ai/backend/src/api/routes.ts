import express, { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { spiffeService } from '../spiffe/service';
import { opaService } from '../opa/service';
import { bamlService } from '../baml/service';
import { auditService, AuditEventType } from '../audit/service';
import { Agent } from '../models/Agent';
import { logger } from '../config/logger';

const router = express.Router();

/**
 * Register a new AI agent
 * POST /api/v1/agents/register
 */
router.post(
  '/register',
  [
    body('name').isString().notEmpty(),
    body('type').isIn(['orchestrator', 'triage', 'forensic', 'remediation', 'custom']),
    body('workloadId').isString().notEmpty(),
    body('configuration').optional().isObject(),
    body('capabilities').optional().isArray(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, type, workloadId, configuration, capabilities } = req.body;

      // Issue SPIFFE SVID for the agent
      const svid = await spiffeService.issueSVID({
        workloadId,
        labels: { agentType: type },
      });

      // Create agent record
      const agent = await Agent.create({
        name,
        type,
        workloadId,
        spiffeId: svid.spiffeId,
        configuration: configuration || {},
        capabilities: capabilities || [],
        createdBy: req.user?.id || 'system',
      });

      // Log audit event
      await auditService.logEvent(
        AuditEventType.AGENT_REGISTERED,
        'register',
        `agent:${agent.id}`,
        'success',
        { agentType: type, workloadId },
        { userId: req.user?.id }
      );

      logger.info('Agent registered', { agentId: agent.id, type, workloadId });

      res.status(201).json({
        agent: {
          id: agent.id,
          name: agent.name,
          type: agent.type,
          workloadId: agent.workloadId,
          spiffeId: svid.spiffeId,
        },
        svid: {
          certificate: svid.certificate,
          expiresAt: svid.expiresAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Evaluate tool invocation against policies
 * POST /api/v1/policy/evaluate
 */
router.post(
  '/evaluate',
  [
    body('agentId').isUUID(),
    body('toolName').isString().notEmpty(),
    body('parameters').isObject(),
    body('environment').isString().notEmpty(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { agentId, toolName, parameters, environment } = req.body;

      // Validate agent exists
      const agent = await Agent.findByPk(agentId);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      // Validate parameters using BAML
      const validation = bamlService.parseToolParameters(toolName, parameters);
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Invalid parameters',
          details: validation.errors,
        });
      }

      // Evaluate against OPA policies
      const evaluation = await opaService.evaluateToolInvocation({
        agentId,
        toolName,
        parameters: validation.data,
        environment,
        requestedBy: req.user?.id || 'system',
        timestamp: new Date(),
      });

      // Log policy evaluation
      await auditService.logPolicyEvaluation(
        agentId,
        toolName,
        evaluation.allowed,
        evaluation.violations,
        evaluation.metadata.evaluationTimeMs
      );

      res.json(evaluation);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Issue SPIFFE SVID
 * POST /api/v1/identity/issue
 */
router.post(
  '/issue',
  [body('workloadId').isString().notEmpty()],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { workloadId } = req.body;

      const svid = await spiffeService.issueSVID({ workloadId });

      await auditService.logSVIDEvent(
        'issued',
        svid.spiffeId,
        workloadId,
        svid.expiresAt
      );

      res.json({
        spiffeId: svid.spiffeId,
        certificate: svid.certificate,
        expiresAt: svid.expiresAt,
        issuedAt: svid.issuedAt,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Query audit trail
 * GET /api/v1/audit/trail
 */
router.get(
  '/trail',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('eventTypes').optional().isString(),
    query('agentIds').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        startDate,
        endDate,
        eventTypes,
        agentIds,
        limit,
        offset,
      } = req.query;

      const query: any = {};

      if (startDate) query.startDate = new Date(startDate as string);
      if (endDate) query.endDate = new Date(endDate as string);
      if (eventTypes) query.eventTypes = (eventTypes as string).split(',');
      if (agentIds) query.agentIds = (agentIds as string).split(',');
      if (limit) query.limit = parseInt(limit as string);
      if (offset) query.offset = parseInt(offset as string);

      const result = await auditService.queryEvents(query);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get compliance report
 * GET /api/v1/audit/compliance-report
 */
router.get(
  '/compliance-report',
  [
    query('startDate').isISO8601(),
    query('endDate').isISO8601(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { startDate, endDate } = req.query;

      const report = await auditService.generateComplianceReport(
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json(report);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * List agents
 * GET /api/v1/agents
 */
router.get(
  '/',
  [
    query('status').optional().isIn(['active', 'inactive', 'suspended']),
    query('type').optional().isIn(['orchestrator', 'triage', 'forensic', 'remediation', 'custom']),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, type } = req.query;

      const where: any = {};
      if (status) where.status = status;
      if (type) where.type = type;

      const agents = await Agent.findAll({ where });

      res.json({ agents });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get agent by ID
 * GET /api/v1/agents/:id
 */
router.get(
  '/:id',
  [param('id').isUUID()],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const agent = await Agent.findByPk(id);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      res.json({ agent });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Health check
 * GET /api/v1/health
 */
router.get('/health', async (req: Request, res: Response) => {
  const spiffeHealth = await spiffeService.healthCheck();
  const opaHealth = await opaService.healthCheck();
  const bamlHealth = bamlService.healthCheck();
  const auditHealth = auditService.healthCheck();

  const allHealthy =
    spiffeHealth.status === 'healthy' &&
    opaHealth.status === 'healthy' &&
    bamlHealth.status === 'healthy' &&
    auditHealth.status === 'healthy';

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    services: {
      spiffe: spiffeHealth,
      opa: opaHealth,
      baml: bamlHealth,
      audit: auditHealth,
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
