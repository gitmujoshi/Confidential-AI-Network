/**
 * Shared OCI scaffold mock — single source of truth for TSP OCI Vault / KMS,
 * confidential compute, contract environmentSpecs, training job, logs, and provenance.
 * Not live OCIDs — placeholders for architecture walkthroughs and demos.
 */

export const OCI_SCAFFOLD_FLAGS = {
  enable_vault: true,
  enable_object_storage: true,
  enable_edge: true,
  enable_training: true,
  enable_scitt: true,
  enable_spire: true,
  enable_wif: true,
  AUTH_PROVIDER: 'oci-iam',
  TRAINING_EXECUTION_MODE: 'oci-oke-job',
  SECRET_BACKEND: 'oci-vault',
  DATASET_STORAGE_BACKEND: 'oci-object',
  CAN_ATTESTATION_PROVIDER: 'oci-attestation',
};

/** Canonical shared IDs / OCI refs used on every surface. */
export const OCI_SHARED = {
  region: 'us-ashburn-1',
  cloudProvider: 'OCI',
  secretManager: 'OCI_VAULT',
  kmsProviderUi: 'oci-vault', // CreateRicardianContract select value
  kmsProviderConfig: 'OCI_VAULT', // kmsConfigs / TSP secretManager
  vault: {
    displayName: 'cms-dev-vault',
    vaultOcid: 'ocid1.vault.oc1.iad.amaaaaaexamplevault',
    masterKeyOcid: 'ocid1.key.oc1.iad.amaaaaaexamplemaster',
    signingKeyOcid: 'ocid1.key.oc1.iad.amaaaaaexamplesignkey',
    compartmentOcid: 'ocid1.compartment.oc1..aaaaaaaexample',
    purpose: ['app secrets', 'signing keys', 'SSE-KMS for Object Storage', 'DEK/MEK escrow'],
  },
  tspVault: {
    vaultOcid: 'ocid1.vault.oc1.iad.amaaaaaexampletspvault',
    compartmentId: 'ocid1.compartment.oc1..aaaaaaaexampletsp',
  },
  objectStorage: {
    namespace: 'idushexample',
    datasets: 'cms-dev-datasets',
    outputs: 'cms-dev-training-outputs',
    artifacts: 'cms-dev-artifacts',
  },
  confidentialCompute: {
    computeType: 'confidential-vm',
    platform: 'OCI Confidential Computing',
    okeCluster: 'contract-management-cluster',
    trainingNamespace: 'cms-training',
    serviceAccount: 'training-job-sa',
    spiffeId: 'spiffe://can.dev.oci.example/ns/cms-training/sa/training-job-sa',
    attestationProvider: 'oci-attestation',
    tee: 'Confidential VM shape (operator-selected)',
    features: [
      'Isolated training Job on OKE',
      'Object Storage ciphertext in / ciphertext out',
      'SPIFFE peer identity before key release',
      'No long-lived API keys (Workload Identity / WIF)',
      'OCI Vault for DEK/MEK and signing keys',
    ],
  },
  parties: {
    tdc: 'US-EAST-TDC-11112222-3333-4444-5555-666677778888',
    tdp: 'US-EAST-TDP-a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    tsp: 'US-EAST-TSP-f0e1d2c3-b4a5-6789-abcd-112233445566',
  },
  contractId: 'CONTRACT-oci-scaffold-demo-001',
  contractDepaId: 'US-EAST-CONTRACT-99887766-5544-3322-1100-aabbccddeeff',
  jobId: 'job-CONTRACT-oci-scaffold-demo-001-1722172800000',
};

export const OCI_ONBOARDING_MOCK = {
  party: {
    depaId: OCI_SHARED.parties.tdp,
    partyType: 'TDP',
    displayName: 'Acme Health Data Cooperative',
    identityProvider: 'OCI IAM Identity Domains',
  },
  signingKey: {
    algorithm: 'ECDSA_P256',
    keyId: 'sign-key-oci-dev-001',
    backend: 'oci-vault',
    vaultOcid: OCI_SHARED.vault.vaultOcid,
    keyOcid: OCI_SHARED.vault.signingKeyOcid,
    status: 'active',
    createdAt: '2026-07-28T12:00:00.000Z',
  },
  vault: {
    displayName: OCI_SHARED.vault.displayName,
    vaultOcid: OCI_SHARED.vault.vaultOcid,
    masterKeyOcid: OCI_SHARED.vault.masterKeyOcid,
    compartmentOcid: OCI_SHARED.vault.compartmentOcid,
    region: OCI_SHARED.region,
    purpose: OCI_SHARED.vault.purpose,
  },
};

