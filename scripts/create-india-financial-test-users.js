#!/usr/bin/env node

/**
 * India financial-sector seed data — API-only (no direct DB access).
 *
 * Endpoints used:
 *   GET  /health
 *   POST /api/auth/register
 *   POST /api/auth/login
 *   POST /api/auth/first-login-password
 *   PUT  /api/users/:id          (AppAdmin — TSP cloudProviders)
 *   GET  /api/datasets/:datasetId
 *   POST /api/datasets
 *   PUT  /api/datasets/:datasetId
 *   GET  /api/ai-models/:modelId
 *   POST /api/ai-models
 *   PUT  /api/ai-models/:modelId
 *
 * Usage:
 *   npm run test:users:india-financial
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  fs.readFileSync(filePath, 'utf8')
    .split('\n')
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) return;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    });
}

loadEnvFile(path.join(__dirname, '..', 'config.env'));
loadEnvFile(path.join(__dirname, '..', 'secrets.env'));

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';
const DEFAULT_PASSWORD = process.env.INDIA_FIN_TEST_PASSWORD || 'TestNewPassword123!';

const DEPLOYMENT = {
  deploymentPrefix: 'IN-MUM',
  jurisdiction: 'IN-DPDPA',
  region: 'ap-south-1',
  country: 'India',
};

const DATA_PROVIDERS = [
  {
    slug: 'hdfc',
    name: 'HDFC Bank — Retail Lending Data',
    organization: 'HDFC Bank Ltd.',
    description:
      'TDP: anonymized retail loan applications, KYC features, and repayment history for pooled credit-risk models (RBI-compliant).',
    useCase: 'lending',
    dataset: {
      datasetId: 'in-fin-hdfc-retail-loans',
      name: 'HDFC Retail Loan Portfolio (synthetic)',
      description:
        'Synthetic retail loan applications and performance labels for consortium credit-scoring models.',
      category: 'Tabular',
      tags: ['india', 'banking', 'lending', 'retail-loans', 'dpdpa', 'consortium'],
      metadata: {
        sector: 'banking',
        modality: 'tabular',
        useCases: ['loan-default', 'credit-scoring', 'underwriting'],
        dataResidency: 'IN',
        regulatoryFramework: ['RBI', 'DPDPA'],
      },
      compatibleModelIds: ['in-fin-model-credit-logreg', 'in-fin-model-affordability-logreg'],
      featureSchema: ['age', 'income', 'employment_type', 'loan_amount', 'tenure_months', 'default_flag'],
    },
    extraDatasets: [
      {
        datasetId: 'in-fin-hdfc-kyc-features',
        name: 'HDFC KYC & Identity Signals (synthetic)',
        description: 'Synthetic KYC strength, address stability, and identity-match scores for consortium underwriting.',
        category: 'Tabular',
        tags: ['india', 'banking', 'kyc', 'identity', 'lending', 'consortium'],
        metadata: {
          sector: 'banking',
          modality: 'tabular',
          useCases: ['kyc-risk', 'credit-scoring', 'fraud'],
          dataResidency: 'IN',
        },
        compatibleModelIds: ['in-fin-model-credit-logreg', 'in-fin-model-fraud-logreg'],
        featureSchema: ['kyc_score', 'address_tenure_years', 'id_match_confidence', 'pep_flag'],
      },
    ],
  },
  {
    slug: 'sbi',
    name: 'SBI — Transaction & Account Signals',
    organization: 'State Bank of India',
    description:
      'TDP: aggregated transaction and balance signals for cross-institution fraud and AML pattern detection.',
    useCase: 'fraud',
    dataset: {
      datasetId: 'in-fin-sbi-transactions',
      name: 'SBI Transaction Signals (synthetic)',
      description: 'Synthetic transaction graphs for federated fraud detection across Indian banks.',
      category: 'Tabular',
      tags: ['india', 'banking', 'fraud', 'aml', 'transactions', 'consortium'],
      metadata: {
        sector: 'banking',
        modality: 'tabular',
        useCases: ['fraud-detection', 'aml', 'mule-accounts'],
        dataResidency: 'IN',
      },
      compatibleModelIds: ['in-fin-model-fraud-logreg', 'in-fin-model-aml-gbm'],
      featureSchema: ['txn_amount', 'merchant_category', 'hour_of_day', 'geo_distance_km', 'is_fraud'],
    },
    extraDatasets: [
      {
        datasetId: 'in-fin-sbi-merchant-risk',
        name: 'SBI Merchant & Mule-Risk Graph (synthetic)',
        description: 'Synthetic merchant-level risk and mule-account indicators for cross-bank AML consortium models.',
        category: 'Tabular',
        tags: ['india', 'banking', 'aml', 'merchant', 'mule', 'consortium'],
        metadata: {
          sector: 'banking',
          modality: 'tabular',
          useCases: ['aml', 'mule-accounts', 'merchant-fraud'],
          dataResidency: 'IN',
        },
        compatibleModelIds: ['in-fin-model-fraud-logreg', 'in-fin-model-aml-gbm'],
        featureSchema: ['merchant_risk_score', 'mule_probability', 'cash_deposit_ratio', 'rapid_outflow_flag'],
      },
    ],
  },
  {
    slug: 'icici-insurance',
    name: 'ICICI Lombard — Motor Claims',
    organization: 'ICICI Lombard General Insurance',
    description:
      'TDP: motor insurance claims and risk features for pooled pricing and fraud models (IRDAI sandbox).',
    useCase: 'insurance',
    dataset: {
      datasetId: 'in-fin-icici-motor-claims',
      name: 'ICICI Lombard Motor Claims (synthetic)',
      description: 'Synthetic motor claims for consortium insurance pricing and claims-fraud models.',
      category: 'Tabular',
      tags: ['india', 'insurance', 'motor', 'claims', 'irdai', 'consortium'],
      metadata: {
        sector: 'insurance',
        modality: 'tabular',
        useCases: ['claims-fraud', 'premium-pricing', 'loss-ratio'],
        dataResidency: 'IN',
        regulatoryFramework: ['IRDAI', 'DPDPA'],
      },
      compatibleModelIds: ['in-fin-model-claims-fraud-logreg', 'in-fin-model-motor-premium-logreg'],
      featureSchema: ['claim_amount', 'vehicle_age', 'repair_shop_risk', 'prior_claims', 'fraud_flag'],
    },
    extraDatasets: [
      {
        datasetId: 'in-fin-icici-health-claims',
        name: 'ICICI Lombard Health Claims (synthetic)',
        description: 'Synthetic health insurance claims for consortium fraud and provider-abuse detection.',
        category: 'Tabular',
        tags: ['india', 'insurance', 'health', 'claims', 'consortium'],
        metadata: {
          sector: 'insurance',
          modality: 'tabular',
          useCases: ['claims-fraud', 'provider-abuse'],
          dataResidency: 'IN',
          regulatoryFramework: ['IRDAI', 'DPDPA'],
        },
        compatibleModelIds: ['in-fin-model-claims-fraud-logreg'],
        featureSchema: ['procedure_code', 'provider_risk', 'claim_amount', 'readmission_flag', 'fraud_flag'],
      },
    ],
  },
  {
    slug: 'axis-cards',
    name: 'Axis Bank — Credit Card Spend',
    organization: 'Axis Bank Ltd.',
    description:
      'TDP: card spend categories and limit utilization for pooled offer targeting and churn models.',
    useCase: 'credit-cards',
    dataset: {
      datasetId: 'in-fin-axis-card-spend',
      name: 'Axis Card Spend Patterns (synthetic)',
      description: 'Synthetic credit-card spend and limit data for consortium offer and risk models.',
      category: 'Tabular',
      tags: ['india', 'credit-cards', 'offers', 'spend-analytics', 'consortium'],
      metadata: {
        sector: 'cards',
        modality: 'tabular',
        useCases: ['card-offers', 'churn', 'limit-increase', 'fraud'],
        dataResidency: 'IN',
      },
      compatibleModelIds: ['in-fin-model-card-offer-logreg', 'in-fin-model-card-churn-logreg'],
      featureSchema: ['spend_groceries', 'spend_travel', 'utilization_pct', 'limit', 'offer_response'],
    },
    extraDatasets: [
      {
        datasetId: 'in-fin-axis-rewards-spend',
        name: 'Axis Rewards & Cashback Engagement (synthetic)',
        description: 'Synthetic rewards redemption and cashback patterns for card-offer and churn consortium models.',
        category: 'Tabular',
        tags: ['india', 'credit-cards', 'rewards', 'cashback', 'consortium'],
        metadata: {
          sector: 'cards',
          modality: 'tabular',
          useCases: ['card-offers', 'churn', 'rewards-targeting'],
          dataResidency: 'IN',
        },
        compatibleModelIds: ['in-fin-model-card-offer-logreg', 'in-fin-model-card-churn-logreg'],
        featureSchema: ['rewards_balance', 'redemption_rate', 'cashback_earned', 'inactive_days', 'churn_flag'],
      },
    ],
  },
  {
    slug: 'bajaj-finance',
    name: 'Bajaj Finance — NBFC EMI Performance',
    organization: 'Bajaj Finance Ltd.',
    description:
      'TDP: NBFC personal-loan and EMI performance for pooled alternative-lending risk models.',
    useCase: 'lending',
    dataset: {
      datasetId: 'in-fin-bajaj-nbfc-emi',
      name: 'Bajaj Finance EMI Portfolio (synthetic)',
      description: 'Synthetic NBFC EMI schedules and delinquency labels for consortium lending models.',
      category: 'Tabular',
      tags: ['india', 'nbfc', 'lending', 'emi', 'consortium'],
      metadata: {
        sector: 'nbfc',
        modality: 'tabular',
        useCases: ['loan-default', 'collections', 'affordability'],
        dataResidency: 'IN',
        regulatoryFramework: ['RBI', 'DPDPA'],
      },
      compatibleModelIds: ['in-fin-model-credit-logreg', 'in-fin-model-collections-logreg'],
      featureSchema: ['emi_amount', 'dpd_days', 'bounce_count', 'income_band', 'delinquency_flag'],
    },
    extraDatasets: [
      {
        datasetId: 'in-fin-bajaj-collections',
        name: 'Bajaj Collections & Recovery Outcomes (synthetic)',
        description: 'Synthetic collections contact outcomes and recovery scores for NBFC consortium models.',
        category: 'Tabular',
        tags: ['india', 'nbfc', 'collections', 'recovery', 'consortium'],
        metadata: {
          sector: 'nbfc',
          modality: 'tabular',
          useCases: ['collections', 'recovery-rate', 'affordability'],
          dataResidency: 'IN',
        },
        compatibleModelIds: ['in-fin-model-collections-logreg', 'in-fin-model-affordability-logreg'],
        featureSchema: ['contacts_count', 'promise_to_pay', 'recovery_amount', 'hardship_flag', 'recovered_flag'],
      },
    ],
  },
  {
    slug: 'lic',
    name: 'LIC — Life Insurance Risk Factors',
    organization: 'Life Insurance Corporation of India',
    description:
      'TDP: actuarial risk factor summaries for pooled life-insurance underwriting and mortality models.',
    useCase: 'insurance',
    dataset: {
      datasetId: 'in-fin-lic-life-risk',
      name: 'LIC Life Risk Summaries (synthetic)',
      description: 'Synthetic life-insurance risk summaries for consortium underwriting models.',
      category: 'Tabular',
      tags: ['india', 'insurance', 'life', 'actuarial', 'consortium'],
      metadata: {
        sector: 'life-insurance',
        modality: 'tabular',
        useCases: ['underwriting', 'mortality', 'premium-pricing'],
        dataResidency: 'IN',
        regulatoryFramework: ['IRDAI', 'DPDPA'],
      },
      compatibleModelIds: ['in-fin-model-life-underwriting-logreg', 'in-fin-model-mortality-logreg'],
      featureSchema: ['age', 'smoker_flag', 'bmi', 'sum_assured', 'mortality_risk_band'],
    },
    extraDatasets: [
      {
        datasetId: 'in-fin-lic-annuity-risk',
        name: 'LIC Annuity & Pension Risk (synthetic)',
        description: 'Synthetic annuity payout and longevity risk summaries for consortium actuarial models.',
        category: 'Tabular',
        tags: ['india', 'insurance', 'annuity', 'pension', 'consortium'],
        metadata: {
          sector: 'life-insurance',
          modality: 'tabular',
          useCases: ['longevity', 'annuity-pricing', 'pension-risk'],
          dataResidency: 'IN',
          regulatoryFramework: ['IRDAI', 'DPDPA'],
        },
        compatibleModelIds: ['in-fin-model-mortality-logreg', 'in-fin-model-life-underwriting-logreg'],
        featureSchema: ['payout_years', 'longevity_score', 'inflation_indexed', 'survival_probability'],
      },
    ],
  },
];

/** Base models for consortium training (tabular / local-docker compatible). */
const BASE_MODELS = [
  {
    modelId: 'in-fin-model-credit-logreg',
    name: 'Consortium Credit Score (Logistic Regression)',
    description: 'Pooled retail and NBFC loan default / credit scoring for HDFC and Bajaj lending datasets.',
    type: 'other',
    architecture: 'logistic-regression',
    parameters: 'N/A',
    framework: 'Other',
    privacyTechnique: 'federated-learning',
    validationMetrics: ['accuracy', 'auc', 'f1', 'loss'],
    maxEpochs: 15,
    batchSize: 256,
    learningRate: 0.01,
    useCase: 'lending',
    recommendedTdcSlug: 'lending-pool',
    compatibleDatasetIds: [
      'in-fin-hdfc-retail-loans',
      'in-fin-hdfc-kyc-features',
      'in-fin-bajaj-nbfc-emi',
    ],
  },
  {
    modelId: 'in-fin-model-affordability-logreg',
    name: 'Affordability & EMI Stress Model',
    description: 'Estimates repayment stress and affordability on pooled KYC and collections signals.',
    type: 'other',
    architecture: 'logistic-regression',
    parameters: 'N/A',
    framework: 'Other',
    privacyTechnique: 'federated-learning',
    validationMetrics: ['accuracy', 'loss'],
    maxEpochs: 12,
    batchSize: 128,
    learningRate: 0.02,
    useCase: 'lending',
    recommendedTdcSlug: 'lending-pool',
    compatibleDatasetIds: ['in-fin-hdfc-kyc-features', 'in-fin-bajaj-collections', 'in-fin-bajaj-nbfc-emi'],
  },
  {
    modelId: 'in-fin-model-collections-logreg',
    name: 'NBFC Collections Recovery Model',
    description: 'Predicts recovery likelihood and optimal contact strategy on Bajaj collections data.',
    type: 'other',
    architecture: 'logistic-regression',
    parameters: 'N/A',
    framework: 'Other',
    privacyTechnique: 'federated-learning',
    validationMetrics: ['accuracy', 'precision', 'recall'],
    maxEpochs: 10,
    batchSize: 128,
    learningRate: 0.015,
    useCase: 'lending',
    recommendedTdcSlug: 'lending-pool',
    compatibleDatasetIds: ['in-fin-bajaj-collections', 'in-fin-bajaj-nbfc-emi'],
  },
  {
    modelId: 'in-fin-model-fraud-logreg',
    name: 'Cross-Bank Transaction Fraud Detector',
    description: 'Federated fraud classifier for SBI transaction and HDFC KYC anomaly signals.',
    type: 'other',
    architecture: 'logistic-regression',
    parameters: 'N/A',
    framework: 'Other',
    privacyTechnique: 'federated-learning',
    validationMetrics: ['accuracy', 'precision', 'recall', 'f1'],
    maxEpochs: 20,
    batchSize: 512,
    learningRate: 0.005,
    useCase: 'fraud',
    recommendedTdcSlug: 'finai-consortium',
    compatibleDatasetIds: ['in-fin-sbi-transactions', 'in-fin-sbi-merchant-risk', 'in-fin-hdfc-kyc-features'],
  },
  {
    modelId: 'in-fin-model-aml-gbm',
    name: 'AML Mule-Account Risk Model',
    description: 'Gradient-boosted tabular model for merchant and mule-account AML risk (consortium fraud pool).',
    type: 'other',
    architecture: 'logistic-regression',
    parameters: 'N/A',
    framework: 'Other',
    privacyTechnique: 'federated-learning',
    validationMetrics: ['auc', 'precision', 'recall'],
    maxEpochs: 25,
    batchSize: 256,
    learningRate: 0.008,
    useCase: 'fraud',
    recommendedTdcSlug: 'finai-consortium',
    compatibleDatasetIds: ['in-fin-sbi-transactions', 'in-fin-sbi-merchant-risk'],
  },
  {
    modelId: 'in-fin-model-claims-fraud-logreg',
    name: 'Insurance Claims Fraud Classifier',
    description: 'Detects fraudulent motor and health claims across ICICI Lombard pooled datasets.',
    type: 'other',
    architecture: 'logistic-regression',
    parameters: 'N/A',
    framework: 'Other',
    privacyTechnique: 'differential-privacy',
    validationMetrics: ['accuracy', 'precision', 'recall'],
    maxEpochs: 12,
    batchSize: 128,
    learningRate: 0.01,
    useCase: 'insurance',
    recommendedTdcSlug: 'insurtech-pool',
    compatibleDatasetIds: ['in-fin-icici-motor-claims', 'in-fin-icici-health-claims'],
  },
  {
    modelId: 'in-fin-model-motor-premium-logreg',
    name: 'Motor Premium Pricing Model',
    description: 'Loss-ratio and premium pricing model for motor insurance consortium (IRDAI sandbox).',
    type: 'other',
    architecture: 'logistic-regression',
    parameters: 'N/A',
    framework: 'Other',
    privacyTechnique: 'federated-learning',
    validationMetrics: ['mse', 'mae', 'accuracy'],
    maxEpochs: 15,
    batchSize: 64,
    learningRate: 0.01,
    useCase: 'insurance',
    recommendedTdcSlug: 'insurtech-pool',
    compatibleDatasetIds: ['in-fin-icici-motor-claims'],
  },
  {
    modelId: 'in-fin-model-life-underwriting-logreg',
    name: 'Life Underwriting Risk Model',
    description: 'Underwriting risk bands for LIC life and annuity consortium datasets.',
    type: 'other',
    architecture: 'logistic-regression',
    parameters: 'N/A',
    framework: 'Other',
    privacyTechnique: 'federated-learning',
    validationMetrics: ['accuracy', 'auc'],
    maxEpochs: 12,
    batchSize: 64,
    learningRate: 0.01,
    useCase: 'insurance',
    recommendedTdcSlug: 'insurtech-pool',
    compatibleDatasetIds: ['in-fin-lic-life-risk', 'in-fin-lic-annuity-risk'],
  },
  {
    modelId: 'in-fin-model-mortality-logreg',
    name: 'Mortality & Longevity Actuarial Model',
    description: 'Longevity and mortality risk for LIC life and annuity pooled actuarial features.',
    type: 'other',
    architecture: 'logistic-regression',
    parameters: 'N/A',
    framework: 'Other',
    privacyTechnique: 'federated-learning',
    validationMetrics: ['accuracy', 'loss'],
    maxEpochs: 18,
    batchSize: 64,
    learningRate: 0.008,
    useCase: 'insurance',
    recommendedTdcSlug: 'insurtech-pool',
    compatibleDatasetIds: ['in-fin-lic-life-risk', 'in-fin-lic-annuity-risk'],
  },
  {
    modelId: 'in-fin-model-card-offer-logreg',
    name: 'Credit Card Offer Response Model',
    description: 'Predicts offer uptake on Axis spend and rewards engagement datasets.',
    type: 'other',
    architecture: 'logistic-regression',
    parameters: 'N/A',
    framework: 'Other',
    privacyTechnique: 'federated-learning',
    validationMetrics: ['accuracy', 'auc', 'lift'],
    maxEpochs: 10,
    batchSize: 256,
    learningRate: 0.02,
    useCase: 'credit-cards',
    recommendedTdcSlug: 'card-offers-coop',
    compatibleDatasetIds: ['in-fin-axis-card-spend', 'in-fin-axis-rewards-spend'],
  },
  {
    modelId: 'in-fin-model-card-churn-logreg',
    name: 'Credit Card Churn Predictor',
    description: 'Identifies churn risk from Axis card spend and rewards inactivity patterns.',
    type: 'other',
    architecture: 'logistic-regression',
    parameters: 'N/A',
    framework: 'Other',
    privacyTechnique: 'federated-learning',
    validationMetrics: ['accuracy', 'recall', 'f1'],
    maxEpochs: 12,
    batchSize: 256,
    learningRate: 0.015,
    useCase: 'credit-cards',
    recommendedTdcSlug: 'card-offers-coop',
    compatibleDatasetIds: ['in-fin-axis-card-spend', 'in-fin-axis-rewards-spend'],
  },
];

