const { ContractId, Money, Duration, ValidationError } = require('@contract-management/value-objects');
const ScittCcfService = require('../services/scittCcfService');

describe('SCITT CCF Service Value Objects Integration', () => {
  let scittService;

  beforeEach(() => {
    scittService = new ScittCcfService();
  });

  describe('buildClaim with Value Objects', () => {
    test('should validate contract ID', () => {
      const claimData = { contractId: 'RICARDIAN-1234567890' };
      const claim = scittService.buildClaim(claimData);
      
      expect(claim.data.contractId).toBe('RICARDIAN-1234567890');
      expect(claim.validation.contractIdValid).toBe(true);
    });

    test('should validate price', () => {
      const claimData = { price: 100.50 };
      const claim = scittService.buildClaim(claimData);
      
      expect(claim.data.price).toBe(100.50);
      expect(claim.validation.priceValid).toBe(true);
    });

    test('should validate duration', () => {
      const claimData = { duration: 30 };
      const claim = scittService.buildClaim(claimData);
      
      expect(claim.data.duration).toBe(30);
      expect(claim.validation.durationValid).toBe(true);
    });

    test('should reject invalid contract ID', () => {
      const claimData = { contractId: 'invalid-id' };
      
      expect(() => scittService.buildClaim(claimData))
        .toThrow(ValidationError);
    });

    test('should reject invalid price', () => {
      const claimData = { price: -100 };
      
      expect(() => scittService.buildClaim(claimData))
        .toThrow(ValidationError);
    });

    test('should reject invalid duration', () => {
      const claimData = { duration: -5 };
      
      expect(() => scittService.buildClaim(claimData))
        .toThrow(ValidationError);
    });

    test('should handle mixed valid and invalid data', () => {
      const claimData = {
        contractId: 'RICARDIAN-1234567890',
        price: -100, // Invalid
        duration: 30
      };
      
      expect(() => scittService.buildClaim(claimData))
        .toThrow(ValidationError);
    });
  });
});
