const express = require('express');
const router = express.Router();
const { User, Contract, Notification, TSPAzureCredentials } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { normalizeTspCloudProviders } = require('../utils/tspCloudProviders');
const { Op } = require('sequelize');
const TSPAzureCredentialsService = require('../services/tspAzureCredentialsService');
const InfrastructureService = require('../services/infrastructureService');
const TrainingService = require('../services/trainingService');

// TSP dashboard data
router.get('/dashboard/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Debug logging
    console.log('🔍 [TSP Dashboard] Request details:', {
      requestedUserId: userId,
      currentUserId: req.user.localUser?.id,
      userPartyType: req.user.localUser?.partyType,
      authType: req.user.authType,
      hasLocalUser: !!req.user.localUser
    });
    
    // Verify user is accessing their own data or is admin
    const currentUserId = req.user.localUser?.id;
    const userPartyType = req.user.localUser?.partyType;
    
    if (currentUserId !== parseInt(userId) && userPartyType !== 'AppAdmin') {
      console.log('❌ [TSP Dashboard] Access denied:', {
        currentUserId,
        requestedUserId: parseInt(userId),
        userPartyType,
        isAdmin: userPartyType === 'AppAdmin'
      });
      return res.status(403).json({ error: 'Access denied' });
    }

    console.log('✅ [TSP Dashboard] Access granted for user:', userId);

    // Check if user is a TSP
    if (userPartyType !== 'TSP' && userPartyType !== 'AppAdmin') {
      console.log('❌ [TSP Dashboard] User is not TSP:', userPartyType);
      return res.status(403).json({ 
        error: 'Access denied. Only TSP users can access this dashboard.',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Get contracts where this user is TSP
    let contracts;
    try {
      contracts = await Contract.findAll({
        where: { tspId: userId },
        order: [['createdAt', 'DESC']]
      });
      console.log('📊 [TSP Dashboard] Contracts found:', contracts.length);
    } catch (dbError) {
      console.error('❌ [TSP Dashboard] Database error:', dbError);
      return res.status(500).json({ 
        error: 'Database error while fetching contracts',
        details: dbError.message
      });
    }

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

    console.log('📊 [TSP Dashboard] Environments created:', environments.length);

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

    // Get TSP user info including cloud providers
    const tspUser = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'cloudProviders', 'description']
    });

    res.json({
      user: tspUser,
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
    console.error('❌ [TSP Dashboard] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    console.error('TSP dashboard error:', error);
    res.status(500).json({ error: 'Failed to load TSP dashboard data' });
  }
});

// Get TSP's environments
router.get('/environments/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const currentUserId = req.user.localUser?.id;
    const userPartyType = req.user.localUser?.partyType;
    if (currentUserId !== parseInt(userId) && userPartyType !== 'AppAdmin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const contracts = await Contract.findAll({
      where: { tspId: userId },
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
    console.error('TSP environments error:', error);
    res.status(500).json({ error: 'Failed to load environments' });
  }
});

// Get TSP's contracts
router.get('/contracts/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const currentUserId = req.user.localUser?.id;
    const userPartyType = req.user.localUser?.partyType;
    if (currentUserId !== parseInt(userId) && userPartyType !== 'AppAdmin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const contracts = await Contract.findAll({
      where: { tspId: userId },
      include: [
        { model: User, as: 'tdp', attributes: ['name', 'email'] },
        { model: User, as: 'tdc', attributes: ['name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ contracts });
  } catch (error) {
    console.error('TSP contracts error:', error);
    res.status(500).json({ error: 'Failed to load contracts' });
  }
});

// Get TSP's resources
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
    console.error('TSP resources error:', error);
    res.status(500).json({ error: 'Failed to load resources' });
  }
});

// Get TSP's attestation data
router.get('/attestation/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const currentUserId = req.user.localUser?.id;
    const userPartyType = req.user.localUser?.partyType;
    if (currentUserId !== parseInt(userId) && userPartyType !== 'AppAdmin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const contracts = await Contract.findAll({
      where: { tspId: userId },
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
    console.error('TSP attestation error:', error);
    res.status(500).json({ error: 'Failed to load attestation data' });
  }
});

// Get TSP's cloud providers
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
      return res.status(404).json({ error: 'TSP user not found' });
    }

    res.json({ 
      cloudProviders: user.cloudProviders || [],
      description: user.description 
    });
  } catch (error) {
    console.error('TSP cloud providers error:', error);
    res.status(500).json({ error: 'Failed to load cloud providers' });
  }
});

