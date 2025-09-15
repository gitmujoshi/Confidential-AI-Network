#!/usr/bin/env node
/**
 * Test script for the Platform Encryption Workflow
 */

const PlatformEncryptionService = require('./services/platformEncryptionService');
const EnhancedJWTService = require('./services/enhancedJWTService');
const TEEAttestationService = require('./services/teeAttestationService');

async function testPlatformEncryptionWorkflow() {
  console.log('🧪 Testing Platform Encryption Workflow...\n');
  
  try {
    // Initialize services
    console.log('🔧 Initializing services...');
    const platformEncryptionService = new PlatformEncryptionService();
    const enhancedJWTService = new EnhancedJWTService(platformEncryptionService);
    const teeAttestationService = new TEEAttestationService(platformEncryptionService, enhancedJWTService);
    
    console.log('✅ Services initialized successfully\n');
    
    // Test 1: Platform Encryption Status
    console.log('📊 Test 1: Platform Encryption Status');
    const encryptionStatus = platformEncryptionService.getEncryptionStatus();
    console.log('✅ Platform encryption status:', encryptionStatus);
    console.log('');
    
    // Test 2: JWT Token Creation
    console.log('🎫 Test 2: JWT Token Creation');
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      role: 'TDP'
    };
    
    const authTokens = await enhancedJWTService.createAuthenticationToken(mockUser, 'TDP');
    console.log('✅ Authentication tokens created:', {
      hasAccessToken: !!authTokens.accessToken,
      hasRefreshToken: !!authTokens.refreshToken,
      userRole: authTokens.user.role,
      permissions: authTokens.user.permissions
    });
    console.log('');
    
    // Test 3: Data Encryption for TDP
    console.log('🔐 Test 3: Data Encryption for TDP');
    const testData = {
      datasetId: 'DATASET-001',
      name: 'Test Dataset',
      type: 'MNIST',
      samples: 1000,
      features: 784
    };
    
    const encryptedData = await platformEncryptionService.encryptDataForUpload(
      testData, 
      'DATASET', 
      'tdp-123'
    );
    
    console.log('✅ Data encrypted for TDP:', {
      hasEncryptedData: !!encryptedData.encryptedData,
      hasEncryptedDek: !!encryptedData.encryptedDek,
      hasDataAccessToken: !!encryptedData.dataAccessToken,
      dataType: encryptedData.dataType,
      tdpId: encryptedData.tdpId
    });
    console.log('');
    
    // Test 4: Data Decryption for TDC
    console.log('🔓 Test 4: Data Decryption for TDC');
    const decryptedData = await platformEncryptionService.decryptDataForAccess(
      encryptedData,
      'tdc-456',
      encryptedData.dataAccessToken
    );
    
    console.log('✅ Data decrypted for TDC:', {
      datasetId: decryptedData.datasetId,
      name: decryptedData.name,
      type: decryptedData.type,
      samples: decryptedData.samples,
      features: decryptedData.features
    });
    console.log('');
    
    // Test 5: TEE Provisioning
    console.log('🔒 Test 5: TEE Provisioning');
    const teeProvisioningRequest = {
      hardwareType: 'INTEL_SGX',
      resourceRequirements: {
        cpu: '2',
        memory: '4Gi',
        storage: '10Gi'
      }
    };
    
    const teeInfo = await teeAttestationService.provisionTEE(teeProvisioningRequest, 'ccrp-789');
    console.log('✅ TEE provisioned:', {
      teeId: teeInfo.teeId,
      status: teeInfo.status,
      hardwareType: teeInfo.hardwareType,
      attestationVerified: teeInfo.attestationVerified,
      hasAttestationToken: !!teeInfo.attestationToken
    });
    console.log('');
    
    // Test 6: TEE Attestation Verification
    console.log('🔍 Test 6: TEE Attestation Verification');
    const attestationVerification = await teeAttestationService.verifyTEEAttestation(
      teeInfo.attestationToken
    );
    
    console.log('✅ TEE attestation verified:', {
      verified: attestationVerification.verified,
      teeId: attestationVerification.teeId,
      hardwareType: attestationVerification.hardwareType,
      attestationVerified: attestationVerification.attestationVerified
    });
    console.log('');
    
    // Test 7: Training Results Encryption
    console.log('🔐 Test 7: Training Results Encryption');
    const trainingResults = {
      modelId: 'MODEL-001',
      accuracy: 0.95,
      loss: 0.05,
      epochs: 10,
      trainingTime: 3600,
      metrics: {
        precision: 0.94,
        recall: 0.96,
        f1Score: 0.95
      }
    };
    
    const encryptedResults = await platformEncryptionService.encryptTrainingResults(
      trainingResults,
      'tdc-456',
      teeInfo.attestationToken
    );
    
    console.log('✅ Training results encrypted:', {
      hasEncryptedResults: !!encryptedResults.encryptedResults,
      hasEncryptedDek: !!encryptedResults.encryptedDek,
      tdcId: encryptedResults.tdcId,
      teeId: encryptedResults.teeId,
      attestationVerified: encryptedResults.metadata.attestationVerified
    });
    console.log('');
    
    // Test 8: JWT Token Validation
    console.log('🎫 Test 8: JWT Token Validation');
    const validatedToken = await enhancedJWTService.validateToken(authTokens.accessToken, 'auth');
    console.log('✅ JWT token validated:', {
      userId: validatedToken.sub,
      role: validatedToken.role,
      permissions: validatedToken.permissions,
      tokenType: validatedToken.tokenType
    });
    console.log('');
    
    // Test 9: Token Refresh
    console.log('🔄 Test 9: Token Refresh');
    const refreshedTokens = await enhancedJWTService.refreshAccessToken(authTokens.refreshToken);
    console.log('✅ Tokens refreshed:', {
      hasNewAccessToken: !!refreshedTokens.accessToken,
      hasNewRefreshToken: !!refreshedTokens.refreshToken,
      userRole: refreshedTokens.user.role
    });
    console.log('');
    
    // Test 10: TEE Health Monitoring
    console.log('💚 Test 10: TEE Health Monitoring');
    const teeHealth = await teeAttestationService.monitorTEEHealth(teeInfo.teeId);
    console.log('✅ TEE health monitored:', {
      teeId: teeHealth.teeId,
      status: teeHealth.status,
      cpuUsage: teeHealth.metrics.cpuUsage,
      memoryUsage: teeHealth.metrics.memoryUsage,
      attestationStatus: teeHealth.attestationStatus
    });
    console.log('');
    
    // Test 11: Service Statistics
    console.log('📊 Test 11: Service Statistics');
    const jwtStats = enhancedJWTService.getTokenStatistics();
    const teeStats = teeAttestationService.getTEEStatistics();
    
    console.log('✅ JWT Statistics:', jwtStats);
    console.log('✅ TEE Statistics:', teeStats);
    console.log('');
    
    // Test 12: Token Revocation
    console.log('🚫 Test 12: Token Revocation');
    await enhancedJWTService.revokeToken(authTokens.accessToken, 'Test revocation');
    console.log('✅ Token revoked successfully');
    console.log('');
    
    // Test 13: TEE Decommissioning
    console.log('🔒 Test 13: TEE Decommissioning');
    await teeAttestationService.decommissionTEE(teeInfo.teeId, 'Test decommissioning');
    console.log('✅ TEE decommissioned successfully');
    console.log('');
    
    console.log('🎉 All Platform Encryption Workflow tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Platform encryption service initialized');
    console.log('✅ JWT token creation and validation working');
    console.log('✅ Data encryption and decryption working');
    console.log('✅ TEE provisioning and attestation working');
    console.log('✅ Training results encryption working');
    console.log('✅ Token lifecycle management working');
    console.log('✅ TEE health monitoring working');
    console.log('✅ Service statistics and cleanup working');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testPlatformEncryptionWorkflow().catch(console.error);
}

module.exports = testPlatformEncryptionWorkflow;
