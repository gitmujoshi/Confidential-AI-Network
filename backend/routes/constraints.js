/**
 * Constraints Management API Routes
 * 
 * This file handles all API endpoints for managing constraint categories,
 * fields, and values through the admin interface.
 */

const express = require('express');
const router = express.Router();
const { ConstraintCategory, ConstraintField, ConstraintValue } = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Get all constraint categories
router.get('/categories', authenticateToken, requireRole(['AppAdmin']), async (req, res) => {
  try {
    const categories = await ConstraintCategory.findAll({
      order: [['displayOrder', 'ASC'], ['name', 'ASC']],
      include: [{
        model: ConstraintField,
        as: 'fields',
        include: [{
          model: ConstraintValue,
          as: 'values',
          order: [['displayOrder', 'ASC'], ['label', 'ASC']]
        }]
      }]
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching constraint categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch constraint categories',
      error: error.message
    });
  }
});

// Get dataset categories (public endpoint for all users)
router.get('/datasets/categories', async (req, res) => {
  try {
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

    if (!category || !category.fields || category.fields.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dataset categories not found'
      });
    }

    const categories = category.fields[0].values.map(value => ({
      value: value.valueKey,
      label: value.label,
      description: value.description,
      icon: value.icon,
      metadata: value.metadata
    }));

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching dataset categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dataset categories',
      error: error.message
    });
  }
});

// Get constraint category by key
router.get('/categories/:categoryKey', authenticateToken, requireRole(['AppAdmin']), async (req, res) => {
  try {
    const { categoryKey } = req.params;
    
    const category = await ConstraintCategory.findOne({
      where: { categoryKey },
      include: [{
        model: ConstraintField,
        as: 'fields',
        include: [{
          model: ConstraintValue,
          as: 'values',
          order: [['displayOrder', 'ASC'], ['label', 'ASC']]
        }]
      }]
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Constraint category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching constraint category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch constraint category',
      error: error.message
    });
  }
});

// Create new constraint category
router.post('/categories', authenticateToken, requireRole(['AppAdmin']), async (req, res) => {
  try {
    const categoryData = req.body;
    
    const category = await ConstraintCategory.create(categoryData);

    res.status(201).json({
      success: true,
      data: category,
      message: 'Constraint category created successfully'
    });
  } catch (error) {
    console.error('Error creating constraint category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create constraint category',
      error: error.message
    });
  }
});

// Update constraint category
router.put('/categories/:id', authenticateToken, requireRole(['AppAdmin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const category = await ConstraintCategory.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Constraint category not found'
      });
    }

    await category.update(updateData);

    res.json({
      success: true,
      data: category,
      message: 'Constraint category updated successfully'
    });
  } catch (error) {
    console.error('Error updating constraint category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update constraint category',
      error: error.message
    });
  }
});

// Delete constraint category
router.delete('/categories/:id', authenticateToken, requireRole(['AppAdmin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await ConstraintCategory.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Constraint category not found'
      });
    }

    // Check if category has fields
    const fieldCount = await ConstraintField.count({ where: { categoryId: id } });
    if (fieldCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing fields. Please delete all fields first.'
      });
    }

    await category.destroy();

    res.json({
      success: true,
      message: 'Constraint category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting constraint category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete constraint category',
      error: error.message
    });
  }
});

// Get constraint fields for a category
router.get('/categories/:categoryId/fields', authenticateToken, requireRole(['AppAdmin']), async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    const fields = await ConstraintField.findAll({
      where: { categoryId },
      order: [['displayOrder', 'ASC'], ['name', 'ASC']],
      include: [{
        model: ConstraintValue,
        as: 'values',
        order: [['displayOrder', 'ASC'], ['label', 'ASC']]
      }]
    });

    res.json({
      success: true,
      data: fields
    });
  } catch (error) {
    console.error('Error fetching constraint fields:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch constraint fields',
      error: error.message
    });
  }
});

// Create new constraint field
router.post('/fields', authenticateToken, requireRole(['AppAdmin']), async (req, res) => {
  try {
    const fieldData = req.body;
    
    const field = await ConstraintField.create(fieldData);

    res.status(201).json({
      success: true,
      data: field,
      message: 'Constraint field created successfully'
    });
  } catch (error) {
    console.error('Error creating constraint field:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create constraint field',
      error: error.message
    });
  }
});

