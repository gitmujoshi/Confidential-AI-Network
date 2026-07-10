const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticateToken } = require('../middleware/auth');
const DEPAIdService = require('../services/depaIdService');

// Get all AI models
router.get('/', async (req, res) => {
  try {
    const { type, framework, limit = 10, offset = 0 } = req.query;

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
      order: [['createdAt', 'DESC']],
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
    console.error('Error getting AI models:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific AI model
router.get('/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;

    const model = await db.AIModel.findOne({
      where: { modelId, isActive: true }
    });

    if (!model) {
      return res.status(404).json({ error: 'AI model not found' });
    }

    res.json(model);
  } catch (error) {
    console.error('Error getting AI model:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new AI model
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      modelId,
      name,
      description,
      type,
      architecture,
      parameters,
      framework,
      privacyTechnique,
      validationMetrics,
      maxEpochs,
      batchSize,
      learningRate,
      metadata
    } = req.body;

    // Validate required fields
    if (!modelId || !name || !description || !type || !architecture || !parameters || !framework || !privacyTechnique || !validationMetrics || !maxEpochs || !batchSize || !learningRate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if model ID already exists
    const existingModel = await db.AIModel.findOne({
      where: { modelId }
    });

    if (existingModel) {
      return res.status(400).json({ error: 'Model ID already exists' });
    }

    // Create AI model
    const depaIdService = new DEPAIdService();
    const model = await db.AIModel.create({
      modelId,
      name,
      description,
      type,
      architecture,
      parameters,
      framework,
      privacyTechnique,
      validationMetrics,
      maxEpochs,
      batchSize,
      learningRate,
      metadata: metadata || {},
      depaId: depaIdService.generateDEPAId('AIMODEL')
    });

    res.status(201).json({
      success: true,
      model
    });
  } catch (error) {
    console.error('Error creating AI model:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update AI model
router.put('/:modelId', authenticateToken, async (req, res) => {
  try {
    const { modelId } = req.params;
    const updateData = req.body;

    const model = await db.AIModel.findOne({
      where: { modelId }
    });

    if (!model) {
      return res.status(404).json({ error: 'AI model not found' });
    }

    // Update model
    await model.update(updateData);

    res.json({
      success: true,
      model
    });
  } catch (error) {
    console.error('Error updating AI model:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete AI model (soft delete)
router.delete('/:modelId', authenticateToken, async (req, res) => {
  try {
    const { modelId } = req.params;

    const model = await db.AIModel.findOne({
      where: { modelId }
    });

    if (!model) {
      return res.status(404).json({ error: 'AI model not found' });
    }

    // Soft delete by setting isActive to false
    await model.update({ isActive: false });

    res.json({
      success: true,
      message: 'AI model deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting AI model:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get AI model types
router.get('/types/list', async (req, res) => {
  try {
    const types = [
      'transformer',
      'cnn',
      'rnn',
      'gan',
      'other'
    ];

    res.json(types);
  } catch (error) {
    console.error('Error getting AI model types:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get AI model frameworks
router.get('/frameworks/list', async (req, res) => {
  try {
    const frameworks = [
      'PyTorch',
      'TensorFlow',
      'JAX',
      'Other'
    ];

    res.json(frameworks);
  } catch (error) {
    console.error('Error getting AI model frameworks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get AI model privacy techniques
router.get('/privacy-techniques/list', async (req, res) => {
  try {
    const privacyTechniques = [
      'federated-learning',
      'differential-privacy',
      'homomorphic-encryption',
      'secure-multi-party-computation',
      'zero-knowledge-proofs',
      'none'
    ];

    res.json(privacyTechniques);
  } catch (error) {
    console.error('Error getting AI model privacy techniques:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 