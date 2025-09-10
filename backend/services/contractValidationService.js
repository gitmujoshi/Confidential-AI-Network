const { ContractId, Money, Duration, ValidationError } = require('@contract-management/value-objects');

/**
 * Contract Validation Service
 * 
 * Uses Value Objects to validate contract data before processing.
 * Ensures data integrity and prevents invalid data from reaching the database.
 */
class ContractValidationService {
  /**
   * Validate contract creation request
   */
  validateContractCreation(data) {
    const errors = [];
    const validated = {};

    try {
      // Validate dataset selections
      if (!data.datasetSelections || !Array.isArray(data.datasetSelections) || data.datasetSelections.length === 0) {
        errors.push('Missing or invalid datasetSelections');
      } else {
        validated.datasetSelections = this.validateDatasetSelections(data.datasetSelections);
      }

      // Validate duration
      if (data.duration) {
        try {
          validated.duration = new Duration(parseInt(data.duration), 'DAYS');
        } catch (error) {
          errors.push(`Invalid duration: ${error.message}`);
        }
      } else {
        errors.push('Duration is required');
      }

      // Validate terms and conditions
      if (!data.termsAndConditions || typeof data.termsAndConditions !== 'string' || data.termsAndConditions.trim().length === 0) {
        errors.push('Terms and conditions are required');
      } else {
        validated.termsAndConditions = data.termsAndConditions.trim();
      }

      // Validate AI model IDs
      if (data.aiModelIds && Array.isArray(data.aiModelIds)) {
        validated.aiModelIds = data.aiModelIds.filter(id => id && typeof id === 'number' && id > 0);
      }

      // Validate CCRP ID
      if (data.ccrpId) {
        if (typeof data.ccrpId !== 'number' || data.ccrpId <= 0) {
          errors.push('Invalid CCRP ID');
        } else {
          validated.ccrpId = data.ccrpId;
        }
      }

      // Validate contract type
      if (data.contractType && !['AI_TRAINING', 'DATA_ANALYTICS', 'MODEL_INFERENCE'].includes(data.contractType)) {
        errors.push('Invalid contract type');
      } else {
        validated.contractType = data.contractType || 'AI_TRAINING';
      }

      // Validate privacy requirements
      if (data.privacyRequirements && typeof data.privacyRequirements === 'object') {
        validated.privacyRequirements = this.validatePrivacyRequirements(data.privacyRequirements);
      }

      // Validate training environment
      if (data.trainingEnvironment && typeof data.trainingEnvironment === 'object') {
        validated.trainingEnvironment = this.validateTrainingEnvironment(data.trainingEnvironment);
      }

      // Validate compliance specs
      if (data.complianceSpecs && typeof data.complianceSpecs === 'object') {
        validated.complianceSpecs = this.validateComplianceSpecs(data.complianceSpecs);
      }

      // Validate global DEPA ID
      if (data.globalDEPAId && typeof data.globalDEPAId === 'string') {
        validated.globalDEPAId = data.globalDEPAId.trim();
      }

      // Validate deployment prefix
      if (data.deploymentPrefix && typeof data.deploymentPrefix === 'string') {
        validated.deploymentPrefix = data.deploymentPrefix.trim();
      }

      // Validate jurisdiction
      if (data.jurisdiction && typeof data.jurisdiction === 'string') {
        validated.jurisdiction = data.jurisdiction.trim();
      }

      // Validate environment specifications
      if (data.environmentSpecs && typeof data.environmentSpecs === 'object') {
        validated.environmentSpecs = data.environmentSpecs;
      }

      // Validate training parameters
      if (data.trainingParams && typeof data.trainingParams === 'object') {
        validated.trainingParams = data.trainingParams;
      }

      // Validate KMS configurations
      if (data.kmsConfigs && typeof data.kmsConfigs === 'object') {
        validated.kmsConfigs = data.kmsConfigs;
      }

    } catch (error) {
      errors.push(`Validation error: ${error.message}`);
    }

    if (errors.length > 0) {
      throw new ValidationError(`Contract validation failed: ${errors.join(', ')}`);
    }

    return validated;
  }

