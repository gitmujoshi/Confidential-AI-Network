const express = require('express');
const router = express.Router();
const { User, Contract, Dataset, DataBreach, Consent, AuditLog } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// Admin dashboard data
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.localUser?.partyType !== 'AppAdmin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    // Get all users
    const users = await User.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'email', 'partyType', 'isRegistered', 'createdAt']
    });

    // Get all contracts
    const contracts = await Contract.findAll({
      include: [
        { model: User, as: 'tdc', attributes: ['name', 'email'] },
        { model: User, as: 'tsp', attributes: ['name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Get all datasets
    const datasets = await Dataset.findAll({
      include: [{ model: User, as: 'owner', attributes: ['name', 'email'] }],
      order: [['createdAt', 'DESC']]
    });

    // Get data breaches
    const breaches = await DataBreach.findAll({
      order: [['discoveredAt', 'DESC']]
    });

    // Calculate compliance metrics
    const totalConsents = await Consent.count();
    const activeConsents = await Consent.count({ where: { isActive: true } });
    const complianceScore = totalConsents > 0 ? Math.round((activeConsents / totalConsents) * 100) : 0;

    // Calculate metrics
    const totalUsers = users.length;
    const totalContracts = contracts.length;
    const totalDatasets = datasets.length;
    const activeContracts = contracts.filter(c => c.status === 'ACTIVE').length;
    const pendingContracts = contracts.filter(c => c.status.includes('PENDING')).length;
    const activeBreaches = breaches.filter(b => b.status !== 'RESOLVED').length;

    // Get recent activities
    const recentActivities = await AuditLog.findAll({
      order: [['timestamp', 'DESC']],
      limit: 10,
      include: [{ model: User, as: 'user', attributes: ['name'] }]
    });

    // System health metrics
    const systemHealth = {
      databaseConnections: 'Healthy',
      apiResponseTime: 'Good',
      memoryUsage: 'Normal',
      diskSpace: 'Sufficient'
    };

    res.json({
      totalUsers,
      totalContracts,
      totalDatasets,
      activeContracts,
      pendingContracts,
      recentActivities: recentActivities.map(log => ({
        id: log.id,
        eventType: log.eventType,
        timestamp: log.timestamp,
        user: log.user?.name || 'System',
        description: log.eventData
      })),
      systemHealth,
      dpdpCompliance: {
        score: complianceScore,
        totalConsents,
        activeConsents,
        consentRate: totalUsers > 0 ? Math.round((activeConsents / totalUsers) * 100) : 0
      },
      dataBreaches: breaches.map(breach => ({
        id: breach.id,
        breachType: breach.breachType,
        severity: breach.severity,
        status: breach.status,
        discoveredAt: breach.discoveredAt,
        affectedUsers: breach.affectedUsers
      }))
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to load admin dashboard data' });
  }
});

// Get all users for admin
router.get('/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.localUser?.partyType !== 'AppAdmin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const users = await User.findAll({
      where: { isActive: true },
      attributes: [
        'id', 'name', 'email', 'partyType', 'isRegistered', 'createdAt',
        'lastLoginAt', 'onboardingStatus', 'profileCompleted'
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ users });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

// Get all contracts for admin
router.get('/contracts', authenticateToken, async (req, res) => {
  try {
    if (req.user.localUser?.partyType !== 'AppAdmin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const contracts = await Contract.findAll({
      include: [
        { model: User, as: 'tdc', attributes: ['name', 'email'] },
        { model: User, as: 'tsp', attributes: ['name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ contracts });
  } catch (error) {
    console.error('Admin contracts error:', error);
    res.status(500).json({ error: 'Failed to load contracts' });
  }
});

// Get all datasets for admin
router.get('/datasets', authenticateToken, async (req, res) => {
  try {
    if (req.user.localUser?.partyType !== 'AppAdmin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const datasets = await Dataset.findAll({
      include: [{ model: User, as: 'owner', attributes: ['name', 'email'] }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ datasets });
  } catch (error) {
    console.error('Admin datasets error:', error);
    res.status(500).json({ error: 'Failed to load datasets' });
  }
});

// Get data breaches for admin
router.get('/data-breaches', authenticateToken, async (req, res) => {
  try {
    if (req.user.localUser?.partyType !== 'AppAdmin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const breaches = await DataBreach.findAll({
      order: [['discoveredAt', 'DESC']]
    });

    res.json({ breaches });
  } catch (error) {
    console.error('Admin data breaches error:', error);
    res.status(500).json({ error: 'Failed to load data breaches' });
  }
});

// Get compliance data for admin
router.get('/compliance', authenticateToken, async (req, res) => {
  try {
    if (req.user.localUser?.partyType !== 'AppAdmin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const totalUsers = await User.count({ where: { isActive: true } });
    const totalConsents = await Consent.count();
    const activeConsents = await Consent.count({ where: { isActive: true } });
    const totalBreaches = await DataBreach.count();
    const resolvedBreaches = await DataBreach.count({ where: { status: 'RESOLVED' } });

    const compliance = {
      score: totalConsents > 0 ? Math.round((activeConsents / totalConsents) * 100) : 0,
      totalUsers,
      totalConsents,
      activeConsents,
      consentRate: totalUsers > 0 ? Math.round((activeConsents / totalUsers) * 100) : 0,
      totalBreaches,
      resolvedBreaches,
      breachResolutionRate: totalBreaches > 0 ? Math.round((resolvedBreaches / totalBreaches) * 100) : 0
    };

    res.json({ compliance });
  } catch (error) {
    console.error('Admin compliance error:', error);
    res.status(500).json({ error: 'Failed to load compliance data' });
  }
});

module.exports = router; 