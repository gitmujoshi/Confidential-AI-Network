const express = require('express');
const router = express.Router();
const { User, Contract, Notification, CCRPAzureCredentials } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');
const CCRPAzureCredentialsService = require('../services/ccrpAzureCredentialsService');
const InfrastructureService = require('../services/infrastructureService');
const TrainingService = require('../services/trainingService');

// CCRP dashboard data
router.get('/dashboard/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user is accessing their own data or is admin
    const currentUserId = req.user.localUser?.id;
    const userPartyType = req.user.localUser?.partyType;
    
    if (currentUserId !== parseInt(userId) && userPartyType !== 'AppAdmin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get contracts where this user is CCRP
    const contracts = await Contract.findAll({
      where: { ccrpId: userId },
      include: [
        { model: User, as: 'tdp', attributes: ['name', 'email'] },
        { model: User, as: 'tdc', attributes: ['name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Mock environment data (in real implementation, this would come from environment service)
    const environments = contracts
      .filter(c => c.status === 'ACTIVE')
      .map(contract => ({
        id: contract.id,
        name: `Environment-${contract.id}`,
        status: 'RUNNING',
        resourceType: 'Confidential Computing',
        contractId: contract.contractId,
        createdAt: contract.createdAt
      }));

    // Mock resource utilization (in real implementation, this would come from monitoring service)
    const resources = {
      cpuUtilization: Math.floor(Math.random() * 100),
      memoryUtilization: Math.floor(Math.random() * 100),
      diskUtilization: Math.floor(Math.random() * 100),
      networkUtilization: Math.floor(Math.random() * 100)
    };

    // Mock attestation data (in real implementation, this would come from attestation service)
    const attestation = {
      verifiedCount: contracts.filter(c => c.attestationVerified).length,
      pendingCount: contracts.filter(c => !c.attestationVerified && c.status === 'ACTIVE').length,
      securityScore: Math.floor(Math.random() * 100),
      attestations: contracts
        .filter(c => c.status === 'ACTIVE')
        .map(contract => ({
          id: contract.id,
          contractId: contract.contractId,
          verified: contract.attestationVerified || false,
          verifiedAt: contract.attestationVerified ? contract.updatedAt : null,
          securityScore: Math.floor(Math.random() * 100)
        }))
    };

    // Mock performance metrics
    const performanceMetrics = {
      averageResponseTime: Math.floor(Math.random() * 1000),
      uptime: 99.9,
      throughput: Math.floor(Math.random() * 1000),
      errorRate: Math.random() * 0.1
    };

    // Get recent activities
    const recentActivities = await Notification.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Get CCRP user info including cloud providers
    const ccrpUser = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'cloudProviders', 'description']
    });

    res.json({
      user: ccrpUser,
      environments: environments.map(env => ({
        id: env.id,
        name: env.name,
        status: env.status,
        resourceType: env.resourceType,
        contractId: env.contractId,
        createdAt: env.createdAt
      })),
      activeContracts: contracts.filter(c => c.status === 'ACTIVE').map(contract => ({
        id: contract.id,
        contractId: contract.contractId,
        status: contract.status,
        tdpName: contract.tdp?.name,
        tdcName: contract.tdc?.name,
        createdAt: contract.createdAt
      })),
      resourceUtilization: resources,
      attestationStatus: attestation.attestations,
      securityMetrics: {
        verifiedAttestations: attestation.verifiedCount,
        pendingAttestations: attestation.pendingCount,
        securityScore: attestation.securityScore
      },
      performanceMetrics,
      recentActivities: recentActivities.map(notification => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        isRead: notification.isRead,
        createdAt: notification.createdAt
      }))
    });
  } catch (error) {
    console.error('CCRP dashboard error:', error);
    res.status(500).json({ error: 'Failed to load CCRP dashboard data' });
  }
});

// Get CCRP's environments
router.get('/environments/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const currentUserId = req.user.localUser?.id;
    const userPartyType = req.user.localUser?.partyType;
    if (currentUserId !== parseInt(userId) && userPartyType !== 'AppAdmin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const contracts = await Contract.findAll({
      where: { ccrpId: userId },
      include: [
        { model: User, as: 'tdp', attributes: ['name'] },
        { model: User, as: 'tdc', attributes: ['name'] }
      ]
    });

    // Mock environment data
    const environments = contracts
      .filter(c => c.status === 'ACTIVE')
      .map(contract => ({
        id: contract.id,
        name: `Environment-${contract.id}`,
        status: 'RUNNING',
        resourceType: 'Confidential Computing',
        contractId: contract.contractId,
        tdpName: contract.tdp?.name,
        tdcName: contract.tdc?.name,
        createdAt: contract.createdAt
      }));

    res.json({ environments });
  } catch (error) {
    console.error('CCRP environments error:', error);
    res.status(500).json({ error: 'Failed to load environments' });
  }
});

