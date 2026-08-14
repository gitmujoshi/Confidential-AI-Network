import axios from 'axios';
import { config } from '../config';
import { logger } from '../config/logger';

/**
 * Tool invocation request to be evaluated
 */
export interface ToolInvocation {
  agentId: string;
  toolName: string;
  parameters: Record<string, any>;
  environment: string;
  requestedBy: string;
  timestamp: Date;
  costEstimateUsd?: number;
  confidenceScore?: number;
  metadata?: Record<string, any>;
}

/**
 * Policy evaluation result
 */
export interface PolicyEvaluationResult {
  allowed: boolean;
  violations: string[];
  warnings: string[];
  metadata: {
    evaluationTimeMs: number;
    policiesEvaluated: string[];
  };
}

/**
 * Policy definition
 */
export interface Policy {
  id: string;
  name: string;
  description: string;
  rego: string;
  enabled: boolean;
  priority: number;
}

/**
 * Open Policy Agent Service
 * Evaluates tool invocations against deterministic policies
 */
export class OPAService {
  private readonly opaUrl: string;
  private readonly policyPath: string;
  private policies: Map<string, Policy> = new Map();

  constructor() {
    this.opaUrl = config.opa.serverUrl;
    this.policyPath = config.opa.policyPath;
    logger.info('OPA Service initialized', {
      opaUrl: this.opaUrl,
      policyPath: this.policyPath,
    });
    this.loadDefaultPolicies();
  }

