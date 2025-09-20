const express = require('express');
const router = express.Router();
const db = require('../models');
const InfrastructureService = require('../services/infrastructureService');
const { authenticateToken } = require('../middleware/auth');

const infrastructureService = new InfrastructureService();

/**
 * Infrastructure Management Routes
 * 
 * Handles training environment provisioning, management, and monitoring
 * across different cloud providers
 */

/**
 * Create training environment for a contract
 * POST /api/infrastructure/environments
 */
router.post('/environments', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Create training environment request:', {
      body: req.body,
      user: req.user?.localUser?.email
    });

    const { contractId, config } = req.body;

    if (!contractId) {
      return res.status(400).json({ error: 'Contract ID is required' });
    }

    // Verify contract exists and user has access
    const contract = await db.Contract.findOne({
      where: { contractId },
      include: [
        { model: db.User, as: 'tdp' },
        { model: db.User, as: 'tdc' },
        { model: db.User, as: 'ccrp' }
      ]
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Only CCRP can create environments for their contracts
    if (req.user.localUser.partyType !== 'CCRP' || contract.ccrpId !== req.user.localUser.id) {
      return res.status(403).json({ error: 'Only CCRP can create training environments for their contracts' });
    }

    // Check if environment already exists
    const existingEnvironment = await db.TrainingEnvironment.findOne({
      where: { contractId }
    });

    if (existingEnvironment) {
      return res.status(400).json({ error: 'Training environment already exists for this contract' });
    }

    // Create training environment
    const environment = await infrastructureService.createTrainingEnvironment(contractId, config);

    res.status(201).json({
      success: true,
      message: 'Training environment created successfully',
      environment
    });

  } catch (error) {
    console.error('Error creating training environment:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * Get all training environments (with filtering)
 * GET /api/infrastructure/environments
 */
router.get('/environments', authenticateToken, async (req, res) => {
  try {
    const { status, provider, type, userId, limit = 50, offset = 0 } = req.query;
    const userRole = req.user.localUser?.partyType;
    const currentUserId = req.user.localUser?.id;

    console.log('🔍 Getting all training environments:', {
      userRole,
      currentUserId,
      filters: { status, provider, type, userId }
    });

    // Build where clause based on filters and permissions
    let whereClause = {};
    let includeOptions = [
      { 
        model: db.Contract, 
        as: 'contract',
        include: [
          { model: db.User, as: 'tdp', attributes: ['id', 'name', 'email'] },
          { model: db.User, as: 'tdc', attributes: ['id', 'name', 'email'] },
          { model: db.User, as: 'ccrp', attributes: ['id', 'name', 'email'] }
        ]
      },
      { model: db.EnvironmentResource, as: 'resources' },
      { model: db.EnvironmentCost, as: 'costs' }
    ];

    // Apply filters
    if (status) whereClause.status = status;
    if (provider) whereClause.provider = provider;
    if (type) whereClause.type = type;

    // Apply role-based access control
    if (userRole === 'AppAdmin') {
      // Admin can see all environments
      if (userId) {
        // If specific user requested, filter by contracts involving that user
        includeOptions[0].where = {
          [db.Sequelize.Op.or]: [
            { tdcId: userId },
            { tdpId: userId },
            { ccrpId: userId }
          ]
        };
      }
    } else {
      // Regular users can only see environments for contracts they're involved in
      includeOptions[0].where = {
        [db.Sequelize.Op.or]: [
          { tdcId: currentUserId },
          { tdpId: currentUserId },
          { ccrpId: currentUserId }
        ]
      };
    }

    const { rows: environments, count: total } = await db.TrainingEnvironment.findAndCountAll({
      where: whereClause,
      include: includeOptions,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Filter out environments where user doesn't have access to the contract
    const accessibleEnvironments = environments.filter(env => {
      if (!env.contract) return false;
      if (userRole === 'AppAdmin') return true;
      
      return env.contract.tdcId === currentUserId ||
             env.contract.tdpId === currentUserId ||
             env.contract.ccrpId === currentUserId;
    });

    res.json({
      success: true,
      data: {
        environments: accessibleEnvironments.map(env => ({
          id: env.id,
          name: env.name,
          status: env.status,
          type: env.type,
          provider: env.provider,
          region: env.region,
          contractId: env.contractId,
          contract: env.contract ? {
            id: env.contract.contractId,
            title: env.contract.title,
            status: env.contract.status,
            tdp: env.contract.tdp,
            tdc: env.contract.tdc,
            ccrp: env.contract.ccrp
          } : null,
          resources: env.resources,
          costs: env.costs,
          createdAt: env.createdAt,
          updatedAt: env.updatedAt
        })),
        pagination: {
          total: accessibleEnvironments.length,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + parseInt(limit) < accessibleEnvironments.length
        }
      }
    });

  } catch (error) {
    console.error('Error getting training environments:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error' 
    });
  }
});

/**
 * Get training environment status
 * GET /api/infrastructure/environments/:environmentId
 */
router.get('/environments/:environmentId', authenticateToken, async (req, res) => {
  try {
    const { environmentId } = req.params;

    const environment = await infrastructureService.getEnvironmentStatus(environmentId);

    if (!environment) {
      return res.status(404).json({ error: 'Training environment not found' });
    }

    // Verify user has access to this environment
    const contract = await db.Contract.findOne({
      where: { contractId: environment.contractId }
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Check if user is authorized to view this environment
    const isAuthorized = 
      req.user.localUser.partyType === 'AppAdmin' ||
      contract.tdcId === req.user.localUser.id ||
      contract.tdpId === req.user.localUser.id ||
      contract.ccrpId === req.user.localUser.id;

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      environment
    });

  } catch (error) {
    console.error('Error getting environment status:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * Get all environments for a contract
 * GET /api/infrastructure/contracts/:contractId/environments
 */
router.get('/contracts/:contractId/environments', authenticateToken, async (req, res) => {
  try {
    const { contractId } = req.params;

    // Verify contract exists and user has access
    const contract = await db.Contract.findOne({
      where: { contractId },
      include: [
        { model: db.User, as: 'tdp' },
        { model: db.User, as: 'tdc' },
        { model: db.User, as: 'ccrp' }
      ]
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Check if user is authorized to view this contract
    const isAuthorized = 
      req.user.localUser.partyType === 'AppAdmin' ||
      contract.tdcId === req.user.localUser.id ||
      contract.tdpId === req.user.localUser.id ||
      contract.ccrpId === req.user.localUser.id;

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const environments = await db.TrainingEnvironment.findAll({
      where: { contractId },
      include: [
        { model: db.EnvironmentResource, as: 'resources' },
        { model: db.EnvironmentCost, as: 'costs' }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      environments
    });

  } catch (error) {
    console.error('Error getting contract environments:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * Get environment statistics and summary
 * GET /api/infrastructure/environments/stats
 */
router.get('/environments/stats', authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.localUser?.partyType;
    const currentUserId = req.user.localUser?.id;

    console.log('📊 Getting environment statistics for user:', currentUserId);

    // Build base query with role-based access control
    let contractWhereClause = {};
    if (userRole !== 'AppAdmin') {
      contractWhereClause = {
        [db.Sequelize.Op.or]: [
          { tdcId: currentUserId },
          { tdpId: currentUserId },
          { ccrpId: currentUserId }
        ]
      };
    }

    // Get all accessible environments
    const environments = await db.TrainingEnvironment.findAll({
      include: [{
        model: db.Contract,
        as: 'contract',
        where: contractWhereClause,
        required: true
      }]
    });

    // Calculate statistics
    const stats = {
      total: environments.length,
      byStatus: environments.reduce((acc, env) => {
        acc[env.status] = (acc[env.status] || 0) + 1;
        return acc;
      }, {}),
      byProvider: environments.reduce((acc, env) => {
        acc[env.provider] = (acc[env.provider] || 0) + 1;
        return acc;
      }, {}),
      byType: environments.reduce((acc, env) => {
        acc[env.type] = (acc[env.type] || 0) + 1;
        return acc;
      }, {}),
      totalCosts: environments.reduce((sum, env) => {
        return sum + (env.estimatedCost || 0);
      }, 0),
      activeEnvironments: environments.filter(env => env.status === 'ACTIVE').length,
      recentEnvironments: environments
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(env => ({
          id: env.id,
          name: env.name,
          status: env.status,
          provider: env.provider,
          createdAt: env.createdAt
        }))
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error getting environment statistics:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error' 
    });
  }
});

/**
 * Search environments by name or description
 * GET /api/infrastructure/environments/search
 */
router.get('/environments/search', authenticateToken, async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    const userRole = req.user.localUser?.partyType;
    const currentUserId = req.user.localUser?.id;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters long'
      });
    }

    console.log('🔍 Searching environments with query:', q);

    // Build search criteria
    const searchTerm = `%${q.trim()}%`;
    let contractWhereClause = {};
    
    if (userRole !== 'AppAdmin') {
      contractWhereClause = {
        [db.Sequelize.Op.or]: [
          { tdcId: currentUserId },
          { tdpId: currentUserId },
          { ccrpId: currentUserId }
        ]
      };
    }

    const environments = await db.TrainingEnvironment.findAll({
      where: {
        [db.Sequelize.Op.or]: [
          { name: { [db.Sequelize.Op.iLike]: searchTerm } },
          { description: { [db.Sequelize.Op.iLike]: searchTerm } },
          { provider: { [db.Sequelize.Op.iLike]: searchTerm } },
          { region: { [db.Sequelize.Op.iLike]: searchTerm } }
        ]
      },
      include: [{
        model: db.Contract,
        as: 'contract',
        where: contractWhereClause,
        required: true,
        attributes: ['contractId', 'title', 'status']
      }],
      limit: parseInt(limit),
      order: [['updatedAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        query: q,
        results: environments.map(env => ({
          id: env.id,
          name: env.name,
          description: env.description,
          status: env.status,
          provider: env.provider,
          region: env.region,
          contractId: env.contractId,
          contract: env.contract,
          createdAt: env.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Error searching environments:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error' 
    });
  }
});

/**
 * Get environments by provider
 * GET /api/infrastructure/environments/provider/:provider
 */
router.get('/environments/provider/:provider', authenticateToken, async (req, res) => {
  try {
    const { provider } = req.params;
    const { status, limit = 20, offset = 0 } = req.query;
    const userRole = req.user.localUser?.partyType;
    const currentUserId = req.user.localUser?.id;

    console.log(`🔍 Getting environments for provider: ${provider}`);

    // Validate provider
    const validProviders = ['AWS', 'Azure', 'GCP', 'OCI'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({
        success: false,
        error: `Invalid provider. Must be one of: ${validProviders.join(', ')}`
      });
    }

    // Build query with role-based access control
    let whereClause = { provider };
    if (status) whereClause.status = status;

    let contractWhereClause = {};
    if (userRole !== 'AppAdmin') {
      contractWhereClause = {
        [db.Sequelize.Op.or]: [
          { tdcId: currentUserId },
          { tdpId: currentUserId },
          { ccrpId: currentUserId }
        ]
      };
    }

    const { rows: environments, count: total } = await db.TrainingEnvironment.findAndCountAll({
      where: whereClause,
      include: [{
        model: db.Contract,
        as: 'contract',
        where: contractWhereClause,
        required: true,
        include: [
          { model: db.User, as: 'tdp', attributes: ['id', 'name', 'email'] },
          { model: db.User, as: 'tdc', attributes: ['id', 'name', 'email'] },
          { model: db.User, as: 'ccrp', attributes: ['id', 'name', 'email'] }
        ]
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        provider,
        environments: environments.map(env => ({
          id: env.id,
          name: env.name,
          status: env.status,
          type: env.type,
          region: env.region,
          contractId: env.contractId,
          contract: env.contract,
          createdAt: env.createdAt,
          updatedAt: env.updatedAt
        })),
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + parseInt(limit) < total
        }
      }
    });

  } catch (error) {
    console.error('Error getting environments by provider:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error' 
    });
  }
});

/**
 * Update environment configuration
 * PUT /api/infrastructure/environments/:environmentId
 */
router.put('/environments/:environmentId', authenticateToken, async (req, res) => {
  try {
    const { environmentId } = req.params;
    const { config } = req.body;

    const environment = await db.TrainingEnvironment.findOne({
      where: { environmentId }
    });

    if (!environment) {
      return res.status(404).json({ error: 'Training environment not found' });
    }

    // Verify user has access to this environment
    const contract = await db.Contract.findOne({
      where: { contractId: environment.contractId }
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Only CCRP can update environments for their contracts
    if (req.user.localUser.partyType !== 'CCRP' || contract.ccrpId !== req.user.localUser.id) {
      return res.status(403).json({ error: 'Only CCRP can update training environments for their contracts' });
    }

    // Update environment configuration
    const updatedEnvironment = await infrastructureService.updateEnvironmentConfig(environmentId, config);

    res.json({
      success: true,
      message: 'Environment configuration updated successfully',
      environment: updatedEnvironment
    });

  } catch (error) {
    console.error('Error updating environment configuration:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * Destroy training environment
 * DELETE /api/infrastructure/environments/:environmentId
 */
router.delete('/environments/:environmentId', authenticateToken, async (req, res) => {
  try {
    const { environmentId } = req.params;

    const environment = await db.TrainingEnvironment.findOne({
      where: { environmentId }
    });

    if (!environment) {
      return res.status(404).json({ error: 'Training environment not found' });
    }

    // Verify user has access to this environment
    const contract = await db.Contract.findOne({
      where: { contractId: environment.contractId }
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Only CCRP can destroy environments for their contracts
    if (req.user.localUser.partyType !== 'CCRP' || contract.ccrpId !== req.user.localUser.id) {
      return res.status(403).json({ error: 'Only CCRP can destroy training environments for their contracts' });
    }

    // Destroy environment
    await infrastructureService.destroyTrainingEnvironment(environmentId);

    res.json({
      success: true,
      message: 'Training environment destroyed successfully'
    });

  } catch (error) {
    console.error('Error destroying training environment:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * Get infrastructure cost estimates
 * POST /api/infrastructure/estimate-cost
 */
router.post('/estimate-cost', authenticateToken, async (req, res) => {
  try {
    const { contractId, config } = req.body;

    if (!contractId) {
      return res.status(400).json({ error: 'Contract ID is required' });
    }

    // Verify contract exists
    const contract = await db.Contract.findOne({
      where: { contractId },
      include: [
        { model: db.User, as: 'tdp' },
        { model: db.User, as: 'tdc' },
        { model: db.User, as: 'ccrp' }
      ]
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Check if user is authorized
    const isAuthorized = 
      req.user.localUser.partyType === 'AppAdmin' ||
      contract.tdcId === req.user.localUser.id ||
      contract.tdpId === req.user.localUser.id ||
      contract.ccrpId === req.user.localUser.id;

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Calculate cost estimate
    const costEstimate = infrastructureService.estimateCost(contract, config);

    res.json({
      success: true,
      costEstimate,
      currency: 'USD',
      period: 'monthly'
    });

  } catch (error) {
    console.error('Error estimating infrastructure cost:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * Get available infrastructure configurations
 * GET /api/infrastructure/configurations
 */
router.get('/configurations', authenticateToken, async (req, res) => {
  try {
    const configurations = {
      compute: {
        instanceTypes: {
          AWS: [
            { type: 't3.medium', vcpus: 2, memory: 4, cost: 0.0416 },
            { type: 't3.large', vcpus: 2, memory: 8, cost: 0.0832 },
            { type: 'c5.large', vcpus: 2, memory: 4, cost: 0.085 },
            { type: 'c5.xlarge', vcpus: 4, memory: 8, cost: 0.17 },
            { type: 'p3.2xlarge', vcpus: 8, memory: 61, gpu: 1, cost: 3.06 }
          ],
          GCP: [
            { type: 'n1-standard-2', vcpus: 2, memory: 7.5, cost: 0.095 },
            { type: 'n1-standard-4', vcpus: 4, memory: 15, cost: 0.19 },
            { type: 'n1-standard-8', vcpus: 8, memory: 30, cost: 0.38 }
          ],
          Azure: [
            { type: 'Standard_D2s_v3', vcpus: 2, memory: 8, cost: 0.096 },
            { type: 'Standard_D4s_v3', vcpus: 4, memory: 16, cost: 0.192 },
            { type: 'Standard_D8s_v3', vcpus: 8, memory: 32, cost: 0.384 }
          ],
          OCI: [
            { type: 'VM.Standard2.2', vcpus: 2, memory: 12, cost: 0.03 },
            { type: 'VM.Standard2.4', vcpus: 4, memory: 24, cost: 0.06 },
            { type: 'VM.Standard2.8', vcpus: 8, memory: 48, cost: 0.12 }
          ]
        }
      },
      storage: {
        types: [
          { type: 'SSD', description: 'High-performance SSD storage', costMultiplier: 1.0 },
          { type: 'HDD', description: 'Standard HDD storage', costMultiplier: 0.5 },
          { type: 'NVMe', description: 'Ultra-fast NVMe storage', costMultiplier: 1.5 }
        ],
        encryption: [
          { type: 'AES-256', description: 'AES-256 encryption at rest' },
          { type: 'AES-128', description: 'AES-128 encryption at rest' },
          { type: 'None', description: 'No encryption (not recommended)' }
        ]
      },
      networking: {
        vpcOptions: [
          { type: 'default', description: 'Use default VPC' },
          { type: 'custom', description: 'Create custom VPC' },
          { type: 'isolated', description: 'Fully isolated VPC' }
        ],
        subnetOptions: [
          { type: 'public', description: 'Public subnet with internet access' },
          { type: 'private', description: 'Private subnet with NAT gateway' },
          { type: 'isolated', description: 'Isolated subnet without internet access' }
        ]
      },
      database: {
        types: [
          { type: 'PostgreSQL', description: 'PostgreSQL database', cost: 0.017 },
          { type: 'MySQL', description: 'MySQL database', cost: 0.017 },
          { type: 'MongoDB', description: 'MongoDB database', cost: 0.02 }
        ]
      },
      mlServices: {
        frameworks: [
          { name: 'TensorFlow', description: 'Google TensorFlow framework' },
          { name: 'PyTorch', description: 'Facebook PyTorch framework' },
          { name: 'Scikit-learn', description: 'Machine learning library' },
          { name: 'XGBoost', description: 'Gradient boosting framework' }
        ],
        gpuTypes: [
          { type: 'T4', description: 'NVIDIA T4 GPU', cost: 0.35 },
          { type: 'V100', description: 'NVIDIA V100 GPU', cost: 2.48 },
          { type: 'A100', description: 'NVIDIA A100 GPU', cost: 4.00 }
        ]
      },
      regions: {
        AWS: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'],
        GCP: ['us-central1', 'us-east1', 'europe-west1', 'asia-east1'],
        Azure: ['eastus', 'westus2', 'westeurope', 'southeastasia'],
        OCI: ['us-ashburn-1', 'us-phoenix-1', 'eu-frankfurt-1', 'ap-singapore-1']
      }
    };

    res.json({
      success: true,
      configurations
    });

  } catch (error) {
    console.error('Error getting infrastructure configurations:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * Get environment monitoring metrics
 * GET /api/infrastructure/environments/:environmentId/metrics
 */
router.get('/environments/:environmentId/metrics', authenticateToken, async (req, res) => {
  try {
    const { environmentId } = req.params;
    const { period = '1h' } = req.query;

    const environment = await db.TrainingEnvironment.findOne({
      where: { environmentId }
    });

    if (!environment) {
      return res.status(404).json({ error: 'Training environment not found' });
    }

    // Verify user has access
    const contract = await db.Contract.findOne({
      where: { contractId: environment.contractId }
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const isAuthorized = 
      req.user.localUser.partyType === 'AppAdmin' ||
      contract.tdcId === req.user.localUser.id ||
      contract.tdpId === req.user.localUser.id ||
      contract.ccrpId === req.user.localUser.id;

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Mock metrics data (in real implementation, this would fetch from cloud provider)
    const metrics = {
      cpu: {
        utilization: Math.random() * 100,
        load: Math.random() * 10
      },
      memory: {
        used: Math.random() * 100,
        available: Math.random() * 100
      },
      storage: {
        used: Math.random() * 100,
        available: Math.random() * 100
      },
      network: {
        inbound: Math.random() * 1000,
        outbound: Math.random() * 1000
      },
      cost: {
        current: Math.random() * 100,
        estimated: Math.random() * 150
      }
    };

    res.json({
      success: true,
      environmentId,
      period,
      metrics
    });

  } catch (error) {
    console.error('Error getting environment metrics:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

module.exports = router; 