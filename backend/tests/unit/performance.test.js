const request = require('supertest');
const { User, Contract, Dataset, Notification } = require('../../models');
const { sequelize } = require('../../models');
const jwt = require('jsonwebtoken');

// Import app
const app = require('../test-server');

describe('Performance Test Suite', () => {
  let testUsers = [];
  let testDatasets = [];
  let testContracts = [];
  let authTokens = [];

  beforeAll(async () => {
    // Setup test database
    await sequelize.sync({ force: true });
    
    // Create test data for performance testing
    await createTestData();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clear notifications before each test
    await Notification.destroy({ where: {} });
  });

  async function createTestData() {
    // Create multiple users
    for (let i = 1; i <= 50; i++) {
      const user = await User.create({
        email: `perf-user-${i}@example.com`,
        name: `Performance User ${i}`,
        partyType: i % 3 === 0 ? 'TDP' : i % 3 === 1 ? 'TDC' : 'CCRP',
        publicKey: `public-key-${i}`,
        did: `did:web:github.com:perfuser${i}`,
        didVerified: true
      });
      testUsers.push(user);

      const token = jwt.sign(
        { userId: user.id, role: user.partyType },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );
      authTokens.push(token);
    }

    // Create datasets (only TDP users can create datasets)
    const tdpUsers = testUsers.filter(user => user.partyType === 'TDP');
    for (let i = 1; i <= 20; i++) {
      const dataset = await Dataset.create({
        datasetId: `PERF-DATASET-${i.toString().padStart(3, '0')}`,
        name: `Performance Dataset ${i}`,
        description: `Dataset ${i} for performance testing`,
        category: i % 4 === 0 ? 'Computer Vision' : i % 4 === 1 ? 'Natural Language Processing' : i % 4 === 2 ? 'Audio Processing' : 'Time Series',
        size: 1000 + (i * 100),
        recordCount: 10000 + (i * 1000),
        price: 50.00 + (i * 5),
        license: 'MIT',
        ownerId: tdpUsers[i % tdpUsers.length].id
      });
      testDatasets.push(dataset);
    }

    // Create contracts
    for (let i = 1; i <= 100; i++) {
      const contract = await Contract.create({
        contractId: `PERF-CONTRACT-${i.toString().padStart(3, '0')}`,
        status: i % 5 === 0 ? 'ACTIVE' : i % 5 === 1 ? 'PENDING_TDP_APPROVAL' : i % 5 === 2 ? 'PENDING_CCRP_SIGNATURE' : i % 5 === 3 ? 'COMPLETED' : 'CANCELLED',
        price: 100.00 + (i * 10),
        duration: 30 + (i % 60),
        termsAndConditions: `Performance contract ${i} terms and conditions`,
        modelId: `PERF-MODEL-${i.toString().padStart(3, '0')}`,
        tdpId: testUsers[i % testUsers.length].id,
        tdcId: testUsers[(i + 1) % testUsers.length].id,
        ccrpId: testUsers[(i + 2) % testUsers.length].id,
        datasetId: testDatasets[i % testDatasets.length].id
      });
      testContracts.push(contract);
    }
  }

  describe('Database Performance', () => {
    it('should handle large dataset queries efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/datasets')
        .set('Authorization', `Bearer ${authTokens[0]}`)
        .expect(200);

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(response.body.length).toBe(20);
      expect(queryTime).toBeLessThan(1000); // Should complete within 1 second
      console.log(`Dataset query completed in ${queryTime}ms`);
    });

    it('should handle complex contract queries with filters', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/contracts?status=ACTIVE&price_min=150&price_max=300')
        .set('Authorization', `Bearer ${authTokens[0]}`)
        .expect(200);

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(queryTime).toBeLessThan(1000); // Should complete within 1 second
      console.log(`Complex contract query completed in ${queryTime}ms`);
    });

    it('should handle pagination efficiently', async () => {
      const pageSizes = [10, 25, 50, 100];
      
      for (const pageSize of pageSizes) {
        const startTime = Date.now();
        
        const response = await request(app)
          .get(`/api/contracts?page=1&limit=${pageSize}`)
          .set('Authorization', `Bearer ${authTokens[0]}`)
          .expect(200);

        const endTime = Date.now();
        const queryTime = endTime - startTime;

        expect(response.body.length).toBeLessThanOrEqual(pageSize);
        expect(queryTime).toBeLessThan(500); // Should complete within 500ms
        console.log(`Pagination with ${pageSize} items completed in ${queryTime}ms`);
      }
    });

    it('should handle sorting efficiently', async () => {
      const sortFields = ['price', 'duration', 'createdAt'];
      
      for (const sortField of sortFields) {
        const startTime = Date.now();
        
        const response = await request(app)
          .get(`/api/contracts?sortBy=${sortField}&sortOrder=desc`)
          .set('Authorization', `Bearer ${authTokens[0]}`)
          .expect(200);

        const endTime = Date.now();
        const queryTime = endTime - startTime;

        expect(response.body.length).toBeGreaterThan(0);
        expect(queryTime).toBeLessThan(1000); // Should complete within 1 second
        console.log(`Sorting by ${sortField} completed in ${queryTime}ms`);
      }
    });
  });

  describe('API Performance', () => {
    it('should handle concurrent user registrations', async () => {
      const concurrentUsers = 10;
      const startTime = Date.now();
      
      const registrationPromises = [];
      for (let i = 1; i <= concurrentUsers; i++) {
        registrationPromises.push(
          request(app)
            .post('/api/auth/register')
            .send({
              email: `concurrent-${Date.now()}-${i}@example.com`,
              name: `Concurrent User ${i}`,
              partyType: 'TDC',
              password: 'Password123'
            })
        );
      }

      const responses = await Promise.all(registrationPromises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const successful = responses.filter(r => r.status === 201);
      const failed = responses.filter(r => r.status !== 201);

      expect(successful.length).toBe(concurrentUsers);
      expect(failed.length).toBe(0);
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
      console.log(`Concurrent registrations completed in ${totalTime}ms`);
    });

    it('should handle concurrent contract queries', async () => {
      const concurrentQueries = 20;
      const startTime = Date.now();
      
      const queryPromises = [];
      for (let i = 0; i < concurrentQueries; i++) {
        queryPromises.push(
          request(app)
            .get('/api/contracts')
            .set('Authorization', `Bearer ${authTokens[i % authTokens.length]}`)
        );
      }

      const responses = await Promise.all(queryPromises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const successful = responses.filter(r => r.status === 200);
      const failed = responses.filter(r => r.status !== 200);

      expect(successful.length).toBe(concurrentQueries);
      expect(failed.length).toBe(0);
      expect(totalTime).toBeLessThan(3000); // Should complete within 3 seconds
      console.log(`Concurrent contract queries completed in ${totalTime}ms`);
    });

    it('should handle mixed workload efficiently', async () => {
      const startTime = Date.now();
      
      const mixedPromises = [
        // Read operations
        request(app).get('/api/users').set('Authorization', `Bearer ${authTokens[0]}`),
        request(app).get('/api/contracts').set('Authorization', `Bearer ${authTokens[1]}`),
        request(app).get('/api/datasets').set('Authorization', `Bearer ${authTokens[2]}`),
        
        // Write operations
        request(app)
          .post('/api/contracts')
          .set('Authorization', `Bearer ${authTokens[0]}`)
          .send({
            contractId: `MIXED-CONTRACT-${Date.now()}`,
            price: 200.00,
            duration: 45,
            termsAndConditions: 'Mixed workload test contract',
            modelId: 'MIXED-MODEL-001',
            tdpId: testUsers[0].id,
            tdcId: testUsers[1].id,
            ccrpId: testUsers[2].id,
            datasetId: testDatasets[0].id
          }),
        
        // Update operations
        request(app)
          .put(`/api/contracts/${testContracts[0].id}`)
          .set('Authorization', `Bearer ${authTokens[0]}`)
          .send({ status: 'ACTIVE' })
      ];

      const responses = await Promise.all(mixedPromises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const successful = responses.filter(r => r.status >= 200 && r.status < 300);
      expect(successful.length).toBe(5);
      expect(totalTime).toBeLessThan(2000); // Should complete within 2 seconds
      console.log(`Mixed workload completed in ${totalTime}ms`);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory during repeated operations', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform repeated operations
      for (let i = 0; i < 100; i++) {
        await request(app)
          .get('/api/contracts?limit=10')
          .set('Authorization', `Bearer ${authTokens[i % authTokens.length]}`)
          .expect(200);
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });

    it('should handle large payloads efficiently', async () => {
      const largeDataset = {
        datasetId: `LARGE-DATASET-${Date.now()}`,
        name: 'Large Dataset',
        description: 'A'.repeat(1000), // Large description
        category: 'Computer Vision',
        size: 10000,
        recordCount: 100000,
        price: 500.00,
        license: 'MIT',
        metadata: {
          features: Array(1000).fill().map((_, i) => `feature_${i}`),
          labels: Array(1000).fill().map((_, i) => `label_${i}`)
        }
      };

      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/datasets')
        .set('Authorization', `Bearer ${authTokens[0]}`)
        .send(largeDataset)
        .expect(201);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(2000); // Should complete within 2 seconds
      console.log(`Large payload processing completed in ${processingTime}ms`);
    });
  });

  describe('Response Time Benchmarks', () => {
    it('should meet response time requirements for common operations', async () => {
      const benchmarks = [
        {
          name: 'Health Check',
          request: () => request(app).get('/health'),
          maxTime: 100
        },
        {
          name: 'User List',
          request: () => request(app).get('/api/users').set('Authorization', `Bearer ${authTokens[0]}`),
          maxTime: 500
        },
        {
          name: 'Contract List',
          request: () => request(app).get('/api/contracts').set('Authorization', `Bearer ${authTokens[0]}`),
          maxTime: 1000
        },
        {
          name: 'Dataset List',
          request: () => request(app).get('/api/datasets').set('Authorization', `Bearer ${authTokens[0]}`),
          maxTime: 1000
        },
        {
          name: 'Single Contract',
          request: () => request(app).get(`/api/contracts/${testContracts[0].id}`).set('Authorization', `Bearer ${authTokens[0]}`),
          maxTime: 500
        }
      ];

      for (const benchmark of benchmarks) {
        const startTime = Date.now();
        const response = await benchmark.request();
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        expect(response.status).toBeGreaterThanOrEqual(200);
        expect(response.status).toBeLessThan(500);
        expect(responseTime).toBeLessThan(benchmark.maxTime);
        console.log(`${benchmark.name}: ${responseTime}ms (max: ${benchmark.maxTime}ms)`);
      }
    });

    it('should handle authentication efficiently', async () => {
      const userData = {
        email: `auth-perf-${Date.now()}@example.com`,
        name: 'Auth Performance User',
        partyType: 'TDC',
        password: 'Password123'
      };

      // Test registration performance
      const regStartTime = Date.now();
      const regResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);
      const regEndTime = Date.now();
      const regTime = regEndTime - regStartTime;

      expect(regTime).toBeLessThan(2000); // Registration within 2 seconds
      console.log(`Registration: ${regTime}ms`);

      // Test login performance
      const loginStartTime = Date.now();
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);
      const loginEndTime = Date.now();
      const loginTime = loginEndTime - loginStartTime;

      expect(loginTime).toBeLessThan(1000); // Login within 1 second
      console.log(`Login: ${loginTime}ms`);
    });
  });

  describe('Stress Testing', () => {
    it('should handle high load gracefully', async () => {
      const highLoadRequests = 50;
      const startTime = Date.now();
      
      const requests = [];
      for (let i = 0; i < highLoadRequests; i++) {
        requests.push(
          request(app)
            .get('/api/contracts?limit=5')
            .set('Authorization', `Bearer ${authTokens[i % authTokens.length]}`)
        );
      }

      const responses = await Promise.allSettled(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const successful = responses.filter(r => r.status === 'fulfilled' && r.value.status === 200);
      const failed = responses.filter(r => r.status === 'rejected' || r.value.status !== 200);

      // Should handle high load with reasonable success rate
      expect(successful.length).toBeGreaterThan(highLoadRequests * 0.9); // 90% success rate
      expect(failed.length).toBeLessThan(highLoadRequests * 0.1); // Less than 10% failure
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
      console.log(`High load test: ${successful.length}/${highLoadRequests} successful in ${totalTime}ms`);
    });

    it('should handle database connection limits', async () => {
      // Simulate many concurrent database operations
      const dbOperations = 30;
      const startTime = Date.now();
      
      const operations = [];
      for (let i = 0; i < dbOperations; i++) {
        operations.push(
          request(app)
            .get('/api/users')
            .set('Authorization', `Bearer ${authTokens[i % authTokens.length]}`)
        );
      }

      const responses = await Promise.allSettled(operations);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const successful = responses.filter(r => r.status === 'fulfilled' && r.value.status === 200);
      
      expect(successful.length).toBe(dbOperations);
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
      console.log(`Database connection test: ${successful.length}/${dbOperations} successful in ${totalTime}ms`);
    });

    it('should handle memory pressure', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform memory-intensive operations
      const memoryIntensiveOperations = [];
      for (let i = 0; i < 20; i++) {
        memoryIntensiveOperations.push(
          request(app)
            .get('/api/contracts?limit=100')
            .set('Authorization', `Bearer ${authTokens[i % authTokens.length]}`)
        );
      }

      await Promise.all(memoryIntensiveOperations);
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory should not grow excessively
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase
      console.log(`Memory pressure test: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB increase`);
    });
  });

  describe('Scalability Testing', () => {
    it('should scale with data size', async () => {
      const dataSizes = [10, 50, 100, 200];
      const results = [];

      for (const size of dataSizes) {
        const startTime = Date.now();
        
        const response = await request(app)
          .get(`/api/contracts?limit=${size}`)
          .set('Authorization', `Bearer ${authTokens[0]}`)
          .expect(200);

        const endTime = Date.now();
        const queryTime = endTime - startTime;
        
        results.push({ size, time: queryTime });
        console.log(`Query time for ${size} records: ${queryTime}ms`);
      }

      // Performance should scale reasonably (not exponentially)
      for (let i = 1; i < results.length; i++) {
        const timeRatio = results[i].time / results[i-1].time;
        const sizeRatio = results[i].size / results[i-1].size;
        
        // Time increase should not be more than 2x the size increase
        expect(timeRatio).toBeLessThan(sizeRatio * 2);
      }
    });

    it('should handle concurrent users efficiently', async () => {
      const userCounts = [5, 10, 20, 30];
      const results = [];

      for (const userCount of userCounts) {
        const startTime = Date.now();
        
        const requests = [];
        for (let i = 0; i < userCount; i++) {
          requests.push(
            request(app)
              .get('/api/contracts?limit=10')
              .set('Authorization', `Bearer ${authTokens[i % authTokens.length]}`)
          );
        }

        const responses = await Promise.all(requests);
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        
        const successful = responses.filter(r => r.status === 200);
        results.push({ userCount, time: totalTime, successRate: successful.length / userCount });
        
        console.log(`${userCount} concurrent users: ${totalTime}ms, ${(successful.length / userCount * 100).toFixed(1)}% success rate`);
      }

      // Success rate should remain high
      results.forEach(result => {
        expect(result.successRate).toBeGreaterThan(0.95); // 95% success rate
      });
    });
  });
}); 