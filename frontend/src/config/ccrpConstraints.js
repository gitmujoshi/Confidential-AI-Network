/**
 * CCRP (Confidential Clean Room Provider) Attribute Constraints
 * 
 * This file defines all the constrained values for CCRP attributes
 * to ensure consistency and prevent invalid data entry.
 */

// Cloud Providers
export const CLOUD_PROVIDERS = [
  {
    value: 'AZURE',
    label: 'Microsoft Azure',
    description: 'Microsoft Azure cloud platform',
    icon: '🔵',
    regions: ['eastus', 'westus2', 'westeurope', 'eastasia'],
    features: ['Confidential Computing', 'Key Vault', 'Monitor', 'Security Center'],
    compliance: ['SOC2', 'ISO27001', 'HIPAA', 'GDPR']
  },
  {
    value: 'AWS',
    label: 'Amazon Web Services',
    description: 'Amazon Web Services cloud platform',
    icon: '🟠',
    regions: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'],
    features: ['Confidential Computing', 'KMS', 'CloudWatch', 'Security Hub'],
    compliance: ['SOC2', 'ISO27001', 'HIPAA', 'GDPR']
  },
  {
    value: 'GCP',
    label: 'Google Cloud Platform',
    description: 'Google Cloud Platform',
    icon: '🔴',
    regions: ['us-central1', 'us-east1', 'europe-west1', 'asia-southeast1'],
    features: ['Confidential Computing', 'Cloud KMS', 'Monitoring', 'Security Command Center'],
    compliance: ['SOC2', 'ISO27001', 'HIPAA', 'GDPR']
  },
  {
    value: 'OCI',
    label: 'Oracle Cloud Infrastructure',
    description: 'Oracle Cloud Infrastructure',
    icon: '🔴',
    regions: ['us-ashburn-1', 'us-phoenix-1', 'eu-frankfurt-1', 'ap-sydney-1'],
    features: ['Confidential Computing', 'Vault', 'Monitoring', 'Security Zones'],
    compliance: ['SOC2', 'ISO27001', 'HIPAA', 'GDPR']
  }
];

// Secret Management Systems
export const SECRET_MANAGERS = [
  {
    value: 'VAULT',
    label: 'HashiCorp Vault',
    description: 'Open-source secrets management',
    icon: '🟣',
    type: 'open-source',
    features: ['HSM', 'RBAC', 'Audit', 'Dynamic Secrets']
  },
  {
    value: 'AWS_SECRETS',
    label: 'AWS Secrets Manager',
    description: 'AWS native secrets management',
    icon: '🟠',
    type: 'cloud-native',
    features: ['Automatic Rotation', 'RBAC', 'Audit', 'Integration']
  },
  {
    value: 'AZURE_KEYVAULT',
    label: 'Azure Key Vault',
    description: 'Microsoft Azure key management',
    icon: '🔵',
    type: 'cloud-native',
    features: ['HSM', 'RBAC', 'Audit', 'Integration']
  },
  {
    value: 'GCP_SECRETS',
    label: 'Google Secret Manager',
    description: 'Google Cloud secret management',
    icon: '🔴',
    type: 'cloud-native',
    features: ['Automatic Rotation', 'RBAC', 'Audit', 'Integration']
  },
  {
    value: 'OCI_VAULT',
    label: 'Oracle Cloud Vault',
    description: 'Oracle Cloud key management',
    icon: '🔴',
    type: 'cloud-native',
    features: ['HSM', 'RBAC', 'Audit', 'Integration']
  }
];

// Authentication Methods
export const AUTH_METHODS = [
  {
    value: 'SERVICE_PRINCIPAL',
    label: 'Service Principal',
    description: 'Application-based authentication with client ID and secret',
    icon: '🔑',
    security: 'high',
    complexity: 'medium'
  },
  {
    value: 'MANAGED_IDENTITY',
    label: 'Managed Identity',
    description: 'Azure-managed identity for automatic authentication',
    icon: '🆔',
    security: 'very-high',
    complexity: 'low'
  },
  {
    value: 'IAM_ROLE',
    label: 'IAM Role',
    description: 'AWS IAM role-based authentication',
    icon: '👤',
    security: 'high',
    complexity: 'medium'
  },
  {
    value: 'API_KEY',
    label: 'API Key',
    description: 'Simple API key authentication',
    icon: '🗝️',
    security: 'medium',
    complexity: 'low'
  }
];

