#!/usr/bin/env node

/**
 * Create Compliance-Required Datasets (Final Working Version)
 * 
 * Creates datasets for healthcare, financial, retirement planning, and drug discovery
 * that require confidential computing environments. Uses proper integer sizes.
 */

const db = require('../models');
const crypto = require('crypto');

// Convert GB to bytes but keep within INTEGER range (max ~2.1 billion)
const GB_TO_BYTES = 1000000000; // 1GB = 1 billion bytes
const MAX_SIZE_GB = 2; // Keep under 2GB to avoid integer overflow

// Healthcare Datasets with proper sizes
const healthcareDatasets = [
  {
    name: "HIPAA-Compliant Electronic Health Records",
    description: "Comprehensive EHR dataset containing patient demographics, medical history, diagnoses, treatments, and outcomes. Requires HIPAA compliance and confidential computing for PHI protection. Structured medical data with clinical notes and treatment histories.",
    category: "Tabular",
    size: Math.floor(1.5 * GB_TO_BYTES), // 1.5GB
    recordCount: 1500000,
    price: 15000.00,
    tags: JSON.stringify(["healthcare", "EHR", "PHI", "HIPAA", "patient-data", "medical-records", "compliance", "confidential-computing"]),
    license: "Restricted - Healthcare Research Only",
    confidentialComputingRequired: true
  },
  {
    name: "Medical Imaging Dataset - Radiology Scans (DICOM)",
    description: "High-resolution medical imaging dataset including X-rays, CT scans, MRIs, and ultrasounds with associated diagnostic reports. Contains PHI requiring confidential computing environment for medical AI model training.",
    category: "Computer Vision",
    size: Math.floor(2.0 * GB_TO_BYTES), // 2GB
    recordCount: 850000,
    price: 25000.00,
    tags: JSON.stringify(["medical-imaging", "radiology", "DICOM", "PHI", "diagnostic-imaging", "healthcare", "confidential-computing"]),
    license: "Restricted - Medical Research Only",
    confidentialComputingRequired: true
  },
  {
    name: "Clinical Trial Data - Pharmaceutical Research",
    description: "Multi-phase clinical trial dataset including patient outcomes, adverse events, efficacy measurements, and safety profiles for drug development research. FDA-compliant structured data for regulatory AI models.",
    category: "Tabular",
    size: Math.floor(1.2 * GB_TO_BYTES), // 1.2GB
    recordCount: 45000,
    price: 35000.00,
    tags: JSON.stringify(["clinical-trials", "pharmaceutical", "FDA", "GCP", "drug-development", "regulatory", "confidential-computing"]),
    license: "Restricted - Pharmaceutical Research Only",
    confidentialComputingRequired: true
  }
];

// Financial Datasets with proper sizes
const financialDatasets = [
  {
    name: "Banking Transaction Records - Anti-Money Laundering",
    description: "Comprehensive banking transaction dataset for AML compliance, fraud detection, and risk assessment. Contains sensitive financial PII requiring confidential computing for privacy-preserving financial crime detection models.",
    category: "Tabular",
    size: Math.floor(1.8 * GB_TO_BYTES), // 1.8GB
    recordCount: 25000000,
    price: 45000.00,
    tags: JSON.stringify(["banking", "AML", "fraud-detection", "PCI", "SOX", "financial-crimes", "regulatory", "confidential-computing"]),
    license: "Restricted - Financial Institution Use Only",
    confidentialComputingRequired: true
  },
  {
    name: "Credit Risk Assessment - Consumer Credit Profiles",
    description: "Consumer credit profiles including credit scores, payment history, debt-to-income ratios, and default predictions for credit risk modeling. Requires confidential computing for fair lending AI compliance.",
    category: "Tabular",
    size: Math.floor(1.6 * GB_TO_BYTES), // 1.6GB
    recordCount: 12000000,
    price: 32000.00,
    tags: JSON.stringify(["credit-risk", "FCRA", "consumer-finance", "lending", "credit-scoring", "financial", "confidential-computing"]),
    license: "Restricted - Licensed Financial Institutions Only",
    confidentialComputingRequired: true
  },
  {
    name: "Investment Portfolio Analytics - Institutional Trading",
    description: "Institutional investment portfolio data including trading patterns, risk metrics, performance attribution, and market exposure analysis. Multimodal dataset combining numerical data with market sentiment for SEC-compliant AI models.",
    category: "Multimodal",
    size: Math.floor(1.9 * GB_TO_BYTES), // 1.9GB
    recordCount: 8500000,
    price: 55000.00,
    tags: JSON.stringify(["investment-management", "portfolio-analytics", "SEC", "institutional-trading", "market-data", "confidential-computing"]),
    license: "Restricted - Registered Investment Advisers Only",
    confidentialComputingRequired: true
  }
];

