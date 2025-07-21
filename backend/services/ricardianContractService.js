/**
 * Ricardian Contract Service
 * 
 * This service handles the creation and management of Ricardian contracts,
 * which combine human-readable legal documents with machine-executable smart contracts.
 * 
 * Features:
 * - Legal document generation and validation
 * - Cryptographic signature creation and verification
 * - Smart contract integration
 * - Multi-KMS support for data encryption
 * - Azure Confidential Computing integration
 */

const crypto = require('crypto');
const { ethers } = require('ethers');
const { Contract } = require('../models');
const blockchainService = require('./blockchainService');

class RicardianContractService {
  constructor() {
    this.supportedNetworks = ['goerli', 'mainnet', 'sepolia'];
    this.legalDocumentTemplates = null; // Will be loaded lazily
  }

  /**
   * Load legal document templates
   */
  async loadTemplates() {
    if (this.legalDocumentTemplates) {
      return this.legalDocumentTemplates;
    }

    try {
      const path = require('path');
      const fs = require('fs');
      
      // Define fallback templates
      const fallbackAITraining = {
        ricardianContract: {
          metadata: {
            contractType: "AI_TRAINING_CONTRACT",
            version: "1.0.0",
            createdAt: new Date().toISOString(),
            legalDocumentHash: null,
            smartContractAddress: null,
            ricardianSignature: null
          },
          legalDocument: {
            title: "AI Model Training Agreement",
            documentType: "CONTRACT",
            effectiveDate: new Date().toISOString().split('T')[0],
            expirationDate: null,
            parties: {
              dataProvider: {
                name: "",
                email: "",
                blockchainAddress: "",
                did: ""
              },
              modelTrainer: {
                name: "",
                email: "",
                blockchainAddress: "",
                did: ""
              },
              ccrp: {
                name: "",
                email: "",
                blockchainAddress: "",
                did: ""
              }
            },
            terms: [
              {
                section: "1. DATA USAGE",
                content: "The data provider grants the model trainer permission to use the specified dataset for AI model training purposes only."
              },
              {
                section: "2. CONFIDENTIALITY",
                content: "All data processing must occur in a secure, confidential computing environment."
              },
              {
                section: "3. COMPLIANCE",
                content: "All parties must comply with applicable data protection regulations including DPDP Act 2023."
              }
            ]
          },
          trainingEnvironment: {
            ccrpPlatform: {
              provider: "Default CCRP Provider",
              securityLevel: 9,
              attestationRequired: true
            }
          },
          smartContract: {
            address: null,
            state: {
              contractId: null,
              legalDocumentHash: null
            }
          }
        }
      };

      const fallbackBasic = {
        ricardianContract: {
          metadata: {
            contractType: "BASIC_CONTRACT",
            version: "1.0.0",
            createdAt: new Date().toISOString(),
            legalDocumentHash: null,
            smartContractAddress: null,
            ricardianSignature: null
          },
          legalDocument: {
            title: "Data Sharing Agreement",
            documentType: "CONTRACT",
            effectiveDate: new Date().toISOString().split('T')[0],
            expirationDate: null,
            parties: {
              provider: {
                name: "",
                email: "",
                blockchainAddress: "",
                did: ""
              },
              consumer: {
                name: "",
                email: "",
                blockchainAddress: "",
                did: ""
              }
            },
            terms: [
              {
                section: "1. DATA SHARING",
                content: "The provider grants the consumer permission to access and use the specified dataset."
              },
              {
                section: "2. SECURITY",
                content: "All data access must comply with security requirements and data protection regulations."
              }
            ]
          },
          smartContract: {
            address: null,
            state: {
              contractId: null,
              legalDocumentHash: null
            }
          }
        }
      };

      // Try to load template files, fallback to default templates if files don't exist
      let aiTrainingTemplate, basicTemplate;
      
      try {
        const aiTrainingPath = path.join(__dirname, '../assets/ai_training_ricardian_contract.json');
        if (fs.existsSync(aiTrainingPath)) {
          aiTrainingTemplate = JSON.parse(fs.readFileSync(aiTrainingPath, 'utf8'));
        } else {
          console.log('⚠️ AI training template file not found, using fallback template');
          aiTrainingTemplate = fallbackAITraining;
        }
      } catch (error) {
        console.log('⚠️ Error loading AI training template, using fallback:', error.message);
        aiTrainingTemplate = fallbackAITraining;
      }

      try {
        const basicPath = path.join(__dirname, '../assets/ricardian_contract_example.json');
        if (fs.existsSync(basicPath)) {
          basicTemplate = JSON.parse(fs.readFileSync(basicPath, 'utf8'));
        } else {
          console.log('⚠️ Basic template file not found, using fallback template');
          basicTemplate = fallbackBasic;
        }
      } catch (error) {
        console.log('⚠️ Error loading basic template, using fallback:', error.message);
        basicTemplate = fallbackBasic;
      }
      
      this.legalDocumentTemplates = {
        'AI_TRAINING': aiTrainingTemplate,
        'BASIC': basicTemplate
      };
      
      return this.legalDocumentTemplates;
    } catch (error) {
      console.error('Error loading legal document templates:', error);
      throw new Error('Failed to load legal document templates');
    }
  }