// Update constraint field
router.put('/fields/:id', authenticateToken, requireRole(['AppAdmin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const field = await ConstraintField.findByPk(id);
    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Constraint field not found'
      });
    }

    await field.update(updateData);

    res.json({
      success: true,
      data: field,
      message: 'Constraint field updated successfully'
    });
  } catch (error) {
    console.error('Error updating constraint field:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update constraint field',
      error: error.message
    });
  }
});

// Delete constraint field
router.delete('/fields/:id', authenticateToken, requireRole(['AppAdmin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const field = await ConstraintField.findByPk(id);
    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Constraint field not found'
      });
    }

    // Check if field has values
    const valueCount = await ConstraintValue.count({ where: { fieldId: id } });
    if (valueCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete field with existing values. Please delete all values first.'
      });
    }

    await field.destroy();

    res.json({
      success: true,
      message: 'Constraint field deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting constraint field:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete constraint field',
      error: error.message
    });
  }
});

// Get constraint values for a field
router.get('/fields/:fieldId/values', authenticateToken, requireRole(['AppAdmin']), async (req, res) => {
  try {
    const { fieldId } = req.params;
    
    const values = await ConstraintValue.findAll({
      where: { fieldId },
      order: [['displayOrder', 'ASC'], ['label', 'ASC']]
    });

    res.json({
      success: true,
      data: values
    });
  } catch (error) {
    console.error('Error fetching constraint values:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch constraint values',
      error: error.message
    });
  }
});

// Create new constraint value
router.post('/values', authenticateToken, requireRole(['AppAdmin']), async (req, res) => {
  try {
    const valueData = req.body;
    
    const value = await ConstraintValue.create(valueData);

    res.status(201).json({
      success: true,
      data: value,
      message: 'Constraint value created successfully'
    });
  } catch (error) {
    console.error('Error creating constraint value:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create constraint value',
      error: error.message
    });
  }
});

// Update constraint value
router.put('/values/:id', authenticateToken, requireRole(['AppAdmin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const value = await ConstraintValue.findByPk(id);
    if (!value) {
      return res.status(404).json({
        success: false,
        message: 'Constraint value not found'
      });
    }

    await value.update(updateData);

    res.json({
      success: true,
      data: value,
      message: 'Constraint value updated successfully'
    });
  } catch (error) {
    console.error('Error updating constraint value:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update constraint value',
      error: error.message
    });
  }
});

// Delete constraint value
router.delete('/values/:id', authenticateToken, requireRole(['AppAdmin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const value = await ConstraintValue.findByPk(id);
    if (!value) {
      return res.status(404).json({
        success: false,
        message: 'Constraint value not found'
      });
    }

    await value.destroy();

    res.json({
      success: true,
      message: 'Constraint value deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting constraint value:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete constraint value',
      error: error.message
    });
  }
});

// Get constraints for frontend consumption (public endpoint)
router.get('/public/:categoryKey', async (req, res) => {
  try {
    const { categoryKey } = req.params;
    
    const category = await ConstraintCategory.findOne({
      where: { 
        categoryKey,
        isActive: true 
      },
      include: [{
        model: ConstraintField,
        as: 'fields',
        where: { isActive: true },
        include: [{
          model: ConstraintValue,
          as: 'values',
          where: { isActive: true },
          order: [['displayOrder', 'ASC'], ['label', 'ASC']]
        }]
      }]
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Constraint category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching public constraints:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch constraints',
      error: error.message
    });
  }
});

// Bulk update constraint values order
router.put('/values/reorder', authenticateToken, requireRole(['AppAdmin']), async (req, res) => {
  try {
    const { fieldId, valueOrders } = req.body; // valueOrders: [{ id, displayOrder }]
    
    const updatePromises = valueOrders.map(({ id, displayOrder }) =>
      ConstraintValue.update({ displayOrder }, { where: { id, fieldId } })
    );
    
    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Constraint values reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering constraint values:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder constraint values',
      error: error.message
    });
  }
});

module.exports = router;
