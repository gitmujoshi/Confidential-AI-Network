#!/usr/bin/env node

/**
 * Create Compliance-Required Datasets
 * 
 * This script creates datasets for healthcare, financial, retirement planning, 
 * and drug discovery that require confidential computing environments for model training.
 * 
 * All datasets include:
 * - Compliance requirements (HIPAA, SOX, PCI, FDA, etc.)
 * - Confidential computing requirements
 * - Realistic data characteristics
 * - Proper privacy and security specifications
 */

const db = require('../models');
const crypto = require('crypto');
const DEPAIdService = require('../services/depaIdService');

// Healthcare Datasets with HIPAA Compliance
const healthcareDatasets = [
  {
    name: "HIPAA-Compliant Patient Electronic Health Records",
    description: "Comprehensive electronic health records dataset containing patient demographics, medical history, diagnoses, treatments, and outcomes. Requires HIPAA compliance and confidential computing for PHI protection.",
    category: "Healthcare",
    dataType: "Structured",
    size: 2500000000, // 2.5GB
    recordCount: 1500000,
    fields: [
      "patient_id", "age", "gender", "ethnicity", "medical_history", 
      "current_medications", "allergies", "vital_signs", "lab_results",
      "diagnoses", "treatments", "procedures", "insurance_info"
    ],
    complianceRequirements: [
      "HIPAA (Health Insurance Portability and Accountability Act)",
      "HITECH (Health Information Technology for Economic and Clinical Health)",
      "FDA 21 CFR Part 11 (if drug-related)",
      "State medical privacy laws"
    ],
    privacyLevel: "PHI (Protected Health Information)",
    encryptionRequired: true,
    confidentialComputingRequired: true,
    tags: ["healthcare", "EHR", "PHI", "HIPAA", "patient-data", "medical-records"],
    license: "Restricted - Healthcare Research Only",
    accessRestrictions: "IRB approval required, HIPAA BAA mandatory",
    price: 15000.00,
    usageTerms: "Research and clinical AI model training only. No re-identification attempts permitted."
  },
  {
    name: "Medical Imaging Dataset - Radiology Scans (DICOM)",
    description: "High-resolution medical imaging dataset including X-rays, CT scans, MRIs, and ultrasounds with associated diagnostic reports. Contains PHI requiring confidential computing environment.",
    category: "Healthcare",
    dataType: "Medical Imaging",
    size: 15000000000, // 15GB
    recordCount: 850000,
    fields: [
      "image_id", "patient_id", "study_date", "modality", "body_part",
      "image_data", "dicom_metadata", "radiologist_report", "diagnosis",
      "image_quality_metrics", "acquisition_parameters"
    ],
    complianceRequirements: [
      "HIPAA", "HITECH", "DICOM Standards", "FDA Medical Device regulations",
      "State medical imaging laws", "International GDPR (if applicable)"
    ],
    privacyLevel: "PHI with biometric identifiers",
    encryptionRequired: true,
    confidentialComputingRequired: true,
    tags: ["medical-imaging", "radiology", "DICOM", "PHI", "diagnostic-imaging"],
    license: "Restricted - Medical Research Only",
    accessRestrictions: "Medical licensing verification required",
    price: 25000.00,
    usageTerms: "Diagnostic AI model training only. Image anonymization required before processing."
  },
  {
    name: "Clinical Trial Data - Pharmaceutical Research",
    description: "Multi-phase clinical trial dataset including patient outcomes, adverse events, efficacy measurements, and safety profiles for drug development research.",
    category: "Healthcare",
    dataType: "Clinical Research",
    size: 1200000000, // 1.2GB
    recordCount: 45000,
    fields: [
      "trial_id", "patient_id", "phase", "treatment_arm", "dosage",
      "administration_route", "primary_endpoints", "secondary_endpoints",
      "adverse_events", "concomitant_medications", "demographics"
    ],
    complianceRequirements: [
      "FDA 21 CFR Parts 11, 50, 56, 312, 314",
      "ICH GCP (Good Clinical Practice)",
      "HIPAA", "HITECH", "EU Clinical Trial Regulation"
    ],
    privacyLevel: "PHI + Clinical Trial Data",
    encryptionRequired: true,
    confidentialComputingRequired: true,
    tags: ["clinical-trials", "pharmaceutical", "FDA", "GCP", "drug-development"],
    license: "Restricted - Pharmaceutical Research Only",
    accessRestrictions: "FDA IND/NDA holder or authorized researcher only",
    price: 35000.00,
    usageTerms: "Drug development and regulatory submission only. Subject to FDA oversight."
  }
];

