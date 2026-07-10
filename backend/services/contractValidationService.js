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
    const DEPAIdService = require('./depaIdService');
    const depaIdService = new DEPAIdService();

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
        // Support:
        // - numeric DB ids (legacy)
        // - DEPA IDs (preferred): {PREFIX}-AIMODEL-{UUID}
        validated.aiModelIds = data.aiModelIds
          .map((id) => (typeof id === 'string' ? id.trim() : id))
          .filter((id) => {
            if (!id) return false;
            if (typeof id === 'number') return id > 0;
            if (typeof id === 'string') return depaIdService.validateDEPAId(id) && depaIdService.matchesEntityType(id, 'AIMODEL');
            return false;
          });
      }

<<<<<<< HEAD
      // Validate TSP ID
      if (data.tspId) {
        if (typeof data.tspId !== 'number' || data.tspId <= 0) {
          errors.push('Invalid TSP ID');
        } else {
          validated.tspId = data.tspId;
=======
      // Validate CCRP ID
      if (data.ccrpId) {
        // Support either numeric user id (legacy) or DEPA ID (preferred for API clients)
        if (typeof data.ccrpId === 'number') {
          if (data.ccrpId <= 0) errors.push('Invalid CCRP ID');
          else validated.ccrpId = data.ccrpId;
        } else if (typeof data.ccrpId === 'string') {
          const trimmed = data.ccrpId.trim();
          if (!trimmed) errors.push('Invalid CCRP ID');
          else validated.ccrpId = trimmed;
        } else {
          errors.push('Invalid CCRP ID');
>>>>>>> origin/feature/model-training-environment
        }
      }

      // Validate TSP cloud provider (optional, but required for training completeness when TSP is selected)
      if (data.tspCloudProvider !== undefined && data.tspCloudProvider !== null && data.tspCloudProvider !== '') {
        const validProviders = ['Local', 'AWS', 'Azure', 'GCP', 'OCI'];
        if (typeof data.tspCloudProvider !== 'string' || !validProviders.includes(data.tspCloudProvider)) {
          errors.push(`Invalid tspCloudProvider. Must be one of: ${validProviders.join(', ')}`);
        } else {
          validated.tspCloudProvider = data.tspCloudProvider;
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
      if (data.kmsConfigs && (typeof data.kmsConfigs === 'object' || Array.isArray(data.kmsConfigs))) {
        validated.kmsConfigs = data.kmsConfigs;
      }

      // Optional execution/runtime fields (used by TSP runtimes and audits)
      if (data.containerImage !== undefined && data.containerImage !== null) {
        if (typeof data.containerImage !== 'string') {
          errors.push('Invalid containerImage (must be a string)');
        } else {
          validated.containerImage = data.containerImage.trim();
        }
      }
      if (data.serviceAccount !== undefined && data.serviceAccount !== null) {
        if (typeof data.serviceAccount !== 'string') {
          errors.push('Invalid serviceAccount (must be a string)');
        } else {
          validated.serviceAccount = data.serviceAccount.trim();
        }
      }
      if (data.logDestination !== undefined && data.logDestination !== null) {
        if (typeof data.logDestination !== 'string') {
          errors.push('Invalid logDestination (must be a string)');
        } else {
          validated.logDestination = data.logDestination.trim();
        }
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

    // Differential privacy can be either:
    // - boolean (legacy)
    // - object: { enabled, epsilon, delta, mechanism?, clipNorm? }
    if (privacy.differentialPrivacy !== undefined) {
      if (typeof privacy.differentialPrivacy === 'boolean') {
        validated.differentialPrivacy = { enabled: privacy.differentialPrivacy };
      } else if (privacy.differentialPrivacy && typeof privacy.differentialPrivacy === 'object') {
        const enabled =
          privacy.differentialPrivacy.enabled !== undefined
            ? Boolean(privacy.differentialPrivacy.enabled)
            : Boolean(privacy.differentialPrivacy);
        const epsilonRaw = privacy.differentialPrivacy.epsilon;
        const deltaRaw = privacy.differentialPrivacy.delta;
        const epsilon = epsilonRaw !== undefined ? Number(epsilonRaw) : undefined;
        const delta = deltaRaw !== undefined ? Number(deltaRaw) : undefined;
        if (epsilon !== undefined && (!Number.isFinite(epsilon) || epsilon <= 0)) {
          throw new ValidationError('differentialPrivacy.epsilon must be a number > 0');
        }
        if (delta !== undefined && (!Number.isFinite(delta) || delta <= 0 || delta >= 1)) {
          throw new ValidationError('differentialPrivacy.delta must be a number in (0, 1)');
        }
        validated.differentialPrivacy = {
          enabled,
          ...(epsilon !== undefined ? { epsilon } : {}),
          ...(delta !== undefined ? { delta } : {}),
          ...(privacy.differentialPrivacy.mechanism ? { mechanism: String(privacy.differentialPrivacy.mechanism) } : {}),
          ...(privacy.differentialPrivacy.clipNorm !== undefined
            ? { clipNorm: Number(privacy.differentialPrivacy.clipNorm) }
            : {}),
        };
      } else {
        validated.differentialPrivacy = { enabled: Boolean(privacy.differentialPrivacy) };
      }
    }

    if (privacy.federatedLearning !== undefined) {
      // Allow boolean or object; keep shape stable for downstream usage.
      if (typeof privacy.federatedLearning === 'boolean') {
        validated.federatedLearning = { enabled: privacy.federatedLearning };
      } else if (privacy.federatedLearning && typeof privacy.federatedLearning === 'object') {
        validated.federatedLearning = {
          enabled:
            privacy.federatedLearning.enabled !== undefined
              ? Boolean(privacy.federatedLearning.enabled)
              : Boolean(privacy.federatedLearning),
          ...(privacy.federatedLearning.communicationRounds !== undefined
            ? { communicationRounds: Number(privacy.federatedLearning.communicationRounds) }
            : {}),
        };
      } else {
        validated.federatedLearning = { enabled: Boolean(privacy.federatedLearning) };
      }
    }

    if (privacy.secureMultiPartyComputation !== undefined) {
      if (typeof privacy.secureMultiPartyComputation === 'boolean') {
        validated.secureMultiPartyComputation = { enabled: privacy.secureMultiPartyComputation };
      } else if (privacy.secureMultiPartyComputation && typeof privacy.secureMultiPartyComputation === 'object') {
        validated.secureMultiPartyComputation = {
          enabled:
            privacy.secureMultiPartyComputation.enabled !== undefined
              ? Boolean(privacy.secureMultiPartyComputation.enabled)
              : Boolean(privacy.secureMultiPartyComputation),
        };
      } else {
        validated.secureMultiPartyComputation = { enabled: Boolean(privacy.secureMultiPartyComputation) };
      }
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