const MODEL_CONSUMERS = [
  {
    slug: 'finai-consortium',
    name: 'India FinAI Consortium — Fraud',
    organization: 'India FinAI Consortium',
    description:
      'TDC: coordinates cross-bank federated fraud models using pooled transaction signals from member banks.',
    useCase: 'fraud',
  },
  {
    slug: 'lending-pool',
    name: 'National Lending Risk Pool',
    organization: 'National Lending Risk Pool (NLRP)',
    description:
      'TDC: builds consortium credit-risk and loan-default models across banks and NBFCs.',
    useCase: 'lending',
  },
  {
    slug: 'insurtech-pool',
    name: 'InsurTech Analytics Pool',
    organization: 'InsurTech Analytics Pool',
    description:
      'TDC: pools insurer claims data for pricing, fraud, and loss-ratio models under IRDAI guidelines.',
    useCase: 'insurance',
  },
  {
    slug: 'card-offers-coop',
    name: 'Card Offers Cooperative',
    organization: 'Card Offers Cooperative',
    description:
      'TDC: trains offer-targeting and limit-increase models on pooled card spend from issuer members.',
    useCase: 'credit-cards',
  },
];

const COMPUTE_PROVIDERS = [
  {
    slug: 'yotta',
    name: 'Yotta Data Services — TSP',
    organization: 'Yotta Data Services (Mumbai)',
    description: 'TSP: RBI-aligned confidential compute in Mumbai for federated financial ML workloads.',
    cloudProviders: ['OCI'],
  },
  {
    slug: 'esds',
    name: 'ESDS India — TSP',
    organization: 'ESDS Software Solution Pvt Ltd',
    description: 'TSP: India data-centre confidential clean rooms for banking and insurance consortium training.',
    cloudProviders: ['Azure'],
  },
];

