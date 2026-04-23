const crypto = require('crypto');
const db = require('../models');

function makeClaimId(prefix = 'CLAIM') {
  const rand = crypto.randomBytes(6).toString('hex');
  return `${prefix}-${Date.now()}-${rand}`;
}

/**
 * Deterministic claim_id for events that must not double-insert (same job, same registration, etc.).
 * Fits DB VARCHAR(255) regardless of jobId length.
 */
function stableClaimId(claimType, dedupeKey) {
  const h = crypto
    .createHash('sha256')
    .update(`${String(claimType)}:${String(dedupeKey)}`)
    .digest('hex')
    .slice(0, 48);
  return `SCITT-${String(claimType).replace(/[^a-zA-Z0-9_-]/g, '_')}-${h}`;
}

async function writeLocalScittClaim({
  contractId,
  claimType,
  claimData,
  status = 'PENDING',
  receipt = null,
  /** If set, claim_id is deterministic; duplicate inserts are ignored (unique on claim_id). */
  stableDedupeKey = null,
}) {
  if (!contractId) throw new Error('writeLocalScittClaim: contractId is required');
  if (!claimType) throw new Error('writeLocalScittClaim: claimType is required');
  if (!claimData || typeof claimData !== 'object') throw new Error('writeLocalScittClaim: claimData must be an object');

  const claimId = stableDedupeKey ? stableClaimId(claimType, stableDedupeKey) : makeClaimId('SCITT');

  if (process.env.PROVENANCE_DEBUG === 'true' || process.env.PROVENANCE_DEBUG === '1') {
    // Intentionally using console.log so it shows up in dev logs.
    console.log(`🧾 [provenance] writeLocalScittClaim contractId=${contractId} type=${claimType} claimId=${claimId}`);
  }

  try {
    return await db.ScittClaim.create({
      claimId,
      contractId: String(contractId),
      claimType: String(claimType),
      claimData,
      receipt,
      status,
    });
  } catch (e) {
    if (stableDedupeKey && e && e.name === 'SequelizeUniqueConstraintError') {
      const row = await db.ScittClaim.findOne({ where: { claimId } });
      if (row) return row;
    }
    throw e;
  }
}

module.exports = {
  writeLocalScittClaim,
  stableClaimId,
};