  /**
   * Evaluate a tool invocation against all active policies
   */
  async evaluateToolInvocation(
    invocation: ToolInvocation
  ): Promise<PolicyEvaluationResult> {
    const startTime = Date.now();

    try {
      logger.info('Evaluating tool invocation', {
        agentId: invocation.agentId,
        toolName: invocation.toolName,
      });

      // Prepare input for OPA
      const input = {
        agent_id: invocation.agentId,
        tool_name: invocation.toolName,
        parameters: invocation.parameters,
        environment: invocation.environment,
        requested_by: invocation.requestedBy,
        timestamp: invocation.timestamp.toISOString(),
        cost_estimate_usd: invocation.costEstimateUsd || 0,
        confidence_score: invocation.confidenceScore || 1.0,
        metadata: invocation.metadata || {},
      };

      // Call OPA API
      const response = await axios.post(
        `${this.opaUrl}/v1/data/${this.policyPath}/tools/evaluate`,
        { input },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000,
        }
      );

      const result = response.data.result || {};
      const violations: string[] = result.deny || [];
      const warnings: string[] = result.warn || [];
      const allowed = violations.length === 0;

      const evaluationTimeMs = Date.now() - startTime;

      logger.info('Policy evaluation completed', {
        agentId: invocation.agentId,
        toolName: invocation.toolName,
        allowed,
        violations: violations.length,
        warnings: warnings.length,
        evaluationTimeMs,
      });

      return {
        allowed,
        violations,
        warnings,
        metadata: {
          evaluationTimeMs,
          policiesEvaluated: Array.from(this.policies.keys()),
        },
      };
    } catch (error) {
      logger.error('Policy evaluation failed', {
        error,
        agentId: invocation.agentId,
        toolName: invocation.toolName,
      });

      // Fail-closed: deny on error
      return {
        allowed: false,
        violations: [`Policy evaluation failed: ${error}`],
        warnings: [],
        metadata: {
          evaluationTimeMs: Date.now() - startTime,
          policiesEvaluated: [],
        },
      };
    }
  }

  /**
   * Register a new policy
   */
  async registerPolicy(policy: Policy): Promise<void> {
    try {
      logger.info('Registering policy', { policyId: policy.id, name: policy.name });

      // Upload policy to OPA
      await axios.put(
        `${this.opaUrl}/v1/policies/${policy.id}`,
        policy.rego,
        {
          headers: { 'Content-Type': 'text/plain' },
          timeout: 5000,
        }
      );

      // Cache policy
      this.policies.set(policy.id, policy);

      logger.info('Policy registered successfully', { policyId: policy.id });
    } catch (error) {
      logger.error('Failed to register policy', { error, policyId: policy.id });
      throw new Error(`Policy registration failed: ${error}`);
    }
  }

  /**
   * Delete a policy
   */
  async deletePolicy(policyId: string): Promise<void> {
    try {
      logger.info('Deleting policy', { policyId });

      await axios.delete(`${this.opaUrl}/v1/policies/${policyId}`, {
        timeout: 5000,
      });

      this.policies.delete(policyId);

      logger.info('Policy deleted successfully', { policyId });
    } catch (error) {
      logger.error('Failed to delete policy', { error, policyId });
      throw new Error(`Policy deletion failed: ${error}`);
    }
  }

  /**
   * Get all registered policies
   */
  getPolicies(): Policy[] {
    return Array.from(this.policies.values());
  }

  /**
   * Test a policy against sample data
   */
  async testPolicy(policyRego: string, input: any): Promise<any> {
    try {
      // Use OPA's compile API for testing
      const response = await axios.post(
        `${this.opaUrl}/v1/compile`,
        {
          query: 'data.compliancepulse.tools',
          input,
          unknowns: [],
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000,
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Policy test failed', { error });
      throw new Error(`Policy test failed: ${error}`);
    }
  }

  /**
   * Load default policies
   */
  private loadDefaultPolicies(): void {
    const defaultPolicies: Policy[] = [
      {
        id: 'prevent-production-drops',
        name: 'Prevent Production Database Drops',
        description: 'Deny DROP TABLE operations in production',
        priority: 100,
        enabled: true,
        rego: `
package compliancepulse.tools

deny[msg] {
  input.tool_name == "execute_sql"
  contains(input.parameters.query, "DROP TABLE")
  input.environment == "production"
  msg := "DROP TABLE operations not allowed in production"
}
        `,
      },
      {
        id: 'cost-threshold',
        name: 'Cost Threshold Protection',
        description: 'Deny operations exceeding cost threshold',
        priority: 90,
        enabled: true,
        rego: `
package compliancepulse.tools

deny[msg] {
  input.cost_estimate_usd > 100
  msg := sprintf("Operation exceeds cost threshold: $%.2f > $100", [input.cost_estimate_usd])
}
        `,
      },
      {
        id: 'confidence-threshold',
        name: 'Low Confidence Prevention',
        description: 'Warn on low confidence operations',
        priority: 80,
        enabled: true,
        rego: `
package compliancepulse.tools

warn[msg] {
  input.confidence_score < 0.7
  msg := sprintf("Low confidence score: %.2f", [input.confidence_score])
}
        `,
      },
      {
        id: 'rate-limiter',
        name: 'Agent Rate Limiting',
        description: 'Prevent rapid-fire tool invocations',
        priority: 70,
        enabled: true,
        rego: `
package compliancepulse.tools

# Note: In production, this would track invocation history
deny[msg] {
  input.metadata.invocations_last_minute > 100
  msg := "Rate limit exceeded: too many invocations"
}
        `,
      },
      {
        id: 'prevent-credential-exposure',
        name: 'Prevent Credential Exposure',
        description: 'Deny tools that might expose credentials',
        priority: 95,
        enabled: true,
        rego: `
package compliancepulse.tools

deny[msg] {
  input.tool_name == "execute_command"
  contains(input.parameters.command, "printenv")
  msg := "Command may expose environment variables"
}

deny[msg] {
  input.tool_name == "execute_command"
  contains(input.parameters.command, "cat /etc/passwd")
  msg := "Unauthorized access to system files"
}
        `,
      },
    ];

    defaultPolicies.forEach((policy) => {
      this.policies.set(policy.id, policy);
    });

    logger.info(`Loaded ${defaultPolicies.length} default policies`);
  }

  /**
   * Get service health status
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const response = await axios.get(`${this.opaUrl}/health`, { timeout: 2000 });
      return {
        status: response.status === 200 ? 'healthy' : 'unhealthy',
        details: {
          opaUrl: this.opaUrl,
          policiesLoaded: this.policies.size,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: String(error),
          opaUrl: this.opaUrl,
        },
      };
    }
  }
}

// Singleton instance
export const opaService = new OPAService();
