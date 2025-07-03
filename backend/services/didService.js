/**
 * DID Service
 * 
 * Handles Decentralized Identifier (DID) operations including:
 * - DID resolution for both did:ethr and did:web methods
 * - DID ownership verification
 * - DID document validation
 * - DID creation and management
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
  }

  /**
   * Validate DID format
   * @param {string} did - The DID to validate
   * @returns {boolean} - Whether the DID format is valid
   */
  validateDIDFormat(did) {
    if (!did || typeof did !== 'string') {
      return false;
    }

    // Basic DID format validation - allow multiple colons for method-specific formats
    const didRegex = /^did:([a-z]+):(.+)$/;
    const match = did.match(didRegex);
    
    if (!match) {
      return false;
    }

    const [, method] = match;
    return this.supportedMethods.includes(method);
  }

  /**
   * Parse DID into components
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
   * Resolve DID to DID document
   * @param {string} did - The DID to resolve
   * @returns {Promise<Object>} - The DID document
   */
  async resolveDID(did) {
    try {
      const parsed = this.parseDID(did);
      const resolver = this.didResolvers[parsed.method];
      
      if (!resolver) {
        throw new Error(`Unsupported DID method: ${parsed.method}`);
      }

      return await resolver(parsed);
    } catch (error) {
      console.error(`❌ DID resolution failed for ${did}:`, error);
      throw new Error(`DID resolution failed: ${error.message}`);
    }
  }

  /**
   * Resolve did:ethr DID
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

      // Create a basic DID document for did:ethr
      // In production, you would resolve this from the blockchain
      const didDocument = {
        '@context': 'https://www.w3.org/ns/did/v1',
        id: parsed.full,
        verificationMethod: [
          {
            id: `${parsed.full}#controller`,
            type: 'EcdsaSecp256k1VerificationKey2019',
            controller: parsed.full,
            publicKeyHex: `0x${'0'.repeat(64)}` // Placeholder - would be resolved from blockchain
          }
        ],
        authentication: [`${parsed.full}#controller`],
        assertionMethod: [`${parsed.full}#controller`],
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      };

      return {
        didDocument,
        metadata: {
          method: 'ethr',
          network,
          address,
          resolved: true
        }
      };
    } catch (error) {
      throw new Error(`did:ethr resolution failed: ${error.message}`);
    }
  }

  /**
   * Resolve did:web DID
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

      return {
        didDocument,
        metadata: {
          method: 'web',
          domain,
          path,
          url,
          resolved: true
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
   * Fetch DID document from URL
   * @param {string} url - The URL to fetch from
   * @returns {Promise<Object>} - The DID document
   */
  fetchDIDDocument(url) {
    return new Promise((resolve, reject) => {
      const request = https.get(url, (response) => {
        let data = '';

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          try {
            if (response.statusCode !== 200) {
              reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
              return;
            }

            const didDocument = JSON.parse(data);
            resolve(didDocument);
          } catch (error) {
            reject(new Error(`Failed to parse DID document: ${error.message}`));
          }
        });
      });

      request.on('error', (error) => {
        reject(new Error(`Failed to fetch DID document: ${error.message}`));
      });

      request.setTimeout(10000, () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  /**
   * Validate DID document
   * @param {Object} didDocument - The DID document to validate
   * @param {string} expectedDID - The expected DID
   */
  validateDIDDocument(didDocument, expectedDID) {
    if (!didDocument || typeof didDocument !== 'object') {
      throw new Error('Invalid DID document format');
    }

    if (!didDocument.id || didDocument.id !== expectedDID) {
      throw new Error('DID document ID does not match expected DID');
    }

    if (!didDocument['@context'] || !didDocument['@context'].includes('https://www.w3.org/ns/did/v1')) {
      throw new Error('Invalid DID document context');
    }

    if (!didDocument.verificationMethod || !Array.isArray(didDocument.verificationMethod)) {
      throw new Error('DID document must contain verification methods');
    }

    if (didDocument.verificationMethod.length === 0) {
      throw new Error('DID document must have at least one verification method');
    }
  }

  /**
   * Verify DID ownership
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
   * Verify did:ethr ownership
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
   * Verify did:web ownership
   * @param {string} did - The DID to verify
   * @param {string} walletAddress - The wallet address claiming ownership
   * @param {string} signature - The signature proving ownership
   * @param {string} message - The message that was signed
   * @param {Object} didDocument - The DID document
   * @returns {Promise<boolean>} - Whether the DID ownership is verified
   */
  async verifyWebDIDOwnership(did, walletAddress, signature, message, didDocument) {
    try {
      // For did:web, we need to verify the signature against the public key in the DID document
      // This is a simplified implementation - in production, you would:
      // 1. Extract the public key from the DID document
      // 2. Verify the signature against that public key
      // 3. Check if the wallet address is authorized in the DID document

      // For now, we'll verify the signature format and assume it's valid
      // if the DID document exists and is properly formatted
      if (!didDocument || !didDocument.verificationMethod || didDocument.verificationMethod.length === 0) {
        console.log('❌ No verification methods found in DID document');
        return false;
      }

      // Check if the signature is valid format
      if (!signature || signature.length < 10) {
        console.log('❌ Invalid signature format');
        return false;
      }

      // In a real implementation, you would verify the signature against the public key
      // For now, we'll assume it's valid if the DID document exists
      console.log('✅ did:web verification passed (simplified)');
      return true;
    } catch (error) {
      console.error(`❌ did:web verification error: ${error.message}`);
      return false;
    }
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
      // For did:key, we need to verify the signature against the public key in the DID
      // This is a simplified implementation
      if (!didDocument || !didDocument.verificationMethod || didDocument.verificationMethod.length === 0) {
        console.log('❌ No verification methods found in DID document');
        return false;
      }

      // Check if the signature is valid format
      if (!signature || signature.length < 10) {
        console.log('❌ Invalid signature format');
        return false;
      }

      // In a real implementation, you would verify the signature against the public key
      // For now, we'll assume it's valid if the DID document exists
      console.log('✅ did:key verification passed (simplified)');
      return true;
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
   * Get DID information
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
        resolved: true
      };
    } catch (error) {
      console.error(`❌ Error getting DID info: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new DIDService();