  /**
   * Create a new Ricardian contract
   * @param {Object} contractData - Contract data including parties, terms, etc.
   * @param {string} contractType - Type of contract (AI_TRAINING, BASIC)
   * @returns {Object} Created contract with Ricardian binding
   */
  async createRicardianContract(contractData, contractType = 'AI_TRAINING') {
    try {
      console.log('🔍 Starting Ricardian contract creation...');
      console.log('🔍 Contract data:', JSON.stringify(contractData, null, 2));
      console.log('🔍 Contract type:', contractType);
      
      // Generate legal document
      console.log('🔍 Generating legal document...');
      const legalDocument = await this.generateLegalDocument(contractData, contractType);
      console.log('✅ Legal document generated');
      
      // Create cryptographic hash of legal document
      console.log('🔍 Creating document hash...');
      const legalDocumentHash = this.createDocumentHash(legalDocument);
      console.log('✅ Document hash created:', legalDocumentHash);
      
      // Generate Ricardian signature
      console.log('🔍 Creating Ricardian signature...');
      const ricardianSignature = await this.createRicardianSignature(legalDocumentHash);
      console.log('✅ Ricardian signature created');
      
      // Deploy smart contract
      console.log('🔍 Deploying smart contract...');
      const smartContractData = await this.deploySmartContract(contractData, legalDocumentHash);
      console.log('✅ Smart contract deployed');
      
      // Create contract record
      console.log('🔍 Creating contract record in database...');
      
      // Generate DEPA ID for the contract
      const DEPAIdService = require('./depaIdService');
      const depaIdService = new DEPAIdService();
      const depaId = depaIdService.generateContractDEPAId();
      
      const contractRecord = {
        contractId: contractData.contractId,
        tdpId: contractData.tdpId,
        primaryTdpId: contractData.primaryTdpId,
        tdcId: contractData.tdcId,
        ccrpId: contractData.ccrpId,
        datasetId: contractData.datasetId,
        primaryDatasetId: contractData.primaryDatasetId,
        modelId: contractData.modelId,
        price: contractData.price,
        duration: contractData.duration,
        termsAndConditions: contractData.termsAndConditions,
        legalDocument,
        legalDocumentHash,
        ricardianSignature,
        smartContractAddress: smartContractData.address,
        smartContractNetwork: smartContractData.network,
        blockchainContractId: smartContractData.contractId,
        depaId, // Add DEPA ID
        status: 'PENDING_TDP_APPROVAL',
        multiTdpStatus: 'PENDING_ALL_TDP_APPROVAL',
        tdpSigned: false,
        ccrpSigned: false,
        // Add aiModelIds if present
        aiModelIds: contractData.aiModelIds || null,
        // Add training parameters if present
        trainingParams: contractData.trainingParams ?? {},
        // Add environment specifications if present
        environmentSpecs: contractData.environmentSpecs ?? {},
        // Add KMS configurations if present
        kmsConfigs: contractData.kmsConfigs || null,
        // Add contractDatasets - required field for multi-dataset contracts
        contractDatasets: contractData.datasetSelections || contractData.contractDatasets || [],
        // Add dataset count
        datasetCount: contractData.datasetSelections ? contractData.datasetSelections.length : 1,
        // Add TDP count
        tdpCount: contractData.datasetSelections ? new Set(contractData.datasetSelections.map(ds => ds.tdpId)).size : 1,
        // Add total price
        totalPrice: contractData.price
      };
      
      console.log('🔍 Contract record to save:', JSON.stringify(contractRecord, null, 2));
      
      const contract = await Contract.create(contractRecord);
      console.log('✅ Contract record created in database');

      return {
        success: true,
        contract,
        legalDocument,
        smartContractData
      };
    } catch (error) {
      console.error('❌ Error creating Ricardian contract:', error);
      console.error('❌ Error stack:', error.stack);
      throw error;
    }
  }

