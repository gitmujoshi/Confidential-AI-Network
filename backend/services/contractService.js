/**
 * Contract Service - Enhanced State Machine Implementation
 * 
 * This service implements the complete contract state machine as per UML state diagram.
 * It handles all contract lifecycle management including state transitions,
 * validation, and business logic for each state.
 * 
 * State Machine (as per UML 5.4):
 * Draft → PendingTDP → PendingTDC → PendingCCRP → Signed → Executing → Completed
 * 
 * Error States:
 * Draft → Rejected (any party can reject)
 * Executing → Failed (execution failure)
 * 
 * Recovery:
 * Rejected → Draft (TDC resubmits)
 * Failed → Draft (TDC resubmits)
 */

const { Contract, User, Dataset, AIModel } = require('../models');
const NotificationService = require('./notificationService');
const notificationService = new NotificationService();
const { DifferentialPrivacyService } = require('./differentialPrivacyService');

class ContractService {
  /** TDP id from row or legacy contract_datasets JSON */
  resolvePrimaryTdpId(contract) {
    if (!contract) return null;
    if (contract.tdpId != null) return contract.tdpId;
    if (contract.primaryTdpId != null) return contract.primaryTdpId;
    const cds = contract.contractDatasets;
    if (Array.isArray(cds) && cds.length && cds[0]?.tdpId != null) return cds[0].tdpId;
    return null;
  }

  resolvePrimaryDatasetPk(contract) {
    if (!contract) return null;
    if (contract.datasetId != null) return contract.datasetId;
    if (contract.primaryDatasetId != null) return contract.primaryDatasetId;
    const cds = contract.contractDatasets;
    if (Array.isArray(cds) && cds.length && cds[0]?.datasetId != null) {
      const raw = cds[0].datasetId;
      if (typeof raw === 'number') return raw;
    }
    return null;
  }

  constructor() {
    // Define valid state transitions as per UML state diagram
    this.stateTransitions = {
      'DRAFT': ['PENDING_TDP', 'REJECTED'],
      'PENDING_TDP': ['PENDING_TDC', 'PENDING_TDP', 'REJECTED'],
      'PENDING_TDC': ['PENDING_TSP', 'PENDING_TDC', 'REJECTED'],
      'PENDING_TSP': ['SIGNED', 'PENDING_TSP', 'REJECTED'],
      'SIGNED': ['EXECUTING', 'COMPLETED'],
      'EXECUTING': ['COMPLETED', 'FAILED'],
      'REJECTED': ['DRAFT'],
      'FAILED': ['DRAFT'],
      'COMPLETED': [] // Terminal state
    };
  }

  /**
   * Validate state transition
   * @param {string} currentState - Current contract state
   * @param {string} newState - Target state
   * @returns {boolean} - Whether transition is valid
   */
  validateStateTransition(currentState, newState) {
    const validTransitions = this.stateTransitions[currentState] || [];
    return validTransitions.includes(newState);
  }

  /**
   * Get valid next states for current state
   * @param {string} currentState - Current contract state
   * @returns {Array} - Array of valid next states
   */
  getValidNextStates(currentState) {
    return this.stateTransitions[currentState] || [];
  }