const PLATFORM_ADMIN = {
  slug: 'in-fin-trust',
  name: 'India Financial Data Trust — Platform Admin',
  organization: 'India Financial Data Trust Platform',
  description:
    'AppAdmin: operates the India financial data-trust platform for DPDPA-compliant consortium ML.',
};

function emailFor({ slug, partyType }) {
  return `${partyType.toLowerCase()}.${slug}@in-fintech-test.com`;
}

function buildRegisterBody(spec) {
  return {
    name: spec.name,
    email: emailFor(spec),
    password: DEFAULT_PASSWORD,
    partyType: spec.partyType,
    organization: spec.organization,
    description: spec.description,
    location: DEPLOYMENT.country,
    globalDEPAId: true,
    deploymentPrefix: DEPLOYMENT.deploymentPrefix,
    jurisdiction: DEPLOYMENT.jurisdiction,
  };
}

function apiError(err) {
  return err.response?.data?.error || err.response?.data?.message || err.message;
}

async function apiLogin(email, password = DEFAULT_PASSWORD) {
  const res = await axios.post(`${BACKEND_URL}/api/auth/login`, { email, password }, { timeout: 15000 });
  return res.data;
}

async function apiRegister(body) {
  const res = await axios.post(`${BACKEND_URL}/api/auth/register`, body, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
  });
  return res.data;
}

