/**
 * Contract Router Service - SCITT CCF Only
 * 
 * This service provides a simplified interface for contract operations
 * using only the SCITT CCF Ledger backend.
 * 
 * Key Responsibilities:
 * - Route all contract operations to SCITT CCF
 * - Maintain data consistency
 * - Provide unified API interface
 * - Monitor SCITT CCF system health
 * 
 * @author Contract Management System Team
 * @version 2.0.0
 * @since 2025-01-08
 */

const ScittCcfService = require('./scittCcfService');
const SystemHealthMonitor = require('./systemHealthMonitor');

class ContractRouterService {
  constructor() {
    this.scittCcfService = new ScittCcfService();
    this.healthMonitor = new SystemHealthMonitor();
    this.isInitialized = false;
  }

  /**
   * Initialize the contract router service
   */
  async initialize() {
    try {
      console.log('🚀 Initializing Contract Router Service (SCITT CCF Only)...');
      
      // Initialize SCITT CCF service
      await this.scittCcfService.initialize();
      
      // Start health monitoring
      await this.healthMonitor.startMonitoring();
      
      this.isInitialized = true;
      console.log('✅ Contract Router Service initialized successfully');
      console.log('   Backend: SCITT CCF Ledger Only');
      
    } catch (error) {
      console.error('❌ Contract Router Service initialization failed:', error.message);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Create a contract using SCITT CCF
   */
  async createContract(contractData) {
    if (!this.isInitialized) {
      throw new Error('Contract Router Service not initialized');
    }

    try {
      console.log('📜 Creating contract via SCITT CCF...');
      console.log('🔍 ContractRouter Debug - contractData:', JSON.stringify(contractData, null, 2));
      console.log('🔍 ContractRouter Debug - contractData.contractId:', contractData.contractId);
      
      const result = await this.scittCcfService.createContract(contractData);
      
      console.log('🔍 ContractRouter Debug - result:', JSON.stringify(result, null, 2));
      return result;
      
    } catch (error) {
      console.error('Contract creation failed:', error);
      throw error;
    }
  }

  /**
   * Sign a contract using SCITT CCF
   */
  async signContract(contractId, signerAddress, partyType, privateKey) {
    if (!this.isInitialized) {
      throw new Error('Contract Router Service not initialized');
    }

    try {
      console.log(`✍️ Signing contract ${contractId} via SCITT CCF...`);
      return await this.scittCcfService.signContract(contractId, signerAddress, partyType);
      
    } catch (error) {
      console.error('Contract signing failed:', error);
      throw error;
    }
  }

  /**
   * Get contract status from SCITT CCF
   */
  async getContractStatus(contractId) {
    if (!this.isInitialized) {
      throw new Error('Contract Router Service not initialized');
    }

    try {
      return await this.scittCcfService.getContractStatus(contractId);
      
    } catch (error) {
      console.error('Failed to get contract status:', error);
      throw error;
    }
  }

  /**
   * Get contract details from SCITT CCF
   */
  async getContract(contractId) {
    if (!this.isInitialized) {
      throw new Error('Contract Router Service not initialized');
    }

    try {
      return await this.scittCcfService.getContract(contractId);
      
    } catch (error) {
      console.error('Failed to get contract:', error);
      throw error;
    }
  }

  /**
   * List contracts from SCITT CCF
   */
  async listContracts(userId, filters = {}) {
    if (!this.isInitialized) {
      throw new Error('Contract Router Service not initialized');
    }

    try {
      return await this.scittCcfService.listContracts(userId, filters);
      
    } catch (error) {
      console.error('Failed to list contracts:', error);
      throw error;
    }
  }

  /**
   * Get system health status
   */
  async getSystemHealth() {
    if (!this.isInitialized) {
      throw new Error('Contract Router Service not initialized');
    }

    try {
      const scittHealth = await this.healthMonitor.checkScittCcfHealth();
      
      return {
        overall: scittHealth.isHealthy,
        scittCcf: scittHealth,
        timestamp: new Date().toISOString(),
        backend: 'SCITT_CCF_ONLY'
      };
      
    } catch (error) {
      console.error('Failed to get system health:', error);
      return {
        overall: false,
        scittCcf: { isHealthy: false, error: error.message },
        timestamp: new Date().toISOString(),
        backend: 'SCITT_CCF_ONLY'
      };
    }
  }

  /**
   * Get migration status (always SCITT CCF only)
   */
  async getMigrationStatus() {
    return {
      currentMode: 'SCITT_CCF_ONLY',
      targetMode: 'SCITT_CCF_ONLY',
      isMigrating: false,
      progress: 100,
      message: 'System is running on SCITT CCF only',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get migrated contract count
   */
  async getMigratedContractCount() {
    try {
      const contracts = await this.scittCcfService.listContracts();
      return {
        total: contracts.length,
        migrated: contracts.length,
        pending: 0,
        failed: 0
      };
    } catch (error) {
      console.error('Failed to get contract count:', error);
      return { total: 0, migrated: 0, pending: 0, failed: 0 };
    }
  }

  /**
   * Test routing logic (always returns SCITT CCF)
   */
  async testRouting() {
    return {
      target: 'SCITT_CCF',
      reason: 'System configured for SCITT CCF only',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Cleanup test data
   */
  async cleanupTestData() {
    try {
      await this.scittCcfService.cleanupTestData();
      console.log('✅ Test data cleaned up successfully');
    } catch (error) {
      console.error('❌ Failed to cleanup test data:', error);
      throw error;
    }
  }
}

module.exports = ContractRouterService;

