#!/usr/bin/env node

/**
 * Create Secure Datasets with Enhanced Security Attributes
 * 
 * This script creates datasets with the new security and compliance fields
 * to demonstrate secure enclave support and data classification.
 */

const db = require('../models');
const crypto = require('crypto');
const DEPAIdService = require('../services/depaIdService');

// Secure datasets with different security classifications
const secureDatasets = [
  // PUBLIC datasets
  {
    name: "Open Source Weather Data",
    description: "Public weather data collected from various meteorological stations worldwide. Suitable for climate research and public applications.",
    category: "Tabular",
    size: 500000000, // 500MB
    recordCount: 1000000,
    price: 0.00,
    license: "MIT",
    tags: ["weather", "climate", "public", "open-source"],
    dataClassification: "PUBLIC",
    secureEnclaveRequired: false,
    attestationRequired: false,
    encryptionAlgorithm: "AES-256-GCM",
    encryptionAtRest: true,
    encryptionInTransit: true,
    dataResidencyRegion: "US-East",
    processingLocation: "Global",
    crossBorderTransferAllowed: true,
    attestationPolicy: {},
    accessControlPolicy: { "public": true },
    retentionPolicy: { "retentionPeriod": "7 years", "autoDelete": false },
    auditConfiguration: { "logLevel": "INFO", "retentionDays": 90 }
  },
  
  // INTERNAL datasets
  {
    name: "Internal Customer Analytics Dataset",
    description: "Customer behavior analytics data for internal business intelligence and product development.",
    category: "Tabular",
    size: 2000000000, // 2GB
    recordCount: 5000000,
    price: 5000.00,
    license: "Internal Use Only",
    tags: ["analytics", "customer", "internal", "business-intelligence"],
    dataClassification: "INTERNAL",
    secureEnclaveRequired: false,
    attestationRequired: false,
    encryptionAlgorithm: "AES-256-GCM",
    encryptionAtRest: true,
    encryptionInTransit: true,
    dataResidencyRegion: "US-East",
    processingLocation: "US-East, US-West",
    crossBorderTransferAllowed: false,
    attestationPolicy: {},
    accessControlPolicy: { "roles": ["TDP", "TDC"], "contractRequired": true },
    retentionPolicy: { "retentionPeriod": "5 years", "autoDelete": true },
    auditConfiguration: { "logLevel": "DEBUG", "retentionDays": 365 }
  },

  // CONFIDENTIAL datasets
  {
    name: "Financial Transaction Dataset",
    description: "Anonymized financial transaction data for fraud detection and risk assessment model training.",
    category: "Tabular",
    size: 5000000000, // 5GB
    recordCount: 10000000,
    price: 25000.00,
    license: "Confidential - Financial Services Only",
    tags: ["financial", "transactions", "fraud-detection", "risk-assessment"],
    dataClassification: "CONFIDENTIAL",
    secureEnclaveRequired: true,
    attestationRequired: true,
    encryptionAlgorithm: "AES-256-GCM",
    encryptionAtRest: true,
    encryptionInTransit: true,
    dataResidencyRegion: "US-East",
    processingLocation: "US-East",
    crossBorderTransferAllowed: false,
    attestationPolicy: {
      "hardwareAttestation": true,
      "trustedExecutionEnvironment": true,
      "secureBoot": true,
      "memoryEncryption": true
    },
    accessControlPolicy: {
      "roles": ["TDP", "TDC", "CCRP"],
      "contractRequired": true,
      "multiFactorAuth": true,
      "sessionTimeout": 1800
    },
    retentionPolicy: {
      "retentionPeriod": "7 years",
      "autoDelete": true,
      "secureDeletion": true
    },
    auditConfiguration: {
      "logLevel": "DEBUG",
      "retentionDays": 2555, // 7 years
      "realTimeAlerts": true,
      "anomalyDetection": true
    }
  },

  // RESTRICTED datasets
  {
    name: "HIPAA-Compliant Medical Records Dataset",
    description: "De-identified patient medical records for AI model training in healthcare applications. Requires HIPAA compliance and secure processing.",
    category: "Tabular",
    size: 10000000000, // 10GB
    recordCount: 2000000,
    price: 50000.00,
    license: "Restricted - Healthcare Research Only",
    tags: ["healthcare", "medical-records", "HIPAA", "PHI", "research"],
    dataClassification: "RESTRICTED",
    secureEnclaveRequired: true,
    attestationRequired: true,
    encryptionAlgorithm: "AES-256-GCM",
    encryptionAtRest: true,
    encryptionInTransit: true,
    dataResidencyRegion: "US-East",
    processingLocation: "US-East",
    crossBorderTransferAllowed: false,
    attestationPolicy: {
      "hardwareAttestation": true,
      "trustedExecutionEnvironment": true,
      "secureBoot": true,
      "memoryEncryption": true,
      "attestationService": "Azure Attestation",
      "minimumTEEVersion": "2.0"
    },
    accessControlPolicy: {
      "roles": ["TDP", "TDC", "CCRP"],
      "contractRequired": true,
      "multiFactorAuth": true,
      "sessionTimeout": 900, // 15 minutes
      "ipWhitelist": true,
      "timeRestricted": true
    },
    retentionPolicy: {
      "retentionPeriod": "10 years",
      "autoDelete": true,
      "secureDeletion": true,
      "complianceReporting": true
    },
    auditConfiguration: {
      "logLevel": "DEBUG",
      "retentionDays": 3650, // 10 years
      "realTimeAlerts": true,
      "anomalyDetection": true,
      "complianceMonitoring": true,
      "breachNotification": true
    }
  },

  // TOP_SECRET datasets
  {
    name: "Classified Intelligence Dataset",
    description: "Highly classified intelligence data for national security AI model training. Requires highest level security clearance and processing.",
    category: "Multimodal",
    size: 50000000000, // 50GB
    recordCount: 1000000,
    price: 100000.00,
    license: "Top Secret - Government Use Only",
    tags: ["intelligence", "classified", "national-security", "top-secret"],
    dataClassification: "TOP_SECRET",
    secureEnclaveRequired: true,
    attestationRequired: true,
    encryptionAlgorithm: "AES-256-GCM",
    encryptionAtRest: true,
    encryptionInTransit: true,
    dataResidencyRegion: "US-East",
    processingLocation: "US-East",
    crossBorderTransferAllowed: false,
    attestationPolicy: {
      "hardwareAttestation": true,
      "trustedExecutionEnvironment": true,
      "secureBoot": true,
      "memoryEncryption": true,
      "attestationService": "Azure Attestation",
      "minimumTEEVersion": "3.0",
      "governmentApproved": true,
      "airGapped": true
    },
    accessControlPolicy: {
      "roles": ["TDP", "TDC", "CCRP"],
      "contractRequired": true,
      "multiFactorAuth": true,
      "sessionTimeout": 300, // 5 minutes
      "ipWhitelist": true,
      "timeRestricted": true,
      "securityClearance": "TOP_SECRET",
      "backgroundCheck": true
    },
    retentionPolicy: {
      "retentionPeriod": "25 years",
      "autoDelete": false,
      "secureDeletion": true,
      "complianceReporting": true,
      "governmentOversight": true
    },
    auditConfiguration: {
      "logLevel": "DEBUG",
      "retentionDays": 9125, // 25 years
      "realTimeAlerts": true,
      "anomalyDetection": true,
      "complianceMonitoring": true,
      "breachNotification": true,
      "governmentAudit": true,
      "continuousMonitoring": true
    }
  }
];

