/**
 * Environment Monitoring API Routes
 * 
 * Provides real-time monitoring and management capabilities for CCRP environments
 * including resource usage, security metrics, and environment actions.
 */

const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { requireAuth, requireRole } = require('../middleware/auth');
const TEEProvisioningService = require('../services/teeProvisioningService');
const AttestationService = require('../services/attestationService');
const ProvenanceTrackingService = require('../services/provenanceTrackingService');

// Initialize services
const teeProvisioningService = new TEEProvisioningService();
const attestationService = new AttestationService();
const provenanceService = new ProvenanceTrackingService();

/**
 * Get environment metrics
 * GET /api/infrastructure/environments/:environmentId/metrics
 */
router.get('/environments/:environmentId/metrics',
  requireAuth,
  requireRole(['CCRP', 'AppAdmin']),
  [
    param('environmentId').isString().notEmpty().withMessage('Environment ID is required'),
    query('timeRange').optional().isIn(['1h', '24h', '7d', '30d']).withMessage('Invalid time range'),
    query('metricType').optional().isIn(['cpu', 'memory', 'storage', 'network', 'security']).withMessage('Invalid metric type')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { environmentId } = req.params;
      const { timeRange = '1h', metricType } = req.query;

      console.log(`📊 Getting metrics for environment ${environmentId}, range: ${timeRange}`);

      // Get environment details
      const environment = await teeProvisioningService.getEnvironmentById(environmentId);
      if (!environment) {
        return res.status(404).json({
          success: false,
          message: 'Environment not found'
        });
      }

      // Generate real-time metrics (in production, this would come from monitoring systems)
      const currentTime = new Date();
      const metrics = await generateEnvironmentMetrics(environment, timeRange, metricType);

      res.json({
        success: true,
        message: 'Environment metrics retrieved successfully',
        data: {
          environmentId,
          timeRange,
          timestamp: currentTime,
          metrics
        }
      });

    } catch (error) {
      console.error('❌ Failed to get environment metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get environment metrics',
        error: error.message
      });
    }
  }
);

/**
 * Perform environment action (start, stop, restart, configure)
 * POST /api/infrastructure/environments/:environmentId/actions/:action
 */
router.post('/environments/:environmentId/actions/:action',
  requireAuth,
  requireRole(['CCRP', 'AppAdmin']),
  [
    param('environmentId').isString().notEmpty().withMessage('Environment ID is required'),
    param('action').isIn(['start', 'stop', 'restart', 'configure', 'scale']).withMessage('Invalid action'),
    body('params').optional().isObject().withMessage('Action params must be an object'),
    body('reason').optional().isString().withMessage('Reason must be a string')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { environmentId, action } = req.params;
      const { params = {}, reason } = req.body;
      const { user } = req;

      console.log(`🔧 Performing action '${action}' on environment ${environmentId}`);

      // Get environment details
      const environment = await teeProvisioningService.getEnvironmentById(environmentId);
      if (!environment) {
        return res.status(404).json({
          success: false,
          message: 'Environment not found'
        });
      }

      // Check if user has permission to perform this action on this environment
      if (environment.ownerId !== user.id && user.role !== 'AppAdmin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this environment'
        });
      }

      // Initialize provenance tracking for the action
      const sessionId = `env_action_${environmentId}_${Date.now()}`;
      const provenanceSession = await provenanceService.initializeProvenanceTracking({
        jobId: sessionId,
        contractId: 'environment_management',
        environmentId,
        userId: user.id,
        operation: `ENVIRONMENT_${action.toUpperCase()}`
      });

      // Create provenance node for the action
      await provenanceService.createProvenanceNode({
        nodeId: `env_action_${sessionId}`,
        type: 'EXECUTION',
        content: {
          operation: `ENVIRONMENT_${action.toUpperCase()}`,
          environmentId,
          actionParams: params,
          reason,
          requestedBy: user.id,
          timestamp: new Date()
        },
        metadata: {
          operation: 'ENVIRONMENT_ACTION',
          action,
          environmentName: environment.name,
          userRole: user.role
        }
      });

      // Perform the action
      let actionResult;
      switch (action) {
        case 'start':
          actionResult = await startEnvironment(environment, params, user);
          break;
        case 'stop':
          actionResult = await stopEnvironment(environment, params, user);
          break;
        case 'restart':
          actionResult = await restartEnvironment(environment, params, user);
          break;
        case 'configure':
          actionResult = await configureEnvironment(environment, params, user);
          break;
        case 'scale':
          actionResult = await scaleEnvironment(environment, params, user);
          break;
        default:
          throw new Error(`Unsupported action: ${action}`);
      }

      // Create provenance node for action completion
      await provenanceService.createProvenanceNode({
        nodeId: `env_action_complete_${sessionId}`,
        type: 'EXECUTION',
        content: {
          operation: `ENVIRONMENT_${action.toUpperCase()}_COMPLETE`,
          environmentId,
          actionResult,
          completedAt: new Date()
        },
        parentNodes: [`env_action_${sessionId}`],
        metadata: {
          operation: 'ENVIRONMENT_ACTION_COMPLETE',
          success: actionResult.success,
          duration: actionResult.duration
        }
      });

      res.json({
        success: true,
        message: `Environment ${action} completed successfully`,
        data: {
          environmentId,
          action,
          result: actionResult,
          provenanceSessionId: provenanceSession.sessionId,
          timestamp: new Date()
        }
      });

    } catch (error) {
      console.error(`❌ Environment action ${req.params.action} failed:`, error);
      res.status(500).json({
        success: false,
        message: `Failed to ${req.params.action} environment`,
        error: error.message
      });
    }
  }
);