async function apiFirstLoginPassword(email, currentPassword, newPassword) {
  await axios.post(
    `${BACKEND_URL}/api/auth/first-login-password`,
    { email, currentPassword, newPassword },
    { timeout: 15000 }
  );
}

/** Idempotent user ensure via register + login APIs only. */
async function apiEnsureUser(spec) {
  const email = emailFor(spec);

  try {
    const session = await apiLogin(email);
    if (session?.accessToken) {
      return { status: 'exists', email, user: session.user, accessToken: session.accessToken };
    }
  } catch (_) {
    // register below
  }

  try {
    const reg = await apiRegister(buildRegisterBody(spec));
    const temp = reg?.loginCredentials?.password;
    if (temp && temp !== DEFAULT_PASSWORD) {
      await apiFirstLoginPassword(email, temp, DEFAULT_PASSWORD);
    }
    const session = await apiLogin(email);
    return { status: 'created', email, user: session.user, accessToken: session.accessToken };
  } catch (err) {
    if (err.response?.status === 409) {
      try {
        const session = await apiLogin(email);
        return { status: 'exists', email, user: session.user, accessToken: session.accessToken };
      } catch (loginErr) {
        return { status: 'failed', email, error: apiError(loginErr) };
      }
    }
    return { status: 'failed', email, error: apiError(err) };
  }
}

