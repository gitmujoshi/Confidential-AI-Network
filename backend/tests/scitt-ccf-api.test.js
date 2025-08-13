/**
 * SCITT CCF API Endpoint Test Suite
 * Tests the SCITT CCF specific API endpoints
 */

const axios = require('axios');

describe('SCITT CCF API Endpoint Tests', () => {
  const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5001';
  const API_BASE = `${BASE_URL}/api`;

  let authToken;

  beforeAll(async () => {
    // Get authentication token (you may need to implement this based on your auth system)
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'admin@contractmanagement.com',
        password: '***REMOVED-KEYCLOAK_ADMIN_PASSWORD***'
      });
      authToken = response.data.token;
    } catch (error) {
      console.warn('Could not get auth token, some tests may fail');
    }
  });

  describe('SCITT CCF Health Endpoints', () => {
    test('should get SCITT CCF health status', async () => {
      const response = await axios.get(`${API_BASE}/scitt-ccf/health`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status');
      expect(response.data).toHaveProperty('timestamp');
      expect(response.data).toHaveProperty('scittCcf');
      expect(response.data.scittCcf).toHaveProperty('isHealthy');
    });

    test('should get SCITT CCF metrics', async () => {
      const response = await axios.get(`${API_BASE}/scitt-ccf/metrics`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('totalClaims');
      expect(response.data).toHaveProperty('activeContracts');
      expect(response.data).toHaveProperty('averageResponseTime');
    });
  });

  describe('SCITT CCF Contract Operations', () => {
    test('should create contract via SCITT CCF', async () => {
      const contractData = {
        name: 'SCITT CCF Test Contract',
        description: 'Test contract created via SCITT CCF',
        tdpId: 2,
        tdcId: 5,
        ccrpId: 7,
        datasetId: 1,
        price: 5000,
        duration: 90,
        terms: 'Test terms and conditions'
      };

      const response = await axios.post(`${API_BASE}/scitt-ccf/contracts`, contractData, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('source', 'SCITT_CCF');
      expect(response.data).toHaveProperty('claimId');
      expect(response.data).toHaveProperty('receipt');
    });

    test('should get contract status from SCITT CCF', async () => {
      const claimId = 'test-claim-123';
      const response = await axios.get(`${API_BASE}/scitt-ccf/contracts/${claimId}/status`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('claimId', claimId);
      expect(response.data).toHaveProperty('status');
      expect(response.data).toHaveProperty('timestamp');
    });

    test('should list SCITT CCF contracts', async () => {
      const response = await axios.get(`${API_BASE}/scitt-ccf/contracts`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('contracts');
      expect(Array.isArray(response.data.contracts)).toBe(true);
    });
  });

  describe('SCITT CCF Claims Management', () => {
    test('should submit claim to SCITT CCF', async () => {
      const claimData = {
        type: 'contract_creation',
        data: {
          name: 'Test Claim',
          description: 'Test claim data',
          tdpId: 2,
          tdcId: 5,
          price: 3000
        }
      };

      const response = await axios.post(`${API_BASE}/scitt-ccf/claims`, claimData, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('claimId');
      expect(response.data).toHaveProperty('status', 'submitted');
    });

    test('should get claim details', async () => {
      const claimId = 'test-claim-123';
      const response = await axios.get(`${API_BASE}/scitt-ccf/claims/${claimId}`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('claimId', claimId);
      expect(response.data).toHaveProperty('type');
      expect(response.data).toHaveProperty('data');
      expect(response.data).toHaveProperty('status');
    });

    test('should list all claims', async () => {
      const response = await axios.get(`${API_BASE}/scitt-ccf/claims`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('claims');
      expect(Array.isArray(response.data.claims)).toBe(true);
    });
  });

  describe('SCITT CCF TEE Attestation', () => {
    test('should verify TEE attestation for contract', async () => {
      const contractId = 'test-contract-123';
      const response = await axios.post(`${API_BASE}/scitt-ccf/contracts/${contractId}/verify-attestation`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('verified');
      expect(response.data).toHaveProperty('teeProvider');
      expect(response.data).toHaveProperty('attestationReport');
    });

    test('should get TEE attestation status', async () => {
      const contractId = 'test-contract-123';
      const response = await axios.get(`${API_BASE}/scitt-ccf/contracts/${contractId}/attestation`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('attestationVerified');
      expect(response.data).toHaveProperty('attestationReport');
      expect(response.data).toHaveProperty('teeProvider');
    });
  });

  describe('SCITT CCF Migration Endpoints', () => {
    test('should get current migration mode', async () => {
      const response = await axios.get(`${API_BASE}/scitt-ccf/migration/mode`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('mode');
      expect(['ETHEREUM_ONLY', 'SCITT_CCF_ONLY', 'HYBRID']).toContain(response.data.mode);
    });

    test('should update migration mode', async () => {
      const newMode = 'HYBRID';
      const response = await axios.put(`${API_BASE}/scitt-ccf/migration/mode`, {
        mode: newMode
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('mode', newMode);
      expect(response.data).toHaveProperty('updatedAt');
    });

    test('should get migration status', async () => {
      const response = await axios.get(`${API_BASE}/scitt-ccf/migration/status`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('totalContracts');
      expect(response.data).toHaveProperty('migratedContracts');
      expect(response.data).toHaveProperty('pendingContracts');
      expect(response.data).toHaveProperty('migrationProgress');
    });

    test('should migrate specific contract to SCITT CCF', async () => {
      const contractId = 'test-contract-123';
      const response = await axios.post(`${API_BASE}/scitt-ccf/migration/contracts/${contractId}`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('contractId', contractId);
      expect(response.data).toHaveProperty('scittClaimId');
    });
  });

  describe('SCITT CCF Configuration', () => {
    test('should get SCITT CCF configuration', async () => {
      const response = await axios.get(`${API_BASE}/scitt-ccf/config`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('nodeUrl');
      expect(response.data).toHaveProperty('teeProvider');
      expect(response.data).toHaveProperty('enabled');
    });

    test('should update SCITT CCF configuration', async () => {
      const configUpdate = {
        nodeUrl: 'http://new-scitt-ccf-node:8000',
        enabled: true
      };

      const response = await axios.put(`${API_BASE}/scitt-ccf/config`, configUpdate, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('nodeUrl', configUpdate.nodeUrl);
      expect(response.data).toHaveProperty('enabled', configUpdate.enabled);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid claim data', async () => {
      const invalidClaim = {
        type: 'invalid_type',
        data: {} // Missing required fields
      };

      try {
        await axios.post(`${API_BASE}/scitt-ccf/claims`, invalidClaim, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('error');
      }
    });

    test('should handle SCITT CCF service unavailability', async () => {
      try {
        await axios.get(`${API_BASE}/scitt-ccf/health`);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(503);
        expect(error.response.data).toHaveProperty('error');
        expect(error.response.data.error).toContain('SCITT CCF service unavailable');
      }
    });

    test('should handle invalid migration mode', async () => {
      try {
        await axios.put(`${API_BASE}/scitt-ccf/migration/mode`, {
          mode: 'INVALID_MODE'
        }, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('error');
        expect(error.response.data.error).toContain('Invalid migration mode');
      }
    });
  });

  describe('Performance and Load Testing', () => {
    test('should handle multiple concurrent contract creations', async () => {
      const contracts = Array.from({ length: 10 }, (_, i) => ({
        name: `Concurrent Contract ${i}`,
        description: `Test description ${i}`,
        tdpId: 2,
        tdcId: 5,
        price: 1000 + i
      }));

      const startTime = Date.now();
      const promises = contracts.map(contract => 
        axios.post(`${API_BASE}/scitt-ccf/contracts`, contract, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        })
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.status).toBe(201);
        expect(result.data.success).toBe(true);
      });

      // Should complete within reasonable time (adjust based on your requirements)
      expect(duration).toBeLessThan(30000); // 30 seconds
    });

    test('should handle large claim data', async () => {
      const largeClaim = {
        type: 'contract_creation',
        data: {
          name: 'Large Data Contract',
          description: 'A'.repeat(10000), // 10KB description
          tdpId: 2,
          tdcId: 5,
          price: 5000,
          metadata: {
            largeField: 'B'.repeat(50000) // 50KB metadata
          }
        }
      };

      const response = await axios.post(`${API_BASE}/scitt-ccf/claims`, largeClaim, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('claimId');
    });
  });
});
