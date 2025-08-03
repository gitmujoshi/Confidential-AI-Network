/**
 * OCI Cloud Provider Service
 */

class OCIProvider {
  constructor() {
    this.providerName = 'oci';
  }

  async validateCredentials(credentials) {
    try {
      console.log('🔍 Validating OCI credentials...');
      
      const requiredFields = ['compartmentId', 'userId', 'fingerprint', 'privateKey'];
      for (const field of requiredFields) {
        if (!credentials[field]) {
          throw new Error(`Missing required OCI credential field: ${field}`);
        }
      }
      
      console.log('✅ OCI credentials validated successfully');
      return true;
    } catch (error) {
      console.error('❌ OCI credential validation failed:', error.message);
      throw error;
    }
  }

  async createTrainingEnvironment(config, credentials) {
    try {
      console.log('🚀 Creating OCI training environment...');
      
      const environment = {
        provider: 'oci',
        compartmentId: credentials.compartmentId,
        region: config.defaultLocation,
        instanceType: config.defaultVMSize,
        network: {
          vcnName: `vcn-${Date.now()}`,
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
      
      console.log('✅ OCI training environment created successfully');
      return environment;
    } catch (error) {
      console.error('❌ Failed to create OCI training environment:', error.message);
      throw error;
    }
  }

  async getRegions() {
    return [
      { name: 'US East (Ashburn)', value: 'us-ashburn-1' },
      { name: 'US West (Phoenix)', value: 'us-phoenix-1' },
      { name: 'Canada Southeast (Montreal)', value: 'ca-montreal-1' },
      { name: 'UK South (London)', value: 'uk-london-1' },
      { name: 'Germany Central (Frankfurt)', value: 'eu-frankfurt-1' }
    ];
  }

  async getInstanceTypes() {
    return [
      { name: 'VM.Standard1.1', value: 'VM.Standard1.1', cores: 1, memory: 7 },
      { name: 'VM.Standard1.2', value: 'VM.Standard1.2', cores: 2, memory: 14 },
      { name: 'VM.Standard1.4', value: 'VM.Standard1.4', cores: 4, memory: 28 },
      { name: 'VM.Standard1.8', value: 'VM.Standard1.8', cores: 8, memory: 56 },
      { name: 'VM.Standard1.16', value: 'VM.Standard1.16', cores: 16, memory: 112 }
    ];
  }

  async estimateCosts(config) {
    const baseCosts = {
      'VM.Standard1.1': 0.045,
      'VM.Standard1.2': 0.09,
      'VM.Standard1.4': 0.18,
      'VM.Standard1.8': 0.36,
      'VM.Standard1.16': 0.72
    };
    
    const instanceCost = baseCosts[config.defaultVMSize] || 0.09;
    const monthlyCost = instanceCost * 24 * 30;
    
    return {
      instanceCost: instanceCost,
      monthlyCost: monthlyCost,
      estimatedMonthlyTotal: monthlyCost + 50,
      currency: 'USD'
    };
  }
}

module.exports = OCIProvider; 