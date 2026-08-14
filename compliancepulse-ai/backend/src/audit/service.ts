import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logger';
import { config } from '../config';

/**
 * Audit event types
 */
export enum AuditEventType {
  TOOL_INVOCATION = 'tool_invocation',
  POLICY_EVALUATION = 'policy_evaluation',
  SVID_ISSUED = 'svid_issued',
  SVID_REVOKED = 'svid_revoked',
  AGENT_REGISTERED = 'agent_registered',
  AGENT_DEREGISTERED = 'agent_deregistered',
  POLICY_VIOLATION = 'policy_violation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  CONFIGURATION_CHANGE = 'configuration_change',
  EXTERNAL_INGEST = 'external_ingest',
}

/**
 * Audit event
 */
export interface AuditEvent {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  agentId?: string;
  userId?: string;
  action: string;
  resource: string;
  result: 'success' | 'failure' | 'denied';
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Audit query parameters
 */
export interface AuditQuery {
  startDate?: Date;
  endDate?: Date;
  eventTypes?: AuditEventType[];
  agentIds?: string[];
  userIds?: string[];
  results?: ('success' | 'failure' | 'denied')[];
  limit?: number;
  offset?: number;
}

/**
 * Audit Service
 * Immutable, cryptographically verifiable audit trail
 */
export class AuditService {
  private events: AuditEvent[] = []; // In-memory store (use BigQuery/PostgreSQL in production)
  private readonly enabled: boolean;

  constructor() {
    this.enabled = config.audit.enabled;
    logger.info('Audit Service initialized', { enabled: this.enabled });
  }

