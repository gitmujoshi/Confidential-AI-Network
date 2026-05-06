const express = require('express');
const router = express.Router();
const { User, Contract, Dataset, Notification } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// TDP dashboard data
router.get('/dashboard/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user is accessing their own data or is admin
    const currentUserId = req.user.localUser?.id;
    const userPartyType = req.user.localUser?.partyType;
    
    if (Number(currentUserId) !== Number(userId) && userPartyType !== 'AppAdmin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get TDP's datasets
    const datasets = await Dataset.findAll({
      where: { ownerId: userId },
      order: [['createdAt', 'DESC']]
    });

    // Get contracts where this user is TDP
    const contracts = await Contract.findAll({
      where: { tdpId: userId },
      include: [
        { model: User, as: 'tdc', attributes: ['name', 'email'] },
        { model: User, as: 'ccrp', attributes: ['name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Get contract requests (pending contracts)
    const contractRequests = contracts.filter(c => c.status.includes('PENDING'));

    // Get pending signatures
    const pendingSignatures = contracts.filter(c => 
      c.status === 'PENDING_TDP_APPROVAL' || 
      (c.multiTdpStatus && c.multiTdpStatus.includes('PENDING'))
    );

    // Calculate payments
    const payments = {
      totalRevenue: 0,
      pendingAmount: 0,
      monthlyRevenue: 0,
      lastMonthRevenue: 0
    };

    contracts.forEach(contract => {
      if (contract.status === 'SIGNED' || contract.status === 'EXECUTING' || contract.status === 'COMPLETED') {
        payments.totalRevenue += parseFloat(contract.price || 0);
        
        // Calculate monthly revenue
        const contractDate = new Date(contract.createdAt);
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        if (contractDate.getMonth() === currentMonth && contractDate.getFullYear() === currentYear) {
          payments.monthlyRevenue += parseFloat(contract.price || 0);
        }
        
        if (contractDate.getMonth() === (currentMonth - 1) && contractDate.getFullYear() === currentYear) {
          payments.lastMonthRevenue += parseFloat(contract.price || 0);
        }
      } else if (contract.status.includes('PENDING')) {
        payments.pendingAmount += parseFloat(contract.price || 0);
      }
    });

    // Calculate growth rate
    const growthRate = payments.lastMonthRevenue > 0 
      ? Math.round(((payments.monthlyRevenue - payments.lastMonthRevenue) / payments.lastMonthRevenue) * 100)
      : 0;

    // Get data usage analytics
    const dataUsage = {
      totalDatasets: datasets.length,
      activeDatasets: datasets.filter(d => d.isActive).length,
      totalContracts: contracts.length,
      successRate: contracts.length > 0 
        ? Math.round((contracts.filter(c => c.status === 'SIGNED' || c.status === 'EXECUTING' || c.status === 'COMPLETED').length / contracts.length) * 100)
        : 0
    };

    // Get recent activities
    const recentActivities = await Notification.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    res.json({
      myDatasets: datasets.map(dataset => ({
        id: dataset.id,
        name: dataset.name,
        category: dataset.category,
        price: dataset.price,
        isActive: dataset.isActive,
        createdAt: dataset.createdAt
      })),
      contractRequests: contractRequests.map(contract => ({
        id: contract.id,
        contractId: contract.contractId,
        status: contract.status,
        price: contract.price,
        tdcName: contract.tdc?.name,
        createdAt: contract.createdAt
      })),
      pendingSignatures: pendingSignatures.map(contract => ({
        id: contract.id,
        contractId: contract.contractId,
        status: contract.status,
        price: contract.price,
        tdcName: contract.tdc?.name,
        createdAt: contract.createdAt
      })),
      payments: {
        ...payments,
        growthRate
      },
      dataUsage,
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
    console.error('TDP dashboard error:', error);
    res.status(500).json({ error: 'Failed to load TDP dashboard data' });
  }
});

// Get TDP's datasets
router.get('/datasets/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const currentUserId = req.user.localUser?.id;
    const userPartyType = req.user.localUser?.partyType;
    
    if (Number(currentUserId) !== Number(userId) && userPartyType !== 'AppAdmin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const datasets = await Dataset.findAll({
      where: { ownerId: userId },
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ datasets });
  } catch (error) {
    console.error('TDP datasets error:', error);
    res.status(500).json({ error: 'Failed to load datasets' });
  }
});

// Get TDP's contracts
router.get('/contracts/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const currentUserId = req.user.localUser?.id;
    const userPartyType = req.user.localUser?.partyType;
    
    if (Number(currentUserId) !== Number(userId) && userPartyType !== 'AppAdmin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const contracts = await Contract.findAll({
      where: { tdpId: userId },
      include: [
        { model: User, as: 'tdc', attributes: ['name', 'email'] },
        { model: User, as: 'ccrp', attributes: ['name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ contracts });
  } catch (error) {
    console.error('TDP contracts error:', error);
    res.status(500).json({ error: 'Failed to load contracts' });
  }
});

// Get TDP's payments
router.get('/payments/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const currentUserId = req.user.localUser?.id;
    const userPartyType = req.user.localUser?.partyType;
    
    if (Number(currentUserId) !== Number(userId) && userPartyType !== 'AppAdmin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const contracts = await Contract.findAll({
      where: { tdpId: userId },
      order: [['createdAt', 'DESC']]
    });

    const payments = {
      totalRevenue: 0,
      pendingAmount: 0,
      monthlyRevenue: 0,
      lastMonthRevenue: 0,
      payments: []
    };

    contracts.forEach(contract => {
      const payment = {
        contractId: contract.contractId,
        amount: parseFloat(contract.price || 0),
        status: contract.status,
        createdAt: contract.createdAt
      };

      if (contract.status === 'SIGNED' || contract.status === 'EXECUTING' || contract.status === 'COMPLETED') {
        payments.totalRevenue += payment.amount;
        
        const contractDate = new Date(contract.createdAt);
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        if (contractDate.getMonth() === currentMonth && contractDate.getFullYear() === currentYear) {
          payments.monthlyRevenue += payment.amount;
        }
        
        if (contractDate.getMonth() === (currentMonth - 1) && contractDate.getFullYear() === currentYear) {
          payments.lastMonthRevenue += payment.amount;
        }
      } else if (contract.status.includes('PENDING')) {
        payments.pendingAmount += payment.amount;
      }

      payments.payments.push(payment);
    });

    res.json({ payments });
  } catch (error) {
    console.error('TDP payments error:', error);
    res.status(500).json({ error: 'Failed to load payments' });
  }
});

// Get TDP's analytics
router.get('/analytics/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const currentUserId = req.user.localUser?.id;
    const userPartyType = req.user.localUser?.partyType;
    
    if (Number(currentUserId) !== Number(userId) && userPartyType !== 'AppAdmin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const datasets = await Dataset.findAll({
      where: { ownerId: userId }
    });

    const contracts = await Contract.findAll({
      where: { tdpId: userId }
    });

    const analytics = {
      totalDatasets: datasets.length,
      activeDatasets: datasets.filter(d => d.isActive).length,
      totalContracts: contracts.length,
      activeContracts: contracts.filter(c => c.status === 'ACTIVE').length,
      completedContracts: contracts.filter(c => c.status === 'COMPLETED').length,
      successRate: contracts.length > 0 
        ? Math.round((contracts.filter(c => c.status === 'ACTIVE' || c.status === 'COMPLETED').length / contracts.length) * 100)
        : 0,
      averageContractValue: contracts.length > 0 
        ? contracts.reduce((sum, c) => sum + parseFloat(c.price || 0), 0) / contracts.length
        : 0
    };

    res.json({ analytics });
  } catch (error) {
    console.error('TDP analytics error:', error);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

module.exports = router; 