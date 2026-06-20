/**
 * Contract Attribute Constraints
 * 
 * This file defines all the constrained values for contract attributes
 * to ensure consistency and prevent invalid data entry.
 */

// Contract Status Values
export const CONTRACT_STATUSES = [
  {
    value: 'DRAFT',
    label: 'Draft',
    description: 'Contract created by TDC, can be edited',
    color: '#757575',
    icon: '📝',
    canEdit: true,
    canSign: false,
    nextStatus: ['PENDING_TDP', 'REJECTED']
  },
  {
    value: 'PENDING_TDP',
    label: 'Pending TDP Approval',
    description: 'Waiting for all TDPs to sign the contract',
    color: '#FF9800',
    icon: '⏳',
    canEdit: false,
    canSign: true,
    nextStatus: ['PENDING_TDC', 'REJECTED']
  },
  {
    value: 'PENDING_TDC',
    label: 'Pending TDC Signature',
    description: 'Waiting for TDC to sign the contract',
    color: '#2196F3',
    icon: '✍️',
    canEdit: false,
    canSign: true,
    nextStatus: ['PENDING_TSP', 'REJECTED']
  },
  {
    value: 'PENDING_TSP',
    label: 'Pending TSP Signature',
    description: 'Waiting for TSP to sign the contract',
    color: '#9C27B0',
    icon: '🏢',
    canEdit: false,
    canSign: true,
    nextStatus: ['SIGNED', 'REJECTED']
  },
  {
    value: 'SIGNED',
    label: 'Signed',
    description: 'All parties signed, ready for execution',
    color: '#4CAF50',
    icon: '✅',
    canEdit: false,
    canSign: false,
    nextStatus: ['EXECUTING', 'COMPLETED']
  },
  {
    value: 'EXECUTING',
    label: 'Executing',
    description: 'Contract is being executed',
    color: '#FF5722',
    icon: '⚙️',
    canEdit: false,
    canSign: false,
    nextStatus: ['COMPLETED', 'FAILED']
  },
  {
    value: 'COMPLETED',
    label: 'Completed',
    description: 'Contract fulfilled successfully',
    color: '#8BC34A',
    icon: '🎉',
    canEdit: false,
    canSign: false,
    nextStatus: []
  },
  {
    value: 'REJECTED',
    label: 'Rejected',
    description: 'Contract rejected by any party',
    color: '#F44336',
    icon: '❌',
    canEdit: false,
    canSign: false,
    nextStatus: []
  },
  {
    value: 'FAILED',
    label: 'Failed',
    description: 'Execution failed',
    color: '#795548',
    icon: '💥',
    canEdit: false,
    canSign: false,
    nextStatus: []
  }
];

// Contract Template Categories
export const CONTRACT_TEMPLATE_CATEGORIES = [
  {
    value: 'RESEARCH',
    label: 'Research',
    description: 'Academic and research use contracts',
    color: '#2196F3',
    icon: '🔬',
    duration: { min: 30, max: 365, default: 90 },
    pricing: { type: 'academic', multiplier: 0.5 }
  },
  {
    value: 'COMMERCIAL',
    label: 'Commercial',
    description: 'Business and commercial use contracts',
    color: '#4CAF50',
    icon: '💼',
    duration: { min: 7, max: 730, default: 180 },
    pricing: { type: 'standard', multiplier: 1.0 }
  },
  {
    value: 'ENTERPRISE',
    label: 'Enterprise',
    description: 'Large-scale enterprise use contracts',
    color: '#FF9800',
    icon: '🏢',
    duration: { min: 30, max: 1095, default: 365 },
    pricing: { type: 'premium', multiplier: 2.0 }
  },
  {
    value: 'CUSTOM',
    label: 'Custom',
    description: 'Customizable template contracts',
    color: '#9C27B0',
    icon: '⚙️',
    duration: { min: 1, max: 3650, default: 90 },
    pricing: { type: 'negotiable', multiplier: 1.5 }
  }
];