// Get CCRP's contracts
router.get('/contracts/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const currentUserId = req.user.localUser?.id;
    const userPartyType = req.user.localUser?.partyType;
    if (currentUserId !== parseInt(userId) && userPartyType !== 'AppAdmin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const contracts = await Contract.findAll({
      where: { ccrpId: userId },
      include: [
        { model: User, as: 'tdp', attributes: ['name', 'email'] },
        { model: User, as: 'tdc', attributes: ['name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ contracts });
  } catch (error) {
    console.error('CCRP contracts error:', error);
    res.status(500).json({ error: 'Failed to load contracts' });
  }
});

// Get CCRP's resources
router.get('/resources/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const currentUserId = req.user.localUser?.id;
    const userPartyType = req.user.localUser?.partyType;
    if (currentUserId !== parseInt(userId) && userPartyType !== 'AppAdmin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Mock resource data (in real implementation, this would come from monitoring service)
    const resources = {
      cpuUtilization: Math.floor(Math.random() * 100),
      memoryUtilization: Math.floor(Math.random() * 100),
      diskUtilization: Math.floor(Math.random() * 100),
      networkUtilization: Math.floor(Math.random() * 100),
      activeEnvironments: Math.floor(Math.random() * 10),
      totalCapacity: 100,
      usedCapacity: Math.floor(Math.random() * 100)
    };

    res.json({ resources });
  } catch (error) {
    console.error('CCRP resources error:', error);
    res.status(500).json({ error: 'Failed to load resources' });
  }
});

// Get CCRP's attestation data
router.get('/attestation/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const currentUserId = req.user.localUser?.id;
    const userPartyType = req.user.localUser?.partyType;
    if (currentUserId !== parseInt(userId) && userPartyType !== 'AppAdmin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const contracts = await Contract.findAll({
      where: { ccrpId: userId },
      order: [['createdAt', 'DESC']]
    });

    const attestation = {
      verifiedCount: contracts.filter(c => c.attestationVerified).length,
      pendingCount: contracts.filter(c => !c.attestationVerified && c.status === 'ACTIVE').length,
      securityScore: Math.floor(Math.random() * 100),
      attestations: contracts
        .filter(c => c.status === 'ACTIVE')
        .map(contract => ({
          id: contract.id,
          contractId: contract.contractId,
          verified: contract.attestationVerified || false,
          verifiedAt: contract.attestationVerified ? contract.updatedAt : null,
          securityScore: Math.floor(Math.random() * 100)
        }))
    };

    res.json({ attestation });
  } catch (error) {
    console.error('CCRP attestation error:', error);
    res.status(500).json({ error: 'Failed to load attestation data' });
  }
});

// Get CCRP's cloud providers
router.get('/cloud-providers/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const currentUserId = req.user.localUser?.id;
    const userPartyType = req.user.localUser?.partyType;
    if (currentUserId !== parseInt(userId) && userPartyType !== 'AppAdmin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'cloudProviders', 'description']
    });

    if (!user) {
      return res.status(404).json({ error: 'CCRP user not found' });
    }

    res.json({ 
      cloudProviders: user.cloudProviders || [],
      description: user.description 
    });
  } catch (error) {
    console.error('CCRP cloud providers error:', error);
    res.status(500).json({ error: 'Failed to load cloud providers' });
  }
});