/**
 * Get environment security status
 * GET /api/infrastructure/environments/:environmentId/security
 */
router.get('/environments/:environmentId/security',
  requireAuth,
  requireRole(['CCRP', 'AppAdmin']),
  [
    param('environmentId').isString().notEmpty().withMessage('Environment ID is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { environmentId } = req.params;

      console.log(`🔒 Getting security status for environment ${environmentId}`);

      // Get environment details
      const environment = await teeProvisioningService.getEnvironmentById(environmentId);
      if (!environment) {
        return res.status(404).json({
          success: false,
          message: 'Environment not found'
        });
      }

      // Get attestation status
      const attestationStatus = await attestationService.verifyHardwareAttestation(environmentId);

      // Generate security metrics
      const securityStatus = {
        environmentId,
        teeEnabled: environment.configuration?.tee?.enabled || false,
        attestationVerified: attestationStatus.verified,
        attestationLevel: attestationStatus.attestationLevel,
        networkIsolated: environment.configuration?.network?.isolated || false,
        encryptionAtRest: environment.configuration?.security?.encryptionAtRest || false,
        encryptionInTransit: environment.configuration?.security?.encryptionInTransit || false,
        auditLogging: environment.configuration?.security?.auditLogging || false,
        vulnerabilityScanning: {
          enabled: true,
          lastScan: new Date(Date.now() - 24 * 60 * 60 * 1000), // Mock: 24 hours ago
          threatLevel: 'LOW',
          issuesFound: 0
        },
        complianceStatus: {
          gdpr: true,
          hipaa: environment.configuration?.compliance?.hipaa || false,
          sox: environment.configuration?.compliance?.sox || false,
          pci: environment.configuration?.compliance?.pci || false
        },
        accessControl: {
          rbacEnabled: true,
          mfaRequired: environment.configuration?.security?.mfaRequired || false,
          sessionTimeout: environment.configuration?.security?.sessionTimeout || 3600
        },
        lastSecurityAudit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Mock: 7 days ago
        securityScore: calculateSecurityScore(environment, attestationStatus)
      };

      res.json({
        success: true,
        message: 'Environment security status retrieved successfully',
        data: securityStatus
      });

    } catch (error) {
      console.error('❌ Failed to get environment security status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get environment security status',
        error: error.message
      });
    }
  }
);

/**
 * Get environment resource usage history
 * GET /api/infrastructure/environments/:environmentId/usage-history
 */
