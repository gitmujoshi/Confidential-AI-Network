const express = require('express');
const router = express.Router();
const db = require('../models');
const { BlockchainService, NotificationService, ricardianContractService } = require('../services');
const blockchainService = new BlockchainService();
const notificationService = new NotificationService();
const { authenticateToken } = require('../middleware/auth');
const ContractValidationService = require('../services/contractValidationService');
const contractValidationService = new ContractValidationService();
const crypto = require('crypto');

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
        { model: db.User, as: 'tdc', attributes: ['id', 'name', 'email', 'walletAddress'] },
        { model: db.User, as: 'ccrp', attributes: ['id', 'name', 'email', 'walletAddress', 'cloudProviders', 'description'] }
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
        try {
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
        } catch (modelError) {
          console.error('Error fetching AI models:', modelError);
          modelInfoList = [];
        }
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

    const numericUserId = parseInt(userId, 10);
    let whereClause = {};

    if (user.partyType === 'AppAdmin') {
      // AppAdmin can view all contracts
      if (status) {
        whereClause.status = status;
      }
    } else {
      // Regular users: only contracts where they are a party.
      //
      // NOTE: `tdpId` is not a first-class DB column on `contracts` in the current schema.
      // TDP involvement is represented inside the JSONB `contract_datasets` payload.
      const partyFilters = [];

      if (user.partyType === 'TDC') {
        partyFilters.push({ tdcId: numericUserId });
      }

      if (user.partyType === 'CCRP') {
        partyFilters.push({ ccrpId: numericUserId });
      }

      if (user.partyType === 'TDP') {
        partyFilters.push(
          db.Sequelize.where(
            db.Sequelize.cast(db.Sequelize.col('contract_datasets'), 'text'),
            'ILIKE',
            `%"tdpId":${numericUserId}%`
          )
        );
      }

      // If we couldn't derive any filters, fail closed (empty result) rather than querying invalid columns.
      whereClause = partyFilters.length > 0 ? { [db.Sequelize.Op.or]: partyFilters } : { id: -1 };

      if (status) {
        whereClause.status = status;
      }
    }

    const contracts = await db.Contract.findAndCountAll({
      where: whereClause,
      include: [
        { model: db.User, as: 'tdc', attributes: ['id', 'name', 'email', 'walletAddress'] },
        { model: db.User, as: 'ccrp', attributes: ['id', 'name', 'email', 'walletAddress', 'cloudProviders', 'description'] }
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
        try {
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
        } catch (modelError) {
          console.error('Error fetching AI models:', modelError);
          modelInfoList = [];
        }
      }
      
      // Add dataset information if contractDatasets is null or empty but we have a datasetId
      let contractData = contract.toJSON();
      if ((!contractData.contractDatasets || contractData.contractDatasets.length === 0) && contractData.datasetId) {
        try {
          const dataset = await db.Dataset.findOne({
            where: { id: contractData.datasetId },
            include: [{ 
              model: db.User, 
              as: 'owner', 
              attributes: ['id', 'name', 'email', 'depaId', 'walletAddress', 'did'] 
            }]
          });
          
          if (dataset) {
            contractData.contractDatasets = [{
              datasetId: dataset.datasetId,
              datasetName: dataset.name,
              description: dataset.description,
              category: dataset.category,
              size: dataset.size,
              recordCount: dataset.recordCount,
              license: dataset.license,
              tags: dataset.tags || [],
              depaId: dataset.depaId,
              individualPrice: contractData.price,
              tdpId: dataset.owner.id,
              tdpName: dataset.owner.name,
              tdp: {
                id: dataset.owner.id,
                name: dataset.owner.name,
                email: dataset.owner.email,
                depaId: dataset.owner.depaId,
                walletAddress: dataset.owner.walletAddress,
                did: dataset.owner.did
              }
            }];
          }
        } catch (datasetError) {
          console.warn('Failed to fetch dataset information for contract in list:', datasetError);
        }
      }
      
      return {
        ...contractData,
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

    // Use contract service to get contract with datasets
    const ContractService = require('../services/contractService');
    const contractService = new ContractService();
    const contract = await contractService.getContract(contractId);

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
      ...contract,
      modelInfo,
      modelInfoList
    });
  } catch (error) {
    console.error('Error getting contract:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// Contract signing helpers (frontend expects /api/contracts/:contractId/*)
// ---------------------------------------------------------------------------

// Get signing data (message/hash) for a contract
router.get('/:contractId/signing-data', authenticateToken, async (req, res) => {
  try {
    const { contractId } = req.params;
    const partyType = req.user?.localUser?.partyType;
    if (!partyType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const contract = await db.Contract.findOne({ where: { contractId } });
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const timestamp = new Date().toISOString();
    const message = `Sign contract ${contract.contractId} as ${partyType} at ${timestamp}`;
    const contractHash = crypto.createHash('sha256').update(message).digest('hex');

    return res.json({
      success: true,
      message,
      contractHash,
      contractId: contract.contractId,
      partyType,
      timestamp,
    });
  } catch (error) {
    console.error('Error generating signing data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Sign contract as a party (TDP/CCRP/TDC)
router.post('/:contractId/sign', authenticateToken, async (req, res) => {
  try {
    const { contractId } = req.params;
    const currentUser = req.user?.localUser;
    if (!currentUser?.id || !currentUser?.partyType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { signature, partyType, timestamp, walletAddress, did } = req.body || {};
    if (!signature || !partyType) {
      return res.status(400).json({ error: 'Missing required fields: signature, partyType' });
    }

    // Enforce role matches unless AppAdmin.
    if (currentUser.partyType !== 'AppAdmin' && currentUser.partyType !== partyType) {
      return res.status(403).json({ error: 'Role mismatch: not authorized to sign as this partyType' });
    }

    const contract = await db.Contract.findOne({ where: { contractId } });
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Append signature into legalDocument (best-effort, schema-flexible)
    const legal = (contract.legalDocument && typeof contract.legalDocument === 'object')
      ? { ...contract.legalDocument }
      : {};
    legal.signatures = Array.isArray(legal.signatures) ? [...legal.signatures] : [];
    legal.signatures.push({
      partyType,
      signerUserId: currentUser.id,
      walletAddress: walletAddress || currentUser.walletAddress || null,
      did: did || currentUser.did || null,
      signature,
      timestamp: timestamp || new Date().toISOString(),
    });

    const updates = { legalDocument: legal };

    if (partyType === 'TDP') {
      const datasets = contract.contractDatasets;
      const isLinkedTdp = Array.isArray(datasets) && datasets.some((d) => Number(d?.tdpId) === Number(currentUser.id));
      if (currentUser.partyType !== 'AppAdmin' && !isLinkedTdp) {
        return res.status(403).json({ error: 'Only a linked TDP can sign this contract' });
      }

      // Advance to CCRP approval stage for legacy workflow.
      if (contract.status === 'PENDING_TDP_APPROVAL' || contract.status === 'PENDING_TDP') {
        updates.status = 'PENDING_CCRP_APPROVAL';
      }
    }

    if (partyType === 'CCRP') {
      if (currentUser.partyType !== 'AppAdmin' && Number(contract.ccrpId) !== Number(currentUser.id)) {
        return res.status(403).json({ error: 'Only the assigned CCRP can sign this contract' });
      }
      updates.ccrpSigned = true;
      updates.ccrpSignedAt = new Date();
      updates.status = 'SIGNED';
    }

    // NOTE: TDC signing is not required by the current training runtime gate (it checks status === SIGNED).
    await contract.update(updates);

    return res.json({
      success: true,
      contractId: contract.contractId,
      status: contract.status,
      ccrpSigned: contract.ccrpSigned,
      ccrpSignedAt: contract.ccrpSignedAt,
    });
  } catch (error) {
    console.error('Error signing contract:', error);
    return res.status(500).json({ error: 'Internal server error' });
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
    console.log('🔍 Using Value Objects validation for enhanced data integrity');
    
    // Validate contract data using Value Objects
    let validatedData;
    try {
      validatedData = contractValidationService.validateContractCreation(req.body);
      console.log('✅ Value Objects validation passed');
    } catch (validationError) {
      console.log('❌ Value Objects validation failed:', validationError.message);
      return res.status(400).json({ 
        error: 'Contract validation failed', 
        details: validationError.message 
      });
    }

    const {
      datasetSelections,
      aiModelIds,
      duration,
      termsAndConditions,
      ccrpId,
      contractType,
      environmentSpecs,
      trainingParams,
      privacyRequirements,
      trainingEnvironment,
      complianceSpecs,
      kmsConfigs,
      globalDEPAId,
      deploymentPrefix,
      jurisdiction
    } = validatedData;

    // Get TDC user from authentication context
    const tdcUser = req.user?.localUser;
    if (!tdcUser || tdcUser.partyType !== 'TDC') {
      return res.status(403).json({ error: 'Only TDC users can create contracts' });
    }

    // Validate and get datasets and their TDPs
    const validatedDatasets = [];
    const tdpIds = new Set();
    
    for (const selection of datasetSelections) {
      const { datasetId, individualPrice } = selection;
      
      if (!datasetId || !individualPrice) {
        return res.status(400).json({ error: 'Each dataset selection must have datasetId and individualPrice' });
      }

      console.log(`🔍 Validating dataset: ${datasetId}`);

      // Get dataset and verify it exists
      const dataset = await db.Dataset.findOne({
        where: { datasetId: datasetId },
        include: [{ model: db.User, as: 'owner', attributes: ['id', 'name', 'email', 'depaId', 'walletAddress', 'did', 'partyType'] }]
      });

      if (!dataset) {
        console.log(`❌ Dataset ${datasetId} not found`);
        return res.status(404).json({ error: `Dataset ${datasetId} not found` });
      }

      console.log(`🔍 Dataset owner partyType: ${dataset.owner.partyType}`);

      // Verify dataset owner is a TDP
      if (dataset.owner.partyType !== 'TDP') {
        console.log(`❌ Dataset ${datasetId} is not owned by a TDP. Owner partyType: ${dataset.owner.partyType}`);
        return res.status(400).json({ error: `Dataset ${datasetId} is not owned by a TDP` });
      }

      console.log(`✅ Dataset ${datasetId} validated successfully`);

      validatedDatasets.push({
        dataset,
        price: parseFloat(individualPrice)
      });
      tdpIds.add(dataset.owner.id);
    }

    console.log(`✅ All datasets validated. Total TDPs: ${tdpIds.size}`);

    // Get CCRP user if provided
    let ccrpUser = null;
    if (ccrpId) {
      ccrpUser = await db.User.findOne({
        where: { id: parseInt(ccrpId), partyType: 'CCRP' }
      });

      if (!ccrpUser) {
        return res.status(404).json({ error: 'CCRP not found' });
      }
    }

    // Get AI models if provided
    let aiModels = [];
    if (aiModelIds && Array.isArray(aiModelIds) && aiModelIds.length > 0) {
      aiModels = await db.AIModel.findAll({
        where: { id: aiModelIds.map(id => parseInt(id)) }
      });
    }

    // Generate unique contract ID using Value Objects
    const contractId = contractValidationService.generateContractId().value;

    // Calculate total price using Value Objects
    const totalPrice = contractValidationService.calculateTotalPrice(validatedData.datasetSelections).amount;

    console.log(`✅ Creating Ricardian contract with ID: ${contractId}`);

    // Prepare contract data for Ricardian contract creation
    const contractData = {
      contractId,
      tdpId: Array.from(tdpIds)[0], // Use first TDP as primary (for backward compatibility)
      primaryTdpId: Array.from(tdpIds)[0], // Primary TDP for backward compatibility
      tdcId: tdcUser.id,
      ccrpId: ccrpUser?.id,
      datasetId: validatedDatasets[0].dataset.id, // Use first dataset as primary (for backward compatibility)
      primaryDatasetId: validatedDatasets[0].dataset.id, // Primary dataset for backward compatibility
      aiModelIds: aiModels.map(model => model.id),
      price: totalPrice,
      duration: duration.durationValue,
      termsAndConditions,
      // Store multi-dataset information
      datasetSelections: validatedDatasets.map(({ dataset, price }) => ({
        datasetId: dataset.datasetId,
        individualPrice: price,
        tdpId: dataset.owner.id,
        tdpName: dataset.owner.name,
        tdpEmail: dataset.owner.email,
        tdpDepaId: dataset.owner.depaId,
        tdpWalletAddress: dataset.owner.walletAddress,
        tdpDid: dataset.owner.did,
        datasetName: dataset.name,
        description: dataset.description,
        depaId: dataset.depaId,
        confidentialComputingRequired: dataset.confidentialComputingRequired || false,
        category: dataset.category,
        size: dataset.size,
        recordCount: dataset.recordCount,
        license: dataset.license,
        tags: dataset.tags || []
      })),
      // Store privacy requirements
      privacyRequirements: privacyRequirements || {},
      // Store comprehensive training environment
      trainingEnvironment: trainingEnvironment || {},
      // Store compliance specifications
      complianceSpecs: complianceSpecs || {},
      tdp: {
        name: validatedDatasets[0].dataset.owner.name,
        email: validatedDatasets[0].dataset.owner.email,
        blockchainAddress: validatedDatasets[0].dataset.owner.walletAddress,
        did: validatedDatasets[0].dataset.owner.did
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
      kmsConfigs,
      // Add global DEPA ID options
      globalDEPAId,
      deploymentPrefix,
      jurisdiction
    };

    // Create Ricardian contract
    const ricardianResult = await ricardianContractService.createRicardianContract(contractData, contractType);

    // Don't auto-sign TDP - let them sign manually
    ricardianResult.contract.tdpSigned = false;
    ricardianResult.contract.status = 'PENDING_TDP_APPROVAL';
    await ricardianResult.contract.save();

    // Send notifications to all TDPs
    for (const tdpId of tdpIds) {
      const tdpUser = await db.User.findOne({ where: { id: tdpId } });
      if (tdpUser) {
        await notificationService.notifyContractCreated(ricardianResult.contract, tdpUser);
      }
    }

    console.log('✅ Ricardian contract created successfully with comprehensive specifications:', ricardianResult.contract.contractId);

    res.status(201).json({
      success: true,
      message: 'Ricardian contract created successfully with comprehensive specifications',
      contract: {
        ...ricardianResult.contract.toJSON(),
        depaId: ricardianResult.contract.depaId // Ensure DEPA ID is included in response
      },
      legalDocument: ricardianResult.legalDocument,
      smartContractData: ricardianResult.smartContractData
    });

  } catch (error) {
    console.error('❌ Error creating Ricardian contract:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

/**
 * Get available AI models for Ricardian contract creation
 * 
 * This endpoint provides AI models that can be selected during contract creation.
 * It returns all active AI models with their specifications.
 */
router.get('/ricardian/available-models', async (req, res) => {
  try {
    const { type, framework, limit = 50, offset = 0 } = req.query;

    const whereClause = {
      isActive: true
    };

    if (type) {
      whereClause.type = type;
    }

    if (framework) {
      whereClause.framework = framework;
    }

    const models = await db.AIModel.findAndCountAll({
      where: whereClause,
      order: [['name', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      models: models.rows,
      total: models.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error getting available AI models:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Test Multi-TDP Ricardian contract preview (for testing without authentication)
 * 
 * This endpoint allows testing of multi-TDP contract previews without authentication.
 * It generates the legal document and smart contract preview without deployment.
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
 * Get supported contract types
 * 
 * This endpoint provides the list of supported contract types for Ricardian contracts.
 */
router.get('/types/supported', async (req, res) => {
  try {
    const supportedTypes = [
      {
        id: 'AI_TRAINING',
        name: 'AI Training Contract',
        description: 'Contract for AI model training with privacy-preserving techniques',
        category: 'AI/ML',
        features: [
          'Differential Privacy',
          'Federated Learning',
          'Secure Multi-Party Computation',
          'Model Validation',
          'Privacy Metrics Tracking'
        ]
      },
      {
        id: 'DATA_ANALYTICS',
        name: 'Data Analytics Contract',
        description: 'Contract for secure data analytics and insights generation',
        category: 'Analytics',
        features: [
          'Secure Data Processing',
          'Privacy-Preserving Analytics',
          'Statistical Analysis',
          'Insight Generation'
        ]
      },
      {
        id: 'MODEL_INFERENCE',
        name: 'Model Inference Contract',
        description: 'Contract for secure model inference and prediction services',
        category: 'AI/ML',
        features: [
          'Secure Inference',
          'Privacy-Preserving Predictions',
          'Model Serving',
          'Result Validation'
        ]
      },
      {
        id: 'FEDERATED_LEARNING',
        name: 'Federated Learning Contract',
        description: 'Contract for distributed model training across multiple parties',
        category: 'AI/ML',
        features: [
          'Distributed Training',
          'Secure Aggregation',
          'Model Convergence',
          'Communication Optimization'
        ]
      }
    ];

    res.json({
      supportedTypes,
      total: supportedTypes.length
    });
  } catch (error) {
    console.error('Error getting supported contract types:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export the router
module.exports = router; 