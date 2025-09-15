const crypto = require('crypto');
const { User, Contract, Signature, SigningEvent, EnterpriseKey, SigningRequest } = require('../models');
const cloudKmsService = require('./cloudKmsService');
const scittCcfService = require('./scittCcfService');
const auditService = require('./auditService');
class EnterpriseSigningService {
  constructor() {
    this.loadConfiguration();
  }

  /**
   * Load enterprise signing configuration from environment variables
   */
  loadConfiguration() {
    // Validate required environment variables
    this.validateEnvironmentVariables();
    
    // Parse supported algorithms from environment
    const algorithmsEnv = process.env.ENTERPRISE_SIGNING_ALGORITHMS;
    this.supportedAlgorithms = algorithmsEnv.split(',').map(alg => alg.trim());
    this.supportedProviders = ['azure', 'aws', 'gcp', 'oci'];
  }
  
  validateEnvironmentVariables() {
    const requiredVars = [
      'ENTERPRISE_SIGNING_ALGORITHMS'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  }

  /**
   * Register an enterprise public key
   */
  async registerEnterpriseKey(userId, publicKey, provider, algorithm, metadata = {}) {
    try {
      if (!this.supportedProviders.includes(provider)) {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      if (!this.supportedAlgorithms.includes(algorithm)) {
        throw new Error(`Unsupported algorithm: ${algorithm}`);
      }

      // Generate a unique key ID
      const keyId = `ENT-${crypto.randomUUID()}`;

      // Store the enterprise key
      const enterpriseKey = await EnterpriseKey.create({
        keyId,
        userId,
        publicKey: JSON.stringify(publicKey),
        provider,
        algorithm,
        status: 'ACTIVE',
        metadata: {
          ...metadata,
          registeredAt: new Date().toISOString(),
          provider,
          algorithm
        }
      });

      await auditService.log('ENTERPRISE_KEY_REGISTERED', {
        userId,
        keyId,
        provider,
        algorithm
      });

      return {
        success: true,
        keyId,
        message: 'Enterprise key registered successfully'
      };
    } catch (error) {
      console.error('Error registering enterprise key:', error);
      throw new Error(`Failed to register enterprise key: ${error.message}`);
    }
  }

  /**
   * Get all enterprise keys for a user
   */
  async getEnterpriseKeys(userId) {
    try {
      const keys = await EnterpriseKey.findAll({
        where: { userId },
        attributes: ['keyId', 'publicKey', 'provider', 'algorithm', 'status', 'metadata', 'createdAt'],
        order: [['createdAt', 'DESC']]
      });

      return {
        success: true,
        keys: keys.map(key => ({
          keyId: key.keyId,
          publicKey: JSON.parse(key.publicKey),
          provider: key.provider,
          algorithm: key.algorithm,
          status: key.status,
          metadata: key.metadata,
          createdAt: key.createdAt
        }))
      };
    } catch (error) {
      console.error('Error fetching enterprise keys:', error);
      throw new Error(`Failed to fetch enterprise keys: ${error.message}`);
    }
  }

  /**
   * Get a specific enterprise key
   */
  async getEnterpriseKey(keyId) {
    try {
      const key = await EnterpriseKey.findOne({
        where: { keyId },
        attributes: ['keyId', 'userId', 'publicKey', 'provider', 'algorithm', 'status', 'metadata', 'createdAt']
      });

      if (!key) {
        throw new Error('Enterprise key not found');
      }

      return {
        success: true,
        key: {
          keyId: key.keyId,
          userId: key.userId,
          publicKey: JSON.parse(key.publicKey),
          provider: key.provider,
          algorithm: key.algorithm,
          status: key.status,
          metadata: key.metadata,
          createdAt: key.createdAt
        }
      };
    } catch (error) {
      console.error('Error fetching enterprise key:', error);
      throw new Error(`Failed to fetch enterprise key: ${error.message}`);
    }
  }

  /**
   * Deactivate an enterprise key
   */
  async deactivateEnterpriseKey(userId, keyId) {
    try {
      const key = await EnterpriseKey.findOne({
        where: { keyId, userId }
      });

      if (!key) {
        throw new Error('Enterprise key not found');
      }

      await key.update({ status: 'INACTIVE' });

      await auditService.log('ENTERPRISE_KEY_DEACTIVATED', {
        userId,
        keyId
      });

      return {
        success: true,
        message: 'Enterprise key deactivated successfully'
      };
    } catch (error) {
      console.error('Error deactivating enterprise key:', error);
      throw new Error(`Failed to deactivate enterprise key: ${error.message}`);
    }
  }

  /**
   * Get supported algorithms for enterprise signing
   */
  getSupportedAlgorithms() {
    return {
      success: true,
      algorithms: this.supportedAlgorithms.map(algorithm => {
        const algorithmInfo = {
          'ECDSA-P256': {
            name: 'ECDSA',
            curve: 'P-256',
            keySize: 256,
            description: 'Elliptic Curve Digital Signature Algorithm with P-256 curve'
          },
          'RSA-2048': {
            name: 'RSA',
            keySize: 2048,
            description: 'RSA with 2048-bit key size'
          },
          'RSA-4096': {
            name: 'RSA',
            keySize: 4096,
            description: 'RSA with 4096-bit key size'
          }
        };

        return {
          algorithm,
          ...algorithmInfo[algorithm]
        };
      })
    };
  }

  /**
   * Initiate enterprise contract signing
   */
  async initiateEnterpriseSigning(contractId, userId, enterpriseKeyId, contractHash, kmsConfig) {
    try {
      // Verify the contract exists
      const contract = await Contract.findByPk(contractId);
      if (!contract) {
        throw new Error('Contract not found');
      }

      // Get the enterprise key
      const enterpriseKey = await EnterpriseKey.findOne({
        where: { keyId: enterpriseKeyId, userId, status: 'ACTIVE' }
      });

      if (!enterpriseKey) {
        throw new Error('Enterprise key not found or inactive');
      }

      // Create signing request
      const signingRequest = await SigningRequest.create({
        contractId,
        userId,
        keyId: enterpriseKeyId,
        contractHash,
        status: 'PENDING',
        kmsConfig: {
          ...kmsConfig,
          provider: enterpriseKey.provider,
          algorithm: enterpriseKey.algorithm
        }
      });

      // Perform remote signing using cloud KMS
      try {
        const signature = await cloudKmsService.sign(
          enterpriseKey.provider,
          kmsConfig.keyId || enterpriseKeyId,
          contractHash,
          kmsConfig.credentials
        );

        // Update signing request as completed
        await signingRequest.update({
          status: 'COMPLETED',
          signature,
          completedAt: new Date()
        });

        // Store signature in database
        const signatureRecord = await Signature.create({
          contractId,
          userId,
          keyId: enterpriseKeyId,
          signature,
          algorithm: enterpriseKey.algorithm,
          status: 'ACTIVE',
          metadata: {
            signedAt: new Date().toISOString(),
            contractHash,
            provider: enterpriseKey.provider,
            signingRequestId: signingRequest.id
          }
        });

        // Log signing event
        await SigningEvent.create({
          contractId,
          userId,
          keyId: enterpriseKeyId,
          eventType: 'ENTERPRISE_SIGNED',
          status: 'SUCCESS',
          metadata: {
            signatureId: signatureRecord.id,
            contractHash,
            provider: enterpriseKey.provider,
            signingRequestId: signingRequest.id
          }
        });

        // Store in SCITT CCF ledger
        try {
          await scittCcfService.storeSignature(contractId, signature, {
            userId,
            keyId: enterpriseKeyId,
            algorithm: enterpriseKey.algorithm,
            contractHash,
            provider: enterpriseKey.provider
          });
        } catch (scittError) {
          console.warn('Failed to store signature in SCITT CCF:', scittError);
          // Continue even if SCITT CCF fails
        }

        await auditService.log('ENTERPRISE_CONTRACT_SIGNED', {
          contractId,
          userId,
          keyId: enterpriseKeyId,
          signatureId: signatureRecord.id,
          provider: enterpriseKey.provider
        });

        return {
          success: true,
          signatureId: signatureRecord.id,
          signature,
          message: 'Contract signed successfully using enterprise key'
        };
      } catch (signingError) {
        // Update signing request as failed
        await signingRequest.update({
          status: 'FAILED',
          error: signingError.message,
          failedAt: new Date()
        });

        // Log failed signing event
        await SigningEvent.create({
          contractId,
          userId,
          keyId: enterpriseKeyId,
          eventType: 'ENTERPRISE_SIGN_FAILED',
          status: 'FAILED',
          metadata: {
            error: signingError.message,
            signingRequestId: signingRequest.id
          }
        });

        throw signingError;
      }
    } catch (error) {
      console.error('Error initiating enterprise signing:', error);
      throw new Error(`Failed to initiate enterprise signing: ${error.message}`);
    }
  }

  /**
   * Verify an enterprise signature
   */
  async verifyEnterpriseSignature(contractId, signature, enterpriseKeyId, contractHash) {
    try {
      // Get the enterprise key
      const enterpriseKey = await EnterpriseKey.findOne({
        where: { keyId: enterpriseKeyId, status: 'ACTIVE' }
      });

      if (!enterpriseKey) {
        throw new Error('Enterprise key not found or inactive');
      }

      // Verify signature using the stored public key
      const publicKey = JSON.parse(enterpriseKey.publicKey);
      const isValid = await cloudKmsService.verifySignature(
        contractHash,
        signature,
        publicKey,
        enterpriseKey.algorithm
      );

      if (!isValid) {
        throw new Error('Invalid signature');
      }

      await auditService.log('ENTERPRISE_SIGNATURE_VERIFIED', {
        contractId,
        keyId: enterpriseKeyId,
        signature
      });

      return {
        success: true,
        valid: true,
        message: 'Enterprise signature is valid'
      };
    } catch (error) {
      console.error('Error verifying enterprise signature:', error);
      throw new Error(`Failed to verify enterprise signature: ${error.message}`);
    }
  }

  /**
   * Get signing requests for a user
   */
  async getSigningRequests(userId) {
    try {
      const requests = await SigningRequest.findAll({
        where: { userId },
        include: [
          {
            model: Contract,
            as: 'contract',
            attributes: ['id', 'contractId', 'title', 'status']
          },
          {
            model: EnterpriseKey,
            as: 'enterpriseKey',
            attributes: ['keyId', 'provider', 'algorithm']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      return {
        success: true,
        requests: requests.map(req => ({
          id: req.id,
          contractId: req.contractId,
          userId: req.userId,
          keyId: req.keyId,
          contractHash: req.contractHash,
          status: req.status,
          signature: req.signature,
          kmsConfig: req.kmsConfig,
          error: req.error,
          completedAt: req.completedAt,
          failedAt: req.failedAt,
          createdAt: req.createdAt,
          contract: req.contract,
          enterpriseKey: req.enterpriseKey
        }))
      };
    } catch (error) {
      console.error('Error fetching signing requests:', error);
      throw new Error(`Failed to fetch signing requests: ${error.message}`);
    }
  }

  /**
   * Get contract signatures (both traditional and enterprise)
   */
  async getContractSignatures(contractId) {
    try {
      const signatures = await Signature.findAll({
        where: { contractId, status: 'ACTIVE' },
        include: [
          {
            model: User,
            as: 'signer',
            attributes: ['id', 'username', 'email', 'firstName', 'lastName']
          }
        ],
        order: [['createdAt', 'ASC']]
      });

      return {
        success: true,
        signatures: signatures.map(sig => ({
          id: sig.id,
          userId: sig.userId,
          keyId: sig.keyId,
          signature: sig.signature,
          algorithm: sig.algorithm,
          status: sig.status,
          metadata: sig.metadata,
          createdAt: sig.createdAt,
          signer: sig.signer,
          isEnterprise: sig.metadata?.provider ? true : false
        }))
      };
    } catch (error) {
      console.error('Error fetching contract signatures:', error);
      throw new Error(`Failed to fetch contract signatures: ${error.message}`);
    }
  }
}

module.exports = new EnterpriseSigningService();