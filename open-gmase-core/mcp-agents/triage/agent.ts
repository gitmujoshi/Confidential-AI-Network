/**
 * Triage starter — classifies alerts; compresses telemetry placeholders locally.
 */
import { BaseAgent, AgentTask } from '../shared/base-agent';

export interface TriageResult {
  alertId: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  confidence: number;
  category: string;
  summary: string;
  requires_hitl: boolean;
}

export class TriageAgent extends BaseAgent {
  async processTask(task: AgentTask): Promise<TriageResult> {
    const alert = (task.data.alert || {}) as Record<string, unknown>;
    const summary = String(alert.summary || alert.message || 'unspecified alert');
    return {
      alertId: String(alert.id || task.id),
      severity: 'medium',
      confidence: 0.75,
      category: String(alert.category || 'unknown'),
      summary,
      requires_hitl: true,
    };
  }
}
