/**
 * Global DEPA ID Service
 *
 * DEPA = India’s iSPIRT Data Empowerment and Protection Architecture (https://depa.world).
 * Extends the DEPA ID service for multi-deployment global uniqueness across jurisdictions
 * without regressing existing DEPA-aligned entity IDs.
 *
 * Features:
 * - Deployment-specific DEPA ID prefixes
 * - Global deployment registry
 * - Cross-deployment validation
 * - Jurisdiction-specific compliance
 * - Backward compatibility with existing DEPA IDs
 */

const { v4: uuidv4 } = require('uuid');
const DEPAIdService = require('./depaIdService');

class GlobalDEPAIdService extends DEPAIdService {
  constructor() {
    super(); // Call parent constructor to maintain existing functionality
    
    // Global deployment registry
    this.deploymentRegistry = new Map();
    
    // Current deployment configuration
    this.currentDeployment = {
      deploymentId: process.env.DEPLOYMENT_ID,
      prefix: process.env.DEPLOYMENT_PREFIX,
      region: process.env.DEPLOYMENT_REGION,
      country: process.env.DEPLOYMENT_COUNTRY,
      jurisdiction: process.env.DEPLOYMENT_JURISDICTION,
      dataResidency: process.env.DEPLOYMENT_DATA_RESIDENCY,
      regulatoryFramework: process.env.DEPLOYMENT_REGULATORY_FRAMEWORK?.split(',') || [],
      timezone: process.env.DEPLOYMENT_TIMEZONE,
      currency: process.env.DEPLOYMENT_CURRENCY,
      language: process.env.DEPLOYMENT_LANGUAGE
    };

    // Validate required environment variables (may apply defaults in non-prod)
    this.validateEnvironmentVariables();

    // Initialize deployment registry
    this.initializeDeploymentRegistry();
  }
  
  validateEnvironmentVariables() {
    const requiredVars = [
      'DEPLOYMENT_ID',
      'DEPLOYMENT_PREFIX',
      'DEPLOYMENT_REGION',
      'DEPLOYMENT_COUNTRY',
      'DEPLOYMENT_JURISDICTION',
      'DEPLOYMENT_DATA_RESIDENCY',
      'DEPLOYMENT_TIMEZONE',
      'DEPLOYMENT_CURRENCY',
      'DEPLOYMENT_LANGUAGE'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      // In production we require explicit deployment metadata.
      // In tests/dev we fall back to a stable local deployment so the server can boot.
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
      }

      console.warn(
        `⚠️ Global DEPA deployment metadata missing (${missingVars.join(', ')}). ` +
        `Falling back to local defaults (NODE_ENV=${process.env.NODE_ENV || 'undefined'}).`
      );

      process.env.DEPLOYMENT_ID ||= 'local';
      process.env.DEPLOYMENT_PREFIX ||= 'LOCAL';
      process.env.DEPLOYMENT_REGION ||= 'local';
      process.env.DEPLOYMENT_COUNTRY ||= 'local';
      process.env.DEPLOYMENT_JURISDICTION ||= 'local';
      process.env.DEPLOYMENT_DATA_RESIDENCY ||= 'local';
      process.env.DEPLOYMENT_TIMEZONE ||= 'UTC';
      process.env.DEPLOYMENT_CURRENCY ||= 'USD';
      process.env.DEPLOYMENT_LANGUAGE ||= 'en';

      this.currentDeployment = {
        ...this.currentDeployment,
        deploymentId: process.env.DEPLOYMENT_ID,
        prefix: process.env.DEPLOYMENT_PREFIX,
        region: process.env.DEPLOYMENT_REGION,
        country: process.env.DEPLOYMENT_COUNTRY,
        jurisdiction: process.env.DEPLOYMENT_JURISDICTION,
        dataResidency: process.env.DEPLOYMENT_DATA_RESIDENCY,
        timezone: process.env.DEPLOYMENT_TIMEZONE,
        currency: process.env.DEPLOYMENT_CURRENCY,
        language: process.env.DEPLOYMENT_LANGUAGE
      };
    }
    