// Update CCRP's cloud providers
router.put('/cloud-providers/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { cloudProviders, description } = req.body;
    
    const currentUserId = req.user.localUser?.id;
    const userPartyType = req.user.localUser?.partyType;
    if (currentUserId !== parseInt(userId) && userPartyType !== 'AppAdmin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'CCRP user not found' });
    }

    // Validate cloud providers
    const validProviders = ['AWS', 'Azure', 'GCP', 'OCI'];
    if (cloudProviders && !Array.isArray(cloudProviders)) {
      return res.status(400).json({ error: 'cloudProviders must be an array' });
    }

    if (cloudProviders) {
      const invalidProviders = cloudProviders.filter(p => !validProviders.includes(p));
      if (invalidProviders.length > 0) {
        return res.status(400).json({ 
          error: `Invalid cloud providers: ${invalidProviders.join(', ')}. Valid providers: ${validProviders.join(', ')}` 
        });
      }
    }

    await user.update({
      cloudProviders: cloudProviders || [],
      description: description || user.description
    });

    res.json({ 
      message: 'Cloud providers updated successfully',
      cloudProviders: user.cloudProviders,
      description: user.description
    });
  } catch (error) {
    console.error('CCRP cloud providers update error:', error);
    res.status(500).json({ error: 'Failed to update cloud providers' });
  }
});

// Get all CCRP users with cloud provider filtering
router.get('/all', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 CCRP /all endpoint - Query params:', req.query);
    console.log('🔍 CCRP /all endpoint - User:', req.user);
    
    const { cloudProvider } = req.query;
    
    // Only TDC and AppAdmin can access this endpoint
    if (req.user.localUser?.partyType !== 'TDC' && req.user.localUser?.partyType !== 'AppAdmin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    let whereClause = { partyType: 'CCRP', isActive: true };
    
    // Filter by cloud provider if specified
    if (cloudProvider) {
      whereClause.cloudProviders = {
        [Op.contains]: [cloudProvider]
      };
    }

    const ccrpUsers = await User.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'email', 'cloudProviders', 'description'],
      order: [['name', 'ASC']]
    });

    res.json({ 
      ccrpUsers: ccrpUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        cloudProviders: user.cloudProviders || [],
        description: user.description
      }))
    });
  } catch (error) {
    console.error('Get all CCRP users error:', error);
    res.status(500).json({ error: 'Failed to load CCRP users' });
  }
});

