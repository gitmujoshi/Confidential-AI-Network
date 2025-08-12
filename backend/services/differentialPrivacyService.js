/**
 * Differential Privacy Service
 * Implements differential privacy mechanisms for ContractFlow Pro
 */

const crypto = require('crypto');
const { promisify } = require('util');

class DifferentialPrivacyService {
  constructor() {
    this.mechanisms = {
      'laplace': new LaplaceMechanism(),
      'gaussian': new GaussianMechanism(),
      'exponential': new ExponentialMechanism(),
      'geometric': new GeometricMechanism()
    };
    
    this.privacyBudgetTracker = new PrivacyBudgetTracker();
    this.sensitivityAnalyzer = new SensitivityAnalyzer();
  }

  /**
   * Main entry point for applying differential privacy
   */
  async applyDifferentialPrivacy(data, query, privacyParams) {
    try {
      console.log(`🔐 Applying differential privacy with ${privacyParams.mechanism} mechanism`);
      
      // Validate privacy parameters
      this.validatePrivacyParams(privacyParams);
      
      // Check privacy budget
      await this.privacyBudgetTracker.checkBudget(
        privacyParams.contractId,
        privacyParams.epsilon,
        privacyParams.delta
      );
      
      // Analyze data sensitivity
      const sensitivity = await this.sensitivityAnalyzer.calculateSensitivity(
        data, query.type, query.parameters
      );
      
      console.log(`📊 Calculated sensitivity: ${sensitivity}`);
      
      // Select appropriate mechanism
      const mechanism = this.selectMechanism(privacyParams.mechanism, query.type);
      
      // Apply differential privacy
      const result = await mechanism.addNoise(data, privacyParams, sensitivity);
      
      // Track privacy budget consumption
      await this.privacyBudgetTracker.consumeBudget(
        privacyParams.contractId,
        privacyParams.epsilon,
        privacyParams.delta
      );
      
      // Log privacy operation
      await this.logPrivacyOperation(privacyParams, sensitivity, result, query);
      
      console.log(`✅ Differential privacy applied successfully`);
      
      return {
        success: true,
        result: result.output,
        privacyMetrics: {
          epsilon: privacyParams.epsilon,
          delta: privacyParams.delta,
          mechanism: privacyParams.mechanism,
          sensitivity: sensitivity,
          noiseAdded: result.noiseMetrics,
          privacyBudget: await this.privacyBudgetTracker.getRemainingBudget(
            privacyParams.contractId
          )
        },
        metadata: {
          timestamp: new Date().toISOString(),
          queryType: query.type,
          dataSize: Array.isArray(data) ? data.length : 1
        }
      };
      
    } catch (error) {
      console.error('❌ Differential privacy application failed:', error);
      throw new Error(`DP Error: ${error.message}`);
    }
  }

  /**
   * Validate privacy parameters
   */
  validatePrivacyParams(params) {
    if (!params.epsilon || params.epsilon <= 0) {
      throw new Error('Epsilon must be positive');
    }
    if (!params.delta || params.delta <= 0 || params.delta >= 1) {
      throw new Error('Delta must be between 0 and 1');
    }
    if (!params.mechanism || !this.mechanisms[params.mechanism]) {
      throw new Error(`Invalid mechanism: ${params.mechanism}`);
    }
    if (!params.contractId) {
      throw new Error('Contract ID is required for budget tracking');
    }
  }

  /**
   * Select appropriate DP mechanism based on query type
   */
  selectMechanism(mechanism, queryType) {
    // Override mechanism selection for specific query types
    switch (queryType) {
      case 'COUNT':
        return this.mechanisms.geometric; // Better for integer counts
      case 'AVERAGE':
        return this.mechanisms.gaussian; // Better for continuous averages
      case 'GRADIENT':
        return this.mechanisms.laplace; // Better for gradient noise
      default:
        return this.mechanisms[mechanism];
    }
  }