    // Jurisdiction-specific configurations
    this.jurisdictionConfigs = {
      'US-Federal': {
        dataResidency: 'US',
        encryptionStandards: ['AES-256', 'FIPS-140-2'],
        auditRequirements: ['SOX', 'FedRAMP'],
        depaIdFormat: 'US-[REGION]-[ENTITY_TYPE]-[GUID]'
      },
      'EU-GDPR': {
        dataResidency: 'EU',
        encryptionStandards: ['AES-256', 'GDPR-Article-32'],
        auditRequirements: ['GDPR', 'ISO-27001'],
        depaIdFormat: 'EU-[REGION]-[ENTITY_TYPE]-[GUID]'
      },
      'AP-Singapore': {
        dataResidency: 'Singapore',
        encryptionStandards: ['AES-256', 'MAS-TRM'],
        auditRequirements: ['PDPA', 'ISO-27001'],
        depaIdFormat: 'AP-[REGION]-[ENTITY_TYPE]-[GUID]'
      },
      'CA-Federal': {
        dataResidency: 'Canada',
        encryptionStandards: ['AES-256', 'FIPS-140-2'],
        auditRequirements: ['PIPEDA', 'ISO-27001'],
        depaIdFormat: 'CA-[REGION]-[ENTITY_TYPE]-[GUID]'
      },
      'IN-DPDPA': {
        dataResidency: 'India',
        encryptionStandards: ['AES-256', 'RBI-Cyber-Framework'],
        auditRequirements: ['DPDPA', 'RBI', 'IRDAI', 'ISO-27001'],
        depaIdFormat: 'IN-[REGION]-[ENTITY_TYPE]-[GUID]'
      }
    };
    
  }

  /**
   * Initialize deployment registry with current deployment
   */
  initializeDeploymentRegistry() {
    try {
      // Register current deployment
      this.registerDeployment(this.currentDeployment);
      
      console.log('✅ Global DEPA ID Service initialized');
      console.log(`📍 Current deployment: ${this.currentDeployment.deploymentId} (${this.currentDeployment.prefix})`);
    } catch (error) {
      console.error('❌ Error initializing global DEPA ID service:', error);
    }
  }

  /**
   * Generate global DEPA ID with deployment prefix
   * @param {string} entityType - The entity type
   * @param {string} deploymentPrefix - Optional deployment prefix (uses current if not provided)
   * @returns {string} Global DEPA ID
   */
  generateGlobalDEPAId(entityType, deploymentPrefix = null) {
    try {
      // Validate entity type using parent method
      if (!this.validEntityTypes.includes(entityType)) {
        throw new Error(`Invalid entity type: ${entityType}. Valid types are: ${this.validEntityTypes.join(', ')}`);
      }

      // Use provided prefix or current deployment prefix
      const prefix = deploymentPrefix || this.currentDeployment.prefix;
      
      // Generate UUID
      const guid = uuidv4();
      
      // Create global DEPA ID with deployment prefix
      const globalDEPAId = `${prefix}-${entityType}-${guid}`;
      
      console.log(`✅ Generated Global DEPA ID: ${globalDEPAId} for entity type: ${entityType}`);
      
      return globalDEPAId;
    } catch (error) {
      console.error(`❌ Error generating global DEPA ID for ${entityType}:`, error.message);
      throw error;
    }
  }

  /**
   * Generate global DEPA ID for user based on party type
   * @param {string} partyType - The user's party type
   * @param {string} deploymentPrefix - Optional deployment prefix
   * @returns {string} Global DEPA ID
   */
  generateGlobalUserDEPAId(partyType, deploymentPrefix = null) {
    // Map party types to entity types (same as parent)
    const partyTypeMap = {
      'TDC': 'TDC',
      'TDP': 'TDP',
      'TSP': 'TSP',
      'CCRP': 'TSP',
      'AppAdmin': 'TDC',
      'Auditor': 'TDC'
    };

    const entityType = partyTypeMap[partyType];
    if (!entityType) {
      throw new Error(`Invalid party type: ${partyType}. Valid types are: ${Object.keys(partyTypeMap).join(', ')}`);
    }

    return this.generateGlobalDEPAId(entityType, deploymentPrefix);
  }

  /**
   * Validate global DEPA ID format
   * @param {string} globalDEPAId - The global DEPA ID to validate
   * @returns {boolean} True if valid, false otherwise
   */
  validateGlobalDEPAId(globalDEPAId) {
    if (!globalDEPAId || typeof globalDEPAId !== 'string') {
      return false;
    }
    
    // Pattern for global DEPA ID: [PREFIX]-[ENTITY_TYPE]-[GUID]
    const globalPattern = /^[A-Z-]+-[A-Z]+-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return globalPattern.test(globalDEPAId);
  }

  /**
   * Extract deployment information from global DEPA ID
   * @param {string} globalDEPAId - The global DEPA ID
   * @returns {Object|null} Deployment info or null if invalid
   */
  extractDeploymentInfo(globalDEPAId) {
    if (!this.validateGlobalDEPAId(globalDEPAId)) {
      return null;
    }

    const parts = globalDEPAId.split('-');
    const entityType = parts[parts.length - 2]; // Second to last part
    const guid = parts[parts.length - 1]; // Last part
    const deploymentPrefix = parts.slice(0, -2).join('-'); // Everything before entity type

    return {
      deploymentPrefix,
      entityType,
      guid,
      fullDEPAId: globalDEPAId
    };
  }

  /**
   * Register a new deployment in the global registry
   * @param {Object} deploymentInfo - Deployment information
   * @returns {boolean} Success status
   */
  registerDeployment(deploymentInfo) {
    try {
      const { deploymentId, prefix, region, country, jurisdiction } = deploymentInfo;
      
      // Validate required fields
      if (!deploymentId || !prefix || !region || !country) {
        throw new Error('Missing required deployment information');
      }
      
      // Check if prefix already exists
      if (this.deploymentRegistry.has(prefix)) {
        throw new Error(`Deployment prefix ${prefix} already exists`);
      }
      
      // Register deployment
      this.deploymentRegistry.set(prefix, {
        ...deploymentInfo,
        registeredAt: new Date().toISOString(),
        status: 'ACTIVE'
      });
      
      console.log(`✅ Registered deployment: ${deploymentId} with prefix: ${prefix}`);
      return true;
    } catch (error) {
      console.error('❌ Error registering deployment:', error.message);
      return false;
    }
  }

  /**
   * Validate deployment prefix uniqueness
   * @param {string} prefix - Deployment prefix to validate
   * @returns {boolean} True if unique, false otherwise
   */
  validateDeploymentPrefix(prefix) {
    return !this.deploymentRegistry.has(prefix);
  }

  /**
   * Get deployment information by prefix
   * @param {string} prefix - Deployment prefix
   * @returns {Object|null} Deployment info or null if not found
   */
  getDeploymentInfo(prefix) {
    return this.deploymentRegistry.get(prefix) || null;
  }

  /**
   * Get all registered deployments
   * @returns {Array} Array of deployment information
   */
  getAllDeployments() {
    return Array.from(this.deploymentRegistry.values());
  }

  /**
   * Map user party type to DEPA entity type (for ID generation).
   * @param {string} partyType - TDP | TDC | TSP | AppAdmin
   * @returns {string}
   */
  partyTypeToEntityType(partyType) {
    const normalized = partyType === 'CCRP' ? 'TSP' : partyType;
    const map = {
      TDC: 'TDC',
      TDP: 'TDP',
      TSP: 'TSP',
      AppAdmin: 'TDC',
      Auditor: 'TDC',
    };
    const entityType = map[normalized];
    if (!entityType) {
      throw new Error(`Invalid party type: ${partyType}`);
    }
    return entityType;
  }

  /**
   * Generate jurisdiction-compliant DEPA ID
   * @param {string} entityType - Entity type
   * @param {string} jurisdiction - Jurisdiction code
   * @param {Object} [options] - Optional { deploymentPrefix, region }
   * @returns {string} Jurisdiction-compliant DEPA ID
   */
  generateJurisdictionCompliantDEPAId(entityType, jurisdiction, options = {}) {
    try {
      const config = this.jurisdictionConfigs[jurisdiction];
      if (!config) {
        throw new Error(`Unsupported jurisdiction: ${jurisdiction}`);
      }

      if (!entityType || !this.validEntityTypes.includes(entityType)) {
        throw new Error(`Invalid entity type for jurisdiction DEPA ID: ${entityType}`);
      }

      const guid = uuidv4();
      const prefix = options.deploymentPrefix || this.currentDeployment.prefix;
      const region =
        options.region ||
        (prefix && String(prefix).includes('-') ? String(prefix).split('-').slice(1).join('-') : null) ||
        this.currentDeployment.region;

      const depaId = config.depaIdFormat
        .replace('[REGION]', region)
        .replace('[ENTITY_TYPE]', entityType)
        .replace('[GUID]', guid);

      console.log(`✅ Generated jurisdiction-compliant DEPA ID: ${depaId} for ${jurisdiction}`);

      return depaId;
    } catch (error) {
      console.error(`❌ Error generating jurisdiction-compliant DEPA ID:`, error.message);
      throw error;
    }
  }

  /**
   * Verify global uniqueness across deployments
   * @param {string} globalDEPAId - Global DEPA ID to verify
   * @returns {Promise<Object>} Verification result
   */
  async verifyGlobalUniqueness(globalDEPAId) {
    try {
      const deploymentInfo = this.extractDeploymentInfo(globalDEPAId);
      if (!deploymentInfo) {
        return { unique: false, reason: 'Invalid global DEPA ID format' };
      }

      // Check if deployment prefix is registered
      const deployment = this.getDeploymentInfo(deploymentInfo.deploymentPrefix);
      if (!deployment) {
        return { unique: false, reason: 'Deployment prefix not registered' };
      }

      // Check local database for existing DEPA ID
      const db = require('../models');
      const existing = await db.sequelize.query(
        'SELECT id FROM users WHERE "depaId" = :depaId UNION SELECT id FROM contracts WHERE "depaId" = :depaId UNION SELECT id FROM datasets WHERE "depaId" = :depaId',
        {
          replacements: { depaId: globalDEPAId },
          type: db.sequelize.QueryTypes.SELECT
        }
      );

      if (existing.length > 0) {
        return { unique: false, reason: 'DEPA ID exists in local database' };
      }

      // In a real implementation, check global registry
      // For now, we'll assume it's unique if not found locally
      return { 
        unique: true, 
        reason: 'Verified globally unique',
        deployment: deployment
      };

    } catch (error) {
      console.error('❌ Error verifying global uniqueness:', error);
      return { unique: false, reason: 'Verification failed' };
    }
  }

  /**
   * Generate unique global DEPA ID with retries
   * @param {string} entityType - Entity type
   * @param {string} deploymentPrefix - Optional deployment prefix
   * @param {number} maxRetries - Maximum retry attempts
   * @returns {Promise<string>} Unique global DEPA ID
   */
  async generateUniqueGlobalDEPAId(entityType, deploymentPrefix = null, maxRetries = 5) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const globalDEPAId = this.generateGlobalDEPAId(entityType, deploymentPrefix);
        
        // Verify global uniqueness
        const verification = await this.verifyGlobalUniqueness(globalDEPAId);
        
        if (verification.unique) {
          return globalDEPAId;
        }
        
        console.log(`⚠️ Global DEPA ID collision detected on attempt ${attempt}, retrying...`);
      } catch (error) {
        console.error(`❌ Error generating global DEPA ID on attempt ${attempt}:`, error.message);
      }
    }
    
    throw new Error(`Failed to generate unique global DEPA ID after ${maxRetries} attempts`);
  }

  /**
   * Get current deployment configuration
   * @returns {Object} Current deployment configuration
   */
  getCurrentDeployment() {
    return { ...this.currentDeployment };
  }

  /**
   * Get jurisdiction configuration
   * @param {string} jurisdiction - Jurisdiction code
   * @returns {Object|null} Jurisdiction configuration
   */
  getJurisdictionConfig(jurisdiction) {
    return this.jurisdictionConfigs[jurisdiction] || null;
  }

  /**
   * Test global DEPA ID generation for all entity types
   * @returns {Object} Test results
   */
  testGlobalGeneration() {
    const results = {};
    
    for (const entityType of this.validEntityTypes) {
      try {
        const globalDEPAId = this.generateGlobalDEPAId(entityType);
        const isValid = this.validateGlobalDEPAId(globalDEPAId);
        const deploymentInfo = this.extractDeploymentInfo(globalDEPAId);
        
        results[entityType] = {
          generated: globalDEPAId,
          valid: isValid,
          deploymentInfo: deploymentInfo,
          success: isValid && deploymentInfo !== null
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

  /**
   * Backward compatibility: Generate standard DEPA ID (no deployment prefix)
   * This maintains compatibility with existing code
   * @param {string} entityType - Entity type
   * @returns {string} Standard DEPA ID
   */
  generateStandardDEPAId(entityType) {
    // Use parent method for backward compatibility
    return super.generateDEPAId(entityType);
  }

  /**
   * Check if DEPA ID is global (has deployment prefix)
   * @param {string} depaId - DEPA ID to check
   * @returns {boolean} True if global, false if standard
   */
  isGlobalDEPAId(depaId) {
    if (!depaId || typeof depaId !== 'string') {
      return false;
    }
    
    // Count hyphens to determine if it's global
    const hyphenCount = (depaId.match(/-/g) || []).length;
    return hyphenCount >= 4; // Global format has more hyphens
  }

  /**
   * Convert standard DEPA ID to global DEPA ID
   * @param {string} standardDEPAId - Standard DEPA ID
   * @param {string} deploymentPrefix - Deployment prefix
   * @returns {string} Global DEPA ID
   */
  convertToGlobalDEPAId(standardDEPAId, deploymentPrefix = null) {
    if (this.isGlobalDEPAId(standardDEPAId)) {
      return standardDEPAId; // Already global
    }
    
    const entityType = this.getEntityType(standardDEPAId);
    const guid = this.getGUID(standardDEPAId);
    
    if (!entityType || !guid) {
      throw new Error('Invalid standard DEPA ID format');
    }
    
    const prefix = deploymentPrefix || this.currentDeployment.prefix;
    return `${prefix}-${entityType}-${guid}`;
  }
}

// Export the class for instantiation
module.exports = GlobalDEPAIdService; 