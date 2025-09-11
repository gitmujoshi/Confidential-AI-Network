/**
 * Contract Signing Test Data Setup
 * 
 * This script creates comprehensive test data for contract signing feature testing,
 * including users, contracts, signing keys, and SCITT CCF claims.
 * 
 * @author Contract Management System Team
 * @version 1.0.0
 * @since 2024-01-XX
 */

const { User, Contract, UserKey, ScittClaim, SigningEvent } = require('../../models');
const keyManagementService = require('../../services/keyManagementService');
const scittCcfService = require('../../services/scittCcfService');

class SigningTestDataSetup {
  constructor() {
    this.testUsers = [];
    this.testContracts = [];
    this.testKeys = [];
    this.testClaims = [];
  }

  /**
   * Setup all test data for contract signing
   */
  async setupAll() {
    console.log('🔧 Setting up contract signing test data...');
    
    try {
      // Clean existing test data
      await this.cleanupTestData();
      
      // Create test users
      await this.createTestUsers();
      
      // Create test contracts
      await this.createTestContracts();
      
      // Create test signing keys
      await this.createTestSigningKeys();
      
      // Create test SCITT CCF claims
      await this.createTestScittClaims();
      
      // Create test signing events
      await this.createTestSigningEvents();
      
      console.log('✅ Contract signing test data setup completed');
      return {
        users: this.testUsers,
        contracts: this.testContracts,
        keys: this.testKeys,
        claims: this.testClaims
      };
      
    } catch (error) {
      console.error('❌ Failed to setup contract signing test data:', error);
      throw error;
    }
  }

  /**
   * Clean up existing test data
   */
  async cleanupTestData() {
    console.log('🧹 Cleaning up existing test data...');
    
    try {
      // Delete test signing events
      await SigningEvent.destroy({
        where: {
          eventData: {
            [require('sequelize').Op.like]: '%TEST_SIGNING%'
          }
        }
      });

      // Delete test SCITT CCF claims
      await ScittClaim.destroy({
        where: {
          claimId: {
            [require('sequelize').Op.like]: 'TEST_CLAIM_%'
          }
        }
      });

      // Delete test user keys
      await UserKey.destroy({
        where: {
          keyId: {
            [require('sequelize').Op.like]: 'TEST_KEY_%'
          }
        }
      });

      // Delete test contracts
      await Contract.destroy({
        where: {
          contractId: {
            [require('sequelize').Op.like]: 'TEST_CONTRACT_%'
          }
        }
      });

      // Delete test users
      await User.destroy({
        where: {
          email: {
            [require('sequelize').Op.like]: '%@test-signing.com'
          }
        }
      });

      console.log('✅ Test data cleanup completed');
    } catch (error) {
      console.error('❌ Failed to cleanup test data:', error);
      throw error;
    }
  }

  /**
   * Create test users for signing tests
   */
  async createTestUsers() {
    console.log('👥 Creating test users...');
    
    const testUserData = [
      {
        name: 'Test TDC User',
        email: 'tdc@test-signing.com',
        partyType: 'TDC',
        depaId: 'TEST_TDC_001',
        isActive: true,
        firstLogin: false
      },
      {
        name: 'Test TDP User',
        email: 'tdp@test-signing.com',
        partyType: 'TDP',
        depaId: 'TEST_TDP_001',
        isActive: true,
        firstLogin: false
      },
      {
        name: 'Test CCRP User',
        email: 'ccrp@test-signing.com',
        partyType: 'CCRP',
        depaId: 'TEST_CCRP_001',
        isActive: true,
        firstLogin: false
      },
      {
        name: 'Test Admin User',
        email: 'admin@test-signing.com',
        partyType: 'AppAdmin',
        depaId: 'TEST_ADMIN_001',
        isActive: true,
        firstLogin: false
      }
    ];

    for (const userData of testUserData) {
      const user = await User.create(userData);
      this.testUsers.push(user);
      console.log(`✅ Created test user: ${user.name} (${user.depaId})`);
    }
  }