// Retirement Planning Datasets with proper sizes
const retirementDatasets = [
  {
    name: "401k and Pension Fund Analytics",
    description: "Comprehensive retirement planning dataset including 401k contributions, pension fund performance, demographic factors, and retirement outcome predictions. Requires confidential computing for ERISA fiduciary compliance.",
    category: "Tabular",
    size: Math.floor(1.4 * GB_TO_BYTES), // 1.4GB
    recordCount: 5500000,
    price: 28000.00,
    tags: JSON.stringify(["retirement-planning", "401k", "ERISA", "pension-funds", "fiduciary", "financial", "confidential-computing"]),
    license: "Restricted - ERISA Fiduciaries Only",
    confidentialComputingRequired: true
  },
  {
    name: "Social Security and Medicare Planning Dataset",
    description: "Social Security benefits optimization and Medicare planning dataset including earnings history, benefit projections, and healthcare cost modeling for government benefits AI optimization requiring confidential computing.",
    category: "Tabular",
    size: Math.floor(1.1 * GB_TO_BYTES), // 1.1GB
    recordCount: 3200000,
    price: 18000.00,
    tags: JSON.stringify(["social-security", "medicare", "government-benefits", "retirement-income", "healthcare", "confidential-computing"]),
    license: "Restricted - Authorized Government Contractors Only",
    confidentialComputingRequired: true
  }
];

// Drug Discovery Datasets with proper sizes
const drugDiscoveryDatasets = [
  {
    name: "Pharmaceutical Compound Library - Molecular Structures",
    description: "Extensive pharmaceutical compound library with molecular structures, bioactivity data, ADMET properties, and toxicity profiles for drug discovery research. Multimodal dataset combining molecular images and tabular properties requiring confidential computing for IP protection.",
    category: "Multimodal",
    size: Math.floor(2.0 * GB_TO_BYTES), // 2GB
    recordCount: 2800000,
    price: 75000.00,
    tags: JSON.stringify(["drug-discovery", "pharmaceutical", "molecular-structures", "FDA", "GLP", "chemistry", "confidential-computing"]),
    license: "Restricted - Pharmaceutical Companies Only",
    confidentialComputingRequired: true
  },
  {
    name: "Clinical Biomarkers - Genomic and Proteomic Data",
    description: "Clinical biomarker dataset including genomic sequences, proteomic profiles, metabolomics data, and disease associations for personalized medicine research. Highly sensitive genetic information requiring confidential computing for GINA compliance.",
    category: "Tabular",
    size: Math.floor(2.0 * GB_TO_BYTES), // 2GB (reduced from 45GB)
    recordCount: 850000,
    price: 85000.00,
    tags: JSON.stringify(["genomics", "biomarkers", "personalized-medicine", "GINA", "precision-medicine", "genetics", "confidential-computing"]),
    license: "Restricted - Authorized Research Institutions Only",
    confidentialComputingRequired: true
  },
  {
    name: "Drug Safety and Pharmacovigilance Database",
    description: "Comprehensive adverse drug reaction database including post-market surveillance data, drug interactions, and safety signal detection for pharmacovigilance. Natural language processing on safety reports requiring confidential computing for regulatory compliance.",
    category: "Natural Language Processing",
    size: Math.floor(1.7 * GB_TO_BYTES), // 1.7GB
    recordCount: 15000000,
    price: 65000.00,
    tags: JSON.stringify(["pharmacovigilance", "drug-safety", "adverse-events", "FDA", "regulatory", "NLP", "confidential-computing"]),
    license: "Restricted - Pharmaceutical Companies and Regulators Only",
    confidentialComputingRequired: true
  }
];

