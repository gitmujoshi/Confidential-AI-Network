/** Samyog/DEPA Tech Service Provider — runtime confidential compute host (formerly CCRP). */
const TSP = 'TSP';
const TDP = 'TDP';
const TDC = 'TDC';
const APP_ADMIN = 'AppAdmin';
/** Read-only compliance / incident reviewer — not a contract party. */
const AUDITOR = 'Auditor';

const ENTERPRISE_PARTY_TYPES = [TDP, TDC, TSP, APP_ADMIN, AUDITOR];

/** Accept legacy Keycloak/DB value during migration. */
function normalizePartyType(partyType) {
  if (partyType === 'CCRP') return TSP;
  if (partyType === 'TSP') return TSP;
  return partyType;
}

function isTspPartyType(partyType) {
  return normalizePartyType(partyType) === TSP;
}

function isAuditorPartyType(partyType) {
  return normalizePartyType(partyType) === AUDITOR;
}

/** AppAdmin or Auditor: global read of contracts / provenance (no write/sign). */
function hasGlobalContractRead(partyType) {
  const p = normalizePartyType(partyType);
  return p === APP_ADMIN || p === AUDITOR;
}

function partyTypeMatches(partyType, expected) {
  return normalizePartyType(partyType) === normalizePartyType(expected);
}

module.exports = {
  TSP,
  TDP,
  TDC,
  APP_ADMIN,
  AUDITOR,
  ENTERPRISE_PARTY_TYPES,
  normalizePartyType,
  isTspPartyType,
  isAuditorPartyType,
  hasGlobalContractRead,
  partyTypeMatches,
};