async function apiUpdateCloudProviders(userId, adminToken, cloudProviders) {
  await axios.put(
    `${BACKEND_URL}/api/users/${userId}`,
    { cloudProviders },
    { headers: { Authorization: `Bearer ${adminToken}` }, timeout: 15000 }
  );
}

async function apiEnsureDataset(accessToken, ownerId, datasetSpec) {
  const headers = { Authorization: `Bearer ${accessToken}` };
  const { datasetId } = datasetSpec;
  const metadata = {
    ...(datasetSpec.metadata || {}),
    seededBy: 'india-financial-api',
    consortium: DEPLOYMENT.deploymentPrefix,
    compatibleModelIds: datasetSpec.compatibleModelIds || [],
    featureSchema: datasetSpec.featureSchema || [],
  };

  const body = {
    datasetId,
    name: datasetSpec.name,
    description: datasetSpec.description,
    category: datasetSpec.category,
    domain: datasetSpec.domain || 'Finance',
    size: 50000,
    recordCount: 250000,
    price: 100,
    license: 'Consortium-Internal-DPDPA',
    tags: datasetSpec.tags || [],
    metadata,
    isPublic: true,
    confidentialComputingRequired: true,
    ownerId,
    data_residency_region: DEPLOYMENT.region,
    processing_location: DEPLOYMENT.region,
    cross_border_transfer_allowed: false,
    data_classification: 'CONFIDENTIAL',
  };

  try {
    await axios.get(`${BACKEND_URL}/api/datasets/${encodeURIComponent(datasetId)}`, { headers });
    await axios.put(`${BACKEND_URL}/api/datasets/${encodeURIComponent(datasetId)}`, {
      name: body.name,
      description: body.description,
      domain: body.domain,
      tags: body.tags,
      metadata: body.metadata,
      isPublic: true,
      isActive: true,
      data_residency_region: DEPLOYMENT.region,
    });
    return { status: 'exists', datasetId };
  } catch (err) {
    if (err.response?.status !== 404) throw err;
  }

  await axios.post(`${BACKEND_URL}/api/datasets`, body, { headers });
  return { status: 'created', datasetId };
}

