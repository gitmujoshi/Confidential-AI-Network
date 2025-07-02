const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

class BlockchainService {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.contractAddress = null;
    this.contractABI = null;
    this.wallet = null;
    this.blockchainContractCounter = 0; // Add counter for blockchain contract IDs
  }

  async initialize() {
    try {
      // Load contract ABI
      const contractPath = path.join(__dirname, '../../blockchain/artifacts/contracts/ContractManager.sol/ContractManager.json');
      const contractArtifact = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
      this.contractABI = contractArtifact.abi;

      // Load deployment info
      const deploymentPath = path.join(__dirname, '../../blockchain/deployment.json');
      if (fs.existsSync(deploymentPath)) {
        const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
        this.contractAddress = deploymentInfo.contractAddress;
      } else {
        throw new Error('Contract not deployed. Please run deployment first.');
      }

      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_URL || 'http://127.0.0.1:8545');
      
      // Test connection
      await this.testConnection();
      
      // Initialize contract
      this.contract = new ethers.Contract(this.contractAddress, this.contractABI, this.provider);

      console.log('Blockchain service initialized successfully');
      console.log('Contract address:', this.contractAddress);
    } catch (error) {
      console.error('Error initializing blockchain service:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      // Test basic connection by getting block number
      const blockNumber = await this.provider.getBlockNumber();
      console.log('Blockchain connection test successful. Current block:', blockNumber);
      return true;
    } catch (error) {
      console.error('Blockchain connection test failed:', error);
      throw new Error(`Failed to connect to blockchain: ${error.message}`);
    }
  }

  async isConnected() {
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

  async registerParty(walletAddress, partyType, name, description, privateKey) {
    try {
      const wallet = new ethers.Wallet(privateKey, this.provider);
      const contractWithSigner = this.contract.connect(wallet);

      const partyTypeEnum = this.getPartyTypeEnum(partyType);
      
      const tx = await contractWithSigner.registerParty(partyTypeEnum, name, description);
      const receipt = await tx.wait();
      
      // Verify transaction was successful
      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }

      return {
        success: true,
        transactionHash: tx.hash,
        message: 'Party registered successfully'
      };
    } catch (error) {
      console.error('Error registering party:', error);
      throw error;
    }
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
        message: 'Contract created successfully'
      };
    } catch (error) {
      console.error('Error creating contract:', error);
      throw error;
    }
  }

  async signContract(contractId, privateKey) {
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
        message: 'Contract signed successfully'
      };
    } catch (error) {
      console.error('Error signing contract:', error);
      throw error;
    }
  }

  async selectCCRP(contractId, ccrpAddress, privateKey) {
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
        message: 'CCRP selected successfully'
      };
    } catch (error) {
      console.error('Error selecting CCRP:', error);
      throw error;
    }
  }

  async getContract(contractId) {
    try {
      // Convert contractId to BigInt if it's a string
      const contractIdBigInt = BigInt(contractId);
      const contract = await this.contract.getContract(contractIdBigInt);
      return this.formatContract(contract);
    } catch (error) {
      console.error('Error getting contract:', error);
      throw error;
    }
  }

  async getParty(partyAddress) {
    try {
      const party = await this.contract.getParty(partyAddress);
      return this.formatParty(party);
    } catch (error) {
      console.error('Error getting party:', error);
      throw error;
    }
  }

  async getPartyContracts(partyAddress) {
    try {
      const contractIds = await this.contract.getPartyContracts(partyAddress);
      return contractIds.map(id => id.toString());
    } catch (error) {
      console.error('Error getting party contracts:', error);
      throw error;
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
      'PENDING_TDP_APPROVAL',
      'PENDING_CCRP_APPROVAL',
      'ACTIVE',
      'COMPLETED',
      'CANCELLED'
    ];
    return statuses[statusEnum] || 'UNKNOWN';
  }

  async getContractEvents(contractId, eventName) {
    try {
      // Convert contractId to BigInt if it's a string
      const contractIdBigInt = BigInt(contractId);
      const filter = this.contract.filters[eventName](contractIdBigInt);
      const events = await this.contract.queryFilter(filter);
      return events;
    } catch (error) {
      console.error('Error getting contract events:', error);
      throw error;
    }
  }

  async broadcastSignedTransaction(signedTransaction) {
    try {
      // Broadcast the signed transaction to the network
      const tx = await this.provider.broadcastTransaction(signedTransaction);
      const receipt = await tx.wait();
      
      // Verify transaction was successful
      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }

      return {
        success: true,
        transactionHash: tx.hash,
        message: 'Transaction broadcast successfully'
      };
    } catch (error) {
      console.error('Error broadcasting signed transaction:', error);
      throw error;
    }
  }

  async getContractSigningData(contractId) {
    try {
      // Convert contractId to BigInt if it's a string
      const contractIdBigInt = BigInt(contractId);
      
      // Get the contract data for signing
      const contract = await this.contract.getContract(contractIdBigInt);
      
      // Create the transaction data for signing
      const signContractData = this.contract.interface.encodeFunctionData('signContract', [contractIdBigInt]);
      
      // Get current gas price
      const gasPrice = await this.provider.getFeeData();
      
      // Estimate gas
      const gasEstimate = await this.contract.signContract.estimateGas(contractIdBigInt);
      
      return {
        to: this.contractAddress,
        data: signContractData,
        gasLimit: gasEstimate,
        gasPrice: gasPrice.gasPrice,
        nonce: null // Will be set by the client
      };
    } catch (error) {
      console.error('Error getting contract signing data:', error);
      throw error;
    }
  }
}

module.exports = new BlockchainService(); 