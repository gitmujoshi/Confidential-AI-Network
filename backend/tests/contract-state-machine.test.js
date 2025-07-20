/**
 * Contract State Machine Test Suite
 * 
 * This test suite validates the enhanced contract state machine implementation
 * as per our UML state diagram (5.4). It tests all state transitions,
 * validation logic, and business rules.
 * 
 * State Machine Test Coverage:
 * - Draft → PendingTDP → PendingTDC → PendingCCRP → Signed → Executing → Completed
 * - Error states: Draft → Rejected, Executing → Failed
 * - Recovery: Rejected → Draft, Failed → Draft
 */

const request = require('supertest');
const app = require('../test-server');
const db = require('../models');
const { User, Dataset, Contract } = db;
const ContractService = require('../services/contractService');

describe('Contract State Machine Tests', () => {
  let app, contractService;
  let tdcUser, tdpUser, ccrpUser;
  let testDataset;
  let testContract;

  beforeAll(async () => {
    // Initialize the app
    app = require('../server');
    contractService = new ContractService();

    // Create test users
    tdcUser = await User.create({
      name: 'Test TDC',
      email: 'tdc@test.com',
      partyType: 'TDC',
      isRegistered: true,
      isActive: true
    });

    tdpUser = await User.create({
      name: 'Test TDP',
      email: 'tdp@test.com',
      partyType: 'TDP',
      isRegistered: true,
      isActive: true
    });

    ccrpUser = await User.create({
      name: 'Test CCRP',
      email: 'ccrp@test.com',
      partyType: 'CCRP',
      isRegistered: true,
      isActive: true
    });

    // Create test dataset
    testDataset = await Dataset.create({
      datasetId: 'test-dataset-state-machine',
      name: 'Test Dataset',
      description: 'Test dataset for state machine tests',
      category: 'Tabular',
      size: 1000, // Size in MB
      recordCount: 10000,
      price: 100.00,
      license: 'MIT',
      ownerId: tdpUser.id,
      isPublic: true,
      isActive: true
    });
  });

  afterAll(async () => {
    // Cleanup test data
    if (testContract) {
      await Contract.destroy({ where: { id: testContract.id } });
    }
    if (testDataset) {
      await Dataset.destroy({ where: { id: testDataset.id } });
    }
    if (tdcUser) {
      await User.destroy({ where: { id: tdcUser.id } });
    }
    if (tdpUser) {
      await User.destroy({ where: { id: tdpUser.id } });
    }
    if (ccrpUser) {
      await User.destroy({ where: { id: ccrpUser.id } });
    }
  });

  describe('State Machine Validation', () => {
    it('should validate correct state transitions', () => {
      // Test valid transitions
      expect(contractService.validateStateTransition('DRAFT', 'PENDING_TDP')).toBe(true);
      expect(contractService.validateStateTransition('PENDING_TDP', 'PENDING_TDC')).toBe(true);
      expect(contractService.validateStateTransition('PENDING_TDC', 'PENDING_CCRP')).toBe(true);
      expect(contractService.validateStateTransition('PENDING_CCRP', 'SIGNED')).toBe(true);
      expect(contractService.validateStateTransition('SIGNED', 'EXECUTING')).toBe(true);
      expect(contractService.validateStateTransition('EXECUTING', 'COMPLETED')).toBe(true);
      expect(contractService.validateStateTransition('REJECTED', 'DRAFT')).toBe(true);
      expect(contractService.validateStateTransition('FAILED', 'DRAFT')).toBe(true);
    });

    it('should reject invalid state transitions', () => {
      // Test invalid transitions
      expect(contractService.validateStateTransition('DRAFT', 'SIGNED')).toBe(false);
      expect(contractService.validateStateTransition('PENDING_TDP', 'COMPLETED')).toBe(false);
      expect(contractService.validateStateTransition('SIGNED', 'DRAFT')).toBe(false);
      expect(contractService.validateStateTransition('COMPLETED', 'EXECUTING')).toBe(false);
    });

    it('should return valid next states', () => {
      expect(contractService.getValidNextStates('DRAFT')).toContain('PENDING_TDP');
      expect(contractService.getValidNextStates('DRAFT')).toContain('REJECTED');
      expect(contractService.getValidNextStates('SIGNED')).toContain('EXECUTING');
      expect(contractService.getValidNextStates('SIGNED')).toContain('COMPLETED');
      expect(contractService.getValidNextStates('COMPLETED')).toEqual([]);
    });
  });

  describe('Contract Creation and Draft State', () => {
    it('should create contract in DRAFT state', async () => {
      const contractData = {
        contractId: 'TEST-CONTRACT-001',
        title: 'Test Contract',
        description: 'Test contract for state machine',
        price: 100.00,
        duration: 30,
        termsAndConditions: 'Standard terms',
        contractDatasets: [{
          datasetId: testDataset.id,
          tdpId: tdpUser.id,
          datasetName: testDataset.name,
          tdpName: tdpUser.name,
          individualPrice: 100.00,
          paymentStatus: 'PENDING'
        }],
        datasetCount: 1,
        tdpCount: 1
      };

      testContract = await contractService.createContract(contractData, tdcUser.id);
      
      expect(testContract.status).toBe('DRAFT');
      expect(testContract.multiTdpStatus).toBe('DRAFT');
      expect(testContract.tdcId).toBe(tdcUser.id);
      expect(testContract.tdpId).toBe(tdpUser.id);
    });

    it('should allow editing contract in DRAFT state', async () => {
      const updatedData = {
        price: 150.00,
        totalPrice: 150.00,
        termsAndConditions: 'Updated terms and conditions'
      };

      await testContract.update(updatedData);
      
      expect(testContract.price).toBe(150.00);
      expect(testContract.status).toBe('DRAFT');
    });
  });

  describe('Contract Submission (Draft → PendingTDP)', () => {
    it('should submit contract for TDP approval', async () => {
      const updatedContract = await contractService.submitContract(testContract.contractId, tdcUser.id);
      
      expect(updatedContract.status).toBe('PENDING_TDP');
      expect(updatedContract.multiTdpStatus).toBe('PENDING_TDP');
    });

    it('should reject submission from non-TDC user', async () => {
      try {
        await contractService.submitContract(testContract.contractId, tdpUser.id);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Contract not found or not in DRAFT state');
      }
    });

    it('should reject submission of non-DRAFT contract', async () => {
      try {
        await contractService.submitContract(testContract.contractId, tdcUser.id);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Contract not found or not in DRAFT state');
      }
    });
  });

  describe('TDP Contract Signing (PendingTDP → PendingTDC)', () => {
    it('should allow TDP to sign contract', async () => {
      const signatureData = {
        signature: 'test-signature',
        message: 'Sign contract TEST-CONTRACT-001 as TDP',
        did: 'did:web:test.com:user:tdp'
      };

      const updatedContract = await contractService.tdpSignContract(
        testContract.contractId, 
        tdpUser.id, 
        signatureData
      );
      
      expect(updatedContract.status).toBe('PENDING_TDC');
      expect(updatedContract.multiTdpStatus).toBe('PENDING_TDC');
      expect(updatedContract.tdpSigned).toBe(true);
      expect(updatedContract.tdpSignedAt).not.toBeNull();
    });

    it('should reject TDP signing from non-TDP user', async () => {
      try {
        await contractService.tdpSignContract(testContract.contractId, tdcUser.id, {});
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Contract not found or not in PENDING_TDP state');
      }
    });
  });

  describe('TDC Contract Signing (PendingTDC → PendingCCRP)', () => {
    it('should allow TDC to sign contract', async () => {
      const signatureData = {
        signedTransaction: '0xtest-transaction',
        userWalletAddress: tdcUser.walletAddress
      };

      const updatedContract = await contractService.tdcSignContract(
        testContract.contractId, 
        tdcUser.id, 
        signatureData
      );
      
      expect(updatedContract.status).toBe('PENDING_CCRP');
      expect(updatedContract.multiTdpStatus).toBe('PENDING_CCRP');
    });

    it('should reject TDC signing from non-TDC user', async () => {
      try {
        await contractService.tdcSignContract(testContract.contractId, tdpUser.id, {});
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Contract not found or not in PENDING_TDC state');
      }
    });
  });

  describe('CCRP Contract Signing (PendingCCRP → Signed)', () => {
    it('should allow CCRP to sign contract', async () => {
      // First, update contract to include CCRP
      await testContract.update({ ccrpId: ccrpUser.id });

      const signatureData = {
        signature: 'test-ccrp-signature',
        message: 'Sign contract TEST-CONTRACT-001 as CCRP',
        did: 'did:web:test.com:user:ccrp'
      };

      const updatedContract = await contractService.ccrpSignContract(
        testContract.contractId, 
        ccrpUser.id, 
        signatureData
      );
      
      expect(updatedContract.status).toBe('SIGNED');
      expect(updatedContract.multiTdpStatus).toBe('SIGNED');
      expect(updatedContract.ccrpSigned).toBe(true);
      expect(updatedContract.ccrpSignedAt).not.toBeNull();
    });

    it('should reject CCRP signing from non-CCRP user', async () => {
      try {
        await contractService.ccrpSignContract(testContract.contractId, tdcUser.id, {});
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Contract not found or not in PENDING_CCRP state');
      }
    });
  });

  describe('Contract Execution (Signed → Executing → Completed)', () => {
    it('should start contract execution', async () => {
      const updatedContract = await contractService.startExecution(testContract.contractId);
      
      expect(updatedContract.status).toBe('EXECUTING');
      expect(updatedContract.multiTdpStatus).toBe('EXECUTING');
    });

    it('should complete contract execution', async () => {
      const updatedContract = await contractService.completeExecution(testContract.contractId);
      
      expect(updatedContract.status).toBe('COMPLETED');
      expect(updatedContract.multiTdpStatus).toBe('COMPLETED');
    });

    it('should reject execution start from non-SIGNED contract', async () => {
      // Create a new contract in DRAFT state
      const newContract = await contractService.createContract({
        contractId: 'EXECUTION-TEST-001',
        title: 'Execution Test Contract',
        description: 'Contract for execution testing',
        price: 150.00,
        duration: 60,
        termsAndConditions: 'Execution test terms',
        contractDatasets: [{
          datasetId: testDataset.id,
          tdpId: tdpUser.id,
          datasetName: testDataset.name,
          tdpName: tdpUser.name,
          individualPrice: 150.00,
          paymentStatus: 'PENDING'
        }],
        datasetCount: 1,
        tdpCount: 1
      }, tdcUser.id);

      try {
        await contractService.startExecution(newContract.contractId);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Contract not found or not in SIGNED state');
      }

      // Cleanup
      await newContract.destroy();
    });
  });

  describe('Contract Rejection (Any State → Rejected)', () => {
    it('should allow any party to reject contract', async () => {
      // Create a new contract for rejection testing
      const rejectionContract = await contractService.createContract({
        contractId: 'REJECTION-TEST-001',
        title: 'Rejection Test Contract',
        description: 'Contract for rejection testing',
        price: 200.00,
        duration: 45,
        termsAndConditions: 'Rejection test terms',
        contractDatasets: [{
          datasetId: testDataset.id,
          tdpId: tdpUser.id,
          datasetName: testDataset.name,
          tdpName: tdpUser.name,
          individualPrice: 200.00,
          paymentStatus: 'PENDING'
        }],
        datasetCount: 1,
        tdpCount: 1
      }, tdcUser.id);

      // Submit for approval
      await contractService.submitContract(rejectionContract.contractId, tdcUser.id);

      // TDP rejects the contract
      const rejectedContract = await contractService.rejectContract(
        rejectionContract.contractId, 
        tdpUser.id, 
        'Terms not acceptable'
      );
      
      expect(rejectedContract.status).toBe('REJECTED');
      expect(rejectedContract.multiTdpStatus).toBe('REJECTED');

      // Cleanup
      await rejectedContract.destroy();
    });

    it('should reject rejection from non-party user', async () => {
      const newUser = await User.create({
        name: 'Non-Party User',
        email: 'nonparty@test.com',
        partyType: 'TDC',
        isActive: true
      });

      try {
        await contractService.rejectContract(testContract.contractId, newUser.id, 'Test rejection');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Contract not found or user not authorized');
      }

      // Cleanup
      await newUser.destroy();
    });
  });

  describe('Contract Resubmission (Rejected → Draft)', () => {
    it('should allow TDC to resubmit rejected contract', async () => {
      // Create a rejected contract
      const rejectedContract = await contractService.createContract({
        contractId: 'RESUBMIT-TEST-001',
        title: 'Resubmit Test Contract',
        description: 'Contract for resubmission testing',
        price: 250.00,
        duration: 90,
        termsAndConditions: 'Resubmit test terms',
        contractDatasets: [{
          datasetId: testDataset.id,
          tdpId: tdpUser.id,
          datasetName: testDataset.name,
          tdpName: tdpUser.name,
          individualPrice: 250.00,
          paymentStatus: 'PENDING'
        }],
        datasetCount: 1,
        tdpCount: 1
      }, tdcUser.id);

      // Submit and reject
      await contractService.submitContract(rejectedContract.contractId, tdcUser.id);
      await contractService.rejectContract(rejectedContract.contractId, tdpUser.id, 'Rejected');

      // Resubmit with updates
      const updates = {
        price: 120.00,
        totalPrice: 120.00,
        termsAndConditions: 'Updated terms after rejection'
      };

      const resubmittedContract = await contractService.resubmitContract(
        rejectedContract.contractId, 
        tdcUser.id, 
        updates
      );
      
      expect(resubmittedContract.status).toBe('DRAFT');
      expect(resubmittedContract.multiTdpStatus).toBe('DRAFT');
      expect(resubmittedContract.price).toBe(120.00);
      expect(resubmittedContract.tdpSigned).toBe(false);
      expect(resubmittedContract.ccrpSigned).toBe(false);

      // Cleanup
      await resubmittedContract.destroy();
    });
  });

  describe('Execution Failure Handling (Executing → Failed)', () => {
    it('should handle execution failure', async () => {
      // Create a contract and get it to EXECUTING state
      const failureContract = await contractService.createContract({
        contractId: 'FAILURE-TEST-001',
        title: 'Failure Test Contract',
        description: 'Contract for failure testing',
        price: 300.00,
        duration: 120,
        termsAndConditions: 'Failure test terms',
        contractDatasets: [{
          datasetId: testDataset.id,
          tdpId: tdpUser.id,
          datasetName: testDataset.name,
          tdpName: tdpUser.name,
          individualPrice: 300.00,
          paymentStatus: 'PENDING'
        }],
        datasetCount: 1,
        tdpCount: 1
      }, tdcUser.id);

      // Go through the signing process
      await contractService.submitContract(failureContract.contractId, tdcUser.id);
      await contractService.tdpSignContract(failureContract.contractId, tdpUser.id, {});
      await contractService.tdcSignContract(failureContract.contractId, tdcUser.id, {});
      await contractService.startExecution(failureContract.contractId);

      // Handle execution failure
      const failedContract = await contractService.handleExecutionFailure(
        failureContract.contractId, 
        'Training environment failed to provision'
      );
      
      expect(failedContract.status).toBe('FAILED');
      expect(failedContract.multiTdpStatus).toBe('FAILED');

      // Cleanup
      await failedContract.destroy();
    });
  });

  describe('Contract State Information', () => {
    it('should provide accurate state information', async () => {
      const stateInfo = await contractService.getContractStateInfo(testContract.contractId);
      
      expect(stateInfo.contractId).toBe(testContract.contractId);
      expect(stateInfo.currentState).toBe('COMPLETED');
      expect(stateInfo.canEdit).toBe(false);
      expect(stateInfo.canSubmit).toBe(false);
      expect(stateInfo.canSign).toBe(false);
      expect(stateInfo.canExecute).toBe(false);
      expect(stateInfo.canReject).toBe(false);
      expect(stateInfo.canResubmit).toBe(false);
    });

    it('should provide correct permissions for DRAFT contract', async () => {
      const draftContract = await contractService.createContract({
        contractId: 'DRAFT-TEST-001',
        title: 'Draft Test Contract',
        description: 'Contract for draft testing',
        price: 350.00,
        duration: 150,
        termsAndConditions: 'Draft test terms',
        contractDatasets: [{
          datasetId: testDataset.id,
          tdpId: tdpUser.id,
          datasetName: testDataset.name,
          tdpName: tdpUser.name,
          individualPrice: 350.00,
          paymentStatus: 'PENDING'
        }],
        datasetCount: 1,
        tdpCount: 1
      }, tdcUser.id);

      const stateInfo = await contractService.getContractStateInfo(draftContract.contractId);
      
      expect(stateInfo.currentState).toBe('DRAFT');
      expect(stateInfo.canEdit).toBe(true);
      expect(stateInfo.canSubmit).toBe(true);
      expect(stateInfo.canSign).toBe(false);
      expect(stateInfo.canExecute).toBe(false);
      expect(stateInfo.canReject).toBe(false);
      expect(stateInfo.canResubmit).toBe(false);

      // Cleanup
      await draftContract.destroy();
    });
  });

  describe('API Integration Tests', () => {
    it('should handle contract creation via API', async () => {
      const response = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${tdcUser.id}`)
        .send({
          tdpId: tdpUser.id,
          datasetId: testDataset.id,
          price: 100.00,
          duration: 30,
          termsAndConditions: 'API test terms'
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('DRAFT');
    });

    it('should handle contract submission via API', async () => {
      const response = await request(app)
        .post(`/api/contracts/${testContract.contractId}/submit`)
        .set('Authorization', `Bearer ${tdcUser.id}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('PENDING_TDP');
    });
  });
}); 