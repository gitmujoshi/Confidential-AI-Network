/**
 * Training Routes - Training Orchestration API
 * 
 * Handles training environment provisioning, execution, monitoring,
 * and result retrieval for contracts.
 */

const express = require('express');
const router = express.Router();
const db = require('../models');
const TrainingService = require('../services/trainingService');
const { authenticateToken } = require('../middleware/auth');

const trainingService = new TrainingService();

/**
 * Trigger training run for a contract
 * POST /api/training/:contractId/trigger
 */
router.post('/:contractId/trigger', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Trigger training request:', {
      contractId: req.params.contractId,
      user: req.user?.localUser?.email
    });

    const { contractId } = req.params;

    if (!contractId) {
      return res.status(400).json({ error: 'Contract ID is required' });
    }

    // Verify contract exists and user has access
    const contract = await db.Contract.findOne({
      where: { contractId },
      include: [
        { model: db.User, as: 'tdc' },
        { model: db.User, as: 'ccrp' }
      ]
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Check if user has permission to trigger training
    const currentUserId = req.user.localUser?.id;
    const userPartyType = req.user.localUser?.partyType;
    
    const canTrigger = 
      userPartyType === 'AppAdmin' ||
      (userPartyType === 'TDC' && contract.tdcId === currentUserId) ||
      (userPartyType === 'CCRP' && contract.ccrpId === currentUserId);

    if (!canTrigger) {
      return res.status(403).json({ 
        error: 'Access denied. Only TDC, CCRP, or AppAdmin can trigger training.',
        debug: {
          currentUserId,
          userPartyType,
          contractTdcId: contract.tdcId,
          contractCcrpId: contract.ccrpId
        }
      });
    }

    // Check if training already exists
    const existingTraining = await db.TrainingJob.findOne({
      where: { contractId }
    });

    if (existingTraining) {
      return res.status(400).json({ 
        error: 'Training already exists for this contract',
        trainingJob: existingTraining
      });
    }

    // Trigger training
    const trainingJob = await trainingService.triggerTrainingRun(contractId);

    res.json({
      success: true,
      message: 'Training triggered successfully',
      trainingJob: {
        jobId: trainingJob.jobId,
        contractId: trainingJob.contractId,
        status: trainingJob.status,
        estimatedDuration: trainingJob.estimatedDuration,
        cloudProvider: trainingJob.cloudProvider,
        createdAt: trainingJob.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Error triggering training:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.stack
    });
  }
});

/**
 * Get training status for a contract
 * GET /api/training/:contractId/status
 */
