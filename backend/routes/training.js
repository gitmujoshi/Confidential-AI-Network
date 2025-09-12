/**
 * Training Management API Routes
 * 
 * Provides REST API endpoints for managing AI model training workflows,
 * monitoring progress, and handling training operations.
 */

const express = require('express');
const router = express.Router();
const TrainingOrchestrationService = require('../services/trainingOrchestrationService');
const TrainingMonitoringService = require('../services/trainingMonitoringService');

// Initialize services
const trainingOrchestrator = new TrainingOrchestrationService();
const monitoringService = new TrainingMonitoringService();

/**
 * Execute training workflow for a contract
 * POST /api/training/execute/:contractId
 */
router.post('/execute/:contractId', async (req, res) => {
  try {
    const { contractId } = req.params;
    const options = req.body || {};
    
    console.log(`🚀 Executing training workflow for contract: ${contractId}`);
    
    // Validate request
    if (!contractId) {
      return res.status(400).json({
        success: false,
        error: 'Contract ID is required'
      });
    }
    
    // Execute training workflow
    const trainingJob = await trainingOrchestrator.executeTrainingWorkflow(contractId, options);
    
    res.json({
      success: true,
      message: 'Training workflow started successfully',
      trainingJob: {
        jobId: trainingJob.jobId,
        contractId: trainingJob.contractId,
        status: trainingJob.status,
        environmentId: trainingJob.environmentId,
        containerId: trainingJob.containerId,
        createdAt: trainingJob.createdAt,
        startedAt: trainingJob.startedAt,
        provenanceSessionId: trainingJob.provenanceSessionId,
        metadata: trainingJob.metadata
      }
    });
    
  } catch (error) {
    console.error('Training execution failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack
    });
  }
});

