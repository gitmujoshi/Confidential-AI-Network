/**
 * Contract Template Routes
 * 
 * This module provides API endpoints for managing contract templates:
 * - Get available templates
 * - Search and filter templates
 * - Create, update, and delete templates
 * - Get template recommendations
 * - Validate template compatibility
 */

const express = require('express');
const router = express.Router();
const ContractTemplateService = require('../services/contractTemplateService');
const { authenticateToken } = require('../middleware/auth');

const contractTemplateService = new ContractTemplateService();

/**
 * GET /api/contract-templates
 * Get all active contract templates with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Getting contract templates with filters:', req.query);
    
    const filters = {
      category: req.query.category,
      contractType: req.query.contractType,
      search: req.query.search
    };

    const templates = await contractTemplateService.getAllTemplates(filters);
    
    res.json({
      success: true,
      data: templates,
      count: templates.length
    });
  } catch (error) {
    console.error('❌ Error getting contract templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get contract templates',
      details: error.message
    });
  }
});

/**
 * GET /api/contract-templates/categories
 * Get all available template categories
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = ['RESEARCH', 'COMMERCIAL', 'ENTERPRISE', 'CUSTOM'];
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('❌ Error getting template categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get template categories'
    });
  }
});

/**
 * GET /api/contract-templates/contract-types
 * Get all available contract types
 */
router.get('/contract-types', async (req, res) => {
  try {
    const contractTypes = ['AI_TRAINING', 'BASIC', 'CUSTOM'];
    
    res.json({
      success: true,
      data: contractTypes
    });
  } catch (error) {
    console.error('❌ Error getting contract types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get contract types'
    });
  }
});

/**
 * GET /api/contract-templates/category/:category
 * Get templates by specific category
 */
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    console.log(`🔍 Getting templates for category: ${category}`);
    
    const templates = await contractTemplateService.getTemplatesByCategory(category);
    
    res.json({
      success: true,
      data: templates,
      count: templates.length,
      category
    });
  } catch (error) {
    console.error('❌ Error getting templates by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get templates by category',
      details: error.message
    });
  }
});

/**
 * GET /api/contract-templates/contract-type/:contractType
 * Get templates by specific contract type
 */
router.get('/contract-type/:contractType', async (req, res) => {
  try {
    const { contractType } = req.params;
    console.log(`🔍 Getting templates for contract type: ${contractType}`);
    
    const templates = await contractTemplateService.getTemplatesByContractType(contractType);
    
    res.json({
      success: true,
      data: templates,
      count: templates.length,
      contractType
    });
  } catch (error) {
    console.error('❌ Error getting templates by contract type:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get templates by contract type',
      details: error.message
    });
  }
});

/**
 * GET /api/contract-templates/search
 * Search templates by text and filters
 */
router.get('/search', async (req, res) => {
  try {
    const { q: searchTerm, category, contractType } = req.query;
    
    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        error: 'Search term is required'
      });
    }
    
    console.log(`🔍 Searching templates for: "${searchTerm}"`);
    
    const filters = { category, contractType };
    const templates = await contractTemplateService.searchTemplates(searchTerm, filters);
    
    res.json({
      success: true,
      data: templates,
      count: templates.length,
      searchTerm,
      filters
    });
  } catch (error) {
    console.error('❌ Error searching templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search templates',
      details: error.message
    });
  }
});

/**
 * GET /api/contract-templates/:templateId
 * Get specific template by ID
 */
router.get('/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    console.log(`🔍 Getting template: ${templateId}`);
    
    const template = await contractTemplateService.getTemplateById(templateId);
    
    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('❌ Error getting template:', error);
    
    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to get template',
        details: error.message
      });
    }
  }
});

/**
 * POST /api/contract-templates/recommendations
 * Get template recommendations based on dataset and preferences
 */
router.post('/recommendations', async (req, res) => {
  try {
    const { dataset, userPreferences } = req.body;
    
    if (!dataset) {
      return res.status(400).json({
        success: false,
        error: 'Dataset information is required'
      });
    }
    
    console.log('🔍 Getting template recommendations for dataset:', dataset.id);
    
    const recommendations = await contractTemplateService.getTemplateRecommendations(
      dataset, 
      userPreferences
    );
    
    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length
    });
  } catch (error) {
    console.error('❌ Error getting template recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get template recommendations',
      details: error.message
    });
  }
});

