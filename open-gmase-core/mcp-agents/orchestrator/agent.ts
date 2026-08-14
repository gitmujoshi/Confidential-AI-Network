/**
 * Orchestrator starter — coordinates triage/responder; no direct write APIs.
 */
import { BaseAgent, AgentTask } from '../shared/base-agent';

export class OrchestratorAgent extends BaseAgent {
  async processTask(task: AgentTask): Promise<unknown> {
    // Community edition: return a dispatch plan only.
    return {
      taskId: task.id,
      plan: [
        { agent: 'triage', action: 'classify' },
        { agent: 'responder', action: 'propose_remediation', hitl: true },
      ],
      note: 'Execute tool calls only after OPA allow + HITL for high impact.',
    };
  }
}