export const OCI_TSP_ENV_MOCK = {
  tsp: {
    depaId: OCI_SHARED.parties.tsp,
    displayName: 'SecureClean Rooms LLC',
    email: 'tsp.oci.e2e@test.com',
    role: 'OCI infrastructure provider',
    cloudProvider: OCI_SHARED.cloudProvider,
    secretManager: OCI_SHARED.secretManager,
    note: 'OCI tenancy — confidential compute, Vault KMS, and OKE Jobs',
  },
  credentials: {
    compartmentId: OCI_SHARED.tspVault.compartmentId,
    userId: 'ocid1.user.oc1..aaaaaaaexampleapi',
    fingerprint: 'https://example.invalid/fingerprint',
    region: OCI_SHARED.region,
    authMethod: 'API_KEY',
    vaultOcid: OCI_SHARED.tspVault.vaultOcid,
    vaultId: OCI_SHARED.tspVault.vaultOcid, // alias used by TSPCloudCredentials / KMS client
  },
  confidentialCompute: { ...OCI_SHARED.confidentialCompute },
};

/** Contract environmentSpecs + kmsConfigs derived from shared TSP / Vault / compute. */
export function buildOciContractEnvironmentSpecs(overrides = {}) {
  const cc = OCI_SHARED.confidentialCompute;
  const os = OCI_SHARED.objectStorage;
  return {
    type: 'cloud',
    infrastructure: {
      cloudProvider: OCI_SHARED.cloudProvider,
      region: OCI_SHARED.region,
      computeType: cc.computeType,
      platform: cc.platform,
      okeCluster: cc.okeCluster,
      trainingNamespace: cc.trainingNamespace,
      serviceAccount: cc.serviceAccount,
      spiffeId: cc.spiffeId,
      memoryGB: 32,
      cpuCores: 8,
      gpuType: 'A100',
      gpuCount: 2,
      objectStorage: { ...os },
      ...(overrides.infrastructure || {}),
    },
    security: {
      attestationRequired: true,
      attestationProvider: cc.attestationProvider,
      encryptionAtRest: true,
      encryptionInTransit: true,
      networkIsolation: true,
      privateEndpoints: true,
      spiffeRequired: true,
      ...(overrides.security || {}),
    },
    kms: {
      provider: OCI_SHARED.kmsProviderUi,
      vaultOcid: OCI_SHARED.vault.vaultOcid,
      keyVault: OCI_SHARED.vault.vaultOcid, // alias for Azure-shaped ContractDetail field
      keyId: OCI_SHARED.vault.masterKeyOcid,
      algorithm: 'AES-256-GCM',
      rotationPeriod: 90,
      keyName: 'training-data-key',
      region: OCI_SHARED.region,
      ...(overrides.kms || {}),
    },
  };
}

export function buildOciKmsConfigs(envSpecs) {
  const kms = envSpecs?.kms || {};
  return {
    provider: OCI_SHARED.kmsProviderConfig,
    vaultOcid: kms.vaultOcid || OCI_SHARED.vault.vaultOcid,
    masterKeyOcid: kms.keyId || OCI_SHARED.vault.masterKeyOcid,
    signingKeyOcid: OCI_SHARED.vault.signingKeyOcid,
    region: kms.region || OCI_SHARED.region,
    algorithm: kms.algorithm || 'AES-256-GCM',
    rotationPeriod: kms.rotationPeriod || 90,
    dekEscrow: 'CAN dual-key (design)',
    mekEscrow: 'CAN dual-key (design)',
    secretManager: OCI_SHARED.secretManager,
    tspCompartmentId: OCI_SHARED.tspVault.compartmentId,
    tspVaultOcid: OCI_SHARED.tspVault.vaultOcid,
  };
}