// Azure Credentials Management Routes
router.get('/azure-credentials/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user is accessing their own data or is admin
    const currentUserId = req.user.localUser?.id;
    const userPartyType = req.user.localUser?.partyType;
    
    if (currentUserId !== parseInt(userId) && userPartyType !== 'AppAdmin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const ccrpService = new CCRPAzureCredentialsService();
    const credentials = await ccrpService.getCredentials(userId);
    
    res.json({
      success: true,
      credentials: {
        id: credentials.id,
        subscriptionId: credentials.subscriptionId,
        tenantId: credentials.tenantId,
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
        authMethod: credentials.authMethod,
        defaultLocation: credentials.defaultLocation,
        defaultResourceGroupPrefix: credentials.defaultResourceGroupPrefix,
        defaultVMSize: credentials.defaultVMSize,
        defaultStorageSku: credentials.defaultStorageSku,
        defaultDatabaseSku: credentials.defaultDatabaseSku,
        vnetAddressSpace: credentials.vnetAddressSpace,
        privateSubnetPrefix: credentials.privateSubnetPrefix,
        publicSubnetPrefix: credentials.publicSubnetPrefix,
        enableEncryption: credentials.enableEncryption,
        enableMonitoring: credentials.enableMonitoring,
        enableKeyVault: credentials.enableKeyVault,
        budgetLimit: credentials.budgetLimit,
        alertThreshold: credentials.alertThreshold,
        validationStatus: credentials.validationStatus,
        lastValidated: credentials.lastValidated,
        isActive: credentials.isActive
      }
    });
  } catch (error) {
    console.error('Get Azure credentials error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/azure-credentials/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { credentials, config } = req.body;
    
    // Verify user is accessing their own data or is admin
    const currentUserId = req.user.localUser?.id;
    const userPartyType = req.user.localUser?.partyType;
    
    if (currentUserId !== parseInt(userId) && userPartyType !== 'AppAdmin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const ccrpService = new CCRPAzureCredentialsService();
    const result = await ccrpService.createOrUpdateCredentials(userId, credentials, config);
    
    res.json({
      success: true,
      credentials: result
    });
  } catch (error) {
    console.error('Create/update Azure credentials error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/azure-credentials/:userId/validate', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user is accessing their own data or is admin
    const currentUserId = req.user.localUser?.id;
    const userPartyType = req.user.localUser?.partyType;
    
    if (currentUserId !== parseInt(userId) && userPartyType !== 'AppAdmin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const ccrpService = new CCRPAzureCredentialsService();
    const credentials = await ccrpService.getCredentials(userId);
    await ccrpService.validateCredentials(credentials.id);
    
    res.json({
      success: true,
      message: 'Azure credentials validated successfully'
    });
  } catch (error) {
    console.error('Validate Azure credentials error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/azure-credentials/:userId/test', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user is accessing their own data or is admin
    const currentUserId = req.user.localUser?.id;
    const userPartyType = req.user.localUser?.partyType;
    
    if (currentUserId !== parseInt(userId) && userPartyType !== 'AppAdmin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const ccrpService = new CCRPAzureCredentialsService();
    const results = await ccrpService.testAzureConnectivity(userId);
    
    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Test Azure connectivity error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Infrastructure Management Routes
router.get('/infrastructure/environments/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user is accessing their own data or is admin
    const currentUserId = req.user.localUser?.id;
    const userPartyType = req.user.localUser?.partyType;
    
    if (currentUserId !== parseInt(userId) && userPartyType !== 'AppAdmin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const infrastructureService = new InfrastructureService();
    const environments = await infrastructureService.getEnvironments(userId);
    
    res.json({
      success: true,
      environments
    });
  } catch (error) {
    console.error('Get environments error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/infrastructure/provision/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { config } = req.body;
    
    // Verify user is accessing their own data or is admin
    const currentUserId = req.user.localUser?.id;
    const userPartyType = req.user.localUser?.partyType;
    
    if (currentUserId !== parseInt(userId) && userPartyType !== 'AppAdmin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const infrastructureService = new InfrastructureService();
    const result = await infrastructureService.provisionEnvironment(userId, config);
    
    res.json({
      success: true,
      environment: result
    });
  } catch (error) {
    console.error('Provision environment error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/infrastructure/environments/:environmentId', authenticateToken, async (req, res) => {
  try {
    const { environmentId } = req.params;
    
    const infrastructureService = new InfrastructureService();
    await infrastructureService.destroyEnvironment(environmentId);
    
    res.json({
      success: true,
      message: 'Environment destroyed successfully'
    });
  } catch (error) {
    console.error('Destroy environment error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/infrastructure/environments/:environmentId/logs', authenticateToken, async (req, res) => {
  try {
    const { environmentId } = req.params;
    
    const infrastructureService = new InfrastructureService();
    const logs = await infrastructureService.getEnvironmentLogs(environmentId);
    
    res.json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('Get environment logs error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Training Environment Routes
router.get('/training/jobs/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user is accessing their own data or is admin
    const currentUserId = req.user.localUser?.id;
    const userPartyType = req.user.localUser?.partyType;
    
    if (currentUserId !== parseInt(userId) && userPartyType !== 'AppAdmin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const trainingService = new TrainingService();
    const jobs = await trainingService.getTrainingJobs(userId);
    
    res.json({
      success: true,
      jobs
    });
  } catch (error) {
    console.error('Get training jobs error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/training/containers/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user is accessing their own data or is admin
    const currentUserId = req.user.localUser?.id;
    const userPartyType = req.user.localUser?.partyType;
    
    if (currentUserId !== parseInt(userId) && userPartyType !== 'AppAdmin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const trainingService = new TrainingService();
    const containers = await trainingService.getTrainingContainers(userId);
    
    res.json({
      success: true,
      containers
    });
  } catch (error) {
    console.error('Get training containers error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/training/deploy/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { config } = req.body;
    
    // Verify user is accessing their own data or is admin
    const currentUserId = req.user.localUser?.id;
    const userPartyType = req.user.localUser?.partyType;
    
    if (currentUserId !== parseInt(userId) && userPartyType !== 'AppAdmin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const trainingService = new TrainingService();
    const result = await trainingService.deployTrainingJob(userId, config);
    
    res.json({
      success: true,
      job: result
    });
  } catch (error) {
    console.error('Deploy training job error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/training/jobs/:jobId/stop', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const trainingService = new TrainingService();
    await trainingService.stopTrainingJob(jobId);
    
    res.json({
      success: true,
      message: 'Training job stopped successfully'
    });
  } catch (error) {
    console.error('Stop training job error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/training/jobs/:jobId', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const trainingService = new TrainingService();
    await trainingService.deleteTrainingJob(jobId);
    
    res.json({
      success: true,
      message: 'Training job deleted successfully'
    });
  } catch (error) {
    console.error('Delete training job error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/training/jobs/:jobId/logs', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const trainingService = new TrainingService();
    const logs = await trainingService.getTrainingJobLogs(jobId);
    
    res.json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('Get training job logs error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 