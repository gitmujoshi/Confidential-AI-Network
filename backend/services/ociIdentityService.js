/**
 * OCI IAM Identity Domains — OIDC JWT validation and authorize/token helpers.
 * Used when AUTH_PROVIDER=oci-iam (Keycloak disabled on OCI).
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

class OciIdentityService {
  constructor() {
    this.domainUrl = (process.env.OCI_IDENTITY_DOMAIN_URL || '').replace(/\/$/, '');
    this.clientId = process.env.OCI_IDENTITY_CLIENT_ID || '';
    this.apiClientId = process.env.OCI_IDENTITY_API_CLIENT_ID || this.clientId;
    this.clientSecret = process.env.OCI_IDENTITY_CLIENT_SECRET || '';
    this.issuer = process.env.OCI_IDENTITY_ISSUER || this.domainUrl;
    this.audience = process.env.OCI_IDENTITY_AUDIENCE || this.apiClientId || this.clientId;
    this.jwksUrl = process.env.OCI_IDENTITY_JWKS_URL || '';
    this.roleClaim = process.env.OCI_IDENTITY_ROLE_CLAIM || 'groups';
    this.redirectUri = process.env.OCI_IDENTITY_REDIRECT_URI || '';
    this._jwks = null;
    this._discovery = null;
  }

  isConfigured() {
    return Boolean(this.domainUrl && this.clientId);
  }

  async getDiscovery() {
    if (this._discovery) return this._discovery;
    if (!this.domainUrl) {
      throw new Error('OCI_IDENTITY_DOMAIN_URL is required');
    }
    const url = `${this.domainUrl}/.well-known/openid-configuration`;
    const { data } = await axios.get(url, { timeout: 10000 });
    this._discovery = data;
    return data;
  }

  async getJwksClient() {
    if (this._jwks) return this._jwks;
    let jwksUri = this.jwksUrl;
    if (!jwksUri) {
      try {
        const discovery = await this.getDiscovery();
        jwksUri = discovery.jwks_uri;
      } catch (_) {
        jwksUri = `${this.domainUrl}/admin/v1/SigningCert/jwk`;
      }
    }
    this._jwks = jwksClient({
      jwksUri,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 10 * 60 * 1000,
      rateLimit: true,
    });
    return this._jwks;
  }

  async getSigningKey(header) {
    const client = await this.getJwksClient();
    return new Promise((resolve, reject) => {
      client.getSigningKey(header.kid, (err, key) => {
        if (err) return reject(err);
        resolve(key.getPublicKey());
      });
    });
  }

  /**
   * Validate access token from Identity Domain and extract user claims.
   * @returns {{ valid: boolean, user?: object, payload?: object, error?: string }}
   */
  async validateToken(token) {
    try {
      if (!token) return { valid: false, error: 'Token missing' };
      if (!this.isConfigured()) {
        return { valid: false, error: 'OCI Identity Domains not configured' };
      }

      const decoded = await new Promise((resolve, reject) => {
        jwt.verify(
          token,
          (header, callback) => {
            this.getSigningKey(header)
              .then((key) => callback(null, key))
              .catch((err) => callback(err));
          },
          {
            algorithms: ['RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512'],
            issuer: this.issuer || undefined,
            audience: this.audience || undefined,
            clockTolerance: 60,
          },
          (err, payload) => (err ? reject(err) : resolve(payload))
        );
      });

      const username =
        decoded.preferred_username ||
        decoded.user_name ||
        decoded.sub ||
        decoded.email;
      const groups = decoded[this.roleClaim] || decoded.groups || [];

      return {
        valid: true,
        payload: decoded,
        user: {
          email: decoded.email || (typeof username === 'string' && username.includes('@') ? username : undefined),
          username,
          name: decoded.name || decoded.display_name,
          sub: decoded.sub,
          groups: Array.isArray(groups) ? groups : [groups].filter(Boolean),
          partyType: this.mapGroupsToPartyType(groups),
        },
      };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  mapGroupsToPartyType(groups) {
    const list = (Array.isArray(groups) ? groups : [groups])
      .filter(Boolean)
      .map((g) => String(g).toLowerCase());
    if (list.some((g) => g.includes('app-admin') || g.endsWith('/appadmin') || g === 'appadmin')) {
      return 'AppAdmin';
    }
    if (list.some((g) => g.includes('ccrp') || g.includes('tsp'))) return 'TSP';
    if (list.some((g) => g.includes('tdp'))) return 'TDP';
    if (list.some((g) => g.includes('tdc'))) return 'TDC';
    return null;
  }

  async getAuthorizeUrl({ state, redirectUri, nonce } = {}) {
    const discovery = await this.getDiscovery().catch(() => null);
    const authorizeEndpoint =
      discovery?.authorization_endpoint || `${this.domainUrl}/oauth2/v1/authorize`;
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      scope: 'openid profile email',
      redirect_uri: redirectUri || this.redirectUri,
      state: state || 'can-oci',
    });
    if (nonce) params.set('nonce', nonce);
    return `${authorizeEndpoint}?${params.toString()}`;
  }

  async exchangeCodeForTokens(code, redirectUri) {
    const discovery = await this.getDiscovery().catch(() => null);
    const tokenEndpoint = discovery?.token_endpoint || `${this.domainUrl}/oauth2/v1/token`;
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri || this.redirectUri,
      client_id: this.clientId,
    });
    if (this.clientSecret) {
      body.set('client_secret', this.clientSecret);
    }
    const { data } = await axios.post(tokenEndpoint, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000,
    });
    return data;
  }

  getPublicConfig() {
    return {
      provider: 'oci-iam',
      domainUrl: this.domainUrl,
      clientId: this.clientId,
      redirectUri: this.redirectUri,
      configured: this.isConfigured(),
    };
  }
}

module.exports = OciIdentityService;
