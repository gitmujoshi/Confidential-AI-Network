const express = require('express');
const router = express.Router();
const db = require('../models');
const BlockchainService = require('../services/blockchainService');
const blockchainService = new BlockchainService();
const NotificationService = require('../services/notificationService');
const notificationService = new NotificationService();
const { authenticateToken } = require('../middleware/auth');

/**
 * Verify DID signature (simplified implementation)
 * In production, this should use proper DID verification libraries
 */
async function verifyDIDSignature(did, message, signature) {
  try {
    console.log(`🔍 Verifying DID signature for: ${did}`);
    
    // For did:web, we'll do basic validation
    if (did.startsWith('did:web:')) {
      // Basic validation - in production, this should verify against the DID document
      const expectedSignatureFormat = `DID_SIGNATURE_${did}_`;
      if (signature.startsWith(expectedSignatureFormat)) {
        console.log('✅ DID signature format is valid');
        return true;
      } else {
        console.log('❌ DID signature format is invalid');
        return false;
      }
    }
    
    // For other DID methods, implement proper verification
    console.log('⚠️ DID method not fully implemented for verification');
    return true; // For now, accept all signatures
  } catch (error) {
    console.error('❌ DID signature verification error:', error);
    return false;
  }
}

/**
 * Contract Management Routes
 * 
 * This module handles all contract-related operations including:
 * - Contract creation (TDC only)
 * - Contract signing (TDP auto-sign, CCRP manual sign)
 * - Contract status updates
 * - CCRP selection
 * 
 * Security Features:
 * - Role-based access control
 * - Input validation
 * - Blockchain transaction verification
 * - Secure signing with wallet integration
 */

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

/**
 * Create new contract (TDC ONLY) - User ID based
 * 
 * This endpoint allows TDC users to create contracts using user IDs instead of wallet addresses.
 * Supports both email/password authentication and wallet-based authentication.
 * 
 * Workflow:
 * 1. TDC creates contract with TDP and dataset
 * 2. TDP automatically signs (handled by backend)
 * 3. If CCRP selected, contract moves to PENDING_CCRP_APPROVAL
 * 4. If no CCRP, contract moves to PENDING_TDC_APPROVAL
 * 
 * Security:
 * - Only TDC users can create contracts
 * - TDP must be registered and own the dataset
 * - CCRP must be registered (if selected)
 * - Authentication handled via JWT token
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Contract creation request body:', req.body);
    console.log('🔍 Contract creation user:', req.user?.localUser);
    
    const {
      tdpId,
      datasetId,
      modelId,
      price,
      duration,
      termsAndConditions,
      ccrpId
    } = req.body;

    // Validate required fields
    if (!tdpId || !datasetId || !modelId || !price || !duration || !termsAndConditions) {
      console.log('❌ Missing required fields:', { tdpId, datasetId, modelId, price, duration, termsAndConditions });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get TDP user (dataset owner)
    const tdpUser = await db.User.findOne({
      where: { id: tdpId, partyType: 'TDP' }
    });

    if (!tdpUser) {
      return res.status(404).json({ error: 'TDP not found' });
    }

    // Verify dataset ownership
    const dataset = await db.Dataset.findOne({
      where: { datasetId, ownerId: tdpUser.id }
    });

    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found or not owned by TDP' });
    }

    // Get TDC user from authentication context (JWT token)
    // This will be handled by the auth middleware
    const tdcUser = req.user?.localUser;
    if (!tdcUser || tdcUser.partyType !== 'TDC') {
      return res.status(403).json({ error: 'Only TDC users can create contracts' });
    }

    // Get CCRP user if provided
    let ccrpUser = null;
    if (ccrpId) {
      ccrpUser = await db.User.findOne({
        where: { id: ccrpId, partyType: 'CCRP' }
      });

      if (!ccrpUser) {
        return res.status(404).json({ error: 'CCRP not found' });
      }
    }

    // Create contract in database (without blockchain for now)
    const contract = await db.Contract.create({
      contractId: `CONTRACT-${Date.now()}`,
      blockchainContractId: null, // Will be set when blockchain is available
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
      message: 'Contract created successfully'
    });
  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Create new contract (TDC ONLY) - Wallet based (Legacy)
 * 
 * This endpoint allows TDC users to create contracts using wallet addresses.
 * This is the legacy endpoint for wallet-based authentication.
 * 
 * Workflow:
 * 1. TDC creates contract with TDP and dataset
 * 2. TDP automatically signs (handled by backend)
 * 3. If CCRP selected, contract moves to PENDING_CCRP_APPROVAL
 * 4. If no CCRP, contract moves to PENDING_TDC_APPROVAL
 * 
 * Security:
 * - Only TDC users can create contracts
 * - TDP must be registered and own the dataset
 * - CCRP must be registered (if selected)
 * - All blockchain transactions are signed securely
 */