  /**
   * Create test contracts for signing tests
   */
  async createTestContracts() {
    console.log('📄 Creating test contracts...');
    
    const tdcUser = this.testUsers.find(u => u.partyType === 'TDC');
    const ccrpUser = this.testUsers.find(u => u.partyType === 'CCRP');
    
    const testContractData = [
      {
        contractId: 'TEST_CONTRACT_001',
        name: 'Test Contract 1 - Pending Signatures',
        description: 'A test contract that needs both TDC and CCRP signatures',
        tdcId: tdcUser.id,
        ccrpId: ccrpUser.id,
        status: 'PENDING_SIGNATURES',
        contractData: {
          price: 1000,
          duration: 30,
          terms: 'Test terms and conditions',
          datasets: ['TEST_DATASET_001']
        },
        isActive: true
      },
      {
        contractId: 'TEST_CONTRACT_002',
        name: 'Test Contract 2 - Partially Signed',
        description: 'A test contract with TDC signature but missing CCRP signature',
        tdcId: tdcUser.id,
        ccrpId: ccrpUser.id,
        status: 'PENDING_CCRP_SIGNATURE',
        contractData: {
          price: 2000,
          duration: 60,
          terms: 'Test terms and conditions 2',
          datasets: ['TEST_DATASET_002']
        },
        isActive: true
      },
      {
        contractId: 'TEST_CONTRACT_003',
        name: 'Test Contract 3 - Fully Signed',
        description: 'A test contract with all required signatures',
        tdcId: tdcUser.id,
        ccrpId: ccrpUser.id,
        status: 'FULLY_SIGNED',
        contractData: {
          price: 3000,
          duration: 90,
          terms: 'Test terms and conditions 3',
          datasets: ['TEST_DATASET_003']
        },
        isActive: true
      }
    ];

    for (const contractData of testContractData) {
      const contract = await Contract.create(contractData);
      this.testContracts.push(contract);
      console.log(`✅ Created test contract: ${contract.name} (${contract.contractId})`);
    }
  }

  /**
   * Create test signing keys for users
   */
  async createTestSigningKeys() {
    console.log('🔑 Creating test signing keys...');
    
    const keyTypes = ['ECDSA-P256', 'RSA-2048', 'RSA-4096'];
    
    for (const user of this.testUsers) {
      for (let i = 0; i < 2; i++) {
        const keyType = keyTypes[i % keyTypes.length];
        
        try {
          // Generate key pair
          const keyData = await keyManagementService.generateKeyPair({
            algorithm: keyType,
            userId: user.id
          });
          
          // Create user key record
          const userKey = await UserKey.create({
            userId: user.id,
            keyId: `TEST_KEY_${user.partyType}_${i + 1}`,
            keyType: keyType,
            publicKey: keyData.publicKey,
            keyStatus: 'active',
            createdAt: new Date(),
            lastUsedAt: null
          });
          
          this.testKeys.push(userKey);
          console.log(`✅ Created test key: ${userKey.keyId} for ${user.name}`);
          
        } catch (error) {
          console.error(`❌ Failed to create key for ${user.name}:`, error);
        }
      }
    }
  }