/**
 * POST /api/contract-templates/:templateId/validate
 * Validate template compatibility with dataset
 */
router.post('/:templateId/validate', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { dataset } = req.body;
    
    if (!dataset) {
      return res.status(400).json({
        success: false,
        error: 'Dataset information is required'
      });
    }
    
    console.log(`🔍 Validating template ${templateId} with dataset ${dataset.id}`);
    
    const compatibility = await contractTemplateService.validateTemplateCompatibility(
      templateId, 
      dataset
    );
    
    res.json({
      success: true,
      data: compatibility
    });
  } catch (error) {
    console.error('❌ Error validating template compatibility:', error);
    
    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to validate template compatibility',
        details: error.message
      });
    }
  }
});

/**
 * POST /api/contract-templates/:templateId/generate-contract
 * Generate contract data from template
 */
router.post('/:templateId/generate-contract', async (req, res) => {
  try {
    const { templateId } = req.params;
    const contractData = req.body;
    
    console.log(`🔍 Generating contract from template: ${templateId}`);
    
    const generatedContract = await contractTemplateService.generateContractFromTemplate(
      templateId, 
      contractData
    );
    
    res.json({
      success: true,
      data: generatedContract,
      templateId
    });
  } catch (error) {
    console.error('❌ Error generating contract from template:', error);
    
    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to generate contract from template',
        details: error.message
      });
    }
  }
});

// Admin-only routes (require authentication)
router.use(authenticateToken);

/**
 * POST /api/contract-templates
 * Create new contract template (Admin only)
 */
router.post('/', async (req, res) => {
  try {
    // Check if user has admin privileges
    if (req.user.localUser.partyType !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can create contract templates'
      });
    }
    
    const templateData = req.body;
    const userId = req.user.localUser.id;
    
    console.log('🔍 Creating new contract template:', templateData.name);
    
    const template = await contractTemplateService.createTemplate(templateData, userId);
    
    res.status(201).json({
      success: true,
      data: template,
      message: 'Contract template created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating contract template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create contract template',
      details: error.message
    });
  }
});

/**
 * PUT /api/contract-templates/:templateId
 * Update existing contract template (Admin only)
 */
router.put('/:templateId', async (req, res) => {
  try {
    // Check if user has admin privileges
    if (req.user.localUser.partyType !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can update contract templates'
      });
    }
    
    const { templateId } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Updating contract template: ${templateId}`);
    
    const template = await contractTemplateService.updateTemplate(templateId, updateData);
    
    res.json({
      success: true,
      data: template,
      message: 'Contract template updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating contract template:', error);
    
    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to update contract template',
        details: error.message
      });
    }
  }
});

/**
 * DELETE /api/contract-templates/:templateId
 * Delete contract template (Admin only - soft delete)
 */
router.delete('/:templateId', async (req, res) => {
  try {
    // Check if user has admin privileges
    if (req.user.localUser.partyType !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can delete contract templates'
      });
    }
    
    const { templateId } = req.params;
    
    console.log(`🔍 Deleting contract template: ${templateId}`);
    
    const template = await contractTemplateService.deleteTemplate(templateId);
    
    res.json({
      success: true,
      data: template,
      message: 'Contract template deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting contract template:', error);
    
    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to delete contract template',
        details: error.message
      });
    }
  }
});

/**
 * POST /api/contract-templates/seed
 * Seed default templates (Admin only)
 */
router.post('/seed', async (req, res) => {
  try {
    // Check if user has admin privileges
    if (req.user.localUser.partyType !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can seed default templates'
      });
    }
    
    console.log('🌱 Seeding default contract templates...');
    
    await contractTemplateService.seedDefaultTemplates();
    
    res.json({
      success: true,
      message: 'Default contract templates seeded successfully'
    });
  } catch (error) {
    console.error('❌ Error seeding default templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to seed default templates',
      details: error.message
    });
  }
});

module.exports = router; 