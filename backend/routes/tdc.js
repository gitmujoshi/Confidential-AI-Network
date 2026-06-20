const express = require('express');
const router = express.Router();
const { User, Contract, Dataset, Notification } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const db = require('../models');

// TDC dashboard data
router.get('/dashboard/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user is accessing their own data or is admin
    const currentUserId = req.user.localUser?.id;
    const userPartyType = req.user.localUser?.partyType;
    
    // Debug logging
    console.log('🔍 TDC Dashboard Debug:');
    console.log('req.user:', JSON.stringify(req.user, null, 2));
    console.log('currentUserId:', currentUserId);
    console.log('userId from params:', userId);
    console.log('parseInt(userId):', parseInt(userId));
    console.log('currentUserId !== parseInt(userId):', currentUserId !== parseInt(userId));
    console.log('userPartyType:', userPartyType);
    console.log('userPartyType !== AppAdmin:', userPartyType !== 'AppAdmin');
    
    if (currentUserId !== parseInt(userId) && userPartyType !== 'AppAdmin') {
      return res.status(403).json({ 
        error: 'Access denied',
        debug: {
          currentUserId,
          requestedUserId: userId,
          parsedUserId: parseInt(userId),
          partyType: userPartyType,
          isMatch: currentUserId === parseInt(userId),
          isAdmin: userPartyType === 'AppAdmin'
        }
      });
    }

    // Get available datasets (public datasets)
    const datasets = await Dataset.findAll({
      where: { isPublic: true, isActive: true },
      include: [{ model: User, as: 'owner', attributes: ['name', 'email'] }],
      order: [['createdAt', 'DESC']]
    });

    // Get contracts where this user is TDC
    const contracts = await Contract.findAll({
      where: { tdcId: userId },
      include: [
        { model: User, as: 'tdp', attributes: ['name', 'email'] },
        { model: User, as: 'tsp', attributes: ['name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Defensive: ensure contracts is always an array
    const safeContracts = Array.isArray(contracts) ? contracts : [];

    // Get pending contracts
    const pendingContracts = safeContracts.filter(c => c.status && c.status.includes('PENDING'));

    // Calculate payments
    const payments = {
      totalSpent: 0,
      monthlySpent: 0,
      lastMonthSpent: 0,
      averageContractValue: 0
    };

    safeContracts.forEach(contract => {
      if (contract.status === 'SIGNED' || contract.status === 'EXECUTING' || contract.status === 'COMPLETED') {
        const amount = parseFloat(contract.totalPrice || contract.price || 0);
        payments.totalSpent += amount;
        
        // Calculate monthly spending
        const contractDate = contract.createdAt ? new Date(contract.createdAt) : null;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        if (contractDate && contractDate.getMonth() === currentMonth && contractDate.getFullYear() === currentYear) {
          payments.monthlySpent += amount;
        }
        
        if (contractDate && contractDate.getMonth() === (currentMonth - 1) && contractDate.getFullYear() === currentYear) {
          payments.lastMonthSpent += amount;
        }
      }
    });

    // Calculate average contract value
    payments.averageContractValue = safeContracts.length > 0 
      ? payments.totalSpent / safeContracts.length 
      : 0;

    // Mock training progress data (in real implementation, this would come from training service)
    const training = safeContracts
      .filter(c => c.status === 'SIGNED' || c.status === 'EXECUTING')
      .map(contract => ({
        id: contract.id,
        contractId: contract.contractId,
        modelName: `Model-${contract.id}`,
        status: 'EXECUTING',
        progress: Math.floor(Math.random() * 100),
        startDate: contract.createdAt,
        estimatedCompletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }));

    // Get recent activities
    const recentActivities = await Notification.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    res.json({
      availableDatasets: datasets.map(dataset => ({
        id: dataset.id,
        name: dataset.name,
        category: dataset.category,
        price: dataset.price,
        ownerName: dataset.owner?.name,
        description: dataset.description
      })),
      myContracts: safeContracts.map(contract => ({
        id: contract.id,
        contractId: contract.contractId,
        status: contract.status,
        totalPrice: contract.totalPrice || contract.price,
        tdpName: contract.tdp?.name,
        datasetCount: contract.datasetCount || 1,
        createdAt: contract.createdAt
      })),
      pendingContracts,
      trainingProgress: training,
      payments,
      costAnalytics: {
        totalSpent: payments.totalSpent,
        monthlySpent: payments.monthlySpent,
        lastMonthSpent: payments.lastMonthSpent,
        averageContractValue: payments.averageContractValue,
        growthRate: payments.lastMonthSpent > 0 
          ? Math.round(((payments.monthlySpent - payments.lastMonthSpent) / payments.lastMonthSpent) * 100)
          : 0
      },
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
    console.error('TDC dashboard error:', error);
    res.status(500).json({ error: 'Failed to load TDC dashboard data' });
  }
});

// Get TDC's contracts
router.get('/contracts/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const currentUserId = req.user.localUser?.id;
    const userPartyType = req.user.localUser?.partyType;
    // Debug logging
    console.log('🔍 TDC Contracts Route Debug:');
    console.log('typeof currentUserId:', typeof currentUserId, 'value:', currentUserId);
    console.log('typeof userId:', typeof userId, 'value:', userId);
    console.log('typeof userPartyType:', typeof userPartyType, 'value:', userPartyType);
    console.log('req.user:', JSON.stringify(req.user, null, 2));
    if (Number(currentUserId) !== Number(userId) && userPartyType !== 'AppAdmin') {
      return res.status(403).json({ error: 'Access denied', debug: { currentUserId, userId, userPartyType } });
    }

    const contracts = await Contract.findAll({
      where: { tdcId: userId },
      include: [
        { model: User, as: 'tdp', attributes: ['name', 'email'] },
        { model: User, as: 'tsp', attributes: ['name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ contracts });
  } catch (error) {
    console.error('TDC contracts error:', error);
    res.status(500).json({ error: 'Failed to load contracts' });
  }
});

// Get TDC's training progress
router.get('/training/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const currentUserId = req.user.localUser?.id;
    const userPartyType = req.user.localUser?.partyType;
    
    // Debug logging
    console.log('🔍 TDC Training Route Debug:');
    console.log('req.user:', JSON.stringify(req.user, null, 2));
    console.log('currentUserId:', currentUserId);
    console.log('userId from params:', userId);
    console.log('parseInt(userId):', parseInt(userId));
    console.log('currentUserId !== parseInt(userId):', currentUserId !== parseInt(userId));
    console.log('userPartyType:', userPartyType);
    console.log('userPartyType !== AppAdmin:', userPartyType !== 'AppAdmin');
    
    if (currentUserId !== parseInt(userId) && userPartyType !== 'AppAdmin') {
      return res.status(403).json({ 
        error: 'Access denied',
        debug: {
          currentUserId,
          requestedUserId: userId,
          parsedUserId: parseInt(userId),
          partyType: userPartyType,
          isMatch: currentUserId === parseInt(userId),
          isAdmin: userPartyType === 'AppAdmin'
        }
      });
    }

    const contracts = await Contract.findAll({
      where: { 
        tdcId: userId, 
        status: { [db.Sequelize.Op.in]: ['SIGNED', 'EXECUTING'] }
      },
      include: [
        { model: User, as: 'tdp', attributes: ['name'] }
      ]
    });

    // Mock training data (in real implementation, this would come from training service)
    const training = contracts.map(contract => ({
      id: contract.id,
      contractId: contract.contractId,
      modelName: `Model-${contract.id}`,
      status: 'EXECUTING',
      progress: Math.floor(Math.random() * 100),
      startDate: contract.createdAt,
      estimatedCompletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      tdpName: contract.tdp?.name,
      datasetCount: contract.datasetCount || 1
    }));

    res.json({ training });
  } catch (error) {
    console.error('TDC training error:', error);
    res.status(500).json({ error: 'Failed to load training progress' });
  }
});

// Get TDC's payments
router.get('/payments/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const currentUserId = req.user.localUser?.id;
    const userPartyType = req.user.localUser?.partyType;
    // Debug logging
    console.log('🔍 TDC Payments Route Debug:');
    console.log('typeof currentUserId:', typeof currentUserId, 'value:', currentUserId);
    console.log('typeof userId:', typeof userId, 'value:', userId);
    console.log('typeof userPartyType:', typeof userPartyType, 'value:', userPartyType);
    console.log('req.user:', JSON.stringify(req.user, null, 2));
    if (Number(currentUserId) !== Number(userId) && userPartyType !== 'AppAdmin') {
      return res.status(403).json({ error: 'Access denied', debug: { currentUserId, userId, userPartyType } });
    }

    const contracts = await Contract.findAll({
      where: { tdcId: userId },
      order: [['createdAt', 'DESC']]
    });

    const payments = {
      totalSpent: 0,
      monthlySpent: 0,
      lastMonthSpent: 0,
      payments: []
    };

    contracts.forEach(contract => {
      const amount = parseFloat(contract.totalPrice || contract.price || 0);
      const payment = {
        contractId: contract.contractId,
        amount,
        status: contract.status,
        createdAt: contract.createdAt
      };

      if (contract.status === 'SIGNED' || contract.status === 'EXECUTING' || contract.status === 'COMPLETED') {
        payments.totalSpent += amount;
        
        const contractDate = new Date(contract.createdAt);
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        if (contractDate.getMonth() === currentMonth && contractDate.getFullYear() === currentYear) {
          payments.monthlySpent += amount;
        }
        
        if (contractDate.getMonth() === (currentMonth - 1) && contractDate.getFullYear() === currentYear) {
          payments.lastMonthSpent += amount;
        }
      }

      payments.payments.push(payment);
    });

    res.json({ payments });
  } catch (error) {
    console.error('TDC payments error:', error);
    res.status(500).json({ error: 'Failed to load payments' });
  }
});

module.exports = router; 