  /**
   * Create a new contract (Draft state)
   * @param {Object} contractData - Contract creation data
   * @param {number} tdcId - TDC user ID
   * @returns {Object} - Created contract
   */
  async createContract(contractData, tdcId) {
    try {
      console.log('📝 Creating new contract in DRAFT state');
      
      // Ensure contractDatasets is provided
      if (!contractData.contractDatasets || !Array.isArray(contractData.contractDatasets)) {
        throw new Error('contractDatasets is required and must be an array');
      }
      
      const first = contractData.contractDatasets[0];
      let resolvedDatasetPk = contractData.datasetId ?? contractData.primaryDatasetId;
      let resolvedTdpId = contractData.tdpId ?? contractData.primaryTdpId;

      if (first) {
        if (first.tdpId != null) {
          resolvedTdpId = resolvedTdpId ?? first.tdpId;
        }
        const rawDs = first.datasetId;
        if (rawDs != null && resolvedDatasetPk == null) {
          if (typeof rawDs === 'number' || (typeof rawDs === 'string' && /^\d+$/.test(rawDs))) {
            resolvedDatasetPk = Number(rawDs);
          } else {
            const ds = await Dataset.findOne({ where: { datasetId: String(rawDs) } });
            if (ds) resolvedDatasetPk = ds.id;
          }
        }
      }

      const payload = {};
      for (const key of Object.keys(Contract.rawAttributes)) {
        if (contractData[key] !== undefined) {
          payload[key] = contractData[key];
        }
      }

      Object.assign(payload, {
        tdcId,
        tdpId: resolvedTdpId ?? payload.tdpId,
        primaryTdpId: contractData.primaryTdpId ?? resolvedTdpId ?? payload.primaryTdpId,
        datasetId: resolvedDatasetPk ?? payload.datasetId,
        primaryDatasetId: contractData.primaryDatasetId ?? resolvedDatasetPk ?? payload.primaryDatasetId,
        status: 'DRAFT',
        multiTdpStatus: 'DRAFT'
      });

      const contract = await Contract.create(payload);

      console.log(`✅ Contract created with ID: ${contract.contractId}`);
      return contract;
    } catch (error) {
      console.error('❌ Error creating contract:', error);
      throw error;
    }
  }

  /**
   * Submit contract for TDP approval (Draft → PendingTDP)
   * @param {string} contractId - Contract ID
   * @param {number} tdcId - TDC user ID
   * @returns {Object} - Updated contract
   */
  async submitContract(contractId, tdcId) {
    try {
      console.log(`📤 Submitting contract ${contractId} for TDP approval`);
      
      const contract = await Contract.findOne({
        where: { contractId, tdcId, status: 'DRAFT' }
      });

      if (!contract) {
        throw new Error('Contract not found or not in DRAFT state');
      }

      // Validate transition
      if (!this.validateStateTransition('DRAFT', 'PENDING_TDP')) {
        throw new Error('Invalid state transition: DRAFT → PENDING_TDP');
      }

      // Update contract status
      await contract.update({
        status: 'PENDING_TDP',
        multiTdpStatus: 'PENDING_TDP'
      });

      const notifyTdpId = this.resolvePrimaryTdpId(contract);
      if (notifyTdpId != null) {
        await notificationService.createNotification({
          userId: notifyTdpId,
          type: 'CONTRACT_PENDING_APPROVAL',
          title: 'New Contract Requires Your Approval',
          message: `Contract ${contractId} has been submitted and requires your signature.`,
          metadata: { contractId, contractType: 'TDP_APPROVAL' }
        });
      }

      console.log(`✅ Contract ${contractId} submitted for TDP approval`);
      return contract;
    } catch (error) {
      console.error('❌ Error submitting contract:', error);
      throw error;
    }
  }

  /**
   * TDP signs contract (PendingTDP → PendingTDC)
   * @param {string} contractId - Contract ID
   * @param {number} tdpId - TDP user ID
   * @param {Object} signatureData - Signature data
   * @returns {Object} - Updated contract
   */
  async tdpSignContract(contractId, tdpId, signatureData) {
    try {
      console.log(`✍️ TDP ${tdpId} signing contract ${contractId}`);
      
      const contract = await Contract.findOne({
        where: { contractId, status: 'PENDING_TDP' }
      });
      if (contract && Number(this.resolvePrimaryTdpId(contract)) !== Number(tdpId)) {
        throw new Error('Contract not found or not in PENDING_TDP state');
      }

      if (!contract) {
        throw new Error('Contract not found or not in PENDING_TDP state');
      }

      // Validate transition
      if (!this.validateStateTransition('PENDING_TDP', 'PENDING_TDC')) {
        throw new Error('Invalid state transition: PENDING_TDP → PENDING_TDC');
      }

      // Update contract with TDP signature
      await contract.update({
        status: 'PENDING_TDC',
        multiTdpStatus: 'PENDING_TDC',
        tdpSigned: true,
        tdpSignedAt: new Date()
      });

      // Notify TDC
      await notificationService.createNotification({
        userId: contract.tdcId,
        type: 'CONTRACT_TDP_SIGNED',
        title: 'TDP Has Signed Contract',
        message: `Contract ${contractId} has been signed by TDP. Your signature is now required.`,
        metadata: { contractId, contractType: 'TDC_SIGNATURE_REQUIRED' }
      });

      console.log(`✅ TDP signed contract ${contractId}`);
      return contract;
    } catch (error) {
      console.error('❌ Error with TDP contract signing:', error);
      throw error;
    }
  }