function buildModelPayload(spec) {
  const {
    modelId,
    name,
    description,
    type,
    architecture,
    parameters,
    framework,
    privacyTechnique,
    validationMetrics,
    maxEpochs,
    batchSize,
    learningRate,
    useCase,
    recommendedTdcSlug,
    compatibleDatasetIds,
  } = spec;
  return {
    modelId,
    name,
    description,
    type,
    architecture,
    parameters,
    framework,
    privacyTechnique,
    validationMetrics,
    maxEpochs,
    batchSize,
    learningRate,
    metadata: {
      seededBy: 'india-financial-api',
      modalityHint: 'tabular',
      useCase,
      consortium: DEPLOYMENT.deploymentPrefix,
      jurisdiction: DEPLOYMENT.jurisdiction,
      recommendedTdcSlug,
      compatibleDatasetIds,
      trainingParamsHint: {
        taskType: 'tabular',
        framework: 'Other',
        architecture,
        maxEpochs,
        batchSize,
        learningRate,
        privacyTechnique,
        validationMetrics,
      },
    },
  };
}

async function apiEnsureAiModel(accessToken, spec) {
  const headers = { Authorization: `Bearer ${accessToken}` };
  const payload = buildModelPayload(spec);

  try {
    await axios.get(`${BACKEND_URL}/api/ai-models/${encodeURIComponent(spec.modelId)}`, { headers });
    await axios.put(`${BACKEND_URL}/api/ai-models/${encodeURIComponent(spec.modelId)}`, {
      description: payload.description,
      metadata: payload.metadata,
    }, { headers });
    return { status: 'exists', modelId: spec.modelId, useCase: spec.useCase };
  } catch (err) {
    if (err.response?.status !== 404) throw err;
  }

  await axios.post(`${BACKEND_URL}/api/ai-models`, payload, { headers });
  return { status: 'created', modelId: spec.modelId, useCase: spec.useCase };
}

