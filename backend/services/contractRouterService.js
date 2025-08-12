/**
 * Contract Router Service
 * 
 * This service acts as the central orchestrator, intelligently routing contract
 * operations between Ethereum and SCITT CCF based on configuration and system health.
 * 
 * Key Responsibilities:
 * - Route contract operations to appropriate backend
 * - Maintain data consistency between systems
 * - Handle fallback scenarios
 * - Provide unified API interface
 * - Monitor system health and performance
 * 
 * @author Contract Management System Team
 * @version 1.0.0
 * @since 2025-01-08
 */

const BlockchainService = require('./blockchainService');
const ScittCcfService = require('./scittCcfService');
const SystemHealthMonitor = require('./systemHealthMonitor');

class ContractRouterService {
  constructor() {
    this.ethereumService = new BlockchainService();
    this.scittCcfService = new ScittCcfService();
    this.healthMonitor = new SystemHealthMonitor();
    this.migrationMode = process.env.MIGRATION_MODE || 'HYBRID';
    this.isInitialized = false;
  }

  /**
   * Initialize the contract router service
   */
  async initialize() {
    try {
      console.log('🚀 Initializing Contract Router Service...');
      
      // Initialize both services
      await this.ethereumService.initialize();
      await this.scittCcfService.initialize();
      
      // Start health monitoring
      await this.healthMonitor.startMonitoring();
      
      this.isInitialized = true;
      console.log('✅ Contract Router Service initialized successfully');
      console.log(`   Migration Mode: ${this.migrationMode}`);
      
    } catch (error) {
      console.error('❌ Contract Router Service initialization failed:', error.message);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Create a contract using the appropriate backend
   */
  async createContract(contractData) {
    if (!this.isInitialized) {
      throw new Error('Contract Router Service not initialized');
    }

    try {
      const routeDecision = await this.determineRoute('CREATE', contractData);
      console.log(`Route decision: ${routeDecision.target} - ${routeDecision.reason}`);
      
      switch (routeDecision.target) {
        case 'SCITT_CCF':
          return await this.executeScittCcfOperation('createContract', contractData);
        case 'ETHEREUM':
          return await this.executeEthereumOperation('createContract', contractData);
        case 'DUAL':
          return await this.executeDualOperation('createContract', contractData);
        default:
          throw new Error(`Unknown route target: ${routeDecision.target}`);
      }
      
    } catch (error) {
      console.error('Contract creation failed:', error);
      throw error;
    }
  }

  /**
   * Sign a contract using the appropriate backend
   */
  async signContract(contractId, signerAddress, partyType, privateKey) {
    if (!this.isInitialized) {
      throw new Error('Contract Router Service not initialized');
    }

    try {
      const routeDecision = await this.determineRoute('SIGN', { contractId, partyType });
      console.log(`Route decision for signing: ${routeDecision.target} - ${routeDecision.reason}`);
      
      switch (routeDecision.target) {
        case 'SCITT_CCF':
          return await this.executeScittCcfOperation('signContract', contractId, signerAddress, partyType);
        case 'ETHEREUM':
          return await this.executeEthereumOperation('signContract', contractId, privateKey);
        case 'DUAL':
          return await this.executeDualOperation('signContract', contractId, signerAddress, partyType, privateKey);
        default:
          throw new Error(`Unknown route target: ${routeDecision.target}`);
      }
      
    } catch (error) {
      console.error('Contract signing failed:', error);
      throw error;
    }
  }

  /**
   * Get contract status from the appropriate backend
   */
  async getContractStatus(contractId) {
    if (!this.isInitialized) {
      throw new Error('Contract Router Service not initialized');
    }

    try {
      // Try SCITT CCF first, fallback to Ethereum
      try {
        const scittStatus = await this.scittCcfService.getContractStatus(contractId);
        if (scittStatus && scittStatus.status !== 'NOT_FOUND') {
          return { ...scittStatus, source: 'SCITT_CCF' };
        }
      } catch (error) {
        console.warn('SCITT CCF status check failed, falling back to Ethereum');
      }

      // Fallback to Ethereum
      const ethereumStatus = await this.ethereumService.getContract(contractId);
      if (ethereumStatus) {
        return { ...ethereumStatus, source: 'ETHEREUM' };
      }

      return { status: 'NOT_FOUND', message: 'Contract not found in any system' };
      
    } catch (error) {
      console.error('Failed to get contract status:', error);
      throw error;
    }
  }

  /**
   * Determine the appropriate route for an operation
   */
  async determineRoute(operation, data) {
    const scittHealth = await this.healthMonitor.checkScittCcfHealth();
    const ethereumHealth = await this.healthMonitor.checkEthereumHealth();
    
    console.log(`Health check - SCITT CCF: ${scittHealth.isHealthy}, Ethereum: ${ethereumHealth.isHealthy}`);
    
    // Decision logic based on health, migration mode, and operation type
    if (this.migrationMode === 'SCITT_CCF_ONLY' && scittHealth.isHealthy) {
      return { target: 'SCITT_CCF', reason: 'Migration mode - SCITT CCF only' };
    }
    
    if (this.migrationMode === 'ETHEREUM_ONLY') {
      return { target: 'ETHEREUM', reason: 'Migration mode - Ethereum only' };
    }
    
    if (this.migrationMode === 'HYBRID') {
      if (scittHealth.isHealthy && ethereumHealth.isHealthy) {
        // Both systems healthy - use SCITT CCF for new contracts, Ethereum for existing
        if (operation === 'CREATE') {
          return { target: 'SCITT_CCF', reason: 'Both systems healthy - using SCITT CCF for new contracts' };
        } else {
          return { target: 'DUAL', reason: 'Both systems healthy - using dual mode for existing contracts' };
        }
      } else if (scittHealth.isHealthy) {
        return { target: 'SCITT_CCF', reason: 'Ethereum unhealthy - using SCITT CCF' };
      } else if (ethereumHealth.isHealthy) {
        return { target: 'ETHEREUM', reason: 'SCITT CCF unhealthy - using Ethereum' };
      }
    }
    
    // Fallback to Ethereum if all else fails
    return { target: 'ETHEREUM', reason: 'Fallback to legacy system' };
  }

  /**
   * Execute operation in SCITT CCF
   */
  async executeScittCcfOperation(operation, ...args) {
    try {
      console.log(`Executing ${operation} in SCITT CCF...`);
      
      switch (operation) {
        case 'createContract':
          return await this.scittCcfService.createContract(...args);
        case 'signContract':
          return await this.scittCcfService.signContract(...args);
        case 'getContractStatus':
          return await this.scittCcfService.getContractStatus(...args);
        default:
          throw new Error(`Unknown SCITT CCF operation: ${operation}`);
      }
      
    } catch (error) {
      console.error(`SCITT CCF operation ${operation} failed:`, error);
      throw error;
    }
  }

  /**
   * Execute operation in Ethereum
   */
  async executeEthereumOperation(operation, ...args) {
    try {
      console.log(`Executing ${operation} in Ethereum...`);
      
      switch (operation) {
        case 'createContract':
          return await this.ethereumService.createContract(...args);
        case 'signContract':
          return await this.ethereumService.signContract(...args);
        case 'getContractStatus':
          return await this.ethereumService.getContract(...args);
        default:
          throw new Error(`Unknown Ethereum operation: ${operation}`);
      }
      
    } catch (error) {
      console.error(`Ethereum operation ${operation} failed:`, error);
      throw error;
    }
  }

  /**
   * Execute operation in both systems (dual mode)
   */
  async executeDualOperation(operation, ...args) {
    try {
      console.log(`Executing ${operation} in dual mode...`);
      
      let primaryResult, secondaryResult;
      
      // Execute in primary system (SCITT CCF)
      try {
        primaryResult = await this.executeScittCcfOperation(operation, ...args);
        console.log('Primary operation (SCITT CCF) successful');
      } catch (error) {
        console.warn('Primary operation (SCITT CCF) failed, trying secondary');
        primaryResult = null;
      }
      
      // Execute in secondary system (Ethereum) if primary failed
      if (!primaryResult) {
        try {
          secondaryResult = await this.executeEthereumOperation(operation, ...args);
          console.log('Secondary operation (Ethereum) successful');
        } catch (error) {
          console.error('Both primary and secondary operations failed');
          throw error;
        }
      }
      
      // Return the successful result
      const result = primaryResult || secondaryResult;
      return {
        ...result,
        source: 'DUAL',
        primaryResult: primaryResult,
        secondaryResult: secondaryResult,
        mode: 'DUAL'
      };
      
    } catch (error) {
      console.error(`Dual operation ${operation} failed:`, error);
      throw error;
    }
  }

  /**
   * Get system health status
   */
  async getSystemHealth() {
    try {
      const ethereumHealth = await this.healthMonitor.checkEthereumHealth();
      const scittCcfHealth = await this.healthMonitor.checkScittCcfHealth();
      
      return {
        ethereum: ethereumHealth,
        scittCcf: scittCcfHealth,
        overall: ethereumHealth.isHealthy || scittCcfHealth.isHealthy,
        migrationMode: this.migrationMode,
        isInitialized: this.isInitialized,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Failed to get system health:', error);
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get detailed system metrics
   */
  async getDetailedMetrics() {
    try {
      const [ethereumMetrics, scittCcfMetrics] = await Promise.allSettled([
        this.ethereumService.healthCheck(),
        this.scittCcfService.getHealthStatus()
      ]);
      
      return {
        ethereum: ethereumMetrics.status === 'fulfilled' ? ethereumMetrics.value : { error: ethereumMetrics.reason },
        scittCcf: scittCcfMetrics.status === 'fulfilled' ? scittCcfMetrics.value : { error: scittCcfMetrics.reason },
        migrationMode: this.migrationMode,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Failed to get detailed metrics:', error);
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Switch migration mode
   */
  async switchMigrationMode(newMode) {
    const validModes = ['ETHEREUM_ONLY', 'SCITT_CCF_ONLY', 'HYBRID'];
    
    if (!validModes.includes(newMode)) {
      throw new Error(`Invalid migration mode: ${newMode}. Valid modes: ${validModes.join(', ')}`);
    }
    
    const oldMode = this.migrationMode;
    this.migrationMode = newMode;
    
    console.log(`Migration mode switched from ${oldMode} to ${newMode}`);
    
    // Update environment variable
    process.env.MIGRATION_MODE = newMode;
    
    return {
      success: true,
      oldMode: oldMode,
      newMode: newMode,
      message: `Migration mode switched successfully from ${oldMode} to ${newMode}`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get current configuration
   */
  getConfiguration() {
    return {
      migrationMode: this.migrationMode,
      isInitialized: this.isInitialized,
      ethereumService: {
        enabled: this.ethereumService.blockchainEnabled,
        available: this.ethereumService.blockchainAvailable,
        mode: this.ethereumService.mode
      },
      scittCcfService: {
        enabled: this.scittCcfService.isInitialized,
        teeProvider: this.scittCcfService.teeProvider
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Test routing logic with sample data
   */
  async testRoutingLogic() {
    const testScenarios = [
      { operation: 'CREATE', data: { contractId: 'TEST-001' }, expectedTarget: 'SCITT_CCF' },
      { operation: 'SIGN', data: { contractId: 'TEST-001', partyType: 'TDP' }, expectedTarget: 'DUAL' },
      { operation: 'GET_STATUS', data: { contractId: 'TEST-001' }, expectedTarget: 'DUAL' }
    ];
    
    const results = [];
    
    for (const scenario of testScenarios) {
      try {
        const routeDecision = await this.determineRoute(scenario.operation, scenario.data);
        const isCorrect = routeDecision.target === scenario.expectedTarget;
        
        results.push({
          scenario: scenario.operation,
          expected: scenario.expectedTarget,
          actual: routeDecision.target,
          correct: isCorrect,
          reason: routeDecision.reason
        });
        
      } catch (error) {
        results.push({
          scenario: scenario.operation,
          error: error.message
        });
      }
    }
    
    return {
      testResults: results,
      successCount: results.filter(r => r.correct).length,
      totalCount: results.length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown() {
    try {
      console.log('🔄 Shutting down Contract Router Service...');
      
      // Stop health monitoring
      if (this.healthMonitor) {
        await this.healthMonitor.stopMonitoring();
      }
      
      // Cleanup test data
      if (this.scittCcfService) {
        await this.scittCcfService.cleanupTestData();
      }
      
      this.isInitialized = false;
      console.log('✅ Contract Router Service shut down successfully');
      
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    }
  }
}

module.exports = ContractRouterService;
