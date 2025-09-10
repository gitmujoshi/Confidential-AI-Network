/**
 * Dataset Security Attribute Constraints
 * 
 * This file defines all the constrained values for dataset security attributes
 * to ensure consistency and prevent invalid data entry.
 */

// Data Classification Levels
export const DATA_CLASSIFICATIONS = [
  {
    value: 'PUBLIC',
    label: 'Public',
    description: 'No restrictions, can be freely shared',
    color: '#4CAF50',
    icon: '🌐',
    requirements: {
      secureEnclave: false,
      attestation: false,
      encryption: 'optional',
      auditLevel: 'basic'
    }
  },
  {
    value: 'INTERNAL',
    label: 'Internal',
    description: 'Company internal use only',
    color: '#2196F3',
    icon: '🏢',
    requirements: {
      secureEnclave: false,
      attestation: false,
      encryption: 'recommended',
      auditLevel: 'standard'
    }
  },
  {
    value: 'CONFIDENTIAL',
    label: 'Confidential',
    description: 'Sensitive business information',
    color: '#FF9800',
    icon: '🔒',
    requirements: {
      secureEnclave: true,
      attestation: true,
      encryption: 'required',
      auditLevel: 'enhanced'
    }
  },
  {
    value: 'RESTRICTED',
    label: 'Restricted',
    description: 'Highly sensitive, limited access',
    color: '#F44336',
    icon: '🛡️',
    requirements: {
      secureEnclave: true,
      attestation: true,
      encryption: 'required',
      auditLevel: 'comprehensive'
    }
  },
  {
    value: 'TOP_SECRET',
    label: 'Top Secret',
    description: 'Highest security classification',
    color: '#9C27B0',
    icon: '🔐',
    requirements: {
      secureEnclave: true,
      attestation: true,
      encryption: 'required',
      auditLevel: 'maximum'
    }
  }
];

// Encryption Algorithms
export const ENCRYPTION_ALGORITHMS = [
  {
    value: 'AES-256-GCM',
    label: 'AES-256-GCM',
    description: 'Advanced Encryption Standard 256-bit Galois/Counter Mode',
    security: 'high',
    performance: 'excellent',
    recommended: true
  },
  {
    value: 'AES-256-CBC',
    label: 'AES-256-CBC',
    description: 'Advanced Encryption Standard 256-bit Cipher Block Chaining',
    security: 'high',
    performance: 'good',
    recommended: false
  },
  {
    value: 'ChaCha20-Poly1305',
    label: 'ChaCha20-Poly1305',
    description: 'ChaCha20 stream cipher with Poly1305 authenticator',
    security: 'high',
    performance: 'excellent',
    recommended: true
  },
  {
    value: 'AES-128-GCM',
    label: 'AES-128-GCM',
    description: 'Advanced Encryption Standard 128-bit Galois/Counter Mode',
    security: 'medium',
    performance: 'excellent',
    recommended: false
  },
  {
    value: 'RSA-4096',
    label: 'RSA-4096',
    description: 'Rivest-Shamir-Adleman 4096-bit key',
    security: 'high',
    performance: 'slow',
    recommended: false
  },
  {
    value: 'ECDSA-P256',
    label: 'ECDSA-P256',
    description: 'Elliptic Curve Digital Signature Algorithm P-256',
    security: 'high',
    performance: 'good',
    recommended: true
  }
];

// Data Residency Regions
export const DATA_RESIDENCY_REGIONS = [
  {
    value: 'US-East',
    label: 'US East',
    description: 'United States East Coast',
    country: 'US',
    compliance: ['SOX', 'HIPAA', 'PCI-DSS']
  },
  {
    value: 'US-West',
    label: 'US West',
    description: 'United States West Coast',
    country: 'US',
    compliance: ['SOX', 'HIPAA', 'PCI-DSS']
  },
  {
    value: 'US-Central',
    label: 'US Central',
    description: 'United States Central Region',
    country: 'US',
    compliance: ['SOX', 'HIPAA', 'PCI-DSS']
  },
  {
    value: 'EU-West',
    label: 'EU West',
    description: 'European Union West',
    country: 'EU',
    compliance: ['GDPR', 'ISO 27001']
  },
  {
    value: 'EU-East',
    label: 'EU East',
    description: 'European Union East',
    country: 'EU',
    compliance: ['GDPR', 'ISO 27001']
  },
  {
    value: 'Asia-Pacific',
    label: 'Asia Pacific',
    description: 'Asia Pacific Region',
    country: 'APAC',
    compliance: ['PDPA', 'PIPEDA']
  },
  {
    value: 'Canada',
    label: 'Canada',
    description: 'Canada',
    country: 'CA',
    compliance: ['PIPEDA', 'PIPEDA']
  },
  {
    value: 'Australia',
    label: 'Australia',
    description: 'Australia',
    country: 'AU',
    compliance: ['Privacy Act', 'ISO 27001']
  }
];

// Processing Locations
export const PROCESSING_LOCATIONS = [
  {
    value: 'US-East',
    label: 'US East',
    description: 'United States East Coast Processing',
    allowedFor: ['US-East', 'US-Central', 'US-West']
  },
  {
    value: 'US-West',
    label: 'US West',
    description: 'United States West Coast Processing',
    allowedFor: ['US-East', 'US-Central', 'US-West']
  },
  {
    value: 'US-Central',
    label: 'US Central',
    description: 'United States Central Processing',
    allowedFor: ['US-East', 'US-Central', 'US-West']
  },
  {
    value: 'EU-West',
    label: 'EU West',
    description: 'European Union West Processing',
    allowedFor: ['EU-West', 'EU-East']
  },
  {
    value: 'EU-East',
    label: 'EU East',
    description: 'European Union East Processing',
    allowedFor: ['EU-West', 'EU-East']
  },
  {
    value: 'Global',
    label: 'Global',
    description: 'Global Processing (All Regions)',
    allowedFor: ['US-East', 'US-West', 'US-Central', 'EU-West', 'EU-East', 'Asia-Pacific', 'Canada', 'Australia']
  }
];

