const express = require('express');
const router = express.Router();
const db = require('../models');
const blockchainService = require('../services/blockchainService');
const notificationService = require('../services/notificationService');

// Get all contracts for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, limit = 10, offset = 0 } = req.query;

    const whereClause = {
      [db.Sequelize.Op.or]: [
        { tdpId: userId },
        { tdcId: userId },
        { ccrpId: userId }
      ]
    };

    if (status) {
      whereClause.status = status;
    }

    const contracts = await db.Contract.findAndCountAll({
      where: whereClause,
      include: [
        { model: db.User, as: 'tdp', attributes: ['id', 'name', 'email', 'walletAddress'] },
        { model: db.User, as: 'tdc', attributes: ['id', 'name', 'email', 'walletAddress'] },
        { model: db.User, as: 'ccrp', attributes: ['id', 'name', 'email', 'walletAddress'] },
        { model: db.Dataset, as: 'dataset', attributes: ['id', 'name', 'description', 'category'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      contracts: contracts.rows,
      total: contracts.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error getting user contracts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific contract
router.get('/:contractId', async (req, res) => {
  try {
    const { contractId } = req.params;

    const contract = await db.Contract.findOne({
      where: { contractId },
      include: [
        { model: db.User, as: 'tdp', attributes: ['id', 'name', 'email', 'walletAddress'] },
        { model: db.User, as: 'tdc', attributes: ['id', 'name', 'email', 'walletAddress'] },
        { model: db.User, as: 'ccrp', attributes: ['id', 'name', 'email', 'walletAddress'] },
        { model: db.Dataset, as: 'dataset', attributes: ['id', 'name', 'description', 'category', 'price'] }
      ]
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    res.json(contract);
  } catch (error) {
    console.error('Error getting contract:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new contract
router.post('/', async (req, res) => {
  try {
    const {
      tdpWalletAddress,
      datasetId,
      modelId,
      price,
      duration,
      termsAndConditions,
      tdcPrivateKey,
      ccrpWalletAddress
    } = req.body;

    // Validate required fields
    if (!tdpWalletAddress || !datasetId || !modelId || !price || !duration || !termsAndConditions) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get TDP user
    const tdpUser = await db.User.findOne({
      where: { walletAddress: tdpWalletAddress, partyType: 'TDP' }
    });

    if (!tdpUser) {
      return res.status(404).json({ error: 'TDP not found' });
    }

    // Get dataset
    const dataset = await db.Dataset.findOne({
      where: { datasetId, ownerId: tdpUser.id }
    });

    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found or not owned by TDP' });
    }

    // Get TDC user from private key (in production, use proper authentication)
    const { ethers } = require('ethers');
    const wallet = new ethers.Wallet(tdcPrivateKey);
    const tdcUser = await db.User.findOne({
      where: { walletAddress: wallet.address, partyType: 'TDC' }
    });

    if (!tdcUser) {
      return res.status(404).json({ error: 'TDC not found' });
    }

    // Create contract on blockchain
    const blockchainResult = await blockchainService.createContract(
      tdpWalletAddress,
      datasetId,
      modelId,
      price,
      duration,
      termsAndConditions,
      tdcPrivateKey
    );

    // Check if blockchain contract creation was successful
    if (!blockchainResult.success || !blockchainResult.contractId) {
      return res.status(500).json({ error: 'Failed to create contract on blockchain' });
    }

    // Get CCRP user if provided
    let ccrpUser = null;
    if (ccrpWalletAddress) {
      ccrpUser = await db.User.findOne({
        where: { walletAddress: ccrpWalletAddress, partyType: 'CCRP' }
      });

      if (!ccrpUser) {
        return res.status(404).json({ error: 'CCRP not found' });
      }
    }

    // Create contract in database
    const contract = await db.Contract.create({
      contractId: `CONTRACT-${Date.now()}`,
      blockchainContractId: blockchainResult.contractId,
      tdpId: tdpUser.id,
      tdcId: tdcUser.id,
      ccrpId: ccrpUser ? ccrpUser.id : null,
      datasetId: dataset.id,
      modelId,
      price,
      duration,
      termsAndConditions,
      status: ccrpUser ? 'PENDING_TDP_APPROVAL' : 'PENDING_CCRP_APPROVAL'
    });

    // Get full contract with associations
    const fullContract = await db.Contract.findOne({
      where: { id: contract.id },
      include: [
        { model: db.User, as: 'tdp' },
        { model: db.User, as: 'tdc' },
        { model: db.User, as: 'ccrp' },
        { model: db.Dataset, as: 'dataset' }
      ]
    });

    // Send notifications
    await notificationService.notifyContractCreated(fullContract, tdpUser);
    
    // If CCRP was selected, send notification to CCRP
    if (ccrpUser) {
      await notificationService.notifyCCRPSelected(fullContract, ccrpUser);
    }

    res.status(201).json({
      success: true,
      contract: fullContract,
      blockchainTransaction: blockchainResult
    });
  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get contract signing data (for client-side signing)
router.get('/:contractId/signing-data', async (req, res) => {
  try {
    const { contractId } = req.params;

    // Get contract
    const contract = await db.Contract.findOne({
      where: { contractId },
      include: [
        { model: db.User, as: 'tdp' },
        { model: db.User, as: 'tdc' },
        { model: db.User, as: 'ccrp' },
        { model: db.Dataset, as: 'dataset' }
      ]
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Check if blockchain contract ID exists
    if (!contract.blockchainContractId) {
      return res.status(400).json({ error: 'Contract not yet created on blockchain' });
    }

    // Get transaction data for signing
    const signingData = await blockchainService.getContractSigningData(contract.blockchainContractId);

    res.json({
      success: true,
      signingData,
      contract
    });
  } catch (error) {
    console.error('Error getting signing data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sign contract (SECURE - accepts signed transaction)
router.post('/:contractId/sign', async (req, res) => {
  try {
    const { contractId } = req.params;
    const { signedTransaction, userWalletAddress } = req.body;

    if (!signedTransaction || !userWalletAddress) {
      return res.status(400).json({ 
        error: 'Missing required parameters: signedTransaction and userWalletAddress' 
      });
    }

    // Get contract
    const contract = await db.Contract.findOne({
      where: { contractId },
      include: [
        { model: db.User, as: 'tdp' },
        { model: db.User, as: 'tdc' },
        { model: db.User, as: 'ccrp' },
        { model: db.Dataset, as: 'dataset' }
      ]
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Get user by wallet address
    const user = await db.User.findOne({
      where: { walletAddress: userWalletAddress }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify user is part of the contract
    if (user.id !== contract.tdpId && user.id !== contract.tdcId && user.id !== contract.ccrpId) {
      return res.status(403).json({ error: 'Not authorized to sign this contract' });
    }

    // Check if blockchain contract ID exists
    if (!contract.blockchainContractId) {
      return res.status(400).json({ error: 'Contract not yet created on blockchain' });
    }

    // Broadcast the signed transaction to blockchain
    const blockchainResult = await blockchainService.broadcastSignedTransaction(signedTransaction);

    // Update contract status in database
    let newStatus = contract.status;
    let signerType = '';

    if (user.partyType === 'TDP' && !contract.tdpSigned) {
      contract.tdpSigned = true;
      contract.tdpSignedAt = new Date();
      newStatus = 'PENDING_CCRP_APPROVAL';
      signerType = 'TDP';
    } else if (user.partyType === 'CCRP' && !contract.ccrpSigned) {
      contract.ccrpSigned = true;
      contract.ccrpSignedAt = new Date();
      newStatus = 'ACTIVE';
      signerType = 'CCRP';
    }

    contract.status = newStatus;
    await contract.save();

    // Send notifications
    await notificationService.notifyContractSigned(contract, user, signerType);

    res.json({
      success: true,
      contract,
      blockchainTransaction: blockchainResult
    });
  } catch (error) {
    console.error('Error signing contract:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Select CCRP (SECURE - accepts signed transaction)
router.post('/:contractId/select-ccrp', async (req, res) => {
  try {
    const { contractId } = req.params;
    const { ccrpWalletAddress, signedTransaction, userWalletAddress } = req.body;

    if (!signedTransaction || !userWalletAddress || !ccrpWalletAddress) {
      return res.status(400).json({ 
        error: 'Missing required parameters: signedTransaction, userWalletAddress, and ccrpWalletAddress' 
      });
    }

    // Get contract
    const contract = await db.Contract.findOne({
      where: { contractId },
      include: [
        { model: db.User, as: 'tdp' },
        { model: db.User, as: 'tdc' },
        { model: db.Dataset, as: 'dataset' }
      ]
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Verify TDC is making the request
    const tdcUser = await db.User.findOne({
      where: { walletAddress: userWalletAddress, partyType: 'TDC' }
    });

    if (!tdcUser || tdcUser.id !== contract.tdcId) {
      return res.status(403).json({ error: 'Only TDC can select CCRP' });
    }

    // Get CCRP user
    const ccrpUser = await db.User.findOne({
      where: { walletAddress: ccrpWalletAddress, partyType: 'CCRP' }
    });

    if (!ccrpUser) {
      return res.status(404).json({ error: 'CCRP not found' });
    }

    // Broadcast the signed transaction to blockchain
    const blockchainResult = await blockchainService.broadcastSignedTransaction(signedTransaction);

    // Update contract in database
    contract.ccrpId = ccrpUser.id;
    await contract.save();

    // Get updated contract with CCRP
    const updatedContract = await db.Contract.findOne({
      where: { contractId },
      include: [
        { model: db.User, as: 'tdp' },
        { model: db.User, as: 'tdc' },
        { model: db.User, as: 'ccrp' },
        { model: db.Dataset, as: 'dataset' }
      ]
    });

    // Send notification to CCRP
    await notificationService.notifyCCRPSelected(updatedContract, ccrpUser);

    res.json({
      success: true,
      contract: updatedContract,
      blockchainTransaction: blockchainResult
    });
  } catch (error) {
    console.error('Error selecting CCRP:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete contract
router.post('/:contractId/complete', async (req, res) => {
  try {
    const { contractId } = req.params;
    const { privateKey } = req.body;

    // Get contract
    const contract = await db.Contract.findOne({
      where: { contractId },
      include: [
        { model: db.User, as: 'tdp' },
        { model: db.User, as: 'tdc' },
        { model: db.User, as: 'ccrp' },
        { model: db.Dataset, as: 'dataset' }
      ]
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    if (contract.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Contract must be active to complete' });
    }

    // Update contract status
    contract.status = 'COMPLETED';
    await contract.save();

    // Send notifications
    await notificationService.notifyContractCompleted(contract);

    res.json({
      success: true,
      contract
    });
  } catch (error) {
    console.error('Error completing contract:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel contract
router.post('/:contractId/cancel', async (req, res) => {
  try {
    const { contractId } = req.params;
    const { privateKey } = req.body;

    // Get contract
    const contract = await db.Contract.findOne({
      where: { contractId },
      include: [
        { model: db.User, as: 'tdp' },
        { model: db.User, as: 'tdc' },
        { model: db.User, as: 'ccrp' },
        { model: db.Dataset, as: 'dataset' }
      ]
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    if (contract.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Cannot cancel completed contract' });
    }

    // Get user from private key
    const { ethers } = require('ethers');
    const wallet = new ethers.Wallet(privateKey);
    const user = await db.User.findOne({
      where: { walletAddress: wallet.address }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify user is part of the contract
    if (user.id !== contract.tdpId && user.id !== contract.tdcId && user.id !== contract.ccrpId) {
      return res.status(403).json({ error: 'Not authorized to cancel this contract' });
    }

    // Update contract status
    contract.status = 'CANCELLED';
    await contract.save();

    // Send notifications
    await notificationService.notifyContractCancelled(contract, user);

    res.json({
      success: true,
      contract
    });
  } catch (error) {
    console.error('Error cancelling contract:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 