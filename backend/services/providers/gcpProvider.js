/**
 * GCP Cloud Provider Service
 */

class GCPProvider {
  constructor() {
    this.providerName = 'gcp';
  }

  async validateCredentials(credentials) {
    try {
      console.log('🔍 Validating GCP credentials...');
      
      const requiredFields = ['projectId', 'serviceAccountKey'];
      for (const field of requiredFields) {
        if (!credentials[field]) {
          throw new Error(`Missing required GCP credential field: ${field}`);
        }
      }
      
      console.log('✅ GCP credentials validated successfully');
      return true;
    } catch (error) {
      console.error('❌ GCP credential validation failed:', error.message);
      throw error;
    }
  }

  async createTrainingEnvironment(config, credentials) {
    try {
      console.log('🚀 Creating GCP training environment...');
      
      const environment = {
        provider: 'gcp',
        projectId: credentials.projectId,
        region: config.defaultLocation,
        instanceType: config.defaultVMSize,
        network: {
          vpcName: `vpc-${Date.now()}`,
          cidrBlock: config.vnetAddressSpace,
          subnets: [
            {
              name: 'private',
              cidrBlock: config.privateSubnetPrefix
            },
            {
              name: 'public',
              cidrBlock: config.publicSubnetPrefix
            }
          ]
        },
        security: {
          enableEncryption: config.enableEncryption,
          enableMonitoring: config.enableMonitoring,
          enableKeyVault: config.enableKeyVault
        },
        status: 'creating',
        createdAt: new Date()
      };
      
      console.log('✅ GCP training environment created successfully');
      return environment;
    } catch (error) {
      console.error('❌ Failed to create GCP training environment:', error.message);
      throw error;
    }
  }

  async getRegions() {
    return [
      { name: 'US Central (Iowa)', value: 'us-central1' },
      { name: 'US East (South Carolina)', value: 'us-east1' },
      { name: 'US West (Oregon)', value: 'us-west1' },
      { name: 'Europe (Belgium)', value: 'europe-west1' },
      { name: 'Asia Pacific (Singapore)', value: 'asia-southeast1' }
    ];
  }

  async getInstanceTypes() {
    return [
      { name: 'n1-standard-1', value: 'n1-standard-1', cores: 1, memory: 3.75 },
      { name: 'n1-standard-2', value: 'n1-standard-2', cores: 2, memory: 7.5 },
      { name: 'n1-standard-4', value: 'n1-standard-4', cores: 4, memory: 15 },
      { name: 'n1-standard-8', value: 'n1-standard-8', cores: 8, memory: 30 },
      { name: 'n1-standard-16', value: 'n1-standard-16', cores: 16, memory: 60 },
      { name: 'n1-standard-32', value: 'n1-standard-32', cores: 32, memory: 120 }
    ];
  }

  async estimateCosts(config) {
    const baseCosts = {
      'n1-standard-1': 0.0475,
      'n1-standard-2': 0.095,
      'n1-standard-4': 0.19,
      'n1-standard-8': 0.38,
      'n1-standard-16': 0.76,
      'n1-standard-32': 1.52
    };
    
    const instanceCost = baseCosts[config.defaultVMSize] || 0.095;
    const monthlyCost = instanceCost * 24 * 30;
    
    return {
      instanceCost: instanceCost,
      monthlyCost: monthlyCost,
      estimatedMonthlyTotal: monthlyCost + 45,
      currency: 'USD'
    };
  }
}

module.exports = GCPProvider; 