/**
 * DEPA ID Service
 * 
 * This service handles the generation, validation, and management of DEPA IDs
 * (Decentralized Entity Provider Architecture IDs) for all entities in the system.
 * 
 * DEPA ID Format: [ENTITY_TYPE]-[GUID]
 * Examples: TDC-8f4e2a1b-3c4d-5e6f-7a8b-9c0d1e2f3a4b
 * 
 * Entity Types:
 * - TDC: Training Data Consumer
 * - TDP: Training Data Provider
 * - TSP: Tech Service Provider
 * - CONTRACT: Contract
 * - DATASET: Dataset
 * - AIMODEL: Registered or base AI model (provenance)
 * - TRAININGJOB: Training job run
 */

const { v4: uuidv4 } = require('uuid');

class DEPAIdService {
  constructor() {
    this.deploymentPrefix = (process.env.DEPLOYMENT_PREFIX || 'LOCAL').toString().trim() || 'LOCAL';

    // Valid entity types for DEPA ID generation
    this.validEntityTypes = [
      'TDC',
      'TDP',
      'TSP',
      'CONTRACT',
      'DATASET',
      'AIMODEL',
      'TRAININGJOB',
    ];

    // Regex pattern for DEPA ID validation
    // Support both:
    // - legacy: {ENTITY_TYPE}-{UUID}
    // - prefixed: {PREFIX}-{ENTITY_TYPE}-{UUID}  (e.g. LOCAL-TDC-...)
    this.depaIdPatternLegacy =
      /^(TDC|TDP|TSP|CONTRACT|DATASET|AIMODEL|TRAININGJOB)-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    this.depaIdPatternPrefixed =
      /^([A-Z0-9][A-Z0-9_-]{0,31})-(TDC|TDP|TSP|CONTRACT|DATASET|AIMODEL|TRAININGJOB)-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  }

  /**
   * Generate a new DEPA ID for the specified entity type
   * @param {string} entityType - The entity type (TDC, TDP, TSP, CONTRACT, DATASET)
   * @returns {string} The generated DEPA ID
   * @throws {Error} If entity type is invalid
   */
  generateDEPAId(entityType) {
    try {
      // Validate entity type
      if (!this.validEntityTypes.includes(entityType)) {
        throw new Error(`Invalid entity type: ${entityType}. Valid types are: ${this.validEntityTypes.join(', ')}`);
      }

      // Generate UUID
      const guid = uuidv4();
      
      // Create DEPA ID
      const prefix = this.deploymentPrefix.toUpperCase();
      const depaId = `${prefix}-${entityType}-${guid}`;
      
      console.log(`✅ Generated DEPA ID: ${depaId} for entity type: ${entityType}`);
      
      return depaId;
    } catch (error) {
      console.error(`❌ Error generating DEPA ID for ${entityType}:`, error.message);
      throw error;
    }
  }

  /**
   * Validate a DEPA ID format
   * @param {string} depaId - The DEPA ID to validate
   * @returns {boolean} True if valid, false otherwise
   */
  validateDEPAId(depaId) {
    if (!depaId || typeof depaId !== 'string') {
      return false;
    }

    return this.depaIdPatternPrefixed.test(depaId) || this.depaIdPatternLegacy.test(depaId);
  }

  /**
   * Extract entity type from DEPA ID
   * @param {string} depaId - The DEPA ID
   * @returns {string|null} The entity type or null if invalid
   */
  getEntityType(depaId) {
    if (!this.validateDEPAId(depaId)) {
      return null;
    }
    const parts = depaId.split('-');
    // legacy: ENTITY-uuid...
    // prefixed: PREFIX-ENTITY-uuid...
    if (parts.length < 2) return null;
    const maybeEntity = parts[0].toUpperCase();
    if (this.validEntityTypes.includes(maybeEntity)) return maybeEntity;
    const entity = parts[1]?.toUpperCase?.() || null;
    return this.validEntityTypes.includes(entity) ? entity : null;
  }

  /**
   * Extract GUID from DEPA ID
   * @param {string} depaId - The DEPA ID
   * @returns {string|null} The GUID part or null if invalid
   */
  getGUID(depaId) {
    if (!this.validateDEPAId(depaId)) {
      return null;
    }
    const parts = depaId.split('-');
    if (parts.length < 2) return null;
    const maybeEntity = parts[0].toUpperCase();
    // GUID starts after ENTITY in legacy, after PREFIX+ENTITY in prefixed
    const startIdx = this.validEntityTypes.includes(maybeEntity) ? 1 : 2;
    return parts.length > startIdx ? parts.slice(startIdx).join('-') : null;
  }

  /**
   * Check if DEPA ID matches expected entity type
   * @param {string} depaId - The DEPA ID to check
   * @param {string} expectedEntityType - The expected entity type
   * @returns {boolean} True if matches, false otherwise
   */
  matchesEntityType(depaId, expectedEntityType) {
    const actualEntityType = this.getEntityType(depaId);
    return actualEntityType === expectedEntityType;
  }

  /**
   * Generate DEPA ID for user based on party type
   * @param {string} partyType - The user's party type
   * @returns {string} The generated DEPA ID
   */
  generateUserDEPAId(partyType) {
    // Map party types to entity types
    const partyTypeMap = {
      'TDC': 'TDC',
      'TDP': 'TDP',
      'TSP': 'TSP',
      'AppAdmin': 'TDC' // AppAdmin gets TDC DEPA ID for consistency
    };

    const entityType = partyTypeMap[partyType];
    if (!entityType) {
      throw new Error(`Invalid party type: ${partyType}. Valid types are: ${Object.keys(partyTypeMap).join(', ')}`);
    }

    return this.generateDEPAId(entityType);
  }

  /**
   * Generate DEPA ID for contract
   * @returns {string} The generated DEPA ID
   */
  generateContractDEPAId() {
    return this.generateDEPAId('CONTRACT');
  }

  /** DEPA ID for an AI model row or artifact lineage reference. */
  generateAIModelDEPAId() {
    return this.generateDEPAId('AIMODEL');
  }

  /** DEPA ID for a contract-scoped training job. */
  generateTrainingJobDEPAId() {
    return this.generateDEPAId('TRAININGJOB');
  }

  /**
   * Get all valid entity types
   * @returns {string[]} Array of valid entity types
   */
  getValidEntityTypes() {
    return [...this.validEntityTypes];
  }

  /**
   * Get DEPA ID pattern for validation
   * @returns {RegExp} The regex pattern
   */
  getDEPAIdPattern() {
    return this.depaIdPattern;
  }

  /**
   * Test DEPA ID generation for all entity types
   * @returns {Object} Test results
   */
  testGeneration() {
    const results = {};
    
    for (const entityType of this.validEntityTypes) {
      try {
        const depaId = this.generateDEPAId(entityType);
        const isValid = this.validateDEPAId(depaId);
        const extractedType = this.getEntityType(depaId);
        
        results[entityType] = {
          generated: depaId,
          valid: isValid,
          extractedType: extractedType,
          success: isValid && extractedType === entityType
        };
      } catch (error) {
        results[entityType] = {
          error: error.message,
          success: false
        };
      }
    }
    
    return results;
  }
}

module.exports = DEPAIdService; 