  /**
   * Validate dataset selections
   */
  validateDatasetSelections(selections) {
    if (!Array.isArray(selections) || selections.length === 0) {
      throw new ValidationError('Dataset selections must be a non-empty array');
    }

    if (selections.length > 3) {
      throw new ValidationError('Maximum 3 datasets allowed per contract');
    }

    return selections.map((selection, index) => {
      if (!selection.datasetId) {
        throw new ValidationError(`Dataset selection ${index + 1} missing datasetId`);
      }

      if (!selection.individualPrice || isNaN(parseFloat(selection.individualPrice))) {
        throw new ValidationError(`Dataset selection ${index + 1} missing or invalid individualPrice`);
      }

      // Validate price using Money Value Object
      try {
        const price = new Money(parseFloat(selection.individualPrice), 'USD');
        return {
          ...selection,
          individualPrice: price.amount,
          validatedPrice: price
        };
      } catch (error) {
        throw new ValidationError(`Dataset selection ${index + 1} invalid price: ${error.message}`);
      }
    });
  }

  /**
   * Validate privacy requirements
   */
  validatePrivacyRequirements(privacy) {
    const validated = {};

    if (privacy.maxPrivacyLoss !== undefined) {
      const loss = parseFloat(privacy.maxPrivacyLoss);
      if (isNaN(loss) || loss < 0 || loss > 1) {
        throw new ValidationError('maxPrivacyLoss must be between 0 and 1');
      }
      validated.maxPrivacyLoss = loss;
    }

    if (privacy.minAccuracy !== undefined) {
      const accuracy = parseFloat(privacy.minAccuracy);
      if (isNaN(accuracy) || accuracy < 0 || accuracy > 1) {
        throw new ValidationError('minAccuracy must be between 0 and 1');
      }
      validated.minAccuracy = accuracy;
    }

    if (privacy.differentialPrivacy !== undefined) {
      validated.differentialPrivacy = Boolean(privacy.differentialPrivacy);
    }

    if (privacy.federatedLearning !== undefined) {
      validated.federatedLearning = Boolean(privacy.federatedLearning);
    }

    if (privacy.secureMultiPartyComputation !== undefined) {
      validated.secureMultiPartyComputation = Boolean(privacy.secureMultiPartyComputation);
    }

    return validated;
  }

  /**
   * Validate training environment
   */
  validateTrainingEnvironment(environment) {
    const validated = {};

    if (environment.computeResources && typeof environment.computeResources === 'object') {
      validated.computeResources = {
        cpu: environment.computeResources.cpu ? parseInt(environment.computeResources.cpu) : undefined,
        memory: environment.computeResources.memory ? parseInt(environment.computeResources.memory) : undefined,
        gpu: environment.computeResources.gpu ? parseInt(environment.computeResources.gpu) : undefined
      };
    }

    if (environment.storage && typeof environment.storage === 'object') {
      validated.storage = {
        size: environment.storage.size ? parseInt(environment.storage.size) : undefined,
        type: environment.storage.type || 'SSD'
      };
    }

    if (environment.network && typeof environment.network === 'object') {
      validated.network = {
        bandwidth: environment.network.bandwidth ? parseInt(environment.network.bandwidth) : undefined,
        latency: environment.network.latency ? parseInt(environment.network.latency) : undefined
      };
    }

    return validated;
  }

  /**
   * Validate compliance specifications
   */
  validateComplianceSpecs(compliance) {
    const validated = {};

    if (compliance.gdpr !== undefined) {
      validated.gdpr = Boolean(compliance.gdpr);
    }

    if (compliance.hipaa !== undefined) {
      validated.hipaa = Boolean(compliance.hipaa);
    }

    if (compliance.sox !== undefined) {
      validated.sox = Boolean(compliance.sox);
    }

    if (compliance.pci !== undefined) {
      validated.pci = Boolean(compliance.pci);
    }

    if (compliance.regions && Array.isArray(compliance.regions)) {
      validated.regions = compliance.regions.filter(region => typeof region === 'string');
    }

    return validated;
  }

  /**
   * Generate a valid contract ID
   */
  generateContractId() {
    return ContractId.generate();
  }

  /**
   * Calculate total price from dataset selections
   */
  calculateTotalPrice(datasetSelections) {
    if (!Array.isArray(datasetSelections)) {
      throw new ValidationError('Dataset selections must be an array');
    }

    const total = datasetSelections.reduce((sum, selection) => {
      if (selection.validatedPrice) {
        return sum + selection.validatedPrice.amount;
      }
      return sum + parseFloat(selection.individualPrice || 0);
    }, 0);

    return new Money(total, 'USD');
  }
}

module.exports = ContractValidationService;
