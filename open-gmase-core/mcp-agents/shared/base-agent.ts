/**
 * Open-GMASE shared agent types (community starter).
 * Wire processTask() through OPA + typed schemas before any side effect.
 */

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface AgentConfig {
  id: string;
  name: string;
  type: string;
  /** SPIFFE ID once attested, e.g. spiffe://open-gmase.local/ns/secops/sa/agent-triage */
  spiffeId?: string;
  capabilities: string[];
}

export interface AgentTask {
  id: string;
  type: string;
  priority: Priority;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  data: Record<string, unknown>;
  createdAt: Date;
  completedAt?: Date;
}

export abstract class BaseAgent {
  constructor(protected readonly config: AgentConfig) {}

  abstract processTask(task: AgentTask): Promise<unknown>;

  /** Override to call OPA before tools. Default: refuse writes. */
  protected async authorizeTool(proposal: {
    tool_name: string;
    parameters: Record<string, unknown>;
    confidence_score?: number;
    dry_run?: boolean;
  }): Promise<{ allow: boolean; reason?: string }> {
    const opaUrl = process.env.OPA_URL || 'http://localhost:8181';
    try {
      const res = await fetch(`${opaUrl}/v1/data/open_gmase/tools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: {
            tool_name: proposal.tool_name,
            environment: process.env.ENVIRONMENT || 'development',
            parameters: proposal.parameters,
            confidence_score: proposal.confidence_score ?? 1,
            cost_estimate_usd: 0,
            metadata: {
              dry_run: proposal.dry_run === true,
              agent_id: this.config.spiffeId || this.config.id,
            },
          },
        }),
      });
      const body = (await res.json()) as { result?: { allow?: boolean; deny?: string[] } };
      const deny = body.result?.deny;
      if (deny && deny.length) {
        return { allow: false, reason: deny.join('; ') };
      }
      return { allow: Boolean(body.result?.allow) };
    } catch (err) {
      // Fail closed
      return {
        allow: false,
        reason: `OPA unreachable: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }
}