// TDP mapping based on specialization
const TDP_SPECIALIZATIONS = {
  healthcare: ['tdp.airesearch@example.com', 'tdp.biotech@example.com'],
  financial: ['tdp.financial@example.com'],
  retirement: ['tdp.financial@example.com'],
  pharma: ['tdp.biotech@example.com', 'tdp.airesearch@example.com']
};

async function findTDPUser(email) {
  try {
    const user = await db.User.findOne({ where: { email, partyType: 'TDP' } });
    return user;
  } catch (error) {
    console.error(`❌ Failed to find TDP ${email}:`, error.message);
    return null;
  }
}

async function createDataset(datasetInfo, ownerId, ownerEmail) {
  try {
    const datasetId = `DATASET-${crypto.randomUUID()}`;
    
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
      tags: datasetInfo.tags,
      license: datasetInfo.license,
      isActive: true,
      isPublic: true, // Make them browsable
      confidentialComputingRequired: datasetInfo.confidentialComputingRequired,
      depaId: `DATASET-${crypto.randomUUID()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log(`✅ Created dataset: ${datasetInfo.name}`);
    console.log(`   👤 TDP: ${ownerEmail}`);
    console.log(`   📊 Category: ${datasetInfo.category}`);
    console.log(`   💰 Price: $${datasetInfo.price.toLocaleString()}`);
    console.log(`   📈 Records: ${datasetInfo.recordCount.toLocaleString()}`);
    console.log(`   💾 Size: ${(datasetInfo.size / GB_TO_BYTES).toFixed(1)}GB`);
    console.log(`   🔒 Confidential Computing: Required ✅`);
    console.log(`   📋 Compliance: Multiple regulatory frameworks`);
    console.log('');
    
    return dataset;
  } catch (error) {
    console.error(`❌ Failed to create dataset ${datasetInfo.name}:`, error.message);
    return null;
  }
}

async function createComplianceDatasets() {
  try {
    console.log('🚀 Creating Compliance-Required Datasets with Confidential Computing...\n');
    console.log('🔒 All datasets require confidential computing environments for model training\n');
    
    // Find available TDP users
    const availableTDPs = {};
    for (const [specialty, emails] of Object.entries(TDP_SPECIALIZATIONS)) {
      availableTDPs[specialty] = [];
      for (const email of emails) {
        const tdp = await findTDPUser(email);
        if (tdp) {
          availableTDPs[specialty].push({ email, user: tdp });
          console.log(`✅ Found TDP for ${specialty}: ${tdp.name} (${email})`);
        }
      }
    }
    
    let successCount = 0;
    let totalCount = 0;
    
    console.log('\n🏥 Creating Healthcare Datasets...');
    let healthcareIndex = 0;
    for (const dataset of healthcareDatasets) {
      totalCount++;
      const tdps = availableTDPs.healthcare;
      if (tdps.length > 0) {
        const tdp = tdps[healthcareIndex % tdps.length];
        const result = await createDataset(dataset, tdp.user.id, tdp.email);
        if (result) successCount++;
        healthcareIndex++;
      } else {
        console.log(`⚠️  No healthcare TDPs available for: ${dataset.name}`);
      }
    }
    
    console.log('💰 Creating Financial Datasets...');
    let financialIndex = 0;
    for (const dataset of financialDatasets) {
      totalCount++;
      const tdps = availableTDPs.financial;
      if (tdps.length > 0) {
        const tdp = tdps[financialIndex % tdps.length];
        const result = await createDataset(dataset, tdp.user.id, tdp.email);
        if (result) successCount++;
        financialIndex++;
      } else {
        console.log(`⚠️  No financial TDPs available for: ${dataset.name}`);
      }
    }
    
    console.log('🏦 Creating Retirement Planning Datasets...');
    let retirementIndex = 0;
    for (const dataset of retirementDatasets) {
      totalCount++;
      const tdps = availableTDPs.retirement;
      if (tdps.length > 0) {
        const tdp = tdps[retirementIndex % tdps.length];
        const result = await createDataset(dataset, tdp.user.id, tdp.email);
        if (result) successCount++;
        retirementIndex++;
      } else {
        console.log(`⚠️  No retirement TDPs available for: ${dataset.name}`);
      }
    }
    
    console.log('💊 Creating Drug Discovery Datasets...');
    let pharmaIndex = 0;
    for (const dataset of drugDiscoveryDatasets) {
      totalCount++;
      const tdps = availableTDPs.pharma;
      if (tdps.length > 0) {
        const tdp = tdps[pharmaIndex % tdps.length];
        const result = await createDataset(dataset, tdp.user.id, tdp.email);
        if (result) successCount++;
        pharmaIndex++;
      } else {
        console.log(`⚠️  No pharma TDPs available for: ${dataset.name}`);
      }
    }
    
    const allDatasets = [...healthcareDatasets, ...financialDatasets, ...retirementDatasets, ...drugDiscoveryDatasets];
    
    console.log('🎉 Compliance Dataset Creation Completed!\n');
    
    // Summary
    console.log('📋 SUMMARY:');
    console.log('============================================================');
    console.log(`   ✅ Datasets Successfully Created: ${successCount}/${totalCount}`);
    console.log(`   🏥 Healthcare Datasets: ${healthcareDatasets.length} (HIPAA, HITECH, FDA)`);
    console.log(`   💰 Financial Datasets: ${financialDatasets.length} (SOX, PCI, FCRA, SEC)`);
    console.log(`   🏦 Retirement Datasets: ${retirementDatasets.length} (ERISA, DOL, SSA)`);
    console.log(`   💊 Drug Discovery Datasets: ${drugDiscoveryDatasets.length} (FDA, GINA, ICH)`);
    console.log(`   🔒 All datasets require confidential computing: ✅`);
    
    const totalValue = allDatasets.reduce((sum, dataset) => sum + dataset.price, 0);
    console.log(`   💵 Total Dataset Value: $${totalValue.toLocaleString()}`);
    
    console.log('\n📊 Dataset Categories:');
    const categoryCounts = {};
    allDatasets.forEach(d => {
      categoryCounts[d.category] = (categoryCounts[d.category] || 0) + 1;
    });
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      console.log(`   • ${cat}: ${count} datasets`);
    });
    
    console.log('\n🔐 Compliance & Regulatory Frameworks:');
    console.log('   • Healthcare: HIPAA, HITECH, FDA 21 CFR Parts 11/50/56, DICOM, ICH GCP');
    console.log('   • Financial: SOX, PCI DSS, BSA, USA PATRIOT Act, FFIEC, FCRA, ECOA, TILA');
    console.log('   • Investment: SEC Investment Advisers Act, CFTC, MiFID II, FINRA');
    console.log('   • Retirement: ERISA, DOL Fiduciary Rule, PBGC, IRC Section 401(k)');
    console.log('   • Government: SSA regulations, CMS, Privacy Act of 1974');
    console.log('   • Pharmaceutical: FDA FAERS, ICH E2A-E2F, EMA, GVP, 21 CFR Part 314.80');
    console.log('   • Genomics: GINA, NIH Genomic Data Sharing Policy, FDA Precision Medicine');
    
    console.log('\n🛡️  Security & Privacy Requirements:');
    console.log('   • Confidential Computing: MANDATORY for all datasets');
    console.log('   • Encryption: In-transit and at-rest encryption required');
    console.log('   • Access Control: Role-based access with compliance verification');
    console.log('   • Audit Trails: Complete logging for regulatory compliance');
    console.log('   • Data Anonymization: Required before model training');
    console.log('   • Privacy Preservation: Differential privacy and secure aggregation');
    
    console.log('\n🌐 Access Information:');
    console.log('   Frontend: http://localhost:3000');
    console.log('   Dataset Browser: http://localhost:3000/datasets');
    console.log('   Create Contract: http://localhost:3000/create-contract');
    console.log('   Contract Management: http://localhost:3000/contracts');
    
    console.log('\n🚀 Next Steps:');
    console.log('   1. Browse datasets at /datasets to see compliance-required datasets');
    console.log('   2. Create contracts selecting multiple datasets from different TDPs');
    console.log('   3. All contracts will require confidential computing environments');
    console.log('   4. CCRP providers will set up secure training environments');
    console.log('   5. Model training will occur in privacy-preserving environments');
    
  } catch (error) {
    console.error('❌ Failed to create compliance datasets:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  createComplianceDatasets()
    .then(() => {
      console.log('\n✅ Compliance dataset creation completed successfully!');
      console.log('🔒 All datasets require confidential computing for model training');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Failed to create compliance datasets:', error);
      process.exit(1);
    });
}

module.exports = { createComplianceDatasets };
