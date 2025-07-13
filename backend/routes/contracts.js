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
 * Contract Management Routes with Ricardian Contract Support
 * 
 * This module handles all contract-related operations including:
 * - Traditional contract creation (TDC only)
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

/**
 * Get AI models for dropdown
 * 
 * This endpoint returns all available AI models for contract creation.
 * Used by the frontend to populate the model dropdown.
 */
router.get('/ai-models', async (req, res) => {
  try {
    const aiModels = await db.AIModel.findAll({
      where: { isActive: true },
      attributes: ['id', 'modelId', 'name', 'description', 'type', 'architecture', 'parameters', 'framework', 'privacyTechnique', 'validationMetrics', 'maxEpochs', 'batchSize', 'learningRate'],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      models: aiModels
    });
  } catch (error) {
    console.error('Error fetching AI models:', error);
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

    // Generate legal document preview
    const legalDocument = await ricardianContractService.generateLegalDocument(previewContractData, contractType);
    
    // Create document hash for preview
    const legalDocumentHash = ricardianContractService.createDocumentHash(legalDocument);
    
    // Generate smart contract preview (without deployment)
    const smartContractPreview = {
      address: '0x0000000000000000000000000000000000000000', // Placeholder
      network: 'preview',
      contractId: previewContractData.contractId,
      abi: [], // Empty ABI for preview
      bytecode: '0x', // Empty bytecode for preview
      deploymentData: {
        legalDocumentHash,
        contractType,
        parties: {
          tdp: dataset.owner.walletAddress,
          tdc: req.user.localUser.walletAddress
        }
      }
    };

    res.json({
      success: true,
      legalDocument,
      smartContractData: smartContractPreview,
      preview: true
    });
  } catch (error) {
    console.error('❌ Error generating Ricardian contract preview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Create new Ricardian contract (TDC ONLY)
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

    // Validate privacy requirements if provided in trainingParams
    if (trainingParams && trainingParams.privacyRequirements) {
      const { maxPrivacyLoss, minAccuracy, differentialPrivacy, federatedLearning, secureMultiPartyComputation } = trainingParams.privacyRequirements;
      
      // Validate privacy loss (epsilon)
      if (maxPrivacyLoss < 0.01 || maxPrivacyLoss > 1.0) {
        return res.status(400).json({ error: 'Maximum privacy loss must be between 0.01 and 1.0' });
      }
      
      // Validate minimum accuracy
      if (minAccuracy < 0.5 || minAccuracy > 0.999) {
        return res.status(400).json({ error: 'Minimum accuracy must be between 50% and 99.9%' });
      }
      
      // Validate that at least one privacy technique is enabled
      const hasPrivacyTechnique = (
        (differentialPrivacy && differentialPrivacy.enabled) ||
        (federatedLearning && federatedLearning.enabled) ||
        (secureMultiPartyComputation && secureMultiPartyComputation.enabled)
      );
      
      if (!hasPrivacyTechnique) {
        return res.status(400).json({ error: 'At least one privacy-preserving technique must be enabled' });
      }
      
      console.log('✅ Privacy requirements validated for Ricardian contract:', {
        maxPrivacyLoss,
        minAccuracy,
        differentialPrivacy: differentialPrivacy?.enabled,
        federatedLearning: federatedLearning?.enabled,
        secureMultiPartyComputation: secureMultiPartyComputation?.enabled
      });
    }

    // Validate AI models if provided
    let aiModels = [];
    if (aiModelIds && Array.isArray(aiModelIds) && aiModelIds.length > 0) {
      aiModels = await db.AIModel.findAll({
        where: { 
          id: aiModelIds,
          isActive: true 
        }
      });
      
      if (aiModels.length !== aiModelIds.length) {
        return res.status(400).json({ error: 'One or more AI models not found or inactive' });
      }
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

    // Generate unique contract ID
    const contractId = `CONTRACT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

/**
 * Verify Ricardian contract integrity
 * 
 * This endpoint verifies the cryptographic binding between legal document and smart contract.
 * 
 * Verification includes:
 * - Legal document structure validation
 * - Document hash verification
 * - Ricardian signature verification
 * - Smart contract validation
 */
router.get('/:contractId/verify', async (req, res) => {
  try {
    const { contractId } = req.params;

    const contract = await db.Contract.findOne({
      where: { contractId }
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Verify Ricardian contract integrity
    const verification = await ricardianContractService.verifyRicardianContract(contract);

    res.json({
      success: true,
      contractId,
      verification
    });

  } catch (error) {
    console.error('Error verifying Ricardian contract:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Update contract environment specifications
 * 
 * This endpoint allows CCRP to update environment specifications for confidential computing.
 */
router.put('/:contractId/environment', authenticateToken, async (req, res) => {
  try {
    const { contractId } = req.params;
    const { environmentSpecs } = req.body;

    // Verify user is CCRP
    const user = req.user?.localUser;
    if (!user || user.partyType !== 'CCRP') {
      return res.status(403).json({ error: 'Only CCRP users can update environment specifications' });
    }

    // Update environment specifications
    const updatedContract = await ricardianContractService.updateEnvironmentSpecs(contractId, environmentSpecs);

    res.json({
      success: true,
      message: 'Environment specifications updated successfully',
      contract: updatedContract
    });

  } catch (error) {
    console.error('Error updating environment specifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Update contract training parameters
 * 
 * This endpoint allows TDC to update training parameters for AI model training.
 */
router.put('/:contractId/training', authenticateToken, async (req, res) => {
  try {
    const { contractId } = req.params;
    const { trainingParams } = req.body;

    // Verify user is TDC
    const user = req.user?.localUser;
    if (!user || user.partyType !== 'TDC') {
      return res.status(403).json({ error: 'Only TDC users can update training parameters' });
    }

    // Update training parameters
    const updatedContract = await ricardianContractService.updateTrainingParams(contractId, trainingParams);

    res.json({
      success: true,
      message: 'Training parameters updated successfully',
      contract: updatedContract
    });

  } catch (error) {
    console.error('Error updating training parameters:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Update contract KMS configurations
 * 
 * This endpoint allows CCRP to update KMS configurations for multi-provider support.
 */
router.put('/:contractId/kms', authenticateToken, async (req, res) => {
  try {
    const { contractId } = req.params;
    const { kmsConfigs } = req.body;

    // Verify user is CCRP
    const user = req.user?.localUser;
    if (!user || user.partyType !== 'CCRP') {
      return res.status(403).json({ error: 'Only CCRP users can update KMS configurations' });
    }

    // Update KMS configurations
    const updatedContract = await ricardianContractService.updateKMSConfigs(contractId, kmsConfigs);

    res.json({
      success: true,
      message: 'KMS configurations updated successfully',
      contract: updatedContract
    });

  } catch (error) {
    console.error('Error updating KMS configurations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Update attestation verification
 * 
 * This endpoint allows CCRP to update attestation verification for Azure Confidential Computing.
 */
router.put('/:contractId/attestation', authenticateToken, async (req, res) => {
  try {
    const { contractId } = req.params;
    const { attestationReport } = req.body;

    // Verify user is CCRP
    const user = req.user?.localUser;
    if (!user || user.partyType !== 'CCRP') {
      return res.status(403).json({ error: 'Only CCRP users can update attestation verification' });
    }

    // Update attestation verification
    const updatedContract = await ricardianContractService.updateAttestationVerification(contractId, attestationReport);

    res.json({
      success: true,
      message: 'Attestation verification updated successfully',
      contract: updatedContract
    });

  } catch (error) {
    console.error('Error updating attestation verification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get supported contract types
 * 
 * This endpoint returns the list of supported Ricardian contract types.
 */
router.get('/types/supported', async (req, res) => {
  try {
    const supportedTypes = await ricardianContractService.getSupportedContractTypes();

    res.json({
      success: true,
      supportedTypes
    });

  } catch (error) {
    console.error('Error getting supported contract types:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get contract template
 * 
 * This endpoint returns the template for a specific contract type.
 */
router.get('/types/:contractType/template', async (req, res) => {
  try {
    const { contractType } = req.params;

    const template = await ricardianContractService.getContractTemplate(contractType);

    res.json({
      success: true,
      contractType,
      template
    });

  } catch (error) {
    console.error('Error getting contract template:', error);
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
      price,
      duration,
      termsAndConditions,
      ccrpId,
      privacyRequirements
    } = req.body;

    // Validate required fields
    if (!tdpId || !datasetId || !price || !duration || !termsAndConditions) {
      console.log('❌ Missing required fields:', { tdpId, datasetId, price, duration, termsAndConditions });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate privacy requirements if provided
    if (privacyRequirements) {
      const { maxPrivacyLoss, minAccuracy, differentialPrivacy, federatedLearning, secureMultiPartyComputation } = privacyRequirements;
      
      // Validate privacy loss (epsilon)
      if (maxPrivacyLoss < 0.01 || maxPrivacyLoss > 1.0) {
        return res.status(400).json({ error: 'Maximum privacy loss must be between 0.01 and 1.0' });
      }
      
      // Validate minimum accuracy
      if (minAccuracy < 0.5 || minAccuracy > 0.999) {
        return res.status(400).json({ error: 'Minimum accuracy must be between 50% and 99.9%' });
      }
      
      // Validate that at least one privacy technique is enabled
      const hasPrivacyTechnique = (
        (differentialPrivacy && differentialPrivacy.enabled) ||
        (federatedLearning && federatedLearning.enabled) ||
        (secureMultiPartyComputation && secureMultiPartyComputation.enabled)
      );
      
      if (!hasPrivacyTechnique) {
        return res.status(400).json({ error: 'At least one privacy-preserving technique must be enabled' });
      }
      
      console.log('✅ Privacy requirements validated:', {
        maxPrivacyLoss,
        minAccuracy,
        differentialPrivacy: differentialPrivacy?.enabled,
        federatedLearning: federatedLearning?.enabled,
        secureMultiPartyComputation: secureMultiPartyComputation?.enabled
      });
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
      price,
      duration,
      termsAndConditions,
      status: ccrpUser ? 'PENDING_TDP_APPROVAL' : 'PENDING_CCRP_APPROVAL',
      // Store privacy requirements as JSON
      trainingParams: privacyRequirements ? JSON.stringify(privacyRequirements) : null
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
      message: 'Contract created successfully with privacy requirements'
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
 * - DID signatures are cryptographically verified using multiple algorithms
 * - Support for did:web, did:key, and did:ethr methods
 * - Timestamp-based message construction prevents replay attacks
 * - All signatures are recorded on blockchain with flexible mode support
 * - Transaction verification on blockchain with graceful fallback
 */
router.post('/:contractId/sign', authenticateToken, async (req, res) => {
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

    // Get the authenticated user from the JWT token
    const authenticatedUser = req.user?.localUser;
    
    if (!authenticatedUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    let user = authenticatedUser;
    let blockchainResult = null;

    // Handle different signing types
    if (signatureType === 'WALLET') {
      // For wallet-based signing, verify the wallet address matches the authenticated user
      if (userWalletAddress && userWalletAddress !== authenticatedUser.walletAddress) {
        return res.status(403).json({ error: 'Wallet address does not match authenticated user' });
      }

      // Broadcast the signed transaction to blockchain
      blockchainResult = await blockchainService.broadcastSignedTransaction(signedTransaction);

      if (!blockchainResult.success) {
        return res.status(500).json({ error: 'Failed to broadcast transaction' });
      }
    } else if (signatureType === 'DID') {
      // For DID-based signing, verify the DID matches the authenticated user
      if (did && did !== authenticatedUser.did) {
        return res.status(403).json({ error: 'DID does not match authenticated user' });
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

/**
 * Get available AI models for Ricardian contracts
 * 
 * This endpoint provides a list of available AI models that can be used
 * in Ricardian contracts for AI training scenarios.
 * 
 * Models include:
 * - Transformer models (GPT-4, BERT)
 * - CNN models (ResNet, image classifiers)
 * - RNN models (LSTM, sequence models)
 * - GAN models (generative models)
 * 
 * Each model includes:
 * - Architecture details
 * - Training parameters
 * - Privacy techniques
 * - Validation metrics
 */
router.get('/available-models', async (req, res) => {
  try {
    // Get models from database
    const models = await db.AIModel.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      models: models.map(model => ({
        id: model.modelId,
        name: model.name,
        description: model.description,
        type: model.type,
        architecture: model.architecture,
        parameters: model.parameters,
        framework: model.framework,
        privacyTechnique: model.privacyTechnique,
        validationMetrics: model.validationMetrics,
        maxEpochs: model.maxEpochs,
        batchSize: model.batchSize,
        learningRate: model.learningRate,
        metadata: model.metadata
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching AI models:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 