router.get('/environments/:environmentId/usage-history',
  requireAuth,
  requireRole(['CCRP', 'AppAdmin']),
  [
    param('environmentId').isString().notEmpty().withMessage('Environment ID is required'),
    query('timeRange').optional().isIn(['1h', '6h', '24h', '7d', '30d']).withMessage('Invalid time range'),
    query('granularity').optional().isIn(['1m', '5m', '15m', '1h', '1d']).withMessage('Invalid granularity')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { environmentId } = req.params;
      const { timeRange = '24h', granularity = '15m' } = req.query;

      console.log(`📈 Getting usage history for environment ${environmentId}`);

      // Get environment details
      const environment = await teeProvisioningService.getEnvironmentById(environmentId);
      if (!environment) {
        return res.status(404).json({
          success: false,
          message: 'Environment not found'
        });
      }

      // Generate historical usage data (in production, this would come from time-series database)
      const usageHistory = await generateUsageHistory(environment, timeRange, granularity);

      res.json({
        success: true,
        message: 'Environment usage history retrieved successfully',
        data: {
          environmentId,
          timeRange,
          granularity,
          history: usageHistory
        }
      });

    } catch (error) {
      console.error('❌ Failed to get environment usage history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get environment usage history',
        error: error.message
      });
    }
  }
);

/**
 * Get aggregated monitoring dashboard data
 * GET /api/infrastructure/environments/monitoring/dashboard
 */
router.get('/environments/monitoring/dashboard',
  requireAuth,
  requireRole(['CCRP', 'AppAdmin']),
  [
    query('userId').optional().isString().withMessage('User ID must be a string')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { userId } = req.query;
      const { user } = req;

      // Determine which environments to include
      const targetUserId = user.role === 'AppAdmin' && userId ? userId : user.id;

      console.log(`📊 Getting monitoring dashboard for user ${targetUserId}`);

      // Get all environments for the user
      const environments = await teeProvisioningService.getUserEnvironments(targetUserId);

      // Calculate aggregate metrics
      const aggregateMetrics = {
        totalEnvironments: environments.length,
        activeEnvironments: environments.filter(env => env.status === 'ACTIVE').length,
        provisioningEnvironments: environments.filter(env => env.status === 'PROVISIONING').length,
        errorEnvironments: environments.filter(env => env.status === 'ERROR').length,
        totalCpuCores: environments.reduce((sum, env) => sum + (env.resources?.cpuCores || 0), 0),
        totalMemoryGB: environments.reduce((sum, env) => sum + (env.resources?.memoryGB || 0), 0),
        totalStorageGB: environments.reduce((sum, env) => sum + (env.resources?.storageGB || 0), 0),
        averageCpuUsage: 0,
        averageMemoryUsage: 0,
        securityScore: 0
      };

      // Calculate usage averages
      if (environments.length > 0) {
        const totalCpuUsage = environments.reduce((sum, env) => sum + (env.monitoring?.cpuUsage || 0), 0);
        const totalMemoryUsage = environments.reduce((sum, env) => sum + (env.monitoring?.memoryUsage || 0), 0);
        const totalSecurityScore = environments.reduce((sum, env) => sum + (env.security?.score || 0), 0);
        
        aggregateMetrics.averageCpuUsage = Math.round(totalCpuUsage / environments.length);
        aggregateMetrics.averageMemoryUsage = Math.round(totalMemoryUsage / environments.length);
        aggregateMetrics.securityScore = Math.round(totalSecurityScore / environments.length);
      }

      // Get recent events
      const recentEvents = await getRecentEnvironmentEvents(targetUserId, 10);

      // Get resource trends
      const resourceTrends = await getResourceTrends(environments);

      res.json({
        success: true,
        message: 'Monitoring dashboard data retrieved successfully',
        data: {
          aggregateMetrics,
          environments: environments.map(env => ({
            id: env.id,
            name: env.name,
            status: env.status,
            type: env.type,
            provider: env.provider,
            region: env.region,
            resources: env.resources,
            monitoring: env.monitoring,
            security: env.security
          })),
          recentEvents,
          resourceTrends,
          lastUpdated: new Date()
        }
      });

    } catch (error) {
      console.error('❌ Failed to get monitoring dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get monitoring dashboard',
        error: error.message
      });
    }
  }
);

// Helper functions

