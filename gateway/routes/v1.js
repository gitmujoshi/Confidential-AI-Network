/**
 * DEPA PRD /v1 façade over the existing CAN backend.
 * The CAN portal continues to call /api on :5001 (or /api via this gateway).
 */

const express = require('express');
const router = express.Router();
const { canRequest, forwardError, CAN_BASE } = require('../lib/canClient');
const crypto = require('crypto');
const {
  dcatToCanDataset,
  canDatasetToCatalog,
  depaContractStatus,
  signPartyType,
  ricardianFromDepa,
  canUserToProvider,
  themeToCanQuery,
  PROVIDER_TYPE_TO_PARTY,
} = require('../lib/depaMap');
const { verifyOrganizationVc } = require('../../backend/services/organizationVc');

function requireBearer(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(401).json({ success: false, error: 'Authorization Bearer token required' });
  }
  return next();
}

async function loadProfile(req) {
  const canRes = await canRequest(req, { method: 'GET', path: '/api/auth/profile' });
  if (canRes.status >= 400) {
    const err = new Error(canRes.data?.error || 'Unauthorized');
    err.statusCode = canRes.status;
    err.can = canRes.data;
    throw err;
  }
  return canRes.data?.user || canRes.data;
}

router.get('/', (_req, res) => {
  res.json({
    success: true,
    facade: 'depa-prd-v1-over-can',
    canBackend: CAN_BASE,
    routes: [
      '/v1/providers',
      '/v1/catalog/ingestion',
      '/v1/catalog/search',
      '/v1/contracts',
      '/v1/contracts/{id}',
      '/v1/contracts/{id}/status',
      '/v1/contracts/{id}/sign',
      '/v1/contracts/{id}/revoke',
      '/v1/scenarios/{id}/dp-config',
      '/v1/offers',
      '/v1/offers/{id}/consent',
      '/v1/offers/{id}/release',
      '/v1/offers/{id}/withdraw',
      '/v1/ccr/provision',
      '/v1/ccr/{id}',
      '/v1/ccr/{id}/attestation',
      '/v1/aichain/provenance/{id}/tombstone',
      '/v1/ccr/{id}/teardown',
      '/v1/aichain/contracts/{id}',
    ],
  });
});