// VM Sizes by Cloud Provider
export const CLOUD_VM_SIZES = {
  // Azure VM Sizes
  AZURE: [
    {
      value: 'Standard_B1s',
      label: 'Standard_B1s',
      description: '1 vCPU, 1 GB RAM - Burstable performance',
      vcpus: 1,
      memory: 1,
      category: 'burstable',
      cost: 'low'
    },
    {
      value: 'Standard_B2s',
      label: 'Standard_B2s',
      description: '2 vCPUs, 4 GB RAM - Burstable performance',
      vcpus: 2,
      memory: 4,
      category: 'burstable',
      cost: 'low'
    },
    {
      value: 'Standard_D2s_v3',
      label: 'Standard_D2s_v3',
      description: '2 vCPUs, 8 GB RAM - General purpose',
      vcpus: 2,
      memory: 8,
      category: 'general-purpose',
      cost: 'medium'
    },
    {
      value: 'Standard_D4s_v3',
      label: 'Standard_D4s_v3',
      description: '4 vCPUs, 16 GB RAM - General purpose',
      vcpus: 4,
      memory: 16,
      category: 'general-purpose',
      cost: 'medium'
    },
    {
      value: 'Standard_D8s_v3',
      label: 'Standard_D8s_v3',
      description: '8 vCPUs, 32 GB RAM - General purpose',
      vcpus: 8,
      memory: 32,
      category: 'general-purpose',
      cost: 'high'
    },
    {
      value: 'Standard_D16s_v3',
      label: 'Standard_D16s_v3',
      description: '16 vCPUs, 64 GB RAM - General purpose',
      vcpus: 16,
      memory: 64,
      category: 'general-purpose',
      cost: 'very-high'
    },
    {
      value: 'Standard_NC6s_v3',
      label: 'Standard_NC6s_v3',
      description: '6 vCPUs, 112 GB RAM - GPU optimized',
      vcpus: 6,
      memory: 112,
      category: 'gpu-optimized',
      cost: 'very-high'
    },
    {
      value: 'Standard_NC12s_v3',
      label: 'Standard_NC12s_v3',
      description: '12 vCPUs, 224 GB RAM - GPU optimized',
      vcpus: 12,
      memory: 224,
      category: 'gpu-optimized',
      cost: 'very-high'
    }
  ],

  // AWS EC2 Instance Types
  AWS: [
    {
      value: 't3.micro',
      label: 't3.micro',
      description: '1 vCPU, 1 GB RAM - Burstable performance',
      vcpus: 1,
      memory: 1,
      category: 'burstable',
      cost: 'low'
    },
    {
      value: 't3.small',
      label: 't3.small',
      description: '2 vCPUs, 2 GB RAM - Burstable performance',
      vcpus: 2,
      memory: 2,
      category: 'burstable',
      cost: 'low'
    },
    {
      value: 't3.medium',
      label: 't3.medium',
      description: '2 vCPUs, 4 GB RAM - Burstable performance',
      vcpus: 2,
      memory: 4,
      category: 'burstable',
      cost: 'low'
    },
    {
      value: 'm5.large',
      label: 'm5.large',
      description: '2 vCPUs, 8 GB RAM - General purpose',
      vcpus: 2,
      memory: 8,
      category: 'general-purpose',
      cost: 'medium'
    },
    {
      value: 'm5.xlarge',
      label: 'm5.xlarge',
      description: '4 vCPUs, 16 GB RAM - General purpose',
      vcpus: 4,
      memory: 16,
      category: 'general-purpose',
      cost: 'medium'
    },
    {
      value: 'm5.2xlarge',
      label: 'm5.2xlarge',
      description: '8 vCPUs, 32 GB RAM - General purpose',
      vcpus: 8,
      memory: 32,
      category: 'general-purpose',
      cost: 'high'
    },
    {
      value: 'm5.4xlarge',
      label: 'm5.4xlarge',
      description: '16 vCPUs, 64 GB RAM - General purpose',
      vcpus: 16,
      memory: 64,
      category: 'general-purpose',
      cost: 'very-high'
    },
    {
      value: 'c5.large',
      label: 'c5.large',
      description: '2 vCPUs, 4 GB RAM - Compute optimized',
      vcpus: 2,
      memory: 4,
      category: 'compute-optimized',
      cost: 'medium'
    },
    {
      value: 'c5.xlarge',
      label: 'c5.xlarge',
      description: '4 vCPUs, 8 GB RAM - Compute optimized',
      vcpus: 4,
      memory: 8,
      category: 'compute-optimized',
      cost: 'high'
    },
    {
      value: 'p3.2xlarge',
      label: 'p3.2xlarge',
      description: '8 vCPUs, 61 GB RAM - GPU optimized',
      vcpus: 8,
      memory: 61,
      category: 'gpu-optimized',
      cost: 'very-high'
    },
    {
      value: 'p3.8xlarge',
      label: 'p3.8xlarge',
      description: '32 vCPUs, 244 GB RAM - GPU optimized',
      vcpus: 32,
      memory: 244,
      category: 'gpu-optimized',
      cost: 'very-high'
    }
  ],

  // Google Cloud Platform Machine Types
  GCP: [
    {
      value: 'e2-micro',
      label: 'e2-micro',
      description: '1 vCPU, 1 GB RAM - Burstable performance',
      vcpus: 1,
      memory: 1,
      category: 'burstable',
      cost: 'low'
    },
    {
      value: 'e2-small',
      label: 'e2-small',
      description: '2 vCPUs, 2 GB RAM - Burstable performance',
      vcpus: 2,
      memory: 2,
      category: 'burstable',
      cost: 'low'
    },
    {
      value: 'e2-medium',
      label: 'e2-medium',
      description: '2 vCPUs, 4 GB RAM - Burstable performance',
      vcpus: 2,
      memory: 4,
      category: 'burstable',
      cost: 'low'
    },
    {
      value: 'n1-standard-1',
      label: 'n1-standard-1',
      description: '1 vCPU, 3.75 GB RAM - General purpose',
      vcpus: 1,
      memory: 3.75,
      category: 'general-purpose',
      cost: 'low'
    },
    {
      value: 'n1-standard-2',
      label: 'n1-standard-2',
      description: '2 vCPUs, 7.5 GB RAM - General purpose',
      vcpus: 2,
      memory: 7.5,
      category: 'general-purpose',
      cost: 'medium'
    },
    {
      value: 'n1-standard-4',
      label: 'n1-standard-4',
      description: '4 vCPUs, 15 GB RAM - General purpose',
      vcpus: 4,
      memory: 15,
      category: 'general-purpose',
      cost: 'medium'
    },
    {
      value: 'n1-standard-8',
      label: 'n1-standard-8',
      description: '8 vCPUs, 30 GB RAM - General purpose',
      vcpus: 8,
      memory: 30,
      category: 'general-purpose',
      cost: 'high'
    },
    {
      value: 'n1-standard-16',
      label: 'n1-standard-16',
      description: '16 vCPUs, 60 GB RAM - General purpose',
      vcpus: 16,
      memory: 60,
      category: 'general-purpose',
      cost: 'very-high'
    },
    {
      value: 'n1-highmem-2',
      label: 'n1-highmem-2',
      description: '2 vCPUs, 13 GB RAM - Memory optimized',
      vcpus: 2,
      memory: 13,
      category: 'memory-optimized',
      cost: 'medium'
    },
    {
      value: 'n1-highmem-4',
      label: 'n1-highmem-4',
      description: '4 vCPUs, 26 GB RAM - Memory optimized',
      vcpus: 4,
      memory: 26,
      category: 'memory-optimized',
      cost: 'high'
    },
    {
      value: 'n1-highcpu-4',
      label: 'n1-highcpu-4',
      description: '4 vCPUs, 3.6 GB RAM - Compute optimized',
      vcpus: 4,
      memory: 3.6,
      category: 'compute-optimized',
      cost: 'medium'
    },
    {
      value: 'n1-highcpu-8',
      label: 'n1-highcpu-8',
      description: '8 vCPUs, 7.2 GB RAM - Compute optimized',
      vcpus: 8,
      memory: 7.2,
      category: 'compute-optimized',
      cost: 'high'
    }
  ],

  // Oracle Cloud Infrastructure Shapes
  OCI: [
    {
      value: 'VM.Standard.E2.1.Micro',
      label: 'VM.Standard.E2.1.Micro',
      description: '1 vCPU, 1 GB RAM - Burstable performance',
      vcpus: 1,
      memory: 1,
      category: 'burstable',
      cost: 'low'
    },
    {
      value: 'VM.Standard.E2.1',
      label: 'VM.Standard.E2.1',
      description: '1 vCPU, 8 GB RAM - General purpose',
      vcpus: 1,
      memory: 8,
      category: 'general-purpose',
      cost: 'low'
    },
    {
      value: 'VM.Standard.E2.2',
      label: 'VM.Standard.E2.2',
      description: '2 vCPUs, 16 GB RAM - General purpose',
      vcpus: 2,
      memory: 16,
      category: 'general-purpose',
      cost: 'medium'
    },
    {
      value: 'VM.Standard.E2.4',
      label: 'VM.Standard.E2.4',
      description: '4 vCPUs, 32 GB RAM - General purpose',
      vcpus: 4,
      memory: 32,
      category: 'general-purpose',
      cost: 'medium'
    },
    {
      value: 'VM.Standard.E2.8',
      label: 'VM.Standard.E2.8',
      description: '8 vCPUs, 64 GB RAM - General purpose',
      vcpus: 8,
      memory: 64,
      category: 'general-purpose',
      cost: 'high'
    },
    {
      value: 'VM.Standard.E2.16',
      label: 'VM.Standard.E2.16',
      description: '16 vCPUs, 128 GB RAM - General purpose',
      vcpus: 16,
      memory: 128,
      category: 'general-purpose',
      cost: 'very-high'
    },
    {
      value: 'VM.Standard.E3.Flex',
      label: 'VM.Standard.E3.Flex',
      description: 'Flexible vCPU and memory - General purpose',
      vcpus: 'flexible',
      memory: 'flexible',
      category: 'general-purpose',
      cost: 'variable'
    },
    {
      value: 'VM.Standard.E4.Flex',
      label: 'VM.Standard.E4.Flex',
      description: 'Flexible vCPU and memory - High performance',
      vcpus: 'flexible',
      memory: 'flexible',
      category: 'high-performance',
      cost: 'variable'
    },
    {
      value: 'BM.Standard.E2.64',
      label: 'BM.Standard.E2.64',
      description: '64 vCPUs, 512 GB RAM - Bare metal',
      vcpus: 64,
      memory: 512,
      category: 'bare-metal',
      cost: 'very-high'
    },
    {
      value: 'BM.GPU2.2',
      label: 'BM.GPU2.2',
      description: '2 vCPUs, 30 GB RAM - GPU optimized',
      vcpus: 2,
      memory: 30,
      category: 'gpu-optimized',
      cost: 'very-high'
    },
    {
      value: 'BM.GPU3.8',
      label: 'BM.GPU3.8',
      description: '8 vCPUs, 120 GB RAM - GPU optimized',
      vcpus: 8,
      memory: 120,
      category: 'gpu-optimized',
      cost: 'very-high'
    }
  ]
};