// Contract Types
export const CONTRACT_TYPES = [
  {
    value: 'AI_TRAINING',
    label: 'AI Training Contract',
    description: 'Contract for AI model training with datasets',
    icon: '🤖',
    requiresDatasets: true,
    requiresModels: true,
    requiresTSP: true
  },
  {
    value: 'DATA_ANALYTICS',
    label: 'Data Analytics Contract',
    description: 'Contract for data analysis and insights',
    icon: '📊',
    requiresDatasets: true,
    requiresModels: false,
    requiresTSP: true
  },
  {
    value: 'RESEARCH_COLLABORATION',
    label: 'Research Collaboration',
    description: 'Academic research collaboration contract',
    icon: '🔬',
    requiresDatasets: true,
    requiresModels: false,
    requiresTSP: false
  },
  {
    value: 'DATA_SHARING',
    label: 'Data Sharing Agreement',
    description: 'Simple data sharing between parties',
    icon: '📤',
    requiresDatasets: true,
    requiresModels: false,
    requiresTSP: false
  }
];

// Contract Duration Options (in days)
export const CONTRACT_DURATIONS = [
  { value: 7, label: '1 Week', description: 'Short-term contract' },
  { value: 30, label: '1 Month', description: 'Monthly contract' },
  { value: 90, label: '3 Months', description: 'Quarterly contract' },
  { value: 180, label: '6 Months', description: 'Semi-annual contract' },
  { value: 365, label: '1 Year', description: 'Annual contract' },
  { value: 730, label: '2 Years', description: 'Multi-year contract' },
  { value: 1095, label: '3 Years', description: 'Long-term contract' }
];

// Privacy Techniques for Contracts
export const CONTRACT_PRIVACY_TECHNIQUES = [
  {
    value: 'differential-privacy',
    label: 'Differential Privacy',
    description: 'Mathematical framework for privacy-preserving data analysis',
    category: 'mathematical',
    recommended: true,
    complexity: 'medium'
  },
  {
    value: 'federated-learning',
    label: 'Federated Learning',
    description: 'Distributed machine learning without centralizing data',
    category: 'distributed',
    recommended: true,
    complexity: 'high'
  },
  {
    value: 'homomorphic-encryption',
    label: 'Homomorphic Encryption',
    description: 'Computation on encrypted data without decryption',
    category: 'cryptographic',
    recommended: true,
    complexity: 'high'
  },
  {
    value: 'secure-multi-party-computation',
    label: 'Secure Multi-Party Computation',
    description: 'Joint computation without revealing individual inputs',
    category: 'cryptographic',
    recommended: true,
    complexity: 'high'
  },
  {
    value: 'zero-knowledge-proofs',
    label: 'Zero-Knowledge Proofs',
    description: 'Prove knowledge without revealing the knowledge itself',
    category: 'cryptographic',
    recommended: false,
    complexity: 'very-high'
  },
  {
    value: 'data-anonymization',
    label: 'Data Anonymization',
    description: 'Remove or modify identifying information',
    category: 'statistical',
    recommended: false,
    complexity: 'low'
  }
];

// Training Environment Types
export const TRAINING_ENVIRONMENT_TYPES = [
  {
    value: 'STANDARD',
    label: 'Standard Environment',
    description: 'Basic training environment with standard security',
    icon: '🖥️',
    security: 'basic',
    cost: 'low'
  },
  {
    value: 'CONFIDENTIAL',
    label: 'Confidential Computing',
    description: 'Secure enclave environment for sensitive data',
    icon: '🔒',
    security: 'high',
    cost: 'high'
  },
  {
    value: 'FEDERATED',
    label: 'Federated Learning',
    description: 'Distributed training across multiple locations',
    icon: '🌐',
    security: 'medium',
    cost: 'medium'
  },
  {
    value: 'EDGE',
    label: 'Edge Computing',
    description: 'Training on edge devices for real-time processing',
    icon: '📱',
    security: 'medium',
    cost: 'medium'
  }
];

