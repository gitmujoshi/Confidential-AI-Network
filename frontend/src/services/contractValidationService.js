import { ContractId, Money, Duration, ValidationError } from '@contract-management/value-objects';

/**
 * Frontend Contract Validation Service
 * 
 * Uses Value Objects to validate contract data before sending to backend.
 * Provides real-time validation feedback to users.
 */
class ContractValidationService {
  /**
   * Validate contract creation form data
   */
  validateContractForm(data) {
    const errors = {};
    const validated = {};

    try {
      // Validate dataset selections
      if (!data.datasetSelections || !Array.isArray(data.datasetSelections) || data.datasetSelections.length === 0) {
        errors.datasetSelections = 'At least one dataset is required';
      } else {
        const datasetValidation = this.validateDatasetSelections(data.datasetSelections);
        if (datasetValidation.errors.length > 0) {
          errors.datasetSelections = datasetValidation.errors.join(', ');
        } else {
          validated.datasetSelections = datasetValidation.validated;
        }
      }

      // Validate duration
      if (!data.duration) {
        errors.duration = 'Duration is required';
      } else {
        try {
          const duration = new Duration(parseInt(data.duration), 'DAYS');
          validated.duration = duration;
        } catch (error) {
          errors.duration = `Invalid duration: ${error.message}`;
        }
      }

      // Validate terms and conditions
      if (!data.termsAndConditions || typeof data.termsAndConditions !== 'string' || data.termsAndConditions.trim().length === 0) {
        errors.termsAndConditions = 'Terms and conditions are required';
      } else {
        validated.termsAndConditions = data.termsAndConditions.trim();
      }

      // Validate AI model IDs (optional in UI — empty array means no model)
      if (data.aiModelIds && Array.isArray(data.aiModelIds) && data.aiModelIds.length > 0) {
        const validModelIds = data.aiModelIds.filter(id => id && typeof id === 'number' && id > 0);
        if (validModelIds.length === 0) {
          errors.aiModelIds = 'At least one valid AI model must be selected';
        } else {
          validated.aiModelIds = validModelIds;
        }
      }

      // Validate CCRP ID
      if (data.ccrpId) {
        if (typeof data.ccrpId !== 'number' || data.ccrpId <= 0) {
          errors.ccrpId = 'Invalid CCRP selection';
        } else {
          validated.ccrpId = data.ccrpId;
        }
      }

      // Validate contract type
      if (data.contractType && !['AI_TRAINING', 'DATA_ANALYTICS', 'MODEL_INFERENCE'].includes(data.contractType)) {
        errors.contractType = 'Invalid contract type';
      } else {
        validated.contractType = data.contractType || 'AI_TRAINING';
      }

      // Validate privacy requirements
      if (data.privacyRequirements && typeof data.privacyRequirements === 'object') {
        const privacyValidation = this.validatePrivacyRequirements(data.privacyRequirements);
        if (privacyValidation.errors.length > 0) {
          errors.privacyRequirements = privacyValidation.errors.join(', ');
        } else {
          validated.privacyRequirements = privacyValidation.validated;
        }
      }

      // Validate training environment
      if (data.trainingEnvironment && typeof data.trainingEnvironment === 'object') {
        const environmentValidation = this.validateTrainingEnvironment(data.trainingEnvironment);
        if (environmentValidation.errors.length > 0) {
          errors.trainingEnvironment = environmentValidation.errors.join(', ');
        } else {
          validated.trainingEnvironment = environmentValidation.validated;
        }
      }

      // Validate compliance specs
      if (data.complianceSpecs && typeof data.complianceSpecs === 'object') {
        const complianceValidation = this.validateComplianceSpecs(data.complianceSpecs);
        if (complianceValidation.errors.length > 0) {
          errors.complianceSpecs = complianceValidation.errors.join(', ');
        } else {
          validated.complianceSpecs = complianceValidation.validated;
        }
      }

    } catch (error) {
      errors.general = `Validation error: ${error.message}`;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      validated
    };
  }

  /**
   * Validate dataset selections
   */
  validateDatasetSelections(selections) {
    const errors = [];
    const validated = [];

    if (!Array.isArray(selections) || selections.length === 0) {
      errors.push('Dataset selections must be a non-empty array');
      return { errors, validated };
    }

    if (selections.length > 3) {
      errors.push('Maximum 3 datasets allowed per contract');
      return { errors, validated };
    }

    selections.forEach((selection, index) => {
      if (!selection.datasetId) {
        errors.push(`Dataset selection ${index + 1} missing dataset ID`);
        return;
      }

      if (!selection.individualPrice || isNaN(parseFloat(selection.individualPrice))) {
        errors.push(`Dataset selection ${index + 1} missing or invalid price`);
        return;
      }

      // Validate price using Money Value Object
      try {
        const price = new Money(parseFloat(selection.individualPrice), 'USD');
        validated.push({
          ...selection,
          individualPrice: price.amount,
          validatedPrice: price
        });
      } catch (error) {
        errors.push(`Dataset selection ${index + 1} invalid price: ${error.message}`);
      }
    });

    return { errors, validated };
  }

  /**
   * Validate privacy requirements
   */
  validatePrivacyRequirements(privacy) {
    const errors = [];
    const validated = {};

    if (privacy.maxPrivacyLoss !== undefined) {
      const loss = parseFloat(privacy.maxPrivacyLoss);
      if (isNaN(loss) || loss < 0 || loss > 1) {
        errors.push('maxPrivacyLoss must be between 0 and 1');
      } else {
        validated.maxPrivacyLoss = loss;
      }
    }

    if (privacy.minAccuracy !== undefined) {
      const accuracy = parseFloat(privacy.minAccuracy);
      if (isNaN(accuracy) || accuracy < 0 || accuracy > 1) {
        errors.push('minAccuracy must be between 0 and 1');
      } else {
        validated.minAccuracy = accuracy;
      }
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

    return { errors, validated };
  }

  /**
   * Validate training environment
   */
  validateTrainingEnvironment(environment) {
    const errors = [];
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

    return { errors, validated };
  }

  /**
   * Validate compliance specifications
   */
  validateComplianceSpecs(compliance) {
    const errors = [];
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

    return { errors, validated };
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

  /**
   * Format validation errors for display
   */
  formatErrors(errors) {
    return Object.entries(errors).map(([field, message]) => ({
      field,
      message,
      type: 'error'
    }));
  }
}

export default ContractValidationService;