// Legacy export for backward compatibility
export const AZURE_VM_SIZES = CLOUD_VM_SIZES.AZURE;

// Storage SKUs (Azure)
export const AZURE_STORAGE_SKUS = [
  {
    value: 'Standard_LRS',
    label: 'Standard LRS',
    description: 'Locally redundant storage - 3 copies in same region',
    redundancy: 'LRS',
    performance: 'standard',
    cost: 'low'
  },
  {
    value: 'Standard_GRS',
    label: 'Standard GRS',
    description: 'Geo-redundant storage - 6 copies across regions',
    redundancy: 'GRS',
    performance: 'standard',
    cost: 'medium'
  },
  {
    value: 'Standard_RAGRS',
    label: 'Standard RAGRS',
    description: 'Read-access geo-redundant storage',
    redundancy: 'RAGRS',
    performance: 'standard',
    cost: 'medium'
  },
  {
    value: 'Premium_LRS',
    label: 'Premium LRS',
    description: 'Premium locally redundant storage with SSD',
    redundancy: 'LRS',
    performance: 'premium',
    cost: 'high'
  }
];

// Database SKUs (Azure)
export const AZURE_DATABASE_SKUS = [
  {
    value: 'Basic',
    label: 'Basic',
    description: 'Basic tier - 5 DTUs, 2 GB storage',
    tier: 'Basic',
    dtus: 5,
    storage: 2,
    cost: 'low'
  },
  {
    value: 'S0',
    label: 'Standard S0',
    description: 'Standard tier - 10 DTUs, 250 GB storage',
    tier: 'Standard',
    dtus: 10,
    storage: 250,
    cost: 'medium'
  },
  {
    value: 'S1',
    label: 'Standard S1',
    description: 'Standard tier - 20 DTUs, 250 GB storage',
    tier: 'Standard',
    dtus: 20,
    storage: 250,
    cost: 'medium'
  },
  {
    value: 'P1',
    label: 'Premium P1',
    description: 'Premium tier - 125 DTUs, 500 GB storage',
    tier: 'Premium',
    dtus: 125,
    storage: 500,
    cost: 'high'
  }
];

