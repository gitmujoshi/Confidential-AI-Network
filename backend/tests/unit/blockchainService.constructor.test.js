const BlockchainService = require('../../services/blockchainService');

describe('BlockchainService Constructor', () => {
  it('should print the imported value', () => {
    console.log('BlockchainService imported value:', BlockchainService);
    console.log('Type of BlockchainService:', typeof BlockchainService);
    console.log('BlockchainService constructor:', BlockchainService.constructor);
    console.log('BlockchainService prototype:', BlockchainService.prototype);
    console.log('BlockchainService name:', BlockchainService.name);
  });

  it('should be a function (class)', () => {
    expect(typeof BlockchainService).toBe('function');
  });

  it('should instantiate without error', () => {
    const instance = new BlockchainService();
    expect(instance).toBeDefined();
    expect(typeof instance).toBe('object');
    expect(instance.constructor.name).toBe('MockBlockchainService');
  });
}); 