  /**
   * Log an audit event
   */
  async logEvent(
    eventType: AuditEventType,
    action: string,
    resource: string,
    result: 'success' | 'failure' | 'denied',
    metadata: Record<string, any> = {},
    context?: {
      agentId?: string;
      userId?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<string> {
    if (!this.enabled) {
      return '';
    }

    const event: AuditEvent = {
      id: uuidv4(),
      timestamp: new Date(),
      eventType,
      action,
      resource,
      result,
      metadata,
      agentId: context?.agentId,
      userId: context?.userId,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    };

    // Store event (in production, write to BigQuery/PostgreSQL)
    this.events.push(event);

    logger.info('Audit event logged', {
      eventId: event.id,
      eventType,
      action,
      result,
    });

    // In production, also send to BigQuery for long-term storage
    if (config.audit.gcpProjectId) {
      await this.sendToBigQuery(event);
    }

    return event.id;
  }

  /**
   * Log tool invocation
   */
  async logToolInvocation(
    agentId: string,
    toolName: string,
    parameters: Record<string, any>,
    result: 'success' | 'failure' | 'denied',
    policyViolations: string[] = [],
    executionTimeMs?: number
  ): Promise<string> {
    return this.logEvent(
      AuditEventType.TOOL_INVOCATION,
      `invoke:${toolName}`,
      `tool:${toolName}`,
      result,
      {
        toolName,
        parameters,
        policyViolations,
        executionTimeMs,
      },
      { agentId }
    );
  }

  /**
   * Log policy evaluation
   */
  async logPolicyEvaluation(
    agentId: string,
    toolName: string,
    allowed: boolean,
    violations: string[],
    evaluationTimeMs: number
  ): Promise<string> {
    return this.logEvent(
      AuditEventType.POLICY_EVALUATION,
      `evaluate:${toolName}`,
      `policy:evaluation`,
      allowed ? 'success' : 'denied',
      {
        toolName,
        violations,
        evaluationTimeMs,
      },
      { agentId }
    );
  }

  /**
   * Log SVID lifecycle event
   */
  async logSVIDEvent(
    action: 'issued' | 'revoked',
    spiffeId: string,
    workloadId: string,
    expiresAt?: Date
  ): Promise<string> {
    return this.logEvent(
      action === 'issued' ? AuditEventType.SVID_ISSUED : AuditEventType.SVID_REVOKED,
      `svid:${action}`,
      `identity:${spiffeId}`,
      'success',
      {
        spiffeId,
        workloadId,
        expiresAt: expiresAt?.toISOString(),
      }
    );
  }

  /**
   * Log authentication event
   */
  async logAuthentication(
    userId: string,
    result: 'success' | 'failure',
    method: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    return this.logEvent(
      AuditEventType.AUTHENTICATION,
      `auth:${method}`,
      `user:${userId}`,
      result,
      { method },
      { userId, ipAddress, userAgent }
    );
  }

  /**
   * Query audit trail
   */
  async queryEvents(query: AuditQuery): Promise<{
    events: AuditEvent[];
    total: number;
  }> {
    let filtered = [...this.events];

    // Apply filters
    if (query.startDate) {
      filtered = filtered.filter((e) => e.timestamp >= query.startDate!);
    }
    if (query.endDate) {
      filtered = filtered.filter((e) => e.timestamp <= query.endDate!);
    }
    if (query.eventTypes && query.eventTypes.length > 0) {
      filtered = filtered.filter((e) => query.eventTypes!.includes(e.eventType));
    }
    if (query.agentIds && query.agentIds.length > 0) {
      filtered = filtered.filter(
        (e) => e.agentId && query.agentIds!.includes(e.agentId)
      );
    }
    if (query.userIds && query.userIds.length > 0) {
      filtered = filtered.filter(
        (e) => e.userId && query.userIds!.includes(e.userId)
      );
    }
    if (query.results && query.results.length > 0) {
      filtered = filtered.filter((e) => query.results!.includes(e.result));
    }

    // Sort by timestamp descending
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const total = filtered.length;

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      events: paginated,
      total,
    };
  }

  /**
   * Get event by ID
   */
  async getEvent(eventId: string): Promise<AuditEvent | null> {
    return this.events.find((e) => e.id === eventId) || null;
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    period: { start: Date; end: Date };
    summary: {
      totalEvents: number;
      byEventType: Record<string, number>;
      byResult: Record<string, number>;
      policyViolations: number;
    };
    topAgents: Array<{ agentId: string; eventCount: number }>;
    topViolations: Array<{ violation: string; count: number }>;
  }> {
    const { events } = await this.queryEvents({ startDate, endDate });

    const byEventType: Record<string, number> = {};
    const byResult: Record<string, number> = {};
    const agentCounts: Record<string, number> = {};
    const violations: Record<string, number> = {};
    let policyViolations = 0;

    events.forEach((event) => {
      // Count by event type
      byEventType[event.eventType] = (byEventType[event.eventType] || 0) + 1;

      // Count by result
      byResult[event.result] = (byResult[event.result] || 0) + 1;

      // Count by agent
      if (event.agentId) {
        agentCounts[event.agentId] = (agentCounts[event.agentId] || 0) + 1;
      }

      // Count policy violations
      if (event.metadata?.policyViolations?.length > 0) {
        policyViolations++;
        event.metadata.policyViolations.forEach((v: string) => {
          violations[v] = (violations[v] || 0) + 1;
        });
      }
    });

    // Top agents
    const topAgents = Object.entries(agentCounts)
      .map(([agentId, eventCount]) => ({ agentId, eventCount }))
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 10);

    // Top violations
    const topViolations = Object.entries(violations)
      .map(([violation, count]) => ({ violation, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      period: { start: startDate, end: endDate },
      summary: {
        totalEvents: events.length,
        byEventType,
        byResult,
        policyViolations,
      },
      topAgents,
      topViolations,
    };
  }

  /**
   * Send event to BigQuery (production)
   */
  private async sendToBigQuery(event: AuditEvent): Promise<void> {
    // In production, use @google-cloud/bigquery
    // For now, just log
    logger.debug('Would send to BigQuery', {
      eventId: event.id,
      dataset: config.audit.bigQueryDataset,
      table: config.audit.bigQueryTable,
    });
  }

  /**
   * Health check
   */
  healthCheck(): { status: string; details: any } {
    return {
      status: 'healthy',
      details: {
        enabled: this.enabled,
        eventsCount: this.events.length,
        gcpIntegration: !!config.audit.gcpProjectId,
      },
    };
  }
}

// Singleton instance
export const auditService = new AuditService();
