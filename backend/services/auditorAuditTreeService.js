'use strict';

/**
 * Build a contract-scoped Merkle audit tree from durable provenance evidence
 * (contract fields, training jobs, SCITT claims, registered models).
 * Used by Auditor (and AppAdmin) for incident review when a model misbehaves.
 */

const MerkleTreeBuilder = require('./MerkleTreeBuilder');
const ProofGenerator = require('./ProofGenerator');
const { buildProvenanceAuditReport } = require('./provenanceAuditReportService');

function stableStringify(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(',')}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
}

function leafPayload(kind, id, data) {
  return {
    kind,
    id: String(id),
    data,
  };
}

/**
 * Derive ordered leaf payloads from a provenance audit report.
 */
function deriveLeavesFromReport(report) {
  const leaves = [];
  const contract = report.contract || {};

  leaves.push(
    leafPayload('contract', contract.contractId || report.contractId, {
      contractId: contract.contractId || report.contractId,
      status: contract.status,
      legalDocumentHash: contract.legalDocumentHash,
      ricardianSignature: contract.ricardianSignature,
      tdcId: contract.tdcId,
      tspId: contract.tspId,
      depaId: contract.depaId,
      signatureCount: contract.signatureCount,
      environmentSpecs: contract.environmentSpecs,
      trainingParams: contract.trainingParams,
      contractDatasets: contract.contractDatasets,
    })
  );

  for (const job of report.trainingJobs || []) {
    leaves.push(
      leafPayload('training_job', job.jobId, {
        jobId: job.jobId,
        depaId: job.depaId || null,
        status: job.status,
        contractId: job.contractId || report.contractId,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
        metrics: job.metrics || job.metadata?.metrics || null,
        artifactHashes: job.artifactHashes || job.metadata?.artifactHashes || null,
        error: job.error || null,
      })
    );
  }

  for (const claim of report.scittClaims || []) {
    leaves.push(
      leafPayload('scitt_claim', claim.claimId, {
        claimId: claim.claimId,
        claimType: claim.claimType,
        status: claim.status,
        claimData: claim.claimData,
        createdAt: claim.createdAt,
      })
    );
  }

  for (const model of report.registeredModels || []) {
    leaves.push(
      leafPayload('ai_model', model.modelId || model.id, {
        modelId: model.modelId || model.id,
        depaId: model.depaId,
        name: model.name,
        framework: model.framework,
        architecture: model.architecture,
        createdAt: model.createdAt,
      })
    );
  }

  return leaves;
}

/**
 * Build Merkle audit tree for a contract the caller may read.
 */
async function buildContractAuditTree(contractId, userId, { partyType } = {}) {
  const report = await buildProvenanceAuditReport(contractId, userId, { partyType });
  const leafPayloads = deriveLeavesFromReport(report);

  if (leafPayloads.length === 0) {
    const err = new Error('No audit leaves available for this contract');
    err.statusCode = 404;
    throw err;
  }

  const builder = new MerkleTreeBuilder();
  const proofGen = new ProofGenerator();

  // Hash stable canonical strings so leaf digests are deterministic
  const leafInputs = leafPayloads.map((leaf) => stableStringify(leaf));

  const tree = builder.buildTree(leafInputs, String(contractId));

  const leaves = tree.nodes
    .filter((n) => n.nodeType === 'LEAF')
    .sort((a, b) => a.position - b.position)
    .map((node, index) => {
      const payload = leafPayloads[index];
      let proof = null;
      try {
        proof = proofGen.generateProof(tree, node.nodeId);
      } catch (e) {
        proof = { error: e.message };
      }
      return {
        nodeId: node.nodeId,
        position: node.position,
        dataHash: node.dataHash,
        kind: payload.kind,
        id: payload.id,
        summary: summarizeLeaf(payload),
        proof,
      };
    });

  return {
    generatedAt: new Date().toISOString(),
    contractId: String(contractId),
    contract: report.contract,
    merkle: {
      treeId: tree.treeId,
      treeType: tree.treeType,
      hashAlgorithm: tree.hashAlgorithm,
      rootHash: tree.rootHash,
      nodeCount: tree.nodeCount,
      levels: tree.levels,
      leaves,
    },
    provenanceSummary: {
      trainingJobCount: (report.trainingJobs || []).length,
      scittClaimCount: (report.scittClaims || []).length,
      registeredModelCount: (report.registeredModels || []).length,
    },
    interpretation: {
      purpose:
        'Each leaf commits to durable audit evidence for this contract. Verify inclusion against rootHash when investigating model misbehavior.',
      contractLink: `/contracts/${encodeURIComponent(String(contractId))}`,
    },
  };
}

function summarizeLeaf(payload) {
  switch (payload.kind) {
    case 'contract':
      return `Contract ${payload.id} · status ${payload.data?.status || 'n/a'}`;
    case 'training_job':
      return `Training job ${payload.id} · ${payload.data?.status || 'n/a'}`;
    case 'scitt_claim':
      return `SCITT ${payload.data?.claimType || 'claim'} · ${payload.id}`;
    case 'ai_model':
      return `Model ${payload.data?.name || payload.id}`;
    default:
      return `${payload.kind}:${payload.id}`;
  }
}

/**
 * Verify a Merkle inclusion proof against an expected root.
 */
function verifyInclusionProof(proof, expectedRootHash) {
  const proofGen = new ProofGenerator();
  const root = expectedRootHash || proof?.rootHash;
  if (!root) {
    return { isValid: false, error: 'Missing root hash' };
  }
  return proofGen.verifyProof(proof, root);
}

module.exports = {
  buildContractAuditTree,
  verifyInclusionProof,
  deriveLeavesFromReport,
  stableStringify,
};
