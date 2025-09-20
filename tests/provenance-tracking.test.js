/**
 * Comprehensive Test Suite for Provenance Tracking Service
 * 
 * Tests Merkle tree-based provenance tracking with SCITT CCF integration,
 * cryptographic verification, and cross-cloud verification capabilities.
 */

const request = require('supertest');
const { expect } = require('chai');
const crypto = require('crypto');
const { MerkleTree } = require('merkletreejs');

// Import services and dependencies
const ProvenanceTrackingService = require('../backend/services/provenanceTrackingService');
const app = require('../backend/server');

describe('🔗 Provenance Tracking Service Tests', function() {
  this.timeout(30000); // Extended timeout for complex operations

  let provenanceService;
  let authToken;
  let testUser;
  let testSessionId;
  let testContractId;

  before(async function() {
    console.log('🔧 Setting up Provenance Tracking test environment...');
    
    // Initialize provenance service
    provenanceService = new ProvenanceTrackingService();
    
    // Create test user and get auth token
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'provenance-test@example.com',
        password: 'TestPassword123!',
        name: 'Provenance Test User',
        organization: 'Test Organization',
        partyType: 'TDC'
      });

    testUser = userResponse.body.data.user;
    authToken = userResponse.body.data.token;

    // Create test contract
    const contractResponse = await request(app)
      .post('/api/contracts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Provenance Test Contract',
        description: 'Contract for testing provenance tracking',
        datasetId: null,
        price: 1000,
        currency: 'USD'
      });

    testContractId = contractResponse.body.data.contract.contractId;
    testSessionId = `provenance_test_${Date.now()}`;

    console.log('✅ Provenance tracking test environment ready');
  });

  describe('🚀 Service Initialization', function() {
    it('should initialize provenance service successfully', function() {
      expect(provenanceService).to.be.an('object');
      expect(provenanceService.provenanceTrees).to.be.instanceOf(Map);
      expect(provenanceService.provenanceNodes).to.be.instanceOf(Map);
      expect(provenanceService.verificationKeys).to.be.instanceOf(Map);
    });

    it('should initialize cross-cloud verifiers', function() {
      expect(provenanceService.crossCloudVerifiers).to.be.instanceOf(Map);
      expect(provenanceService.crossCloudVerifiers.size).to.be.greaterThan(0);
    });

    it('should initialize timestamp service', function() {
      expect(provenanceService.timestampService).to.exist;
    });
  });

  describe('📋 Provenance Session Management', function() {
    it('should initialize provenance tracking session', async function() {
      const sessionConfig = {
        jobId: testSessionId,
        contractId: testContractId,
        environmentId: 'test_environment',
        userId: testUser.id,
        operation: 'MODEL_TRAINING'
      };

      const session = await provenanceService.initializeProvenanceTracking(sessionConfig);

      expect(session).to.be.an('object');
      expect(session.sessionId).to.equal(testSessionId);
      expect(session.contractId).to.equal(testContractId);
      expect(session.status).to.equal('INITIALIZED');
      expect(session.merkleTree).to.exist;
    });

    it('should handle duplicate session initialization', async function() {
      const sessionConfig = {
        jobId: testSessionId,
        contractId: testContractId,
        environmentId: 'test_environment',
        userId: testUser.id,
        operation: 'MODEL_TRAINING'
      };

      try {
        await provenanceService.initializeProvenanceTracking(sessionConfig);
        expect.fail('Should have thrown error for duplicate session');
      } catch (error) {
        expect(error.message).to.include('already exists');
      }
    });
  });

  describe('🔗 Provenance Node Creation', function() {
    it('should create DATA provenance node', async function() {
      const nodeConfig = {
        nodeId: `data_node_${Date.now()}`,
        type: 'DATA',
        content: {
          datasetId: 'dataset_123',
          dataSize: 1000000,
          dataFormat: 'CSV',
          checksum: crypto.randomBytes(32).toString('hex')
        },
        metadata: {
          operation: 'DATA_INGESTION',
          userId: testUser.id,
          timestamp: new Date()
        }
      };

      const node = await provenanceService.createProvenanceNode(nodeConfig);

      expect(node).to.be.an('object');
      expect(node.nodeId).to.equal(nodeConfig.nodeId);
      expect(node.nodeType).to.equal('DATA');
      expect(node.contentHash).to.be.a('string');
      expect(node.digitalSignature).to.be.a('string');
      expect(node.timestamp).to.be.a('string');
    });

    it('should create MODEL provenance node', async function() {
      const nodeConfig = {
        nodeId: `model_node_${Date.now()}`,
        type: 'MODEL',
        content: {
          modelId: 'model_456',
          modelArchitecture: 'ResNet50',
          parameters: 25000000,
          framework: 'PyTorch'
        },
        metadata: {
          operation: 'MODEL_UPLOAD',
          userId: testUser.id,
          encryptionEnabled: true
        }
      };

      const node = await provenanceService.createProvenanceNode(nodeConfig);

      expect(node).to.be.an('object');
      expect(node.nodeType).to.equal('MODEL');
      expect(node.metadata.encryptionEnabled).to.be.true;
    });

    it('should create EXECUTION provenance node', async function() {
      const nodeConfig = {
        nodeId: `execution_node_${Date.now()}`,
        type: 'EXECUTION',
        content: {
          operationType: 'TEE_PROVISIONING',
          provider: 'AWS',
          instanceType: 'm5.large',
          attestationVerified: true
        },
        metadata: {
          operation: 'TEE_PROVISIONING',
          userId: testUser.id,
          teeEnvironment: {
            provider: 'AWS',
            instanceId: 'i-1234567890abcdef0'
          }
        }
      };

      const node = await provenanceService.createProvenanceNode(nodeConfig);

      expect(node).to.be.an('object');
      expect(node.nodeType).to.equal('EXECUTION');
      expect(node.metadata.teeEnvironment).to.exist;
    });

    it('should create CONTRACT provenance node', async function() {
      const nodeConfig = {
        nodeId: `contract_node_${Date.now()}`,
        type: 'CONTRACT',
        content: {
          contractId: testContractId,
          signedAt: new Date(),
          parties: ['TDC', 'TDP', 'CCRP'],
          terms: 'Test contract terms'
        },
        metadata: {
          operation: 'CONTRACT_SIGNING',
          userId: testUser.id
        }
      };

      const node = await provenanceService.createProvenanceNode(nodeConfig);

      expect(node).to.be.an('object');
      expect(node.nodeType).to.equal('CONTRACT');
      expect(node.content.contractId).to.equal(testContractId);
    });

    it('should handle invalid node type', async function() {
      const nodeConfig = {
        nodeId: `invalid_node_${Date.now()}`,
        type: 'INVALID_TYPE',
        content: { test: 'data' },
        metadata: { operation: 'TEST' }
      };

      try {
        await provenanceService.createProvenanceNode(nodeConfig);
        expect.fail('Should have thrown error for invalid node type');
      } catch (error) {
        expect(error.message).to.include('Invalid node type');
      }
    });
  });

  describe('🌳 Merkle Tree Management', function() {
    let dataNodeId, modelNodeId, executionNodeId;

    before(async function() {
      // Create test nodes for Merkle tree operations
      const dataNode = await provenanceService.createProvenanceNode({
        nodeId: `data_${Date.now()}`,
        type: 'DATA',
        content: { test: 'data' },
        metadata: { operation: 'DATA_INGESTION' }
      });
      dataNodeId = dataNode.nodeId;

      const modelNode = await provenanceService.createProvenanceNode({
        nodeId: `model_${Date.now()}`,
        type: 'MODEL',
        content: { test: 'model' },
        metadata: { operation: 'MODEL_UPLOAD' }
      });
      modelNodeId = modelNode.nodeId;

      const executionNode = await provenanceService.createProvenanceNode({
        nodeId: `execution_${Date.now()}`,
        type: 'EXECUTION',
        content: { test: 'execution' },
        metadata: { operation: 'TEE_PROVISIONING' }
      });
      executionNodeId = executionNode.nodeId;
    });

    it('should add nodes to Merkle tree', async function() {
      await provenanceService.addNodeToMerkleTree(testSessionId, dataNodeId);
      await provenanceService.addNodeToMerkleTree(testSessionId, modelNodeId);
      await provenanceService.addNodeToMerkleTree(testSessionId, executionNodeId);

      const session = provenanceService.provenanceTrees.get(testSessionId);
      expect(session).to.exist;
      expect(session.merkleTree).to.be.instanceOf(MerkleTree);
      expect(session.nodes.length).to.equal(3);
    });

    it('should generate Merkle proof for node', async function() {
      const proof = await provenanceService.generateMerkleProof(testSessionId, dataNodeId);

      expect(proof).to.be.an('object');
      expect(proof.nodeId).to.equal(dataNodeId);
      expect(proof.proof).to.be.an('array');
      expect(proof.root).to.be.a('string');
      expect(proof.verified).to.be.true;
    });

    it('should rebuild Merkle tree', async function() {
      const session = provenanceService.provenanceTrees.get(testSessionId);
      const originalRoot = session.merkleTree.getRoot().toString('hex');

      await provenanceService.rebuildMerkleTree(session);

      const newRoot = session.merkleTree.getRoot().toString('hex');
      expect(newRoot).to.equal(originalRoot); // Should be identical for same nodes
    });

    it('should handle non-existent session for Merkle operations', async function() {
      try {
        await provenanceService.addNodeToMerkleTree('non_existent_session', dataNodeId);
        expect.fail('Should have thrown error for non-existent session');
      } catch (error) {
        expect(error.message).to.include('Session not found');
      }
    });
  });

  describe('🔐 Cryptographic Verification', function() {
    let testNodeId;

    before(async function() {
      const node = await provenanceService.createProvenanceNode({
        nodeId: `verification_test_${Date.now()}`,
        type: 'DATA',
        content: { test: 'verification data' },
        metadata: { operation: 'VERIFICATION_TEST' }
      });
      testNodeId = node.nodeId;
    });

    it('should verify provenance node successfully', async function() {
      const verificationConfig = {
        verifyContentHash: true,
        verifyDigitalSignature: true,
        verifyTimestamp: true,
        verifyMerkleProof: false, // Node not added to tree yet
        verifyCrossCloud: false
      };

      const result = await provenanceService.verifyProvenanceNode(testNodeId, verificationConfig);

      expect(result).to.be.an('object');
      expect(result.nodeId).to.equal(testNodeId);
      expect(result.verified).to.be.true;
      expect(result.verificationDetails.contentHash.verified).to.be.true;
      expect(result.verificationDetails.digitalSignature.verified).to.be.true;
      expect(result.verificationDetails.timestamp.verified).to.be.true;
    });

    it('should verify complete provenance chain', async function() {
      // Add node to tree for chain verification
      await provenanceService.addNodeToMerkleTree(testSessionId, testNodeId);

      const result = await provenanceService.verifyProvenanceChain(testSessionId);

      expect(result).to.be.an('object');
      expect(result.sessionId).to.equal(testSessionId);
      expect(result.verified).to.be.true;
      expect(result.chainIntegrity.verified).to.be.true;
      expect(result.merkleTreeValid).to.be.true;
      expect(result.nodesVerified).to.be.greaterThan(0);
    });

    it('should handle verification of non-existent node', async function() {
      try {
        await provenanceService.verifyProvenanceNode('non_existent_node');
        expect.fail('Should have thrown error for non-existent node');
      } catch (error) {
        expect(error.message).to.include('Node not found');
      }
    });

    it('should verify content hash correctly', async function() {
      const node = provenanceService.provenanceNodes.get(testNodeId);
      const hashResult = await provenanceService.verifyContentHash(node);

      expect(hashResult.verified).to.be.true;
      expect(hashResult.expectedHash).to.equal(node.contentHash);
    });

    it('should verify digital signature correctly', async function() {
      const node = provenanceService.provenanceNodes.get(testNodeId);
      const signatureResult = await provenanceService.verifyDigitalSignature(node);

      expect(signatureResult.verified).to.be.true;
      expect(signatureResult.algorithm).to.be.a('string');
    });
  });

  describe('⏰ Timestamp Verification', function() {
    it('should generate and verify timestamps', async function() {
      const node = {
        nodeId: 'timestamp_test',
        content: { test: 'timestamp data' },
        timestamp: new Date().toISOString()
      };

      const timestamp = await provenanceService.getTimestamp(node);
      expect(timestamp).to.be.an('object');
      expect(timestamp.timestamp).to.be.a('string');
      expect(timestamp.source).to.equal('system');

      const verification = await provenanceService.verifyTimestamp(node);
      expect(verification.verified).to.be.true;
    });

    it('should handle timestamp verification failure', async function() {
      const node = {
        nodeId: 'invalid_timestamp_test',
        content: { test: 'data' },
        timestamp: 'invalid_timestamp'
      };

      const verification = await provenanceService.verifyTimestamp(node);
      expect(verification.verified).to.be.false;
      expect(verification.reason).to.include('Invalid timestamp format');
    });
  });

  describe('🌐 Cross-Cloud Verification', function() {
    it('should perform cross-cloud verification', async function() {
      const node = provenanceService.provenanceNodes.get(testNodeId);
      const config = {
        providers: ['AWS', 'Azure'],
        consensusRequired: false
      };

      const result = await provenanceService.verifyCrossCloud(node, config);

      expect(result).to.be.an('object');
      expect(result.verified).to.be.true;
      expect(result.providerResults).to.be.an('object');
      expect(result.consensus).to.exist;
    });

    it('should handle cross-cloud verification with consensus', async function() {
      const node = provenanceService.provenanceNodes.get(testNodeId);
      const config = {
        providers: ['AWS', 'Azure', 'GCP'],
        consensusRequired: true,
        minimumConsensus: 2
      };

      const result = await provenanceService.verifyCrossCloud(node, config);

      expect(result).to.be.an('object');
      expect(result.consensus.required).to.be.true;
      expect(result.consensus.achieved).to.be.a('boolean');
    });
  });

  describe('📊 Provenance Reporting', function() {
    it('should generate comprehensive provenance report', async function() {
      const report = await provenanceService.getProvenanceReport(testSessionId);

      expect(report).to.be.an('object');
      expect(report.sessionId).to.equal(testSessionId);
      expect(report.summary).to.exist;
      expect(report.summary.totalNodes).to.be.a('number');
      expect(report.summary.verifiedNodes).to.be.a('number');
      expect(report.nodeTypes).to.be.an('object');
      expect(report.timeline).to.be.an('array');
      expect(report.merkleTree).to.exist;
      expect(report.verificationStatus).to.exist;
    });

    it('should include security analysis in report', async function() {
      const report = await provenanceService.getProvenanceReport(testSessionId);

      expect(report.security).to.exist;
      expect(report.security.overallScore).to.be.a('number');
      expect(report.security.cryptographicIntegrity).to.be.a('boolean');
      expect(report.security.chainIntegrity).to.be.a('boolean');
    });

    it('should generate recommendations', async function() {
      const session = provenanceService.provenanceTrees.get(testSessionId);
      const recommendations = await provenanceService.generateProvenanceRecommendations(session);

      expect(recommendations).to.be.an('array');
      recommendations.forEach(rec => {
        expect(rec).to.have.property('type');
        expect(rec).to.have.property('description');
        expect(rec).to.have.property('priority');
      });
    });
  });

  describe('🔑 Key Management', function() {
    it('should generate verification keys for session', async function() {
      const newSessionId = `key_test_${Date.now()}`;
      
      await provenanceService.initializeProvenanceTracking({
        jobId: newSessionId,
        contractId: testContractId,
        environmentId: 'key_test_env',
        userId: testUser.id,
        operation: 'KEY_TEST'
      });

      const keys = await provenanceService.generateVerificationKeys(newSessionId);

      expect(keys).to.be.an('object');
      expect(keys.sessionId).to.equal(newSessionId);
      expect(keys.publicKey).to.be.a('string');
      expect(keys.keyId).to.be.a('string');
      expect(keys.algorithm).to.be.a('string');
    });

    it('should retrieve private and public keys', function() {
      const nodeId = 'key_test_node';
      
      const privateKey = provenanceService.getOrCreatePrivateKey(nodeId);
      const publicKey = provenanceService.getOrCreatePublicKey(nodeId);

      expect(privateKey).to.be.a('string');
      expect(publicKey).to.be.a('string');
      expect(privateKey).to.not.equal(publicKey);
    });
  });

  describe('🔍 Session Management', function() {
    it('should find session by node ID', function() {
      const sessionId = provenanceService.findSessionByNodeId(testNodeId);
      expect(sessionId).to.equal(testSessionId);
    });

    it('should return null for non-existent node', function() {
      const sessionId = provenanceService.findSessionByNodeId('non_existent_node');
      expect(sessionId).to.be.null;
    });
  });

  describe('⚡ Performance Tests', function() {
    it('should handle high-volume node creation', async function() {
      const startTime = Date.now();
      const nodePromises = [];

      // Create 100 nodes
      for (let i = 0; i < 100; i++) {
        const promise = provenanceService.createProvenanceNode({
          nodeId: `perf_test_${i}_${Date.now()}`,
          type: 'DATA',
          content: { index: i, data: `test_data_${i}` },
          metadata: { operation: 'PERFORMANCE_TEST', index: i }
        });
        nodePromises.push(promise);
      }

      const nodes = await Promise.all(nodePromises);
      const endTime = Date.now();

      expect(nodes).to.have.length(100);
      expect(endTime - startTime).to.be.lessThan(10000); // Should complete in under 10 seconds

      console.log(`✅ Created 100 nodes in ${endTime - startTime}ms`);
    });

    it('should handle large Merkle tree operations', async function() {
      const perfSessionId = `perf_session_${Date.now()}`;
      
      await provenanceService.initializeProvenanceTracking({
        jobId: perfSessionId,
        contractId: testContractId,
        environmentId: 'perf_test_env',
        userId: testUser.id,
        operation: 'PERFORMANCE_TEST'
      });

      const startTime = Date.now();

      // Add 50 nodes to Merkle tree
      for (let i = 0; i < 50; i++) {
        const node = await provenanceService.createProvenanceNode({
          nodeId: `merkle_perf_${i}_${Date.now()}`,
          type: 'DATA',
          content: { index: i },
          metadata: { operation: 'MERKLE_PERFORMANCE_TEST' }
        });

        await provenanceService.addNodeToMerkleTree(perfSessionId, node.nodeId);
      }

      const endTime = Date.now();
      console.log(`✅ Added 50 nodes to Merkle tree in ${endTime - startTime}ms`);

      // Verify chain
      const verificationStart = Date.now();
      const chainResult = await provenanceService.verifyProvenanceChain(perfSessionId);
      const verificationEnd = Date.now();

      expect(chainResult.verified).to.be.true;
      console.log(`✅ Verified chain with 50 nodes in ${verificationEnd - verificationStart}ms`);
    });
  });

  after(async function() {
    console.log('🧹 Cleaning up provenance tracking test environment...');
    // Cleanup is handled by service's internal maps
    console.log('✅ Provenance tracking test cleanup complete');
  });
});