  /**
   * Log privacy operation for auditing
   */
  async logPrivacyOperation(privacyParams, sensitivity, result, query) {
    try {
      const db = require('../models');
      
      await db.PrivacyOperationsLog.create({
        contractId: privacyParams.contractId,
        operationType: 'DP_QUERY',
        epsilon: privacyParams.epsilon,
        delta: privacyParams.delta,
        mechanism: privacyParams.mechanism,
        sensitivity: sensitivity,
        dataSize: Array.isArray(result.output) ? result.output.length : 1,
        queryType: query.type,
        timestamp: new Date(),
        result: {
          noiseMetrics: result.noiseMetrics,
          mechanism: result.mechanism,
          scale: result.scale
        }
      });
    } catch (error) {
      console.warn('⚠️ Failed to log privacy operation:', error.message);
    }
  }

  /**
   * Get privacy budget for a contract
   */
  async getPrivacyBudget(contractId) {
    return await this.privacyBudgetTracker.getCurrentBudget(contractId);
  }

  /**
   * Get privacy operation history
   */
  async getPrivacyHistory(contractId, limit = 50, offset = 0) {
    try {
      const db = require('../models');
      
      const operations = await db.PrivacyOperationsLog.findAndCountAll({
        where: { contractId },
        order: [['timestamp', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      return operations;
    } catch (error) {
      console.error('Failed to get privacy history:', error);
      throw error;
    }
  }
}

/**
 * Laplace Mechanism Implementation
 */
class LaplaceMechanism {
  /**
   * Add Laplace noise to data
   */
  async addNoise(data, privacyParams, sensitivity) {
    const { epsilon, delta } = privacyParams;
    const scale = sensitivity / epsilon;
    
    let output, noiseMetrics;
    
    if (Array.isArray(data)) {
      // Handle array data (e.g., gradients, feature vectors)
      output = await this.addNoiseToArray(data, scale);
      noiseMetrics = this.calculateNoiseMetrics(output, data);
    } else if (typeof data === 'number') {
      // Handle scalar data (e.g., counts, averages)
      const noise = this.sampleLaplace(0, scale);
      output = data + noise;
      noiseMetrics = {
        originalValue: data,
        noiseValue: noise,
        noiseMagnitude: Math.abs(noise),
        relativeNoise: Math.abs(noise / data)
      };
    } else if (typeof data === 'object') {
      // Handle object data (e.g., model parameters)
      output = await this.addNoiseToObject(data, scale);
      noiseMetrics = this.calculateNoiseMetrics(output, data);
    } else {
      throw new Error(`Unsupported data type: ${typeof data}`);
    }
    
    return {
      output,
      noiseMetrics,
      mechanism: 'laplace',
      scale
    };
  }

  /**
   * Sample from Laplace distribution
   */
  sampleLaplace(mean, scale) {
    // Use Box-Muller transform for better numerical stability
    const u1 = Math.random();
    const u2 = Math.random();
    
    // Generate standard normal random variable
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    
    // Transform to Laplace distribution
    const laplace = mean + scale * z0 * Math.sign(Math.random() - 0.5);
    
    return laplace;
  }

  /**
   * Add noise to array data
   */
  async addNoiseToArray(data, scale) {
    return data.map(value => {
      const noise = this.sampleLaplace(0, scale);
      return value + noise;
    });
  }

  /**
   * Add noise to object data (e.g., model parameters)
   */
  async addNoiseToObject(data, scale) {
    const output = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'number') {
        const noise = this.sampleLaplace(0, scale);
        output[key] = value + noise;
      } else if (Array.isArray(value)) {
        output[key] = await this.addNoiseToArray(value, scale);
      } else {
        output[key] = value; // Preserve non-numeric values
      }
    }
    
    return output;
  }

  /**
   * Calculate noise metrics for comparison
   */
  calculateNoiseMetrics(output, original) {
    if (Array.isArray(output) && Array.isArray(original)) {
      const noiseValues = output.map((out, i) => out - original[i]);
      const noiseMagnitudes = noiseValues.map(n => Math.abs(n));
      
      return {
        totalNoise: noiseValues.reduce((sum, n) => sum + n, 0),
        averageNoise: noiseValues.reduce((sum, n) => sum + n, 0) / noiseValues.length,
        maxNoise: Math.max(...noiseMagnitudes),
        minNoise: Math.min(...noiseMagnitudes),
        noiseVariance: this.calculateVariance(noiseValues)
      };
    }
    
    return {
      noiseValue: output - original,
      noiseMagnitude: Math.abs(output - original)
    };
  }

  calculateVariance(values) {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  }
}

/**
 * Gaussian Mechanism Implementation
 */
class GaussianMechanism {
  /**
   * Add Gaussian noise to data
   */
  async addNoise(data, privacyParams, sensitivity) {
    const { epsilon, delta } = privacyParams;
    
    // Calculate noise scale for Gaussian mechanism
    const scale = this.calculateGaussianScale(epsilon, delta, sensitivity);
    
    let output, noiseMetrics;
    
    if (Array.isArray(data)) {
      output = await this.addNoiseToArray(data, scale);
      noiseMetrics = this.calculateNoiseMetrics(output, data);
    } else if (typeof data === 'number') {
      const noise = this.sampleGaussian(0, scale);
      output = data + noise;
      noiseMetrics = {
        originalValue: data,
        noiseValue: noise,
        noiseMagnitude: Math.abs(noise)
      };
    } else {
      throw new Error(`Unsupported data type for Gaussian mechanism: ${typeof data}`);
    }
    
    return {
      output,
      noiseMetrics,
      mechanism: 'gaussian',
      scale
    };
  }

  /**
   * Calculate noise scale for Gaussian mechanism
   */
  calculateGaussianScale(epsilon, delta, sensitivity) {
    // For Gaussian mechanism: σ = sensitivity * sqrt(2 * log(1.25/delta)) / epsilon
    const scale = sensitivity * Math.sqrt(2 * Math.log(1.25 / delta)) / epsilon;
    return scale;
  }

  /**
   * Sample from Gaussian distribution
   */
  sampleGaussian(mean, scale) {
    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + scale * z0;
  }

  /**
   * Add noise to array data
   */
  async addNoiseToArray(data, scale) {
    return data.map(value => {
      const noise = this.sampleGaussian(0, scale);
      return value + noise;
    });
  }

  calculateNoiseMetrics(output, original) {
    if (Array.isArray(output) && Array.isArray(original)) {
      const noiseValues = output.map((out, i) => out - original[i]);
      const noiseMagnitudes = noiseValues.map(n => Math.abs(n));
      
      return {
        totalNoise: noiseValues.reduce((sum, n) => sum + n, 0),
        averageNoise: noiseValues.reduce((sum, n) => sum + n, 0) / noiseValues.length,
        maxNoise: Math.max(...noiseMagnitudes),
        minNoise: Math.min(...noiseMagnitudes)
      };
    }
    
    return {
      noiseValue: output - original,
      noiseMagnitude: Math.abs(output - original)
    };
  }
}

/**
 * Exponential Mechanism Implementation
 */
class ExponentialMechanism {
  async addNoise(data, privacyParams, sensitivity) {
    // Exponential mechanism is used for selecting from discrete options
    // Implementation depends on the specific use case
    throw new Error('Exponential mechanism not yet implemented');
  }
}

/**
 * Geometric Mechanism Implementation
 */
class GeometricMechanism {
  async addNoise(data, privacyParams, sensitivity) {
    // Geometric mechanism is used for integer-valued queries
    // Implementation depends on the specific use case
    throw new Error('Geometric mechanism not yet implemented');
  }
}

/**
 * Privacy Budget Tracker
 */
class PrivacyBudgetTracker {
  constructor() {
    this.db = null;
  }

  async getDB() {
    if (!this.db) {
      this.db = require('../models');
    }
    return this.db;
  }

  /**
   * Check if privacy budget allows the operation
   */
  async checkBudget(contractId, requestedEpsilon, requestedDelta) {
    const db = await this.getDB();
    const currentBudget = await this.getCurrentBudget(contractId);
    
    if (!currentBudget) {
      // Initialize budget for new contract
      await this.initializeBudget(contractId);
      return true;
    }
    
    if (currentBudget.remainingEpsilon < requestedEpsilon) {
      throw new Error(`Privacy budget exceeded: requested ${requestedEpsilon}, available ${currentBudget.remainingEpsilon}`);
    }
    
    if (currentBudget.remainingDelta < requestedDelta) {
      throw new Error(`Privacy budget exceeded: requested ${requestedDelta}, available ${currentBudget.remainingDelta}`);
    }
    
    return true;
  }

  /**
   * Consume privacy budget
   */
  async consumeBudget(contractId, epsilon, delta) {
    const db = await this.getDB();
    const budget = await this.getCurrentBudget(contractId);
    
    if (!budget) {
      throw new Error(`No budget found for contract: ${contractId}`);
    }
    
    // Update remaining budget
    await db.PrivacyBudget.update({
      remainingEpsilon: budget.remainingEpsilon - epsilon,
      remainingDelta: budget.remainingDelta - delta,
      totalEpsilonConsumed: budget.totalEpsilonConsumed + epsilon,
      totalDeltaConsumed: budget.totalDeltaConsumed + delta,
      lastUpdated: new Date()
    }, {
      where: { contractId }
    });
    
    // Log budget consumption
    await this.logBudgetConsumption(contractId, epsilon, delta);
  }

  /**
   * Get current privacy budget
   */
  async getCurrentBudget(contractId) {
    const db = await this.getDB();
    return await db.PrivacyBudget.findOne({
      where: { contractId }
    });
  }

  /**
   * Initialize privacy budget for new contract
   */
  async initializeBudget(contractId) {
    const db = await this.getDB();
    const contract = await db.Contract.findOne({
      where: { contractId }
    });
    
    if (!contract) {
      throw new Error(`Contract not found: ${contractId}`);
    }
    
    // Get privacy requirements from contract
    const privacyReqs = contract.privacyRequirements?.differentialPrivacy || {};
    
    const budget = await db.PrivacyBudget.create({
      contractId,
      initialEpsilon: privacyReqs.epsilon || 1.0,
      initialDelta: privacyReqs.delta || 1e-5,
      remainingEpsilon: privacyReqs.epsilon || 1.0,
      remainingDelta: privacyReqs.delta || 1e-5,
      totalEpsilonConsumed: 0,
      totalDeltaConsumed: 0,
      createdAt: new Date(),
      lastUpdated: new Date()
    });
    
    return budget;
  }

  /**
   * Log budget consumption for auditing
   */
  async logBudgetConsumption(contractId, epsilon, delta) {
    const db = await this.getDB();
    await db.PrivacyBudgetLog.create({
      contractId,
      epsilonConsumed: epsilon,
      deltaConsumed: delta,
      timestamp: new Date(),
      operation: 'DP_QUERY'
    });
  }
}

/**
 * Sensitivity Analyzer
 */
class SensitivityAnalyzer {
  /**
   * Calculate sensitivity for different query types
   */
  async calculateSensitivity(data, queryType, queryParams = {}) {
    switch (queryType) {
      case 'COUNT':
        return this.calculateCountSensitivity(data);
        
      case 'SUM':
        return this.calculateSumSensitivity(data, queryParams);
        
      case 'AVERAGE':
        return this.calculateAverageSensitivity(data, queryParams);
        
      case 'GRADIENT':
        return this.calculateGradientSensitivity(data, queryParams);
        
      case 'HISTOGRAM':
        return this.calculateHistogramSensitivity(data, queryParams);
        
      case 'PERCENTILE':
        return this.calculatePercentileSensitivity(data, queryParams);
        
      case 'TRAINING_DATA':
        return this.calculateTrainingDataSensitivity(data, queryParams);
        
      default:
        throw new Error(`Unknown query type: ${queryType}`);
    }
  }

  /**
   * Count query sensitivity is always 1
   */
  calculateCountSensitivity(data) {
    return 1; // Adding/removing one record changes count by at most 1
  }

  /**
   * Sum query sensitivity
   */
  calculateSumSensitivity(data, params) {
    if (params.bounds) {
      // If we know data bounds, sensitivity is max - min
      return params.bounds.max - params.bounds.min;
    }
    
    // Otherwise, calculate from actual data
    const values = this.extractNumericValues(data);
    if (values.length === 0) return 0;
    return Math.max(...values) - Math.min(...values);
  }

  /**
   * Average query sensitivity
   */
  calculateAverageSensitivity(data, params) {
    const values = this.extractNumericValues(data);
    const n = values.length;
    
    if (n === 0) return 0;
    
    if (params.bounds) {
      // With known bounds: (max - min) / n
      return (params.bounds.max - params.bounds.min) / n;
    }
    
    // Without bounds: estimate from data
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    return (maxValue - minValue) / n;
  }

  /**
   * Gradient sensitivity for machine learning
   */
  calculateGradientSensitivity(data, params) {
    const gradients = this.extractGradients(data);
    
    if (gradients.length === 0) return 0;
    
    // L2 sensitivity: maximum L2 norm of any gradient
    let maxL2Norm = 0;
    
    for (const gradient of gradients) {
      const l2Norm = this.calculateL2Norm(gradient);
      maxL2Norm = Math.max(maxL2Norm, l2Norm);
    }
    
    // Apply clipping if specified
    if (params.clipNorm) {
      maxL2Norm = Math.min(maxL2Norm, params.clipNorm);
    }
    
    return maxL2Norm;
  }

  /**
   * Training data sensitivity
   */
  calculateTrainingDataSensitivity(data, params) {
    if (params.dataType === 'FEATURE_VECTORS') {
      // For feature vectors, sensitivity is max feature value - min feature value
      const values = this.extractNumericValues(data);
      if (values.length === 0) return 0;
      return Math.max(...values) - Math.min(...values);
    }
    
    // Default to gradient sensitivity
    return this.calculateGradientSensitivity(data, params);
  }

  /**
   * Histogram sensitivity
   */
  calculateHistogramSensitivity(data, params) {
    // Histogram sensitivity is 2 (can change two bins by adding/removing one record)
    return 2;
  }

  /**
   * Percentile sensitivity
   */
  calculatePercentileSensitivity(data, params) {
    const values = this.extractNumericValues(data);
    const n = values.length;
    
    if (n === 0) return 0;
    
    // Percentile sensitivity depends on data distribution
    // Conservative estimate: max - min
    return Math.max(...values) - Math.min(...values);
  }

  /**
   * Helper: Extract numeric values from data
   */
  extractNumericValues(data) {
    if (Array.isArray(data)) {
      return data.filter(v => typeof v === 'number');
    } else if (typeof data === 'object') {
      return Object.values(data).filter(v => typeof v === 'number');
    }
    return [];
  }

  /**
   * Helper: Extract gradients from data
   */
  extractGradients(data) {
    if (Array.isArray(data)) {
      return data.filter(item => Array.isArray(item) || typeof item === 'object');
    }
    return [data];
  }

  /**
   * Helper: Calculate L2 norm of vector
   */
  calculateL2Norm(vector) {
    if (Array.isArray(vector)) {
      return Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    } else if (typeof vector === 'object') {
      const values = Object.values(vector).filter(v => typeof v === 'number');
      return Math.sqrt(values.reduce((sum, val) => sum + val * val, 0));
    }
    return Math.abs(vector);
  }
}

module.exports = {
  DifferentialPrivacyService,
  LaplaceMechanism,
  GaussianMechanism,
  ExponentialMechanism,
  GeometricMechanism,
  PrivacyBudgetTracker,
  SensitivityAnalyzer
}; 