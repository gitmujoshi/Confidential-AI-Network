const express = require('express');
const router = express.Router();
const { User, Contract, Notification } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

// CCRP dashboard data
router.get('/dashboard/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user is accessing their own data or is admin
    const currentUserId = req.user.userId || req.user.id || req.user.localUser?.id;
    if (currentUserId !== parseInt(userId) && req.user.partyType !== 'AppAdmin') {
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
    
    const currentUserId = req.user.userId || req.user.id || req.user.localUser?.id;
    if (currentUserId !== parseInt(userId) && req.user.partyType !== 'AppAdmin') {
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
    
    const currentUserId = req.user.userId || req.user.id || req.user.localUser?.id;
    if (currentUserId !== parseInt(userId) && req.user.partyType !== 'AppAdmin') {
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
    
    const currentUserId = req.user.userId || req.user.id || req.user.localUser?.id;
    if (currentUserId !== parseInt(userId) && req.user.partyType !== 'AppAdmin') {
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
    
    const currentUserId = req.user.userId || req.user.id || req.user.localUser?.id;
    if (currentUserId !== parseInt(userId) && req.user.partyType !== 'AppAdmin') {
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
    
    const currentUserId = req.user.userId || req.user.id || req.user.localUser?.id;
    if (currentUserId !== parseInt(userId) && req.user.partyType !== 'AppAdmin') {
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
    
    const currentUserId = req.user.userId || req.user.id || req.user.localUser?.id;
    if (currentUserId !== parseInt(userId) && req.user.partyType !== 'AppAdmin') {
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
    if (req.user.partyType !== 'TDC' && req.user.partyType !== 'AppAdmin') {
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

module.exports = router; 