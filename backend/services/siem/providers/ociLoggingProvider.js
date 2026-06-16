const BaseSiemProvider = require('./baseProvider');

/**
 * OCI Logging via HTTP ingest endpoint (Function, API Gateway, or Service Connector target).
 * Native OCI → SIEM routing is documented in deployment/siem/ for infra logs.
 */
class OciLoggingProvider extends BaseSiemProvider {
  constructor(config) {
    super('oci', config);
    this.url = config.url || process.env.SIEM_OCI_LOGGING_ENDPOINT;
    this.authHeader = config.authHeader || process.env.SIEM_OCI_AUTH_HEADER;
  }

  isConfigured() {
    return this.enabled && Boolean(this.url);
  }

  async send(canonicalEvent) {
    if (!this.isConfigured()) {
      return { ok: false, provider: this.name, error: 'not configured' };
    }

    const headers = {
      'Content-Type': 'application/json',
      'X-Can-Source': 'audit-service'
    };
    if (this.authHeader) {
      headers.Authorization = this.authHeader;
    }

    try {
      const res = await fetch(this.url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          specversion: '1.0',
          type: 'com.can.audit.event',
          source: canonicalEvent.can?.source || 'audit-service',
          id: canonicalEvent.event?.id,
          time: canonicalEvent['@timestamp'],
          datacontenttype: 'application/json',
          data: canonicalEvent
        })
      });
      if (!res.ok) {
        return { ok: false, provider: this.name, error: `HTTP ${res.status}` };
      }
      return { ok: true, provider: this.name };
    } catch (err) {
      return { ok: false, provider: this.name, error: err.message };
    }
  }
}

module.exports = OciLoggingProvider;
