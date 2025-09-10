#!/usr/bin/env node

/**
 * Create Compliance-Required Datasets (Corrected)
 * 
 * Creates datasets for healthcare, financial, retirement planning, and drug discovery
 * that require confidential computing environments, using correct database schema.
 */

const db = require('../models');
const crypto = require('crypto');

// Valid categories from database enum
const VALID_CATEGORIES = ['Computer Vision', 'Natural Language Processing', 'Audio', 'Tabular', 'Multimodal'];

// Healthcare Datasets (mapped to valid categories)
const healthcareDatasets = [
  {
    name: "HIPAA-Compliant Electronic Health Records",
    description: "Comprehensive EHR dataset containing patient demographics, medical history, diagnoses, treatments, and outcomes. Requires HIPAA compliance and confidential computing for PHI protection. Includes structured medical data, clinical notes, and treatment histories.",
    category: "Tabular", // Structured medical data
    size: 2500000000, // 2.5GB in bytes
    recordCount: 1500000,
    price: 15000.00,
    tags: JSON.stringify(["healthcare", "EHR", "PHI", "HIPAA", "patient-data", "medical-records", "compliance", "confidential-computing"]),
    license: "Restricted - Healthcare Research Only",
    confidentialComputingRequired: true,
    complianceNote: "HIPAA, HITECH, FDA 21 CFR Part 11 compliance required"
  },
  {
    name: "Medical Imaging Dataset - Radiology Scans (DICOM)",
    description: "High-resolution medical imaging dataset including X-rays, CT scans, MRIs, and ultrasounds with associated diagnostic reports. Contains PHI requiring confidential computing environment for medical AI model training.",
    category: "Computer Vision", // Medical images
    size: 15000000000, // 15GB in bytes
    recordCount: 850000,
    price: 25000.00,
    tags: JSON.stringify(["medical-imaging", "radiology", "DICOM", "PHI", "diagnostic-imaging", "healthcare", "confidential-computing"]),
    license: "Restricted - Medical Research Only",
    confidentialComputingRequired: true,
    complianceNote: "HIPAA, HITECH, DICOM Standards, FDA Medical Device regulations"
  },
  {
    name: "Clinical Trial Data - Pharmaceutical Research",
    description: "Multi-phase clinical trial dataset including patient outcomes, adverse events, efficacy measurements, and safety profiles for drug development research. Structured data for regulatory compliance AI models.",
    category: "Tabular", // Clinical trial structured data
    size: 1200000000, // 1.2GB in bytes
    recordCount: 45000,
    price: 35000.00,
    tags: JSON.stringify(["clinical-trials", "pharmaceutical", "FDA", "GCP", "drug-development", "regulatory", "confidential-computing"]),
    license: "Restricted - Pharmaceutical Research Only",
    confidentialComputingRequired: true,
    complianceNote: "FDA 21 CFR Parts 11, 50, 56, 312, 314, ICH GCP, HIPAA"
  }
];

// Financial Datasets (mapped to valid categories)
const financialDatasets = [
  {
    name: "Banking Transaction Records - Anti-Money Laundering",
    description: "Comprehensive banking transaction dataset for AML compliance, fraud detection, and risk assessment. Contains sensitive financial PII requiring confidential computing for privacy-preserving financial crime detection.",
    category: "Tabular", // Financial transaction data
    size: 8500000000, // 8.5GB in bytes
    recordCount: 25000000,
    price: 45000.00,
    tags: JSON.stringify(["banking", "AML", "fraud-detection", "PCI", "SOX", "financial-crimes", "regulatory", "confidential-computing"]),
    license: "Restricted - Financial Institution Use Only",
    confidentialComputingRequired: true,
    complianceNote: "SOX, PCI DSS, BSA, USA PATRIOT Act, FFIEC guidelines"
  },
  {
    name: "Credit Risk Assessment - Consumer Credit Profiles",
    description: "Consumer credit profiles including credit scores, payment history, debt-to-income ratios, and default predictions for credit risk modeling. Requires confidential computing for fair lending AI compliance.",
    category: "Tabular", // Credit profile structured data
    size: 3200000000, // 3.2GB in bytes
    recordCount: 12000000,
    price: 32000.00,
    tags: JSON.stringify(["credit-risk", "FCRA", "consumer-finance", "lending", "credit-scoring", "financial", "confidential-computing"]),
    license: "Restricted - Licensed Financial Institutions Only",
    confidentialComputingRequired: true,
    complianceNote: "FCRA, ECOA, TILA, SOX, GDPR compliance required"
  },
  {
    name: "Investment Portfolio Analytics - Institutional Trading",
    description: "Institutional investment portfolio data including trading patterns, risk metrics, performance attribution, and market exposure analysis. Multimodal dataset combining numerical data with market sentiment analysis.",
    category: "Multimodal", // Portfolio data + market sentiment
    size: 5800000000, // 5.8GB in bytes
    recordCount: 8500000,
    price: 55000.00,
    tags: JSON.stringify(["investment-management", "portfolio-analytics", "SEC", "institutional-trading", "market-data", "confidential-computing"]),
    license: "Restricted - Registered Investment Advisers Only",
    confidentialComputingRequired: true,
    complianceNote: "SEC Investment Advisers Act, CFTC, MiFID II, SOX, FINRA"
  }
];