// Validation Status
export const VALIDATION_STATUSES = [
  {
    value: 'PENDING',
    label: 'Pending',
    description: 'Validation not yet started',
    color: '#FF9800',
    icon: '⏳'
  },
  {
    value: 'VALID',
    label: 'Valid',
    description: 'Credentials are valid and working',
    color: '#4CAF50',
    icon: '✅'
  },
  {
    value: 'INVALID',
    label: 'Invalid',
    description: 'Credentials are invalid or expired',
    color: '#F44336',
    icon: '❌'
  },
  {
    value: 'EXPIRED',
    label: 'Expired',
    description: 'Credentials have expired',
    color: '#795548',
    icon: '⏰'
  }
];

// Network Address Spaces
export const NETWORK_ADDRESS_SPACES = [
  {
    value: '10.0.0.0/16',
    label: '10.0.0.0/16',
    description: 'Class A private network (65,536 addresses)',
    size: 'large',
    subnets: 256
  },
  {
    value: '172.16.0.0/12',
    label: '172.16.0.0/12',
    description: 'Class B private network (1,048,576 addresses)',
    size: 'very-large',
    subnets: 4096
  },
  {
    value: '192.168.0.0/16',
    label: '192.168.0.0/16',
    description: 'Class C private network (65,536 addresses)',
    size: 'large',
    subnets: 256
  }
];

