const BlockchainService = require('../services/blockchainService');

// Create blockchain service instance
const blockchainService = new BlockchainService();

describe('BlockchainService Simple Tests', () => {
  beforeAll(async () => {
    try {
      await blockchainService.initialize();
      console.log('✅ Blockchain service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize blockchain service:', error);
      throw error;
    }
  });

  test('should connect to blockchain', async () => {
    const isConnected = await blockchainService.isConnected();
    console.log('Blockchain connected:', isConnected);
    expect(isConnected).toBe(true);
  });

  test('should get current block number', async () => {
    const blockNumber = await blockchainService.provider.getBlockNumber();
    console.log('Current block number:', blockNumber);
    expect(blockNumber).toBeGreaterThanOrEqual(0);
  });

  test('should get contract address', () => {
    const contractAddress = blockchainService.contractAddress;
    console.log('Contract address:', contractAddress);
    expect(contractAddress).toBeDefined();
    expect(contractAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  test('should have contract instance', () => {
    expect(blockchainService.contract).toBeDefined();
    expect(blockchainService.contract.target).toBe(blockchainService.contractAddress);
  });

  test('should have provider instance', () => {
    expect(blockchainService.provider).toBeDefined();
    // Check if provider has connection property
    if (blockchainService.provider.connection) {
      expect(blockchainService.provider.connection.url).toContain('localhost:8545');
    } else {
      // For some provider types, connection might not be available
      expect(blockchainService.provider).toBeDefined();
    }
  });
}); 