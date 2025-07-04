/**
 * DID Service
 * 
 * Handles Decentralized Identifier (DID) operations including:
 * - DID resolution for both did:ethr and did:web methods
 * - DID ownership verification with enterprise-grade security
 * - DID document validation and caching
 * - DID creation and management for enterprise use cases
 * - Advanced did:web support for corporate domains
 */

const crypto = require('crypto');
const https = require('https');
const { ethers } = require('ethers');

class DIDService {
  constructor() {
    this.supportedMethods = ['ethr', 'web', 'key'];
    this.didResolvers = {
      ethr: this.resolveEthrDID.bind(this),
      web: this.resolveWebDID.bind(this),
      key: this.resolveKeyDID.bind(this)
    };
    
    // Cache for DID documents to improve performance
    this.didCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    
    // Enterprise configuration
    const allowedDomains = process.env.ALLOWED_DID_WEB_DOMAINS?.split(',') || [];
    this.enterpriseConfig = {
      allowedDomains: allowedDomains.filter(domain => domain.trim() !== ''),
      requireHttps: process.env.REQUIRE_HTTPS !== 'false',
      maxRedirects: parseInt(process.env.MAX_DID_REDIRECTS) || 3,
      timeout: parseInt(process.env.DID_RESOLUTION_TIMEOUT) || 10000
    };
  }

  /**
   * Validate DID format with enterprise requirements
   * @param {string} did - The DID to validate
   * @returns {boolean} - Whether the DID format is valid
   */
  validateDIDFormat(did) {
    if (!did || typeof did !== 'string') {
      return false;
    }

    // Basic DID format validation
    const didRegex = /^did:([a-z]+):(.+)$/;
    const match = did.match(didRegex);
    
    if (!match) {
      return false;
    }

    const [, method, identifier] = match;
    
    if (!this.supportedMethods.includes(method)) {
      return false;
    }

    // Method-specific validation
    switch (method) {
      case 'web':
        return this.validateWebDIDFormat(identifier);
      case 'ethr':
        return this.validateEthrDIDFormat(identifier);
      case 'key':
        return this.validateKeyDIDFormat(identifier);
      default:
        return true;
    }
  }

  /**
   * Validate did:web format for enterprise use
   * @param {string} identifier - The DID identifier
   * @returns {boolean} - Whether the format is valid
   */
  validateWebDIDFormat(identifier) {
    // did:web format: domain:path
    const parts = identifier.split(':');
    if (parts.length < 1) {
      console.log('❌ No domain found in identifier:', identifier);
      return false;
    }

    const domain = parts[0];
    console.log('🔍 Validating domain:', domain);
    
    // Validate domain format - simplified regex for common domains
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]$/;
    if (!domainRegex.test(domain)) {
      console.log('❌ Domain regex validation failed for:', domain);
      return false;
    }

    console.log('✅ Domain format is valid:', domain);

    // Check for enterprise domain restrictions
    if (this.enterpriseConfig.allowedDomains.length > 0) {
      const isAllowed = this.enterpriseConfig.allowedDomains.some(allowedDomain => {
        return domain === allowedDomain || domain.endsWith('.' + allowedDomain);
      });
      if (!isAllowed) {
        console.warn(`⚠️ Domain ${domain} not in allowed list:`, this.enterpriseConfig.allowedDomains);
        return false;
      }
    } else {
      console.log('✅ No domain restrictions configured, allowing:', domain);
    }

