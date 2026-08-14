/**
 * Triage Agent
 * Interrogates SIEM/XDR feeds and compresses incoming telemetry
 */

import { BaseAgent, AgentTask } from '../shared/BaseAgent';
import { logger } from '../../backend/src/config/logger';

export interface TriageResult {
  alertId: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  confidence: number;
  category: string;
  summary: string;
  indicators: string[];
  requiresForensics: boolean;
  requiresRemediation: boolean;
  compressedTelemetry: any;
}

export class TriageAgent extends BaseAgent {
  /**
   * Process triage tasks
   */
  async processTask(task: AgentTask): Promise<TriageResult> {
    logger.info('Processing triage task', {
      agentId: this.config.id,
      taskId: task.id,
    });

    const { alert } = task.data;

    // Analyze alert
    const result = await this.analyzeAlert(alert);

    logger.info('Triage complete', {
      agentId: this.config.id,
      taskId: task.id,
      severity: result.severity,
      confidence: result.confidence,
    });

    return result;
  }

  /**
   * Analyze security alert
   */
  private async analyzeAlert(alert: any): Promise<TriageResult> {
    // Simulate SIEM/XDR analysis
    const indicators = this.extractIndicators(alert);
    const severity = this.assessSeverity(alert, indicators);
    const category = this.categorizeAlert(alert);
    const confidence = this.calculateConfidence(indicators);

    // Compress telemetry using Headroom-style approach
    const compressedTelemetry = this.compressTelemetry(alert);

    const result: TriageResult = {
      alertId: alert.id || `alert-${Date.now()}`,
      severity,
      confidence,
      category,
      summary: this.generateSummary(alert, indicators),
      indicators,
      requiresForensics: severity === 'critical' || severity === 'high',
      requiresRemediation: severity === 'critical',
      compressedTelemetry,
    };

    return result;
  }

  /**
   * Extract indicators of compromise
   */
  private extractIndicators(alert: any): string[] {
    const indicators: string[] = [];

    // Extract IPs
    if (alert.sourceIp) indicators.push(`source_ip:${alert.sourceIp}`);
    if (alert.destIp) indicators.push(`dest_ip:${alert.destIp}`);

    // Extract domains
    if (alert.domain) indicators.push(`domain:${alert.domain}`);

    // Extract file hashes
    if (alert.fileHash) indicators.push(`hash:${alert.fileHash}`);

    // Extract user accounts
    if (alert.username) indicators.push(`user:${alert.username}`);

    // Extract processes
    if (alert.process) indicators.push(`process:${alert.process}`);

    return indicators;
  }

  /**
   * Assess alert severity
   */
  private assessSeverity(
    alert: any,
    indicators: string[]
  ): 'critical' | 'high' | 'medium' | 'low' | 'info' {
    // Simple rule-based severity assessment
    if (alert.type === 'malware_detected') return 'critical';
    if (alert.type === 'unauthorized_access') return 'high';
    if (alert.type === 'suspicious_activity') return 'medium';
    if (indicators.length > 5) return 'high';
    if (indicators.length > 2) return 'medium';
    return 'low';
  }

  /**
   * Categorize alert
   */
  private categorizeAlert(alert: any): string {
    const categories = [
      'malware',
      'intrusion',
      'data_exfiltration',
      'privilege_escalation',
      'lateral_movement',
      'persistence',
      'reconnaissance',
      'other',
    ];

    // Simple categorization based on alert type
    if (alert.type?.includes('malware')) return 'malware';
    if (alert.type?.includes('access')) return 'intrusion';
    if (alert.type?.includes('data')) return 'data_exfiltration';
    if (alert.type?.includes('privilege')) return 'privilege_escalation';

    return 'other';
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(indicators: string[]): number {
    // Simple confidence calculation based on indicator count and quality
    const baseConfidence = 0.5;
    const indicatorBonus = Math.min(indicators.length * 0.1, 0.4);
    return Math.min(baseConfidence + indicatorBonus, 1.0);
  }

  /**
   * Generate alert summary
   */
  private generateSummary(alert: any, indicators: string[]): string {
    return `Alert: ${alert.type || 'Unknown'} - ${indicators.length} indicators detected`;
  }

  /**
   * Compress telemetry data (Headroom-style)
   */
  private compressTelemetry(alert: any): any {
    // Hash large fields to reduce context window usage
    const compressed: any = {
      alertType: alert.type,
      timestamp: alert.timestamp,
      indicatorCount: this.extractIndicators(alert).length,
    };

    // Include only essential fields
    if (alert.sourceIp) compressed.sourceIp = alert.sourceIp;
    if (alert.severity) compressed.severity = alert.severity;

    return compressed;
  }
}
