'use strict';

/**
 * Build a contract-scoped Merkle audit tree from durable provenance evidence
 * (contract fields, training jobs, SCITT claims, registered models).
 * Used by Auditor (and AppAdmin) for incident review when a model misbehaves.
 */

const db = require('../models');
const MerkleTreeBuilder = require('./MerkleTreeBuilder');
const ProofGenerator = require('./ProofGenerator');
const HashCalculator = require('./HashCalculator');
const { buildProvenanceAuditReport } = require('./provenanceAuditReportService');

const AUDIT_TREE_TYPE = 'CONTRACT_AUDIT';
const hashCalculator = new HashCalculator();

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

function evidenceReadyToSeal(report) {
  return (report.trainingJobs || []).some(
    (job) => String(job.status || '').toUpperCase() === 'COMPLETED'
  );
}

function assembleTree(report) {
  const leafPayloads = deriveLeavesFromReport(report);
  if (leafPayloads.length === 0) {
    const err = new Error('No audit leaves available for this contract');
    err.statusCode = 404;
    throw err;
  }
  const builder = new MerkleTreeBuilder();
  const proofGen = new ProofGenerator();
  const leafInputs = leafPayloads.map((leaf) => stableStringify(leaf));
  const tree = builder.buildTree(leafInputs, String(report.contractId));
  const leaves = tree.nodes
    .filter((node) => node.nodeType === 'LEAF')
    .sort((a, b) => a.position - b.position)
    .map((node, index) => {
      const payload = leafPayloads[index];
      if (!payload) return null;
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
        payload,
        proof,
      };
    })
    .filter(Boolean);
  return { tree, leaves };
}

async function findPublishedTree(contractId) {
  return db.MerkleTree.findOne({
    where: { contractId: String(contractId), treeType: AUDIT_TREE_TYPE },
    order: [['createdAt', 'ASC']],
  });
}

function currentLeafHashes(report) {
  const map = new Map();
  for (const payload of deriveLeavesFromReport(report)) {
    map.set(`${payload.kind}:${payload.id}`, hashCalculator.calculateHash(stableStringify(payload)));
  }
  return map;
}

function provenanceSummary(report) {
  return {
    trainingJobCount: (report.trainingJobs || []).length,
    scittClaimCount: (report.scittClaims || []).length,
    registeredModelCount: (report.registeredModels || []).length,
  };
}

/**
 * Seal the audit root once. Later database edits do not replace it.
 * Called when a model is registered, and again on auditor read if training
 * finished before this feature existed.
 */