  /**
   * TDC signs contract (PendingTDC → PendingCCRP)
   * @param {string} contractId - Contract ID
   * @param {number} tdcId - TDC user ID
   * @param {Object} signatureData - Signature data
   * @returns {Object} - Updated contract
   */
  async tdcSignContract(contractId, tdcId, signatureData) {
    try {
      console.log(`✍️ TDC ${tdcId} signing contract ${contractId}`);
      
      const contract = await Contract.findOne({
        where: { contractId, tdcId, status: 'PENDING_TDC' }
      });

      if (!contract) {
        throw new Error('Contract not found or not in PENDING_TDC state');
      }

      // Validate transition
      if (!this.validateStateTransition('PENDING_TDC', 'PENDING_TSP')) {
        throw new Error('Invalid state transition: PENDING_TDC → PENDING_TSP');
      }

      // Update contract with TDC signature
      await contract.update({
        status: 'PENDING_TSP',
        multiTdpStatus: 'PENDING_TSP',
        tdcSigned: true,
        tdcSignedAt: new Date()
      });

      // Notify TSP if present
      if (contract.tspId) {
        await notificationService.createNotification({
          userId: contract.tspId,
          type: 'CONTRACT_PENDING_TSP',
          title: 'Contract Requires TSP Approval',
          message: `Contract ${contractId} has been signed by all parties and requires TSP approval.`,
          metadata: { contractId, contractType: 'CCRP_APPROVAL' }
        });
      }

      console.log(`✅ TDC signed contract ${contractId}`);
      return contract;
    } catch (error) {
      console.error('❌ Error with TDC contract signing:', error);
      throw error;
    }
  }

  /**
   * TSP signs contract (PendingCCRP → Signed)
   * @param {string} contractId - Contract ID
   * @param {number} tspId - TSP user ID
   * @param {Object} signatureData - Signature data
   * @returns {Object} - Updated contract
   */
  async ccrpSignContract(contractId, tspId, signatureData) {
    try {
      console.log(`✍️ TSP ${tspId} signing contract ${contractId}`);
      
      const contract = await Contract.findOne({
        where: { contractId, tspId, status: 'PENDING_TSP' }
      });

      if (!contract) {
        throw new Error('Contract not found or not in PENDING_TSP state');
      }

      // Validate transition
      if (!this.validateStateTransition('PENDING_TSP', 'SIGNED')) {
        throw new Error('Invalid state transition: PENDING_TSP → SIGNED');
      }

      // Update contract with TSP signature
      await contract.update({
        status: 'SIGNED',
        multiTdpStatus: 'SIGNED',
        tspSigned: true,
        tspSignedAt: new Date()
      });

      // Notify all parties
      await notificationService.createNotification({
        userId: contract.tdcId,
        type: 'CONTRACT_SIGNED',
        title: 'Contract Fully Signed',
        message: `Contract ${contractId} has been signed by all parties and is ready for execution.`,
        metadata: { contractId, contractType: 'CONTRACT_READY' }
      });

      const tdpNotify = this.resolvePrimaryTdpId(contract);
      if (tdpNotify != null) {
        await notificationService.createNotification({
          userId: tdpNotify,
          type: 'CONTRACT_SIGNED',
          title: 'Contract Fully Signed',
          message: `Contract ${contractId} has been signed by all parties and is ready for execution.`,
          metadata: { contractId, contractType: 'CONTRACT_READY' }
        });
      }

      console.log(`✅ TSP signed contract ${contractId}`);
      return contract;
    } catch (error) {
      console.error('❌ Error with TSP contract signing:', error);
      throw error;
    }
  }