async function findTDPUser() {
  try {
    const tdp = await db.User.findOne({
      where: { partyType: 'TDP' },
      order: [['createdAt', 'ASC']]
    });
    
    if (!tdp) {
      console.log('❌ No TDP users found. Please create a TDP user first.');
      return null;
    }
    
    console.log(`✅ Found TDP user: ${tdp.name} (${tdp.email})`);
    return tdp;
  } catch (error) {
    console.error('❌ Error finding TDP user:', error.message);
    return null;
  }
}

async function createSecureDataset(datasetInfo, ownerId) {
  try {
    const datasetId = `DATASET-${Date.now()}-${crypto.randomUUID()}`;
    const depaIdService = new DEPAIdService();
    
    // Check if dataset already exists
    const existingDataset = await db.Dataset.findOne({
      where: { name: datasetInfo.name }
    });
    
    if (existingDataset) {
      console.log(`⚠️  Dataset already exists: ${datasetInfo.name}`);
      return existingDataset;
    }
    
    const dataset = await db.Dataset.create({
      datasetId,
      ownerId,
      name: datasetInfo.name,
      description: datasetInfo.description,
      category: datasetInfo.category,
      size: datasetInfo.size,
      recordCount: datasetInfo.recordCount,
      price: datasetInfo.price,
      license: datasetInfo.license,
      tags: datasetInfo.tags,
      isActive: true,
      isPublic: datasetInfo.dataClassification === 'PUBLIC',
      confidentialComputingRequired: datasetInfo.secureEnclaveRequired,
      depaId: depaIdService.generateDEPAId('DATASET'),
      
      // New security fields (using camelCase as they exist in DB)
      dataClassification: datasetInfo.dataClassification,
      secureEnclaveRequired: datasetInfo.secureEnclaveRequired,
      attestationRequired: datasetInfo.attestationRequired,
      encryptionAlgorithm: datasetInfo.encryptionAlgorithm,
      encryptionAtRest: datasetInfo.encryptionAtRest,
      encryptionInTransit: datasetInfo.encryptionInTransit,
      dataResidencyRegion: datasetInfo.dataResidencyRegion,
      processingLocation: datasetInfo.processingLocation,
      crossBorderTransferAllowed: datasetInfo.crossBorderTransferAllowed,
      attestationPolicy: datasetInfo.attestationPolicy,
      accessControlPolicy: datasetInfo.accessControlPolicy,
      retentionPolicy: datasetInfo.retentionPolicy,
      auditConfiguration: datasetInfo.auditConfiguration
    });
    
    console.log(`✅ Created secure dataset: ${datasetInfo.name}`);
    console.log(`   🔒 Classification: ${datasetInfo.dataClassification}`);
    console.log(`   🛡️  Secure Enclave: ${datasetInfo.secureEnclaveRequired ? 'Required' : 'Not Required'}`);
    console.log(`   🔐 Attestation: ${datasetInfo.attestationRequired ? 'Required' : 'Not Required'}`);
    console.log(`   🌍 Data Residency: ${datasetInfo.dataResidencyRegion}`);
    console.log(`   💰 Price: $${datasetInfo.price.toLocaleString()}`);
    console.log(`   📊 Records: ${datasetInfo.recordCount.toLocaleString()}`);
    console.log(`   💾 Size: ${(datasetInfo.size / (1024 * 1024 * 1024)).toFixed(1)}GB`);
    console.log('');
    
    return dataset;
  } catch (error) {
    console.error(`❌ Failed to create dataset ${datasetInfo.name}:`, error.message);
    return null;
  }
}

