/**
 * Responder starter — proposes remediation; must pass authorizeTool() before writes.
 */
import { BaseAgent, AgentTask } from '../shared/base-agent';

export class ResponderAgent extends BaseAgent {
  async processTask(task: AgentTask): Promise<unknown> {
    const proposal = {
      tool_name: 'kubectl',
      parameters: { args: String(task.data.kubectlArgs || 'get pods -n default') },
      confidence_score: Number(task.data.confidence || 0.9),
      dry_run: task.data.dry_run !== false,
    };

    // Example: community pack uses open_gmase.tools for generic tools;
    // kubectl pack is separate — call the matching package in production wrappers.
    const auth = await this.authorizeTool({
      tool_name: 'read_logs',
      parameters: { query: 'demo' },
      dry_run: true,
    });

    if (!auth.allow) {
      return { status: 'blocked', reason: auth.reason, proposal };
    }

    return {
      status: 'proposed',
      proposal,
      note: 'Replace read_logs demo with kubectl package evaluation before real remediations.',
    };
  }
}