/**
 * Get training job status
 * GET /api/training/status/:jobId
 */
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    console.log(`📊 Getting training status for job: ${jobId}`);
    
    // Validate request
    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required'
      });
    }
    
    // Get training job status
    const status = await trainingOrchestrator.getTrainingJobStatus(jobId);
    
    res.json({
      success: true,
      status: status
    });
    
  } catch (error) {
    console.error('Failed to get training status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get training job progress
 * GET /api/training/progress/:jobId
 */
router.get('/progress/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    console.log(`📈 Getting training progress for job: ${jobId}`);
    
    // Validate request
    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required'
      });
    }
    
    // Get training progress
    const progress = await monitoringService.getJobProgress(jobId);
    
    res.json({
      success: true,
      progress: progress
    });
    
  } catch (error) {
    console.error('Failed to get training progress:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Cancel training job
 * POST /api/training/cancel/:jobId
 */
router.post('/cancel/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { reason } = req.body;
    
    console.log(`🛑 Cancelling training job: ${jobId}`);
    
    // Validate request
    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required'
      });
    }
    
    // Cancel training job
    await trainingOrchestrator.cancelTrainingJob(jobId, reason);
    
    res.json({
      success: true,
      message: 'Training job cancelled successfully'
    });
    
  } catch (error) {
    console.error('Failed to cancel training job:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all active training jobs
 * GET /api/training/jobs
 */
router.get('/jobs', async (req, res) => {
  try {
    console.log('📋 Getting all active training jobs');
    
    // Get all active monitors
    const activeMonitors = monitoringService.getAllActiveMonitors();
    
    // Get job details for each monitor
    const jobs = await Promise.all(
      activeMonitors.map(async (monitor) => {
        try {
          const status = await trainingOrchestrator.getTrainingJobStatus(monitor.jobId);
          return status;
        } catch (error) {
          console.error(`Failed to get status for job: ${monitor.jobId}`, error);
          return {
            jobId: monitor.jobId,
            contractId: monitor.contractId,
            status: 'UNKNOWN',
            error: error.message
          };
        }
      })
    );
    
    res.json({
      success: true,
      jobs: jobs,
      total: jobs.length
    });
    
  } catch (error) {
    console.error('Failed to get training jobs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get training job logs
 * GET /api/training/logs/:jobId
 */
router.get('/logs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { lines = 100, follow = false } = req.query;
    
    console.log(`📄 Getting training logs for job: ${jobId}`);
    
    // Validate request
    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required'
      });
    }
    
    // Get training logs (mock implementation)
    const logs = await getTrainingLogs(jobId, parseInt(lines));
    
    res.json({
      success: true,
      logs: logs,
      jobId: jobId,
      lines: logs.length
    });
    
  } catch (error) {
    console.error('Failed to get training logs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get monitoring statistics
 * GET /api/training/monitoring/stats
 */
router.get('/monitoring/stats', async (req, res) => {
  try {
    console.log('📊 Getting monitoring statistics');
    
    // Get monitoring statistics
    const stats = monitoringService.getMonitoringStatistics();
    
    res.json({
      success: true,
      statistics: stats
    });
    
  } catch (error) {
    console.error('Failed to get monitoring statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get training job alerts
 * GET /api/training/alerts/:jobId
 */
router.get('/alerts/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { severity, limit = 50 } = req.query;
    
    console.log(`🚨 Getting training alerts for job: ${jobId}`);
    
    // Validate request
    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required'
      });
    }
    
    // Get training progress (which includes alerts)
    const progress = await monitoringService.getJobProgress(jobId);
    
    // Filter alerts by severity if specified
    let alerts = progress.alerts || [];
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity.toUpperCase());
    }
    
    // Limit number of alerts
    alerts = alerts.slice(-parseInt(limit));
    
    res.json({
      success: true,
      alerts: alerts,
      total: alerts.length,
      jobId: jobId
    });
    
  } catch (error) {
    console.error('Failed to get training alerts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get training job compliance status
 * GET /api/training/compliance/:jobId
 */
router.get('/compliance/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    console.log(`🔒 Getting compliance status for job: ${jobId}`);
    
    // Validate request
    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required'
      });
    }
    
    // Get training progress (which includes compliance)
    const progress = await monitoringService.getJobProgress(jobId);
    
    res.json({
      success: true,
      compliance: progress.compliance,
      jobId: jobId
    });
    
  } catch (error) {
    console.error('Failed to get compliance status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get training job performance metrics
 * GET /api/training/performance/:jobId
 */
router.get('/performance/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    console.log(`⚡ Getting performance metrics for job: ${jobId}`);
    
    // Validate request
    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required'
      });
    }
    
    // Get training progress (which includes performance)
    const progress = await monitoringService.getJobProgress(jobId);
    
    res.json({
      success: true,
      performance: progress.performance,
      jobId: jobId
    });
    
  } catch (error) {
    console.error('Failed to get performance metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Health check endpoint
 * GET /api/training/health
 */
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        orchestration: 'healthy',
        monitoring: 'healthy',
        teeProvisioning: 'healthy',
        attestation: 'healthy'
      },
      activeJobs: monitoringService.getAllActiveMonitors().length,
      uptime: process.uptime()
    };
    
    res.json({
      success: true,
      health: health
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      health: {
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * Get training logs (mock implementation)
 * @param {string} jobId - Job ID
 * @param {number} lines - Number of lines to return
 * @returns {Array} Log lines
 */
async function getTrainingLogs(jobId, lines) {
  // Mock implementation - in real implementation, this would:
  // 1. Query the training container logs
  // 2. Parse and format log entries
  // 3. Return the requested number of lines
  
  const mockLogs = [
    `[${new Date().toISOString()}] INFO: Training job ${jobId} started`,
    `[${new Date().toISOString()}] INFO: Loading training data...`,
    `[${new Date().toISOString()}] INFO: Initializing model...`,
    `[${new Date().toISOString()}] INFO: Starting epoch 1/10`,
    `[${new Date().toISOString()}] INFO: Epoch 1 - Loss: 0.8234, Accuracy: 0.6543`,
    `[${new Date().toISOString()}] INFO: Starting epoch 2/10`,
    `[${new Date().toISOString()}] INFO: Epoch 2 - Loss: 0.7123, Accuracy: 0.7234`,
    `[${new Date().toISOString()}] INFO: Starting epoch 3/10`,
    `[${new Date().toISOString()}] INFO: Epoch 3 - Loss: 0.6543, Accuracy: 0.7891`
  ];
  
  return mockLogs.slice(-lines);
}

module.exports = router;