async function createSecureDatasets() {
  try {
    console.log('🚀 Creating Secure Datasets with Enhanced Security Attributes...\n');
    console.log('🔒 Demonstrating secure enclave support and data classification\n');
    
    // Find TDP user
    const tdp = await findTDPUser();
    if (!tdp) {
      return;
    }
    
    let successCount = 0;
    let totalCount = secureDatasets.length;
    
    console.log('📊 Creating datasets with different security classifications...\n');
    
    for (const datasetInfo of secureDatasets) {
      const result = await createSecureDataset(datasetInfo, tdp.id);
      if (result) successCount++;
    }
    
    console.log('🎉 Secure dataset creation completed!\n');
    console.log('📋 Summary:');
    console.log(`   ✅ Successfully created: ${successCount}/${totalCount} datasets`);
    console.log(`   🔒 Security levels: PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED, TOP_SECRET`);
    console.log(`   🛡️  Secure enclave support: Enabled for sensitive datasets`);
    console.log(`   🔐 Attestation policies: Configured for high-security datasets`);
    console.log(`   🌍 Data residency: Controlled geographic processing`);
    console.log(`   📊 Audit logging: Comprehensive monitoring enabled`);
    
    console.log('\n🔗 Access the datasets through:');
    console.log('   Frontend: http://localhost:3000/datasets');
    console.log('   Backend API: http://localhost:5001/api/datasets');
    
  } catch (error) {
    console.error('❌ Error creating secure datasets:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
createSecureDatasets();