  /**
   * Start contract execution (Signed → Executing)
   * @param {string} contractId - Contract ID
   * @returns {Object} - Updated contract
   */
  async startExecution(contractId) {
    try {
      console.log(`🚀 Starting execution for contract ${contractId}`);
      
      const contract = await Contract.findOne({
        where: { contractId, status: 'SIGNED' }
      });

      if (!contract) {
        throw new Error('Contract not found or not in SIGNED state');
      }

      // Validate transition
      if (!this.validateStateTransition('SIGNED', 'EXECUTING')) {
        throw new Error('Invalid state transition: SIGNED → EXECUTING');
      }

      // Update contract status
      await contract.update({
        status: 'EXECUTING',
        multiTdpStatus: 'EXECUTING'
      });

      const parties = [contract.tdcId, this.resolvePrimaryTdpId(contract)];
      if (contract.tspId) parties.push(contract.tspId);

      for (const partyId of parties.filter((id) => id != null)) {
        await notificationService.createNotification({
          userId: partyId,
          type: 'CONTRACT_EXECUTING',
          title: 'Contract Execution Started',
          message: `Contract ${contractId} execution has begun.`,
          metadata: { contractId, contractType: 'EXECUTION_STARTED' }
        });
      }

      console.log(`✅ Contract ${contractId} execution started`);
      return contract;
    } catch (error) {
      console.error('❌ Error starting contract execution:', error);
      throw error;
    }
  }

  /**
   * Complete contract execution (Executing → Completed)
   * @param {string} contractId - Contract ID
   * @returns {Object} - Updated contract
   */
  async completeExecution(contractId) {
    try {
      console.log(`✅ Completing execution for contract ${contractId}`);
      
      const contract = await Contract.findOne({
        where: { contractId, status: 'EXECUTING' }
      });

      if (!contract) {
        throw new Error('Contract not found or not in EXECUTING state');
      }

      // Validate transition
      if (!this.validateStateTransition('EXECUTING', 'COMPLETED')) {
        throw new Error('Invalid state transition: EXECUTING → COMPLETED');
      }

      // Update contract status
      await contract.update({
        status: 'COMPLETED',
        multiTdpStatus: 'COMPLETED'
      });

      const parties = [contract.tdcId, this.resolvePrimaryTdpId(contract)];
      if (contract.tspId) parties.push(contract.tspId);

      for (const partyId of parties.filter((id) => id != null)) {
        await notificationService.createNotification({
          userId: partyId,
          type: 'CONTRACT_COMPLETED',
          title: 'Contract Execution Completed',
          message: `Contract ${contractId} has been successfully completed.`,
          metadata: { contractId, contractType: 'EXECUTION_COMPLETED' }
        });
      }

      console.log(`✅ Contract ${contractId} execution completed`);
      return contract;
    } catch (error) {
      console.error('❌ Error completing contract execution:', error);
      throw error;
    }
  }

  /**
   * Reject contract (any state → Rejected)
   * @param {string} contractId - Contract ID
   * @param {number} userId - User ID rejecting the contract
   * @param {string} reason - Reason for rejection
   * @returns {Object} - Updated contract
   */
  async rejectContract(contractId, userId, reason) {
    try {
      console.log(`❌ User ${userId} rejecting contract ${contractId}`);
      
      const contract = await Contract.findOne({
        where: { 
          contractId,
          [require('../models').Sequelize.Op.or]: [
            { tdcId: userId },
            { tdpId: userId },
            { primaryTdpId: userId },
            { tspId: userId }
          ]
        }
      });

      if (!contract) {
        throw new Error('Contract not found or user not authorized');
      }

      // Validate transition
      if (!this.validateStateTransition(contract.status, 'REJECTED')) {
        throw new Error(`Invalid state transition: ${contract.status} → REJECTED`);
      }

      // Update contract status
      await contract.update({
        status: 'REJECTED',
        multiTdpStatus: 'REJECTED'
      });

      // Notify TDC about rejection
      await notificationService.createNotification({
        userId: contract.tdcId,
        type: 'CONTRACT_REJECTED',
        title: 'Contract Rejected',
        message: `Contract ${contractId} has been rejected. Reason: ${reason}`,
        metadata: { contractId, contractType: 'CONTRACT_REJECTED', reason }
      });

      console.log(`✅ Contract ${contractId} rejected`);
      return contract;
    } catch (error) {
      console.error('❌ Error rejecting contract:', error);
      throw error;
    }
  }

