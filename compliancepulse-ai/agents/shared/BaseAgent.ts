/**
 * G-MASE Agent Base Class
 * Common functionality for all agents in the swarm
 */

import { logger } from '../../backend/src/config/logger';

export interface AgentConfig {
  id: string;
  name: string;
  type: string;
  capabilities: string[];
}

export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  type: string;
  payload: any;
  timestamp: Date;
}

export interface AgentTask {
  id: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  data: any;
  assignedTo?: string;
  createdAt: Date;
  completedAt?: Date;
}

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected tasks: Map<string, AgentTask> = new Map();
  protected inbox: AgentMessage[] = [];

  constructor(config: AgentConfig) {
    this.config = config;
    logger.info('Agent initialized', {
      agentId: config.id,
      type: config.type,
      name: config.name,
    });
  }

  /**
   * Process a task
   */
  abstract processTask(task: AgentTask): Promise<any>;

  /**
   * Handle incoming message
   */
  async handleMessage(message: AgentMessage): Promise<void> {
    this.inbox.push(message);
    logger.debug('Message received', {
      agentId: this.config.id,
      messageType: message.type,
      from: message.from,
    });

    // Process message based on type
    switch (message.type) {
      case 'task_assignment':
        await this.handleTaskAssignment(message.payload);
        break;
      case 'task_result':
        await this.handleTaskResult(message.payload);
        break;
      case 'collaboration_request':
        await this.handleCollaborationRequest(message.payload);
        break;
      default:
        logger.warn('Unknown message type', {
          agentId: this.config.id,
          messageType: message.type,
        });
    }
  }

  /**
   * Send message to another agent
   */
  protected async sendMessage(
    to: string,
    type: string,
    payload: any
  ): Promise<void> {
    const message: AgentMessage = {
      id: `msg-${Date.now()}`,
      from: this.config.id,
      to,
      type,
      payload,
      timestamp: new Date(),
    };

    logger.debug('Sending message', {
      agentId: this.config.id,
      to,
      messageType: type,
    });

    // In production, use MCP or message queue
    // For now, just log
  }

  /**
   * Handle task assignment
   */
  protected async handleTaskAssignment(taskData: AgentTask): Promise<void> {
    this.tasks.set(taskData.id, taskData);
    taskData.status = 'in_progress';

    try {
      const result = await this.processTask(taskData);
      taskData.status = 'completed';
      taskData.completedAt = new Date();

      logger.info('Task completed', {
        agentId: this.config.id,
        taskId: taskData.id,
      });

      // Notify orchestrator
      await this.sendMessage('orchestrator', 'task_result', {
        taskId: taskData.id,
        result,
        status: 'completed',
      });
    } catch (error) {
      taskData.status = 'failed';
      logger.error('Task failed', {
        agentId: this.config.id,
        taskId: taskData.id,
        error,
      });

      // Notify orchestrator of failure
      await this.sendMessage('orchestrator', 'task_result', {
        taskId: taskData.id,
        error: String(error),
        status: 'failed',
      });
    }
  }

  /**
   * Handle task result from another agent
   */
  protected async handleTaskResult(result: any): Promise<void> {
    logger.debug('Task result received', {
      agentId: this.config.id,
      result,
    });
  }

  /**
   * Handle collaboration request
   */
  protected async handleCollaborationRequest(request: any): Promise<void> {
    logger.debug('Collaboration request received', {
      agentId: this.config.id,
      request,
    });
  }

  /**
   * Get agent status
   */
  getStatus(): {
    id: string;
    name: string;
    type: string;
    activeTasks: number;
    completedTasks: number;
    failedTasks: number;
  } {
    const tasks = Array.from(this.tasks.values());
    return {
      id: this.config.id,
      name: this.config.name,
      type: this.config.type,
      activeTasks: tasks.filter((t) => t.status === 'in_progress').length,
      completedTasks: tasks.filter((t) => t.status === 'completed').length,
      failedTasks: tasks.filter((t) => t.status === 'failed').length,
    };
  }
}
