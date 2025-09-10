/**
 * Centralized Constraints Configuration
 * 
 * This file exports all constraint configurations for the Contract Management System
 * including datasets, contracts, CCRP, and TDC attributes.
 */

// Dataset constraints
export * from './datasetConstraints';

// Contract constraints
export * from './contractConstraints';

// CCRP constraints
export * from './ccrpConstraints';

// TDC constraints
export * from './tdcConstraints';

// Common constraint utilities
export const CONSTRAINT_UTILS = {
  // Get all available constraint categories
  getConstraintCategories: () => [
    'datasets',
    'contracts', 
    'ccrp',
    'tdc'
  ],
  
  // Get constraint info by category and field
  getConstraintInfo: (category, field) => {
    const constraints = {
      datasets: () => import('./datasetConstraints'),
      contracts: () => import('./contractConstraints'),
      ccrp: () => import('./ccrpConstraints'),
      tdc: () => import('./tdcConstraints')
    };
    
    return constraints[category]?.() || null;
  },
  
  // Validate value against constraint
  validateValue: (category, field, value) => {
    // Implementation would validate value against specific constraints
    return { valid: true, message: '' };
  },
  
  // Get recommended values based on context
  getRecommendedValues: (category, field, context = {}) => {
    // Implementation would return recommended values based on context
    return [];
  }
};

// Export default constraint configuration
export default {
  datasets: () => import('./datasetConstraints'),
  contracts: () => import('./contractConstraints'),
  ccrp: () => import('./ccrpConstraints'),
  tdc: () => import('./tdcConstraints')
};