  /**
   * Handle execution failure (Executing → Failed)
   * @param {string} contractId - Contract ID
   * @param {string} error - Error details
   * @returns {Object} - Updated contract
   */
  async handleExecutionFailure(contractId, error) {
    try {
      console.log(`💥 Handling execution failure for contract ${contractId}`);
      
      const contract = await Contract.findOne({
        where: { contractId, status: 'EXECUTING' }
      });

      if (!contract) {
        throw new Error('Contract not found or not in EXECUTING state');
      }

      // Validate transition
      if (!this.validateStateTransition('EXECUTING', 'FAILED')) {
        throw new Error('Invalid state transition: EXECUTING → FAILED');
      }

      // Update contract status
      await contract.update({
        status: 'FAILED',
        multiTdpStatus: 'FAILED'
      });

      const parties = [contract.tdcId, this.resolvePrimaryTdpId(contract)];
      if (contract.tspId) parties.push(contract.tspId);

      for (const partyId of parties.filter((id) => id != null)) {
        await notificationService.createNotification({
          userId: partyId,
          type: 'CONTRACT_FAILED',
          title: 'Contract Execution Failed',
          message: `Contract ${contractId} execution has failed. Error: ${error}`,
          metadata: { contractId, contractType: 'EXECUTION_FAILED', error }
        });
      }

      console.log(`✅ Contract ${contractId} marked as failed`);
      return contract;
    } catch (error) {
      console.error('❌ Error handling execution failure:', error);
      throw error;
    }
  }

  /**
   * Resubmit rejected contract (Rejected → Draft)
   * @param {string} contractId - Contract ID
   * @param {number} tdcId - TDC user ID
   * @param {Object} updates - Contract updates
   * @returns {Object} - Updated contract
   */
  async resubmitContract(contractId, tdcId, updates) {
    try {
      console.log(`📝 Resubmitting contract ${contractId}`);
      
      const contract = await Contract.findOne({
        where: { contractId, tdcId, status: 'REJECTED' }
      });

      if (!contract) {
        throw new Error('Contract not found or not in REJECTED state');
      }

      // Validate transition
      if (!this.validateStateTransition('REJECTED', 'DRAFT')) {
        throw new Error('Invalid state transition: REJECTED → DRAFT');
      }

      // Update contract with new data and reset to DRAFT
      await contract.update({
        ...updates,
        status: 'DRAFT',
        multiTdpStatus: 'DRAFT',
        tdpSigned: false,
        tdcSigned: false,
        tspSigned: false,
        tdpSignedAt: null,
        tdcSignedAt: null,
        tspSignedAt: null
      });

      console.log(`✅ Contract ${contractId} resubmitted as DRAFT`);
      return contract;
    } catch (error) {
      console.error('❌ Error resubmitting contract:', error);
      throw error;
    }
  }