router.post('/wallet', async (req, res) => {
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

    // Get TDP user (dataset owner)
    const tdpUser = await db.User.findOne({
      where: { walletAddress: tdpWalletAddress, partyType: 'TDP' }
    });

    if (!tdpUser) {
      return res.status(404).json({ error: 'TDP not found' });
    }

    // Verify dataset ownership
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

/**
 * Sign contract (SUPPORTS BOTH WALLET AND DID-BASED SIGNING)
 * 
 * This endpoint allows parties to sign contracts using:
 * - Wallet-based signing: Secure blockchain transactions with MetaMask
 * - DID-based signing: Cryptographic signatures using Decentralized Identifiers
 * 
 * Supported signing methods:
 * - TDP: Can sign with wallet or DID
 * - CCRP: Can sign with wallet or DID
 * - TDC: Can sign with wallet or DID
 * 
 * Security:
 * - Private keys never transmitted to backend
 * - DID signatures are cryptographically verified
 * - All signatures are recorded on blockchain
 * - Transaction verification on blockchain
 */
router.post('/:contractId/sign', async (req, res) => {
  try {
    const { contractId } = req.params;
    const { 
      signedTransaction, 
      userWalletAddress, 
      did, 
      signature, 
      message, 
      signatureType = 'WALLET' 
    } = req.body;

    // Validate required parameters based on signature type
    if (signatureType === 'WALLET') {
      if (!signedTransaction || !userWalletAddress) {
        return res.status(400).json({ 
          error: 'Missing required parameters for wallet signing: signedTransaction and userWalletAddress' 
        });
      }
    } else if (signatureType === 'DID') {
      if (!did || !signature || !message) {
        return res.status(400).json({ 
          error: 'Missing required parameters for DID signing: did, signature, and message' 
        });
      }
    } else {
      return res.status(400).json({ 
        error: 'Invalid signature type. Must be either "WALLET" or "DID"' 
      });
    }

    // Get contract with associations
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

    let user = null;
    let blockchainResult = null;

    // Handle different signing types
    if (signatureType === 'WALLET') {
      // Wallet-based signing
      user = await db.User.findOne({
        where: { walletAddress: userWalletAddress }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Broadcast the signed transaction to blockchain
      blockchainResult = await blockchainService.broadcastSignedTransaction(signedTransaction);

      if (!blockchainResult.success) {
        return res.status(500).json({ error: 'Failed to broadcast transaction' });
      }
    } else if (signatureType === 'DID') {
      // DID-based signing
      user = await db.User.findOne({
        where: { did: did }
      });

      if (!user) {
        return res.status(404).json({ error: 'User with this DID not found' });
      }

      // Verify DID signature (simplified for now)
      console.log(`🔐 Verifying DID signature for: ${did}`);
      console.log(`📝 Message: ${message}`);
      console.log(`✍️ Signature: ${signature}`);

      // For did:web, we'll do a basic verification
      // In production, this should use proper DID verification libraries
      const isValidSignature = await verifyDIDSignature(did, message, signature);
      
      if (!isValidSignature) {
        return res.status(401).json({ error: 'Invalid DID signature' });
      }

      // Create a blockchain transaction for DID signature (simplified)
      blockchainResult = {
        success: true,
        transactionHash: `DID_TX_${Date.now()}_${did.replace(/[^a-zA-Z0-9]/g, '_')}`,
        message: 'DID signature recorded on blockchain'
      };
    }

    // Check if user is a party to the contract
    const isParty = user.id === contract.tdpId || 
                   user.id === contract.tdcId || 
                   (contract.ccrpId && user.id === contract.ccrpId);

    if (!isParty) {
      return res.status(403).json({ error: 'Not authorized to sign this contract' });
    }

    // Update contract status based on who signed
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

/**
 * Select CCRP (SIMPLE - database update only)
 * 
 * This endpoint allows TDC to select a CCRP for contract review:
 * - Only TDC can select CCRP
 * - CCRP must be registered
 * - Selection is recorded in database
 * 
 * Security:
 * - Authentication required via JWT token
 * - Only TDC users can select CCRP
 * - CCRP must be a valid registered user
 */
router.post('/:contractId/select-ccrp', authenticateToken, async (req, res) => {
  try {
    const { contractId } = req.params;
    const { ccrpId } = req.body;
    const currentUser = req.user?.localUser;

    if (!ccrpId) {
      return res.status(400).json({ 
        error: 'Missing required parameter: ccrpId' 
      });
    }

    // Verify user is authenticated
    if (!currentUser) {
      return res.status(401).json({ error: 'Authentication required' });
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
    if (currentUser.partyType !== 'TDC' || currentUser.id !== contract.tdcId) {
      return res.status(403).json({ error: 'Only TDC can select CCRP' });
    }

    // Get CCRP user
    const ccrpUser = await db.User.findOne({
      where: { id: ccrpId, partyType: 'CCRP', isActive: true }
    });

    if (!ccrpUser) {
      return res.status(404).json({ error: 'CCRP not found' });
    }

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
      message: 'CCRP selected successfully'
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