async function generateEnvironmentMetrics(environment, timeRange, metricType) {
  // Mock metrics generation - in production, this would query monitoring systems
  const now = Date.now();
  const intervalMs = timeRange === '1h' ? 5 * 60 * 1000 : // 5 minutes
                    timeRange === '24h' ? 60 * 60 * 1000 : // 1 hour
                    timeRange === '7d' ? 6 * 60 * 60 * 1000 : // 6 hours
                    24 * 60 * 60 * 1000; // 1 day

  const points = timeRange === '1h' ? 12 : timeRange === '24h' ? 24 : 28;
  
  const metrics = {
    cpuUsage: Math.floor(Math.random() * 80) + 10, // 10-90%
    memoryUsage: Math.floor(Math.random() * 70) + 15, // 15-85%
    storageUsage: Math.floor(Math.random() * 60) + 20, // 20-80%
    networkIn: Math.floor(Math.random() * 1000) + 100, // 100-1100 MB/s
    networkOut: Math.floor(Math.random() * 800) + 50, // 50-850 MB/s
    iops: Math.floor(Math.random() * 10000) + 1000, // 1000-11000 IOPS
    temperature: Math.floor(Math.random() * 20) + 45, // 45-65°C
    powerUsage: Math.floor(Math.random() * 300) + 200, // 200-500W
    timeSeries: Array.from({ length: points }, (_, i) => ({
      timestamp: new Date(now - (points - i - 1) * intervalMs),
      cpuUsage: Math.floor(Math.random() * 80) + 10,
      memoryUsage: Math.floor(Math.random() * 70) + 15,
      networkIn: Math.floor(Math.random() * 1000) + 100,
      networkOut: Math.floor(Math.random() * 800) + 50
    }))
  };

  if (metricType) {
    return { [metricType]: metrics[metricType], timeSeries: metrics.timeSeries };
  }

  return metrics;
}

async function startEnvironment(environment, params, user) {
  const startTime = Date.now();
  
  // Simulate environment startup process
  console.log(`▶️ Starting environment ${environment.name}`);
  
  // Mock startup delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Update environment status (in production, this would update the database)
  environment.status = 'ACTIVE';
  environment.lastStarted = new Date();
  environment.startedBy = user.id;

  return {
    success: true,
    action: 'start',
    previousStatus: 'STOPPED',
    currentStatus: 'ACTIVE',
    duration: Date.now() - startTime,
    details: {
      startupTime: '45 seconds',
      healthCheck: 'PASSED',
      servicesStarted: ['tee-service', 'monitoring-agent', 'attestation-service']
    }
  };
}

async function stopEnvironment(environment, params, user) {
  const startTime = Date.now();
  
  console.log(`⏹️ Stopping environment ${environment.name}`);
  
  // Mock stop delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  environment.status = 'STOPPED';
  environment.lastStopped = new Date();
  environment.stoppedBy = user.id;

  return {
    success: true,
    action: 'stop',
    previousStatus: 'ACTIVE',
    currentStatus: 'STOPPED',
    duration: Date.now() - startTime,
    details: {
      shutdownTime: '30 seconds',
      dataBackedUp: true,
      servicesStopped: ['tee-service', 'monitoring-agent', 'attestation-service']
    }
  };
}

async function restartEnvironment(environment, params, user) {
  const startTime = Date.now();
  
  console.log(`🔄 Restarting environment ${environment.name}`);
  
  // Mock restart delay
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  environment.status = 'ACTIVE';
  environment.lastRestarted = new Date();
  environment.restartedBy = user.id;

  return {
    success: true,
    action: 'restart',
    previousStatus: environment.status,
    currentStatus: 'ACTIVE',
    duration: Date.now() - startTime,
    details: {
      restartTime: '75 seconds',
      configReloaded: true,
      attestationRenewed: true
    }
  };
}

async function configureEnvironment(environment, params, user) {
  const startTime = Date.now();
  
  console.log(`⚙️ Configuring environment ${environment.name}`);
  
  // Mock configuration update
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  environment.lastConfigured = new Date();
  environment.configuredBy = user.id;
  
  if (params.resources) {
    environment.resources = { ...environment.resources, ...params.resources };
  }
  
  if (params.security) {
    environment.security = { ...environment.security, ...params.security };
  }

  return {
    success: true,
    action: 'configure',
    duration: Date.now() - startTime,
    details: {
      updatedSettings: Object.keys(params),
      requiresRestart: params.resources ? true : false,
      configVersion: '1.2.3'
    }
  };
}