  /**
   * Apply differential privacy to contract data
   */
  async applyDPToContractData(contractId, dataType, queryParams) {
    try {
      console.log(`🔐 Applying DP to ${dataType} for contract ${contractId}`);
      
      const contract = await this.getContract(contractId);
      const dpService = new DifferentialPrivacyService();
      
      // Check if DP is enabled for this contract
      if (!contract.privacyRequirements?.differentialPrivacy?.enabled) {
        throw new Error('Differential privacy not enabled for this contract');
      }
      
      // Get data based on type
      let data;
      switch (dataType) {
        case 'DATASET_STATS':
          data = await this.getDatasetStatistics(
            this.resolvePrimaryDatasetPk(contract) ?? contract.datasetId
          );
          break;
        case 'MODEL_METRICS':
          data = await this.getModelMetrics(contract.modelId);
          break;
        case 'TRAINING_RESULTS':
          data = await this.getTrainingResults(contractId);
          break;
        case 'CONTRACT_ANALYTICS':
          data = await this.getContractAnalytics(contractId);
          break;
        default:
          throw new Error(`Unknown data type: ${dataType}`);
      }
      
      // Apply differential privacy
      const dpResult = await dpService.applyDifferentialPrivacy(
        data,
        {
          type: queryParams.queryType || 'AGGREGATE',
          parameters: queryParams
        },
        {
          contractId: contract.contractId,
          epsilon: contract.privacyRequirements.differentialPrivacy.epsilon,
          delta: contract.privacyRequirements.differentialPrivacy.delta,
          mechanism: contract.privacyRequirements.differentialPrivacy.mechanism || 'laplace'
        }
      );
      
      console.log(`✅ DP applied to ${dataType} successfully`);
      
      return {
        success: true,
        data: dpResult.result,
        privacyMetrics: dpResult.privacyMetrics,
        originalDataSize: Array.isArray(data) ? data.length : 1,
        dpDataSize: Array.isArray(dpResult.result) ? dpResult.result.length : 1
      };
      
    } catch (error) {
      console.error(`❌ Failed to apply DP to ${dataType}:`, error);
      throw error;
    }
  }

  /**
   * Get dataset statistics with optional differential privacy
   */
  async getDatasetStatistics(datasetId, applyDP = false, privacyParams = null) {
    try {
      const db = require('../models');
      const dataset = await db.Dataset.findByPk(datasetId);
      
      if (!dataset) {
        throw new Error(`Dataset not found: ${datasetId}`);
      }
      
      // Mock dataset statistics - in production this would compute actual stats
      const stats = {
        totalRecords: 10000,
        features: 15,
        missingValues: 150,
        dataTypes: {
          numeric: 10,
          categorical: 3,
          text: 2
        },
        distributions: {
          mean: 0.5,
          std: 0.3,
          min: 0.0,
          max: 1.0
        }
      };
      
      if (applyDP && privacyParams) {
        const dpService = new DifferentialPrivacyService();
        
        const dpResult = await dpService.applyDifferentialPrivacy(
          stats,
          {
            type: 'AGGREGATE',
            parameters: { dataType: 'STATISTICS' }
          },
          privacyParams
        );
        
        return {
          original: stats,
          dpProtected: dpResult.result,
          privacyMetrics: dpResult.privacyMetrics
        };
      }
      
      return stats;
      
    } catch (error) {
      console.error('Failed to get dataset statistics:', error);
      throw error;
    }
  }

  /**
   * Get model metrics with optional differential privacy
   */
  async getModelMetrics(modelId, applyDP = false, privacyParams = null) {
    try {
      const db = require('../models');
      const model = await db.AIModel.findByPk(modelId);
      
      if (!model) {
        throw new Error(`Model not found: ${modelId}`);
      }
      
      // Mock model metrics - in production this would compute actual metrics
      const metrics = {
        accuracy: 0.85,
        precision: 0.82,
        recall: 0.88,
        f1Score: 0.85,
        auc: 0.92,
        trainingTime: 120,
        inferenceTime: 0.05
      };
      
      if (applyDP && privacyParams) {
        const dpService = new DifferentialPrivacyService();
        
        const dpResult = await dpService.applyDifferentialPrivacy(
          metrics,
          {
            type: 'AGGREGATE',
            parameters: { dataType: 'MODEL_METRICS' }
          },
          privacyParams
        );
        
        return {
          original: metrics,
          dpProtected: dpResult.result,
          privacyMetrics: dpResult.privacyMetrics
        };
      }
      
      return metrics;
      
    } catch (error) {
      console.error('Failed to get model metrics:', error);
      throw error;
    }
  }

