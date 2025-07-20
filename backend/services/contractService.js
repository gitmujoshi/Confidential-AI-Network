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

class ContractService {
  constructor() {
    // Define valid state transitions as per UML state diagram
    this.stateTransitions = {
      'DRAFT': ['PENDING_TDP', 'REJECTED'],
      'PENDING_TDP': ['PENDING_TDC', 'PENDING_TDP', 'REJECTED'],
      'PENDING_TDC': ['PENDING_CCRP', 'PENDING_TDC', 'REJECTED'],
      'PENDING_CCRP': ['SIGNED', 'PENDING_CCRP', 'REJECTED'],
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
      
      const contract = await Contract.create({
        ...contractData,
        tdcId,
        status: 'DRAFT',
        multiTdpStatus: 'DRAFT'
      });

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

      // Notify TDP
      await notificationService.createNotification({
        userId: contract.tdpId,
        type: 'CONTRACT_PENDING_APPROVAL',
        title: 'New Contract Requires Your Approval',
        message: `Contract ${contractId} has been submitted and requires your signature.`,
        metadata: { contractId, contractType: 'TDP_APPROVAL' }
      });

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
        where: { contractId, tdpId, status: 'PENDING_TDP' }
      });

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
      if (!this.validateStateTransition('PENDING_TDC', 'PENDING_CCRP')) {
        throw new Error('Invalid state transition: PENDING_TDC → PENDING_CCRP');
      }

      // Update contract with TDC signature
      await contract.update({
        status: 'PENDING_CCRP',
        multiTdpStatus: 'PENDING_CCRP'
      });

      // Notify CCRP if present
      if (contract.ccrpId) {
        await notificationService.createNotification({
          userId: contract.ccrpId,
          type: 'CONTRACT_PENDING_CCRP',
          title: 'Contract Requires CCRP Approval',
          message: `Contract ${contractId} has been signed by all parties and requires CCRP approval.`,
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
   * CCRP signs contract (PendingCCRP → Signed)
   * @param {string} contractId - Contract ID
   * @param {number} ccrpId - CCRP user ID
   * @param {Object} signatureData - Signature data
   * @returns {Object} - Updated contract
   */
  async ccrpSignContract(contractId, ccrpId, signatureData) {
    try {
      console.log(`✍️ CCRP ${ccrpId} signing contract ${contractId}`);
      
      const contract = await Contract.findOne({
        where: { contractId, ccrpId, status: 'PENDING_CCRP' }
      });

      if (!contract) {
        throw new Error('Contract not found or not in PENDING_CCRP state');
      }

      // Validate transition
      if (!this.validateStateTransition('PENDING_CCRP', 'SIGNED')) {
        throw new Error('Invalid state transition: PENDING_CCRP → SIGNED');
      }

      // Update contract with CCRP signature
      await contract.update({
        status: 'SIGNED',
        multiTdpStatus: 'SIGNED',
        ccrpSigned: true,
        ccrpSignedAt: new Date()
      });

      // Notify all parties
      await notificationService.createNotification({
        userId: contract.tdcId,
        type: 'CONTRACT_SIGNED',
        title: 'Contract Fully Signed',
        message: `Contract ${contractId} has been signed by all parties and is ready for execution.`,
        metadata: { contractId, contractType: 'CONTRACT_READY' }
      });

      await notificationService.createNotification({
        userId: contract.tdpId,
        type: 'CONTRACT_SIGNED',
        title: 'Contract Fully Signed',
        message: `Contract ${contractId} has been signed by all parties and is ready for execution.`,
        metadata: { contractId, contractType: 'CONTRACT_READY' }
      });

      console.log(`✅ CCRP signed contract ${contractId}`);
      return contract;
    } catch (error) {
      console.error('❌ Error with CCRP contract signing:', error);
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

      // Notify all parties
      const parties = [contract.tdcId, contract.tdpId];
      if (contract.ccrpId) parties.push(contract.ccrpId);

      for (const partyId of parties) {
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

      // Notify all parties
      const parties = [contract.tdcId, contract.tdpId];
      if (contract.ccrpId) parties.push(contract.ccrpId);

      for (const partyId of parties) {
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
            { ccrpId: userId }
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

      // Notify all parties
      const parties = [contract.tdcId, contract.tdpId];
      if (contract.ccrpId) parties.push(contract.ccrpId);

      for (const partyId of parties) {
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
        ccrpSigned: false,
        tdpSignedAt: null,
        ccrpSignedAt: null
      });

      console.log(`✅ Contract ${contractId} resubmitted as DRAFT`);
      return contract;
    } catch (error) {
      console.error('❌ Error resubmitting contract:', error);
      throw error;
    }
  }

  /**
   * Get contract by ID with full details
   * @param {string} contractId - Contract ID
   * @returns {Object} - Contract with associations
   */
  async getContract(contractId) {
    try {
      const contract = await Contract.findOne({
        where: { contractId },
        include: [
          { model: User, as: 'tdp', attributes: ['id', 'name', 'email', 'walletAddress'] },
          { model: User, as: 'tdc', attributes: ['id', 'name', 'email', 'walletAddress'] },
          { model: User, as: 'ccrp', attributes: ['id', 'name', 'email', 'walletAddress'] },
          { model: Dataset, as: 'dataset', attributes: ['id', 'name', 'description', 'category'] }
        ]
      });

      if (!contract) {
        throw new Error('Contract not found');
      }

      return contract;
    } catch (error) {
      console.error('❌ Error getting contract:', error);
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
          { model: User, as: 'tdp', attributes: ['id', 'name', 'email'] },
          { model: User, as: 'tdc', attributes: ['id', 'name', 'email'] },
          { model: User, as: 'ccrp', attributes: ['id', 'name', 'email'] }
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
        canSign: ['PENDING_TDP', 'PENDING_TDC', 'PENDING_CCRP'].includes(contract.status),
        canExecute: contract.status === 'SIGNED',
        canReject: ['PENDING_TDP', 'PENDING_TDC', 'PENDING_CCRP'].includes(contract.status),
        canResubmit: ['REJECTED', 'FAILED'].includes(contract.status)
      };
    } catch (error) {
      console.error('❌ Error getting contract state info:', error);
      throw error;
    }
  }
}

module.exports = ContractService; 