async function main() {
  console.log('🇮🇳 India financial seed (API-only)');
  console.log(`📡 ${BACKEND_URL}`);
  console.log(`🔑 ${DEFAULT_PASSWORD}`);
  console.log(`📍 ${DEPLOYMENT.deploymentPrefix} / ${DEPLOYMENT.jurisdiction}`);

  await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 });

  const results = { users: [], datasets: [], models: [] };

  const adminSpec = { ...PLATFORM_ADMIN, partyType: 'AppAdmin' };
  const adminResult = await apiEnsureUser(adminSpec);
  console.log(`👤 ${adminResult.email} — ${adminResult.status}`);
  results.users.push({ ...adminResult, ...adminSpec, useCase: 'platform' });

  const adminToken = adminResult.accessToken;

  for (const tdp of DATA_PROVIDERS) {
    const spec = { ...tdp, partyType: 'TDP' };
    const r = await apiEnsureUser(spec);
    console.log(`👤 ${r.email} — ${r.status} (TDP / ${tdp.useCase})`);
    results.users.push({ ...r, partyType: 'TDP', slug: tdp.slug, useCase: tdp.useCase, organization: tdp.organization });

    if (r.accessToken && r.user?.id) {
      const datasetSpecs = [tdp.dataset, ...(tdp.extraDatasets || [])].filter(Boolean);
      for (const dsSpec of datasetSpecs) {
        try {
          const ds = await apiEnsureDataset(r.accessToken, r.user.id, dsSpec);
          console.log(`   📊 ${ds.datasetId} — ${ds.status}`);
          results.datasets.push({ ...ds, ownerEmail: r.email, useCase: tdp.useCase });
        } catch (err) {
          console.warn(`   ⚠️ dataset ${dsSpec.datasetId}: ${apiError(err)}`);
          results.datasets.push({ status: 'failed', datasetId: dsSpec.datasetId, error: apiError(err) });
        }
      }
    }
    await new Promise((r) => setTimeout(r, 350));
  }

  for (const tdc of MODEL_CONSUMERS) {
    const spec = { ...tdc, partyType: 'TDC' };
    const r = await apiEnsureUser(spec);
    console.log(`👤 ${r.email} — ${r.status} (TDC / ${tdc.useCase})`);
    results.users.push({ ...r, partyType: 'TDC', slug: tdc.slug, useCase: tdc.useCase, organization: tdc.organization });
    await new Promise((r) => setTimeout(r, 350));
  }

  for (const tsp of COMPUTE_PROVIDERS) {
    const spec = { ...tsp, partyType: 'TSP' };
    const r = await apiEnsureUser(spec);
    console.log(`👤 ${r.email} — ${r.status} (TSP)`);
    if (r.user?.id && adminToken && tsp.cloudProviders) {
      try {
        await apiUpdateCloudProviders(r.user.id, adminToken, tsp.cloudProviders);
        r.cloudProviders = tsp.cloudProviders;
      } catch (err) {
        r.cloudProvidersError = apiError(err);
      }
    }
    results.users.push({ ...r, partyType: 'TSP', slug: tsp.slug, organization: tsp.organization });
    await new Promise((r) => setTimeout(r, 350));
  }

  if (adminToken) {
    console.log('\n🤖 Base models (catalog via AppAdmin API)');
    for (const model of BASE_MODELS) {
      try {
        const m = await apiEnsureAiModel(adminToken, model);
        console.log(`   ${m.modelId} — ${m.status} (${model.useCase})`);
        results.models.push({ ...m, name: model.name, compatibleDatasetIds: model.compatibleDatasetIds });
      } catch (err) {
        console.warn(`   ⚠️ ${model.modelId}: ${apiError(err)}`);
        results.models.push({ status: 'failed', modelId: model.modelId, error: apiError(err) });
      }
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    seedMethod: 'api-only',
    backendUrl: BACKEND_URL,
    password: DEFAULT_PASSWORD,
    deployment: DEPLOYMENT,
    scenario:
      'Indian banks, insurers, NBFCs, and card issuers pooling synthetic data for consortium ML (lending, fraud, insurance, card offers).',
    totals: {
      usersCreated: results.users.filter((u) => u.status === 'created').length,
      usersExisted: results.users.filter((u) => u.status === 'exists').length,
      usersFailed: results.users.filter((u) => u.status === 'failed').length,
      datasetsCreated: results.datasets.filter((d) => d.status === 'created').length,
      datasetsExisted: results.datasets.filter((d) => d.status === 'exists').length,
      datasetsFailed: results.datasets.filter((d) => d.status === 'failed').length,
      modelsCreated: results.models.filter((m) => m.status === 'created').length,
      modelsExisted: results.models.filter((m) => m.status === 'exists').length,
      modelsFailed: results.models.filter((m) => m.status === 'failed').length,
    },
    users: results.users.map((u) => ({
      status: u.status,
      email: u.email,
      partyType: u.partyType,
      slug: u.slug,
      useCase: u.useCase,
      organization: u.organization,
      depaId: u.user?.depaId || null,
      userId: u.user?.id || null,
      cloudProviders: u.cloudProviders || null,
      error: u.error || null,
    })),
    datasets: results.datasets,
    models: results.models,
    suggestedContracts: [
      {
        name: 'Cross-bank fraud consortium',
        tdc: emailFor({ slug: 'finai-consortium', partyType: 'TDC' }),
        tdps: [
          emailFor({ slug: 'sbi', partyType: 'TDP' }),
          emailFor({ slug: 'hdfc', partyType: 'TDP' }),
        ],
        tsp: emailFor({ slug: 'yotta', partyType: 'TSP' }),
        datasets: ['in-fin-sbi-transactions', 'in-fin-sbi-merchant-risk', 'in-fin-hdfc-kyc-features'],
        aiModelIds: ['in-fin-model-fraud-logreg', 'in-fin-model-aml-gbm'],
      },
      {
        name: 'National lending risk pool',
        tdc: emailFor({ slug: 'lending-pool', partyType: 'TDC' }),
        tdps: [
          emailFor({ slug: 'hdfc', partyType: 'TDP' }),
          emailFor({ slug: 'bajaj-finance', partyType: 'TDP' }),
        ],
        tsp: emailFor({ slug: 'esds', partyType: 'TSP' }),
        datasets: [
          'in-fin-hdfc-retail-loans',
          'in-fin-hdfc-kyc-features',
          'in-fin-bajaj-nbfc-emi',
          'in-fin-bajaj-collections',
        ],
        aiModelIds: [
          'in-fin-model-credit-logreg',
          'in-fin-model-affordability-logreg',
          'in-fin-model-collections-logreg',
        ],
      },
      {
        name: 'Insurance pricing & claims fraud',
        tdc: emailFor({ slug: 'insurtech-pool', partyType: 'TDC' }),
        tdps: [
          emailFor({ slug: 'icici-insurance', partyType: 'TDP' }),
          emailFor({ slug: 'lic', partyType: 'TDP' }),
        ],
        tsp: emailFor({ slug: 'yotta', partyType: 'TSP' }),
        datasets: [
          'in-fin-icici-motor-claims',
          'in-fin-icici-health-claims',
          'in-fin-lic-life-risk',
          'in-fin-lic-annuity-risk',
        ],
        aiModelIds: [
          'in-fin-model-claims-fraud-logreg',
          'in-fin-model-motor-premium-logreg',
          'in-fin-model-life-underwriting-logreg',
          'in-fin-model-mortality-logreg',
        ],
      },
      {
        name: 'Card offers cooperative',
        tdc: emailFor({ slug: 'card-offers-coop', partyType: 'TDC' }),
        tdps: [emailFor({ slug: 'axis-cards', partyType: 'TDP' })],
        tsp: emailFor({ slug: 'esds', partyType: 'TSP' }),
        datasets: ['in-fin-axis-card-spend', 'in-fin-axis-rewards-spend'],
        aiModelIds: ['in-fin-model-card-offer-logreg', 'in-fin-model-card-churn-logreg'],
      },
    ],
  };

  const outPath = path.join(__dirname, '..', 'fixtures', 'test-data', 'india-financial-users-data.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));

  console.log('\n📊 Summary');
  console.log(`   Users: ${summary.totals.usersCreated} created, ${summary.totals.usersExisted} existed, ${summary.totals.usersFailed} failed`);
  console.log(`   Datasets: ${summary.totals.datasetsCreated} created, ${summary.totals.datasetsExisted} existed, ${summary.totals.datasetsFailed} failed`);
  console.log(`   Models: ${summary.totals.modelsCreated} created, ${summary.totals.modelsExisted} existed, ${summary.totals.modelsFailed} failed`);
  console.log(`💾 ${outPath}`);

  if (summary.totals.usersFailed > 0 || summary.totals.datasetsFailed > 0 || summary.totals.modelsFailed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('❌', err.message);
    process.exit(1);
  });
}

module.exports = { DATA_PROVIDERS, MODEL_CONSUMERS, COMPUTE_PROVIDERS, BASE_MODELS, DEPLOYMENT, emailFor };