  /**
   * Get training results with optional differential privacy
   */
  async getTrainingResults(contractId, applyDP = false, privacyParams = null) {
    try {
      const db = require('../models');
      const contract = await db.Contract.findOne({
        where: { contractId }
      });
      
      if (!contract) {
        throw new Error(`Contract not found: ${contractId}`);
      }
      
      // Mock training results - in production this would get actual results
      const results = {
        epochs: 100,
        finalLoss: 0.15,
        validationAccuracy: 0.87,
        trainingTime: 1800,
        convergenceEpoch: 85,
        learningCurve: Array.from({length: 100}, (_, i) => ({
          epoch: i + 1,
          loss: Math.max(0.1, 1.0 - (i * 0.009)),
          accuracy: Math.min(0.9, 0.5 + (i * 0.004))
        }))
      };
      
      if (applyDP && privacyParams) {
        const dpService = new DifferentialPrivacyService();
        
        const dpResult = await dpService.applyDifferentialPrivacy(
          results,
          {
            type: 'AGGREGATE',
            parameters: { dataType: 'TRAINING_RESULTS' }
          },
          privacyParams
        );
        
        return {
          original: results,
          dpProtected: dpResult.result,
          privacyMetrics: dpResult.privacyMetrics
        };
      }
      
      return results;
      
    } catch (error) {
      console.error('Failed to get training results:', error);
      throw error;
    }
  }

  /**
   * Get contract analytics with optional differential privacy
   */
  async getContractAnalytics(contractId, applyDP = false, privacyParams = null) {
    try {
      const db = require('../models');
      const contract = await db.Contract.findOne({
        where: { contractId }
      });
      
      if (!contract) {
        throw new Error(`Contract not found: ${contractId}`);
      }
      
      // Mock contract analytics - in production this would compute actual analytics
      const analytics = {
        contractValue: 50000,
        executionTime: 7200,
        resourceUtilization: 0.75,
        costBreakdown: {
          compute: 30000,
          storage: 15000,
          network: 5000
        },
        performanceMetrics: {
          throughput: 1000,
          latency: 0.05,
          availability: 0.999
        }
      };
      
      if (applyDP && privacyParams) {
        const dpService = new DifferentialPrivacyService();
        
        const dpResult = await dpService.applyDifferentialPrivacy(
          analytics,
          {
            type: 'AGGREGATE',
            parameters: { dataType: 'CONTRACT_ANALYTICS' }
          },
          privacyParams
        );
        
        return {
          original: analytics,
          dpProtected: dpResult.result,
          privacyMetrics: dpResult.privacyMetrics
        };
      }
      
      return analytics;
      
    } catch (error) {
      console.error('Failed to get contract analytics:', error);
      throw error;
    }
  }

