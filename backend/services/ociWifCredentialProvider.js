/**
 * OCI Workload Identity Federation credential helper (design scaffold)
 *
 * Path F: SPIRE JWT-SVID → Identity Domain token-exchange → User Principal Session Token
 * Design: docs/deployment/OCI_SPIFFE_SPIRE_WIF.md §4.2
 *
 * Env (from K8s ConfigMap/Secret when enable_wif=true):
 *   OCI_WIF_ENABLED, OCI_WIF_DOMAIN_URL, OCI_WIF_TOKEN_EXCHANGE_CLIENT_ID,
 *   OCI_WIF_TOKEN_EXCHANGE_CLIENT_SECRET, OCI_WIF_SUBJECT_TOKEN_TYPE,
 *   OCI_WIF_REQUESTED_TOKEN_TYPE, SPIFFE_SOCKET_PATH / SPIRE JWT path
 *
 * Live exchange requires SPIRE agent socket + Identity Domain reachability.
 */

class OciWifCredentialProvider {
  constructor(env = process.env) {
    this.enabled =
      String(env.OCI_WIF_ENABLED || '').toLowerCase() === 'true' || env.OCI_WIF_ENABLED === '1';
    this.domainUrl = (env.OCI_WIF_DOMAIN_URL || env.OCI_IDENTITY_DOMAIN_URL || '').replace(/\/$/, '');
    this.clientId = env.OCI_WIF_TOKEN_EXCHANGE_CLIENT_ID || '';
    this.clientSecret = env.OCI_WIF_TOKEN_EXCHANGE_CLIENT_SECRET || '';
    this.subjectTokenType = env.OCI_WIF_SUBJECT_TOKEN_TYPE || 'jwt';
    this.requestedTokenType =
      env.OCI_WIF_REQUESTED_TOKEN_TYPE || 'urn:oci:token-type:oci-upst';
  }

  isConfigured() {
    return Boolean(
      this.enabled && this.domainUrl && this.clientId && this.clientSecret
    );
  }

  /**
   * Exchange a SPIRE JWT identity document for an OCI session token descriptor.
   * @param {string} jwtSvid - SPIRE JWT-SVID
   * @param {string} [popPublicKeyPem] - proof-of-possession public key (PEM)
   * @returns {Promise<{ tokenType: string, accessToken: string | null, expiresIn: number | null, designNote: string }>}
   */
  async exchangeJwtSvidForUpst(jwtSvid, popPublicKeyPem) {
    if (!this.isConfigured()) {
      throw new Error(
        'OCI WIF is not configured. Set OCI_WIF_ENABLED and token-exchange client env from modules/wif.'
      );
    }
    if (!jwtSvid || typeof jwtSvid !== 'string') {
      throw new Error('jwtSvid (SPIRE JWT identity document) is required');
    }

    // Design scaffold: document the token-exchange shape without calling OCI until tenancy apply.
    if (
      String(process.env.OCI_WIF_SIMULATION_MODE || '').toLowerCase() === 'true' ||
      process.env.NODE_ENV === 'test'
    ) {
      return {
        tokenType: this.requestedTokenType,
        accessToken: null,
        expiresIn: 3600,
        designNote:
          'Simulated WIF exchange — implement HTTP POST to ' +
          `${this.domainUrl}/oauth2/v1/token with grant_type=urn:ietf:params:oauth:grant-type:token-exchange`,
        popPublicKeyPresent: Boolean(popPublicKeyPem),
        clientId: this.clientId,
      };
    }

    throw new Error(
      'Live OCI WIF token exchange is not wired in this build. ' +
        'Enable modules/wif, mount oci-wif-secret, set OCI_WIF_SIMULATION_MODE=true for design tests, ' +
        'or implement the token-exchange HTTP call against Identity Domain. See OCI_SPIFFE_SPIRE_WIF.md'
    );
  }
}

module.exports = {
  OciWifCredentialProvider,
};
