const { ethers } = require('ethers');
const BlockchainService = require('../services/blockchainService');
const axios = require('axios');

// Create blockchain service instance
const blockchainService = new BlockchainService();

// Test configuration
const TEST_PRIVATE_KEYS = {
  TDP: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  TDC: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  CCRP: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a'
};

const TEST_ADDRESSES = {
  TDP: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  TDC: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  CCRP: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
};

describe('BlockchainService Tests', () => {
  let testContractId;

  beforeAll(async () => {
    // Reset Hardhat node
    await axios.post('http://localhost:8545', {
      jsonrpc: '2.0',
      method: 'hardhat_reset',
      params: [],
      id: 1
    });
    // Initialize blockchain service
    await blockchainService.initialize();
    console.log('Blockchain service initialized for testing');
  });

  describe('Connection Tests', () => {
    test('should connect to blockchain', async () => {
      const isConnected = await blockchainService.isConnected();
      expect(isConnected).toBe(true);
    });
  });

  describe('Party Registration Tests', () => {
    test('should register TDP party', async () => {
      const result = await blockchainService.registerParty(
        TEST_ADDRESSES.TDP,
        'TDP',
        'Test TDP',
        'Test TDP Description',
        TEST_PRIVATE_KEYS.TDP
      );
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBeDefined();
    });

    test('should register TDC party', async () => {
      const result = await blockchainService.registerParty(
        TEST_ADDRESSES.TDC,
        'TDC',
        'Test TDC',
        'Test TDC Description',
        TEST_PRIVATE_KEYS.TDC
      );
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBeDefined();
    });

    test('should register CCRP party', async () => {
      const result = await blockchainService.registerParty(
        TEST_ADDRESSES.CCRP,
        'CCRP',
        'Test CCRP',
        'Test CCRP Description',
        TEST_PRIVATE_KEYS.CCRP
      );
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBeDefined();
    });

    test('should get registered party', async () => {
      const party = await blockchainService.getParty(TEST_ADDRESSES.TDP);
      expect(party).toBeDefined();
      expect(party.partyAddress).toBe(TEST_ADDRESSES.TDP);
      expect(party.partyType).toBe('TDP');
      expect(party.isRegistered).toBe(true);
    });

    test('should get current block number after registration', async () => {
      const blockNumber = await blockchainService.provider.getBlockNumber();
      expect(blockNumber).toBeGreaterThan(0);
    });
  });

  describe('Contract Creation Tests', () => {
    test('should create contract', async () => {
      const result = await blockchainService.createContract(
        TEST_ADDRESSES.TDP,
        'test-dataset-123',
        'test-model-456',
        100, // price in ETH
        30, // duration in days
        'Test terms and conditions',
        TEST_PRIVATE_KEYS.TDC
      );
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBeDefined();
      expect(result.contractId).toBeDefined();
      if (!result.success || !result.contractId) throw new Error('Contract creation failed');
      testContractId = result.contractId;
      console.log('Created test contract with ID:', testContractId);
    });

    test('should get created contract', async () => {
      if (!testContractId) throw new Error('No contractId from previous step');
      const contract = await blockchainService.getContract(testContractId);
      expect(contract).toBeDefined();
      expect(contract.contractId).toBe(testContractId);
      expect(contract.tdpAddress).toBe(TEST_ADDRESSES.TDP);
      expect(contract.tdcAddress).toBe(TEST_ADDRESSES.TDC);
      expect(contract.status).toBe('PENDING_TDP_APPROVAL');
      expect(contract.tdpSigned).toBe(false);
      expect(contract.ccrpSigned).toBe(false);
    });
  });

  describe('Contract Signing Tests', () => {
    test('should sign contract as TDP', async () => {
      if (!testContractId) throw new Error('No contractId from previous step');
      const result = await blockchainService.signContract(
        testContractId,
        TEST_PRIVATE_KEYS.TDP
      );
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBeDefined();
    });

    test('should verify TDP signature on contract', async () => {
      if (!testContractId) throw new Error('No contractId from previous step');
      const contract = await blockchainService.getContract(testContractId);
      expect(contract.tdpSigned).toBe(true);
      expect(contract.status).toBe('PENDING_CCRP_APPROVAL');
      expect(contract.tdpSignedAt).toBeDefined();
    });

    test('should select CCRP for contract', async () => {
      if (!testContractId) throw new Error('No contractId from previous step');
      const result = await blockchainService.selectCCRP(
        testContractId,
        TEST_ADDRESSES.CCRP,
        TEST_PRIVATE_KEYS.TDC
      );
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBeDefined();
    });

    test('should sign contract as CCRP', async () => {
      if (!testContractId) throw new Error('No contractId from previous step');
      const result = await blockchainService.signContract(
        testContractId,
        TEST_PRIVATE_KEYS.CCRP
      );
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBeDefined();
    });

    test('should verify CCRP signature and contract activation', async () => {
      if (!testContractId) throw new Error('No contractId from previous step');
      const contract = await blockchainService.getContract(testContractId);
      expect(contract.ccrpSigned).toBe(true);
      expect(contract.status).toBe('ACTIVE');
      expect(contract.ccrpSignedAt).toBeDefined();
      expect(contract.ccrpAddress).toBe(TEST_ADDRESSES.CCRP);
    });
  });

  describe('Error Handling Tests', () => {
    test('should handle invalid contract ID', async () => {
      await expect(
        blockchainService.getContract('999999')
      ).rejects.toThrow();
    });

    test('should handle signing with wrong party type', async () => {
      // Create a new contract for this test
      const createResult = await blockchainService.createContract(
        TEST_ADDRESSES.TDP,
        'test-dataset-error',
        'test-model-error',
        50,
        15,
        'Error test terms',
        TEST_PRIVATE_KEYS.TDC
      );

      // Try to sign with TDC (should fail as only TDP can sign first)
      await expect(
        blockchainService.signContract(
          createResult.contractId,
          TEST_PRIVATE_KEYS.TDC
        )
      ).rejects.toThrow();
    });

    test('should handle invalid private key', async () => {
      await expect(
        blockchainService.signContract(
          testContractId,
          '0xinvalidprivatekey'
        )
      ).rejects.toThrow();
    });
  });

  describe('Event Tests', () => {
    test('should get contract creation events', async () => {
      const events = await blockchainService.getContractEvents(
        testContractId,
        'ContractCreated'
      );
      expect(events.length).toBeGreaterThan(0);
    });

    test('should get contract signing events', async () => {
      const events = await blockchainService.getContractEvents(
        testContractId,
        'ContractSigned'
      );
      expect(events.length).toBeGreaterThan(0);
    });
  });

  describe('Party Contracts Tests', () => {
    test('should get TDP contracts', async () => {
      const contracts = await blockchainService.getPartyContracts(TEST_ADDRESSES.TDP);
      expect(Array.isArray(contracts)).toBe(true);
      expect(contracts.length).toBeGreaterThan(0);
      expect(contracts).toContain(testContractId);
    });

    test('should get TDC contracts', async () => {
      const contracts = await blockchainService.getPartyContracts(TEST_ADDRESSES.TDC);
      expect(Array.isArray(contracts)).toBe(true);
      expect(contracts.length).toBeGreaterThan(0);
      expect(contracts).toContain(testContractId);
    });

    test('should get CCRP contracts', async () => {
      const contracts = await blockchainService.getPartyContracts(TEST_ADDRESSES.CCRP);
      expect(Array.isArray(contracts)).toBe(true);
      expect(contracts.length).toBeGreaterThan(0);
      expect(contracts).toContain(testContractId);
    });
  });
}); 