// Subnet Prefixes
export const SUBNET_PREFIXES = [
  {
    value: '10.0.1.0/24',
    label: '10.0.1.0/24',
    description: 'Private subnet (254 addresses)',
    type: 'private',
    addresses: 254
  },
  {
    value: '10.0.2.0/24',
    label: '10.0.2.0/24',
    description: 'Public subnet (254 addresses)',
    type: 'public',
    addresses: 254
  },
  {
    value: '10.0.3.0/24',
    label: '10.0.3.0/24',
    description: 'Database subnet (254 addresses)',
    type: 'database',
    addresses: 254
  }
];

// Compliance Standards
export const COMPLIANCE_STANDARDS = [
  {
    value: 'SOC2',
    label: 'SOC 2',
    description: 'Service Organization Control 2',
    category: 'security',
    scope: 'global'
  },
  {
    value: 'ISO27001',
    label: 'ISO 27001',
    description: 'Information Security Management System',
    category: 'security',
    scope: 'global'
  },
  {
    value: 'HIPAA',
    label: 'HIPAA',
    description: 'Health Insurance Portability and Accountability Act',
    category: 'healthcare',
    scope: 'us'
  },
  {
    value: 'GDPR',
    label: 'GDPR',
    description: 'General Data Protection Regulation',
    category: 'privacy',
    scope: 'eu'
  },
  {
    value: 'PCI_DSS',
    label: 'PCI DSS',
    description: 'Payment Card Industry Data Security Standard',
    category: 'financial',
    scope: 'global'
  }
];

// Helper function to get cloud provider info
export const getCloudProviderInfo = (provider) => {
  return CLOUD_PROVIDERS.find(p => p.value === provider) || null;
};

// Helper function to get VM size info by cloud provider
export const getVMSizeInfo = (size, cloudProvider = 'AZURE') => {
  const providerSizes = CLOUD_VM_SIZES[cloudProvider] || CLOUD_VM_SIZES.AZURE;
  return providerSizes.find(s => s.value === size) || null;
};

// Helper function to get VM sizes by cloud provider
export const getVMSizesByProvider = (cloudProvider) => {
  return CLOUD_VM_SIZES[cloudProvider] || CLOUD_VM_SIZES.AZURE;
};

