const { ContractId, Money, Duration, ValidationError } = require('@contract-management/value-objects');
const ContractValidationService = require('../services/contractValidationService');

describe('Value Objects Integration Tests', () => {
  let validationService;

  beforeEach(() => {
    validationService = new ContractValidationService();
  });

  describe('ContractId Value Object', () => {
    test('should create valid contract ID', () => {
      const contractId = new ContractId('RICARDIAN-1234567890');
      expect(contractId.value).toBe('RICARDIAN-1234567890');
    });

    test('should generate valid contract ID', () => {
      const contractId = ContractId.generate();
      expect(contractId.value).toMatch(/^RICARDIAN-\d+-[a-z0-9]+$/);
    });

    test('should reject invalid contract ID format', () => {
      expect(() => new ContractId('invalid-id')).toThrow(ValidationError);
      expect(() => new ContractId('RICARDIAN-')).toThrow(ValidationError);
      expect(() => new ContractId('RICARDIAN-123')).toThrow(ValidationError);
    });

    test('should reject null or undefined', () => {
      expect(() => new ContractId(null)).toThrow(ValidationError);
      expect(() => new ContractId(undefined)).toThrow(ValidationError);
    });
  });

  describe('Money Value Object', () => {
    test('should create valid money', () => {
      const money = new Money(100.50, 'USD');
      expect(money.amount).toBe(100.50);
      expect(money.currency).toBe('USD');
    });

    test('should normalize decimal places', () => {
      const money = new Money(100.567, 'USD');
      expect(money.amount).toBe(100.57);
    });

    test('should reject negative amounts', () => {
      expect(() => new Money(-100)).toThrow(ValidationError);
    });

    test('should reject invalid currencies', () => {
      expect(() => new Money(100, 'INVALID')).toThrow(ValidationError);
    });

    test('should perform mathematical operations', () => {
      const money1 = new Money(100, 'USD');
      const money2 = new Money(50, 'USD');
      
      const added = money1.add(money2);
      expect(added.amount).toBe(150);
      
      const subtracted = money1.subtract(money2);
      expect(subtracted.amount).toBe(50);
      
      const multiplied = money1.multiply(2);
      expect(multiplied.amount).toBe(200);
    });

    test('should reject operations with different currencies', () => {
      const usdMoney = new Money(100, 'USD');
      const eurMoney = new Money(100, 'EUR');
      
      expect(() => usdMoney.add(eurMoney)).toThrow(ValidationError);
      expect(() => usdMoney.subtract(eurMoney)).toThrow(ValidationError);
    });
  });

  describe('Duration Value Object', () => {
    test('should create valid duration', () => {
      const duration = new Duration(30, 'DAYS');
      expect(duration.durationValue).toBe(30);
      expect(duration.unit).toBe('DAYS');
    });

    test('should reject negative duration', () => {
      expect(() => new Duration(-5)).toThrow(ValidationError);
    });

    test('should reject non-integer duration', () => {
      expect(() => new Duration(5.5)).toThrow(ValidationError);
    });

    test('should convert between units', () => {
      const duration = new Duration(1, 'DAYS');
      expect(duration.toHours()).toBe(24);
      expect(duration.toMinutes()).toBe(1440);
    });

    test('should perform addition', () => {
      const duration1 = new Duration(30, 'DAYS');
      const duration2 = new Duration(7, 'DAYS');
      const added = duration1.add(duration2);
      expect(added.durationValue).toBe(37);
      expect(added.unit).toBe('DAYS');
    });

    test('should compare durations', () => {
      const shortDuration = new Duration(7, 'DAYS');
      const longDuration = new Duration(30, 'DAYS');
      
      expect(longDuration.isLongerThan(shortDuration)).toBe(true);
      expect(shortDuration.isShorterThan(longDuration)).toBe(true);
    });
  });

  describe('Contract Validation Service', () => {
    test('should validate valid contract data', () => {
      const validData = {
        datasetSelections: [
          { datasetId: 'dataset-1', individualPrice: 100.50 }
        ],
        duration: 30,
        termsAndConditions: 'Valid terms and conditions',
        aiModelIds: [1, 2],
        contractType: 'AI_TRAINING'
      };

      const result = validationService.validateContractCreation(validData);
      expect(result.datasetSelections).toBeDefined();
      expect(result.duration).toBeDefined();
      expect(result.termsAndConditions).toBeDefined();
    });

    test('should reject invalid dataset selections', () => {
      const invalidData = {
        datasetSelections: [],
        duration: 30,
        termsAndConditions: 'Valid terms'
      };

      expect(() => validationService.validateContractCreation(invalidData))
        .toThrow(ValidationError);
    });

    test('should reject invalid duration', () => {
      const invalidData = {
        datasetSelections: [{ datasetId: 'dataset-1', individualPrice: 100 }],
        duration: -5,
        termsAndConditions: 'Valid terms'
      };

      expect(() => validationService.validateContractCreation(invalidData))
        .toThrow(ValidationError);
    });

    test('should reject missing terms and conditions', () => {
      const invalidData = {
        datasetSelections: [{ datasetId: 'dataset-1', individualPrice: 100 }],
        duration: 30,
        termsAndConditions: ''
      };

      expect(() => validationService.validateContractCreation(invalidData))
        .toThrow(ValidationError);
    });

    test('should validate privacy requirements', () => {
      const data = {
        datasetSelections: [{ datasetId: 'dataset-1', individualPrice: 100 }],
        duration: 30,
        termsAndConditions: 'Valid terms',
        privacyRequirements: {
          maxPrivacyLoss: 0.1,
          minAccuracy: 0.9,
          differentialPrivacy: true
        }
      };

      const result = validationService.validateContractCreation(data);
      expect(result.privacyRequirements.maxPrivacyLoss).toBe(0.1);
      expect(result.privacyRequirements.minAccuracy).toBe(0.9);
      expect(result.privacyRequirements.differentialPrivacy).toBe(true);
    });

    test('should reject invalid privacy requirements', () => {
      const data = {
        datasetSelections: [{ datasetId: 'dataset-1', individualPrice: 100 }],
        duration: 30,
        termsAndConditions: 'Valid terms',
        privacyRequirements: {
          maxPrivacyLoss: 1.5, // Invalid: > 1
          minAccuracy: -0.1    // Invalid: < 0
        }
      };

      expect(() => validationService.validateContractCreation(data))
        .toThrow(ValidationError);
    });

    test('should generate valid contract ID', () => {
      const contractId = validationService.generateContractId();
      expect(contractId).toMatch(/^RICARDIAN-\d+-[a-z0-9]+$/);
    });

    test('should calculate total price correctly', () => {
      const datasetSelections = [
        { individualPrice: 100.50 },
        { individualPrice: 200.75 }
      ];

      const totalPrice = validationService.calculateTotalPrice(datasetSelections);
      expect(totalPrice.amount).toBe(301.25);
      expect(totalPrice.currency).toBe('USD');
    });
  });

  describe('Error Handling', () => {
    test('should provide meaningful error messages', () => {
      try {
        validationService.validateContractCreation({});
      } catch (error) {
        expect(error.message).toContain('Contract validation failed');
        expect(error).toBeInstanceOf(ValidationError);
      }
    });

    test('should handle nested validation errors', () => {
      const invalidData = {
        datasetSelections: [
          { datasetId: 'dataset-1', individualPrice: -100 } // Invalid negative price
        ],
        duration: 30,
        termsAndConditions: 'Valid terms'
      };

      expect(() => validationService.validateContractCreation(invalidData))
        .toThrow(ValidationError);
    });
  });
});