router.get('/providers', requireBearer, async (req, res) => {
  try {
    const type = req.query.type;
    const party = PROVIDER_TYPE_TO_PARTY[type];

    if (!type || type === 'DataProvider') {
      const canRes = await canRequest(req, {
        method: 'GET',
        path: '/api/datasets/public',
        params: { limit: 100 },
      });
      if (canRes.status >= 400) return forwardError(res, canRes);
      const datasets = canRes.data?.datasets || [];
      const byId = new Map();
      for (const ds of datasets) {
        const owner = ds.owner;
        if (!owner?.id) continue;
        if (!byId.has(owner.id)) {
          byId.set(owner.id, canUserToProvider({ ...owner, partyType: 'TDP', isActive: true }, type || undefined));
        }
      }
      return res.json({ success: true, providers: [...byId.values()] });
    }

    if (!party) {
      return res.status(501).json({
        success: false,
        error: `Provider type ${type} is not listed on the CAN façade`,
      });
    }

    const canRes = await canRequest(req, {
      method: 'GET',
      path: `/api/users/party/${encodeURIComponent(party)}`,
    });
    if (canRes.status >= 400) return forwardError(res, canRes);
    const rows = Array.isArray(canRes.data) ? canRes.data : canRes.data?.users || [];
    return res.json({
      success: true,
      providers: rows.map((user) => canUserToProvider(user, type)),
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
});

router.post('/providers', requireBearer, async (req, res) => {
  try {
    const token = req.body?.verifiableCredential || req.body?.vc;
    const verified = verifyOrganizationVc(token);
    if (!verified.ok) {
      return res.status(400).json({ success: false, error: verified.error, code: verified.code });
    }
    const initialPassword = crypto.randomBytes(18).toString('base64url');
    const canRes = await canRequest(req, {
      method: 'POST',
      path: '/api/auth/register',
      data: {
        name: verified.subject.name,
        email: verified.subject.email,
        password: initialPassword,
        partyType: verified.subject.partyType,
        organization: verified.subject.organization,
        userType: 'Enterprise',
      },
    });
    if (canRes.status >= 400) return forwardError(res, canRes);
    return res.status(201).json({
      success: true,
      issuer: verified.issuer,
      provider: {
        providerType: req.body?.providerType || verified.subject.partyType,
        name: verified.subject.name,
        email: verified.subject.email,
        organization: verified.subject.organization,
        partyType: verified.subject.partyType,
      },
      initialPassword,
      registration: canRes.data,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
});

router.post('/catalog/ingestion', requireBearer, async (req, res) => {
  try {
    const profile = await loadProfile(req);
    const mapped = dcatToCanDataset(req.body || {}, profile);
    const canRes = await canRequest(req, {
      method: 'POST',
      path: '/api/datasets',
      data: mapped.canPayload,
    });
    if (canRes.status >= 400) return forwardError(res, canRes);
    const dataset = canRes.data?.dataset || canRes.data;
    return res.status(201).json({
      success: true,
      ingestStatus: mapped.ingestStatus,
      dataset: canDatasetToCatalog(dataset),
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      code: error.code,
    });
  }
});

router.get('/catalog/search', requireBearer, async (req, res) => {
  try {
    const q = themeToCanQuery(req.query || {});
    const params = { limit: req.query.limit || 20, offset: req.query.offset || 0 };
    if (q.domain) params.domain = q.domain;
    if (q.q) params.q = q.q;
    const path = q.q ? '/api/datasets/search' : '/api/datasets/public';
    const canRes = await canRequest(req, { method: 'GET', path, params });
    if (canRes.status >= 400) return forwardError(res, canRes);
    let datasets = (canRes.data?.datasets || []).map(canDatasetToCatalog);
    if (q.fmt) {
      datasets = datasets.filter((d) => {
        const conforms = String(d.metadata['dct:conformsTo'] || '').toLowerCase();
        return !conforms || conforms === q.fmt;
      });
    }
    return res.json({
      success: true,
      total: canRes.data?.total ?? datasets.length,
      datasets,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
});

router.post('/contracts', requireBearer, async (req, res) => {
  try {
    const profile = await loadProfile(req);
    const body = req.body || {};
    const hasDatasets = (Array.isArray(body.datasetIds) && body.datasetIds.length > 0)
      || (Array.isArray(body.datasetSelections) && body.datasetSelections.length > 0);
    let catalog = [];
    if (!hasDatasets && body.templateId) {
      const listed = await canRequest(req, {
        method: 'GET',
        path: '/api/datasets/public',
        params: { limit: 100 },
      });
      if (listed.status >= 400) return forwardError(res, listed);
      catalog = listed.data?.datasets || [];
    }
    const payload = ricardianFromDepa(body, profile, catalog);
    const canRes = await canRequest(req, {
      method: 'POST',
      path: '/api/contracts/ricardian',
      data: payload,
    });
    if (canRes.status >= 400) return forwardError(res, canRes);
    const contract = canRes.data?.contract || canRes.data;
    return res.status(201).json({
      success: true,
      contractId: contract.contractId || contract.id,
      status: depaContractStatus(contract.status),
      templateId: payload.trainingParams?.scenarioTemplate,
      contract,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      code: error.code,
    });
  }
});

router.get('/contracts/:contractId/status', requireBearer, async (req, res) => {
  const canRes = await canRequest(req, {
    method: 'GET',
    path: `/api/contracts/${encodeURIComponent(req.params.contractId)}`,
  });
  if (canRes.status >= 400) return forwardError(res, canRes);
  const contract = canRes.data?.contract || canRes.data;
  return res.json({
    success: true,
    contractId: contract.contractId,
    status: depaContractStatus(contract.status),
    canStatus: contract.status,
    lifecycle: contract.legalDocument?.lifecycle || null,
  });
});

router.get('/contracts/:contractId', requireBearer, async (req, res) => {
  const canRes = await canRequest(req, {
    method: 'GET',
    path: `/api/contracts/${encodeURIComponent(req.params.contractId)}`,
  });
  if (canRes.status >= 400) return forwardError(res, canRes);
  const contract = canRes.data?.contract || canRes.data;
  return res.json({
    success: true,
    contractId: contract.contractId,
    status: depaContractStatus(contract.status),
    contract,
  });
});

router.post('/contracts/:contractId/sign', requireBearer, async (req, res) => {
  try {
    const profile = await loadProfile(req);
    const partyType = req.body?.partyType || signPartyType(profile);
    const canRes = await canRequest(req, {
      method: 'POST',
      path: `/api/contracts/${encodeURIComponent(req.params.contractId)}/sign`,
      data: {
        signature: req.body?.signatureProof || req.body?.signature || `depa-facade-${Date.now()}`,
        partyType,
        timestamp: new Date().toISOString(),
        actorId: req.body?.actorId,
      },
    });
    if (canRes.status >= 400) return forwardError(res, canRes);
    const contract = canRes.data?.contract || canRes.data;
    return res.json({
      success: true,
      contractId: req.params.contractId,
      status: depaContractStatus(contract.status || contract?.status),
      contract,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
});

router.post('/contracts/:contractId/revoke', requireBearer, async (req, res) => {
  const canRes = await canRequest(req, {
    method: 'POST',
    path: `/api/contracts/${encodeURIComponent(req.params.contractId)}/revoke`,
    data: {
      reason: req.body?.reason || 'DEPA emergency revoke',
      actorId: req.body?.actorId,
    },
  });
  if (canRes.status >= 400) return forwardError(res, canRes);
  return res.json({
    success: true,
    contractId: req.params.contractId,
    status: canRes.data?.status ? String(canRes.data.status).toLowerCase() : 'revoked',
    action: canRes.data?.action || 'revoke',
    abortedJobs: canRes.data?.abortedJobs || [],
    contract: canRes.data?.contract,
  });
});

router.post('/scenarios/:scenarioId/dp-config', requireBearer, async (req, res) => {
  const scenarioId = req.params.scenarioId;
  const canRes = await canRequest(req, {
    method: 'POST',
    path: `/api/contracts/${encodeURIComponent(scenarioId)}/differential-privacy`,
    data: {
      epsilon: req.body?.epsilon,
      delta: req.body?.delta,
      budgetCap: req.body?.budgetCap,
    },
  });
  if (canRes.status >= 400) return forwardError(res, canRes);
  return res.json({
    success: true,
    scenarioId,
    persistedOnContract: true,
    dp: canRes.data?.differentialPrivacy || null,
  });
});

router.post('/offers', requireBearer, async (req, res) => {
  const canRes = await canRequest(req, {
    method: 'POST',
    path: '/api/depa/offers',
    data: req.body,
  });
  if (canRes.status >= 400) return forwardError(res, canRes);
  return res.status(201).json(canRes.data);
});

router.post('/offers/:offerId/consent', requireBearer, async (req, res) => {
  const canRes = await canRequest(req, {
    method: 'POST',
    path: `/api/depa/offers/${encodeURIComponent(req.params.offerId)}/consent`,
    data: req.body,
  });
  if (canRes.status >= 400) return forwardError(res, canRes);
  return res.status(canRes.status).json(canRes.data);
});

router.post('/offers/:offerId/release', requireBearer, async (req, res) => {
  const canRes = await canRequest(req, {
    method: 'POST',
    path: `/api/depa/offers/${encodeURIComponent(req.params.offerId)}/release`,
    data: req.body || {},
  });
  if (canRes.status >= 400) return forwardError(res, canRes);
  return res.status(canRes.status).json(canRes.data);
});

router.post('/offers/:offerId/withdraw', requireBearer, async (req, res) => {
  const canRes = await canRequest(req, {
    method: 'POST',
    path: `/api/depa/offers/${encodeURIComponent(req.params.offerId)}/withdraw`,
    data: req.body || {},
  });
  if (canRes.status >= 400) return forwardError(res, canRes);
  return res.status(canRes.status).json(canRes.data);
});

router.post('/ccr/provision', requireBearer, async (req, res) => {
  const contractId = req.body?.contractIds?.[0] || req.body?.contractId;
  if (!contractId) {
    return res.status(400).json({
      success: false,
      error: 'contractIds[0] or contractId is required',
    });
  }
  const canRes = await canRequest(req, {
    method: 'POST',
    path: `/api/tdc/training/contracts/${encodeURIComponent(contractId)}/start`,
  });
  if (canRes.status >= 400) return forwardError(res, canRes);
  const job = canRes.data?.job || canRes.data;
  return res.status(201).json({
    success: true,
    ccrInstanceId: job.jobId,
    contractId,
    teePlatform: req.body?.teePlatform || 'local-simulated',
    scenarioId: req.body?.scenarioId || null,
    job,
  });
});

router.post('/ccr/:ccrInstanceId/attestation', requireBearer, async (req, res) => {
  const canRes = await canRequest(req, {
    method: 'POST',
    path: `/api/tdc/training/jobs/${encodeURIComponent(req.params.ccrInstanceId)}/sev-snp-quote`,
    data: req.body || {},
  });
  if (canRes.status >= 400) return forwardError(res, canRes);
  return res.status(201).json(canRes.data);
});

router.get('/ccr/:ccrInstanceId/attestation', requireBearer, async (req, res) => {
  const canRes = await canRequest(req, {
    method: 'GET',
    path: `/api/tdc/training/jobs/${encodeURIComponent(req.params.ccrInstanceId)}`,
  });
  if (canRes.status >= 400) return forwardError(res, canRes);
  const job = canRes.data?.job || canRes.data;
  const quote = job?.metadata?.sevSnp;
  if (quote?.verified === true && quote?.mode === 'sev-snp') {
    return res.json({
      success: true,
      ccrInstanceId: req.params.ccrInstanceId,
      teePlatform: 'sev-snp',
      attestation: {
        mode: 'sev-snp',
        verified: true,
        measurement: quote.measurement,
        reportData: quote.reportData,
        verifiedAt: quote.verifiedAt,
      },
      job,
    });
  }
  return res.json({
    success: true,
    ccrInstanceId: req.params.ccrInstanceId,
    teePlatform: job?.metadata?.executionMode || 'local-simulated',
    attestation: {
      mode: 'simulated',
      verified: false,
      jobStatus: job?.status,
      containerDigest: job?.metadata?.containerSpec?.image || null,
      note: 'No verified SEV-SNP quote is stored for this job. Submit the guest report with POST /v1/ccr/{id}/attestation.',
    },
    job,
  });
});

router.get('/ccr/:ccrInstanceId', requireBearer, async (req, res) => {
  const canRes = await canRequest(req, {
    method: 'GET',
    path: `/api/tdc/training/jobs/${encodeURIComponent(req.params.ccrInstanceId)}`,
  });
  if (canRes.status >= 400) return forwardError(res, canRes);
  const job = canRes.data?.job || canRes.data;
  return res.json({
    success: true,
    ccrInstanceId: req.params.ccrInstanceId,
    status: job?.status,
    job,
  });
});

router.post('/ccr/:ccrInstanceId/teardown', requireBearer, async (req, res) => {
  const canRes = await canRequest(req, {
    method: 'POST',
    path: `/api/tdc/training/jobs/${encodeURIComponent(req.params.ccrInstanceId)}/abort`,
    data: { reason: req.body?.reason || 'CCR teardown' },
  });
  if (canRes.status >= 400) return forwardError(res, canRes);
  return res.json({
    success: true,
    ccrInstanceId: req.params.ccrInstanceId,
    job: canRes.data?.job || canRes.data,
  });
});

router.get('/aichain/contracts/:contractId', requireBearer, async (req, res) => {
  const canRes = await canRequest(req, {
    method: 'GET',
    path: `/api/auditor/contracts/${encodeURIComponent(req.params.contractId)}/provenance-report`,
  });
  if (canRes.status >= 400) return forwardError(res, canRes);
  return res.json({
    success: true,
    contractId: req.params.contractId,
    provenance: canRes.data,
  });
});

router.post('/aichain/merkle/publish', requireBearer, async (req, res) => {
  return res.json({
    success: true,
    note: 'CAN writes Merkle/SCITT provenance as training and contract events occur. There is no separate publish step.',
    provenanceIds: req.body?.provenanceIds || [],
  });
});

router.post('/aichain/provenance/:provenanceId/tombstone', requireBearer, async (req, res) => {
  const canRes = await canRequest(req, {
    method: 'POST',
    path: `/api/auditor/provenance/${encodeURIComponent(req.params.provenanceId)}/tombstone`,
    data: {
      reason: req.body?.reason,
      redactedFields: req.body?.redactedFields,
    },
  });
  if (canRes.status >= 400) return forwardError(res, canRes);
  return res.status(canRes.status).json(canRes.data);
});

module.exports = router;