// Retirement Planning Datasets (mapped to valid categories)
const retirementDatasets = [
  {
    name: "401k and Pension Fund Analytics",
    description: "Comprehensive retirement planning dataset including 401k contributions, pension fund performance, demographic factors, and retirement outcome predictions. Requires confidential computing for fiduciary compliance.",
    category: "Tabular", // Retirement planning structured data
    size: 2800000000, // 2.8GB in bytes
    recordCount: 5500000,
    price: 28000.00,
    tags: JSON.stringify(["retirement-planning", "401k", "ERISA", "pension-funds", "fiduciary", "financial", "confidential-computing"]),
    license: "Restricted - ERISA Fiduciaries Only",
    confidentialComputingRequired: true,
    complianceNote: "ERISA, DOL Fiduciary Rule, PBGC, IRC Section 401(k)"
  },
  {
    name: "Social Security and Medicare Planning Dataset",
    description: "Social Security benefits optimization and Medicare planning dataset including earnings history, benefit projections, and healthcare cost modeling for government benefits AI optimization.",
    category: "Tabular", // Government benefits structured data
    size: 1800000000, // 1.8GB in bytes
    recordCount: 3200000,
    price: 18000.00,
    tags: JSON.stringify(["social-security", "medicare", "government-benefits", "retirement-income", "healthcare", "confidential-computing"]),
    license: "Restricted - Authorized Government Contractors Only",
    confidentialComputingRequired: true,
    complianceNote: "SSA regulations, CMS, Privacy Act of 1974, HIPAA"
  }
];

// Drug Discovery Datasets (mapped to valid categories)
const drugDiscoveryDatasets = [
  {
    name: "Pharmaceutical Compound Library - Molecular Structures",
    description: "Extensive pharmaceutical compound library with molecular structures, bioactivity data, ADMET properties, and toxicity profiles for drug discovery research. Multimodal dataset combining molecular images and tabular properties.",
    category: "Multimodal", // Molecular structures + tabular properties
    size: 12000000000, // 12GB in bytes
    recordCount: 2800000,
    price: 75000.00,
    tags: JSON.stringify(["drug-discovery", "pharmaceutical", "molecular-structures", "FDA", "GLP", "chemistry", "confidential-computing"]),
    license: "Restricted - Pharmaceutical Companies Only",
    confidentialComputingRequired: true,
    complianceNote: "FDA 21 CFR Part 11, ICH guidelines, GLP, Patent protection"
  },
  {
    name: "Clinical Biomarkers - Genomic and Proteomic Data",
    description: "Clinical biomarker dataset including genomic sequences, proteomic profiles, metabolomics data, and disease associations for personalized medicine research. Highly sensitive genetic information requiring confidential computing.",
    category: "Tabular", // Genomic/proteomic structured data
    size: 45000000000, // 45GB in bytes
    recordCount: 850000,
    price: 85000.00,
    tags: JSON.stringify(["genomics", "biomarkers", "personalized-medicine", "GINA", "precision-medicine", "genetics", "confidential-computing"]),
    license: "Restricted - Authorized Research Institutions Only",
    confidentialComputingRequired: true,
    complianceNote: "GINA, FDA Precision Medicine regulations, NIH Genomic Data Sharing Policy, HIPAA"
  },
  {
    name: "Drug Safety and Pharmacovigilance Database",
    description: "Comprehensive adverse drug reaction database including post-market surveillance data, drug interactions, and safety signal detection for pharmacovigilance. Natural language processing on safety reports.",
    category: "Natural Language Processing", // Safety reports and text data
    size: 6500000000, // 6.5GB in bytes
    recordCount: 15000000,
    price: 65000.00,
    tags: JSON.stringify(["pharmacovigilance", "drug-safety", "adverse-events", "FDA", "regulatory", "NLP", "confidential-computing"]),
    license: "Restricted - Pharmaceutical Companies and Regulators Only",
    confidentialComputingRequired: true,
    complianceNote: "FDA FAERS, ICH E2A-E2F, EMA pharmacovigilance, GVP, 21 CFR Part 314.80"
  }
];