async function scaleEnvironment(environment, params, user) {
  const startTime = Date.now();
  
  console.log(`📈 Scaling environment ${environment.name}`);
  
  // Mock scaling operation
  await new Promise(resolve => setTimeout(resolve, 2500));
  
  const oldResources = { ...environment.resources };
  
  if (params.cpuCores) environment.resources.cpuCores = params.cpuCores;
  if (params.memoryGB) environment.resources.memoryGB = params.memoryGB;
  if (params.storageGB) environment.resources.storageGB = params.storageGB;
  
  environment.lastScaled = new Date();
  environment.scaledBy = user.id;

  return {
    success: true,
    action: 'scale',
    duration: Date.now() - startTime,
    details: {
      oldResources,
      newResources: environment.resources,
      scalingTime: '2.5 minutes',
      downtime: '0 seconds'
    }
  };
}

function calculateSecurityScore(environment, attestationStatus) {
  let score = 0;
  
  if (environment.configuration?.tee?.enabled) score += 25;
  if (attestationStatus.verified) score += 25;
  if (environment.configuration?.network?.isolated) score += 15;
  if (environment.configuration?.security?.encryptionAtRest) score += 10;
  if (environment.configuration?.security?.encryptionInTransit) score += 10;
  if (environment.configuration?.security?.auditLogging) score += 10;
  if (environment.configuration?.security?.mfaRequired) score += 5;
  
  return Math.min(score, 100);
}

async function generateUsageHistory(environment, timeRange, granularity) {
  // Mock historical data generation
  const now = Date.now();
  const granularityMs = granularity === '1m' ? 60 * 1000 :
                        granularity === '5m' ? 5 * 60 * 1000 :
                        granularity === '15m' ? 15 * 60 * 1000 :
                        granularity === '1h' ? 60 * 60 * 1000 :
                        24 * 60 * 60 * 1000;
  
  const timeRangeMs = timeRange === '1h' ? 60 * 60 * 1000 :
                      timeRange === '6h' ? 6 * 60 * 60 * 1000 :
                      timeRange === '24h' ? 24 * 60 * 60 * 1000 :
                      timeRange === '7d' ? 7 * 24 * 60 * 60 * 1000 :
                      30 * 24 * 60 * 60 * 1000;

  const points = Math.floor(timeRangeMs / granularityMs);
  
  return Array.from({ length: points }, (_, i) => ({
    timestamp: new Date(now - (points - i - 1) * granularityMs),
    cpuUsage: Math.floor(Math.random() * 80) + 10,
    memoryUsage: Math.floor(Math.random() * 70) + 15,
    storageUsage: Math.floor(Math.random() * 60) + 20,
    networkIn: Math.floor(Math.random() * 1000) + 100,
    networkOut: Math.floor(Math.random() * 800) + 50,
    iops: Math.floor(Math.random() * 10000) + 1000
  }));
}

async function getRecentEnvironmentEvents(userId, limit) {
  // Mock recent events
  return Array.from({ length: limit }, (_, i) => ({
    id: `event_${i}`,
    timestamp: new Date(Date.now() - i * 60 * 60 * 1000), // Hours ago
    type: ['environment_started', 'environment_stopped', 'scaling_completed', 'security_scan'][i % 4],
    environmentName: `Environment ${i + 1}`,
    message: `Environment action completed successfully`,
    severity: ['info', 'warning', 'success'][i % 3]
  }));
}

async function getResourceTrends(environments) {
  // Mock resource trends
  return {
    cpuTrend: {
      current: environments.reduce((sum, env) => sum + (env.monitoring?.cpuUsage || 0), 0) / environments.length,
      change: Math.floor(Math.random() * 20) - 10, // -10 to +10%
      period: '24h'
    },
    memoryTrend: {
      current: environments.reduce((sum, env) => sum + (env.monitoring?.memoryUsage || 0), 0) / environments.length,
      change: Math.floor(Math.random() * 15) - 7, // -7 to +8%
      period: '24h'
    },
    costTrend: {
      current: environments.length * 125, // Mock cost per environment
      change: Math.floor(Math.random() * 30) - 15, // -15 to +15%
      period: '24h'
    }
  };
}

module.exports = router;