/** Merge OCI TSP defaults into create-contract environmentSpecs (preserves user edits where set). */
export function applyOciTspEnvironmentDefaults(prev = {}) {
  const oci = buildOciContractEnvironmentSpecs();
  return {
    ...prev,
    type: prev.type || 'cloud',
    infrastructure: {
      ...oci.infrastructure,
      ...(prev.infrastructure || {}),
      cloudProvider: OCI_SHARED.cloudProvider,
      region: prev.infrastructure?.region || oci.infrastructure.region,
      computeType: prev.infrastructure?.computeType || oci.infrastructure.computeType,
      platform: oci.infrastructure.platform,
      okeCluster: oci.infrastructure.okeCluster,
      trainingNamespace: oci.infrastructure.trainingNamespace,
      serviceAccount: oci.infrastructure.serviceAccount,
      spiffeId: oci.infrastructure.spiffeId,
      objectStorage: {
        ...oci.infrastructure.objectStorage,
        ...(prev.infrastructure?.objectStorage || {}),
      },
    },
    security: {
      ...oci.security,
      ...(prev.security || {}),
      attestationProvider: oci.security.attestationProvider,
      spiffeRequired: true,
    },
    kms: {
      ...oci.kms,
      ...(prev.kms || {}),
      provider: OCI_SHARED.kmsProviderUi,
      vaultOcid: prev.kms?.vaultOcid || oci.kms.vaultOcid,
      keyVault: prev.kms?.vaultOcid || prev.kms?.keyVault || oci.kms.vaultOcid,
      keyId: prev.kms?.keyId || oci.kms.keyId,
      region: prev.kms?.region || oci.kms.region,
      algorithm: prev.kms?.algorithm || oci.kms.algorithm,
      rotationPeriod: prev.kms?.rotationPeriod || oci.kms.rotationPeriod,
    },
  };
}

export const OCI_CONTRACT_MOCK = {
  contractId: OCI_SHARED.contractId,
  depaId: OCI_SHARED.contractDepaId,
  title: 'Governed NLP fine-tune on regulated health notes (OCI)',
  status: 'SIGNED',
  tspCloudProvider: OCI_SHARED.cloudProvider,
  parties: { ...OCI_SHARED.parties },
  environmentSpecs: buildOciContractEnvironmentSpecs(),
  kmsConfigs: buildOciKmsConfigs(buildOciContractEnvironmentSpecs()),
  tsp: {
    depaId: OCI_TSP_ENV_MOCK.tsp.depaId,
    displayName: OCI_TSP_ENV_MOCK.tsp.displayName,
    cloudProvider: OCI_SHARED.cloudProvider,
    secretManager: OCI_SHARED.secretManager,
    confidentialCompute: OCI_SHARED.confidentialCompute,
    credentialsRef: {
      compartmentId: OCI_SHARED.tspVault.compartmentId,
      vaultOcid: OCI_SHARED.tspVault.vaultOcid,
      region: OCI_SHARED.region,
      authMethod: 'API_KEY',
    },
  },
};

export const OCI_TRAINING_JOB_MOCK = {
  jobId: OCI_SHARED.jobId,
  contractId: OCI_SHARED.contractId,
  status: 'COMPLETED',
  executionMode: 'oci-oke-job',
  simulation: true,
  progress: 100,
  createdAt: '2026-07-28T15:30:00.000Z',
  startedAt: '2026-07-28T15:30:05.000Z',
  completedAt: '2026-07-28T15:45:00.000Z',
  environmentSummary: {
    cloudProvider: OCI_SHARED.cloudProvider,
    region: OCI_SHARED.region,
    computeType: OCI_SHARED.confidentialCompute.computeType,
    platform: OCI_SHARED.confidentialCompute.platform,
    okeCluster: OCI_SHARED.confidentialCompute.okeCluster,
    trainingNamespace: OCI_SHARED.confidentialCompute.trainingNamespace,
    serviceAccount: OCI_SHARED.confidentialCompute.serviceAccount,
    spiffeId: OCI_SHARED.confidentialCompute.spiffeId,
    attestationProvider: OCI_SHARED.confidentialCompute.attestationProvider,
    secretManager: OCI_SHARED.secretManager,
    kms: {
      provider: OCI_SHARED.kmsProviderConfig,
      vaultOcid: OCI_SHARED.vault.vaultOcid,
      masterKeyOcid: OCI_SHARED.vault.masterKeyOcid,
    },
    objectStorage: { ...OCI_SHARED.objectStorage },
    tspDepaId: OCI_SHARED.parties.tsp,
  },
  results: {
    mode: 'oci-oke-job-simulation',
    namespace: OCI_SHARED.confidentialCompute.trainingNamespace,
    spiffeId: OCI_SHARED.confidentialCompute.spiffeId,
    objectStorage: {
      ...OCI_SHARED.objectStorage,
      outputsPrefix: `${OCI_SHARED.objectStorage.outputs}/demo/outputs/`,
    },
    kms: {
      provider: OCI_SHARED.kmsProviderConfig,
      vaultOcid: OCI_SHARED.vault.vaultOcid,
      keyRelease: 'gated-on-SIGNED+SPIFFE',
    },
  },
};