  /**
   * Create test SCITT CCF claims for signatures
   */
  async createTestScittClaims() {
    console.log('📋 Creating test SCITT CCF claims...');
    
    const tdcUser = this.testUsers.find(u => u.partyType === 'TDC');
    const ccrpUser = this.testUsers.find(u => u.partyType === 'CCRP');
    const partiallySignedContract = this.testContracts.find(c => c.contractId === 'TEST_CONTRACT_002');
    const fullySignedContract = this.testContracts.find(c => c.contractId === 'TEST_CONTRACT_003');
    
    // Create TDC signature for partially signed contract
    if (partiallySignedContract) {
      const tdcKey = this.testKeys.find(k => k.userId === tdcUser.id);
      if (tdcKey) {
        const signatureClaim = {
          type: 'contract_signature',
          data: {
            contractId: partiallySignedContract.contractId,
            signer: tdcUser.depaId,
            signerRole: 'TDC',
            signature: this.generateTestSignature(),
            algorithm: tdcKey.keyType,
            timestamp: Date.now() - 86400000, // 1 day ago
            contractHash: this.generateTestHash(partiallySignedContract.contractId),
            metadata: {
              system: 'Contract Management System',
              version: '1.0.0',
              teeProvider: 'virtual'
            }
          }
        };
        
        const claim = await this.createTestClaim(
          `TEST_CLAIM_TDC_${partiallySignedContract.contractId}`,
          partiallySignedContract.contractId,
          signatureClaim
        );
        this.testClaims.push(claim);
      }
    }
    
    // Create both signatures for fully signed contract
    if (fullySignedContract) {
      const tdcKey = this.testKeys.find(k => k.userId === tdcUser.id);
      const ccrpKey = this.testKeys.find(k => k.userId === ccrpUser.id);
      
      // TDC signature
      if (tdcKey) {
        const tdcSignatureClaim = {
          type: 'contract_signature',
          data: {
            contractId: fullySignedContract.contractId,
            signer: tdcUser.depaId,
            signerRole: 'TDC',
            signature: this.generateTestSignature(),
            algorithm: tdcKey.keyType,
            timestamp: Date.now() - 172800000, // 2 days ago
            contractHash: this.generateTestHash(fullySignedContract.contractId),
            metadata: {
              system: 'Contract Management System',
              version: '1.0.0',
              teeProvider: 'virtual'
            }
          }
        };
        
        const tdcClaim = await this.createTestClaim(
          `TEST_CLAIM_TDC_${fullySignedContract.contractId}`,
          fullySignedContract.contractId,
          tdcSignatureClaim
        );
        this.testClaims.push(tdcClaim);
      }
      
      // CCRP signature
      if (ccrpKey) {
        const ccrpSignatureClaim = {
          type: 'contract_signature',
          data: {
            contractId: fullySignedContract.contractId,
            signer: ccrpUser.depaId,
            signerRole: 'CCRP',
            signature: this.generateTestSignature(),
            algorithm: ccrpKey.keyType,
            timestamp: Date.now() - 86400000, // 1 day ago
            contractHash: this.generateTestHash(fullySignedContract.contractId),
            metadata: {
              system: 'Contract Management System',
              version: '1.0.0',
              teeProvider: 'virtual'
            }
          }
        };
        
        const ccrpClaim = await this.createTestClaim(
          `TEST_CLAIM_CCRP_${fullySignedContract.contractId}`,
          fullySignedContract.contractId,
          ccrpSignatureClaim
        );
        this.testClaims.push(ccrpClaim);
      }
    }
  }

  /**
   * Create test signing events
   */
  async createTestSigningEvents() {
    console.log('📝 Creating test signing events...');
    
    for (const claim of this.testClaims) {
      const signer = this.testUsers.find(u => u.depaId === claim.claimData.signer);
      const contract = this.testContracts.find(c => c.contractId === claim.contractId);
      
      if (signer && contract) {
        const event = await SigningEvent.create({
          contractId: contract.id,
          userId: signer.id,
          eventType: 'contract_signed',
          eventData: {
            scittClaimId: claim.claimId,
            keyId: `TEST_KEY_${signer.partyType}_1`,
            contractHash: claim.claimData.contractHash,
            testData: 'TEST_SIGNING_EVENT'
          },
          ipAddress: '127.0.0.1',
          userAgent: 'Test Agent'
        });
        
        console.log(`✅ Created signing event for ${signer.name} on ${contract.name}`);
      }
    }
  }

  /**
   * Create a test SCITT CCF claim
   */
  async createTestClaim(claimId, contractId, claimData) {
    const claim = await ScittClaim.create({
      claimId: claimId,
      contractId: contractId,
      claimType: 'contract_signature',
      claimData: claimData.data,
      receipt: `TEST_RECEIPT_${claimId}`,
      status: 'SUBMITTED',
      provenanceTreeId: `TEST_TREE_${contractId}`,
      provenanceRoot: this.generateTestHash(contractId)
    });
    
    console.log(`✅ Created test claim: ${claimId} for contract ${contractId}`);
    return claim;
  }

  /**
   * Generate a test signature (mock data)
   */
  generateTestSignature() {
    // Generate a mock signature array
    const signature = [];
    for (let i = 0; i < 64; i++) {
      signature.push(Math.floor(Math.random() * 256));
    }
    return signature;
  }

  /**
   * Generate a test hash
   */
  generateTestHash(data) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Get test data summary
   */
  getTestDataSummary() {
    return {
      users: this.testUsers.length,
      contracts: this.testContracts.length,
      keys: this.testKeys.length,
      claims: this.testClaims.length,
      userTypes: [...new Set(this.testUsers.map(u => u.partyType))],
      contractStatuses: [...new Set(this.testContracts.map(c => c.status))],
      keyTypes: [...new Set(this.testKeys.map(k => k.keyType))]
    };
  }

  /**
   * Cleanup all test data
   */
  async cleanup() {
    console.log('🧹 Cleaning up contract signing test data...');
    await this.cleanupTestData();
    console.log('✅ Contract signing test data cleanup completed');
  }
}

module.exports = SigningTestDataSetup;
