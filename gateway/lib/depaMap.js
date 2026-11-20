/**
 * Pure mappings between DEPA PRD /v1 shapes and CAN /api shapes.
 * Gateway façade only — CAN remains the system of record.
 */

const PARTY_TO_PROVIDER_TYPE = {
  TDP: 'DataProvider',
  TDC: 'DataConsumer',
  TSP: 'InfrastructureProvider',
  CCRP: 'InfrastructureProvider',
  AppAdmin: 'ContractManagement',
  Auditor: 'IdentityManagement',
};

const PROVIDER_TYPE_TO_PARTY = {
  DataProvider: 'TDP',
  DataConsumer: 'TDC',
  InfrastructureProvider: 'TSP',
  KeyManagement: 'TSP',
  ContractManagement: 'AppAdmin',
  IdentityManagement: 'Auditor',
};

const THEME_TO_DOMAIN = {
  'public-health': 'Healthcare',
  healthcare: 'Healthcare',
  finance: 'Finance',
  retail: 'Retail',
  manufacturing: 'Manufacturing',
  technology: 'Technology',
  education: 'Education',
  government: 'Government',
};

const ALLOWED_CONFORMS_TO = new Set([
  'csv',
  'parquet',
  'json',
  'jsonl',
  'png',
  'nifti',
  'hdf5',
  'onnx',
  'safetensors',
  'tsv',
  'zip',
]);

const REJECTED_CONFORMS_TO = new Set(['pkl', 'pickle', 'joblib', 'pt', 'pth']);

const CONTRACT_STATUS_TO_DEPA = {
  DRAFT: 'draft',
  PENDING_TDP: 'draft',
  PENDING_TDP_APPROVAL: 'draft',
  PENDING_TDC: 'draft',
  PENDING_TSP: 'draft',
  PENDING_TSP_APPROVAL: 'draft',
  PENDING_CCRP: 'draft',
  PENDING_CCRP_APPROVAL: 'draft',
  SIGNED: 'active',
  EXECUTING: 'active',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REVOKED: 'revoked',
  TERMINATED: 'terminated',
};

function normalizeFormat(value) {
  if (!value) return null;
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/^\./, '');
}

function assertAllowedConformsTo(value) {
  const fmt = normalizeFormat(value);
  if (!fmt) return { ok: true, format: null };
  if (REJECTED_CONFORMS_TO.has(fmt)) {
    return {
      ok: false,
      error: `Dataset ingest rejected: ${fmt} is not an allowed catalog format (pickle/joblib/model binaries are blocked)`,
    };
  }
  if (!ALLOWED_CONFORMS_TO.has(fmt)) {
    return {
      ok: false,
      error: `Dataset ingest rejected: ${fmt} is not allow-listed (csv, parquet, json, images, onnx, safetensors)`,
    };
  }
  return { ok: true, format: fmt };
}

function dcatToCanDataset(body, owner) {
  const meta = body.metadata && typeof body.metadata === 'object' ? body.metadata : {};
  const title = meta['dct:title'] || body.title || body.name;
  const identifier = meta['dct:identifier'] || body.datasetId || body.identifier;
  const description =
    meta['dct:description'] || body.description || title || 'DEPA catalog dataset';
  const conforms = meta['dct:conformsTo'] || body.format || body.fmt;
  const gate = assertAllowedConformsTo(conforms);
  if (!gate.ok) {
    const err = new Error(gate.error);
    err.statusCode = 400;
    err.code = 'INGEST_FORMAT_REJECTED';
    throw err;
  }

  const theme = meta['dcat:theme'] || body.theme;
  const domain = THEME_TO_DOMAIN[String(theme || '').toLowerCase()] || body.domain || null;
  const price = meta['depa:cost'] != null ? Number(meta['depa:cost']) : Number(body.price || 0);
  const spatial = meta['dct:spatial'] || body.spatial || null;

  if (!identifier || !title) {
    const err = new Error('Catalog ingestion requires dct:identifier and dct:title (or datasetId and name)');
    err.statusCode = 400;
    throw err;
  }

  const ingestStatus = gate.format ? 'discoverable' : 'pending_validation';

  return {
    canPayload: {
      datasetId: String(identifier),
      name: String(title),
      description: String(description),
      category: body.category || 'Tabular',
      domain,
      size: Number(body.size || 1),
      recordCount: Number(body.recordCount || 1),
      price: Number.isFinite(price) && price > 0 ? price : 1,
      license: body.license || 'DEPA',
      tags: body.tags || (theme ? [theme] : []),
      isPublic: ingestStatus === 'discoverable',
      confidentialComputingRequired: body.confidentialComputingRequired !== false,
      ownerId: owner.id,
      data_residency_region: spatial,
      contentFormat: gate.format,
      metadata: {
        ...meta,
        depa: {
          templateHint: body.templateId || null,
          pricingModel: meta['depa:pricingModel'] || null,
          providerId: body.providerId || owner.depaId || owner.id,
        },
        ingest: {
          status: ingestStatus,
          checkedAt: new Date().toISOString(),
          contentFormat: gate.format,
          facade: 'depa-prd-v1',
        },
      },
    },
    ingestStatus,
    format: gate.format,
  };
}

