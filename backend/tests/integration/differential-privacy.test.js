/**
 * Differential Privacy Service Tests
 * Comprehensive testing of all DP functionality
 */

const { DifferentialPrivacyService } = require('../services/differentialPrivacyService');
const { PrivacyBudgetTracker } = require('../services/differentialPrivacyService');
const { SensitivityAnalyzer } = require('../services/differentialPrivacyService');

describe('Differential Privacy Service', () => {
  let dpService;
  let budgetTracker;
  let sensitivityAnalyzer;
  
  beforeEach(() => {
    dpService = new DifferentialPrivacyService();
    budgetTracker = new PrivacyBudgetTracker();
    sensitivityAnalyzer = new SensitivityAnalyzer();
  });
  
  describe('Core DP Service', () => {
    test('should initialize with all mechanisms', () => {
      expect(dpService.mechanisms).toHaveProperty('laplace');
      expect(dpService.mechanisms).toHaveProperty('gaussian');
      expect(dpService.mechanisms).toHaveProperty('exponential');
      expect(dpService.mechanisms).toHaveProperty('geometric');
    });
    
    test('should validate privacy parameters correctly', () => {
      const validParams = {
        contractId: 'test-contract',
        epsilon: 0.1,
        delta: 1e-5,
        mechanism: 'laplace'
      };
      
      expect(() => dpService.validatePrivacyParams(validParams)).not.toThrow();
    });
    
    test('should reject invalid epsilon values', () => {
      const invalidParams = {
        contractId: 'test-contract',
        epsilon: 0,
        delta: 1e-5,
        mechanism: 'laplace'
      };
      
      expect(() => dpService.validatePrivacyParams(invalidParams)).toThrow('Epsilon must be positive');
    });
    
    test('should reject invalid delta values', () => {
      const invalidParams = {
        contractId: 'test-contract',
        epsilon: 0.1,
        delta: 1.5,
        mechanism: 'laplace'
      };
      
      expect(() => dpService.validatePrivacyParams(invalidParams)).toThrow('Delta must be between 0 and 1');
    });
    
    test('should reject invalid mechanisms', () => {
      const invalidParams = {
        contractId: 'test-contract',
        epsilon: 0.1,
        delta: 1e-5,
        mechanism: 'invalid'
      };
      
      expect(() => dpService.validatePrivacyParams(invalidParams)).toThrow('Invalid mechanism: invalid');
    });
    
    test('should reject missing contract ID', () => {
      const invalidParams = {
        epsilon: 0.1,
        delta: 1e-5,
        mechanism: 'laplace'
      };
      
      expect(() => dpService.validatePrivacyParams(invalidParams)).toThrow('Contract ID is required for budget tracking');
    });
    
    test('should select appropriate mechanism for query types', () => {
      expect(dpService.selectMechanism('laplace', 'COUNT')).toBe(dpService.mechanisms.geometric);
      expect(dpService.selectMechanism('gaussian', 'AVERAGE')).toBe(dpService.mechanisms.gaussian);
      expect(dpService.selectMechanism('laplace', 'GRADIENT')).toBe(dpService.mechanisms.laplace);
      expect(dpService.selectMechanism('laplace', 'UNKNOWN')).toBe(dpService.mechanisms.laplace);
    });
  });
  
  describe('Laplace Mechanism', () => {
    let laplaceMechanism;
    
    beforeEach(() => {
      laplaceMechanism = dpService.mechanisms.laplace;
    });
    
    test('should add noise to scalar data', async () => {
      const data = 42;
      const privacyParams = { epsilon: 0.1, delta: 1e-5 };
      const sensitivity = 1;
      
      const result = await laplaceMechanism.addNoise(data, privacyParams, sensitivity);
      
      expect(result.output).toBeDefined();
      expect(typeof result.output).toBe('number');
      expect(result.mechanism).toBe('laplace');
      expect(result.scale).toBe(10); // sensitivity / epsilon = 1 / 0.1
      expect(result.noiseMetrics).toBeDefined();
      expect(result.noiseMetrics.originalValue).toBe(42);
      expect(result.noiseMetrics.noiseValue).toBeDefined();
    });
    
    test('should add noise to array data', async () => {
      const data = [1, 2, 3, 4, 5];
      const privacyParams = { epsilon: 0.1, delta: 1e-5 };
      const sensitivity = 1;
      
      const result = await laplaceMechanism.addNoise(data, privacyParams, sensitivity);
      
      expect(result.output).toHaveLength(5);
      expect(Array.isArray(result.output)).toBe(true);
      expect(result.mechanism).toBe('laplace');
      expect(result.noiseMetrics).toBeDefined();
      expect(result.noiseMetrics.totalNoise).toBeDefined();
      expect(result.noiseMetrics.averageNoise).toBeDefined();
    });
    
    test('should add noise to object data', async () => {
      const data = { a: 1, b: 2, c: 3 };
      const privacyParams = { epsilon: 0.1, delta: 1e-5 };
      const sensitivity = 1;
      
      const result = await laplaceMechanism.addNoise(data, privacyParams, sensitivity);
      
      expect(result.output).toHaveProperty('a');
      expect(result.output).toHaveProperty('b');
      expect(result.output).toHaveProperty('c');
      expect(typeof result.output.a).toBe('number');
      expect(typeof result.output.b).toBe('number');
      expect(typeof result.output.c).toBe('number');
    });
    
    test('should sample from Laplace distribution', () => {
      const samples = [];
      for (let i = 0; i < 1000; i++) {
        samples.push(laplaceMechanism.sampleLaplace(0, 1));
      }
      
      const mean = samples.reduce((sum, val) => sum + val, 0) / samples.length;
      const variance = samples.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / samples.length;
      
      // Laplace distribution with scale 1 has variance 2
      expect(Math.abs(mean)).toBeLessThan(0.1); // Mean should be close to 0
      expect(Math.abs(variance - 2)).toBeLessThan(0.5); // Variance should be close to 2
    });
    
    test('should calculate noise metrics correctly', () => {
      const original = [1, 2, 3, 4, 5];
      const output = [1.1, 2.2, 3.3, 4.4, 5.5];
      
      const metrics = laplaceMechanism.calculateNoiseMetrics(output, original);
      
      expect(metrics.totalNoise).toBeCloseTo(1.5, 1);
      expect(metrics.averageNoise).toBeCloseTo(0.3, 1);
      expect(metrics.maxNoise).toBeCloseTo(0.5, 1);
      expect(metrics.minNoise).toBeCloseTo(0.1, 1);
      expect(metrics.noiseVariance).toBeDefined();
    });
  });
  
  describe('Gaussian Mechanism', () => {
    let gaussianMechanism;
    
    beforeEach(() => {
      gaussianMechanism = dpService.mechanisms.gaussian;
    });
    
    test('should add noise to scalar data', async () => {
      const data = 42;
      const privacyParams = { epsilon: 0.1, delta: 1e-5 };
      const sensitivity = 1;
      
      const result = await gaussianMechanism.addNoise(data, privacyParams, sensitivity);
      
      expect(result.output).toBeDefined();
      expect(typeof result.output).toBe('number');
      expect(result.mechanism).toBe('gaussian');
      expect(result.scale).toBeDefined();
      expect(result.scale).toBeGreaterThan(0);
    });
    
    test('should add noise to array data', async () => {
      const data = [1, 2, 3, 4, 5];
      const privacyParams = { epsilon: 0.1, delta: 1e-5 };
      const sensitivity = 1;
      
      const result = await gaussianMechanism.addNoise(data, privacyParams, sensitivity);
      
      expect(result.output).toHaveLength(5);
      expect(Array.isArray(result.output)).toBe(true);
      expect(result.mechanism).toBe('gaussian');
    });
    
    test('should calculate Gaussian scale correctly', () => {
      const epsilon = 0.1;
      const delta = 1e-5;
      const sensitivity = 1;
      
      const scale = gaussianMechanism.calculateGaussianScale(epsilon, delta, sensitivity);
      
      // Expected scale = sensitivity * sqrt(2 * log(1.25/delta)) / epsilon
      const expectedScale = sensitivity * Math.sqrt(2 * Math.log(1.25 / delta)) / epsilon;
      expect(scale).toBeCloseTo(expectedScale, 5);
    });
    
    test('should sample from Gaussian distribution', () => {
      const samples = [];
      for (let i = 0; i < 1000; i++) {
        samples.push(gaussianMechanism.sampleGaussian(0, 1));
      }
      
      const mean = samples.reduce((sum, val) => sum + val, 0) / samples.length;
      const variance = samples.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / samples.length;
      
      // Standard normal distribution has variance 1
      expect(Math.abs(mean)).toBeLessThan(0.1); // Mean should be close to 0
      expect(Math.abs(variance - 1)).toBeLessThan(0.2); // Variance should be close to 1
    });
  });
  
  describe('Sensitivity Analyzer', () => {
    test('should calculate count sensitivity correctly', async () => {
      const data = [1, 2, 3, 4, 5];
      const sensitivity = await sensitivityAnalyzer.calculateSensitivity(data, 'COUNT');
      
      expect(sensitivity).toBe(1);
    });
    
    test('should calculate sum sensitivity correctly', async () => {
      const data = [1, 2, 3, 4, 5];
      const sensitivity = await sensitivityAnalyzer.calculateSensitivity(data, 'SUM');
      
      expect(sensitivity).toBe(4); // max - min = 5 - 1 = 4
    });
    
    test('should calculate average sensitivity correctly', async () => {
      const data = [1, 2, 3, 4, 5];
      const sensitivity = await sensitivityAnalyzer.calculateSensitivity(data, 'AVERAGE');
      
      expect(sensitivity).toBe(0.8); // (max - min) / n = (5 - 1) / 5 = 0.8
    });
    
    test('should calculate gradient sensitivity correctly', async () => {
      const data = [[1, 2], [3, 4], [5, 6]];
      const sensitivity = await sensitivityAnalyzer.calculateSensitivity(data, 'GRADIENT', { clipNorm: 2 });
      
      expect(sensitivity).toBeGreaterThan(0);
      expect(sensitivity).toBeLessThanOrEqual(2); // Should respect clipNorm
    });
    
    test('should calculate histogram sensitivity correctly', async () => {
      const data = [1, 2, 2, 3, 3, 3];
      const sensitivity = await sensitivityAnalyzer.calculateSensitivity(data, 'HISTOGRAM');
      
      expect(sensitivity).toBe(2);
    });
    
    test('should handle empty data gracefully', async () => {
      const data = [];
      const sensitivity = await sensitivityAnalyzer.calculateSensitivity(data, 'COUNT');
      
      expect(sensitivity).toBe(1); // Count sensitivity is always 1
    });
    
    test('should extract numeric values correctly', () => {
      const data = [1, 'string', 2, null, 3, undefined, 4];
      const numericValues = sensitivityAnalyzer.extractNumericValues(data);
      
      expect(numericValues).toEqual([1, 2, 3, 4]);
    });
    
    test('should calculate L2 norm correctly', () => {
      const vector = [3, 4];
      const l2Norm = sensitivityAnalyzer.calculateL2Norm(vector);
      
      expect(l2Norm).toBe(5); // sqrt(3^2 + 4^2) = 5
    });
  });
  
  describe('Privacy Budget Tracker', () => {
    test('should check budget correctly', async () => {
      // Mock database for testing
      const mockBudget = {
        remainingEpsilon: 1.0,
        remainingDelta: 1e-5
      };
      
      budgetTracker.getCurrentBudget = jest.fn().mockResolvedValue(mockBudget);
      budgetTracker.initializeBudget = jest.fn().mockResolvedValue(mockBudget);
      
      const result = await budgetTracker.checkBudget('test-contract', 0.5, 1e-6);
      
      expect(result).toBe(true);
    });
    
    test('should reject when epsilon budget exceeded', async () => {
      const mockBudget = {
        remainingEpsilon: 0.1,
        remainingDelta: 1e-5
      };
      
      budgetTracker.getCurrentBudget = jest.fn().mockResolvedValue(mockBudget);
      
      await expect(
        budgetTracker.checkBudget('test-contract', 0.5, 1e-6)
      ).rejects.toThrow('Privacy budget exceeded: requested 0.5, available 0.1');
    });
    
    test('should reject when delta budget exceeded', async () => {
      const mockBudget = {
        remainingEpsilon: 1.0,
        remainingDelta: 1e-6
      };
      
      budgetTracker.getCurrentBudget = jest.fn().mockResolvedValue(mockBudget);
      
      await expect(
        budgetTracker.checkBudget('test-contract', 0.5, 1e-5)
      ).rejects.toThrow('Privacy budget exceeded: requested 1e-5, available 1e-6');
    });
  });
  
  describe('Integration Tests', () => {
    test('should apply differential privacy end-to-end', async () => {
      const data = [1, 2, 3, 4, 5];
      const query = { type: 'AVERAGE' };
      const privacyParams = {
        contractId: 'test-contract',
        epsilon: 0.1,
        delta: 1e-5,
        mechanism: 'laplace'
      };
      
      // Mock budget tracker to allow operation
      dpService.privacyBudgetTracker.checkBudget = jest.fn().mockResolvedValue(true);
      dpService.privacyBudgetTracker.consumeBudget = jest.fn().mockResolvedValue();
      dpService.logPrivacyOperation = jest.fn().mockResolvedValue();
      
      const result = await dpService.applyDifferentialPrivacy(data, query, privacyParams);
      
      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.privacyMetrics).toBeDefined();
      expect(result.privacyMetrics.mechanism).toBe('laplace');
      expect(result.privacyMetrics.epsilon).toBe(0.1);
      expect(result.privacyMetrics.delta).toBe(1e-5);
    });
    
    test('should handle different query types correctly', async () => {
      const data = [1, 2, 3, 4, 5];
      const privacyParams = {
        contractId: 'test-contract',
        epsilon: 0.1,
        delta: 1e-5,
        mechanism: 'laplace'
      };
      
      // Mock budget tracker
      dpService.privacyBudgetTracker.checkBudget = jest.fn().mockResolvedValue(true);
      dpService.privacyBudgetTracker.consumeBudget = jest.fn().mockResolvedValue();
      dpService.logPrivacyOperation = jest.fn().mockResolvedValue();
      
      const queryTypes = ['COUNT', 'SUM', 'AVERAGE', 'GRADIENT', 'HISTOGRAM'];
      
      for (const queryType of queryTypes) {
        const query = { type: queryType };
        const result = await dpService.applyDifferentialPrivacy(data, query, privacyParams);
        
        expect(result.success).toBe(true);
        expect(result.result).toBeDefined();
      }
    });
    
    test('should respect privacy budget constraints', async () => {
      const data = [1, 2, 3, 4, 5];
      const query = { type: 'AVERAGE' };
      const privacyParams = {
        contractId: 'test-contract',
        epsilon: 0.1,
        delta: 1e-5,
        mechanism: 'laplace'
      };
      
      // Mock budget tracker to reject operation
      dpService.privacyBudgetTracker.checkBudget = jest.fn().mockRejectedValue(
        new Error('Privacy budget exceeded')
      );
      
      await expect(
        dpService.applyDifferentialPrivacy(data, query, privacyParams)
      ).rejects.toThrow('DP Error: Privacy budget exceeded');
    });
  });
  
  describe('Error Handling', () => {
    test('should handle invalid data gracefully', async () => {
      const data = null;
      const query = { type: 'AVERAGE' };
      const privacyParams = {
        contractId: 'test-contract',
        epsilon: 0.1,
        delta: 1e-5,
        mechanism: 'laplace'
      };
      
      // Mock budget tracker
      dpService.privacyBudgetTracker.checkBudget = jest.fn().mockResolvedValue(true);
      dpService.privacyBudgetTracker.consumeBudget = jest.fn().mockResolvedValue();
      dpService.logPrivacyOperation = jest.fn().mockResolvedValue();
      
      await expect(
        dpService.applyDifferentialPrivacy(data, query, privacyParams)
      ).rejects.toThrow();
    });
    
    test('should handle mechanism errors gracefully', async () => {
      const data = [1, 2, 3];
      const query = { type: 'INVALID_TYPE' };
      const privacyParams = {
        contractId: 'test-contract',
        epsilon: 0.1,
        delta: 1e-5,
        mechanism: 'exponential' // Not implemented yet
      };
      
      // Mock budget tracker
      dpService.privacyBudgetTracker.checkBudget = jest.fn().mockResolvedValue(true);
      dpService.privacyBudgetTracker.consumeBudget = jest.fn().mockResolvedValue();
      dpService.logPrivacyOperation = jest.fn().mockResolvedValue();
      
      await expect(
        dpService.applyDifferentialPrivacy(data, query, privacyParams)
      ).rejects.toThrow('Exponential mechanism not yet implemented');
    });
  });
  
  describe('Performance Tests', () => {
    test('should handle large datasets efficiently', async () => {
      const data = Array.from({ length: 10000 }, (_, i) => Math.random());
      const query = { type: 'AVERAGE' };
      const privacyParams = {
        contractId: 'test-contract',
        epsilon: 0.1,
        delta: 1e-5,
        mechanism: 'laplace'
      };
      
      // Mock budget tracker
      dpService.privacyBudgetTracker.checkBudget = jest.fn().mockResolvedValue(true);
      dpService.privacyBudgetTracker.consumeBudget = jest.fn().mockResolvedValue();
      dpService.logPrivacyOperation = jest.fn().mockResolvedValue();
      
      const startTime = Date.now();
      const result = await dpService.applyDifferentialPrivacy(data, query, privacyParams);
      const endTime = Date.now();
      
      expect(result.success).toBe(true);
      expect(result.result).toHaveLength(10000);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}; 