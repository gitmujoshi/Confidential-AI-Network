const BlockchainService = require('../../services/blockchainService');

describe('BlockchainService Simple Tests', () => {
  let blockchainService;

  beforeAll(async () => {
    blockchainService = new BlockchainService();
    await blockchainService.initialize();
  });

  it('should connect to blockchain', async () => {
    const connected = await blockchainService.isConnected();
    expect(connected).toBeDefined();
  });

  it('should get current block number', async () => {
    if (blockchainService.provider) {
      const blockNumber = await blockchainService.provider.getBlockNumber();
      expect(blockNumber).toBeDefined();
    } else {
      expect(blockchainService.provider).toBeNull();
    }
  });

  it('should get contract address', async () => {
    const contractAddress = blockchainService.contractAddress;
    expect(contractAddress).toBeDefined();
  });

  it('should have contract instance', async () => {
    const contract = blockchainService.contract;
    expect(contract).toBeDefined();
  });

  it('should have provider instance', async () => {
    const provider = blockchainService.provider;
    expect(provider).toBeDefined();
  });
}); 