// Financial Datasets with SOX/PCI Compliance
const financialDatasets = [
  {
    name: "Banking Transaction Records - Anti-Money Laundering (AML)",
    description: "Comprehensive banking transaction dataset for AML compliance, fraud detection, and risk assessment. Contains sensitive financial PII requiring confidential computing.",
    category: "Financial Services",
    dataType: "Financial Transactions",
    size: 8500000000, // 8.5GB
    recordCount: 25000000,
    fields: [
      "transaction_id", "account_id", "customer_id", "transaction_amount",
      "transaction_type", "merchant_category", "geographic_location",
      "timestamp", "suspicious_activity_flags", "risk_score"
    ],
    complianceRequirements: [
      "SOX (Sarbanes-Oxley Act)",
      "PCI DSS (Payment Card Industry Data Security Standard)",
      "BSA (Bank Secrecy Act)",
      "USA PATRIOT Act",
      "FFIEC guidelines",
      "GDPR (if EU customers)"
    ],
    privacyLevel: "Financial PII + Transaction Data",
    encryptionRequired: true,
    confidentialComputingRequired: true,
    tags: ["banking", "AML", "fraud-detection", "PCI", "SOX", "financial-crimes"],
    license: "Restricted - Financial Institution Use Only",
    accessRestrictions: "Banking license and regulatory approval required",
    price: 45000.00,
    usageTerms: "AML and fraud detection model training only. Subject to banking regulations."
  },
  {
    name: "Credit Risk Assessment - Consumer Credit Profiles",
    description: "Consumer credit profiles including credit scores, payment history, debt-to-income ratios, and default predictions for credit risk modeling.",
    category: "Financial Services",
    dataType: "Credit Data",
    size: 3200000000, // 3.2GB
    recordCount: 12000000,
    fields: [
      "customer_id", "credit_score", "payment_history", "credit_utilization",
      "debt_to_income_ratio", "employment_history", "income_verification",
      "loan_defaults", "bankruptcy_history", "geographic_factors"
    ],
    complianceRequirements: [
      "FCRA (Fair Credit Reporting Act)",
      "ECOA (Equal Credit Opportunity Act)",
      "TILA (Truth in Lending Act)",
      "SOX", "GDPR", "State privacy laws"
    ],
    privacyLevel: "Financial PII + Credit Information",
    encryptionRequired: true,
    confidentialComputingRequired: true,
    tags: ["credit-risk", "FCRA", "consumer-finance", "lending", "credit-scoring"],
    license: "Restricted - Licensed Financial Institutions Only",
    accessRestrictions: "FCRA compliance and permissible purpose required",
    price: 32000.00,
    usageTerms: "Credit decision models only. Fair lending compliance mandatory."
  },
  {
    name: "Investment Portfolio Analytics - Institutional Trading",
    description: "Institutional investment portfolio data including trading patterns, risk metrics, performance attribution, and market exposure analysis.",
    category: "Financial Services",
    dataType: "Investment Data",
    size: 5800000000, // 5.8GB
    recordCount: 8500000,
    fields: [
      "portfolio_id", "security_id", "position_size", "trade_timestamp",
      "execution_price", "market_value", "risk_metrics", "sector_allocation",
      "performance_attribution", "benchmark_comparison", "liquidity_metrics"
    ],
    complianceRequirements: [
      "SEC Investment Advisers Act",
      "CFTC regulations",
      "MiFID II (if EU)",
      "SOX", "FINRA rules",
      "Institutional investor protection regulations"
    ],
    privacyLevel: "Proprietary Trading Information",
    encryptionRequired: true,
    confidentialComputingRequired: true,
    tags: ["investment-management", "portfolio-analytics", "SEC", "institutional-trading"],
    license: "Restricted - Registered Investment Advisers Only",
    accessRestrictions: "SEC registration and fiduciary standards required",
    price: 55000.00,
    usageTerms: "Portfolio optimization and risk management models only."
  }
];