router.get('/:contractId/status', authenticateToken, async (req, res) => {
  try {
    const { contractId } = req.params;

    if (!contractId) {
      return res.status(400).json({ error: 'Contract ID is required' });
    }

    // Verify contract exists and user has access
    const contract = await db.Contract.findOne({
      where: { contractId },
      include: [
        { model: db.User, as: 'tdc' },
        { model: db.User, as: 'ccrp' }
      ]
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Check if user has permission to view training status
    const currentUserId = req.user.localUser?.id;
    const userPartyType = req.user.localUser?.partyType;
    
    const canView = 
      userPartyType === 'AppAdmin' ||
      (userPartyType === 'TDC' && contract.tdcId === currentUserId) ||
      (userPartyType === 'CCRP' && contract.ccrpId === currentUserId) ||
      (userPartyType === 'TDP' && contract.contractDatasets?.some(ds => ds.tdpId === currentUserId));

    if (!canView) {
      return res.status(403).json({ 
        error: 'Access denied. Only contract parties can view training status.',
        debug: {
          currentUserId,
          userPartyType,
          contractTdcId: contract.tdcId,
          contractCcrpId: contract.ccrpId
        }
      });
    }

    // Get training status
    const status = await trainingService.getTrainingStatus(contractId);

    res.json({
      success: true,
      status
    });

  } catch (error) {
    console.error('❌ Error getting training status:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.stack
    });
  }
});

/**
 * Get training results for a contract
 * GET /api/training/:contractId/results
 */
router.get('/:contractId/results', authenticateToken, async (req, res) => {
  try {
    const { contractId } = req.params;

    if (!contractId) {
      return res.status(400).json({ error: 'Contract ID is required' });
    }

    // Verify contract exists and user has access
    const contract = await db.Contract.findOne({
      where: { contractId },
      include: [
        { model: db.User, as: 'tdc' },
        { model: db.User, as: 'ccrp' }
      ]
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Check if user has permission to view training results
    const currentUserId = req.user.localUser?.id;
    const userPartyType = req.user.localUser?.partyType;
    
    const canView = 
      userPartyType === 'AppAdmin' ||
      (userPartyType === 'TDC' && contract.tdcId === currentUserId) ||
      (userPartyType === 'CCRP' && contract.ccrpId === currentUserId) ||
      (userPartyType === 'TDP' && contract.contractDatasets?.some(ds => ds.tdpId === currentUserId));

    if (!canView) {
      return res.status(403).json({ 
        error: 'Access denied. Only contract parties can view training results.',
        debug: {
          currentUserId,
          userPartyType,
          contractTdcId: contract.tdcId,
          contractCcrpId: contract.ccrpId
        }
      });
    }

    // Get training results
    const results = await trainingService.getTrainingResults(contractId);

    res.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('❌ Error getting training results:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.stack
    });
  }
});

/**
 * Get all training jobs for a user
 * GET /api/training/jobs
 */
router.get('/jobs', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.localUser?.id;
    const userPartyType = req.user.localUser?.partyType;

    let whereClause = {};

    // Filter by user's role
    if (userPartyType === 'TDC') {
      whereClause = { createdBy: currentUserId };
    } else if (userPartyType === 'CCRP') {
      // Get contracts where user is CCRP
      const contracts = await db.Contract.findAll({
        where: { ccrpId: currentUserId },
        attributes: ['contractId']
      });
      whereClause = { 
        contractId: contracts.map(c => c.contractId)
      };
    } else if (userPartyType === 'TDP') {
      // Get contracts where user is TDP
      const contracts = await db.Contract.findAll({
        where: {
          contractDatasets: {
            [db.Sequelize.Op.contains]: [{ tdpId: currentUserId }]
          }
        },
        attributes: ['contractId']
      });
      whereClause = { 
        contractId: contracts.map(c => c.contractId)
      };
    }
    // AppAdmin can see all jobs

    const trainingJobs = await db.TrainingJob.findAll({
      where: whereClause,
      include: [
        { 
          model: db.Contract, 
          as: 'contract',
          include: [
            { model: db.User, as: 'tdc', attributes: ['name', 'email'] },
            { model: db.User, as: 'ccrp', attributes: ['name', 'email'] }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      trainingJobs: trainingJobs.map(job => ({
        jobId: job.jobId,
        contractId: job.contractId,
        status: job.status,
        cloudProvider: job.cloudProvider,
        estimatedDuration: job.estimatedDuration,
        progress: trainingService.calculateProgress(job),
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        contract: job.contract ? {
          contractId: job.contract.contractId,
          tdc: job.contract.tdc,
          ccrp: job.contract.ccrp
        } : null
      }))
    });

  } catch (error) {
    console.error('❌ Error getting training jobs:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.stack
    });
  }
});

/**
 * Cancel training job
 * POST /api/training/:contractId/cancel
 */
router.post('/:contractId/cancel', authenticateToken, async (req, res) => {
  try {
    const { contractId } = req.params;

    if (!contractId) {
      return res.status(400).json({ error: 'Contract ID is required' });
    }

    // Verify contract exists and user has access
    const contract = await db.Contract.findOne({
      where: { contractId },
      include: [
        { model: db.User, as: 'tdc' },
        { model: db.User, as: 'ccrp' }
      ]
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Check if user has permission to cancel training
    const currentUserId = req.user.localUser?.id;
    const userPartyType = req.user.localUser?.partyType;
    
    const canCancel = 
      userPartyType === 'AppAdmin' ||
      (userPartyType === 'TDC' && contract.tdcId === currentUserId) ||
      (userPartyType === 'CCRP' && contract.ccrpId === currentUserId);

    if (!canCancel) {
      return res.status(403).json({ 
        error: 'Access denied. Only TDC, CCRP, or AppAdmin can cancel training.'
      });
    }

    // Get training job
    const trainingJob = await db.TrainingJob.findOne({
      where: { contractId }
    });

    if (!trainingJob) {
      return res.status(404).json({ error: 'Training job not found' });
    }

    if (trainingJob.status === 'COMPLETED' || trainingJob.status === 'FAILED') {
      return res.status(400).json({ error: 'Cannot cancel completed or failed training' });
    }

    // Cancel training job
    await trainingJob.update({
      status: 'CANCELLED',
      cancelledAt: new Date()
    });

    // Update contract status
    await contract.update({
      status: 'SIGNED',
      multiTdpStatus: 'SIGNED'
    });

    res.json({
      success: true,
      message: 'Training cancelled successfully',
      trainingJob: {
        jobId: trainingJob.jobId,
        status: trainingJob.status,
        cancelledAt: trainingJob.cancelledAt
      }
    });

  } catch (error) {
    console.error('❌ Error cancelling training:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.stack
    });
  }
});

module.exports = router; 