  /**
   * Generate legal document based on contract type
   * @param {Object} contractData - Contract data
   * @param {string} contractType - Type of contract
   * @returns {Object} Generated legal document
   */
  async generateLegalDocument(contractData, contractType) {
    try {
      const templates = await this.loadTemplates();
      const template = templates[contractType];
      if (!template) {
        throw new Error(`Unsupported contract type: ${contractType}`);
      }

      // Get current timestamp
      const now = new Date().toISOString();
      
      // Create legal document with contract data
      const legalDocument = {
        ...template.ricardianContract,
        metadata: {
          ...template.ricardianContract.metadata,
          createdAt: now,
          contractId: contractData.contractId,
          legalDocumentHash: null, // Will be set after hash creation
          smartContractAddress: null, // Will be set after deployment
          ricardianSignature: null // Will be set after signature creation
        },
        legalDocument: {
          ...template.ricardianContract.legalDocument,
          effectiveDate: now.split('T')[0],
          expirationDate: this.calculateExpirationDate(contractData.duration),
          parties: {
            dataProvider: {
              ...template.ricardianContract.legalDocument.parties.dataProvider,
              name: contractData.tdp.name,
              email: contractData.tdp.email,
              blockchainAddress: contractData.tdp.blockchainAddress,
              did: contractData.tdp.did
            },
            modelTrainer: {
              ...template.ricardianContract.legalDocument.parties.modelTrainer,
              name: contractData.tdc.name,
              email: contractData.tdc.email,
              blockchainAddress: contractData.tdc.blockchainAddress,
              did: contractData.tdc.did
            },
            ccrp: contractData.ccrp ? {
              ...template.ricardianContract.legalDocument.parties.ccrp,
              name: contractData.ccrp.name,
              email: contractData.ccrp.email,
              blockchainAddress: contractData.ccrp.blockchainAddress,
              did: contractData.ccrp.did
            } : null
          },
          terms: this.updateTermsWithContractData(template.ricardianContract.legalDocument.terms, contractData)
        },
        trainingEnvironment: {
          ...template.ricardianContract.trainingEnvironment,
          // Use provided training environment if available, otherwise use template defaults
          ...(contractData.trainingEnvironment || {}),
          ccrpPlatform: {
            ...template.ricardianContract.trainingEnvironment.ccrpPlatform,
            ...(contractData.trainingEnvironment?.ccrpPlatform || {}),
            provider: contractData.ccrp?.name || contractData.trainingEnvironment?.ccrpPlatform?.provider || 'Default CCRP Provider'
          },
          // Include training specifications if provided
          trainingSpecifications: contractData.trainingEnvironment?.trainingSpecifications || template.ricardianContract.trainingEnvironment?.trainingSpecifications,
          // Include deployment specifications if provided
          deployment: contractData.trainingEnvironment?.deployment || template.ricardianContract.trainingEnvironment?.deployment
        },
        smartContract: {
          ...template.ricardianContract.smartContract,
          address: null, // Will be set after deployment
          state: {
            ...template.ricardianContract.smartContract.state,
            contractId: contractData.contractId,
            legalDocumentHash: null // Will be set after hash creation
          }
        },
        // Add compliance section if provided
        compliance: contractData.complianceSpecs ? {
          regulations: contractData.complianceSpecs.regulations || [],
          auditTrail: [
            {
              timestamp: now,
              action: 'CONTRACT_CREATED',
              actor: contractData.tdc.blockchainAddress || 'TDC_USER',
              details: 'AI training contract created with comprehensive specifications'
            }
          ]
        } : template.ricardianContract.compliance,
        // Add execution section if not present
        execution: template.ricardianContract.execution || {
          automatedActions: [
            {
              trigger: 'CONTRACT_ACTIVATION',
              action: 'PROVISION_ENVIRONMENT',
              description: 'CCRP automatically provisions secure training environment',
              status: 'PENDING',
              estimatedDuration: '2 hours'
            }
          ],
          manualActions: [
            {
              action: 'SECURITY_AUDIT',
              description: 'Manual security audit of training environment',
              status: 'REQUIRED',
              requiresApproval: true,
              frequency: 'WEEKLY'
            }
          ]
        }
      };

      return legalDocument;
    } catch (error) {
      console.error('Error generating legal document:', error);
      throw error;
    }
  }