/** Multiline trainer / OKE submitter log — same Vault / SPIFFE / buckets as contract. */
export const OCI_TRAINING_LOGS_MOCK = [
  `[oci-oke-job] contract=${OCI_SHARED.contractId} job=${OCI_SHARED.jobId}`,
  `[oci-oke-job] tsp=${OCI_SHARED.parties.tsp} cloudProvider=OCI secretManager=OCI_VAULT`,
  `[oci-oke-job] region=${OCI_SHARED.region} computeType=${OCI_SHARED.confidentialCompute.computeType}`,
  `[oci-oke-job] platform=${OCI_SHARED.confidentialCompute.platform}`,
  `[oci-oke-job] okeCluster=${OCI_SHARED.confidentialCompute.okeCluster} ns=${OCI_SHARED.confidentialCompute.trainingNamespace}`,
  `[oci-oke-job] serviceAccount=${OCI_SHARED.confidentialCompute.serviceAccount}`,
  `[oci-oke-job] spiffeId=${OCI_SHARED.confidentialCompute.spiffeId}`,
  `[oci-oke-job] attestation=${OCI_SHARED.confidentialCompute.attestationProvider}`,
  `[kms] provider=OCI_VAULT vaultOcid=${OCI_SHARED.vault.vaultOcid}`,
  `[kms] masterKeyOcid=${OCI_SHARED.vault.masterKeyOcid} signingKeyOcid=${OCI_SHARED.vault.signingKeyOcid}`,
  `[kms] awaiting key release: contract SIGNED + SPIFFE allowlist`,
  `[storage] namespace=${OCI_SHARED.objectStorage.namespace}`,
  `[storage] datasets=${OCI_SHARED.objectStorage.datasets} outputs=${OCI_SHARED.objectStorage.outputs}`,
  `[storage] artifacts=${OCI_SHARED.objectStorage.artifacts}`,
  `[wif] workload identity exchange for training-job-sa (design)`,
  `[trainer] ciphertext-in from Object Storage; no plaintext datasets on host`,
  `[trainer] epoch 1/3 loss=0.82`,
  `[trainer] epoch 2/3 loss=0.41`,
  `[trainer] epoch 3/3 loss=0.19`,
  `[kms] DEK/MEK release granted; writing encrypted artifacts`,
  `[oci-oke-job] COMPLETED outputs=${OCI_SHARED.objectStorage.outputs}/demo/outputs/`,
].join('\n');

/**
 * Provenance shaped like live buildProvenanceAuditReport, embedding shared OCI context.
 */
export const OCI_PROVENANCE_MOCK = {
  generatedAt: '2026-07-28T16:00:00.000Z',
  contractId: OCI_SHARED.contractId,
  reportType: 'contract-provenance-audit',
  _source: 'oci-scaffold-mock',
  contract: {
    contractId: OCI_SHARED.contractId,
    status: 'SIGNED',
    depaId: OCI_SHARED.contractDepaId,
    tdcDepaId: OCI_SHARED.parties.tdc,
    ccrpDepaId: OCI_SHARED.parties.tsp,
    tspCloudProvider: OCI_SHARED.cloudProvider,
    environmentSpecs: OCI_CONTRACT_MOCK.environmentSpecs,
    kmsConfigs: OCI_CONTRACT_MOCK.kmsConfigs,
    legalDocumentPresent: true,
    signatureCount: 3,
  },
  trainingJobs: [OCI_TRAINING_JOB_MOCK],
  scittClaims: [
    {
      claimId: 'claim-contract-signed-oci-demo',
      claimType: 'contract.signed',
      status: 'recorded',
      claimData: {
        ledger: 'SCITT CCF',
        parties: ['TDC', 'TDP', 'TSP'],
        tspCloudProvider: OCI_SHARED.cloudProvider,
        kmsProvider: OCI_SHARED.kmsProviderConfig,
        vaultOcid: OCI_SHARED.vault.vaultOcid,
      },
      createdAt: '2026-07-28T14:10:00.000Z',
    },
    {
      claimId: 'claim-training-completed-oci-demo',
      claimType: 'training.job.completed',
      status: 'recorded',
      claimData: {
        jobId: OCI_SHARED.jobId,
        executionMode: 'oci-oke-job',
        simulation: true,
        spiffeId: OCI_SHARED.confidentialCompute.spiffeId,
        computeType: OCI_SHARED.confidentialCompute.computeType,
        vaultOcid: OCI_SHARED.vault.vaultOcid,
        objectStorageOutputs: `${OCI_SHARED.objectStorage.outputs}/demo/outputs/`,
      },
      createdAt: '2026-07-28T15:45:00.000Z',
    },
    {
      claimId: 'claim-keys-released-oci-demo',
      claimType: 'keys.released',
      status: 'recorded',
      claimData: {
        note: 'DEK/MEK release gated on contract SIGNED + SPIFFE allowlist (+ attestation when live)',
        vaultOcid: OCI_SHARED.vault.vaultOcid,
        masterKeyOcid: OCI_SHARED.vault.masterKeyOcid,
        secretManager: OCI_SHARED.secretManager,
      },
      createdAt: '2026-07-28T15:40:00.000Z',
    },
  ],
  registeredModels: [],
  deployment: {
    prefix: 'US-EAST',
    cloud: 'OCI',
    scaffolds: OCI_SCAFFOLD_FLAGS,
  },
  integrity: {
    hashAlgorithm: 'SHA-256',
    bundleDigest: 'sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    note: 'Mock digest for UI demo — live reports use SCITT receipts when SCITT_CCF_ENABLED=true',
  },
  interpretation: {
    scittClaims:
      'Rows are lightweight markers. Use contract.environmentSpecs / kmsConfigs and trainingJobs.environmentSummary for full OCI Vault + confidential compute audit depth.',
  },
};

