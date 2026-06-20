/**
 * Constraints Service
 * 
 * This service handles fetching constraint data from the database
 * and provides a unified interface for constraint management.
 */

import { apiService } from './api';

class ConstraintsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get constraints for a specific category
   * @param {string} categoryKey - The category key (e.g., 'datasets', 'contracts')
   * @param {boolean} useCache - Whether to use cached data
   * @returns {Promise<Object>} Constraint data for the category
   */
  async getConstraints(categoryKey, useCache = true) {
    const cacheKey = `constraints_${categoryKey}`;
    
    // Check cache first
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const response = await apiService.get(`/api/constraints/public/${categoryKey}`);
      const data = response.data;

      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error(`Error fetching constraints for ${categoryKey}:`, error);
      throw error;
    }
  }

  /**
   * Get all constraint categories
   * @returns {Promise<Array>} List of constraint categories
   */
  async getCategories() {
    try {
      const response = await apiService.get('/api/admin/constraints/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching constraint categories:', error);
      throw error;
    }
  }

  /**
   * Get constraint fields for a category
   * @param {number} categoryId - The category ID
   * @returns {Promise<Array>} List of constraint fields
   */
  async getFields(categoryId) {
    try {
      const response = await apiService.get(`/api/admin/constraints/categories/${categoryId}/fields`);
      return response.data;
    } catch (error) {
      console.error('Error fetching constraint fields:', error);
      throw error;
    }
  }

  /**
   * Get constraint values for a field
   * @param {number} fieldId - The field ID
   * @returns {Promise<Array>} List of constraint values
   */
  async getValues(fieldId) {
    try {
      const response = await apiService.get(`/api/admin/constraints/fields/${fieldId}/values`);
      return response.data;
    } catch (error) {
      console.error('Error fetching constraint values:', error);
      throw error;
    }
  }

  /**
   * Create a new constraint category
   * @param {Object} categoryData - Category data
   * @returns {Promise<Object>} Created category
   */
  async createCategory(categoryData) {
    try {
      const response = await apiService.post('/api/admin/constraints/categories', categoryData);
      this.clearCache();
      return response.data;
    } catch (error) {
      console.error('Error creating constraint category:', error);
      throw error;
    }
  }

  /**
   * Update a constraint category
   * @param {number} categoryId - Category ID
   * @param {Object} categoryData - Updated category data
   * @returns {Promise<Object>} Updated category
   */
  async updateCategory(categoryId, categoryData) {
    try {
      const response = await apiService.put(`/api/admin/constraints/categories/${categoryId}`, categoryData);
      this.clearCache();
      return response.data;
    } catch (error) {
      console.error('Error updating constraint category:', error);
      throw error;
    }
  }

  /**
   * Delete a constraint category
   * @param {number} categoryId - Category ID
   * @returns {Promise<void>}
   */
  async deleteCategory(categoryId) {
    try {
      await apiService.delete(`/api/admin/constraints/categories/${categoryId}`);
      this.clearCache();
    } catch (error) {
      console.error('Error deleting constraint category:', error);
      throw error;
    }
  }

  /**
   * Create a new constraint field
   * @param {Object} fieldData - Field data
   * @returns {Promise<Object>} Created field
   */
  async createField(fieldData) {
    try {
      const response = await apiService.post('/api/admin/constraints/fields', fieldData);
      this.clearCache();
      return response.data;
    } catch (error) {
      console.error('Error creating constraint field:', error);
      throw error;
    }
  }

  /**
   * Update a constraint field
   * @param {number} fieldId - Field ID
   * @param {Object} fieldData - Updated field data
   * @returns {Promise<Object>} Updated field
   */
  async updateField(fieldId, fieldData) {
    try {
      const response = await apiService.put(`/api/admin/constraints/fields/${fieldId}`, fieldData);
      this.clearCache();
      return response.data;
    } catch (error) {
      console.error('Error updating constraint field:', error);
      throw error;
    }
  }

  /**
   * Delete a constraint field
   * @param {number} fieldId - Field ID
   * @returns {Promise<void>}
   */
  async deleteField(fieldId) {
    try {
      await apiService.delete(`/api/admin/constraints/fields/${fieldId}`);
      this.clearCache();
    } catch (error) {
      console.error('Error deleting constraint field:', error);
      throw error;
    }
  }

  /**
   * Create a new constraint value
   * @param {Object} valueData - Value data
   * @returns {Promise<Object>} Created value
   */
  async createValue(valueData) {
    try {
      const response = await apiService.post('/api/admin/constraints/values', valueData);
      this.clearCache();
      return response.data;
    } catch (error) {
      console.error('Error creating constraint value:', error);
      throw error;
    }
  }

  /**
   * Update a constraint value
   * @param {number} valueId - Value ID
   * @param {Object} valueData - Updated value data
   * @returns {Promise<Object>} Updated value
   */
  async updateValue(valueId, valueData) {
    try {
      const response = await apiService.put(`/api/admin/constraints/values/${valueId}`, valueData);
      this.clearCache();
      return response.data;
    } catch (error) {
      console.error('Error updating constraint value:', error);
      throw error;
    }
  }

  /**
   * Delete a constraint value
   * @param {number} valueId - Value ID
   * @returns {Promise<void>}
   */
  async deleteValue(valueId) {
    try {
      await apiService.delete(`/api/admin/constraints/values/${valueId}`);
      this.clearCache();
    } catch (error) {
      console.error('Error deleting constraint value:', error);
      throw error;
    }
  }

  /**
   * Reorder constraint values
   * @param {number} fieldId - Field ID
   * @param {Array} valueOrders - Array of {id, displayOrder} objects
   * @returns {Promise<void>}
   */
  async reorderValues(fieldId, valueOrders) {
    try {
      await apiService.put('/api/admin/constraints/values/reorder', {
        fieldId,
        valueOrders
      });
      this.clearCache();
    } catch (error) {
      console.error('Error reordering constraint values:', error);
      throw error;
    }
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get constraints in the format expected by existing components
   * @param {string} categoryKey - The category key
   * @returns {Promise<Object>} Formatted constraint data
   */
  async getFormattedConstraints(categoryKey) {
    const data = await this.getConstraints(categoryKey);
    
    // Transform the data to match the expected format
    const formatted = {};
    
    if (data && data.fields) {
      data.fields.forEach(field => {
        if (field.values) {
          formatted[field.fieldKey.toUpperCase()] = field.values.map(value => ({
            value: value.valueKey,
            label: value.label,
            description: value.description,
            icon: value.icon,
            color: value.color,
            recommended: value.isRecommended,
            ...value.metadata
          }));
        }
      });
    }
    
    return formatted;
  }

  /**
   * Get VM sizes filtered by cloud provider
   * @param {string} cloudProvider - Cloud provider (AZURE, AWS, GCP, OCI)
   * @returns {Promise<Array>} Filtered VM sizes
   */
  async getVMSizesByProvider(cloudProvider) {
    try {
      const data = await this.getConstraints('tsp');
      const vmSizeField = data.fields?.find(field => field.fieldKey === 'vm_size');
      
      if (!vmSizeField || !vmSizeField.values) {
        return [];
      }
      
      return vmSizeField.values.filter(value => 
        value.metadata?.cloudProvider === cloudProvider
      );
    } catch (error) {
      console.error('Error fetching VM sizes by provider:', error);
      return [];
    }
  }

  /**
   * Get recommended values for a field
   * @param {string} categoryKey - Category key
   * @param {string} fieldKey - Field key
   * @returns {Promise<Array>} Recommended values
   */
  async getRecommendedValues(categoryKey, fieldKey) {
    try {
      const data = await this.getConstraints(categoryKey);
      const field = data.fields?.find(f => f.fieldKey === fieldKey);
      
      if (!field || !field.values) {
        return [];
      }
      
      return field.values.filter(value => value.isRecommended);
    } catch (error) {
      console.error('Error fetching recommended values:', error);
      return [];
    }
  }
}

// Export singleton instance
export const constraintsService = new ConstraintsService();
export default constraintsService;
