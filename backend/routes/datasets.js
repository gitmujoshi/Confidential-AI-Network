const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const multer = require('multer');
const db = require('../models');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');
const { persistUploadedFiles } = require('../services/datasetArtifactStorage');
const DEPAIdService = require('../services/depaIdService');

const artifactUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const tmp = path.join(__dirname, '../uploads/tmp');
      fs.mkdirSync(tmp, { recursive: true });
      cb(null, tmp);
    },
    filename: (_req, file, cb) => {
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${file.originalname}`);
    },
  }),
  limits: { fileSize: 128 * 1024 * 1024, files: 40 },
});

function inferDatasetModality(row) {
  // Prefer explicit modality if present (future-proof).
  const meta = row?.metadata && typeof row.metadata === 'object' ? row.metadata : {};
  const explicit = meta?.modality || meta?.dataType || row?.modality;
  if (typeof explicit === 'string' && explicit.trim()) return explicit.trim().toLowerCase();

  const category = String(row?.category || '').toLowerCase();
  if (category.includes('computer vision')) return 'vision';
  if (category.includes('natural language')) return 'text';
  if (category.includes('tabular')) return 'tabular';
  if (category.includes('audio')) return 'audio';
  if (category.includes('multimodal')) return 'multimodal';
  return 'unknown';
}

function withModality(datasetRow) {
  const plain = datasetRow?.get ? datasetRow.get({ plain: true }) : datasetRow;
  const artifactCount = Number(plain.artifactFileCount ?? plain.artifact_file_count ?? 0);
  const storageBackend = plain.storageBackend ?? plain.storage_backend ?? 'none';
  return {
    ...plain,
    modality: inferDatasetModality(plain),
    physicalTrainingReady: artifactCount > 0 && storageBackend === 'local',
  };
}

// Get all public datasets
router.get('/public', async (req, res) => {
  try {
    const { category, domain, confidentialComputingRequired, limit = 10, offset = 0 } = req.query;

    const whereClause = {
      isPublic: true,
      isActive: true
    };

    if (category) {
      whereClause.category = category;
    }

    if (domain) {
      whereClause.domain = domain;
    }

    if (confidentialComputingRequired !== undefined) {
      whereClause.confidentialComputingRequired = confidentialComputingRequired === 'true';
    }

    const datasets = await db.Dataset.findAndCountAll({
      where: whereClause,
      include: [
        { model: db.User, as: 'owner', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      datasets: datasets.rows.map(withModality),
      total: datasets.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error getting public datasets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get datasets by owner
router.get('/owner/:ownerId', async (req, res) => {
  try {
    const { ownerId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const datasets = await db.Dataset.findAndCountAll({
      where: { ownerId, isActive: true },
      include: [
        { model: db.User, as: 'owner', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      datasets: datasets.rows.map(withModality),
      total: datasets.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error getting owner datasets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search datasets (must come before /:datasetId route)
router.get('/search', async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, confidentialComputingRequired, limit = 10, offset = 0 } = req.query;

    const whereClause = {
      isPublic: true,
      isActive: true
    };

    if (category) {
      whereClause.category = category;
    }

    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price[db.Sequelize.Op.gte] = parseFloat(minPrice);
      if (maxPrice) whereClause.price[db.Sequelize.Op.lte] = parseFloat(maxPrice);
    }

    if (confidentialComputingRequired !== undefined) {
      whereClause.confidentialComputingRequired = confidentialComputingRequired === 'true';
    }

    if (q) {
      whereClause[db.Sequelize.Op.or] = [
        { name: { [db.Sequelize.Op.iLike]: `%${q}%` } },
        { description: { [db.Sequelize.Op.iLike]: `%${q}%` } },
        { tags: { [db.Sequelize.Op.contains]: [q] } }
      ];
    }

    const datasets = await db.Dataset.findAndCountAll({
      where: whereClause,
      include: [
        { model: db.User, as: 'owner', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      datasets: datasets.rows.map(withModality),
      total: datasets.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error searching datasets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get dataset domain categories (must come before /:datasetId route)
router.get('/domains/list', async (req, res) => {
  try {
    // Try to get domain categories from constraints database first
    try {
      const { ConstraintCategory, ConstraintField, ConstraintValue } = require('../models');
      
      const category = await ConstraintCategory.findOne({
        where: { categoryKey: 'datasets' },
        include: [{
          model: ConstraintField,
          as: 'fields',
          where: { fieldKey: 'domain_category' },
          include: [{
            model: ConstraintValue,
            as: 'values',
            where: { isActive: true },
            order: [['displayOrder', 'ASC'], ['label', 'ASC']]
          }]
        }]
      });

      if (category && category.fields && category.fields.length > 0) {
        const domains = category.fields[0].values.map(value => value.valueKey);
        console.log('✅ Retrieved domain categories from database:', domains);
        return res.json(domains);
      } else {
        console.log('⚠️ No domain constraint data found in database');
      }
    } catch (dbError) {
      console.log('❌ Database domain categories not available, using fallback:', dbError.message);
    }

    // Fallback to hardcoded domain categories if database is not available
    const domains = [
      'Healthcare',
      'Finance',
      'Retail',
      'Manufacturing',
      'Technology',
      'Education',
      'Government',
      'Energy',
      'Transportation',
      'Agriculture',
      'Media',
      'Other'
    ];

    res.json(domains);
  } catch (error) {
    console.error('Error getting domain categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get dataset categories (must come before /:datasetId route)
router.get('/categories/list', async (req, res) => {
  try {
    // Try to get categories from constraints database first
    try {
      const { ConstraintCategory, ConstraintField, ConstraintValue } = require('../models');
      
      const category = await ConstraintCategory.findOne({
        where: { categoryKey: 'datasets' },
        include: [{
          model: ConstraintField,
          as: 'fields',
          where: { fieldKey: 'dataset_category' },
          include: [{
            model: ConstraintValue,
            as: 'values',
            where: { isActive: true },
            order: [['displayOrder', 'ASC'], ['label', 'ASC']]
          }]
        }]
      });

      if (category && category.fields && category.fields.length > 0) {
        const categories = category.fields[0].values.map(value => value.valueKey);
        console.log('✅ Retrieved categories from database:', categories);
        return res.json(categories);
      } else {
        console.log('⚠️ No constraint data found in database');
      }
    } catch (dbError) {
      console.log('❌ Database categories not available, using fallback:', dbError.message);
    }

    // Fallback to hardcoded categories if database is not available
    const categories = [
      'Computer Vision',
      'Natural Language Processing',
      'Audio',
      'Tabular',
      'Multimodal',
      'Time Series',
      'Graph'
    ];

    res.json(categories);
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get dataset statistics (must come before /:datasetId route)
router.get('/stats/overview', async (req, res) => {
  try {
    const totalDatasets = await db.Dataset.count({
      where: { isActive: true }
    });

    const publicDatasets = await db.Dataset.count({
      where: { isActive: true, isPublic: true }
    });

    const confidentialComputingDatasets = await db.Dataset.count({
      where: { isActive: true, confidentialComputingRequired: true }
    });

    const standardProcessingDatasets = await db.Dataset.count({
      where: { isActive: true, confidentialComputingRequired: false }
    });

    const categoryStats = await db.Dataset.findAll({
      attributes: [
        'category',
        [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count']
      ],
      where: { isActive: true },
      group: ['category']
    });

    const avgPrice = await db.Dataset.findOne({
      attributes: [
        [db.Sequelize.fn('AVG', db.Sequelize.col('price')), 'averagePrice']
      ],
      where: { isActive: true }
    });

    res.json({
      totalDatasets,
      publicDatasets,
      confidentialComputingDatasets,
      standardProcessingDatasets,
      categoryStats,
      averagePrice: parseFloat(avgPrice.dataValues.averagePrice || 0).toFixed(2)
    });
  } catch (error) {
    console.error('Error getting dataset stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Upload training artifact files for a dataset (multipart field name: files).
 * TDP owner or AppAdmin only. Replaces any previous artifacts for this dataset.
 */
router.post(
  '/:datasetId/artifacts',
  authenticateToken,
  artifactUpload.array('files', 40),
  async (req, res) => {
    try {
      const { datasetId } = req.params;
      const localUser = req.user?.localUser;
      const userId = localUser?.id;
      const partyType = localUser?.partyType;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const dataset = await db.Dataset.findOne({ where: { datasetId } });
      if (!dataset) {
        return res.status(404).json({ error: 'Dataset not found' });
      }

      const isOwner = dataset.ownerId === userId;
      const isAppAdmin = partyType === 'AppAdmin';
      if (!isOwner && !isAppAdmin) {
        return res.status(403).json({
          error: 'Only the dataset owner or AppAdmin can upload training files',
        });
      }

      if (!req.files?.length) {
        return res.status(400).json({ error: 'No files uploaded (multipart field name: files)' });
      }

      const meta = await persistUploadedFiles(datasetId, req.files, {
        contentFormat: req.body?.contentFormat || req.body?.content_format || null,
      });

      await dataset.update({
        storageBackend: meta.storageBackend,
        artifactFileCount: meta.artifactFileCount,
        artifactTotalBytes: meta.artifactTotalBytes,
        contentFormat: meta.contentFormat || dataset.contentFormat,
        artifactsUpdatedAt: meta.artifactsUpdatedAt,
      });

      const refreshed = await db.Dataset.findOne({
        where: { datasetId },
        include: [{ model: db.User, as: 'owner', attributes: ['id', 'name', 'email'] }],
      });

      return res.status(201).json({
        success: true,
        dataset: withModality(refreshed),
      });
    } catch (error) {
      console.error('Artifact upload failed:', error);
      return res.status(400).json({ error: error.message || 'Upload failed' });
    }
  }
);

// Get specific dataset
router.get('/:datasetId', async (req, res) => {
  try {
    const { datasetId } = req.params;

    const dataset = await db.Dataset.findOne({
      where: { datasetId, isActive: true },
      include: [
        { model: db.User, as: 'owner', attributes: ['id', 'name', 'email', 'description'] }
      ]
    });

    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    res.json(withModality(dataset));
  } catch (error) {
    console.error('Error getting dataset:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new dataset
router.post('/', async (req, res) => {
  try {
    const {
      datasetId,
      name,
      description,
      category,
      size,
      recordCount,
      price,
      license,
      tags,
      metadata,
      isPublic,
      confidentialComputingRequired,
      ownerId,
      // Security and compliance fields
      data_classification,
      secure_enclave_required,
      attestation_required,
      encryption_algorithm,
      encryption_at_rest,
      encryption_in_transit,
      data_residency_region,
      processing_location,
      cross_border_transfer_allowed,
      attestation_policy,
      access_control_policy,
      retention_policy,
      audit_configuration
    } = req.body;

    // Validate required fields
    if (!datasetId || !name || !description || !category || !size || !recordCount || !price || !license || !ownerId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if dataset ID already exists
    const existingDataset = await db.Dataset.findOne({
      where: { datasetId }
    });

    if (existingDataset) {
      return res.status(400).json({ error: 'Dataset ID already exists' });
    }

    // Verify owner exists and is a TDP
    const owner = await db.User.findOne({
      where: { id: ownerId, partyType: 'TDP' }
    });

    if (!owner) {
      return res.status(404).json({ error: 'Owner not found or not a TDP' });
    }

    // Create dataset
    const depaIdService = new DEPAIdService();
    const dataset = await db.Dataset.create({
      datasetId,
      name,
      description,
      category,
      size,
      recordCount,
      price,
      license,
      tags: tags || [],
      metadata: metadata || {},
      isPublic: isPublic !== undefined ? isPublic : true,
      confidentialComputingRequired: confidentialComputingRequired !== undefined ? confidentialComputingRequired : false,
      ownerId,
      depaId: depaIdService.generateDEPAId('DATASET'),
      // Security and compliance fields
      data_classification: data_classification || 'INTERNAL',
      secure_enclave_required: secure_enclave_required || false,
      attestation_required: attestation_required || false,
      encryption_algorithm: encryption_algorithm || 'AES-256-GCM',
      encryption_at_rest: encryption_at_rest !== undefined ? encryption_at_rest : true,
      encryption_in_transit: encryption_in_transit !== undefined ? encryption_in_transit : true,
      data_residency_region: data_residency_region || null,
      processing_location: processing_location || null,
      cross_border_transfer_allowed: cross_border_transfer_allowed || false,
      attestation_policy: attestation_policy || {},
      access_control_policy: access_control_policy || {},
      retention_policy: retention_policy || {},
      audit_configuration: audit_configuration || {}
    });

    // Return the created dataset directly (will fetch owner separately if needed)
    res.status(201).json({
      success: true,
      dataset: withModality(dataset)
    });
  } catch (error) {
    console.error('Error creating dataset:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update dataset
router.put('/:datasetId', async (req, res) => {
  try {
    const { datasetId } = req.params;
    const updateData = req.body;

    const dataset = await db.Dataset.findOne({
      where: { datasetId }
    });

    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    // Update dataset
    await dataset.update(updateData);

    // Get updated dataset with owner info
    const updatedDataset = await db.Dataset.findOne({
      where: { datasetId },
      include: [
        { model: db.User, as: 'owner', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.json({
      success: true,
      dataset: withModality(updatedDataset)
    });
  } catch (error) {
    console.error('Error updating dataset:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete dataset (soft delete)
router.delete('/:datasetId', async (req, res) => {
  try {
    const { datasetId } = req.params;

    const dataset = await db.Dataset.findOne({
      where: { datasetId }
    });

    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    // Soft delete by setting isActive to false
    await dataset.update({ isActive: false });

    res.json({
      success: true,
      message: 'Dataset deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting dataset:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Compatibility: GET / (all public datasets)
router.get('/', async (req, res) => {
  try {
    const { category, domain, limit = 10, offset = 0 } = req.query;

    const whereClause = {
      isPublic: true,
      isActive: true
    };

    if (category) {
      whereClause.category = category;
    }

    if (domain) {
      whereClause.domain = domain;
    }

    const datasets = await db.Dataset.findAndCountAll({
      where: whereClause,
      include: [
        { model: db.User, as: 'owner', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      datasets: datasets.rows.map(withModality),
      total: datasets.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error getting datasets (compat route):', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 