// TDP mapping based on specialization
const TDP_SPECIALIZATIONS = {
  healthcare: ['tdp.airesearch@example.com', 'tdp.biotech@example.com'],
  financial: ['tdp.financial@example.com'],
  retirement: ['tdp.financial@example.com'], // Financial TDP handles retirement too
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
    console.log(`   💾 Size: ${(datasetInfo.size / 1000000000).toFixed(1)}GB`);
    console.log(`   🔒 Confidential Computing: Required`);
    console.log(`   📋 Compliance: ${datasetInfo.complianceNote}`);
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
    
    console.log('\n📊 Creating Healthcare Datasets...');
    let healthcareIndex = 0;
    for (const dataset of healthcareDatasets) {
      const tdps = availableTDPs.healthcare;
      if (tdps.length > 0) {
        const tdp = tdps[healthcareIndex % tdps.length];
        await createDataset(dataset, tdp.user.id, tdp.email);
        healthcareIndex++;
      } else {
        console.log(`⚠️  No healthcare TDPs available for: ${dataset.name}`);
      }
    }
    
    console.log('💰 Creating Financial Datasets...');
    let financialIndex = 0;
    for (const dataset of financialDatasets) {
      const tdps = availableTDPs.financial;
      if (tdps.length > 0) {
        const tdp = tdps[financialIndex % tdps.length];
        await createDataset(dataset, tdp.user.id, tdp.email);
        financialIndex++;
      } else {
        console.log(`⚠️  No financial TDPs available for: ${dataset.name}`);
      }
    }
    
    console.log('🏦 Creating Retirement Planning Datasets...');
    let retirementIndex = 0;
    for (const dataset of retirementDatasets) {
      const tdps = availableTDPs.retirement;
      if (tdps.length > 0) {
        const tdp = tdps[retirementIndex % tdps.length];
        await createDataset(dataset, tdp.user.id, tdp.email);
        retirementIndex++;
      } else {
        console.log(`⚠️  No retirement TDPs available for: ${dataset.name}`);
      }
    }
    
    console.log('💊 Creating Drug Discovery Datasets...');
    let pharmaIndex = 0;
    for (const dataset of drugDiscoveryDatasets) {
      const tdps = availableTDPs.pharma;
      if (tdps.length > 0) {
        const tdp = tdps[pharmaIndex % tdps.length];
        await createDataset(dataset, tdp.user.id, tdp.email);
        pharmaIndex++;
      } else {
        console.log(`⚠️  No pharma TDPs available for: ${dataset.name}`);
      }
    }
    
    const allDatasets = [...healthcareDatasets, ...financialDatasets, ...retirementDatasets, ...drugDiscoveryDatasets];
    
    console.log('🎉 Compliance Dataset Creation Completed!\n');
    
    // Summary
    console.log('📋 Summary:');
    console.log(`   📊 Total Datasets Created: ${allDatasets.length}`);
    console.log(`   🏥 Healthcare Datasets: ${healthcareDatasets.length}`);
    console.log(`   💰 Financial Datasets: ${financialDatasets.length}`);
    console.log(`   🏦 Retirement Datasets: ${retirementDatasets.length}`);
    console.log(`   💊 Drug Discovery Datasets: ${drugDiscoveryDatasets.length}`);
    console.log(`   🔒 All datasets require confidential computing: ✅`);
    
    const totalValue = allDatasets.reduce((sum, dataset) => sum + dataset.price, 0);
    console.log(`   💵 Total Dataset Value: $${totalValue.toLocaleString()}`);
    
    console.log('\n📊 Dataset Categories Used:');
    const categoryCounts = {};
    allDatasets.forEach(d => {
      categoryCounts[d.category] = (categoryCounts[d.category] || 0) + 1;
    });
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      console.log(`   • ${cat}: ${count} datasets`);
    });
    
    console.log('\n🔐 Compliance Frameworks Covered:');
    console.log('   • Healthcare: HIPAA, HITECH, FDA 21 CFR Part 11, DICOM, ICH GCP');
    console.log('   • Financial: SOX, PCI DSS, BSA, USA PATRIOT Act, FFIEC, FCRA, ECOA, TILA');
    console.log('   • Retirement: ERISA, DOL Fiduciary Rule, PBGC, IRC Section 401(k)');
    console.log('   • Government: SSA, CMS, Privacy Act of 1974');
    console.log('   • Pharmaceutical: FDA FAERS, ICH guidelines, GLP, GVP, GINA');
    
    console.log('\n🌐 Access URLs:');
    console.log('   Frontend: http://localhost:3000');
    console.log('   Dataset Browser: http://localhost:3000/datasets');
    console.log('   Create Contract: http://localhost:3000/create-contract');
    
    console.log('\n🔐 Security Notes:');
    console.log('   • All datasets require confidential computing environments');
    console.log('   • Encryption in transit and at rest is mandatory');
    console.log('   • Access requires proper licensing and compliance verification');
    console.log('   • Regular compliance audits are required for data usage');
    console.log('   • Privacy-preserving AI model training only');
    
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
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Failed to create compliance datasets:', error);
      process.exit(1);
    });
}

module.exports = { createComplianceDatasets };
