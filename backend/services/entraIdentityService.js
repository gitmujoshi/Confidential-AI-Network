/**
 * Microsoft Entra ID (Azure AD) — OIDC JWT + authorize/token helpers.
 * AUTH_PROVIDER=entra
 */

const { BaseOidcIdentityService } = require('./oidcIdentityBase');

class EntraIdentityService extends BaseOidcIdentityService {
  constructor() {
    const tenantId = process.env.ENTRA_TENANT_ID || 'common';
    const authority =
      process.env.ENTRA_AUTHORITY ||
      `https://login.microsoftonline.com/${tenantId}/v2.0`;
    const clientId = process.env.ENTRA_CLIENT_ID || '';
    const apiAudience =
      process.env.ENTRA_API_AUDIENCE ||
      process.env.ENTRA_API_CLIENT_ID ||
      clientId;

    super({
      provider: 'entra',
      authority,
      clientId,
      clientSecret: process.env.ENTRA_CLIENT_SECRET || '',
      issuer: process.env.ENTRA_ISSUER || authority,
      audience: apiAudience,
      jwksUrl: process.env.ENTRA_JWKS_URL || '',
      roleClaim: process.env.ENTRA_ROLE_CLAIM || 'roles',
      redirectUri: process.env.ENTRA_REDIRECT_URI || '',
      defaultAuthorizePath: '/oauth2/v2.0/authorize',
      defaultTokenPath: '/oauth2/v2.0/token',
      defaultJwksPath: '/discovery/v2.0/keys',
      extraAuthorizeParams: {
        response_mode: 'query',
      },
    });

    this.tenantId = tenantId;
  }

  getPublicConfig() {
    return {
      ...super.getPublicConfig(),
      tenantId: this.tenantId,
    };
  }

  async getAuthorizeUrl(opts = {}) {
    // Entra SPA often uses scope = openid profile email + api audience
    const discovery = await this.getDiscovery().catch(() => null);
    const authorizeEndpoint =
      discovery?.authorization_endpoint ||
      `${this.authority}/oauth2/v2.0/authorize`;
    const apiScope =
      process.env.ENTRA_API_SCOPE ||
      (this.audience && this.audience.startsWith('api://')
        ? `${this.audience}/access_as_user`
        : 'openid');
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      response_mode: 'query',
      scope: `openid profile email offline_access ${apiScope}`.trim(),
      redirect_uri: opts.redirectUri || this.redirectUri,
      state: opts.state || 'can-entra',
    });
    if (opts.nonce) params.set('nonce', opts.nonce);
    return `${authorizeEndpoint}?${params.toString()}`;
  }
}

module.exports = EntraIdentityService;