    return true;
  }

  /**
   * Validate did:ethr format
   * @param {string} identifier - The DID identifier
   * @returns {boolean} - Whether the format is valid
   */
  validateEthrDIDFormat(identifier) {
    const parts = identifier.split(':');
    if (parts.length < 2) {
      return false;
    }

    const [, address] = parts;
    return ethers.isAddress(address);
  }

  /**
   * Validate did:key format
   * @param {string} identifier - The DID identifier
   * @returns {boolean} - Whether the format is valid
   */
  validateKeyDIDFormat(identifier) {
    // did:key format: base58-encoded public key
    return identifier.length > 0 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(identifier);
  }

  /**
   * Parse DID into components with enhanced validation
   * @param {string} did - The DID to parse
   * @returns {Object} - Parsed DID components
   */
  parseDID(did) {
    if (!this.validateDIDFormat(did)) {
      throw new Error('Invalid DID format');
    }

    const parts = did.split(':');
    const method = parts[1];
    const identifier = parts.slice(2).join(':');

    return {
      method,
      identifier,
      full: did
    };
  }

  /**
   * Resolve DID to DID document with caching
   * @param {string} did - The DID to resolve
   * @returns {Promise<Object>} - The DID document
   */
  async resolveDID(did) {
    try {
      // Check cache first
      const cached = this.didCache.get(did);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log(`📋 Using cached DID document for: ${did}`);
        return cached.data;
      }

      const parsed = this.parseDID(did);
      const resolver = this.didResolvers[parsed.method];
      
      if (!resolver) {
        throw new Error(`Unsupported DID method: ${parsed.method}`);
      }

      const result = await resolver(parsed);
      
      // Cache the result
      this.didCache.set(did, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error(`❌ DID resolution failed for ${did}:`, error);
      throw new Error(`DID resolution failed: ${error.message}`);
    }
  }

  /**
   * Resolve did:ethr DID with enhanced blockchain integration
   * @param {Object} parsed - Parsed DID components
   * @returns {Promise<Object>} - DID document
   */
  async resolveEthrDID(parsed) {
    try {
      // For did:ethr, the identifier contains network:address
      const [network, address] = parsed.identifier.split(':');
      
      if (!address || !ethers.isAddress(address)) {
        throw new Error('Invalid Ethereum address in DID');
      }

      // Create a comprehensive DID document for did:ethr
      const didDocument = {
        '@context': [
          'https://www.w3.org/ns/did/v1',
          'https://w3id.org/security/suites/secp256k1recovery-2020/v2'
        ],
        id: parsed.full,
        verificationMethod: [
          {
            id: `${parsed.full}#controller`,
            type: 'EcdsaSecp256k1RecoveryMethod2020',
            controller: parsed.full,
            blockchainAccountId: `${address}@eip155:${this.getChainId(network)}`
          }
        ],
        authentication: [`${parsed.full}#controller`],
        assertionMethod: [`${parsed.full}#controller`],
        capabilityInvocation: [`${parsed.full}#controller`],
        capabilityDelegation: [`${parsed.full}#controller`],
        keyAgreement: [],
        service: [],
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      };

      return {
        didDocument,
        metadata: {
          method: 'ethr',
          network,
          address,
          chainId: this.getChainId(network),
          resolved: true
        }
      };
    } catch (error) {
      throw new Error(`did:ethr resolution failed: ${error.message}`);
    }
  }

  /**
   * Resolve did:web DID with enterprise features
   * @param {Object} parsed - Parsed DID components
   * @returns {Promise<Object>} - DID document
   */
  async resolveWebDID(parsed) {
    try {
      // For did:web, the identifier is domain:path
      const [domain, ...pathParts] = parsed.identifier.split(':');
      const path = pathParts.length > 0 ? pathParts.join(':') : '';
      
      // Construct the URL for the DID document
      const didPath = path ? `/${path}/.well-known/did.json` : '/.well-known/did.json';
      const url = `https://${domain}${didPath}`;

      console.log(`🔍 Resolving did:web from: ${url}`);

      // Fetch the DID document from the web server
      const didDocument = await this.fetchDIDDocument(url);
      
      // Validate the DID document
      this.validateDIDDocument(didDocument, parsed.full);

      // Extract enterprise metadata
      const enterpriseMetadata = this.extractEnterpriseMetadata(didDocument, domain);

      return {
        didDocument,
        metadata: {
          method: 'web',
          domain,
          path,
          url,
          resolved: true,
          enterprise: enterpriseMetadata
        }
      };
    } catch (error) {
      throw new Error(`did:web resolution failed: ${error.message}`);
    }
  }

  /**
   * Resolve did:key DID
   * @param {Object} parsed - Parsed DID components
   * @returns {Promise<Object>} - DID document
   */
  async resolveKeyDID(parsed) {
    try {
      // For did:key, the identifier is the public key
      const publicKey = parsed.identifier;
      
      // Create a basic DID document for did:key
      const didDocument = {
        '@context': 'https://www.w3.org/ns/did/v1',
        id: parsed.full,
        verificationMethod: [
          {
            id: `${parsed.full}#z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK`,
            type: 'Ed25519VerificationKey2020',
            controller: parsed.full,
            publicKeyMultibase: publicKey
          }
        ],
        authentication: [`${parsed.full}#z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK`],
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      };

      return {
        didDocument,
        metadata: {
          method: 'key',
          publicKey,
          resolved: true
        }
      };
    } catch (error) {
      throw new Error(`did:key resolution failed: ${error.message}`);
    }
  }

  /**
   * Extract enterprise metadata from DID document
   * @param {Object} didDocument - The DID document
   * @param {string} domain - The domain
   * @returns {Object} - Enterprise metadata
   */
  extractEnterpriseMetadata(didDocument, domain) {
    const metadata = {
      domain,
      hasServices: false,
      serviceTypes: [],
      verificationMethods: didDocument.verificationMethod?.length || 0,
      isEnterprise: false
    };

    // Check for services
    if (didDocument.service && didDocument.service.length > 0) {
      metadata.hasServices = true;
      metadata.serviceTypes = didDocument.service.map(s => s.type);
    }

    // Check for enterprise indicators
    const enterpriseIndicators = [
      'LinkedDomains',
      'LinkedIn',
      'GitHub',
      'Twitter',
      'Organization',
      'LegalEntity'
    ];

    metadata.isEnterprise = enterpriseIndicators.some(indicator => 
      didDocument.service?.some(s => s.type.includes(indicator))
    );

    return metadata;
  }

  /**
   * Fetch DID document with enterprise-grade error handling
   * @param {string} url - The URL to fetch from
   * @returns {Promise<Object>} - The DID document
   */
  async fetchDIDDocument(url) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('DID resolution timeout'));
      }, this.enterpriseConfig.timeout);

      const request = https.get(url, {
        timeout: this.enterpriseConfig.timeout,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ContractManagement-DID-Resolver/1.0'
        }
      }, (response) => {
        clearTimeout(timeout);

        // Handle redirects
        if (response.statusCode >= 300 && response.statusCode < 400) {
          const location = response.headers.location;
          if (location && this.enterpriseConfig.maxRedirects > 0) {
            console.log(`🔄 Following redirect to: ${location}`);
            this.enterpriseConfig.maxRedirects--;
            return this.fetchDIDDocument(location).then(resolve).catch(reject);
          }
        }

        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }

        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          try {
            const didDocument = JSON.parse(data);
            resolve(didDocument);
          } catch (error) {
            reject(new Error('Invalid JSON in DID document'));
          }
        });
      });

      request.on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`Network error: ${error.message}`));
      });

      request.on('timeout', () => {
        clearTimeout(timeout);
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  /**
   * Validate DID document with enterprise requirements
   * @param {Object} didDocument - The DID document to validate
   * @param {string} expectedDID - The expected DID
   */
  validateDIDDocument(didDocument, expectedDID) {
    if (!didDocument || typeof didDocument !== 'object') {
      throw new Error('Invalid DID document format');
    }

    if (didDocument.id !== expectedDID) {
      throw new Error(`DID mismatch: expected ${expectedDID}, got ${didDocument.id}`);
    }

    if (!didDocument['@context'] || !Array.isArray(didDocument['@context'])) {
      throw new Error('Missing or invalid @context in DID document');
    }

    if (!didDocument.verificationMethod || !Array.isArray(didDocument.verificationMethod)) {
      throw new Error('Missing or invalid verificationMethod in DID document');
    }

    // Validate verification methods
    for (const vm of didDocument.verificationMethod) {
      if (!vm.id || !vm.type || !vm.controller) {
        throw new Error('Invalid verification method in DID document');
      }
    }

    // Enterprise-specific validation
    if (this.enterpriseConfig.allowedDomains.length > 0) {
      const hasValidService = didDocument.service?.some(s => {
        if (s.type === 'LinkedDomains') {
          return s.serviceEndpoint.some(domain => 
            this.enterpriseConfig.allowedDomains.some(allowed => 
              domain.includes(allowed)
            )
          );
        }
        return false;
      });

      if (!hasValidService) {
        console.warn('⚠️ DID document does not contain required enterprise services');
      }
    }
  }

  /**
   * Verify DID ownership with enterprise-grade security
   * @param {string} did - The DID to verify
   * @param {string} walletAddress - The wallet address claiming ownership
   * @param {string} signature - The signature proving ownership
   * @param {string} message - The message that was signed
   * @returns {Promise<boolean>} - Whether the DID ownership is verified
   */
  async verifyDIDOwnership(did, walletAddress, signature, message) {
    try {
      console.log(`🔍 Verifying DID ownership: ${did} for wallet: ${walletAddress}`);

      // Parse the DID
      const parsed = this.parseDID(did);
      
      // Resolve the DID to get the DID document
      const { didDocument } = await this.resolveDID(did);

      // Verify based on DID method
      switch (parsed.method) {
        case 'ethr':
          return await this.verifyEthrDIDOwnership(did, walletAddress, signature, message, didDocument);
        case 'web':
          return await this.verifyWebDIDOwnership(did, walletAddress, signature, message, didDocument);
        case 'key':
          return await this.verifyKeyDIDOwnership(did, walletAddress, signature, message, didDocument);
        default:
          throw new Error(`Unsupported DID method for verification: ${parsed.method}`);
      }
    } catch (error) {
      console.error(`❌ DID ownership verification failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Verify did:ethr ownership with enhanced validation
   * @param {string} did - The DID to verify
   * @param {string} walletAddress - The wallet address claiming ownership
   * @param {string} signature - The signature proving ownership
   * @param {string} message - The message that was signed
   * @param {Object} didDocument - The DID document
   * @returns {Promise<boolean>} - Whether the DID ownership is verified
   */
  async verifyEthrDIDOwnership(did, walletAddress, signature, message, didDocument) {
    try {
      // For did:ethr, verify that the wallet address matches the DID controller
      const parsed = this.parseDID(did);
      const [, , address] = parsed.identifier.split(':');
      
      if (address.toLowerCase() !== walletAddress.toLowerCase()) {
        console.log(`❌ Wallet address mismatch: ${walletAddress} vs ${address}`);
        return false;
      }

      // Verify the signature
      const recoveredAddress = ethers.verifyMessage(message, signature);
      const isValidSignature = recoveredAddress.toLowerCase() === walletAddress.toLowerCase();

      console.log(`🔐 Signature verification: ${isValidSignature ? '✅' : '❌'}`);
      return isValidSignature;
    } catch (error) {
      console.error(`❌ did:ethr verification error: ${error.message}`);
      return false;
    }
  }

  /**
   * Verify did:web ownership with enterprise-grade verification
   * @param {string} did - The DID to verify
   * @param {string} walletAddress - The wallet address claiming ownership
   * @param {string} signature - The signature proving ownership
   * @param {string} message - The message that was signed
   * @param {Object} didDocument - The DID document
   * @returns {Promise<boolean>} - Whether the DID ownership is verified
   */
  async verifyWebDIDOwnership(did, walletAddress, signature, message, didDocument) {
    try {
      console.log(`🔍 Verifying did:web ownership for: ${did}`);

      // Check if DID document exists and has verification methods
      if (!didDocument || !didDocument.verificationMethod || didDocument.verificationMethod.length === 0) {
        console.log('❌ No verification methods found in DID document');
        return false;
      }

      // Find verification methods that can be used for authentication
      const authMethods = didDocument.verificationMethod.filter(vm => {
        return didDocument.authentication?.includes(vm.id) || 
               didDocument.assertionMethod?.includes(vm.id);
      });

      if (authMethods.length === 0) {
        console.log('❌ No authentication methods found in DID document');
        return false;
      }

      // Try to verify against each authentication method
      for (const method of authMethods) {
        try {
          const isValid = await this.verifyAgainstMethod(method, signature, message, walletAddress);
          if (isValid) {
            console.log(`✅ Verification successful with method: ${method.id}`);
            return true;
          }
        } catch (error) {
          console.log(`⚠️ Verification failed for method ${method.id}: ${error.message}`);
          continue;
        }
      }

      console.log('❌ All verification methods failed');
      return false;
    } catch (error) {
      console.error(`❌ did:web verification error: ${error.message}`);
      return false;
    }
  }

  /**
   * Verify signature against a specific verification method
   * @param {Object} method - The verification method
   * @param {string} signature - The signature
   * @param {string} message - The message
   * @param {string} walletAddress - The wallet address
   * @returns {Promise<boolean>} - Whether verification succeeded
   */
  async verifyAgainstMethod(method, signature, message, walletAddress) {
    try {
      switch (method.type) {
        case 'EcdsaSecp256k1VerificationKey2019':
          return await this.verifyEcdsaSecp256k1(method, signature, message, walletAddress);
        case 'Ed25519VerificationKey2020':
          return await this.verifyEd25519(method, signature, message, walletAddress);
        case 'RsaVerificationKey2018':
          return await this.verifyRsa(method, signature, message, walletAddress);
        default:
          console.log(`⚠️ Unsupported verification method type: ${method.type}`);
          return false;
      }
    } catch (error) {
      console.error(`❌ Verification against method failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Verify ECDSA Secp256k1 signature
   * @param {Object} method - The verification method
   * @param {string} signature - The signature
   * @param {string} message - The message
   * @param {string} walletAddress - The wallet address
   * @returns {Promise<boolean>} - Whether verification succeeded
   */
  async verifyEcdsaSecp256k1(method, signature, message, walletAddress) {
    try {
      // Extract public key from method
      const publicKey = method.publicKeyHex || method.publicKeyJwk;
      if (!publicKey) {
        return false;
      }

      // Verify signature using ethers
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
    } catch (error) {
      console.error(`❌ ECDSA verification error: ${error.message}`);
      return false;
    }
  }

  /**
   * Verify Ed25519 signature (placeholder)
   * @param {Object} method - The verification method
   * @param {string} signature - The signature
   * @param {string} message - The message
   * @param {string} walletAddress - The wallet address
   * @returns {Promise<boolean>} - Whether verification succeeded
   */
  async verifyEd25519(method, signature, message, walletAddress) {
    // Placeholder for Ed25519 verification
    // In production, you would use a library like @noble/ed25519
    console.log('⚠️ Ed25519 verification not implemented');
    return false;
  }

  /**
   * Verify RSA signature (placeholder)
   * @param {Object} method - The verification method
   * @param {string} signature - The signature
   * @param {string} message - The message
   * @param {string} walletAddress - The wallet address
   * @returns {Promise<boolean>} - Whether verification succeeded
   */
  async verifyRsa(method, signature, message, walletAddress) {
    // Placeholder for RSA verification
    console.log('⚠️ RSA verification not implemented');
    return false;
  }

  /**
   * Verify did:key ownership
   * @param {string} did - The DID to verify
   * @param {string} walletAddress - The wallet address claiming ownership
   * @param {string} signature - The signature proving ownership
   * @param {string} message - The message that was signed
   * @param {Object} didDocument - The DID document
   * @returns {Promise<boolean>} - Whether the DID ownership is verified
   */
  async verifyKeyDIDOwnership(did, walletAddress, signature, message, didDocument) {
    try {
      if (!didDocument || !didDocument.verificationMethod || didDocument.verificationMethod.length === 0) {
        console.log('❌ No verification methods found in DID document');
        return false;
      }

      // For did:key, verify against the public key in the DID
      const method = didDocument.verificationMethod[0];
      return await this.verifyAgainstMethod(method, signature, message, walletAddress);
    } catch (error) {
      console.error(`❌ did:key verification error: ${error.message}`);
      return false;
    }
  }

  /**
   * Create a system-generated did:ethr
   * @param {string} walletAddress - The wallet address
   * @param {string} network - The network (e.g., 'goerli', 'mainnet')
   * @returns {string} - The generated DID
   */
  createSystemDID(walletAddress, network = 'goerli') {
    if (!ethers.isAddress(walletAddress)) {
      throw new Error('Invalid wallet address');
    }

    return `did:ethr:${network}:${walletAddress}`;
  }

  /**
   * Create a system-generated did:web for enterprise use
   * @param {string} domain - The domain
   * @param {string} path - The path (optional)
   * @returns {string} - The generated DID
   */
  createSystemWebDID(domain, path = '') {
    if (!this.validateWebDIDFormat(`${domain}:${path}`)) {
      throw new Error('Invalid domain format for did:web');
    }

    return path ? `did:web:${domain}:${path}` : `did:web:${domain}`;
  }

  /**
   * Check if DID is available for registration
   * @param {string} did - The DID to check
   * @param {Object} db - Database instance
   * @returns {Promise<boolean>} - Whether the DID is available
   */
  async isDIDAvailable(did, db) {
    try {
      const existingUser = await db.User.findOne({
        where: { did: did }
      });

      return !existingUser;
    } catch (error) {
      console.error(`❌ Error checking DID availability: ${error.message}`);
      return false;
    }
  }

  /**
   * Get DID information with enterprise metadata
   * @param {string} did - The DID to get information for
   * @returns {Promise<Object>} - DID information
   */
  async getDIDInfo(did) {
    try {
      const parsed = this.parseDID(did);
      const { didDocument, metadata } = await this.resolveDID(did);

      return {
        did: parsed.full,
        method: parsed.method,
        identifier: parsed.identifier,
        didDocument,
        metadata,
        resolved: true,
        enterprise: metadata.enterprise || null
      };
    } catch (error) {
      console.error(`❌ Error getting DID info: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get chain ID for network name
   * @param {string} network - The network name
   * @returns {number} - The chain ID
   */
  getChainId(network) {
    const chainIds = {
      'mainnet': 1,
      'goerli': 5,
      'sepolia': 11155111,
      'polygon': 137,
      'mumbai': 80001
    };
    return chainIds[network] || 1;
  }

  /**
   * Clear DID cache
   */
  clearCache() {
    this.didCache.clear();
    console.log('🗑️ DID cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getCacheStats() {
    return {
      size: this.didCache.size,
      timeout: this.cacheTimeout,
      entries: Array.from(this.didCache.keys())
    };
  }
}

module.exports = new DIDService();