function canDatasetToCatalog(row) {
  const plain = row?.dataset || row;
  const meta = plain.metadata && typeof plain.metadata === 'object' ? plain.metadata : {};
  const ingest = meta.ingest || {};
  const status =
    ingest.status ||
    (plain.physicalTrainingReady || (plain.artifactFileCount || 0) > 0 ? 'discoverable' : 'pending_validation');
  return {
    datasetId: plain.datasetId,
    depaId: plain.depaId || null,
    status,
    discoverable: status === 'discoverable' && plain.isPublic !== false,
    metadata: {
      'dct:title': plain.name,
      'dct:description': plain.description,
      'dct:identifier': plain.datasetId,
      'dct:conformsTo': plain.contentFormat || meta['dct:conformsTo'] || null,
      'dcat:theme': plain.domain || (Array.isArray(plain.tags) ? plain.tags[0] : null),
      'dct:spatial': plain.data_residency_region || meta['dct:spatial'] || null,
      'depa:cost': plain.price,
    },
    owner: plain.owner || null,
    can: {
      category: plain.category,
      ingestStatus: plain.ingestStatus || status,
    },
  };
}

function depaContractStatus(canStatus) {
  return CONTRACT_STATUS_TO_DEPA[canStatus] || String(canStatus || 'unknown').toLowerCase();
}

function partyTypeFromProfile(profile) {
  return profile?.partyType || profile?.user?.partyType || null;
}

function signPartyType(profile) {
  const party = partyTypeFromProfile(profile);
  if (party === 'CCRP') return 'TSP';
  return party;
}

function catalogTemplateHint(row) {
  const plain = row?.dataset || row || {};
  const meta = plain.metadata && typeof plain.metadata === 'object' ? plain.metadata : {};
  return meta.depa?.templateHint || meta['depa:template'] || null;
}

function datasetsForTemplate(templateId, catalogDatasets) {
  const want = String(templateId || '').trim().toUpperCase();
  if (!want) return [];
  return (catalogDatasets || []).filter((row) => {
    const hint = catalogTemplateHint(row);
    return hint && String(hint).trim().toUpperCase() === want;
  });
}

function ricardianFromDepa(body, profile, catalogDatasets = []) {
  let datasetSelections = Array.isArray(body.datasetSelections)
    ? body.datasetSelections
    : (body.datasetIds || []).map((datasetId) => ({
        datasetId,
        individualPrice: Number(body.price || body.cost || 1),
      }));

  if (!datasetSelections.length && body.templateId) {
    datasetSelections = datasetsForTemplate(body.templateId, catalogDatasets).map((row) => {
      const plain = row.dataset || row;
      return {
        datasetId: plain.datasetId,
        individualPrice: Number(plain.price || body.price || body.cost || 1),
      };
    });
  }

  if (!datasetSelections.length) {
    const err = new Error(
      'CAN façade requires datasetIds or datasetSelections, or a templateId that matches an ingested catalog dataset (metadata.depa.templateHint)'
    );
    err.statusCode = 400;
    err.code = 'DATASET_REQUIRED';
    throw err;
  }

  const templateId = body.templateId || 'S3';
  const purpose = body.permittedPurpose || body.termsAndConditions || 'DEPA permitted purpose';
  const dp = body.differentialPrivacy || {};
  const s3 = String(templateId).toUpperCase() === 'S3';

  return {
    datasetSelections,
    duration: body.duration || 30,
    termsAndConditions: purpose,
    contractType: 'AI_TRAINING',
    tspId: body.tspId || body.infrastructureProviderId || undefined,
    tspCloudProvider: body.tspCloudProvider || (s3 ? 'Local' : undefined),
    aiModelIds: body.aiModelIds || [],
    trainingParams: {
      ...(body.trainingParams || {}),
      scenarioTemplate: templateId,
      permittedPurpose: purpose,
      differentialPrivacy: {
        enabled: s3 || dp.enabled === true,
        epsilon: dp.epsilon != null ? Number(dp.epsilon) : 1.0,
        delta: dp.delta != null ? Number(dp.delta) : 0.00001,
        budgetCap: dp.budgetCap != null ? Number(dp.budgetCap) : 5.0,
      },
    },
    privacyRequirements: body.privacyRequirements || { depaTemplate: templateId },
    environmentSpecs: body.environmentSpecs || { region: 'local', tee: s3 ? 'local-simulated' : 'none' },
    consumerIds: body.consumerIds || [profile?.depaId || profile?.id].filter(Boolean),
    providerIds: body.providerIds || [],
  };
}

function canUserToProvider(user, providerType) {
  const party = user.partyType;
  return {
    providerId: user.depaId || String(user.id),
    providerType: providerType || PARTY_TO_PROVIDER_TYPE[party] || party,
    organizationName: user.organization || user.name,
    status: user.isActive === false ? 'inactive' : 'active',
    did: user.did || null,
    contactEmail: user.email || null,
    can: {
      id: user.id,
      partyType: party,
    },
  };
}

function themeToCanQuery(query) {
  const theme = query.theme || query['dcat:theme'];
  const fmt = normalizeFormat(query.fmt || query.format || query['dct:conformsTo']);
  const domain = THEME_TO_DOMAIN[String(theme || '').toLowerCase()] || query.domain;
  return { theme, fmt, domain, q: query.q || query.title || undefined };
}

module.exports = {
  PARTY_TO_PROVIDER_TYPE,
  PROVIDER_TYPE_TO_PARTY,
  THEME_TO_DOMAIN,
  ALLOWED_CONFORMS_TO,
  CONTRACT_STATUS_TO_DEPA,
  normalizeFormat,
  assertAllowedConformsTo,
  dcatToCanDataset,
  canDatasetToCatalog,
  depaContractStatus,
  partyTypeFromProfile,
  signPartyType,
  catalogTemplateHint,
  datasetsForTemplate,
  ricardianFromDepa,
  canUserToProvider,
  themeToCanQuery,
};