  /**
   * Get contract by ID with full details including datasets and users
   */
  async getContract(contractId) {
    try {
      const db = require('../models');
      const contract = await db.Contract.findOne({
        where: { contractId },
        include: [
          { 
            model: db.User, 
            as: 'tdc', 
            attributes: ['id', 'name', 'email', 'depaId', 'walletAddress', 'did'],
            required: false
          },
          { 
            model: db.User, 
            as: 'tsp', 
            attributes: ['id', 'name', 'email', 'depaId', 'walletAddress', 'did'],
            required: false
          }
        ]
      });
      
      if (!contract) {
        throw new Error(`Contract not found: ${contractId}`);
      }
      
      // Parse JSON fields if they exist and are strings
      const contractData = contract.toJSON();
      
      // Ensure datasetSelections is properly parsed
      if (contractData.datasetSelections && typeof contractData.datasetSelections === 'string') {
        try {
          contractData.datasetSelections = JSON.parse(contractData.datasetSelections);
        } catch (parseError) {
          console.warn('Failed to parse datasetSelections JSON:', parseError);
          contractData.datasetSelections = [];
        }
      }
      
      // Ensure other JSON fields are properly parsed
      if (contractData.environmentSpecs && typeof contractData.environmentSpecs === 'string') {
        try {
          contractData.environmentSpecs = JSON.parse(contractData.environmentSpecs);
        } catch (parseError) {
          console.warn('Failed to parse environmentSpecs JSON:', parseError);
          contractData.environmentSpecs = {};
        }
      }
      
      if (contractData.trainingParams && typeof contractData.trainingParams === 'string') {
        try {
          contractData.trainingParams = JSON.parse(contractData.trainingParams);
        } catch (parseError) {
          console.warn('Failed to parse trainingParams JSON:', parseError);
          contractData.trainingParams = {};
        }
      }

      if (contractData.kmsConfigs && typeof contractData.kmsConfigs === 'string') {
        try {
          contractData.kmsConfigs = JSON.parse(contractData.kmsConfigs);
        } catch (parseError) {
          console.warn('Failed to parse kmsConfigs JSON:', parseError);
          contractData.kmsConfigs = {};
        }
      }
      
      if (contractData.legalDocument && typeof contractData.legalDocument === 'string') {
        try {
          contractData.legalDocument = JSON.parse(contractData.legalDocument);
        } catch (parseError) {
          console.warn('Failed to parse legalDocument JSON:', parseError);
          contractData.legalDocument = {};
        }
      }
      
      // If contractDatasets is missing data but we have counts, try to reconstruct
      if ((!contractData.contractDatasets || contractData.contractDatasets.length < contractData.datasetCount) && contractData.datasetId) {
        try {
          const dataset = await db.Dataset.findOne({
            where: { id: contractData.datasetId },
            include: [{ 
              model: db.User, 
              as: 'owner', 
              attributes: ['id', 'name', 'email', 'depaId', 'walletAddress', 'did'] 
            }]
          });
          
          if (dataset) {
            contractData.contractDatasets = [{
              datasetId: dataset.datasetId,
              datasetName: dataset.name,
              description: dataset.description,
              category: dataset.category,
              size: dataset.size,
              recordCount: dataset.recordCount,
              license: dataset.license,
              tags: dataset.tags || [],
              depaId: dataset.depaId,
              individualPrice: contractData.price,
              tdpId: dataset.owner.id,
              tdpName: dataset.owner.name,
              tdp: {
                id: dataset.owner.id,
                name: dataset.owner.name,
                email: dataset.owner.email,
                depaId: dataset.owner.depaId,
                walletAddress: dataset.owner.walletAddress,
                did: dataset.owner.did
              }
            }];
          }
        } catch (datasetError) {
          console.warn('Failed to fetch dataset information for contract:', datasetError);
        }
      }
      
      // Also ensure contractDatasets is parsed if it's a string
      if (contractData.contractDatasets && typeof contractData.contractDatasets === 'string') {
        try {
          contractData.contractDatasets = JSON.parse(contractData.contractDatasets);
        } catch (parseError) {
          console.warn('Failed to parse contractDatasets JSON:', parseError);
          contractData.contractDatasets = [];
        }
      }
      
      return contractData;
      
    } catch (error) {
      console.error('Failed to get contract:', error);
      throw error;
    }
  }

  /**
   * Get contracts by status
   * @param {string} status - Contract status
   * @returns {Array} - Array of contracts
   */
  async getContractsByStatus(status) {
    try {
      const contracts = await Contract.findAll({
        where: { status },
        include: [
          { model: User, as: 'tdp', attributes: ['id', 'name', 'email', 'depaId'] },
          { model: User, as: 'tdc', attributes: ['id', 'name', 'email', 'depaId'] },
          { model: User, as: 'tsp', attributes: ['id', 'name', 'email', 'depaId'] }
        ],
        order: [['createdAt', 'DESC']]
      });

      return contracts;
    } catch (error) {
      console.error('❌ Error getting contracts by status:', error);
      throw error;
    }
  }

  /**
   * Get contract state machine info
   * @param {string} contractId - Contract ID
   * @returns {Object} - State machine information
   */
  async getContractStateInfo(contractId) {
    try {
      const contract = await this.getContract(contractId);
      const validNextStates = this.getValidNextStates(contract.status);
      
      return {
        contractId,
        currentState: contract.status,
        validNextStates,
        canEdit: contract.status === 'DRAFT',
        canSubmit: contract.status === 'DRAFT',
        canSign: ['PENDING_TDP', 'PENDING_TDC', 'PENDING_TSP'].includes(contract.status),
        canExecute: contract.status === 'SIGNED',
        canReject: ['PENDING_TDP', 'PENDING_TDC', 'PENDING_TSP'].includes(contract.status),
        canResubmit: ['REJECTED', 'FAILED'].includes(contract.status)
      };
    } catch (error) {
      console.error('❌ Error getting contract state info:', error);
      throw error;
    }
  }
}

module.exports = ContractService; 