/** Samyog/DEPA Tech Service Provider — runtime confidential compute host (formerly TSP). */
const TSP = 'TSP';
const TDP = 'TDP';
const TDC = 'TDC';
const APP_ADMIN = 'AppAdmin';

const ENTERPRISE_PARTY_TYPES = [TDP, TDC, TSP, APP_ADMIN];

/** Accept legacy Keycloak/DB value during migration. */
function normalizePartyType(partyType) {
  if (partyType === 'TSP') return TSP;
  return partyType;
}

function isTspPartyType(partyType) {
  return normalizePartyType(partyType) === TSP;
}

function partyTypeMatches(partyType, expected) {
  return normalizePartyType(partyType) === normalizePartyType(expected);
}

module.exports = {
  TSP,
  TDP,
  TDC,
  APP_ADMIN,
  ENTERPRISE_PARTY_TYPES,
  normalizePartyType,
  isTspPartyType,
  partyTypeMatches,
};
