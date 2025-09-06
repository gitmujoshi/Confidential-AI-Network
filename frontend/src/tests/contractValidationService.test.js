import { ContractId, Money, Duration, ValidationError } from '@contract-management/value-objects';
import ContractValidationService from '../services/contractValidationService';

describe('Frontend Contract Validation Service', () => {
  let validationService;

  beforeEach(() => {
    validationService = new ContractValidationService();
  });

  describe('Contract Form Validation', () => {
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

      const result = validationService.validateContractForm(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
      expect(result.validated.datasetSelections).toBeDefined();
      expect(result.validated.duration).toBeDefined();
    });

    test('should reject missing dataset selections', () => {
      const invalidData = {
        duration: 30,
        termsAndConditions: 'Valid terms'
      };

      const result = validationService.validateContractForm(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.datasetSelections).toBeDefined();
    });

    test('should reject invalid duration', () => {
      const invalidData = {
        datasetSelections: [{ datasetId: 'dataset-1', individualPrice: 100 }],
        duration: -5,
        termsAndConditions: 'Valid terms'
      };

      const result = validationService.validateContractForm(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.duration).toBeDefined();
    });

    test('should reject missing terms and conditions', () => {
      const invalidData = {
        datasetSelections: [{ datasetId: 'dataset-1', individualPrice: 100 }],
        duration: 30,
        termsAndConditions: ''
      };

      const result = validationService.validateContractForm(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.termsAndConditions).toBeDefined();
    });
  });

  describe('Dataset Selections Validation', () => {
    test('should validate valid dataset selections', () => {
      const selections = [
        { datasetId: 'dataset-1', individualPrice: 100.50 },
        { datasetId: 'dataset-2', individualPrice: 200.75 }
      ];

      const result = validationService.validateDatasetSelections(selections);
      expect(result.errors.length).toBe(0);
      expect(result.validated.length).toBe(2);
    });

    test('should reject empty dataset selections', () => {
      const result = validationService.validateDatasetSelections([]);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('non-empty array');
    });

    test('should reject too many datasets', () => {
      const selections = [
        { datasetId: 'dataset-1', individualPrice: 100 },
        { datasetId: 'dataset-2', individualPrice: 200 },
        { datasetId: 'dataset-3', individualPrice: 300 },
        { datasetId: 'dataset-4', individualPrice: 400 }
      ];

      const result = validationService.validateDatasetSelections(selections);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Maximum 3 datasets');
    });

    test('should reject missing dataset ID', () => {
      const selections = [
        { individualPrice: 100 }
      ];

      const result = validationService.validateDatasetSelections(selections);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('missing dataset ID');
    });

    test('should reject invalid price', () => {
      const selections = [
        { datasetId: 'dataset-1', individualPrice: -100 }
      ];

      const result = validationService.validateDatasetSelections(selections);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('invalid price');
    });
  });

  describe('Privacy Requirements Validation', () => {
    test('should validate valid privacy requirements', () => {
      const privacy = {
        maxPrivacyLoss: 0.1,
        minAccuracy: 0.9,
        differentialPrivacy: true,
        federatedLearning: false
      };

      const result = validationService.validatePrivacyRequirements(privacy);
      expect(result.errors.length).toBe(0);
      expect(result.validated.maxPrivacyLoss).toBe(0.1);
      expect(result.validated.minAccuracy).toBe(0.9);
    });

    test('should reject invalid privacy loss', () => {
      const privacy = {
        maxPrivacyLoss: 1.5
      };

      const result = validationService.validatePrivacyRequirements(privacy);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('between 0 and 1');
    });

    test('should reject invalid accuracy', () => {
      const privacy = {
        minAccuracy: -0.1
      };

      const result = validationService.validatePrivacyRequirements(privacy);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('between 0 and 1');
    });
  });

  describe('Utility Methods', () => {
    test('should generate valid contract ID', () => {
      const contractId = validationService.generateContractId();
      expect(contractId.value).toMatch(/^RICARDIAN-\d+-[a-z0-9]+$/);
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

    test('should format errors correctly', () => {
      const errors = {
        field1: 'Error message 1',
        field2: 'Error message 2'
      };

      const formatted = validationService.formatErrors(errors);
      expect(formatted).toHaveLength(2);
      expect(formatted[0]).toEqual({
        field: 'field1',
        message: 'Error message 1',
        type: 'error'
      });
    });
  });
});