// Privacy Techniques
export const PRIVACY_TECHNIQUES = [
  {
    value: 'Differential Privacy',
    label: 'Differential Privacy',
    description: 'Mathematical framework for privacy-preserving data analysis',
    category: 'mathematical',
    recommended: true
  },
  {
    value: 'Homomorphic Encryption',
    label: 'Homomorphic Encryption',
    description: 'Computation on encrypted data without decryption',
    category: 'cryptographic',
    recommended: true
  },
  {
    value: 'Secure Multi-Party Computation',
    label: 'Secure Multi-Party Computation',
    description: 'Joint computation without revealing individual inputs',
    category: 'cryptographic',
    recommended: true
  },
  {
    value: 'Data Anonymization',
    label: 'Data Anonymization',
    description: 'Removal or modification of identifying information',
    category: 'statistical',
    recommended: false
  },
  {
    value: 'Synthetic Data Generation',
    label: 'Synthetic Data Generation',
    description: 'Artificially generated data that preserves statistical properties',
    category: 'generative',
    recommended: true
  },
  {
    value: 'Federated Learning',
    label: 'Federated Learning',
    description: 'Distributed machine learning without centralizing data',
    category: 'distributed',
    recommended: true
  }
];

// Data Quality Metrics
export const QUALITY_METRICS = [
  {
    value: 'Accuracy',
    label: 'Accuracy',
    description: 'Correctness and precision of data values',
    category: 'completeness'
  },
  {
    value: 'Completeness',
    label: 'Completeness',
    description: 'Percentage of non-null values in dataset',
    category: 'completeness'
  },
  {
    value: 'Consistency',
    label: 'Consistency',
    description: 'Uniformity of data across different sources',
    category: 'consistency'
  },
  {
    value: 'Timeliness',
    label: 'Timeliness',
    description: 'How current and up-to-date the data is',
    category: 'temporal'
  },
  {
    value: 'Validity',
    label: 'Validity',
    description: 'Data conforms to defined business rules',
    category: 'business'
  },
  {
    value: 'Uniqueness',
    label: 'Uniqueness',
    description: 'Absence of duplicate records',
    category: 'integrity'
  }
];

// Compliance Requirements
export const COMPLIANCE_REQUIREMENTS = [
  {
    value: 'GDPR',
    label: 'GDPR',
    description: 'General Data Protection Regulation (EU)',
    region: 'EU',
    category: 'privacy'
  },
  {
    value: 'HIPAA',
    label: 'HIPAA',
    description: 'Health Insurance Portability and Accountability Act (US)',
    region: 'US',
    category: 'healthcare'
  },
  {
    value: 'SOX',
    label: 'SOX',
    description: 'Sarbanes-Oxley Act (US)',
    region: 'US',
    category: 'financial'
  },
  {
    value: 'PCI-DSS',
    label: 'PCI-DSS',
    description: 'Payment Card Industry Data Security Standard',
    region: 'Global',
    category: 'financial'
  },
  {
    value: 'PIPEDA',
    label: 'PIPEDA',
    description: 'Personal Information Protection and Electronic Documents Act (Canada)',
    region: 'CA',
    category: 'privacy'
  },
  {
    value: 'ISO 27001',
    label: 'ISO 27001',
    description: 'Information Security Management System',
    region: 'Global',
    category: 'security'
  }
];

// Dataset Categories
export const DATASET_CATEGORIES = [
  {
    value: 'Tabular',
    label: 'Tabular',
    description: 'Structured data in rows and columns',
    icon: '📊'
  },
  {
    value: 'Computer Vision',
    label: 'Computer Vision',
    description: 'Images, videos, and visual data',
    icon: '🖼️'
  },
  {
    value: 'Natural Language Processing',
    label: 'Natural Language Processing',
    description: 'Text, speech, and language data',
    icon: '📝'
  },
  {
    value: 'Multimodal',
    label: 'Multimodal',
    description: 'Combination of different data types',
    icon: '🔀'
  },
  {
    value: 'Time Series',
    label: 'Time Series',
    description: 'Data points indexed by time',
    icon: '📈'
  },
  {
    value: 'Graph',
    label: 'Graph',
    description: 'Network and relationship data',
    icon: '🕸️'
  }
];

// Helper function to get constraints by classification
export const getConstraintsByClassification = (classification) => {
  const config = DATA_CLASSIFICATIONS.find(c => c.value === classification);
  return config ? config.requirements : null;
};

// Helper function to validate processing location against data residency
export const validateProcessingLocation = (residencyRegion, processingLocation) => {
  const location = PROCESSING_LOCATIONS.find(l => l.value === processingLocation);
  return location ? location.allowedFor.includes(residencyRegion) : false;
};

// Helper function to get recommended values based on classification
export const getRecommendedValues = (classification) => {
  const constraints = getConstraintsByClassification(classification);
  if (!constraints) return {};

  return {
    secureEnclaveRequired: constraints.secureEnclave,
    attestationRequired: constraints.attestation,
    encryptionRequired: constraints.encryption === 'required',
    auditLevel: constraints.auditLevel
  };
};