// Retirement Planning Datasets
const retirementDatasets = [
  {
    name: "Retirement Planning - 401k and Pension Fund Analytics",
    description: "Comprehensive retirement planning dataset including 401k contributions, pension fund performance, demographic factors, and retirement outcome predictions.",
    category: "Financial Services",
    dataType: "Retirement Planning",
    size: 2800000000, // 2.8GB
    recordCount: 5500000,
    fields: [
      "participant_id", "age", "income_level", "contribution_rate",
      "employer_match", "investment_allocation", "vesting_schedule",
      "loan_history", "projected_retirement_age", "benefit_projections"
    ],
    complianceRequirements: [
      "ERISA (Employee Retirement Income Security Act)",
      "DOL Fiduciary Rule",
      "PBGC (Pension Benefit Guaranty Corporation)",
      "IRC Section 401(k)",
      "SOX", "State fiduciary laws"
    ],
    privacyLevel: "Personal Financial Information + Retirement Data",
    encryptionRequired: true,
    confidentialComputingRequired: true,
    tags: ["retirement-planning", "401k", "ERISA", "pension-funds", "fiduciary"],
    license: "Restricted - ERISA Fiduciaries Only",
    accessRestrictions: "Fiduciary certification and DOL compliance required",
    price: 28000.00,
    usageTerms: "Retirement planning and fiduciary advisory services only."
  },
  {
    name: "Social Security and Medicare Planning Dataset",
    description: "Social Security benefits optimization and Medicare planning dataset including earnings history, benefit projections, and healthcare cost modeling.",
    category: "Government Benefits",
    dataType: "Social Security Data",
    size: 1800000000, // 1.8GB
    recordCount: 3200000,
    fields: [
      "ssn_hash", "earnings_history", "benefit_projections", "medicare_enrollment",
      "health_status", "geographic_location", "marital_status",
      "claiming_strategies", "healthcare_cost_projections"
    ],
    complianceRequirements: [
      "SSA (Social Security Administration) regulations",
      "CMS (Centers for Medicare & Medicaid Services)",
      "Privacy Act of 1974",
      "HIPAA (healthcare portions)",
      "Federal privacy laws"
    ],
    privacyLevel: "Government Benefits PII",
    encryptionRequired: true,
    confidentialComputingRequired: true,
    tags: ["social-security", "medicare", "government-benefits", "retirement-income"],
    license: "Restricted - Authorized Government Contractors Only",
    accessRestrictions: "Government authorization and security clearance required",
    price: 18000.00,
    usageTerms: "Government benefits optimization only. Subject to federal oversight."
  }
];

// Drug Discovery Datasets
const drugDiscoveryDatasets = [
  {
    name: "Pharmaceutical Compound Library - Molecular Structures",
    description: "Extensive pharmaceutical compound library with molecular structures, bioactivity data, ADMET properties, and toxicity profiles for drug discovery research.",
    category: "Pharmaceuticals",
    dataType: "Chemical Data",
    size: 12000000000, // 12GB
    recordCount: 2800000,
    fields: [
      "compound_id", "molecular_structure", "smiles_notation", "molecular_weight",
      "bioactivity_data", "target_interactions", "admet_properties",
      "toxicity_profiles", "patent_status", "regulatory_history"
    ],
    complianceRequirements: [
      "FDA 21 CFR Part 11",
      "ICH guidelines (Q1-Q14)",
      "GLP (Good Laboratory Practice)",
      "Patent protection laws",
      "Export control regulations (ITAR/EAR)",
      "International pharmaceutical regulations"
    ],
    privacyLevel: "Proprietary Pharmaceutical IP",
    encryptionRequired: true,
    confidentialComputingRequired: true,
    tags: ["drug-discovery", "pharmaceutical", "molecular-structures", "FDA", "GLP"],
    license: "Restricted - Pharmaceutical Companies Only",
    accessRestrictions: "Pharmaceutical R&D license and IP agreements required",
    price: 75000.00,
    usageTerms: "Drug discovery and development only. IP protection mandatory."
  },
  {
    name: "Clinical Biomarkers - Genomic and Proteomic Data",
    description: "Clinical biomarker dataset including genomic sequences, proteomic profiles, metabolomics data, and disease associations for personalized medicine research.",
    category: "Biotechnology",
    dataType: "Genomic Data",
    size: 45000000000, // 45GB
    recordCount: 850000,
    fields: [
      "patient_id", "genomic_sequence", "snp_data", "gene_expression",
      "protein_levels", "metabolite_profiles", "disease_phenotypes",
      "drug_responses", "ancestry_information", "clinical_outcomes"
    ],
    complianceRequirements: [
      "GINA (Genetic Information Nondiscrimination Act)",
      "FDA Precision Medicine regulations",
      "NIH Genomic Data Sharing Policy",
      "HIPAA", "HITECH",
      "International genomics guidelines",
      "IRB approval requirements"
    ],
    privacyLevel: "Genetic Information + PHI",
    encryptionRequired: true,
    confidentialComputingRequired: true,
    tags: ["genomics", "biomarkers", "personalized-medicine", "GINA", "precision-medicine"],
    license: "Restricted - Authorized Research Institutions Only",
    accessRestrictions: "IRB approval and GINA compliance mandatory",
    price: 85000.00,
    usageTerms: "Biomedical research and personalized medicine only. Genetic privacy protection required."
  },
  {
    name: "Drug Safety and Pharmacovigilance Database",
    description: "Comprehensive adverse drug reaction database including post-market surveillance data, drug interactions, and safety signal detection for pharmacovigilance.",
    category: "Drug Safety",
    dataType: "Safety Data",
    size: 6500000000, // 6.5GB
    recordCount: 15000000,
    fields: [
      "case_id", "drug_name", "patient_demographics", "adverse_event",
      "severity_grade", "causality_assessment", "concomitant_medications",
      "medical_history", "event_outcome", "regulatory_reporting"
    ],
    complianceRequirements: [
      "FDA FAERS (FDA Adverse Event Reporting System)",
      "ICH E2A-E2F guidelines",
      "EMA pharmacovigilance requirements",
      "GVP (Good Pharmacovigilance Practice)",
      "21 CFR Part 314.80",
      "International safety regulations"
    ],
    privacyLevel: "Medical Safety Information + PHI",
    encryptionRequired: true,
    confidentialComputingRequired: true,
    tags: ["pharmacovigilance", "drug-safety", "adverse-events", "FDA", "regulatory"],
    license: "Restricted - Pharmaceutical Companies and Regulators Only",
    accessRestrictions: "Regulatory approval and safety reporting obligations required",
    price: 65000.00,
    usageTerms: "Drug safety monitoring and regulatory compliance only."
  }
];

