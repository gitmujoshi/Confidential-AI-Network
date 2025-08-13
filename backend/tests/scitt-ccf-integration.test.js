/**
 * SCITT CCF Integration Test Suite
 * Tests the complete SCITT CCF integration functionality
 */

const { ScittCcfService } = require('../services/scittCcfService');
const { ContractRouterService } = require('../services/contractRouterService');
const { SystemHealthMonitor } = require('../services/systemHealthMonitor');

describe('SCITT CCF Integration Tests', () => {
  let scittService;
  let contractRouter;
  let healthMonitor;

  beforeAll(async () => {
    // Initialize services
    scittService = new ScittCcfService();
    contractRouter = new ContractRouterService();
    healthMonitor = new SystemHealthMonitor();
  });

  describe('SCITT CCF Service Tests', () => {
    test('should initialize SCITT CCF service successfully', async () => {
      await expect(scittService.initialize()).resolves.not.toThrow();
      expect(scittService.isInitialized).toBe(true);
    });

    test('should test connection to SCITT CCF node', async () => {
      const result = await scittService.testConnection();
      expect(result).toBe(true);
    });

    test('should detect TEE provider correctly', () => {
      const teeProvider = scittService.detectTeeProvider();
      expect(teeProvider).toHaveProperty('type');
      expect(teeProvider).toHaveProperty('capabilities');
      expect(teeProvider.capabilities).toContain('encryption');
    });

    test('should create contract claim correctly', () => {
      const contractData = {
        name: 'Test Contract',
        description: 'Test description',
        tdpId: 1,
        tdcId: 2,
        price: 1000
      };

      const claim = scittService.buildContractClaim(contractData);
      expect(claim).toHaveProperty('type', 'contract_creation');
      expect(claim.data).toMatchObject(contractData);
    });

    test('should submit claim to SCITT CCF', async () => {
      const contractData = {
        name: 'Test Contract',
        description: 'Test description',
        tdpId: 1,
        tdcId: 2,
        price: 1000
      };

      const result = await scittService.createContract(contractData);
      expect(result.success).toBe(true);
      expect(result.source).toBe('SCITT_CCF');
      expect(result).toHaveProperty('claimId');
      expect(result).toHaveProperty('receipt');
    });

    test('should get contract status from SCITT CCF', async () => {
      const claimId = 'test-claim-123';
      const status = await scittService.getContractStatus(claimId);
      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('claimId', claimId);
    });

    test('should verify TEE attestation', async () => {
      const claimId = 'test-claim-123';
      const attestation = await scittService.verifyTeeAttestation(claimId);
      expect(attestation).toHaveProperty('verified');
      expect(attestation).toHaveProperty('teeProvider');
    });
  });

  describe('Contract Router Service Tests', () => {
    test('should initialize contract router successfully', async () => {
      await expect(contractRouter.initialize()).resolves.not.toThrow();
    });

    test('should route to SCITT CCF when configured', async () => {
      const contractData = {
        name: 'Test Contract',
        description: 'Test description',
        tdpId: 1,
        tdcId: 2,
        price: 1000
      };

      // Set migration mode to SCITT CCF only
      contractRouter.setMigrationMode('SCITT_CCF_ONLY');

      const result = await contractRouter.createContract(contractData);
      expect(result.source).toBe('SCITT_CCF');
      expect(result.success).toBe(true);
    });

    test('should fallback to Ethereum when SCITT CCF fails', async () => {
      const contractData = {
        name: 'Test Contract',
        description: 'Test description',
        tdpId: 1,
        tdcId: 2,
        price: 1000
      };

      // Set migration mode to hybrid
      contractRouter.setMigrationMode('HYBRID');

      // Mock SCITT CCF failure
      jest.spyOn(scittService, 'createContract').mockRejectedValue(new Error('SCITT CCF unavailable'));

      const result = await contractRouter.createContract(contractData);
      expect(result.source).toBe('ETHEREUM');
      expect(result.success).toBe(true);
    });

    test('should handle dual operations in hybrid mode', async () => {
      const contractData = {
        name: 'Test Contract',
        description: 'Test description',
        tdpId: 1,
        tdcId: 2,
        price: 1000
      };

      contractRouter.setMigrationMode('HYBRID');

      const result = await contractRouter.createContract(contractData);
      expect(result).toHaveProperty('primary');
      expect(result).toHaveProperty('secondary');
      expect(result.primary.source).toBe('SCITT_CCF');
      expect(result.secondary.source).toBe('ETHEREUM');
    });
  });

  describe('System Health Monitor Tests', () => {
    test('should initialize health monitor successfully', async () => {
      await expect(healthMonitor.initialize()).resolves.not.toThrow();
    });

    test('should check SCITT CCF health', async () => {
      const health = await healthMonitor.checkScittCcfHealth();
      expect(health).toHaveProperty('isHealthy');
      expect(health).toHaveProperty('responseTime');
      expect(health).toHaveProperty('lastCheck');
    });

    test('should check Ethereum health', async () => {
      const health = await healthMonitor.checkEthereumHealth();
      expect(health).toHaveProperty('isHealthy');
      expect(health).toHaveProperty('responseTime');
      expect(health).toHaveProperty('lastCheck');
    });

    test('should get overall system health', async () => {
      const health = await healthMonitor.getOverallHealth();
      expect(health).toHaveProperty('overall');
      expect(health).toHaveProperty('scittCcf');
      expect(health).toHaveProperty('ethereum');
      expect(health).toHaveProperty('timestamp');
    });

    test('should start monitoring automatically', async () => {
      await healthMonitor.startMonitoring();
      expect(healthMonitor.isMonitoring).toBe(true);
    });

    test('should stop monitoring', async () => {
      await healthMonitor.stopMonitoring();
      expect(healthMonitor.isMonitoring).toBe(false);
    });
  });

  describe('Migration Mode Tests', () => {
    test('should support ETHEREUM_ONLY mode', async () => {
      contractRouter.setMigrationMode('ETHEREUM_ONLY');
      expect(contractRouter.getMigrationMode()).toBe('ETHEREUM_ONLY');
    });

    test('should support SCITT_CCF_ONLY mode', async () => {
      contractRouter.setMigrationMode('SCITT_CCF_ONLY');
      expect(contractRouter.getMigrationMode()).toBe('SCITT_CCF_ONLY');
    });

    test('should support HYBRID mode', async () => {
      contractRouter.setMigrationMode('HYBRID');
      expect(contractRouter.getMigrationMode()).toBe('HYBRID');
    });

    test('should validate migration mode changes', () => {
      expect(() => contractRouter.setMigrationMode('INVALID_MODE')).toThrow();
    });
  });

  describe('Error Handling Tests', () => {
    test('should handle SCITT CCF service unavailability', async () => {
      // Mock SCITT CCF service failure
      jest.spyOn(scittService, 'initialize').mockRejectedValue(new Error('Service unavailable'));

      await expect(scittService.initialize()).rejects.toThrow('Service unavailable');
    });

    test('should handle network connectivity issues', async () => {
      // Mock network failure
      jest.spyOn(scittService, 'testConnection').mockRejectedValue(new Error('Network error'));

      await expect(scittService.testConnection()).rejects.toThrow('Network error');
    });

    test('should handle invalid contract data', () => {
      const invalidData = { name: 'Test' }; // Missing required fields

      expect(() => scittService.buildContractClaim(invalidData)).toThrow();
    });
  });

  describe('Performance Tests', () => {
    test('should create contract within acceptable time', async () => {
      const startTime = Date.now();
      
      const contractData = {
        name: 'Performance Test Contract',
        description: 'Test description',
        tdpId: 1,
        tdcId: 2,
        price: 1000
      };

      await scittService.createContract(contractData);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should handle concurrent contract creation', async () => {
      const contracts = Array.from({ length: 5 }, (_, i) => ({
        name: `Concurrent Contract ${i}`,
        description: `Test description ${i}`,
        tdpId: 1,
        tdcId: 2,
        price: 1000 + i
      }));

      const promises = contracts.map(data => scittService.createContract(data));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.source).toBe('SCITT_CCF');
      });
    });
  });

  afterAll(async () => {
    // Cleanup
    if (healthMonitor.isMonitoring) {
      await healthMonitor.stopMonitoring();
    }
  });
});
