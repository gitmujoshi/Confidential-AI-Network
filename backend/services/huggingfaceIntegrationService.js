/**
 * Hugging Face Hub adapter (development / test only).
 *
 * CAN remains system-of-record for contracts and policy. HF is an optional
 * upstream catalog for public/gated base models and benchmark datasets.
 */

const https = require('https');

const MODEL_REPO_ID_PATTERN = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;
const DATASET_REPO_ID_PATTERN = /^[a-zA-Z0-9._-]+(\/[a-zA-Z0-9._-]+)?$/;

function isDevEnvironment() {
  const env = (process.env.NODE_ENV || 'development').toLowerCase();
  return env === 'development' || env === 'test';
}

function isEnabled() {
  if (process.env.HUGGINGFACE_INTEGRATION_ENABLED !== 'true') {
    return false;
  }
  if (!isDevEnvironment()) {
    return false;
  }
  if (process.env.HUGGINGFACE_ALLOW_IN_PRODUCTION === 'true') {
    return true;
  }
  return isDevEnvironment();
}

function getConfig() {
  return {
    enabled: isEnabled(),
    hubBaseUrl: process.env.HUGGINGFACE_HUB_URL || 'https://huggingface.co',
    tokenConfigured: Boolean(process.env.HF_TOKEN || process.env.HUGGINGFACE_API_TOKEN),
    sovereigntyMode: process.env.HUGGINGFACE_SOVEREIGNTY_MODE || 'dev-catalog-reference',
    orgNamespace: process.env.HUGGINGFACE_ORG_NAMESPACE || '',
  };
}

function validateRepoId(repoId, repoType = 'model') {
  if (!repoId || typeof repoId !== 'string') {
    return { valid: false, error: 'repoId is required' };
  }
  const trimmed = repoId.trim();
  const pattern = repoType === 'dataset' ? DATASET_REPO_ID_PATTERN : MODEL_REPO_ID_PATTERN;
  if (!pattern.test(trimmed)) {
    return {
      valid: false,
      error:
        repoType === 'dataset'
          ? 'repoId must be org/name or a Hub dataset id (e.g. ag_news)'
          : 'repoId must be org/name format',
    };
  }
  return { valid: true, repoId: trimmed };
}

function normalizeHfBlock(raw = {}, repoType) {
  const repoId =
    raw.repoId ||
    raw.repo_id ||
    raw.modelId ||
    raw.datasetId ||
    raw.huggingfaceModel ||
    raw.hfDatasetId ||
    null;

  if (!repoId) {
    return null;
  }

  const check = validateRepoId(String(repoId), repoType);
  if (!check.valid) {
    return null;
  }

  return {
    repoType: raw.repoType || raw.repo_type || repoType,
    repoId: check.repoId,
    revision: raw.revision || raw.ref || 'main',
    subset: raw.subset || null,
    splitTrain: raw.splitTrain || raw.split_train || 'train',
    splitTest: raw.splitTest || raw.split_test || 'test',
    gated: Boolean(raw.gated),
    license: raw.license || null,
    sovereignty: raw.sovereignty || 'hub-reference',
  };
}

function extractFromCatalogRow(row, repoType) {
  if (!row || typeof row !== 'object') {
    return null;
  }

  const meta = row.metadata && typeof row.metadata === 'object' ? row.metadata : {};
  const fromMeta = normalizeHfBlock(meta.huggingface || meta.hf || {}, repoType);

  if (fromMeta) {
    return fromMeta;
  }

  if (repoType === 'model') {
    if (meta.huggingfaceModel) {
      return normalizeHfBlock({ repoId: meta.huggingfaceModel, repoType: 'model' }, 'model');
    }
    if (typeof row.architecture === 'string' && row.architecture.includes('/')) {
      return normalizeHfBlock({ repoId: row.architecture, repoType: 'model' }, 'model');
    }
  }

  if (repoType === 'dataset') {
    if (meta.hfDatasetId || meta.huggingfaceDataset) {
      return normalizeHfBlock(
        { repoId: meta.hfDatasetId || meta.huggingfaceDataset, repoType: 'dataset' },
        'dataset'
      );
    }
  }

  return null;
}

function attachHfToRow(row, repoType) {
  const hf = extractFromCatalogRow(row, repoType);
  if (!hf) {
    return row;
  }
  return { ...row, huggingface: hf };
}

function httpsJson(url, token) {
  return new Promise((resolve, reject) => {
    const headers = { Accept: 'application/json', 'User-Agent': 'ConfidentialAINetwork-Dev/1.0' };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const req = https.get(url, { headers }, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) {
          const err = new Error(`Hugging Face API ${res.statusCode}: ${body.slice(0, 200)}`);
          err.statusCode = res.statusCode;
          return reject(err);
        }
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy(new Error('Hugging Face API request timed out'));
    });
  });
}

async function fetchHubMetadata(repoType, repoId) {
  const check = validateRepoId(repoId, repoType);
  if (!check.valid) {
    throw new Error(check.error);
  }

  const config = getConfig();
  const token = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_TOKEN || '';
  const path = repoType === 'dataset' ? 'datasets' : 'models';
  const url = `${config.hubBaseUrl}/api/${path}/${encodeURIComponent(check.repoId)}`;

  const data = await httpsJson(url, token);

  return {
    repoType,
    repoId: check.repoId,
    id: data.id || check.repoId,
    private: Boolean(data.private),
    gated: Boolean(data.gated),
    downloads: data.downloads ?? null,
    likes: data.likes ?? null,
    tags: Array.isArray(data.tags) ? data.tags.slice(0, 20) : [],
    license: data.cardData?.license || data.license || null,
    sha: data.sha || null,
    lastModified: data.lastModified || null,
    sovereigntyNote:
      data.private || data.gated
        ? 'Private/gated Hub repo — suitable for org-sovereign dev catalogs when token is org-scoped.'
        : 'Public Hub repo — use for dev benchmarks only; not for confidential TDP uploads.',
  };
}

function resolveTokenFromVaultHint() {
  // Dev-only: document Vault path; actual Vault fetch deferred to production hardening.
  const vaultPath = process.env.HUGGINGFACE_VAULT_SECRET_PATH;
  if (!vaultPath) {
    return null;
  }
  return { vaultPath, wired: false, note: 'Set HF_TOKEN locally for dev; wire Vault in production.' };
}

module.exports = {
  isEnabled,
  isDevEnvironment,
  getConfig,
  validateRepoId,
  normalizeHfBlock,
  extractFromCatalogRow,
  attachHfToRow,
  fetchHubMetadata,
  resolveTokenFromVaultHint,
};
