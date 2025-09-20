/**
 * AI Model Upload API Routes
 * 
 * Handles secure AI model upload for TDC users with encryption,
 * provenance tracking, and TEE integration.
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const { requireAuth, requireRole } = require('../middleware/auth');
const { AIModel, User } = require('../models');
const ProvenanceTrackingService = require('../services/provenanceTrackingService');
const PlatformEncryptionService = require('../services/platformEncryptionService');
const EnhancedPlatformEncryptionService = require('../services/enhancedPlatformEncryptionService');
const ScittIntegrationService = require('../services/scittIntegrationService');

// Initialize services
const provenanceService = new ProvenanceTrackingService();
const encryptionService = new PlatformEncryptionService();
const enhancedEncryptionService = new EnhancedPlatformEncryptionService();
const scittService = ScittIntegrationService; // Already an instance

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/ai-models', req.user.id.toString());
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}_${timestamp}_${randomString}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024, // 5GB limit
    files: 10 // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = {
      modelFile: ['.pkl', '.h5', '.pt', '.pth', '.onnx', '.pb', '.zip', '.tar', '.tar.gz'],
      configFile: ['.json', '.yml', '.yaml', '.txt', '.cfg'],
      documentationFile: ['.pdf', '.md', '.txt', '.doc', '.docx'],
      checksumFile: ['.sha256', '.md5', '.txt', '.json']
    };

    const ext = path.extname(file.originalname).toLowerCase();
    const fieldAllowedTypes = allowedTypes[file.fieldname] || [];
    
    if (fieldAllowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type for ${file.fieldname}. Allowed: ${fieldAllowedTypes.join(', ')}`));
    }
  }
});

/**
 * Upload AI Model with enhanced security
 * POST /api/ai-models/upload
 */
