import { z } from 'zod';
import { logger } from '../config/logger';

/**
 * BAML Schema Definition
 */
export interface BAMLSchema {
  name: string;
  description: string;
  schema: z.ZodType<any>;
}

/**
 * Schema validation result
 */
export interface ValidationResult {
  valid: boolean;
  data?: any;
  errors?: string[];
}

/**
 * BAML Service
 * Type-safe schema parsing to prevent injection attacks
 * Compiles model outputs into strongly typed schemas
 */
export class BAMLService {
  private schemas: Map<string, BAMLSchema> = new Map();

  constructor() {
    logger.info('BAML Service initialized');
    this.registerDefaultSchemas();
  }

  /**
   * Register a schema
   */
  registerSchema(schema: BAMLSchema): void {
    this.schemas.set(schema.name, schema);
    logger.info('Schema registered', { name: schema.name });
  }

  /**
   * Validate data against a schema
   */
  validate(schemaName: string, data: any): ValidationResult {
    try {
      const schema = this.schemas.get(schemaName);
      if (!schema) {
        return {
          valid: false,
          errors: [`Schema '${schemaName}' not found`],
        };
      }

      const result = schema.schema.safeParse(data);

      if (result.success) {
        return {
          valid: true,
          data: result.data,
        };
      } else {
        const errors = result.error.errors.map((err) => {
          return `${err.path.join('.')}: ${err.message}`;
        });

        return {
          valid: false,
          errors,
        };
      }
    } catch (error) {
      logger.error('Schema validation error', { error, schemaName });
      return {
        valid: false,
        errors: [String(error)],
      };
    }
  }

  /**
   * Parse and validate tool parameters
   */
  parseToolParameters(
    toolName: string,
    rawParameters: any
  ): ValidationResult {
    const schemaName = `tool:${toolName}`;
    return this.validate(schemaName, rawParameters);
  }

  /**
   * Parse and validate agent output
   */
  parseAgentOutput(
    outputType: string,
    rawOutput: any
  ): ValidationResult {
    const schemaName = `output:${outputType}`;
    return this.validate(schemaName, rawOutput);
  }

  /**
   * Get all registered schemas
   */
  getSchemas(): BAMLSchema[] {
    return Array.from(this.schemas.values());
  }

  /**
   * Register default schemas for common tool types
   */
  private registerDefaultSchemas(): void {
    // SQL Execution Tool Schema
    this.registerSchema({
      name: 'tool:execute_sql',
      description: 'Schema for SQL execution parameters',
      schema: z.object({
        query: z.string().min(1).max(10000),
        database: z.string().min(1),
        timeout: z.number().int().positive().optional(),
        readonly: z.boolean().optional(),
      }),
    });

    // Command Execution Tool Schema
    this.registerSchema({
      name: 'tool:execute_command',
      description: 'Schema for command execution parameters',
      schema: z.object({
        command: z.string().min(1).max(1000),
        args: z.array(z.string()).optional(),
        workdir: z.string().optional(),
        timeout: z.number().int().positive().optional(),
        env: z.record(z.string()).optional(),
      }),
    });

    // HTTP Request Tool Schema
    this.registerSchema({
      name: 'tool:http_request',
      description: 'Schema for HTTP request parameters',
      schema: z.object({
        url: z.string().url(),
        method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
        headers: z.record(z.string()).optional(),
        body: z.any().optional(),
        timeout: z.number().int().positive().optional(),
      }),
    });

    // LLM Inference Tool Schema
    this.registerSchema({
      name: 'tool:llm_inference',
      description: 'Schema for LLM inference parameters',
      schema: z.object({
        model: z.string().min(1),
        prompt: z.string().min(1).max(100000),
        temperature: z.number().min(0).max(2).optional(),
        max_tokens: z.number().int().positive().optional(),
        top_p: z.number().min(0).max(1).optional(),
        stop_sequences: z.array(z.string()).optional(),
      }),
    });

    // File Operation Tool Schema
    this.registerSchema({
      name: 'tool:file_operation',
      description: 'Schema for file operation parameters',
      schema: z.object({
        operation: z.enum(['read', 'write', 'delete', 'list']),
        path: z.string().min(1),
        content: z.string().optional(),
        encoding: z.enum(['utf8', 'base64']).optional(),
      }),
    });

    // Security Event Output Schema
    this.registerSchema({
      name: 'output:security_event',
      description: 'Schema for security event analysis output',
      schema: z.object({
        severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
        confidence: z.number().min(0).max(1),
        category: z.string(),
        description: z.string(),
        indicators: z.array(z.string()),
        recommended_actions: z.array(z.string()),
        affected_assets: z.array(z.string()).optional(),
      }),
    });

    // Remediation Plan Output Schema
    this.registerSchema({
      name: 'output:remediation_plan',
      description: 'Schema for remediation plan output',
      schema: z.object({
        issue_id: z.string(),
        title: z.string(),
        description: z.string(),
        steps: z.array(
          z.object({
            order: z.number().int().positive(),
            action: z.string(),
            command: z.string().optional(),
            risk_level: z.enum(['low', 'medium', 'high']),
            requires_approval: z.boolean(),
          })
        ),
        estimated_duration_minutes: z.number().int().positive(),
        rollback_plan: z.string(),
      }),
    });

    // Investigation Result Output Schema
    this.registerSchema({
      name: 'output:investigation_result',
      description: 'Schema for investigation result output',
      schema: z.object({
        case_id: z.string(),
        status: z.enum(['open', 'investigating', 'resolved', 'false_positive']),
        findings: z.array(
          z.object({
            type: z.string(),
            description: z.string(),
            evidence: z.array(z.string()),
            severity: z.enum(['critical', 'high', 'medium', 'low']),
          })
        ),
        timeline: z.array(
          z.object({
            timestamp: z.string().datetime(),
            event: z.string(),
            source: z.string(),
          })
        ),
        conclusion: z.string(),
        requires_escalation: z.boolean(),
      }),
    });

    logger.info(`Registered ${this.schemas.size} default schemas`);
  }

  /**
   * Health check
   */
  healthCheck(): { status: string; details: any } {
    return {
      status: 'healthy',
      details: {
        schemasLoaded: this.schemas.size,
      },
    };
  }
}

// Singleton instance
export const bamlService = new BAMLService();
