const { SiemIntegrationService, getSiemIntegrationService, PROVIDER_REGISTRY } = require('./siemIntegrationService');
const { buildCanonicalEvent, sanitize } = require('./canonicalEvent');

module.exports = {
  SiemIntegrationService,
  getSiemIntegrationService,
  PROVIDER_REGISTRY,
  buildCanonicalEvent,
  sanitize
};