router.post('/upload',
  requireAuth,
  requireRole(['TDC']),
  upload.fields([
    { name: 'modelFile', maxCount: 1 },
    { name: 'configFile', maxCount: 1 },
    { name: 'documentationFile', maxCount: 1 },
    { name: 'checksumFile', maxCount: 1 }
  ]),
  [
    body('modelData').custom((value) => {
      try {
        const parsed = JSON.parse(value);
        if (!parsed.name || !parsed.type || !parsed.description) {
          throw new Error('Missing required model information');
        }
        return true;
      } catch (error) {
        throw new Error('Invalid model data format');
      }
    }),
    body('encryptionConfig').optional().custom((value) => {
      try {
        JSON.parse(value);
        return true;
      } catch (error) {
        throw new Error('Invalid encryption config format');
      }
    }),
    body('securityConfig').optional().custom((value) => {
      try {
        JSON.parse(value);
        return true;
      } catch (error) {
        throw new Error('Invalid security config format');
      }
    })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { user } = req;
      const modelData = JSON.parse(req.body.modelData);
      const encryptionConfig = req.body.encryptionConfig ? JSON.parse(req.body.encryptionConfig) : {};
      const securityConfig = req.body.securityConfig ? JSON.parse(req.body.securityConfig) : {};

      // Check if model file was uploaded
      if (!req.files?.modelFile?.[0]) {
        return res.status(400).json({
          success: false,
          message: 'Model file is required'
        });
      }

      const modelFile = req.files.modelFile[0];
      console.log(`🤖 Processing AI model upload for user ${user.id}: ${modelData.name}`);

      // Initialize provenance tracking session
      const sessionId = `model_upload_${user.id}_${Date.now()}`;
      const provenanceSession = await provenanceService.initializeProvenanceTracking({
        jobId: sessionId,
        contractId: 'model_upload',
        environmentId: 'platform',
        userId: user.id,
        modelName: modelData.name
      });

      // Create initial provenance node for model upload
      await provenanceService.createProvenanceNode({
        nodeId: `model_metadata_${sessionId}`,
        type: 'MODEL',
        content: {
          modelData,
          encryptionConfig,
          securityConfig,
          uploadedBy: user.id,
          uploadedAt: new Date()
        },
        metadata: {
          operation: 'MODEL_UPLOAD_INIT',
          userId: user.id,
          modelName: modelData.name
        }
      });

      // Add node to Merkle tree
      await provenanceService.addNodeToMerkleTree(provenanceSession.sessionId, `model_metadata_${sessionId}`);

      // Calculate file hash for integrity verification
      const fileBuffer = await fs.readFile(modelFile.path);
      const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      // Create provenance node for model file
      await provenanceService.createProvenanceNode({
        nodeId: `model_file_${sessionId}`,
        type: 'DATA',
        content: {
          fileName: modelFile.originalname,
          fileSize: modelFile.size,
          filePath: modelFile.path,
          fileHash,
          mimeType: modelFile.mimetype
        },
        parentNodes: [`model_metadata_${sessionId}`],
        metadata: {
          operation: 'MODEL_FILE_UPLOAD',
          originalName: modelFile.originalname,
          uploadedAt: new Date()
        }
      });

      await provenanceService.addNodeToMerkleTree(provenanceSession.sessionId, `model_file_${sessionId}`);

      // Encrypt model file if encryption is enabled
      let encryptedFilePath = modelFile.path;
      let encryptionMetadata = null;

      if (encryptionConfig.encryptionEnabled) {
        console.log(`🔐 Encrypting model file with ${encryptionConfig.algorithm}`);
        
        const encryptionService = encryptionConfig.algorithm === 'AES-256-GCM' 
          ? enhancedEncryptionService 
          : encryptionService;

        const encryptionResult = await encryptionService.encryptFile(
          modelFile.path,
          {
            algorithm: encryptionConfig.algorithm,
            keyManagement: encryptionConfig.keyManagement,
            teeRequired: encryptionConfig.teeRequired,
            metadata: {
              modelName: modelData.name,
              userId: user.id,
              uploadedAt: new Date()
            }
          }
        );

        encryptedFilePath = encryptionResult.encryptedFilePath;
        encryptionMetadata = encryptionResult.metadata;

        // Create provenance node for encryption
        await provenanceService.createProvenanceNode({
          nodeId: `model_encryption_${sessionId}`,
          type: 'EXECUTION',
          content: {
            operation: 'FILE_ENCRYPTION',
            algorithm: encryptionConfig.algorithm,
            keyId: encryptionResult.keyId,
            encryptedAt: new Date()
          },
          parentNodes: [`model_file_${sessionId}`],
          metadata: {
            operation: 'MODEL_ENCRYPTION',
            algorithm: encryptionConfig.algorithm,
            teeRequired: encryptionConfig.teeRequired
          }
        });

        await provenanceService.addNodeToMerkleTree(provenanceSession.sessionId, `model_encryption_${sessionId}`);
      }

      // Process additional files if uploaded
      const additionalFiles = {};
      for (const [fieldName, files] of Object.entries(req.files)) {
        if (fieldName !== 'modelFile' && files && files[0]) {
          const file = files[0];
          const fileHash = crypto.createHash('sha256').update(await fs.readFile(file.path)).digest('hex');
          
          additionalFiles[fieldName] = {
            originalName: file.originalname,
            filename: file.filename,
            path: file.path,
            size: file.size,
            hash: fileHash
          };

          // Create provenance node for additional file
          await provenanceService.createProvenanceNode({
            nodeId: `${fieldName}_${sessionId}`,
            type: 'DATA',
            content: {
              fileName: file.originalname,
              fileSize: file.size,
              filePath: file.path,
              fileHash,
              mimeType: file.mimetype,
              fileType: fieldName
            },
            parentNodes: [`model_metadata_${sessionId}`],
            metadata: {
              operation: `${fieldName.toUpperCase()}_UPLOAD`,
              originalName: file.originalname
            }
          });

          await provenanceService.addNodeToMerkleTree(provenanceSession.sessionId, `${fieldName}_${sessionId}`);
        }
      }

      // Create AI model record in database
      const aiModel = await AIModel.create({
        name: modelData.name,
        description: modelData.description,
        type: modelData.type,
        architecture: modelData.architecture,
        framework: modelData.framework,
        version: modelData.version,
        license: modelData.license,
        ownerId: user.id,
        fileName: modelFile.originalname,
        filePath: encryptedFilePath,
        fileSize: modelFile.size,
        fileHash: fileHash,
        encryptionEnabled: encryptionConfig.encryptionEnabled || false,
        encryptionAlgorithm: encryptionConfig.algorithm,
        encryptionMetadata: encryptionMetadata,
        teeRequired: encryptionConfig.teeRequired || false,
        intellectualPropertyProtection: modelData.intellectualPropertyProtection || false,
        provenanceSessionId: provenanceSession.sessionId,
        additionalFiles: additionalFiles,
        securityConfig: securityConfig,
        status: 'UPLOADED',
        isPublic: modelData.isPublic || false,
        requiresApproval: modelData.requiresApproval !== false
      });

      // Create SCITT CCF claim for model upload
      const scittClaim = await scittService.createProvenanceRecord(
        `model_${aiModel.id}`,
        provenanceSession.rootHash,
        'AI_MODEL_UPLOAD',
        {
          modelId: aiModel.id,
          modelName: modelData.name,
          userId: user.id,
          sessionId: provenanceSession.sessionId,
          encrypted: encryptionConfig.encryptionEnabled,
          teeRequired: encryptionConfig.teeRequired,
          uploadedAt: new Date()
        }
      );

      // Finalize provenance tracking
      const chainVerification = await provenanceService.verifyProvenanceChain(provenanceSession.sessionId);

      // Clean up original unencrypted file if encryption was used
      if (encryptionConfig.encryptionEnabled && encryptedFilePath !== modelFile.path) {
        try {
          await fs.unlink(modelFile.path);
        } catch (error) {
          console.warn('⚠️ Failed to clean up original file:', error.message);
        }
      }

      console.log(`✅ AI model uploaded successfully: ${aiModel.id}`);

      res.status(201).json({
        success: true,
        message: 'AI model uploaded successfully',
        data: {
          modelId: aiModel.id,
          name: aiModel.name,
          status: aiModel.status,
          encrypted: aiModel.encryptionEnabled,
          teeRequired: aiModel.teeRequired,
          provenanceSessionId: provenanceSession.sessionId,
          rootHash: provenanceSession.rootHash,
          scittClaimId: scittClaim.claimId,
          chainVerification: {
            status: chainVerification.overallStatus,
            integrity: chainVerification.chainIntegrity
          },
          uploadedAt: aiModel.createdAt
        }
      });

    } catch (error) {
      console.error('❌ AI model upload failed:', error);

      // Clean up uploaded files on error
      if (req.files) {
        for (const files of Object.values(req.files)) {
          for (const file of files) {
            try {
              await fs.unlink(file.path);
            } catch (cleanupError) {
              console.warn('⚠️ Failed to clean up file on error:', cleanupError.message);
            }
          }
        }
      }

      res.status(500).json({
        success: false,
        message: 'Failed to upload AI model',
        error: error.message
      });
    }
  }
);