// Combine all datasets
const allDatasets = [
  ...healthcareDatasets,
  ...financialDatasets,
  ...retirementDatasets,
  ...drugDiscoveryDatasets
];

async function findOrCreateTDP(email, name, organization, specialization) {
  try {
    let tdp = await db.User.findOne({ where: { email } });
    const depaIdService = new DEPAIdService();
    
    if (!tdp) {
      console.log(`📝 Creating TDP: ${name}`);
      tdp = await db.User.create({
        name,
        email,
        password: '$2b$10$defaulthashedpassword', // Default password
        partyType: 'TDP',
        organization,
        description: `Specialized ${specialization} data provider focusing on compliance-required datasets`,
        website: `https://${organization.toLowerCase().replace(/\s+/g, '')}.com`,
        location: 'United States',
        isActive: true,
        depaId: depaIdService.generateUserDEPAId('TDP'),
        did: `did:web:${organization.toLowerCase().replace(/\s+/g, '')}.com:user:${email.split('@')[0]}`,
        walletAddress: `0x${crypto.randomBytes(20).toString('hex')}`,
        // Add compliance certifications
        certifications: [
          `${specialization} Data Handling Certification`,
          'Confidential Computing Certified',
          'Data Privacy and Security Certified'
        ]
      });
      console.log(`✅ Created TDP: ${name} (ID: ${tdp.id})`);
    } else {
      console.log(`✅ Found existing TDP: ${name} (ID: ${tdp.id})`);
    }
    
    return tdp;
  } catch (error) {
    console.error(`❌ Failed to create/find TDP ${name}:`, error.message);
    throw error;
  }
}

async function createDataset(datasetInfo, ownerId) {
  try {
    const datasetId = `DATASET-${crypto.randomUUID()}`;
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
      dataType: datasetInfo.dataType,
      size: datasetInfo.size,
      recordCount: datasetInfo.recordCount,
      fields: JSON.stringify(datasetInfo.fields),
      tags: JSON.stringify(datasetInfo.tags),
      license: datasetInfo.license,
      price: datasetInfo.price,
      isActive: true,
      isPublic: false, // Compliance datasets are typically private
      
      // Compliance and security fields
      confidentialComputingRequired: datasetInfo.confidentialComputingRequired,
      encryptionRequired: datasetInfo.encryptionRequired,
      accessRestrictions: datasetInfo.accessRestrictions,
      complianceRequirements: JSON.stringify(datasetInfo.complianceRequirements),
      privacyLevel: datasetInfo.privacyLevel,
      usageTerms: datasetInfo.usageTerms,
      
      // DEPA ID
      depaId: depaIdService.generateDEPAId('DATASET'),
      
      // Metadata
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log(`✅ Created dataset: ${datasetInfo.name} (${datasetId})`);
    console.log(`   💰 Price: $${datasetInfo.price.toLocaleString()}`);
    console.log(`   📊 Records: ${datasetInfo.recordCount.toLocaleString()}`);
    console.log(`   🔒 Compliance: ${datasetInfo.complianceRequirements.join(', ')}`);
    console.log(`   🛡️  Confidential Computing: ${datasetInfo.confidentialComputingRequired ? 'Required' : 'Optional'}`);
    
    return dataset;
  } catch (error) {
    console.error(`❌ Failed to create dataset ${datasetInfo.name}:`, error.message);
    throw error;
  }
}

