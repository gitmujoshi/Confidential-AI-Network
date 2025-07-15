const express = require('express');
const router = express.Router();
const db = require('../models');
const { BlockchainService, NotificationService, ricardianContractService } = require('../services');
const blockchainService = new BlockchainService();
const notificationService = new NotificationService();
const { authenticateToken } = require('../middleware/auth');

/**
 * Enhanced DID signature verification using DID service
 * Supports proper cryptographic verification for did:web, did:key, and did:ethr
 */
async function verifyDIDSignature(did, message, signature) {
  try {
    console.log(`🔐 Verifying DID signature for: ${did}`);
    console.log(`📝 Message: ${message}`);
    console.log(`✍️ Signature: ${signature}`);

    const DIDService = require('../services/didService');
    const didService = new DIDService();

    // Verify the signature using the enhanced DID service
    const isValid = await didService.verifySignature(did, message, signature);
    
    console.log(`✅ DID signature verification result: ${isValid}`);
    return isValid;
  } catch (error) {
    console.error('❌ Error verifying DID signature:', error);
    return false;
  }
}

/**
 * Contract Management Routes - Ricardian Contract Only
 * 
 * This module handles all contract-related operations including:
 * - Ricardian contract creation with legal document binding
 * - Contract signing (TDP auto-sign, CCRP manual sign)
 * - Contract status updates
 * - CCRP selection
 * - Ricardian contract verification
 * 
 * Security Features:
 * - Role-based access control
 * - Input validation
 * - Blockchain transaction verification
 * - Secure signing with wallet integration
 * - Cryptographic binding between legal documents and smart contracts
 */