/**
 * Get model upload status
 * GET /api/ai-models/upload/:modelId/status
 */
router.get('/upload/:modelId/status',
  requireAuth,
  async (req, res) => {
    try {
      const { modelId } = req.params;
      const { user } = req;

      const aiModel = await AIModel.findOne({
        where: { 
          id: modelId,
          ownerId: user.id // Only allow access to own models
        },
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      if (!aiModel) {
        return res.status(404).json({
          success: false,
          message: 'AI model not found'
        });
      }

      // Get provenance report if available
      let provenanceReport = null;
      if (aiModel.provenanceSessionId) {
        try {
          provenanceReport = await provenanceService.getProvenanceReport(aiModel.provenanceSessionId);
        } catch (error) {
          console.warn('⚠️ Failed to get provenance report:', error.message);
        }
      }

      res.json({
        success: true,
        message: 'Model status retrieved successfully',
        data: {
          model: {
            id: aiModel.id,
            name: aiModel.name,
            description: aiModel.description,
            type: aiModel.type,
            status: aiModel.status,
            encrypted: aiModel.encryptionEnabled,
            teeRequired: aiModel.teeRequired,
            intellectualPropertyProtection: aiModel.intellectualPropertyProtection,
            fileSize: aiModel.fileSize,
            uploadedAt: aiModel.createdAt,
            owner: aiModel.owner
          },
          provenance: provenanceReport ? {
            sessionId: provenanceReport.sessionId,
            rootHash: provenanceReport.rootHash,
            nodeCount: provenanceReport.nodeCount,
            chainIntegrity: provenanceReport.chainIntegrity,
            status: provenanceReport.status
          } : null
        }
      });

    } catch (error) {
      console.error('❌ Failed to get model upload status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get model upload status',
        error: error.message
      });
    }
  }
);

/**
 * List uploaded models for current user
 * GET /api/ai-models/my-uploads
 */
router.get('/my-uploads',
  requireAuth,
  async (req, res) => {
    try {
      const { user } = req;
      const { page = 1, limit = 10, status, type } = req.query;

      const whereClause = { ownerId: user.id };
      if (status) whereClause.status = status;
      if (type) whereClause.type = type;

      const offset = (page - 1) * limit;

      const { rows: models, count: total } = await AIModel.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'name', 'email']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        message: 'Models retrieved successfully',
        data: {
          models: models.map(model => ({
            id: model.id,
            name: model.name,
            description: model.description,
            type: model.type,
            status: model.status,
            encrypted: model.encryptionEnabled,
            teeRequired: model.teeRequired,
            fileSize: model.fileSize,
            uploadedAt: model.createdAt
          })),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      console.error('❌ Failed to list uploaded models:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to list uploaded models',
        error: error.message
      });
    }
  }
);

/**
 * Delete uploaded model
 * DELETE /api/ai-models/upload/:modelId
 */
router.delete('/upload/:modelId',
  requireAuth,
  async (req, res) => {
    try {
      const { modelId } = req.params;
      const { user } = req;

      const aiModel = await AIModel.findOne({
        where: { 
          id: modelId,
          ownerId: user.id // Only allow deletion of own models
        }
      });

      if (!aiModel) {
        return res.status(404).json({
          success: false,
          message: 'AI model not found'
        });
      }

      // Check if model is being used in any contracts
      if (aiModel.status === 'IN_USE') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete model that is currently in use'
        });
      }

      // Clean up files
      try {
        if (aiModel.filePath) {
          await fs.unlink(aiModel.filePath);
        }
        
        // Clean up additional files
        if (aiModel.additionalFiles) {
          for (const fileInfo of Object.values(aiModel.additionalFiles)) {
            if (fileInfo.path) {
              await fs.unlink(fileInfo.path);
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Failed to clean up files:', error.message);
      }

      // Delete model record
      await aiModel.destroy();

      console.log(`🗑️ AI model deleted: ${modelId}`);

      res.json({
        success: true,
        message: 'AI model deleted successfully'
      });

    } catch (error) {
      console.error('❌ Failed to delete AI model:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete AI model',
        error: error.message
      });
    }
  }
);

module.exports = router;
