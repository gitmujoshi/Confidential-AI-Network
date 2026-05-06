'use strict';

/**
 * Pure authorization helpers for POST /api/contracts/:contractId/sign (and signing-data).
 * Covered by unit tests so JWT vs Keycloak user shapes and TDP linkage regressions surface without E2E.
 */

function normalizePartyType(partyType) {
  return String(partyType || '').trim().toUpperCase();
}

function isAppAdminParty(partyType) {
  return normalizePartyType(partyType) === 'APPADMIN';
}

/** Actor may sign as claimed party unless AppAdmin-only logic applies elsewhere. */
function rolesAllowSigning(actorPartyType, claimedPartyType) {
  const actorParty = normalizePartyType(actorPartyType);
  const claimedParty = normalizePartyType(claimedPartyType);
  if (actorParty === 'APPADMIN') return true;
  return actorParty === claimedParty;
}

/**
 * Dev JWT puts identity on req.user; Keycloak path sets req.user.localUser.
 * Keep fields needed by contracts route (signatures + SCITT claim metadata).
 */
/** Sequelize JSON/FK fields are reliable on plain rows (matches GET /contracts/:id shape). */
function toPlainContract(contract) {
  if (contract == null) return null;
  if (typeof contract.toJSON === 'function') return contract.toJSON();
  return contract;
}

function resolveSigningUser(req) {
  const lu = req.user?.localUser;
  if (lu != null && lu.id != null && lu.partyType) {
    return {
      id: lu.id,
      partyType: lu.partyType,
      email: lu.email,
      walletAddress: lu.walletAddress,
      did: lu.did,
      depaId: lu.depaId,
    };
  }
  const u = req.user;
  if (u != null && u.id != null && u.partyType) {
    return {
      id: u.id,
      partyType: u.partyType,
      email: u.email,
      walletAddress: u.walletAddress,
      did: u.did,
      depaId: u.depaId,
    };
  }
  return null;
}

function parseContractDatasets(contract) {
  const raw =
    contract.contractDatasets ||
    contract.datasetSelections ||
    contract.contract_datasets ||
    contract.dataset_selections;
  let datasets = raw;
  if (typeof datasets === 'string') {
    try {
      datasets = JSON.parse(datasets);
    } catch {
      datasets = null;
    }
  }
  return Array.isArray(datasets) ? datasets : [];
}

/** Fast path without DB: FK columns + embedded dataset rows. */
function isLinkedTdpStatic(contract, currentUserId) {
  const row = toPlainContract(contract);
  const uid = Number(currentUserId);
  if (Number(row.tdpId) === uid || Number(row.primaryTdpId) === uid) {
    return true;
  }
  const list = parseContractDatasets(row);
  return list.some((d) => {
    const tid = d?.tdpId ?? d?.tdp_id ?? d?.tdp?.id;
    return Number(tid) === uid;
  });
}

function emailsMatch(a, b) {
  if (!a || !b) return false;
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

/** Split dataset identifiers in JSON rows: internal PK vs business datasetId string. */
function datasetPkAndSlugRefs(list) {
  const internalIds = new Set();
  const externalIds = new Set();
  for (const d of list) {
    const did = d?.datasetId;
    if (did == null || did === '') continue;
    if (typeof did === 'number' && Number.isFinite(did)) {
      internalIds.add(did);
      continue;
    }
    if (typeof did === 'string') {
      const t = did.trim();
      if (t === '') continue;
      if (/^\d+$/.test(t)) internalIds.add(Number(t));
      else externalIds.add(t);
    }
  }
  return { internalIds: [...internalIds], externalIds: [...externalIds] };
}

/**
 * Full TDP linkage including dataset owner fallbacks (sparse JSON / legacy rows).
 * @param {object} contract — Sequelize model or plain row
 * @param {number|string} currentUserId
 * @param {{ Dataset?: object }} db — models bag with Sequelize Dataset
 */
async function resolveIsLinkedTdp(contract, currentUserId, db, signerEmail = null) {
  if (isLinkedTdpStatic(contract, currentUserId)) {
    return true;
  }
  const row = toPlainContract(contract);
  const uid = Number(currentUserId);

  const fkDatasetPk = row.primaryDatasetId || row.datasetId;
  const candidatesPk = new Set();
  if (fkDatasetPk != null && fkDatasetPk !== '') {
    candidatesPk.add(Number(fkDatasetPk));
  }

  const list = parseContractDatasets(row);
  const { internalIds, externalIds } = datasetPkAndSlugRefs(list);
  for (const pk of internalIds) {
    if (pk != null && Number.isFinite(pk)) candidatesPk.add(pk);
  }

  if (db?.Dataset?.findByPk && candidatesPk.size) {
    for (const pk of candidatesPk) {
      const dsRow = await db.Dataset.findByPk(pk, { attributes: ['ownerId'] });
      if (dsRow && Number(dsRow.ownerId) === uid) {
        return true;
      }
    }
  }

  for (const extId of externalIds) {
    if (!db?.Dataset?.findOne) break;
    const dsRow = await db.Dataset.findOne({
      where: { datasetId: extId },
      attributes: ['ownerId'],
    });
    if (dsRow && Number(dsRow.ownerId) === uid) {
      return true;
    }
  }

  const listForEmail = parseContractDatasets(row);
  if (signerEmail && listForEmail.length) {
    const hit = listForEmail.some(
      (d) =>
        emailsMatch(signerEmail, d?.tdpEmail) ||
        emailsMatch(signerEmail, d?.tdp?.email)
    );
    if (hit) return true;
  }

  return false;
}

module.exports = {
  normalizePartyType,
  isAppAdminParty,
  rolesAllowSigning,
  resolveSigningUser,
  toPlainContract,
  parseContractDatasets,
  datasetPkAndSlugRefs,
  isLinkedTdpStatic,
  resolveIsLinkedTdp,
};