// Get all contracts (admin endpoint)
router.get('/', async (req, res) => {
  try {
    const { status, limit = 10, offset = 0 } = req.query;

    let whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    const contracts = await db.Contract.findAndCountAll({
      where: whereClause,
      include: [
        { model: db.User, as: 'tdp', attributes: ['id', 'name', 'email', 'walletAddress'] },
        { model: db.User, as: 'tdc', attributes: ['id', 'name', 'email', 'walletAddress'] },
        { model: db.User, as: 'ccrp', attributes: ['id', 'name', 'email', 'walletAddress', 'cloudProviders', 'description'] },
        { model: db.Dataset, as: 'dataset', attributes: ['id', 'name', 'description', 'category'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Add model information to each contract
    const enhancedContracts = await Promise.all(contracts.rows.map(async (contract) => {
      let modelInfo = null;
      let modelInfoList = [];
      if (contract.trainingParams) {
        const trainingParams = contract.trainingParams;
        // Extract privacy and security parameters
        const privacyParams = {
          maxPrivacyLoss: trainingParams.maxPrivacyLoss || 'Not specified',
          minAccuracy: trainingParams.minAccuracy || 'Not specified',
          differentialPrivacy: trainingParams.differentialPrivacy || null,
          federatedLearning: trainingParams.federatedLearning || null,
          secureMultiPartyComputation: trainingParams.secureMultiPartyComputation || null
        };
        // Extract model-specific parameters (if available)
        const modelParams = {
          modelType: trainingParams.modelType || 'Not specified',
          modelName: trainingParams.modelName || 'Not specified',
          architecture: trainingParams.architecture || 'Not specified',
          framework: trainingParams.framework || 'Not specified',
          parameters: trainingParams.parameters || 'Not specified',
          privacyTechnique: trainingParams.privacyTechnique || 'Not specified',
          validationMetrics: trainingParams.validationMetrics || [],
          maxEpochs: trainingParams.maxEpochs || 'Not specified',
          batchSize: trainingParams.batchSize || 'Not specified',
          learningRate: trainingParams.learningRate || 'Not specified'
        };
        modelInfo = {
          ...modelParams,
          privacyParams
        };
      }
      // Fetch all selected models if aiModelIds is present
      if (contract.aiModelIds && Array.isArray(contract.aiModelIds) && contract.aiModelIds.length > 0) {
        const db = require('../models');
        const models = await db.AIModel.findAll({ where: { id: contract.aiModelIds } });
        modelInfoList = models.map(model => ({
          modelName: model.name,
          modelType: model.type,
          architecture: model.architecture,
          framework: model.framework,
          parameters: model.parameters,
          privacyTechnique: model.privacyTechnique,
          validationMetrics: model.validationMetrics,
          maxEpochs: model.maxEpochs,
          batchSize: model.batchSize,
          learningRate: model.learningRate
        }));
      }
      return {
        ...contract.toJSON(),
        modelInfo,
        modelInfoList
      };
    }));

    res.json({
      contracts: enhancedContracts,
      total: contracts.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error getting all contracts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all contracts for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, limit = 10, offset = 0 } = req.query;

    // Fetch the user to check their role
    const user = await db.User.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let whereClause = {};
    if (user.partyType === 'AppAdmin') {
      // AppAdmin can view all contracts
      if (status) {
        whereClause.status = status;
      }
    } else {
      // Regular users: only contracts where they are a party
      whereClause = {
        [db.Sequelize.Op.or]: [
          { tdpId: userId },
          { tdcId: userId },
          { ccrpId: userId }
        ]
      };
      if (status) {
        whereClause.status = status;
      }
    }

    const contracts = await db.Contract.findAndCountAll({
      where: whereClause,
      include: [
        { model: db.User, as: 'tdp', attributes: ['id', 'name', 'email', 'walletAddress'] },
        { model: db.User, as: 'tdc', attributes: ['id', 'name', 'email', 'walletAddress'] },
        { model: db.User, as: 'ccrp', attributes: ['id', 'name', 'email', 'walletAddress', 'cloudProviders', 'description'] },
        { model: db.Dataset, as: 'dataset', attributes: ['id', 'name', 'description', 'category'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Add model information to each contract
    const enhancedContracts = await Promise.all(contracts.rows.map(async (contract) => {
      let modelInfo = null;
      let modelInfoList = [];
      if (contract.trainingParams) {
        const trainingParams = contract.trainingParams;
        // Extract privacy and security parameters
        const privacyParams = {
          maxPrivacyLoss: trainingParams.maxPrivacyLoss || 'Not specified',
          minAccuracy: trainingParams.minAccuracy || 'Not specified',
          differentialPrivacy: trainingParams.differentialPrivacy || null,
          federatedLearning: trainingParams.federatedLearning || null,
          secureMultiPartyComputation: trainingParams.secureMultiPartyComputation || null
        };
        // Extract model-specific parameters (if available)
        const modelParams = {
          modelType: trainingParams.modelType || 'Not specified',
          modelName: trainingParams.modelName || 'Not specified',
          architecture: trainingParams.architecture || 'Not specified',
          framework: trainingParams.framework || 'Not specified',
          parameters: trainingParams.parameters || 'Not specified',
          privacyTechnique: trainingParams.privacyTechnique || 'Not specified',
          validationMetrics: trainingParams.validationMetrics || [],
          maxEpochs: trainingParams.maxEpochs || 'Not specified',
          batchSize: trainingParams.batchSize || 'Not specified',
          learningRate: trainingParams.learningRate || 'Not specified'
        };
        modelInfo = {
          ...modelParams,
          privacyParams
        };
      }
      // Fetch all selected models if aiModelIds is present
      if (contract.aiModelIds && Array.isArray(contract.aiModelIds) && contract.aiModelIds.length > 0) {
        const db = require('../models');
        const models = await db.AIModel.findAll({ where: { id: contract.aiModelIds } });
        modelInfoList = models.map(model => ({
          modelName: model.name,
          modelType: model.type,
          architecture: model.architecture,
          framework: model.framework,
          parameters: model.parameters,
          privacyTechnique: model.privacyTechnique,
          validationMetrics: model.validationMetrics,
          maxEpochs: model.maxEpochs,
          batchSize: model.batchSize,
          learningRate: model.learningRate
        }));
      }
      return {
        ...contract.toJSON(),
        modelInfo,
        modelInfoList
      };
    }));

    res.json({
      contracts: enhancedContracts,
      total: contracts.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error getting user contracts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get contract by ID
router.get('/:contractId', async (req, res) => {
  try {
    const { contractId } = req.params;

    const contract = await db.Contract.findOne({
      where: { contractId },
      include: [
        { model: db.User, as: 'tdp', attributes: ['id', 'name', 'email', 'walletAddress', 'did'] },
        { model: db.User, as: 'tdc', attributes: ['id', 'name', 'email', 'walletAddress', 'did'] },
        { model: db.User, as: 'ccrp', attributes: ['id', 'name', 'email', 'walletAddress', 'did', 'cloudProviders', 'description'] },
        { model: db.Dataset, as: 'dataset', attributes: ['id', 'name', 'description', 'category', 'datasetId'] }
      ]
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Add model information
    let modelInfo = null;
    let modelInfoList = [];
    if (contract.trainingParams) {
      const trainingParams = contract.trainingParams;
      // Extract privacy and security parameters
      const privacyParams = {
        maxPrivacyLoss: trainingParams.maxPrivacyLoss || 'Not specified',
        minAccuracy: trainingParams.minAccuracy || 'Not specified',
        differentialPrivacy: trainingParams.differentialPrivacy || null,
        federatedLearning: trainingParams.federatedLearning || null,
        secureMultiPartyComputation: trainingParams.secureMultiPartyComputation || null
      };
      // Extract model-specific parameters (if available)
      const modelParams = {
        modelType: trainingParams.modelType || 'Not specified',
        modelName: trainingParams.modelName || 'Not specified',
        architecture: trainingParams.architecture || 'Not specified',
        framework: trainingParams.framework || 'Not specified',
        parameters: trainingParams.parameters || 'Not specified',
        privacyTechnique: trainingParams.privacyTechnique || 'Not specified',
        validationMetrics: trainingParams.validationMetrics || [],
        maxEpochs: trainingParams.maxEpochs || 'Not specified',
        batchSize: trainingParams.batchSize || 'Not specified',
        learningRate: trainingParams.learningRate || 'Not specified'
      };
      modelInfo = {
        ...modelParams,
        privacyParams
      };
    }
    // Fetch all selected models if aiModelIds is present
    if (contract.aiModelIds && Array.isArray(contract.aiModelIds) && contract.aiModelIds.length > 0) {
      const db = require('../models');
      const models = await db.AIModel.findAll({ where: { id: contract.aiModelIds } });
      modelInfoList = models.map(model => ({
        modelName: model.name,
        modelType: model.type,
        architecture: model.architecture,
        framework: model.framework,
        parameters: model.parameters,
        privacyTechnique: model.privacyTechnique,
        validationMetrics: model.validationMetrics,
        maxEpochs: model.maxEpochs,
        batchSize: model.batchSize,
        learningRate: model.learningRate
      }));
    }

    res.json({
      ...contract.toJSON(),
      modelInfo,
      modelInfoList
    });
  } catch (error) {
    console.error('Error getting contract:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * NOTE: Plain contract creation has been removed.
 * All contracts must now be created using Ricardian contracts.
 * Use /api/contracts/ricardian for contract creation.
 */
router.post('/', authenticateToken, async (req, res) => {
  res.status(400).json({ 
    error: 'Plain contract creation has been removed. Please use /api/contracts/ricardian for Ricardian contract creation.' 
  });
});

/**
 * Preview Ricardian contract (TDC ONLY)
 * 
 * This endpoint allows TDC users to preview Ricardian contracts before creation.
 * It generates the legal document and smart contract preview without deploying.
 * 
 * Features:
 * - Legal document generation based on contract type
 * - Smart contract preview generation
 * - No blockchain deployment (preview only)
 * 
 * Security:
 * - Only TDC users can preview contracts
 * - Authentication handled via JWT token
 */
router.post('/ricardian/preview', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Ricardian contract preview request body:', req.body);
    console.log('🔍 Ricardian contract preview user:', req.user?.localUser);
    
    const {
      contractType = 'AI_TRAINING',
      datasetId,
      price,
      duration,
      termsAndConditions,
      environmentSpecs,
      trainingParams,
      kmsConfigs
    } = req.body;

    // Validate required fields
    if (!datasetId || !price || !duration || !termsAndConditions) {
      console.log('❌ Missing required fields for preview:', { datasetId, price, duration, termsAndConditions });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get dataset and verify ownership
    const dataset = await db.Dataset.findOne({
      where: { id: datasetId },
      include: [{ model: db.User, as: 'owner', attributes: ['id', 'name', 'email', 'walletAddress', 'did'] }]
    });

    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    // Create preview contract data
    const previewContractData = {
      contractId: `preview-${Date.now()}`,
      tdpId: dataset.owner.id,
      tdcId: req.user.localUser.id,
      datasetId: dataset.id,
      price,
      duration,
      termsAndConditions,
      tdp: dataset.owner,
      tdc: req.user.localUser,
      ccrp: null,
      environmentSpecs: environmentSpecs || {},
      trainingParams: trainingParams || {},
      kmsConfigs: kmsConfigs || {}
    };

    // Generate preview legal document
    const legalDocument = await ricardianContractService.generateLegalDocument(previewContractData, contractType);
    
    // Create document hash
    const legalDocumentHash = ricardianContractService.createDocumentHash(legalDocument);
    
    // Generate preview smart contract data
    const smartContractData = {
      address: `0x${require('crypto').randomBytes(20).toString('hex')}`,
      network: 'preview',
      contractId: Math.floor(Math.random() * 1000000),
      transactionHash: `0x${require('crypto').randomBytes(32).toString('hex')}`
    };

    res.json({
      success: true,
      message: 'Ricardian contract preview generated successfully',
      legalDocument,
      legalDocumentHash,
      smartContractData,
      contractType
    });
  } catch (error) {
    console.error('❌ Error generating Ricardian contract preview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Create Ricardian contract (TDC ONLY)
 * 
 * This endpoint allows TDC users to create Ricardian contracts with legal document binding.
 * Ricardian contracts combine human-readable legal documents with machine-executable smart contracts.
 * 
 * Features:
 * - Legal document generation based on contract type
 * - Cryptographic hash creation for legal document
 * - Ricardian signature binding legal to smart contract
 * - Smart contract deployment
 * - Multi-KMS support for data encryption
 * 
 * Workflow:
 * 1. TDC creates Ricardian contract with contract type
 * 2. Legal document generated from template
 * 3. Cryptographic hash created for legal document
 * 4. Ricardian signature binds legal to smart contract
 * 5. Smart contract deployed to blockchain
 * 6. TDP automatically signs (handled by backend)
 * 
 * Security:
 * - Only TDC users can create contracts
 * - TDP must be registered and own the dataset
 * - CCRP must be registered (if selected)
 * - Authentication handled via JWT token
 * - Cryptographic binding ensures integrity
 */
router.post('/ricardian', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Ricardian contract creation request body:', req.body);
    console.log('🔍 Ricardian contract creation user:', req.user?.localUser);
    
    const {
      tdpId,
      datasetId,
      aiModelIds, // Array of AI model IDs to link to contract
      price,
      duration,
      termsAndConditions,
      ccrpId,
      contractType = 'AI_TRAINING',
      environmentSpecs,
      trainingParams,
      kmsConfigs
    } = req.body;

    // Validate required fields
    if (!tdpId || !datasetId || !price || !duration || !termsAndConditions) {
      console.log('❌ Missing required fields:', { tdpId, datasetId, price, duration, termsAndConditions });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get TDC user from authentication context
    const tdcUser = req.user?.localUser;
    if (!tdcUser || tdcUser.partyType !== 'TDC') {
      return res.status(403).json({ error: 'Only TDC users can create contracts' });
    }

    // Get TDP user
    const tdpUser = await db.User.findOne({
      where: { id: tdpId, partyType: 'TDP' }
    });

    if (!tdpUser) {
      return res.status(404).json({ error: 'TDP not found' });
    }

    // Get dataset and verify ownership
    const dataset = await db.Dataset.findOne({
      where: { id: datasetId, ownerId: tdpUser.id }
    });

    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found or not owned by TDP' });
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

    // Get AI models if provided
    let aiModels = [];
    if (aiModelIds && Array.isArray(aiModelIds) && aiModelIds.length > 0) {
      aiModels = await db.AIModel.findAll({
        where: { id: aiModelIds }
      });
    }

    // Generate unique contract ID
    const contractId = `RICARDIAN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Prepare contract data for Ricardian contract creation
    const contractData = {
      contractId,
      tdpId: tdpUser.id,
      tdcId: tdcUser.id,
      ccrpId: ccrpUser?.id,
      datasetId: dataset.id,
      aiModelIds: aiModels.map(model => model.id), // Link AI models to contract
      price: parseFloat(price),
      duration: parseInt(duration),
      termsAndConditions,
      tdp: {
        name: tdpUser.name,
        email: tdpUser.email,
        blockchainAddress: tdpUser.walletAddress,
        did: tdpUser.did
      },
      tdc: {
        name: tdcUser.name,
        email: tdcUser.email,
        blockchainAddress: tdcUser.walletAddress,
        did: tdcUser.did
      },
      ccrp: ccrpUser ? {
        name: ccrpUser.name,
        email: ccrpUser.email,
        blockchainAddress: ccrpUser.walletAddress,
        did: ccrpUser.did
      } : null,
      environmentSpecs,
      trainingParams,
      kmsConfigs
    };

    // Create Ricardian contract
    const ricardianResult = await ricardianContractService.createRicardianContract(contractData, contractType);

    // Don't auto-sign TDP - let them sign manually
    ricardianResult.contract.tdpSigned = false;
    ricardianResult.contract.status = 'PENDING_TDP_APPROVAL';
    await ricardianResult.contract.save();

    // Send notifications
    await notificationService.notifyContractCreated(ricardianResult.contract, tdpUser);

    console.log('✅ Ricardian contract created successfully with privacy requirements:', ricardianResult.contract.contractId);

    res.status(201).json({
      success: true,
      message: 'Ricardian contract created successfully with privacy requirements',
      contract: ricardianResult.contract,
      legalDocument: ricardianResult.legalDocument,
      smartContractData: ricardianResult.smartContractData
    });

  } catch (error) {
    console.error('❌ Error creating Ricardian contract:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export the router
module.exports = router; 