// KMS (Key Management Service) Providers
export const KMS_PROVIDERS = [
  {
    value: 'AZURE_KEYVAULT',
    label: 'Azure Key Vault',
    description: 'Microsoft Azure key management service',
    icon: '🔵',
    cloud: 'Azure',
    features: ['HSM', 'RBAC', 'Audit']
  },
  {
    value: 'AWS_KMS',
    label: 'AWS KMS',
    description: 'Amazon Web Services key management service',
    icon: '🟠',
    cloud: 'AWS',
    features: ['HSM', 'RBAC', 'Audit']
  },
  {
    value: 'GCP_KMS',
    label: 'Google Cloud KMS',
    description: 'Google Cloud Platform key management service',
    icon: '🔴',
    cloud: 'GCP',
    features: ['HSM', 'RBAC', 'Audit']
  },
  {
    value: 'HASHICORP_VAULT',
    label: 'HashiCorp Vault',
    description: 'Open-source secrets management',
    icon: '🟣',
    cloud: 'Multi',
    features: ['HSM', 'RBAC', 'Audit', 'Open Source']
  },
  {
    value: 'OCI_VAULT',
    label: 'Oracle Cloud Vault',
    description: 'Oracle Cloud Infrastructure key management',
    icon: '🔴',
    cloud: 'OCI',
    features: ['HSM', 'RBAC', 'Audit']
  }
];

// Contract Pricing Models
export const PRICING_MODELS = [
  {
    value: 'FIXED',
    label: 'Fixed Price',
    description: 'One-time payment for the entire contract',
    icon: '💰',
    billing: 'one-time'
  },
  {
    value: 'PER_DATASET',
    label: 'Per Dataset',
    description: 'Price based on number of datasets used',
    icon: '📊',
    billing: 'per-item'
  },
  {
    value: 'PER_DURATION',
    label: 'Per Duration',
    description: 'Price based on contract duration',
    icon: '⏰',
    billing: 'per-time'
  },
  {
    value: 'USAGE_BASED',
    label: 'Usage Based',
    description: 'Price based on actual usage and compute time',
    icon: '⚡',
    billing: 'per-usage'
  },
  {
    value: 'TIERED',
    label: 'Tiered Pricing',
    description: 'Different pricing tiers based on data volume',
    icon: '📈',
    billing: 'tiered'
  }
];

// Contract Validation Rules
export const CONTRACT_VALIDATION_RULES = {
  minDuration: 1,
  maxDuration: 3650,
  minPrice: 0.01,
  maxPrice: 1000000,
  requiredFields: ['title', 'description', 'duration', 'price', 'termsAndConditions'],
  optionalFields: ['templateId', 'environmentSpecs', 'trainingParams', 'kmsConfigs']
};

// Helper function to get contract status info
export const getContractStatusInfo = (status) => {
  return CONTRACT_STATUSES.find(s => s.value === status) || null;
};

// Helper function to validate contract duration
export const validateContractDuration = (duration, templateCategory) => {
  const template = CONTRACT_TEMPLATE_CATEGORIES.find(t => t.value === templateCategory);
  if (!template) return true;
  
  return duration >= template.duration.min && duration <= template.duration.max;
};

// Helper function to get next possible statuses
export const getNextPossibleStatuses = (currentStatus) => {
  const status = getContractStatusInfo(currentStatus);
  return status ? status.nextStatus : [];
};

// Helper function to check if contract can be edited
export const canEditContract = (status) => {
  const statusInfo = getContractStatusInfo(status);
  return statusInfo ? statusInfo.canEdit : false;
};

// Helper function to check if contract can be signed
export const canSignContract = (status) => {
  const statusInfo = getContractStatusInfo(status);
  return statusInfo ? statusInfo.canSign : false;
};
