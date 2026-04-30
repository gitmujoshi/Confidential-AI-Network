const express = require('express');
const router = express.Router();
const db = require('../models');
const { v4: uuidv4 } = require('uuid');
const DEPAIdService = require('../services/depaIdService');

// Get all public datasets
router.get('/public', async (req, res) => {
  try {
    const { category, confidentialComputingRequired, limit = 10, offset = 0 } = req.query;

    const whereClause = {
      isPublic: true,
      isActive: true
    };

    if (category) {
      whereClause.category = category;
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
      datasets: datasets.rows,
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
      datasets: datasets.rows,
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
      datasets: datasets.rows,
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

    res.json(dataset);
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
      dataset: dataset
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
      dataset: updatedDataset
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
      datasets: datasets.rows,
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