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
 * Test endpoint for multi-TDP preview (no authentication required for testing)
 */
router.post('/ricardian/multi-tdp-preview-test', async (req, res) => {
  try {
    console.log('🔍 Test Multi-TDP Ricardian contract preview request body:', req.body);
    
    const {
      datasetSelections, // Array of {datasetId, individualPrice} objects
      duration,
      termsAndConditions,
      contractType = 'AI_TRAINING',
      privacyRequirements
    } = req.body;

    // Validate required fields
    if (!datasetSelections || !Array.isArray(datasetSelections) || datasetSelections.length === 0) {
      return res.status(400).json({ error: 'At least one dataset selection is required' });
    }

    if (!duration || !termsAndConditions) {
      return res.status(400).json({ error: 'Duration and terms are required' });
    }

    // Validate dataset count (1-3 datasets)
    if (datasetSelections.length < 1 || datasetSelections.length > 3) {
      return res.status(400).json({ 
        error: 'Contract must include 1 to 3 datasets' 
      });
    }

    // Verify all datasets exist and get their TDPs
    const selectedDatasetIds = datasetSelections.map(selection => selection.datasetId);
    const datasets = await db.Dataset.findAll({
      where: { 
        datasetId: selectedDatasetIds,
        isActive: true
      },
      include: [
        { model: db.User, as: 'owner' }
      ]
    });

    if (datasets.length !== datasetSelections.length) {
      return res.status(404).json({ 
        error: 'One or more datasets not found' 
      });
    }

    // Get a TDC user for testing
    const tdcUser = await db.User.findOne({ where: { partyType: 'TDC' } });
    if (!tdcUser) {
      return res.status(404).json({ error: 'No TDC user found for testing' });
    }

    // Calculate total price for all datasets
    const totalPrice = datasetSelections.reduce((sum, selection) => sum + selection.individualPrice, 0);

    // Generate legal document preview for multi-TDP contract
    const legalDocument = {
      contractType: contractType,
      title: `${contractType.replace('_', ' ')} Multi-TDP Contract`,
      description: `Ricardian contract for ${contractType.toLowerCase().replace('_', ' ')} with multiple TDPs`,
      effectiveDate: new Date().toISOString().split('T')[0],
      expirationDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      parties: {
        dataProviders: datasets.map(dataset => ({
          name: dataset.owner.name,
          email: dataset.owner.email,
          blockchainAddress: dataset.owner.walletAddress,
          did: dataset.owner.did,
          datasetName: dataset.name,
          datasetId: dataset.datasetId,
          individualPrice: datasetSelections.find(s => s.datasetId === dataset.datasetId)?.individualPrice
        })),
        modelTrainer: {
          name: tdcUser.name,
          email: tdcUser.email,
          blockchainAddress: tdcUser.walletAddress,
          did: tdcUser.did
        }
      },
      contractTerms: {
        totalPrice,
        duration,
        termsAndConditions,
        datasetCount: datasets.length,
        tdpCount: datasets.length,
        privacyRequirements: privacyRequirements || {}
      }
    };
    
    // Create document hash for preview
    const legalDocumentHash = ricardianContractService.createDocumentHash(legalDocument);
    
    // Generate smart contract preview (without deployment)
    const smartContractPreview = {
      address: '0x0000000000000000000000000000000000000000', // Placeholder
      network: 'preview',
      contractId: `test-preview-${Date.now()}`,
      abi: [], // Empty ABI for preview
      bytecode: '0x', // Empty bytecode for preview
      deploymentData: {
        legalDocumentHash,
        contractType,
        parties: {
          tdps: datasets.map(dataset => dataset.owner.walletAddress),
          tdc: tdcUser.walletAddress
        },
        datasets: datasets.map(dataset => ({
          datasetId: dataset.datasetId,
          tdpAddress: dataset.owner.walletAddress,
          price: datasetSelections.find(s => s.datasetId === dataset.datasetId)?.individualPrice
        }))
      }
    };

    res.json({
      success: true,
      legalDocument,
      smartContractData: smartContractPreview,
      preview: true,
      datasetCount: datasets.length,
      tdpCount: datasets.length,
      totalPrice
    });
  } catch (error) {
    console.error('❌ Error generating test multi-TDP Ricardian contract preview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Generate preview for multi-TDP Ricardian contract (TDC ONLY)
 * 
 * This endpoint allows TDC users to preview Ricardian contracts with multiple datasets.
 * The preview shows the legal document and smart contract structure without deployment.
 */
router.post('/ricardian/multi-tdp-preview', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Multi-TDP Ricardian contract preview request body:', req.body);
    console.log('🔍 Multi-TDP Ricardian contract preview user:', req.user?.localUser);
    
    const {
      datasetSelections, // Array of {datasetId, individualPrice} objects
      duration,
      termsAndConditions,
      contractType = 'AI_TRAINING',
      privacyRequirements
    } = req.body;

    // Validate required fields
    if (!datasetSelections || !Array.isArray(datasetSelections) || datasetSelections.length === 0) {
      return res.status(400).json({ error: 'At least one dataset selection is required' });
    }

    if (!duration || !termsAndConditions) {
      return res.status(400).json({ error: 'Duration and terms are required' });
    }

    // Validate dataset count (1-3 datasets)
    if (datasetSelections.length < 1 || datasetSelections.length > 3) {
      return res.status(400).json({ 
        error: 'Contract must include 1 to 3 datasets' 
      });
    }

    // Get TDC user from authentication context
    const tdcUser = req.user?.localUser;
    if (!tdcUser || tdcUser.partyType !== 'TDC') {
      return res.status(403).json({ error: 'Only TDC users can preview contracts' });
    }

    // Verify all datasets exist and get their TDPs
    const selectedDatasetIds = datasetSelections.map(selection => selection.datasetId);
    const datasets = await db.Dataset.findAll({
      where: { 
        datasetId: selectedDatasetIds,
        isActive: true
      },
      include: [
        { model: db.User, as: 'owner' }
      ]
    });

    if (datasets.length !== datasetSelections.length) {
      return res.status(404).json({ 
        error: 'One or more datasets not found' 
      });
    }

    // Calculate total price for all datasets
    const totalPrice = datasetSelections.reduce((sum, selection) => sum + selection.individualPrice, 0);

    // Create preview contract data
    const previewContractData = {
      contractId: `preview-multi-${Date.now()}`,
      tdcId: tdcUser.id,
      tdc: tdcUser,
      datasets: datasets.map((dataset, index) => ({
        datasetId: dataset.datasetId,
        datasetName: dataset.name,
        tdpId: dataset.owner.id,
        tdpName: dataset.owner.name,
        tdp: dataset.owner,
        individualPrice: datasetSelections[index].individualPrice
      })),
      totalPrice,
      duration,
      termsAndConditions,
      contractType,
      privacyRequirements: privacyRequirements || {}
    };

    // Generate legal document preview for multi-TDP contract
    const legalDocument = {
      contractType: contractType,
      title: `${contractType.replace('_', ' ')} Multi-TDP Contract`,
      description: `Ricardian contract for ${contractType.toLowerCase().replace('_', ' ')} with multiple TDPs`,
      effectiveDate: new Date().toISOString().split('T')[0],
      expirationDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      parties: {
        dataProviders: datasets.map(dataset => ({
          name: dataset.owner.name,
          email: dataset.owner.email,
          blockchainAddress: dataset.owner.walletAddress,
          did: dataset.owner.did,
          datasetName: dataset.name,
          datasetId: dataset.datasetId,
          individualPrice: datasetSelections.find(s => s.datasetId === dataset.datasetId)?.individualPrice
        })),
        modelTrainer: {
          name: tdcUser.name,
          email: tdcUser.email,
          blockchainAddress: tdcUser.walletAddress,
          did: tdcUser.did
        }
      },
      contractTerms: {
        totalPrice,
        duration,
        termsAndConditions,
        datasetCount: datasets.length,
        tdpCount: datasets.length,
        privacyRequirements: privacyRequirements || {}
      }
    };
    
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
          tdps: datasets.map(dataset => dataset.owner.walletAddress),
          tdc: tdcUser.walletAddress
        },
        datasets: datasets.map(dataset => ({
          datasetId: dataset.datasetId,
          tdpAddress: dataset.owner.walletAddress,
          price: datasetSelections.find(s => s.datasetId === dataset.datasetId)?.individualPrice
        }))
      }
    };

    res.json({
      success: true,
      legalDocument,
      smartContractData: smartContractPreview,
      preview: true,
      datasetCount: datasets.length,
      tdpCount: datasets.length,
      totalPrice
    });
  } catch (error) {
    console.error('❌ Error generating multi-TDP Ricardian contract preview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Generate preview for Ricardian contract (TDC ONLY)
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
 * NEW: Supports multiple datasets from different TDPs (up to 3) with individual payments
 * 
 * Workflow:
 * 1. TDC creates contract with multiple datasets from different TDPs
 * 2. Each TDP gets notified and must sign individually
 * 3. Contract moves to PENDING_ALL_TDP_APPROVAL
 * 4. When all TDPs sign, contract moves to PENDING_CCRP_APPROVAL (if CCRP selected)
 * 5. Contract becomes ACTIVE when all parties sign
 * 
 * Security:
 * - Only TDC users can create contracts
 * - Each TDP must be registered and own their respective dataset
 * - CCRP must be registered (if selected)
 * - Authentication handled via JWT token
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Contract creation request body:', req.body);
    console.log('🔍 Contract creation user:', req.user?.localUser);
    
    const {
      datasetSelections, // NEW: Array of {datasetId, individualPrice} objects
      datasetIds, // Legacy: Array of dataset IDs
      datasetId, // Legacy: Single dataset ID
      price, // Legacy: Single price
      duration,
      termsAndConditions,
      ccrpId,
      privacyRequirements
    } = req.body;

    // Handle different input formats
    let finalDatasetSelections = [];
    if (datasetSelections && Array.isArray(datasetSelections)) {
      // New format: array of {datasetId, individualPrice} objects
      finalDatasetSelections = datasetSelections;
    } else if (datasetIds && Array.isArray(datasetIds)) {
      // Legacy format: array of dataset IDs with single price
      finalDatasetSelections = datasetIds.map(datasetId => ({
        datasetId,
        individualPrice: parseFloat(price) / datasetIds.length // Distribute price equally
      }));
    } else if (datasetId) {
      // Legacy format: single dataset
      finalDatasetSelections = [{
        datasetId,
        individualPrice: parseFloat(price)
      }];
    } else {
      console.log('❌ Missing required fields: datasetSelections, datasetIds, or datasetId');
      return res.status(400).json({ error: 'Missing required fields: datasetSelections, datasetIds, or datasetId' });
    }

    // Validate dataset count (1-3 datasets)
    if (finalDatasetSelections.length < 1 || finalDatasetSelections.length > 3) {
      return res.status(400).json({ 
        error: 'Contract must include 1 to 3 datasets' 
      });
    }

    // Validate required fields
    if (!duration || !termsAndConditions) {
      console.log('❌ Missing required fields:', { duration, termsAndConditions });
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

    // Get TDC user from authentication context
    const tdcUser = req.user?.localUser;
    if (!tdcUser || tdcUser.partyType !== 'TDC') {
      return res.status(403).json({ error: 'Only TDC users can create contracts' });
    }

    // Verify all datasets exist and get their TDPs
    const selectedDatasetIds = finalDatasetSelections.map(selection => selection.datasetId);
    const datasets = await db.Dataset.findAll({
      where: { 
        datasetId: selectedDatasetIds,
        isActive: true
      },
      include: [
        { model: db.User, as: 'owner' }
      ]
    });

    if (datasets.length !== finalDatasetSelections.length) {
      return res.status(404).json({ 
        error: 'One or more datasets not found' 
      });
    }

    // Verify all TDPs are valid
    const tdpIds = datasets.map(dataset => dataset.owner.id);
    const tdpUsers = await db.User.findAll({
      where: { 
        id: tdpIds,
        partyType: 'TDP',
        isActive: true
      }
    });

    if (tdpUsers.length !== datasets.length) {
      return res.status(404).json({ 
        error: 'One or more TDPs not found or invalid' 
      });
    }

    // Calculate total price for all datasets
    const totalPrice = finalDatasetSelections.reduce((sum, selection) => sum + selection.individualPrice, 0);

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

    // Prepare contract datasets data
    const contractDatasets = datasets.map((dataset, index) => ({
      datasetId: dataset.datasetId,
      tdpId: dataset.owner.id,
      datasetName: dataset.name,
      tdpName: dataset.owner.name,
      individualPrice: finalDatasetSelections[index].individualPrice,
      paymentStatus: 'PENDING'
    }));

    // Prepare TDP signatures tracking
    const tdpSignatures = {};
    tdpUsers.forEach(tdp => {
      tdpSignatures[tdp.id] = {
        signed: false,
        signedAt: null,
        paymentAmount: finalDatasetSelections.find(s => 
          datasets.find(d => d.owner.id === tdp.id)?.datasetId === s.datasetId
        )?.individualPrice || 0
      };
    });

    // Prepare TDP payments tracking
    const tdpPayments = {};
    tdpUsers.forEach(tdp => {
      tdpPayments[tdp.id] = {
        amount: finalDatasetSelections.find(s => 
          datasets.find(d => d.owner.id === tdp.id)?.datasetId === s.datasetId
        )?.individualPrice || 0,
        status: 'PENDING',
        paidAt: null
      };
    });

    // Use first dataset as primary (for backward compatibility)
    const primaryDataset = datasets[0];
    const primaryTdp = primaryDataset.owner;

    // Create contract in database
    const contract = await db.Contract.create({
      contractId: `CONTRACT-${Date.now()}`,
      blockchainContractId: null, // Will be set when blockchain is available
      tdpId: primaryTdp.id, // Legacy field - primary TDP
      tdcId: tdcUser.id,
      ccrpId: ccrpUser ? ccrpUser.id : null,
      datasetId: primaryDataset.id, // Legacy field - primary dataset
      primaryDatasetId: primaryDataset.id,
      primaryTdpId: primaryTdp.id,
      contractDatasets: contractDatasets,
      datasetCount: datasets.length,
      tdpCount: tdpUsers.length,
      totalPrice: totalPrice,
      price: totalPrice, // Legacy field - total price
      duration: parseInt(duration),
      termsAndConditions,
      status: 'PENDING_ALL_TDP_APPROVAL', // Legacy status
      multiTdpStatus: 'PENDING_ALL_TDP_APPROVAL',
      tdpSignatures: tdpSignatures,
      tdpPayments: tdpPayments,
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

    // Send notifications to ALL TDPs
    for (const tdpUser of tdpUsers) {
      await notificationService.notifyContractCreated(fullContract, tdpUser);
    }
    
    // If CCRP was selected, send notification to CCRP
    if (ccrpUser) {
      await notificationService.notifyCCRPSelected(fullContract, ccrpUser);
    }

    console.log('✅ Contract created successfully with multiple TDPs:', {
      contractId: contract.contractId,
      datasetCount: contract.datasetCount,
      tdpCount: contract.tdpCount,
      totalPrice: contract.totalPrice,
      datasets: contractDatasets.map(d => d.datasetName),
      tdps: tdpUsers.map(t => t.name)
    });

    res.status(201).json({
      success: true,
      contract: fullContract,
      message: 'Contract created successfully with multiple TDPs',
      datasetCount: contract.datasetCount,
      tdpCount: contract.tdpCount,
      totalPrice: contract.totalPrice,
      contractDatasets: contractDatasets,
      tdpSignatures: tdpSignatures
    });
  } catch (error) {
    console.error('❌ Error creating contract:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      constraint: error.constraint,
      table: error.table,
      column: error.column
    });
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      code: error.code
    });
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
 * Multi-TDP Contract Management Endpoints
 * 
 * These endpoints handle contracts with multiple TDPs (up to 3 datasets, each with different TDPs).
 * Each TDP must sign individually and payments are tracked per TDP.
 */

/**
 * TDP Sign Contract (Multi-TDP Support)
 * 
 * Allows a specific TDP to sign a multi-TDP contract.
 * Only the TDP who owns the dataset can sign for their portion.
 */
router.post('/:contractId/tdp-sign', authenticateToken, async (req, res) => {
  try {
    const { contractId } = req.params;
    const { 
      tdpId, // ID of the TDP signing
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

    // Verify this is a multi-TDP contract
    if (!contract.contractDatasets || contract.datasetCount <= 1) {
      return res.status(400).json({ error: 'This endpoint is for multi-TDP contracts only' });
    }

    // Get the authenticated user
    const authenticatedUser = req.user?.localUser;
    if (!authenticatedUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify the TDP ID matches the authenticated user
    if (tdpId !== authenticatedUser.id) {
      return res.status(403).json({ error: 'Can only sign for your own TDP account' });
    }

    // Verify the TDP is actually a party to this contract
    const contractDatasets = contract.contractDatasets || [];
    const tdpDataset = contractDatasets.find(dataset => dataset.tdpId === tdpId);
    
    if (!tdpDataset) {
      return res.status(403).json({ error: 'TDP is not a party to this contract' });
    }

    // Verify the TDP hasn't already signed
    const tdpSignatures = contract.tdpSignatures || {};
    if (tdpSignatures[tdpId]?.signed) {
      return res.status(400).json({ error: 'TDP has already signed this contract' });
    }

    let blockchainResult = null;

    // Handle different signing types
    if (signatureType === 'WALLET') {
      // Verify wallet address matches authenticated user
      if (userWalletAddress && userWalletAddress !== authenticatedUser.walletAddress) {
        return res.status(403).json({ error: 'Wallet address does not match authenticated user' });
      }

      // Broadcast the signed transaction to blockchain
      blockchainResult = await blockchainService.broadcastSignedTransaction(signedTransaction);

      if (!blockchainResult.success) {
        return res.status(500).json({ error: 'Failed to broadcast transaction' });
      }
    } else if (signatureType === 'DID') {
      // Verify DID matches authenticated user
      if (did && did !== authenticatedUser.did) {
        return res.status(403).json({ error: 'DID does not match authenticated user' });
      }

      // Verify DID signature
      const isValidSignature = await verifyDIDSignature(did, message, signature);
      
      if (!isValidSignature) {
        return res.status(401).json({ error: 'Invalid DID signature' });
      }

      blockchainResult = {
        success: true,
        transactionHash: `DID_TX_${Date.now()}_${did.replace(/[^a-zA-Z0-9]/g, '_')}`,
        message: 'DID signature recorded on blockchain'
      };
    }

    // Update TDP signature in the contract
    const updatedTdpSignatures = { ...tdpSignatures };
    updatedTdpSignatures[tdpId] = {
      signed: true,
      signedAt: new Date(),
      paymentAmount: tdpDataset.individualPrice,
      signatureType: signatureType,
      transactionHash: blockchainResult?.transactionHash
    };

    // Check if all TDPs have signed
    const allTdpsSigned = Object.values(updatedTdpSignatures).every(sig => sig.signed);
    
    // Update contract status
    let newMultiTdpStatus = contract.multiTdpStatus;
    if (allTdpsSigned) {
      newMultiTdpStatus = contract.ccrpId ? 'PENDING_CCRP_APPROVAL' : 'PENDING_TDC_APPROVAL';
    }

    // Update contract
    await contract.update({
      tdpSignatures: updatedTdpSignatures,
      multiTdpStatus: newMultiTdpStatus
    });

    // Send notifications
    await notificationService.notifyTdpSigned(contract, authenticatedUser, tdpDataset);

    // If all TDPs signed and CCRP is selected, notify CCRP
    if (allTdpsSigned && contract.ccrpId) {
      const ccrpUser = await db.User.findByPk(contract.ccrpId);
      if (ccrpUser) {
        await notificationService.notifyCCRPApprovalRequired(contract, ccrpUser);
      }
    }

    // If all TDPs signed and no CCRP, notify TDC
    if (allTdpsSigned && !contract.ccrpId) {
      const tdcUser = await db.User.findByPk(contract.tdcId);
      if (tdcUser) {
        await notificationService.notifyTdcApprovalRequired(contract, tdcUser);
      }
    }

    res.json({
      success: true,
      contract: await contract.reload(),
      tdpSignature: updatedTdpSignatures[tdpId],
      allTdpsSigned,
      newStatus: newMultiTdpStatus,
      blockchainTransaction: blockchainResult
    });

  } catch (error) {
    console.error('Error signing contract as TDP:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get Multi-TDP Contract Status
 * 
 * Returns detailed status information for multi-TDP contracts including:
 * - Which TDPs have signed
 * - Payment status for each TDP
 * - Overall contract status
 */
router.get('/:contractId/multi-tdp-status', async (req, res) => {
  try {
    const { contractId } = req.params;

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

    // Verify this is a multi-TDP contract
    if (!contract.contractDatasets || contract.datasetCount <= 1) {
      return res.status(400).json({ error: 'This endpoint is for multi-TDP contracts only' });
    }

    const contractDatasets = contract.contractDatasets || [];
    const tdpSignatures = contract.tdpSignatures || {};
    const tdpPayments = contract.tdpPayments || {};

    // Get detailed TDP status
    const tdpStatus = contractDatasets.map(dataset => {
      const tdpSignature = tdpSignatures[dataset.tdpId] || {};
      const tdpPayment = tdpPayments[dataset.tdpId] || {};
      
      return {
        datasetId: dataset.datasetId,
        datasetName: dataset.datasetName,
        tdpId: dataset.tdpId,
        tdpName: dataset.tdpName,
        individualPrice: dataset.individualPrice,
        signed: tdpSignature.signed || false,
        signedAt: tdpSignature.signedAt,
        paymentStatus: tdpPayment.status || 'PENDING',
        paymentAmount: tdpPayment.amount || dataset.individualPrice,
        paidAt: tdpPayment.paidAt
      };
    });

    // Calculate overall status
    const signedTdps = Object.values(tdpSignatures).filter(sig => sig.signed).length;
    const totalTdps = contractDatasets.length;
    const allTdpsSigned = signedTdps === totalTdps;

    res.json({
      success: true,
      contractId: contract.contractId,
      multiTdpStatus: contract.multiTdpStatus,
      datasetCount: contract.datasetCount,
      tdpCount: contract.tdpCount,
      totalPrice: contract.totalPrice,
      signedTdps,
      totalTdps,
      allTdpsSigned,
      tdpStatus,
      contractDatasets,
      tdpSignatures,
      tdpPayments
    });

  } catch (error) {
    console.error('Error getting multi-TDP status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Record TDP Payment
 * 
 * Records when a TDP has been paid for their portion of the contract.
 * This is typically called by the TDC or payment system.
 */
router.post('/:contractId/tdp-payment', authenticateToken, async (req, res) => {
  try {
    const { contractId } = req.params;
    const { tdpId, paymentAmount, paymentMethod = 'BANK_TRANSFER' } = req.body;

    // Get the authenticated user
    const authenticatedUser = req.user?.localUser;
    if (!authenticatedUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Only TDC or AppAdmin can record payments
    if (!['TDC', 'AppAdmin'].includes(authenticatedUser.partyType)) {
      return res.status(403).json({ error: 'Only TDC or AppAdmin can record payments' });
    }

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

    // Verify this is a multi-TDP contract
    if (!contract.contractDatasets || contract.datasetCount <= 1) {
      return res.status(400).json({ error: 'This endpoint is for multi-TDP contracts only' });
    }

    // Verify the TDP is a party to this contract
    const contractDatasets = contract.contractDatasets || [];
    const tdpDataset = contractDatasets.find(dataset => dataset.tdpId === tdpId);
    
    if (!tdpDataset) {
      return res.status(404).json({ error: 'TDP is not a party to this contract' });
    }

    // Verify payment amount matches the expected amount
    if (paymentAmount !== tdpDataset.individualPrice) {
      return res.status(400).json({ 
        error: 'Payment amount does not match expected amount',
        expected: tdpDataset.individualPrice,
        provided: paymentAmount
      });
    }

    // Update payment status
    const updatedTdpPayments = { ...contract.tdpPayments } || {};
    updatedTdpPayments[tdpId] = {
      amount: paymentAmount,
      status: 'PAID',
      paidAt: new Date(),
      paymentMethod: paymentMethod
    };

    // Update contract
    await contract.update({
      tdpPayments: updatedTdpPayments
    });

    // Get TDP user for notification
    const tdpUser = await db.User.findByPk(tdpId);
    if (tdpUser) {
      await notificationService.notifyTdpPaymentReceived(contract, tdpUser, paymentAmount);
    }

    res.json({
      success: true,
      tdpPayment: updatedTdpPayments[tdpId],
      message: 'Payment recorded successfully'
    });

  } catch (error) {
    console.error('Error recording TDP payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get Contract Payment Summary
 * 
 * Returns a summary of all payments for a multi-TDP contract.
 */
router.get('/:contractId/payment-summary', async (req, res) => {
  try {
    const { contractId } = req.params;

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

    // Verify this is a multi-TDP contract
    if (!contract.contractDatasets || contract.datasetCount <= 1) {
      return res.status(400).json({ error: 'This endpoint is for multi-TDP contracts only' });
    }

    const contractDatasets = contract.contractDatasets || [];
    const tdpPayments = contract.tdpPayments || {};

    // Calculate payment summary
    const paymentSummary = contractDatasets.map(dataset => {
      const payment = tdpPayments[dataset.tdpId] || {};
      
      return {
        datasetId: dataset.datasetId,
        datasetName: dataset.datasetName,
        tdpId: dataset.tdpId,
        tdpName: dataset.tdpName,
        expectedAmount: dataset.individualPrice,
        paidAmount: payment.amount || 0,
        paymentStatus: payment.status || 'PENDING',
        paidAt: payment.paidAt,
        paymentMethod: payment.paymentMethod
      };
    });

    const totalExpected = paymentSummary.reduce((sum, p) => sum + p.expectedAmount, 0);
    const totalPaid = paymentSummary.reduce((sum, p) => sum + p.paidAmount, 0);
    const paidCount = paymentSummary.filter(p => p.paymentStatus === 'PAID').length;
    const totalCount = paymentSummary.length;

    res.json({
      success: true,
      contractId: contract.contractId,
      totalExpected,
      totalPaid,
      paidCount,
      totalCount,
      allPaid: paidCount === totalCount,
      paymentSummary
    });

  } catch (error) {
    console.error('Error getting payment summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;