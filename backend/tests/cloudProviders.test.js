const AzureProvider = require('../services/providers/azureProvider');
const AWSProvider = require('../services/providers/awsProvider');
const GCPProvider = require('../services/providers/gcpProvider');
const OCIProvider = require('../services/providers/ociProvider');

describe('Cloud Provider Services', () => {
  describe('AzureProvider', () => {
    let azureProvider;

    beforeEach(() => {
      azureProvider = new AzureProvider();
    });

    describe('validateCredentials', () => {
      test('should validate Azure credentials successfully', async () => {
        const credentials = {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          subscriptionId: 'test-subscription-id',
          tenantId: 'test-tenant-id'
        };

        const result = await azureProvider.validateCredentials(credentials);
        expect(result).toBeDefined();
        expect(result.valid).toBeDefined();
        expect(typeof result.valid).toBe('boolean');
      });

      test('should handle invalid credentials', async () => {
        const credentials = {
          clientId: 'invalid-id',
          clientSecret: 'invalid-secret',
          subscriptionId: 'invalid-subscription',
          tenantId: 'invalid-tenant'
        };

        const result = await azureProvider.validateCredentials(credentials);
        expect(result).toBeDefined();
        expect(result.valid).toBe(false);
      });
    });

    describe('getRegions', () => {
      test('should return Azure regions', async () => {
        const regions = await azureProvider.getRegions();
        expect(Array.isArray(regions)).toBe(true);
        expect(regions.length).toBeGreaterThan(0);
        expect(regions[0]).toHaveProperty('name');
        expect(regions[0]).toHaveProperty('displayName');
      });
    });

    describe('getVMSizes', () => {
      test('should return Azure VM sizes', async () => {
        const vmSizes = await azureProvider.getVMSizes();
        expect(Array.isArray(vmSizes)).toBe(true);
        expect(vmSizes.length).toBeGreaterThan(0);
        expect(vmSizes[0]).toHaveProperty('name');
        expect(vmSizes[0]).toHaveProperty('numberOfCores');
        expect(vmSizes[0]).toHaveProperty('memoryInMB');
      });
    });

    describe('getStorageSkus', () => {
      test('should return Azure storage SKUs', async () => {
        const storageSkus = await azureProvider.getStorageSkus();
        expect(Array.isArray(storageSkus)).toBe(true);
        expect(storageSkus.length).toBeGreaterThan(0);
        expect(storageSkus[0]).toHaveProperty('name');
        expect(storageSkus[0]).toHaveProperty('tier');
      });
    });

    describe('getDatabaseSkus', () => {
      test('should return Azure database SKUs', async () => {
        const databaseSkus = await azureProvider.getDatabaseSkus();
        expect(Array.isArray(databaseSkus)).toBe(true);
        expect(databaseSkus.length).toBeGreaterThan(0);
        expect(databaseSkus[0]).toHaveProperty('name');
        expect(databaseSkus[0]).toHaveProperty('tier');
      });
    });

    describe('estimateCosts', () => {
      test('should estimate Azure costs', async () => {
        const requirements = {
          vmSize: 'Standard_D2s_v3',
          storageSku: 'Standard_LRS',
          databaseSku: 'Basic',
          region: 'eastus',
          duration: 30 // days
        };

        const costEstimate = await azureProvider.estimateCosts(requirements);
        expect(costEstimate).toBeDefined();
        expect(costEstimate).toHaveProperty('totalCost');
        expect(costEstimate).toHaveProperty('breakdown');
        expect(typeof costEstimate.totalCost).toBe('number');
      });
    });

    describe('createTrainingEnvironment', () => {
      test('should create Azure training environment', async () => {
        const config = {
          location: 'eastus',
          vmSize: 'Standard_D2s_v3',
          storageSku: 'Standard_LRS',
          databaseSku: 'Basic',
          resourceGroupPrefix: 'training'
        };

        const environment = await azureProvider.createTrainingEnvironment(config);
        expect(environment).toBeDefined();
        expect(environment).toHaveProperty('id');
        expect(environment).toHaveProperty('status');
        expect(environment).toHaveProperty('resources');
      });
    });
  });

  describe('AWSProvider', () => {
    let awsProvider;

    beforeEach(() => {
      awsProvider = new AWSProvider();
    });

    describe('validateCredentials', () => {
      test('should validate AWS credentials successfully', async () => {
        const credentials = {
          accessKeyId: 'test-access-key',
          secretAccessKey: 'test-secret-key',
          region: 'us-east-1'
        };

        const result = await awsProvider.validateCredentials(credentials);
        expect(result).toBeDefined();
        expect(result.valid).toBeDefined();
        expect(typeof result.valid).toBe('boolean');
      });

      test('should handle invalid credentials', async () => {
        const credentials = {
          accessKeyId: 'invalid-key',
          secretAccessKey: 'invalid-secret',
          region: 'us-east-1'
        };

        const result = await awsProvider.validateCredentials(credentials);
        expect(result).toBeDefined();
        expect(result.valid).toBe(false);
      });
    });

    describe('getRegions', () => {
      test('should return AWS regions', async () => {
        const regions = await awsProvider.getRegions();
        expect(Array.isArray(regions)).toBe(true);
        expect(regions.length).toBeGreaterThan(0);
        expect(regions[0]).toHaveProperty('name');
        expect(regions[0]).toHaveProperty('displayName');
      });
    });

    describe('getInstanceTypes', () => {
      test('should return AWS instance types', async () => {
        const instanceTypes = await awsProvider.getInstanceTypes();
        expect(Array.isArray(instanceTypes)).toBe(true);
        expect(instanceTypes.length).toBeGreaterThan(0);
        expect(instanceTypes[0]).toHaveProperty('name');
        expect(instanceTypes[0]).toHaveProperty('vcpu');
        expect(instanceTypes[0]).toHaveProperty('memory');
      });
    });

    describe('getStorageTypes', () => {
      test('should return AWS storage types', async () => {
        const storageTypes = await awsProvider.getStorageTypes();
        expect(Array.isArray(storageTypes)).toBe(true);
        expect(storageTypes.length).toBeGreaterThan(0);
        expect(storageTypes[0]).toHaveProperty('name');
        expect(storageTypes[0]).toHaveProperty('type');
      });
    });

    describe('getDatabaseTypes', () => {
      test('should return AWS database types', async () => {
        const databaseTypes = await awsProvider.getDatabaseTypes();
        expect(Array.isArray(databaseTypes)).toBe(true);
        expect(databaseTypes.length).toBeGreaterThan(0);
        expect(databaseTypes[0]).toHaveProperty('name');
        expect(databaseTypes[0]).toHaveProperty('engine');
      });
    });

    describe('estimateCosts', () => {
      test('should estimate AWS costs', async () => {
        const requirements = {
          instanceType: 't3.medium',
          storageType: 'gp2',
          databaseType: 'rds',
          region: 'us-east-1',
          duration: 30 // days
        };

        const costEstimate = await awsProvider.estimateCosts(requirements);
        expect(costEstimate).toBeDefined();
        expect(costEstimate).toHaveProperty('totalCost');
        expect(costEstimate).toHaveProperty('breakdown');
        expect(typeof costEstimate.totalCost).toBe('number');
      });
    });

    describe('createTrainingEnvironment', () => {
      test('should create AWS training environment', async () => {
        const config = {
          region: 'us-east-1',
          instanceType: 't3.medium',
          storageType: 'gp2',
          databaseType: 'rds'
        };

        const environment = await awsProvider.createTrainingEnvironment(config);
        expect(environment).toBeDefined();
        expect(environment).toHaveProperty('id');
        expect(environment).toHaveProperty('status');
        expect(environment).toHaveProperty('resources');
      });
    });
  });

  describe('GCPProvider', () => {
    let gcpProvider;

    beforeEach(() => {
      gcpProvider = new GCPProvider();
    });

    describe('validateCredentials', () => {
      test('should validate GCP credentials successfully', async () => {
        const credentials = {
          projectId: 'test-project-id',
          serviceAccountKey: 'test-service-account-key'
        };

        const result = await gcpProvider.validateCredentials(credentials);
        expect(result).toBeDefined();
        expect(result.valid).toBeDefined();
        expect(typeof result.valid).toBe('boolean');
      });

      test('should handle invalid credentials', async () => {
        const credentials = {
          projectId: 'invalid-project',
          serviceAccountKey: 'invalid-key'
        };

        const result = await gcpProvider.validateCredentials(credentials);
        expect(result).toBeDefined();
        expect(result.valid).toBe(false);
      });
    });

    describe('getRegions', () => {
      test('should return GCP regions', async () => {
        const regions = await gcpProvider.getRegions();
        expect(Array.isArray(regions)).toBe(true);
        expect(regions.length).toBeGreaterThan(0);
        expect(regions[0]).toHaveProperty('name');
        expect(regions[0]).toHaveProperty('displayName');
      });
    });

    describe('getInstanceTypes', () => {
      test('should return GCP instance types', async () => {
        const instanceTypes = await gcpProvider.getInstanceTypes();
        expect(Array.isArray(instanceTypes)).toBe(true);
        expect(instanceTypes.length).toBeGreaterThan(0);
        expect(instanceTypes[0]).toHaveProperty('name');
        expect(instanceTypes[0]).toHaveProperty('vcpu');
        expect(instanceTypes[0]).toHaveProperty('memory');
      });
    });

    describe('estimateCosts', () => {
      test('should estimate GCP costs', async () => {
        const requirements = {
          instanceType: 'n1-standard-2',
          region: 'us-central1',
          duration: 30 // days
        };

        const costEstimate = await gcpProvider.estimateCosts(requirements);
        expect(costEstimate).toBeDefined();
        expect(costEstimate).toHaveProperty('totalCost');
        expect(costEstimate).toHaveProperty('breakdown');
        expect(typeof costEstimate.totalCost).toBe('number');
      });
    });

    describe('createTrainingEnvironment', () => {
      test('should create GCP training environment', async () => {
        const config = {
          region: 'us-central1',
          instanceType: 'n1-standard-2',
          projectId: 'test-project'
        };

        const environment = await gcpProvider.createTrainingEnvironment(config);
        expect(environment).toBeDefined();
        expect(environment).toHaveProperty('id');
        expect(environment).toHaveProperty('status');
        expect(environment).toHaveProperty('resources');
      });
    });
  });

  describe('OCIProvider', () => {
    let ociProvider;

    beforeEach(() => {
      ociProvider = new OCIProvider();
    });

    describe('validateCredentials', () => {
      test('should validate OCI credentials successfully', async () => {
        const credentials = {
          compartmentId: 'test-compartment-id',
          userId: 'test-user-id',
          fingerprint: 'test-fingerprint',
          privateKey: 'test-private-key'
        };

        const result = await ociProvider.validateCredentials(credentials);
        expect(result).toBeDefined();
        expect(result.valid).toBeDefined();
        expect(typeof result.valid).toBe('boolean');
      });

      test('should handle invalid credentials', async () => {
        const credentials = {
          compartmentId: 'invalid-compartment',
          userId: 'invalid-user',
          fingerprint: 'invalid-fingerprint',
          privateKey: 'invalid-key'
        };

        const result = await ociProvider.validateCredentials(credentials);
        expect(result).toBeDefined();
        expect(result.valid).toBe(false);
      });
    });

    describe('getRegions', () => {
      test('should return OCI regions', async () => {
        const regions = await ociProvider.getRegions();
        expect(Array.isArray(regions)).toBe(true);
        expect(regions.length).toBeGreaterThan(0);
        expect(regions[0]).toHaveProperty('name');
        expect(regions[0]).toHaveProperty('displayName');
      });
    });

    describe('getInstanceTypes', () => {
      test('should return OCI instance types', async () => {
        const instanceTypes = await ociProvider.getInstanceTypes();
        expect(Array.isArray(instanceTypes)).toBe(true);
        expect(instanceTypes.length).toBeGreaterThan(0);
        expect(instanceTypes[0]).toHaveProperty('name');
        expect(instanceTypes[0]).toHaveProperty('vcpu');
        expect(instanceTypes[0]).toHaveProperty('memory');
      });
    });

    describe('estimateCosts', () => {
      test('should estimate OCI costs', async () => {
        const requirements = {
          instanceType: 'VM.Standard2.1',
          region: 'us-ashburn-1',
          duration: 30 // days
        };

        const costEstimate = await ociProvider.estimateCosts(requirements);
        expect(costEstimate).toBeDefined();
        expect(costEstimate).toHaveProperty('totalCost');
        expect(costEstimate).toHaveProperty('breakdown');
        expect(typeof costEstimate.totalCost).toBe('number');
      });
    });

    describe('createTrainingEnvironment', () => {
      test('should create OCI training environment', async () => {
        const config = {
          region: 'us-ashburn-1',
          instanceType: 'VM.Standard2.1',
          compartmentId: 'test-compartment'
        };

        const environment = await ociProvider.createTrainingEnvironment(config);
        expect(environment).toBeDefined();
        expect(environment).toHaveProperty('id');
        expect(environment).toHaveProperty('status');
        expect(environment).toHaveProperty('resources');
      });
    });
  });
}); 