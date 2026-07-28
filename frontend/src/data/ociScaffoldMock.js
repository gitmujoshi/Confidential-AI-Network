/**
 * Static mock payloads for the OCI scaffold demo UI.
 * Mirrors design scaffolds: Vault, Object Storage, edge, training, SPIFFE/WIF, SCITT.
 * Not live OCIDs — placeholders for architecture walkthroughs.
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

export const OCI_ONBOARDING_MOCK = {
  party: {
    depaId: 'US-EAST-TDP-a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    partyType: 'TDP',
    displayName: 'Acme Health Data Cooperative',
    identityProvider: 'OCI IAM Identity Domains',
  },
  signingKey: {
    algorithm: 'ECDSA_P256',
    keyId: 'sign-key-oci-dev-001',
    backend: 'oci-vault',
    vaultOcid: 'ocid1.vault.oc1.iad.amaaaaaexamplevault',
    keyOcid: 'ocid1.key.oc1.iad.amaaaaaexamplesignkey',
    status: 'active',
    createdAt: '2026-07-28T12:00:00.000Z',
  },
  vault: {
    displayName: 'cms-dev-vault',
    vaultOcid: 'ocid1.vault.oc1.iad.amaaaaaexamplevault',
    masterKeyOcid: 'ocid1.key.oc1.iad.amaaaaaexamplemaster',
    compartmentOcid: 'ocid1.compartment.oc1..aaaaaaaexample',
    region: 'us-ashburn-1',
    purpose: ['app secrets', 'signing keys', 'SSE-KMS for Object Storage'],
  },
};

export const OCI_TSP_ENV_MOCK = {
  tsp: {
    depaId: 'US-EAST-TSP-f0e1d2c3-b4a5-6789-abcd-112233445566',
    displayName: 'SecureClean Rooms LLC',
    cloudProvider: 'OCI',
    secretManager: 'OCI_VAULT',
  },
  credentials: {
    compartmentId: 'ocid1.compartment.oc1..aaaaaaaexampletsp',
    userId: 'ocid1.user.oc1..aaaaaaaexampleapi',
    fingerprint: 'https://example.invalid/fingerprint',
    region: 'us-ashburn-1',
    authMethod: 'API_KEY',
    vaultOcid: 'ocid1.vault.oc1.iad.amaaaaaexampletspvault',
  },
  confidentialCompute: {
    computeType: 'confidential-vm',
    platform: 'OCI Confidential Computing',
    kubernetes: 'OKE (cms-training namespace)',
    serviceAccount: 'training-job-sa',
    spiffeId: 'spiffe://can.dev.oci.example/ns/cms-training/sa/training-job-sa',
    attestation: 'oci-attestation (design)',
    tee: 'Confidential VM shape (operator-selected)',
    features: [
      'Isolated training Job on OKE',
      'Object Storage ciphertext in / ciphertext out',
      'SPIFFE peer identity before key release',
      'No long-lived API keys (Workload Identity / WIF)',
    ],
  },
};

export const OCI_CONTRACT_MOCK = {
  contractId: 'CONTRACT-oci-scaffold-demo-001',
  depaId: 'US-EAST-CONTRACT-99887766-5544-3322-1100-aabbccddeeff',
  title: 'Governed NLP fine-tune on regulated health notes (OCI)',
  status: 'SIGNED',
  parties: {
    tdc: 'US-EAST-TDC-11112222-3333-4444-5555-666677778888',
    tdp: OCI_ONBOARDING_MOCK.party.depaId,
    tsp: OCI_TSP_ENV_MOCK.tsp.depaId,
  },
  environmentSpecs: {
    infrastructure: {
      cloudProvider: 'OCI',
      region: 'us-ashburn-1',
      computeType: 'confidential-vm',
      kubernetesCluster: 'contract-management-cluster',
      trainingNamespace: 'cms-training',
      objectStorage: {
        namespace: 'idushexample',
        datasets: 'cms-dev-datasets',
        outputs: 'cms-dev-training-outputs',
        artifacts: 'cms-dev-artifacts',
      },
    },
    security: {
      networkIsolation: true,
      privateEndpoints: true,
      spiffeRequired: true,
      attestationProvider: 'oci-attestation',
    },
    kms: {
      provider: 'oci-vault',
      vaultOcid: OCI_ONBOARDING_MOCK.vault.vaultOcid,
      keyId: OCI_ONBOARDING_MOCK.vault.masterKeyOcid,
      algorithm: 'AES-256-GCM',
      rotationPeriod: 90,
    },
  },
  kmsConfigs: {
    provider: 'OCI_VAULT',
    vaultOcid: OCI_ONBOARDING_MOCK.vault.vaultOcid,
    masterKeyOcid: OCI_ONBOARDING_MOCK.vault.masterKeyOcid,
    signingKeyOcid: OCI_ONBOARDING_MOCK.signingKey.keyOcid,
    dekEscrow: 'CAN dual-key (design)',
    mekEscrow: 'CAN dual-key (design)',
  },
};

export const OCI_PROVENANCE_MOCK = {
  reportType: 'contract-provenance-audit',
  contractId: OCI_CONTRACT_MOCK.contractId,
  generatedAt: '2026-07-28T16:00:00.000Z',
  deployment: {
    prefix: 'US-EAST',
    cloud: 'OCI',
    scaffolds: OCI_SCAFFOLD_FLAGS,
  },
  claims: [
    {
      type: 'contract.signed',
      ledger: 'SCITT CCF',
      parties: ['TDC', 'TDP', 'TSP'],
      at: '2026-07-28T14:10:00.000Z',
    },
    {
      type: 'training.job.completed',
      jobId: 'job-CONTRACT-oci-scaffold-demo-001-1722172800000',
      executionMode: 'oci-oke-job',
      simulation: true,
      spiffeId: OCI_TSP_ENV_MOCK.confidentialCompute.spiffeId,
      objectStorageOutputs: 'cms-dev-training-outputs/demo/outputs/',
      at: '2026-07-28T15:45:00.000Z',
    },
    {
      type: 'keys.released',
      note: 'DEK/MEK release gated on contract SIGNED + SPIFFE allowlist (+ attestation when live)',
      vault: OCI_ONBOARDING_MOCK.vault.vaultOcid,
      at: '2026-07-28T15:40:00.000Z',
    },
  ],
  integrity: {
    hashAlgorithm: 'SHA-256',
    bundleDigest: 'sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    note: 'Mock digest for UI demo — live reports use SCITT receipts when SCITT_CCF_ENABLED=true',
  },
};

export default {
  OCI_SCAFFOLD_FLAGS,
  OCI_ONBOARDING_MOCK,
  OCI_TSP_ENV_MOCK,
  OCI_CONTRACT_MOCK,
  OCI_PROVENANCE_MOCK,
};