async function createComplianceDatasets() {
  try {
    console.log('🚀 Creating Compliance-Required Datasets...\n');
    
    // Create specialized TDPs for each domain
    const tdps = {
      healthcare: await findOrCreateTDP(
        'healthcare@medicaldata.com',
        'MedicalData Solutions Inc.',
        'MedicalData Solutions',
        'Healthcare'
      ),
      financial: await findOrCreateTDP(
        'compliance@financedata.com',
        'FinanceData Analytics Corp.',
        'FinanceData Analytics',
        'Financial Services'
      ),
      retirement: await findOrCreateTDP(
        'retirement@pensionanalytics.com',
        'Pension Analytics Group',
        'Pension Analytics',
        'Retirement Planning'
      ),
      pharma: await findOrCreateTDP(
        'research@pharmaresearch.com',
        'PharmaResearch Data Labs',
        'PharmaResearch Labs',
        'Pharmaceutical Research'
      ),
      biotech: await findOrCreateTDP(
        'genomics@biotechdata.com',
        'BiotechData Genomics Inc.',
        'BiotechData Genomics',
        'Biotechnology'
      )
    };
    
    console.log('\n📊 Creating Healthcare Datasets...');
    for (const dataset of healthcareDatasets) {
      await createDataset(dataset, tdps.healthcare.id);
    }
    
    console.log('\n💰 Creating Financial Datasets...');
    for (const dataset of financialDatasets) {
      await createDataset(dataset, tdps.financial.id);
    }
    
    console.log('\n🏦 Creating Retirement Planning Datasets...');
    for (const dataset of retirementDatasets) {
      await createDataset(dataset, tdps.retirement.id);
    }
    
    console.log('\n💊 Creating Drug Discovery Datasets...');
    // Assign pharmaceutical datasets to pharma TDP
    for (let i = 0; i < drugDiscoveryDatasets.length; i++) {
      const dataset = drugDiscoveryDatasets[i];
      const tdpToUse = (dataset.category === 'Biotechnology') ? tdps.biotech : tdps.pharma;
      await createDataset(dataset, tdpToUse.id);
    }
    
    console.log('\n🎉 Compliance Dataset Creation Completed!\n');
    
    // Summary
    console.log('📋 Summary:');
    console.log(`   👥 TDPs Created/Updated: ${Object.keys(tdps).length}`);
    console.log(`   📊 Total Datasets: ${allDatasets.length}`);
    console.log(`   🏥 Healthcare: ${healthcareDatasets.length} datasets`);
    console.log(`   💰 Financial: ${financialDatasets.length} datasets`);
    console.log(`   🏦 Retirement: ${retirementDatasets.length} datasets`);
    console.log(`   💊 Drug Discovery: ${drugDiscoveryDatasets.length} datasets`);
    console.log(`   🔒 All datasets require confidential computing: ✅`);
    console.log(`   📋 Compliance frameworks covered: HIPAA, SOX, PCI, FDA, ERISA, GINA, and more`);
    
    const totalValue = allDatasets.reduce((sum, dataset) => sum + dataset.price, 0);
    console.log(`   💵 Total Dataset Value: $${totalValue.toLocaleString()}`);
    
    console.log('\n🌐 Access URLs:');
    console.log('   Frontend: http://localhost:3000');
    console.log('   Backend API: http://localhost:5001/api');
    console.log('   Dataset Browser: http://localhost:3000/datasets');
    
    console.log('\n🔐 Security Notes:');
    console.log('   • All datasets require confidential computing environments');
    console.log('   • Encryption in transit and at rest is mandatory');
    console.log('   • Access requires proper licensing and compliance verification');
    console.log('   • Regular compliance audits are required for data usage');
    
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

module.exports = {
  createComplianceDatasets,
  healthcareDatasets,
  financialDatasets,
  retirementDatasets,
  drugDiscoveryDatasets
};