export const OCI_E2E_PARTIES = [
  {
    role: 'TDC',
    label: 'Training Data Consumer',
    organization: 'Northstar Health AI',
    depaId: OCI_SHARED.parties.tdc,
    identityProvider: 'OCI IAM Identity Domains',
    dashboard: 'Browse catalogs, create contracts, start OCI OKE training, deploy inference',
  },
  {
    role: 'TDP',
    label: 'Training Data Provider',
    organization: 'Acme Health Data Cooperative',
    depaId: OCI_SHARED.parties.tdp,
    identityProvider: 'OCI IAM Identity Domains',
    signingKeyBackend: 'oci-vault',
    vaultOcid: OCI_SHARED.vault.vaultOcid,
    dashboard: 'Publish datasets, sign contracts, review provenance',
  },
  {
    role: 'TSP',
    label: 'Tech Service Provider',
    organization: OCI_TSP_ENV_MOCK.tsp.displayName,
    email: OCI_TSP_ENV_MOCK.tsp.email,
    depaId: OCI_SHARED.parties.tsp,
    identityProvider: 'OCI IAM Identity Domains',
    cloudProvider: 'OCI',
    secretManager: 'OCI_VAULT',
    compute: OCI_SHARED.confidentialCompute.computeType,
    infrastructure: 'OKE · confidential-vm · Vault',
    dashboard:
      'OCI infrastructure TSP — SecureClean Rooms (tsp.oci.e2e@test.com): confidential-vm on OKE, OCI Vault KMS, Object Storage, SPIFFE/WIF Jobs',
  },
];

export const OCI_CATALOG_MOCK = {
  dataset: {
    name: 'Regulated health notes (NLP)',
    modality: 'text',
    reference: 'Hugging Face ag_news (demo reference)',
    storage: `oci://${OCI_SHARED.objectStorage.namespace}/${OCI_SHARED.objectStorage.datasets}`,
    ownerDepaId: OCI_SHARED.parties.tdp,
  },
  model: {
    name: 'DistilBERT quality (NLP)',
    framework: 'PyTorch',
    architecture: 'distilbert-base-uncased',
    privacy: 'Differential privacy optional',
  },
};

export const OCI_INFERENCE_MOCK = {
  modelId: 'MODEL-oci-scaffold-demo-001',
  status: 'DEPLOYED',
  endpoint: 'https://inference.can.dev.oci.example/v1/predict',
  runtime: 'OKE inference Service (design)',
  request: {
    text: 'Wall Street gains on strong earnings from major banks.',
  },
  prediction: {
    label: 'Business',
    confidence: 0.91,
    classes: ['World', 'Sports', 'Business', 'Sci/Tech'],
  },
};

export default {
  OCI_SCAFFOLD_FLAGS,
  OCI_SHARED,
  OCI_ONBOARDING_MOCK,
  OCI_TSP_ENV_MOCK,
  OCI_CONTRACT_MOCK,
  OCI_TRAINING_JOB_MOCK,
  OCI_TRAINING_LOGS_MOCK,
  OCI_PROVENANCE_MOCK,
  OCI_E2E_PARTIES,
  OCI_CATALOG_MOCK,
  OCI_INFERENCE_MOCK,
  buildOciContractEnvironmentSpecs,
  buildOciKmsConfigs,
  applyOciTspEnvironmentDefaults,
};
