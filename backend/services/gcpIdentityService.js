/**
 * Google Cloud Identity Platform / Google OAuth — OIDC helpers.
 * AUTH_PROVIDER=gcp-identity
 *
 * Default flow uses Google OAuth authorize + ID/access token validation.
 * Set GCP_OIDC_ISSUER to https://securetoken.google.com/{projectId} when
 * validating Identity Platform ID tokens instead of Google accounts tokens.
 */

const { BaseOidcIdentityService } = require('./oidcIdentityBase');

class GcpIdentityService extends BaseOidcIdentityService {
  constructor() {
    const projectId = process.env.GCP_PROJECT_ID || '';
    const useIdentityPlatformTokens =
      (process.env.GCP_OIDC_ISSUER || '').includes('securetoken.google.com') ||
      process.env.GCP_USE_IDENTITY_PLATFORM_TOKENS === 'true';

    const authority = useIdentityPlatformTokens
      ? `https://securetoken.google.com/${projectId}`
      : process.env.GCP_OIDC_AUTHORITY || 'https://accounts.google.com';

    const issuer =
      process.env.GCP_OIDC_ISSUER ||
      (useIdentityPlatformTokens
        ? `https://securetoken.google.com/${projectId}`
        : 'https://accounts.google.com');

    const audience =
      process.env.GCP_OIDC_AUDIENCE ||
      (useIdentityPlatformTokens ? projectId : process.env.GCP_OIDC_CLIENT_ID || '');

    const jwksUrl =
      process.env.GCP_OIDC_JWKS_URL ||
      (useIdentityPlatformTokens
        ? 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
        : 'https://www.googleapis.com/oauth2/v3/certs');

    super({
      provider: 'gcp-identity',
      authority,
      clientId: process.env.GCP_OIDC_CLIENT_ID || process.env.GCP_IDENTITY_CLIENT_ID || '',
      clientSecret: process.env.GCP_OIDC_CLIENT_SECRET || '',
      issuer,
      audience,
      jwksUrl,
      roleClaim: process.env.GCP_ROLE_CLAIM || 'roles',
      redirectUri:
        process.env.GCP_IDENTITY_REDIRECT_URI ||
        process.env.GCP_OIDC_REDIRECT_URI ||
        '',
      defaultAuthorizePath: '',
      defaultTokenPath: '',
      defaultJwksPath: '',
    });

    this.projectId = projectId;
    this.useIdentityPlatformTokens = useIdentityPlatformTokens;
  }

  isConfigured() {
    return Boolean(this.clientId && (this.projectId || this.authority));
  }

  async getDiscovery() {
    if (this.useIdentityPlatformTokens) {
      // Identity Platform tokens are validated via fixed JWKS; no OIDC discovery for authorize.
      return {
        authorization_endpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        token_endpoint: 'https://oauth2.googleapis.com/token',
        jwks_uri: this.jwksUrl,
      };
    }
    if (this._discovery) return this._discovery;
    const { data } = await require('axios').get(
      'https://accounts.google.com/.well-known/openid-configuration',
      { timeout: 10000 }
    );
    this._discovery = data;
    return data;
  }

  async getAuthorizeUrl({ state, redirectUri, nonce } = {}) {
    const discovery = await this.getDiscovery();
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      scope: 'openid email profile',
      redirect_uri: redirectUri || this.redirectUri,
      state: state || 'can-gcp',
      access_type: 'offline',
      prompt: 'select_account',
    });
    if (nonce) params.set('nonce', nonce);
    return `${discovery.authorization_endpoint}?${params.toString()}`;
  }

  getPublicConfig() {
    return {
      ...super.getPublicConfig(),
      projectId: this.projectId,
    };
  }
}

module.exports = GcpIdentityService;
