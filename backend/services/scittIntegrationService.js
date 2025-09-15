const axios = require('axios');
const logger = require('./loggerService');

class ScittIntegrationService {
  constructor() {
    this.baseUrl = process.env.SCITT_CCF_URL;
    this.enabled = process.env.SCITT_CCF_ENABLED === 'true';
    this.timeout = parseInt(process.env.SCITT_CCF_TIMEOUT);
    this.retryAttempts = parseInt(process.env.SCITT_CCF_RETRY_ATTEMPTS) || 3;
    this.retryDelay = parseInt(process.env.SCITT_CCF_RETRY_DELAY);
    
    if (!this.baseUrl) {
      throw new Error('SCITT_CCF_URL environment variable is required');
    }
    if (!this.timeout) {
      throw new Error('SCITT_CCF_TIMEOUT environment variable is required');
    }
    if (!this.retryDelay) {
      throw new Error('SCITT_CCF_RETRY_DELAY environment variable is required');
    }
  }

  /**
   * Check if SCITT CCF integration is enabled
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Check SCITT CCF service health
   */
  async checkHealth() {
    if (!this.enabled) {
      return { status: 'disabled', message: 'SCITT CCF integration is disabled' };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: this.timeout
      });
      return response.data;
    } catch (error) {
      logger.warn('SCITT CCF health check failed:', error.message);
      return { 
        status: 'unhealthy', 
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Create a SCITT claim for contract data
   */
  async createClaim(contractId, dataHash, claimType, metadata = {}) {
    if (!this.enabled) {
      logger.info('SCITT CCF integration disabled, skipping claim creation');
      return null;
    }

    try {
      const response = await axios.post(`${this.baseUrl}/api/claims`, {
        contract_id: contractId,
        data_hash: dataHash,
        claim_type: claimType,
        metadata
      }, {
        timeout: this.timeout
      });

      logger.info(`SCITT claim created successfully for contract ${contractId}`);
      return response.data;
    } catch (error) {
      logger.error('Failed to create SCITT claim:', error.message);
      throw new Error(`SCITT claim creation failed: ${error.message}`);
    }
  }

  /**
   * Get SCITT claim details
   */
  async getClaim(claimId) {
    if (!this.enabled) {
      logger.info('SCITT CCF integration disabled, cannot retrieve claim');
      return null;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/api/claims/${claimId}`, {
        timeout: this.timeout
      });

      return response.data;
    } catch (error) {
      logger.error(`Failed to retrieve SCITT claim ${claimId}:`, error.message);
      throw new Error(`SCITT claim retrieval failed: ${error.message}`);
    }
  }

  /**
   * Verify data provenance using Merkle proof
   */
  async verifyProvenance(claimId, dataHash, merkleProof) {
    if (!this.enabled) {
      logger.info('SCITT CCF integration disabled, cannot verify provenance');
      return null;
    }

    try {
      const response = await axios.post(`${this.baseUrl}/api/claims/${claimId}/verify`, {
        data_hash: dataHash,
        merkle_proof: merkleProof
      }, {
        timeout: this.timeout
      });

      logger.info(`Provenance verification completed for claim ${claimId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to verify provenance for claim ${claimId}:`, error.message);
      throw new Error(`Provenance verification failed: ${error.message}`);
    }
    }

  /**
   * List claims for a specific contract
   */
  async listContractClaims(contractId, options = {}) {
    if (!this.enabled) {
      logger.info('SCITT CCF integration disabled, cannot list claims');
      return { claims: [], pagination: { total: 0, limit: 0, offset: 0, has_more: false } };
    }

    try {
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit);
      if (options.offset) params.append('offset', options.offset);
      if (options.status) params.append('status', options.status);
      if (options.claim_type) params.append('claim_type', options.claim_type);

      const response = await axios.get(`${this.baseUrl}/api/contracts/${contractId}/claims?${params}`, {
        timeout: this.timeout
      });

      return response.data;
    } catch (error) {
      logger.error(`Failed to list claims for contract ${contractId}:`, error.message);
      throw new Error(`Failed to list contract claims: ${error.message}`);
    }
  }

  /**
   * Create provenance record with graceful degradation
   */
  async createProvenanceRecord(contractId, dataHash, claimType = 'DATA_PROVENANCE', metadata = {}) {
    if (!this.enabled) {
      logger.info('SCITT CCF integration disabled, skipping provenance record creation');
      return {
        enabled: false,
        message: 'SCITT CCF integration is disabled',
        timestamp: new Date().toISOString()
      };
    }

    try {
      // Create SCITT claim
      const claimResult = await this.createClaim(contractId, dataHash, claimType, metadata);
      
      if (claimResult && claimResult.success) {
        logger.info(`Provenance record created successfully for contract ${contractId}`);
        return {
          enabled: true,
          claim_id: claimResult.claim.claim_id,
          status: 'CREATED',
          merkle_tree: claimResult.merkle_tree,
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error('Invalid response from SCITT CCF service');
      }
    } catch (error) {
      logger.error(`Failed to create provenance record for contract ${contractId}:`, error.message);
      
      // Return graceful degradation response
      return {
        enabled: true,
        status: 'FAILED',
        error: error.message,
        message: 'Provenance record creation failed, but contract creation continues',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Verify data provenance with graceful degradation
   */
  async verifyDataProvenance(contractId, dataHash, verificationMethod = 'MERKLE_PROOF') {
    if (!this.enabled) {
      logger.info('SCITT CCF integration disabled, cannot verify provenance');
      return {
        enabled: false,
        verified: false,
        message: 'SCITT CCF integration is disabled',
        timestamp: new Date().toISOString()
      };
    }

    try {
      // First, get the contract's SCITT reference
      const contract = await this.getContractWithProvenance(contractId);
      
      if (!contract.provenance || !contract.provenance.claim_id) {
        return {
          enabled: true,
          verified: false,
          message: 'No provenance record found for this contract',
          timestamp: new Date().toISOString()
        };
      }

      // Verify the provenance
      const verificationResult = await this.verifyProvenance(
        contract.provenance.claim_id,
        dataHash,
        { method: verificationMethod }
      );

      if (verificationResult && verificationResult.success) {
        return {
          enabled: true,
          verified: true,
          claim_id: contract.provenance.claim_id,
          verification: verificationResult.verification,
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          enabled: true,
          verified: false,
          message: 'Provenance verification failed',
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      logger.error(`Failed to verify data provenance for contract ${contractId}:`, error.message);
      
      return {
        enabled: true,
        verified: false,
        error: error.message,
        message: 'Provenance verification failed due to service error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get contract with provenance information
   */
  async getContractWithProvenance(contractId) {
    // This would typically integrate with your contract service
    // For now, we'll return a mock response
    try {
      // Get contract from your existing contract service
      // const contract = await contractService.getContract(contractId);
      
      // Mock response for demonstration
      const contract = {
        id: contractId,
        contract_id: `CONTRACT-${contractId}`,
        title: 'Sample Contract',
        status: 'ACTIVE'
      };

      // Add provenance information if available
      try {
        const claims = await this.listContractClaims(contractId, { limit: 1 });
        if (claims.claims && claims.claims.length > 0) {
          contract.provenance = {
            enabled: true,
            claim_id: claims.claims[0].claim_id,
            status: claims.claims[0].status,
            last_verified: claims.claims[0].verified_at
          };
        } else {
          contract.provenance = {
            enabled: false,
            message: 'No provenance records found'
          };
        }
      } catch (error) {
        logger.warn(`Could not retrieve provenance for contract ${contractId}:`, error.message);
        contract.provenance = {
          enabled: false,
          error: error.message
        };
      }

      return contract;
    } catch (error) {
      logger.error(`Failed to get contract ${contractId}:`, error.message);
      throw error;
    }
  }

  /**
   * Retry mechanism for failed requests
   */
  async retryRequest(requestFn, maxAttempts = this.retryAttempts) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxAttempts) {
          break;
        }
        
        logger.warn(`SCITT CCF request failed (attempt ${attempt}/${maxAttempts}), retrying...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }
    
    throw lastError;
  }

  /**
   * Get service status summary
   */
  async getServiceStatus() {
    const health = await this.checkHealth();
    
    return {
      enabled: this.enabled,
      base_url: this.baseUrl,
      timeout: this.timeout,
      health: health,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new ScittIntegrationService();
