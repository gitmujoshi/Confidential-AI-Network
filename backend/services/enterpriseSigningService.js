/**
 * Enterprise Signing Service
 * Handles contract signing with enterprise cloud KMS systems
 */

const { Contract, EnterpriseKey, SigningRequest, Signature } = require('../models');
const CloudKMSService = require('./cloudKmsService');
const EnterpriseKeyService = require('./enterpriseKeyService');
const crypto = require('crypto');

class EnterpriseSigningService {
  constructor() {
    this.cloudKmsService = new CloudKMSService();
    this.enterpriseKeyService = new EnterpriseKeyService();
  }

  /**
   * Initiate contract signing with enterprise KMS
   * @param {string} contractId - Contract ID
   * @param {number} userId - User ID
   * @param {string} keyId - Enterprise key ID
   * @param {Object} kmsConfig - KMS configuration
   * @returns {Promise<Object>} - Signing result
   */
  async signContract(contractId, userId, keyId, kmsConfig) {
    try {
      // Get contract details
      const contract = await Contract.findOne({
        where: { contractId: contractId }
      });

      if (!contract) {
        throw new Error('Contract not found');
      }

      // Get enterprise key
      const enterpriseKey = await this.enterpriseKeyService.getEnterpriseKey(keyId, userId);

      // Generate contract hash
      const contractHash = this.generateContractHash(contract);

      // Create signing request record
      const signingRequest = await SigningRequest.create({
        contractId: contractId,
        userId: userId,
        keyId: keyId,
        contractHash: contractHash,
        status: 'PENDING',
        kmsConfig: kmsConfig,
        createdAt: new Date()
      });

      try {
        // Sign with enterprise KMS
        const signingResult = await this.cloudKmsService.signContract(
          contractHash,
          {
            provider: kmsConfig.provider,
            keyId: kmsConfig.keyId,
            credentials: kmsConfig.credentials
          }
        );

        // Verify signature with stored public key
        const isValid = this.cloudKmsService.verifySignature(
          signingResult.signature,
          contractHash,
          enterpriseKey.publicKey
        );

        if (!isValid) {
          throw new Error('Signature verification failed');
        }

        // Create signature record
        const signature = await Signature.create({
          contractId: contractId,
          userId: userId,
          keyId: keyId,
          signature: signingResult.signature,
          algorithm: signingResult.algorithm,
          contractHash: contractHash,
          signedAt: new Date(),
          verifiedAt: new Date(),
          isValid: true
        });

        // Update signing request status
        await signingRequest.update({
          status: 'COMPLETED',
          signature: signingResult.signature,
          completedAt: new Date()
        });

        // Update contract status
        await contract.update({
          status: 'SIGNED',
          signedAt: new Date(),
          updatedAt: new Date()
        });

        return {
          success: true,
          signature: {
            id: signature.id,
            signature: signingResult.signature,
            algorithm: signingResult.algorithm,
            signedAt: signature.signedAt,
            verifiedAt: signature.verifiedAt
          },
          contract: {
            id: contract.id,
            contractId: contract.contractId,
            status: contract.status,
            signedAt: contract.signedAt
          }
        };

      } catch (signingError) {
        // Update signing request status to failed
        await signingRequest.update({
          status: 'FAILED',
          error: signingError.message,
          failedAt: new Date()
        });

        throw signingError;
      }

    } catch (error) {
      console.error('Error in enterprise signing:', error);
      throw new Error(`Failed to sign contract: ${error.message}`);
    }
  }

  /**
   * Get signing requests for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} - List of signing requests
   */
  async getUserSigningRequests(userId) {
    try {
      const requests = await SigningRequest.findAll({
        where: { userId: userId },
        include: [
          {
            model: Contract,
            attributes: ['contractId', 'title', 'status']
          },
          {
            model: EnterpriseKey,
            attributes: ['keyId', 'algorithm', 'provider']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      return requests.map(request => ({
        id: request.id,
        contractId: request.contractId,
        keyId: request.keyId,
        contractHash: request.contractHash,
        status: request.status,
        signature: request.signature,
        createdAt: request.createdAt,
        completedAt: request.completedAt,
        failedAt: request.failedAt,
        error: request.error,
        contract: request.Contract,
        enterpriseKey: request.EnterpriseKey
      }));

    } catch (error) {
      console.error('Error fetching signing requests:', error);
      throw new Error(`Failed to fetch signing requests: ${error.message}`);
    }
  }

  /**
   * Get contract signatures
   * @param {string} contractId - Contract ID
   * @returns {Promise<Array>} - List of signatures
   */
  async getContractSignatures(contractId) {
    try {
      const signatures = await Signature.findAll({
        where: { contractId: contractId, isValid: true },
        include: [
          {
            model: EnterpriseKey,
            attributes: ['keyId', 'algorithm', 'provider']
          }
        ],
        order: [['signedAt', 'DESC']]
      });

      return signatures.map(signature => ({
        id: signature.id,
        userId: signature.userId,
        keyId: signature.keyId,
        signature: signature.signature,
        algorithm: signature.algorithm,
        signedAt: signature.signedAt,
        verifiedAt: signature.verifiedAt,
        enterpriseKey: signature.EnterpriseKey
      }));

    } catch (error) {
      console.error('Error fetching contract signatures:', error);
      throw new Error(`Failed to fetch contract signatures: ${error.message}`);
    }
  }

  /**
   * Generate contract hash for signing
   * @param {Object} contract - Contract object
   * @returns {string} - Contract hash
   */
  generateContractHash(contract) {
    const contractData = {
      contractId: contract.contractId,
      title: contract.title,
      description: contract.description,
      terms: contract.terms,
      price: contract.price,
      currency: contract.currency,
      startDate: contract.startDate,
      endDate: contract.endDate,
      partyType: contract.partyType,
      createdAt: contract.createdAt
    };

    const contractString = JSON.stringify(contractData, Object.keys(contractData).sort());
    return crypto.createHash('sha256').update(contractString).digest('hex');
  }

  /**
   * Verify contract signature
   * @param {string} contractId - Contract ID
   * @param {string} signature - Signature to verify
   * @param {string} keyId - Key ID
   * @returns {Promise<boolean>} - Verification result
   */
  async verifyContractSignature(contractId, signature, keyId) {
    try {
      // Get contract
      const contract = await Contract.findOne({
        where: { contractId: contractId }
      });

      if (!contract) {
        throw new Error('Contract not found');
      }

      // Get enterprise key
      const enterpriseKey = await this.enterpriseKeyService.getEnterpriseKey(keyId, contract.userId);

      // Generate contract hash
      const contractHash = this.generateContractHash(contract);

      // Verify signature
      return this.cloudKmsService.verifySignature(
        signature,
        contractHash,
        enterpriseKey.publicKey
      );

    } catch (error) {
      console.error('Error verifying contract signature:', error);
      return false;
    }
  }
}

module.exports = EnterpriseSigningService;