  /**
   * Create cryptographic hash of legal document
   * @param {Object} legalDocument - Legal document object
   * @returns {string} SHA-256 hash
   */
  createDocumentHash(legalDocument) {
    try {
      // Convert legal document to canonical JSON string
      const canonicalJson = JSON.stringify(legalDocument, Object.keys(legalDocument).sort());
      
      // Create SHA-256 hash
      const hash = crypto.createHash('sha256').update(canonicalJson).digest('hex');
      
      return `0x${hash}`;
    } catch (error) {
      console.error('Error creating document hash:', error);
      throw error;
    }
  }

  /**
   * Create Ricardian signature binding legal document to smart contract
   * @param {string} legalDocumentHash - Hash of legal document
   * @returns {string} Cryptographic signature
   */
  async createRicardianSignature(legalDocumentHash) {
    try {
      // In a real implementation, this would use a private key
      // For demo purposes, we'll create a deterministic signature
      const message = `RICARDIAN_CONTRACT:${legalDocumentHash}`;
      const signature = crypto.createHash('sha256').update(message).digest('hex');
      
      return `0x${signature}`;
    } catch (error) {
      console.error('Error creating Ricardian signature:', error);
      throw error;
    }
  }

  /**
   * Deploy smart contract for Ricardian contract
   * @param {Object} contractData - Contract data
   * @param {string} legalDocumentHash - Hash of legal document
   * @returns {Object} Smart contract deployment data
   */
  async deploySmartContract(contractData, legalDocumentHash) {
    // Use real blockchain if enabled and available
    if (blockchainService.blockchainEnabled && blockchainService.blockchainAvailable) {
      const privateKey = process.env.BLOCKCHAIN_DEPLOYER_PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('BLOCKCHAIN_DEPLOYER_PRIVATE_KEY not set in environment');
      }
      // Use the first AI model ID or a default
      const modelId = Array.isArray(contractData.aiModelIds) && contractData.aiModelIds.length > 0
        ? contractData.aiModelIds[0]
        : 'default-model';
      // Call the real blockchain deployment
      const result = await blockchainService.createContract(
        contractData.tdp.blockchainAddress,
        contractData.datasetId,
        modelId,
        contractData.price,
        contractData.duration,
        contractData.termsAndConditions,
        privateKey
      );
      return {
        address: blockchainService.contractAddress,
        network: 'localhost',
        contractId: result.contractId,
        transactionHash: result.transactionHash
      };
    }
    // Fallback to mock if blockchain is not available
    const mockAddress = `0x${require('crypto').randomBytes(20).toString('hex')}`;
    const mockContractId = Math.floor(Math.random() * 1000000);
    return {
      address: mockAddress,
      network: 'mock',
      contractId: mockContractId,
      transactionHash: `0x${require('crypto').randomBytes(32).toString('hex')}`
    };
  }

  /**
   * Verify Ricardian contract integrity
   * @param {Object} contract - Contract object
   * @returns {Object} Verification result
   */
  async verifyRicardianContract(contract) {
    try {
      const verification = {
        legalDocumentValid: false,
        hashValid: false,
        signatureValid: false,
        smartContractValid: false,
        overallValid: false
      };

      // Verify legal document structure
      if (contract.legalDocument && 
          contract.legalDocument.metadata && 
          contract.legalDocument.legalDocument) {
        verification.legalDocumentValid = true;
      }

      // Verify document hash
      if (contract.legalDocument) {
        const calculatedHash = this.createDocumentHash(contract.legalDocument);
        verification.hashValid = (calculatedHash === contract.legalDocumentHash);
      }

      // Verify Ricardian signature
      if (contract.legalDocumentHash && contract.ricardianSignature) {
        const expectedSignature = await this.createRicardianSignature(contract.legalDocumentHash);
        verification.signatureValid = (expectedSignature === contract.ricardianSignature);
      }

      // Verify smart contract
      if (contract.smartContractAddress && contract.blockchainContractId) {
        verification.smartContractValid = true;
      }

      // Overall verification
      verification.overallValid = (
        verification.legalDocumentValid &&
        verification.hashValid &&
        verification.signatureValid &&
        verification.smartContractValid
      );

      return verification;
    } catch (error) {
      console.error('Error verifying Ricardian contract:', error);
      throw error;
    }
  }

  /**
   * Update contract with environment specifications
   * @param {number} contractId - Contract ID
   * @param {Object} environmentSpecs - Environment specifications
   * @returns {Object} Updated contract
   */
  async updateEnvironmentSpecs(contractId, environmentSpecs) {
    try {
      const contract = await Contract.findByPk(contractId);
      if (!contract) {
        throw new Error('Contract not found');
      }

      // Update environment specifications
      contract.environmentSpecs = environmentSpecs;
      
      // Update legal document with environment specs
      if (contract.legalDocument) {
        contract.legalDocument.trainingEnvironment = {
          ...contract.legalDocument.trainingEnvironment,
          ccrpPlatform: {
            ...contract.legalDocument.trainingEnvironment.ccrpPlatform,
            infrastructure: environmentSpecs.infrastructure,
            security: environmentSpecs.security
          }
        };
      }

      await contract.save();
      return contract;
    } catch (error) {
      console.error('Error updating environment specs:', error);
      throw error;
    }
  }

  /**
   * Update contract with training parameters
   * @param {number} contractId - Contract ID
   * @param {Object} trainingParams - Training parameters
   * @returns {Object} Updated contract
   */
  async updateTrainingParams(contractId, trainingParams) {
    try {
      const contract = await Contract.findByPk(contractId);
      if (!contract) {
        throw new Error('Contract not found');
      }

      // Update training parameters
      contract.trainingParams = trainingParams;
      
      // Update legal document with training params
      if (contract.legalDocument) {
        contract.legalDocument.trainingEnvironment.trainingSpecifications = {
          ...contract.legalDocument.trainingEnvironment.trainingSpecifications,
          ...trainingParams
        };
      }

      await contract.save();
      return contract;
    } catch (error) {
      console.error('Error updating training params:', error);
      throw error;
    }
  }

  /**
   * Update contract with KMS configurations
   * @param {number} contractId - Contract ID
   * @param {Object} kmsConfigs - KMS configurations
   * @returns {Object} Updated contract
   */
  async updateKMSConfigs(contractId, kmsConfigs) {
    try {
      const contract = await Contract.findByPk(contractId);
      if (!contract) {
        throw new Error('Contract not found');
      }

      // Update KMS configurations
      contract.kmsConfigs = kmsConfigs;
      
      // Update legal document with KMS configs
      if (contract.legalDocument) {
        contract.legalDocument.trainingEnvironment.ccrpPlatform.security.kms = kmsConfigs;
      }

      await contract.save();
      return contract;
    } catch (error) {
      console.error('Error updating KMS configs:', error);
      throw error;
    }
  }

  /**
   * Update attestation verification status
   * @param {number} contractId - Contract ID
   * @param {Object} attestationReport - Attestation report
   * @returns {Object} Updated contract
   */
  async updateAttestationVerification(contractId, attestationReport) {
    try {
      const contract = await Contract.findByPk(contractId);
      if (!contract) {
        throw new Error('Contract not found');
      }

      // Update attestation verification
      contract.attestationVerified = true;
      contract.attestationReport = attestationReport;
      
      // Update legal document with attestation
      if (contract.legalDocument) {
        contract.legalDocument.compliance.attestation = {
          verified: true,
          report: attestationReport,
          verifiedAt: new Date().toISOString()
        };
      }

      await contract.save();
      return contract;
    } catch (error) {
      console.error('Error updating attestation verification:', error);
      throw error;
    }
  }

  /**
   * Calculate expiration date based on duration
   * @param {number} duration - Duration in days
   * @returns {string} Expiration date in YYYY-MM-DD format
   */
  calculateExpirationDate(duration) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + duration);
    return expirationDate.toISOString().split('T')[0];
  }

  /**
   * Update terms with contract data
   * @param {Array} terms - Original terms
   * @param {Object} contractData - Contract data
   * @returns {Array} Updated terms
   */
  updateTermsWithContractData(terms, contractData) {
    return terms.map(term => {
      if (term.section === '5.0' && term.title === 'Payment and Compensation') {
        return {
          ...term,
          content: term.content.replace('$50,000 USD', `$${contractData.price} USD`)
            .replace('$25,000 USD', `$${contractData.price * 0.5} USD`)
        };
      }
      if (term.section === '3.0' && term.title === 'Model Training Specifications') {
        return {
          ...term,
          content: term.content.replace('30 days', `${contractData.duration} days`)
        };
      }
      return term;
    });
  }

  /**
   * Get Ricardian contract template
   * @param {string} contractType - Type of contract
   * @returns {Object} Contract template
   */
  async getContractTemplate(contractType) {
    const templates = await this.loadTemplates();
    return templates[contractType] || templates['BASIC'];
  }

  /**
   * Get supported contract types
   * @returns {Array} Array of supported contract types
   */
  async getSupportedContractTypes() {
    const templates = await this.loadTemplates();
    return Object.keys(templates);
  }
}

module.exports = new RicardianContractService(); 