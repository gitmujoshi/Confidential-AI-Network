/**
 * Resolve cloud IdP service by AUTH_PROVIDER.
 */

const OciIdentityService = require('./ociIdentityService');
const EntraIdentityService = require('./entraIdentityService');
const GcpIdentityService = require('./gcpIdentityService');

const OIDC_PROVIDERS = new Set(['oci-iam', 'entra', 'gcp-identity']);

let _oci;
let _entra;
let _gcp;

function getAuthProvider() {
  return (process.env.AUTH_PROVIDER || 'keycloak').toLowerCase();
}

function isOidcAuthProvider(provider = getAuthProvider()) {
  return OIDC_PROVIDERS.has(provider);
}

function getCloudIdpService(provider = getAuthProvider()) {
  switch (provider) {
    case 'oci-iam':
      if (!_oci) _oci = new OciIdentityService();
      return _oci;
    case 'entra':
      if (!_entra) _entra = new EntraIdentityService();
      return _entra;
    case 'gcp-identity':
      if (!_gcp) _gcp = new GcpIdentityService();
      return _gcp;
    default:
      return null;
  }
}

function oidcProviderLabel(provider) {
  return (
    {
      'oci-iam': 'OCI IAM',
      entra: 'Microsoft Entra ID',
      'gcp-identity': 'Google Cloud Identity',
    }[provider] || provider
  );
}

module.exports = {
  OIDC_PROVIDERS,
  getAuthProvider,
  isOidcAuthProvider,
  getCloudIdpService,
  oidcProviderLabel,
};