// Update TSP's cloud providers
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
      return res.status(404).json({ error: 'TSP user not found' });
    }

    const updatePayload = {
      description: description !== undefined ? description : user.description,
    };

    if (cloudProviders !== undefined) {
      const normalized = normalizeTspCloudProviders(cloudProviders);
      if (!normalized.ok) {
        return res.status(400).json({ error: normalized.error });
      }
      updatePayload.cloudProviders = normalized.value;
    }

    await user.update(updatePayload);

    res.json({ 
      message: 'Cloud providers updated successfully',
      cloudProviders: user.cloudProviders,
      description: user.description
    });
  } catch (error) {
    console.error('TSP cloud providers update error:', error);
    res.status(500).json({ error: 'Failed to update cloud providers' });
  }
});

// Get all TSP users with cloud provider filtering
router.get('/all', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 TSP /all endpoint - Query params:', req.query);
    console.log('🔍 TSP /all endpoint - User:', req.user);
    
    const { cloudProvider } = req.query;
    
    // Only TDC and AppAdmin can access this endpoint
    if (req.user.localUser?.partyType !== 'TDC' && req.user.localUser?.partyType !== 'AppAdmin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    let whereClause = { partyType: 'TSP', isActive: true };
    
    // Filter by cloud provider if specified
    if (cloudProvider) {
      whereClause.cloudProviders = {
        [Op.contains]: [cloudProvider]
      };
    }

    const tspUsers = await User.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'email', 'cloudProviders', 'description'],
      order: [['name', 'ASC']]
    });

    res.json({ 
      tspUsers: tspUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        cloudProviders: user.cloudProviders || [],
        description: user.description
      }))
    });
  } catch (error) {
    console.error('Get all TSP users error:', error);
    res.status(500).json({ error: 'Failed to load TSP users' });
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

    const ccrpService = new TSPAzureCredentialsService();
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

    const ccrpService = new TSPAzureCredentialsService();
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

    const ccrpService = new TSPAzureCredentialsService();
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

    const ccrpService = new TSPAzureCredentialsService();
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

// Terraform Infrastructure Routes
router.post('/infrastructure/terraform/provision/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { contractId, config } = req.body;
    
    // Verify user is TSP
    const user = await User.findByPk(userId);
    if (!user || user.partyType !== 'TSP') {
      return res.status(403).json({ error: 'Access denied. TSP role required.' });
    }

    const InfrastructureService = require('../services/infrastructureService');
    const infrastructureService = new InfrastructureService();
    
    const result = await infrastructureService.createTrainingEnvironmentWithTerraform(contractId, config);
    res.json(result);
  } catch (error) {
    console.error('Error provisioning infrastructure with Terraform:', error);
    res.status(500).json({ error: 'Failed to provision infrastructure with Terraform' });
  }
});

router.delete('/infrastructure/terraform/environments/:environmentId', authenticateToken, async (req, res) => {
  try {
    const { environmentId } = req.params;
    
    const InfrastructureService = require('../services/infrastructureService');
    const infrastructureService = new InfrastructureService();
    
    const result = await infrastructureService.destroyTrainingEnvironmentWithTerraform(environmentId);
    res.json(result);
  } catch (error) {
    console.error('Error destroying infrastructure with Terraform:', error);
    res.status(500).json({ error: 'Failed to destroy infrastructure with Terraform' });
  }
});

router.get('/infrastructure/terraform/environments/:environmentId/state', authenticateToken, async (req, res) => {
  try {
    const { environmentId } = req.params;
    
    const environment = await db.TrainingEnvironment.findOne({
      where: { environmentId }
    });

    if (!environment) {
      return res.status(404).json({ error: 'Environment not found' });
    }

    if (environment.provisioningMethod !== 'TERRAFORM') {
      return res.status(400).json({ error: 'Environment was not provisioned with Terraform' });
    }

    res.json({
      environmentId: environment.environmentId,
      status: environment.status,
      terraformState: environment.terraformState
    });
  } catch (error) {
    console.error('Error getting Terraform state:', error);
    res.status(500).json({ error: 'Failed to get Terraform state' });
  }
});

router.get('/infrastructure/terraform/environments/:environmentId/outputs', authenticateToken, async (req, res) => {
  try {
    const { environmentId } = req.params;
    
    const environment = await db.TrainingEnvironment.findOne({
      where: { environmentId }
    });

    if (!environment) {
      return res.status(404).json({ error: 'Environment not found' });
    }

    if (environment.provisioningMethod !== 'TERRAFORM') {
      return res.status(400).json({ error: 'Environment was not provisioned with Terraform' });
    }

    const outputs = environment.terraformState?.outputs || {};
    res.json({ outputs });
  } catch (error) {
    console.error('Error getting Terraform outputs:', error);
    res.status(500).json({ error: 'Failed to get Terraform outputs' });
  }
});

module.exports = router; 