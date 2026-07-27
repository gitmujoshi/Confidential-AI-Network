/**
 * Shared helpers for cloud OIDC IdPs (OCI / Entra / GCP).
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

function mapGroupsToPartyType(groups, roleClaimValues = []) {
  const list = [...(Array.isArray(groups) ? groups : [groups]), ...roleClaimValues]
    .filter(Boolean)
    .map((g) => String(g).toLowerCase());
  if (list.some((g) => g.includes('appadmin') || g.includes('app-admin') || g === 'admin')) {
    return 'AppAdmin';
  }
  if (list.some((g) => g.includes('ccrp') || g.includes('tsp'))) return 'TSP';
  if (list.some((g) => g.includes('tdp'))) return 'TDP';
  if (list.some((g) => g.includes('tdc'))) return 'TDC';
  return null;
}

class BaseOidcIdentityService {
  constructor({
    provider,
    authority,
    clientId,
    clientSecret = '',
    issuer,
    audience,
    jwksUrl = '',
    roleClaim = 'roles',
    redirectUri = '',
    defaultAuthorizePath,
    defaultTokenPath,
    defaultJwksPath,
    extraAuthorizeParams = {},
  }) {
    this.provider = provider;
    this.authority = (authority || '').replace(/\/$/, '');
    this.clientId = clientId || '';
    this.clientSecret = clientSecret || '';
    this.issuer = issuer || this.authority;
    this.audience = audience || this.clientId;
    this.jwksUrl = jwksUrl || '';
    this.roleClaim = roleClaim;
    this.redirectUri = redirectUri || '';
    this.defaultAuthorizePath = defaultAuthorizePath;
    this.defaultTokenPath = defaultTokenPath;
    this.defaultJwksPath = defaultJwksPath;
    this.extraAuthorizeParams = extraAuthorizeParams;
    this._jwks = null;
    this._discovery = null;
  }

  isConfigured() {
    return Boolean(this.authority && this.clientId);
  }

  async getDiscovery() {
    if (this._discovery) return this._discovery;
    if (!this.authority) throw new Error(`${this.provider}: authority URL required`);
    const url = `${this.authority}/.well-known/openid-configuration`;
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
        jwksUri = this.defaultJwksPath
          ? `${this.authority}${this.defaultJwksPath}`
          : `${this.authority}/discovery/v2.0/keys`;
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

  async validateToken(token) {
    try {
      if (!token) return { valid: false, error: 'Token missing' };
      if (!this.isConfigured()) {
        return { valid: false, error: `${this.provider} not configured` };
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
        decoded.unique_name ||
        decoded.email ||
        decoded.sub;
      const roles = decoded[this.roleClaim] || decoded.roles || decoded.groups || [];
      const roleList = Array.isArray(roles) ? roles : [roles].filter(Boolean);

      return {
        valid: true,
        payload: decoded,
        user: {
          email:
            decoded.email ||
            (typeof username === 'string' && username.includes('@') ? username : undefined),
          username,
          name: decoded.name || decoded.display_name,
          sub: decoded.sub,
          groups: roleList,
          partyType: mapGroupsToPartyType(roleList),
        },
      };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  async getAuthorizeUrl({ state, redirectUri, nonce } = {}) {
    const discovery = await this.getDiscovery().catch(() => null);
    const authorizeEndpoint =
      discovery?.authorization_endpoint ||
      `${this.authority}${this.defaultAuthorizePath || '/oauth2/v2.0/authorize'}`;
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      scope: 'openid profile email offline_access',
      redirect_uri: redirectUri || this.redirectUri,
      state: state || `can-${this.provider}`,
      ...this.extraAuthorizeParams,
    });
    if (nonce) params.set('nonce', nonce);
    return `${authorizeEndpoint}?${params.toString()}`;
  }

  async exchangeCodeForTokens(code, redirectUri) {
    const discovery = await this.getDiscovery().catch(() => null);
    const tokenEndpoint =
      discovery?.token_endpoint ||
      `${this.authority}${this.defaultTokenPath || '/oauth2/v2.0/token'}`;
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

  /**
   * Prefer access_token; fall back to id_token when API audience validation needs ID token claims.
   */
  pickAccessToken(tokenResponse) {
    return tokenResponse.access_token || tokenResponse.id_token;
  }

  getPublicConfig() {
    return {
      provider: this.provider,
      authority: this.authority,
      clientId: this.clientId,
      redirectUri: this.redirectUri,
      configured: this.isConfigured(),
    };
  }
}

module.exports = {
  BaseOidcIdentityService,
  mapGroupsToPartyType,
};