describe('🌐 Provenance API Endpoints Tests', function() {
  this.timeout(15000);

  let authToken;
  let testUser;
  let testContractId;
  let testSessionId;

  before(async function() {
    // Setup test user and contract for API tests
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'provenance-api-test@example.com',
        password: 'TestPassword123!',
        name: 'Provenance API Test User',
        organization: 'Test Organization',
        partyType: 'TDC'
      });

    testUser = userResponse.body.data.user;
    authToken = userResponse.body.data.token;

    const contractResponse = await request(app)
      .post('/api/contracts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Provenance API Test Contract',
        description: 'Contract for testing provenance API',
        price: 1000,
        currency: 'USD'
      });

    testContractId = contractResponse.body.data.contract.contractId;
    testSessionId = `api_test_${Date.now()}`;
  });

  describe('POST /api/provenance/initialize', function() {
    it('should initialize provenance tracking session via API', async function() {
      const response = await request(app)
        .post('/api/provenance/initialize')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          jobId: testSessionId,
          contractId: testContractId,
          environmentId: 'api_test_env',
          operation: 'API_TEST'
        });

      expect(response.status).to.equal(201);
      expect(response.body.success).to.be.true;
      expect(response.body.data.sessionId).to.equal(testSessionId);
      expect(response.body.data.status).to.equal('INITIALIZED');
    });

    it('should require authentication', async function() {
      const response = await request(app)
        .post('/api/provenance/initialize')
        .send({
          jobId: 'unauthorized_test',
          contractId: testContractId,
          environmentId: 'test_env',
          operation: 'UNAUTHORIZED_TEST'
        });

      expect(response.status).to.equal(401);
    });

    it('should validate required fields', async function() {
      const response = await request(app)
        .post('/api/provenance/initialize')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          jobId: 'incomplete_test'
          // Missing required fields
        });

      expect(response.status).to.equal(400);
      expect(response.body.success).to.be.false;
    });
  });

  describe('POST /api/provenance/nodes', function() {
    let testNodeId;

    it('should create provenance node via API', async function() {
      testNodeId = `api_node_${Date.now()}`;

      const response = await request(app)
        .post('/api/provenance/nodes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nodeId: testNodeId,
          type: 'DATA',
          content: {
            datasetId: 'api_test_dataset',
            operation: 'API_DATA_INGESTION'
          },
          metadata: {
            operation: 'API_TEST',
            userId: testUser.id
          }
        });

      expect(response.status).to.equal(201);
      expect(response.body.success).to.be.true;
      expect(response.body.data.nodeId).to.equal(testNodeId);
      expect(response.body.data.nodeType).to.equal('DATA');
    });

    it('should reject invalid node type', async function() {
      const response = await request(app)
        .post('/api/provenance/nodes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nodeId: `invalid_api_node_${Date.now()}`,
          type: 'INVALID_TYPE',
          content: { test: 'data' },
          metadata: { operation: 'API_TEST' }
        });

      expect(response.status).to.equal(400);
      expect(response.body.success).to.be.false;
    });
  });

  describe('POST /api/provenance/trees/:sessionId/nodes', function() {
    let nodeId;

    before(async function() {
      // Create a node to add to tree
      const nodeResponse = await request(app)
        .post('/api/provenance/nodes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nodeId: `tree_node_${Date.now()}`,
          type: 'MODEL',
          content: { modelId: 'api_test_model' },
          metadata: { operation: 'API_MODEL_UPLOAD' }
        });

      nodeId = nodeResponse.body.data.nodeId;
    });

    it('should add node to Merkle tree via API', async function() {
      const response = await request(app)
        .post(`/api/provenance/trees/${testSessionId}/nodes`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nodeId: nodeId
        });

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data.nodeId).to.equal(nodeId);
      expect(response.body.data.merkleProof).to.exist;
    });

    it('should handle non-existent session', async function() {
      const response = await request(app)
        .post('/api/provenance/trees/non_existent_session/nodes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nodeId: nodeId
        });

      expect(response.status).to.equal(404);
      expect(response.body.success).to.be.false;
    });
  });

  describe('POST /api/provenance/nodes/:nodeId/verify', function() {
    let verificationNodeId;

    before(async function() {
      // Create and add node for verification
      const nodeResponse = await request(app)
        .post('/api/provenance/nodes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nodeId: `verify_node_${Date.now()}`,
          type: 'EXECUTION',
          content: { operation: 'TEE_VERIFICATION_TEST' },
          metadata: { operation: 'API_VERIFICATION_TEST' }
        });

      verificationNodeId = nodeResponse.body.data.nodeId;

      await request(app)
        .post(`/api/provenance/trees/${testSessionId}/nodes`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ nodeId: verificationNodeId });
    });

    it('should verify provenance node via API', async function() {
      const response = await request(app)
        .post(`/api/provenance/nodes/${verificationNodeId}/verify`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          verifyContentHash: true,
          verifyDigitalSignature: true,
          verifyTimestamp: true,
          verifyMerkleProof: true
        });

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data.verified).to.be.true;
      expect(response.body.data.verificationDetails).to.exist;
    });
  });

  describe('POST /api/provenance/chains/:sessionId/verify', function() {
    it('should verify complete provenance chain via API', async function() {
      const response = await request(app)
        .post(`/api/provenance/chains/${testSessionId}/verify`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          verifyAllNodes: true,
          verifyMerkleTree: true,
          verifyChainIntegrity: true
        });

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data.verified).to.be.true;
      expect(response.body.data.chainIntegrity).to.exist;
    });
  });

  describe('GET /api/provenance/reports/:sessionId', function() {
    it('should generate provenance report via API', async function() {
      const response = await request(app)
        .get(`/api/provenance/reports/${testSessionId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data.sessionId).to.equal(testSessionId);
      expect(response.body.data.summary).to.exist;
      expect(response.body.data.timeline).to.be.an('array');
      expect(response.body.data.security).to.exist;
    });

    it('should handle non-existent session in report', async function() {
      const response = await request(app)
        .get('/api/provenance/reports/non_existent_session')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).to.equal(404);
      expect(response.body.success).to.be.false;
    });
  });
});

console.log('🔗 Provenance Tracking Service test suite loaded');
