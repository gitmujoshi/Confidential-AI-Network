/**
 * Orchestrator Agent
 * Coordinates swarm activities and manages Human-in-the-Loop (HITL) dispatch
 */

import { BaseAgent, AgentTask, AgentConfig } from '../shared/BaseAgent';
import { logger } from '../../backend/src/config/logger';

export interface InvestigationCase {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolved' | 'escalated';
  assignedAgents: string[];
  createdAt: Date;
  updatedAt: Date;
  requiresHumanReview: boolean;
}

export class OrchestratorAgent extends BaseAgent {
  private cases: Map<string, InvestigationCase> = new Map();
  private agentRegistry: Map<string, { id: string; type: string; status: string }> = new Map();

  constructor(config: AgentConfig) {
    super(config);
    this.initializeRegistry();
  }

  /**
   * Initialize agent registry
   */
  private initializeRegistry(): void {
    this.agentRegistry.set('triage', {
      id: 'triage-001',
      type: 'triage',
      status: 'active',
    });
    this.agentRegistry.set('forensic', {
      id: 'forensic-001',
      type: 'forensic',
      status: 'active',
    });
    this.agentRegistry.set('remediation', {
      id: 'remediation-001',
      type: 'remediation',
      status: 'active',
    });
  }

  /**
   * Start a new investigation
   */
  async startInvestigation(alert: {
    title: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    data: any;
  }): Promise<InvestigationCase> {
    const caseId = `case-${Date.now()}`;

    const investigationCase: InvestigationCase = {
      id: caseId,
      title: alert.title,
      severity: alert.severity,
      status: 'open',
      assignedAgents: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      requiresHumanReview: alert.severity === 'critical',
    };

    this.cases.set(caseId, investigationCase);

    logger.info('Investigation started', {
      caseId,
      title: alert.title,
      severity: alert.severity,
    });

    // Step 1: Assign to triage agent
    await this.assignTask('triage', {
      id: `task-${caseId}-triage`,
      type: 'triage_alert',
      priority: this.severityToPriority(alert.severity),
      status: 'pending',
      data: { caseId, alert: alert.data },
      createdAt: new Date(),
    });

    investigationCase.assignedAgents.push('triage');
    investigationCase.status = 'investigating';

    return investigationCase;
  }

  /**
   * Assign task to specific agent
   */
  private async assignTask(agentType: string, task: AgentTask): Promise<void> {
    const agent = this.agentRegistry.get(agentType);
    if (!agent) {
      throw new Error(`Agent type '${agentType}' not found in registry`);
    }

    task.assignedTo = agent.id;

    logger.info('Task assigned', {
      taskId: task.id,
      agentType,
      agentId: agent.id,
    });

    // Send task assignment message
    await this.sendMessage(agent.id, 'task_assignment', task);
  }

  /**
   * Process orchestrator tasks
   */
  async processTask(task: AgentTask): Promise<any> {
    switch (task.type) {
      case 'coordinate_investigation':
        return this.coordinateInvestigation(task.data);
      case 'escalate_to_human':
        return this.escalateToHuman(task.data);
      case 'close_case':
        return this.closeCase(task.data);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  /**
   * Coordinate multi-agent investigation
   */
  private async coordinateInvestigation(data: any): Promise<any> {
    const { caseId, triageResults } = data;

    const investigationCase = this.cases.get(caseId);
    if (!investigationCase) {
      throw new Error(`Case ${caseId} not found`);
    }

    logger.info('Coordinating investigation', { caseId });

    // Based on triage results, assign forensic analysis
    if (triageResults.requiresForensics) {
      await this.assignTask('forensic', {
        id: `task-${caseId}-forensic`,
        type: 'forensic_analysis',
        priority: investigationCase.severity as any,
        status: 'pending',
        data: { caseId, triageResults },
        createdAt: new Date(),
      });
      investigationCase.assignedAgents.push('forensic');
    }

    return { status: 'coordinating', caseId };
  }

  /**
   * Escalate to human operator (HITL)
   */
  private async escalateToHuman(data: any): Promise<any> {
    const { caseId, reason } = data;

    const investigationCase = this.cases.get(caseId);
    if (!investigationCase) {
      throw new Error(`Case ${caseId} not found`);
    }

    investigationCase.status = 'escalated';
    investigationCase.requiresHumanReview = true;
    investigationCase.updatedAt = new Date();

    logger.warn('Case escalated to human', {
      caseId,
      reason,
      severity: investigationCase.severity,
    });

    // In production, trigger HITL notification (Slack, PagerDuty, etc.)

    return {
      status: 'escalated',
      caseId,
      message: 'Human review required',
    };
  }

  /**
   * Close investigation case
   */
  private async closeCase(data: any): Promise<any> {
    const { caseId, resolution } = data;

    const investigationCase = this.cases.get(caseId);
    if (!investigationCase) {
      throw new Error(`Case ${caseId} not found`);
    }

    investigationCase.status = 'resolved';
    investigationCase.updatedAt = new Date();

    logger.info('Case closed', { caseId, resolution });

    return {
      status: 'resolved',
      caseId,
      resolution,
    };
  }

  /**
   * Convert severity to priority
   */
  private severityToPriority(
    severity: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    return severity as 'low' | 'medium' | 'high' | 'critical';
  }

  /**
   * Get all cases
   */
  getCases(): InvestigationCase[] {
    return Array.from(this.cases.values());
  }

  /**
   * Get case by ID
   */
  getCase(caseId: string): InvestigationCase | undefined {
    return this.cases.get(caseId);
  }
}