async function publishContractAuditRoot(contractId, { userId, partyType, internal } = {}) {
  const existing = await findPublishedTree(contractId);
  if (existing) {
    return { published: false, alreadySealed: true, treeId: existing.treeId, rootHash: existing.rootHash };
  }

  const report = await buildProvenanceAuditReport(contractId, userId, { partyType, internal });
  if (!evidenceReadyToSeal(report)) {
    return { published: false, alreadySealed: false, reason: 'training_not_completed' };
  }

  const { tree, leaves } = assembleTree(report);
  const transaction = await db.sequelize.transaction();
  try {
    const again = await db.MerkleTree.findOne({
      where: { contractId: String(contractId), treeType: AUDIT_TREE_TYPE },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (again) {
      await transaction.commit();
      return { published: false, alreadySealed: true, treeId: again.treeId, rootHash: again.rootHash };
    }
    const row = await db.MerkleTree.create({
      treeId: tree.treeId,
      contractId: String(contractId),
      treeType: AUDIT_TREE_TYPE,
      hashAlgorithm: tree.hashAlgorithm,
      rootHash: tree.rootHash,
      nodeCount: tree.nodeCount,
    }, { transaction });
    await db.ProvenanceNode.bulkCreate(
      leaves.map((leaf) => ({
        nodeId: leaf.nodeId,
        treeId: tree.treeId,
        nodeType: 'LEAF',
        dataHash: leaf.dataHash,
        level: 0,
        position: leaf.position,
        metadata: {
          kind: leaf.kind,
          id: leaf.id,
          summary: leaf.summary,
          payload: leaf.payload,
          proof: leaf.proof,
        },
      })),
      { transaction }
    );
    await transaction.commit();
    return {
      published: true,
      alreadySealed: false,
      treeId: row.treeId,
      rootHash: row.rootHash,
      publishedAt: row.createdAt,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function loadPublishedLeaves(treeId) {
  const nodes = await db.ProvenanceNode.findAll({
    where: { treeId, nodeType: 'LEAF' },
    order: [['position', 'ASC']],
  });
  return nodes.map((node) => {
    const plain = node.get({ plain: true });
    const meta = plain.metadata || {};
    return {
      nodeId: plain.nodeId,
      position: plain.position,
      dataHash: plain.dataHash,
      kind: meta.kind,
      id: meta.id,
      summary: meta.summary,
      payload: meta.payload,
      proof: meta.proof,
    };
  });
}

/**
 * Build Merkle audit tree for a contract the caller may read.
 * Prefer the sealed root. Seal on read once a training job is COMPLETED.
 */
async function buildContractAuditTree(contractId, userId, { partyType } = {}) {
  const report = await buildProvenanceAuditReport(contractId, userId, { partyType });
  let published = await findPublishedTree(contractId);
  if (!published && evidenceReadyToSeal(report)) {
    await publishContractAuditRoot(contractId, { userId, partyType });
    published = await findPublishedTree(contractId);
  }

  const liveHashes = currentLeafHashes(report);
  let leaves;
  let merkle;
  if (published) {
    leaves = (await loadPublishedLeaves(published.treeId)).map((leaf) => {
      const liveHash = liveHashes.get(`${leaf.kind}:${leaf.id}`);
      return {
        ...leaf,
        currentRecordMatches: liveHash === leaf.dataHash,
      };
    });
    merkle = {
      published: true,
      publishedAt: published.createdAt,
      treeId: published.treeId,
      treeType: published.treeType,
      hashAlgorithm: published.hashAlgorithm,
      rootHash: published.rootHash,
      nodeCount: published.nodeCount,
      levels: null,
      leaves,
    };
  } else {
    const assembled = assembleTree(report);
    leaves = assembled.leaves.map((leaf) => ({ ...leaf, currentRecordMatches: true }));
    merkle = {
      published: false,
      publishedAt: null,
      treeId: assembled.tree.treeId,
      treeType: assembled.tree.treeType,
      hashAlgorithm: assembled.tree.hashAlgorithm,
      rootHash: assembled.tree.rootHash,
      nodeCount: assembled.tree.nodeCount,
      levels: assembled.tree.levels,
      leaves,
    };
  }

  return {
    generatedAt: new Date().toISOString(),
    contractId: String(contractId),
    contract: report.contract,
    merkle,
    provenanceSummary: provenanceSummary(report),
    interpretation: {
      purpose: published
        ? 'The root was sealed when training evidence was recorded. Verify checks a leaf against that saved root.'
        : 'This root is computed from the current records and is not sealed yet. It is sealed when a completed training job is reviewed or a model is registered.',
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

/**
 * Check one sealed leaf against the saved root. The caller-supplied root is ignored.
 */
async function verifyPublishedLeaf(contractId, nodeId) {
  const published = await findPublishedTree(contractId);
  if (!published) {
    return { isValid: false, error: 'No published audit root for this contract' };
  }
  const node = await db.ProvenanceNode.findOne({
    where: { treeId: published.treeId, nodeId: String(nodeId), nodeType: 'LEAF' },
  });
  if (!node) {
    return { isValid: false, error: 'Leaf is not in the published audit tree' };
  }
  const meta = node.metadata || {};
  const proofResult = verifyInclusionProof(meta.proof, published.rootHash);
  const report = await buildProvenanceAuditReport(contractId, null, { internal: true });
  const liveHash = currentLeafHashes(report).get(`${meta.kind}:${meta.id}`);
  return {
    ...proofResult,
    contractId: String(contractId),
    nodeId: node.nodeId,
    publishedRoot: published.rootHash,
    publishedAt: published.createdAt,
    leaf: {
      kind: meta.kind,
      id: meta.id,
      summary: meta.summary,
      dataHash: node.dataHash,
      payload: meta.payload,
    },
    currentRecordMatches: liveHash === node.dataHash,
  };
}

module.exports = {
  buildContractAuditTree,
  publishContractAuditRoot,
  verifyInclusionProof,
  verifyPublishedLeaf,
  deriveLeavesFromReport,
  stableStringify,
};