// Helper function to get VM sizes by category
export const getVMSizesByCategory = (category, cloudProvider = 'AZURE') => {
  const providerSizes = CLOUD_VM_SIZES[cloudProvider] || CLOUD_VM_SIZES.AZURE;
  return providerSizes.filter(s => s.category === category);
};

// Helper function to validate network configuration
export const validateNetworkConfig = (addressSpace, privateSubnet, publicSubnet) => {
  // Basic validation - in real implementation, would check if subnets are within address space
  return addressSpace && privateSubnet && publicSubnet;
};

// Helper function to get recommended VM size based on workload and cloud provider
export const getRecommendedVMSize = (workloadType, cloudProvider = 'AZURE') => {
  const recommendations = {
    AZURE: {
      'light': 'Standard_D2s_v3',
      'medium': 'Standard_D4s_v3',
      'heavy': 'Standard_D8s_v3',
      'gpu': 'Standard_NC6s_v3',
      'gpu-heavy': 'Standard_NC12s_v3'
    },
    AWS: {
      'light': 'm5.large',
      'medium': 'm5.xlarge',
      'heavy': 'm5.2xlarge',
      'gpu': 'p3.2xlarge',
      'gpu-heavy': 'p3.8xlarge'
    },
    GCP: {
      'light': 'n1-standard-2',
      'medium': 'n1-standard-4',
      'heavy': 'n1-standard-8',
      'gpu': 'n1-standard-4', // GCP GPU instances are separate
      'gpu-heavy': 'n1-standard-8'
    },
    OCI: {
      'light': 'VM.Standard.E2.2',
      'medium': 'VM.Standard.E2.4',
      'heavy': 'VM.Standard.E2.8',
      'gpu': 'BM.GPU2.2',
      'gpu-heavy': 'BM.GPU3.8'
    }
  };
  
  const providerRecommendations = recommendations[cloudProvider] || recommendations.AZURE;
  return providerRecommendations[workloadType] || providerRecommendations['light'];
};

// Helper function to get compliance requirements by region
export const getComplianceByRegion = (region) => {
  const regionCompliance = {
    'us': ['SOC2', 'ISO27001', 'HIPAA', 'PCI_DSS'],
    'eu': ['SOC2', 'ISO27001', 'GDPR', 'PCI_DSS'],
    'global': ['SOC2', 'ISO27001', 'PCI_DSS']
  };
  
  if (region.startsWith('us-')) return regionCompliance.us;
  if (region.startsWith('eu-')) return regionCompliance.eu;
  return regionCompliance.global;
};

// Helper function to get VM categories by cloud provider
export const getVMCategoriesByProvider = (cloudProvider) => {
  const providerSizes = CLOUD_VM_SIZES[cloudProvider] || CLOUD_VM_SIZES.AZURE;
  const categories = [...new Set(providerSizes.map(s => s.category))];
  return categories.map(category => ({
    value: category,
    label: category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: getCategoryDescription(category)
  }));
};

// Helper function to get category description
const getCategoryDescription = (category) => {
  const descriptions = {
    'burstable': 'Cost-effective instances with burstable CPU performance',
    'general-purpose': 'Balanced compute, memory, and networking resources',
    'compute-optimized': 'High-performance processors for compute-intensive workloads',
    'memory-optimized': 'High memory-to-CPU ratio for memory-intensive applications',
    'gpu-optimized': 'GPU instances for machine learning and graphics workloads',
    'high-performance': 'High-performance instances with advanced features',
    'bare-metal': 'Dedicated physical servers for maximum performance'
  };
  return descriptions[category] || 'Specialized instance type';
};

// Helper function to filter VM sizes by cost range
export const getVMSizesByCost = (costRange, cloudProvider = 'AZURE') => {
  const providerSizes = CLOUD_VM_SIZES[cloudProvider] || CLOUD_VM_SIZES.AZURE;
  return providerSizes.filter(s => s.cost === costRange);
};

// Helper function to get VM size comparison across providers
export const compareVMSizesAcrossProviders = (vcpus, memory) => {
  const results = {};
  
  Object.keys(CLOUD_VM_SIZES).forEach(provider => {
    const sizes = CLOUD_VM_SIZES[provider];
    const matching = sizes.filter(s => 
      s.vcpus === vcpus && s.memory === memory
    );
    results[provider] = matching;
  });
  
  return results;
};
