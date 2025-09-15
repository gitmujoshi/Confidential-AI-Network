/**
 * Enhanced Blockchain Service with Flexible Mode Support
 * 
 * This service provides blockchain integration for the Contract Management System
 * with the ability to operate in multiple modes:
 * 
 * - BLOCKCHAIN_ENABLED: Uses real blockchain when available, falls back to database
 * - DATABASE_ONLY: Operates entirely in database mode with mock blockchain results
 * 
 * Key Features:
 * - Configurable blockchain mode via environment variables
 * - Graceful fallback to database-only mode when blockchain unavailable
 * - Mock blockchain results for testing and development
 * - Health monitoring and status reporting
 * - Support for contract creation, signing, and CCRP selection
 * 
 * @author Contract Management System
 * @version 2.0.0
 * @since 2024-01-08
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

class BlockchainService {
  /**
   * Initialize the blockchain service with flexible mode support
   * 
   * The service can operate in two modes:
   * - BLOCKCHAIN_ENABLED: Attempts to use real blockchain, falls back to database
   * - DATABASE_ONLY: Uses database-only mode with mock results
   * 
   * Mode is determined by BLOCKCHAIN_ENABLED environment variable
   */
  constructor() {
    this.provider = null;                    // Ethers.js provider instance
    this.contract = null;                    // Smart contract instance
    this.contractAddress = null;             // Deployed contract address
    this.contractABI = null;                 // Contract ABI
    this.wallet = null;                      // Wallet instance
    this.blockchainContractCounter = 0;      // Counter for mock contract IDs
    this.blockchainEnabled = false;          // Whether blockchain is enabled in config
    this.blockchainAvailable = false;        // Whether blockchain is actually available
    this.mode = 'DATABASE_ONLY';             // Current operating mode
  }

  /**
   * Initialize the blockchain service based on configuration
   * 
   * This method checks the BLOCKCHAIN_ENABLED environment variable and attempts
   * to initialize the blockchain connection. If blockchain is disabled or
   * initialization fails, it falls back to database-only mode.
   * 
   * Environment Variables:
   * - BLOCKCHAIN_ENABLED: Set to 'false' to disable blockchain mode
   * - BLOCKCHAIN_URL: URL of the blockchain node (default: http://localhost:8545)
   * 
   * @throws {Error} If blockchain initialization fails (handled internally)
   */
  async initialize() {
    try {
      // Check if blockchain is enabled in configuration
      this.blockchainEnabled = process.env.BLOCKCHAIN_ENABLED !== 'false';
      
      if (!this.blockchainEnabled) {
        console.log('ℹ️  Blockchain service disabled in configuration (BLOCKCHAIN_ENABLED=false)');
        this.mode = 'DATABASE_ONLY';
        return;
      }

      // Try to initialize blockchain connection
      await this.initializeBlockchain();
      
    } catch (error) {
      console.warn('⚠️  Blockchain initialization failed, falling back to database-only mode:', error.message);
      this.mode = 'DATABASE_ONLY';
      this.blockchainAvailable = false;
    }
  }

  async initializeBlockchain() {
    try {
      console.log('🔗 Initializing blockchain service...');

      // Load contract ABI
      const contractPath = path.join(__dirname, '../../blockchain/artifacts/contracts/ContractManager.sol/ContractManager.json');
      if (!fs.existsSync(contractPath)) {
        throw new Error('Contract artifacts not found. Please compile contracts first.');
      }
      
      const contractArtifact = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
      this.contractABI = contractArtifact.abi;

      // Load deployment info
      const deploymentPath = path.join(__dirname, '../../blockchain/deployment.json');
      if (!fs.existsSync(deploymentPath)) {
        throw new Error('Contract not deployed. Please run deployment first.');
      }
      
      const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
      this.contractAddress = deploymentInfo.contractAddress;

      // Initialize provider
      const blockchainUrl = process.env.BLOCKCHAIN_URL;
      if (!blockchainUrl) {
        throw new Error('BLOCKCHAIN_URL environment variable is required');
      }
      this.provider = new ethers.JsonRpcProvider(blockchainUrl);
      
      // Test connection
      await this.testConnection();
      
      // Initialize contract
      this.contract = new ethers.Contract(this.contractAddress, this.contractABI, this.provider);

      this.blockchainAvailable = true;
      this.mode = 'BLOCKCHAIN_ENABLED';
      console.log('✅ Blockchain service initialized successfully');
      console.log('   Contract address:', this.contractAddress);
      console.log('   Mode:', this.mode);
      
    } catch (error) {
      console.error('❌ Blockchain initialization failed:', error.message);
      this.blockchainAvailable = false;
      this.mode = 'DATABASE_ONLY';
      throw error;
    }
  }

  async testConnection() {
    try {
      const blockNumber = await this.provider.getBlockNumber();
      console.log('🔗 Blockchain connection test successful. Current block:', blockNumber);
      return true;
    } catch (error) {
      console.error('❌ Blockchain connection test failed:', error.message);
      throw new Error(`Failed to connect to blockchain: ${error.message}`);
    }
  }

  async isConnected() {
    if (!this.blockchainEnabled) {
      return false;
    }
    
    if (!this.blockchainAvailable) {
      return false;
    }

    try {
      if (!this.provider) {
        return false;
      }
      await this.provider.getBlockNumber();
      return true;
    } catch (error) {
      return false;
    }
  }

  getMode() {
    return {
      blockchainEnabled: this.blockchainEnabled,
      blockchainAvailable: this.blockchainAvailable,
      mode: this.mode
    };
  }

  async createContract(
    tdpAddress,
    datasetId,
    modelId,
    price,
    duration,
    termsAndConditions,
    privateKey
  ) {
    // If blockchain is not available, create a mock blockchain result
    if (!this.blockchainAvailable) {
      console.warn('⚠️  Blockchain not available, creating mock blockchain result');
      
      this.blockchainContractCounter++;
      const mockContractId = this.blockchainContractCounter.toString();
      
      return {
        success: true,
        transactionHash: `MOCK_TX_${Date.now()}_${mockContractId}`,
        contractId: mockContractId,
        message: 'Contract created successfully (mock blockchain)',
        mode: this.mode,
        warning: 'Blockchain not available - using database-only mode'
      };
    }

    try {
      const wallet = new ethers.Wallet(privateKey, this.provider);
      const contractWithSigner = this.contract.connect(wallet);

      const priceWei = ethers.parseEther(price.toString());
      const durationSeconds = duration * 24 * 60 * 60; // Convert days to seconds

      const tx = await contractWithSigner.createContract(
        tdpAddress,
        datasetId,
        modelId,
        priceWei,
        durationSeconds,
        termsAndConditions
      );
      
      const receipt = await tx.wait();
      
      // Verify transaction was successful
      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }
      
      // Get contract ID from event
      let contractId = null;
      for (const log of receipt.logs) {
        try {
          const parsedLog = this.contract.interface.parseLog(log);
          if (parsedLog && parsedLog.name === 'ContractCreated') {
            contractId = parsedLog.args.contractId.toString();
            break;
          }
        } catch (error) {
          // Skip logs that can't be parsed
          continue;
        }
      }

      // If event parsing failed, use counter
      if (!contractId) {
        this.blockchainContractCounter++;
        contractId = this.blockchainContractCounter.toString();
      }

      return {
        success: true,
        transactionHash: tx.hash,
        contractId: contractId,
        message: 'Contract created successfully',
        mode: this.mode
      };
    } catch (error) {
      console.error('❌ Error creating contract on blockchain:', error);
      
      // Fallback to mock result if blockchain fails
      console.warn('⚠️  Falling back to mock blockchain result due to blockchain error');
      
      this.blockchainContractCounter++;
      const mockContractId = this.blockchainContractCounter.toString();
      
      return {
        success: true,
        transactionHash: `FALLBACK_TX_${Date.now()}_${mockContractId}`,
        contractId: mockContractId,
        message: 'Contract created successfully (fallback mode)',
        mode: 'DATABASE_ONLY',
        warning: 'Blockchain operation failed - using database-only mode',
        originalError: error.message
      };
    }
  }

  async signContract(contractId, privateKey) {
    // If blockchain is not available, create a mock signing result
    if (!this.blockchainAvailable) {
      console.warn('⚠️  Blockchain not available, creating mock signing result');
      
      return {
        success: true,
        transactionHash: `MOCK_SIGN_TX_${Date.now()}_${contractId}`,
        message: 'Contract signed successfully (mock blockchain)',
        mode: this.mode,
        warning: 'Blockchain not available - using database-only mode'
      };
    }

    try {
      const wallet = new ethers.Wallet(privateKey, this.provider);
      const contractWithSigner = this.contract.connect(wallet);

      // Convert contractId to BigInt if it's a string
      const contractIdBigInt = BigInt(contractId);

      const tx = await contractWithSigner.signContract(contractIdBigInt);
      const receipt = await tx.wait();
      
      // Verify transaction was successful
      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }

      return {
        success: true,
        transactionHash: tx.hash,
        message: 'Contract signed successfully',
        mode: this.mode
      };
    } catch (error) {
      console.error('❌ Error signing contract on blockchain:', error);
      
      // Fallback to mock result if blockchain fails
      console.warn('⚠️  Falling back to mock signing result due to blockchain error');
      
      return {
        success: true,
        transactionHash: `FALLBACK_SIGN_TX_${Date.now()}_${contractId}`,
        message: 'Contract signed successfully (fallback mode)',
        mode: 'DATABASE_ONLY',
        warning: 'Blockchain operation failed - using database-only mode',
        originalError: error.message
      };
    }
  }

  async selectCCRP(contractId, ccrpAddress, privateKey) {
    // If blockchain is not available, create a mock CCRP selection result
    if (!this.blockchainAvailable) {
      console.warn('⚠️  Blockchain not available, creating mock CCRP selection result');
      
      return {
        success: true,
        transactionHash: `MOCK_CCRP_TX_${Date.now()}_${contractId}`,
        message: 'CCRP selected successfully (mock blockchain)',
        mode: this.mode,
        warning: 'Blockchain not available - using database-only mode'
      };
    }

    try {
      const wallet = new ethers.Wallet(privateKey, this.provider);
      const contractWithSigner = this.contract.connect(wallet);

      // Convert contractId to BigInt if it's a string
      const contractIdBigInt = BigInt(contractId);

      const tx = await contractWithSigner.selectCCRP(contractIdBigInt, ccrpAddress);
      const receipt = await tx.wait();
      
      // Verify transaction was successful
      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }

      return {
        success: true,
        transactionHash: tx.hash,
        message: 'CCRP selected successfully',
        mode: this.mode
      };
    } catch (error) {
      console.error('❌ Error selecting CCRP on blockchain:', error);
      
      // Fallback to mock result if blockchain fails
      console.warn('⚠️  Falling back to mock CCRP selection result due to blockchain error');
      
      return {
        success: true,
        transactionHash: `FALLBACK_CCRP_TX_${Date.now()}_${contractId}`,
        message: 'CCRP selected successfully (fallback mode)',
        mode: 'DATABASE_ONLY',
        warning: 'Blockchain operation failed - using database-only mode',
        originalError: error.message
      };
    }
  }

  async getContract(contractId) {
    // If blockchain is not available, return null
    if (!this.blockchainAvailable) {
      console.warn('⚠️  Blockchain not available, cannot fetch contract from blockchain');
      return null;
    }

    try {
      const contract = await this.contract.getContract(contractId);
      return this.formatContract(contract);
    } catch (error) {
      console.error('❌ Error getting contract from blockchain:', error);
      return null;
    }
  }

  async getParty(partyAddress) {
    // If blockchain is not available, return null
    if (!this.blockchainAvailable) {
      console.warn('⚠️  Blockchain not available, cannot fetch party from blockchain');
      return null;
    }

    try {
      const party = await this.contract.getParty(partyAddress);
      return this.formatParty(party);
    } catch (error) {
      console.error('❌ Error getting party from blockchain:', error);
      return null;
    }
  }

  async getPartyContracts(partyAddress) {
    // If blockchain is not available, return empty array
    if (!this.blockchainAvailable) {
      console.warn('⚠️  Blockchain not available, cannot fetch party contracts from blockchain');
      return [];
    }

    try {
      const contractIds = await this.contract.getPartyContracts(partyAddress);
      return contractIds.map(id => id.toString());
    } catch (error) {
      console.error('❌ Error getting party contracts from blockchain:', error);
      return [];
    }
  }

  formatContract(contract) {
    return {
      contractId: contract.contractId.toString(),
      tdpAddress: contract.tdpAddress,
      tdcAddress: contract.tdcAddress,
      ccrpAddress: contract.ccrpAddress,
      datasetId: contract.datasetId,
      modelId: contract.modelId,
      price: ethers.formatEther(contract.price),
      duration: parseInt(contract.duration) / (24 * 60 * 60), // Convert seconds to days
      termsAndConditions: contract.termsAndConditions,
      status: this.getContractStatusString(contract.status),
      createdAt: new Date(parseInt(contract.createdAt) * 1000),
      tdpSignedAt: contract.tdpSignedAt > 0 ? new Date(parseInt(contract.tdpSignedAt) * 1000) : null,
      ccrpSignedAt: contract.ccrpSignedAt > 0 ? new Date(parseInt(contract.ccrpSignedAt) * 1000) : null,
      tdpSigned: contract.tdpSigned,
      ccrpSigned: contract.ccrpSigned
    };
  }

  formatParty(party) {
    return {
      partyAddress: party.partyAddress,
      partyType: this.getPartyTypeString(party.partyType),
      name: party.name,
      description: party.description,
      isRegistered: party.isRegistered,
      registrationDate: new Date(parseInt(party.registrationDate) * 1000)
    };
  }

  getPartyTypeEnum(partyType) {
    const types = { 'TDP': 0, 'TDC': 1, 'CCRP': 2 };
    return types[partyType] || 0;
  }

  getPartyTypeString(partyTypeEnum) {
    const types = ['TDP', 'TDC', 'CCRP'];
    return types[partyTypeEnum] || 'UNKNOWN';
  }

  getContractStatusString(statusEnum) {
    const statuses = [
      'PENDING_TDP',
      'PENDING_CCRP',
      'SIGNED',
      'COMPLETED',
      'REJECTED'
    ];
    return statuses[statusEnum] || 'UNKNOWN';
  }

  async getContractEvents(contractId, eventName) {
    // If blockchain is not available, return empty array
    if (!this.blockchainAvailable) {
      console.warn('⚠️  Blockchain not available, cannot fetch contract events from blockchain');
      return [];
    }

    try {
      const filter = this.contract.filters[eventName](contractId);
      const events = await this.contract.queryFilter(filter);
      return events;
    } catch (error) {
      console.error('❌ Error getting contract events from blockchain:', error);
      return [];
    }
  }

  async broadcastSignedTransaction(signedTransaction) {
    // If blockchain is not available, create a mock broadcast result
    if (!this.blockchainAvailable) {
      console.warn('⚠️  Blockchain not available, creating mock broadcast result');
      
      return {
        success: true,
        transactionHash: `MOCK_BROADCAST_TX_${Date.now()}`,
        message: 'Transaction broadcast successfully (mock blockchain)',
        mode: this.mode,
        warning: 'Blockchain not available - using database-only mode'
      };
    }

    try {
      const tx = await this.provider.broadcastTransaction(signedTransaction);
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: tx.hash,
        message: 'Transaction broadcast successfully',
        mode: this.mode
      };
    } catch (error) {
      console.error('❌ Error broadcasting transaction:', error);
      
      // Fallback to mock result if blockchain fails
      console.warn('⚠️  Falling back to mock broadcast result due to blockchain error');
      
      return {
        success: true,
        transactionHash: `FALLBACK_BROADCAST_TX_${Date.now()}`,
        message: 'Transaction broadcast successfully (fallback mode)',
        mode: 'DATABASE_ONLY',
        warning: 'Blockchain operation failed - using database-only mode',
        originalError: error.message
      };
    }
  }

  async getContractSigningData(contractId) {
    // If blockchain is not available, return mock signing data
    if (!this.blockchainAvailable) {
      console.warn('⚠️  Blockchain not available, returning mock signing data');
      
      return {
        contractId: contractId,
        message: `Sign contract ${contractId} at ${new Date().toISOString()}`,
        mode: this.mode,
        warning: 'Blockchain not available - using database-only mode'
      };
    }

    try {
      // Get contract data for signing
      const contract = await this.contract.getContract(contractId);
      
      return {
        contractId: contractId,
        message: `Sign contract ${contractId} at ${new Date().toISOString()}`,
        contractData: this.formatContract(contract),
        mode: this.mode
      };
    } catch (error) {
      console.error('❌ Error getting contract signing data:', error);
      
      // Fallback to mock data if blockchain fails
      console.warn('⚠️  Falling back to mock signing data due to blockchain error');
      
      return {
        contractId: contractId,
        message: `Sign contract ${contractId} at ${new Date().toISOString()}`,
        mode: 'DATABASE_ONLY',
        warning: 'Blockchain operation failed - using database-only mode',
        originalError: error.message
      };
    }
  }

  // Health check method
  async healthCheck() {
    return {
      blockchainEnabled: this.blockchainEnabled,
      blockchainAvailable: this.blockchainAvailable,
      mode: this.mode,
      connected: await this.isConnected(),
      contractAddress: this.contractAddress,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = BlockchainService; 