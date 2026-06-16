const BaseSiemProvider = require('./baseProvider');

/**
 * Generic HTTP webhook — works with OCI Functions forwarders, custom collectors, Elastic, etc.
 */
class HttpWebhookProvider extends BaseSiemProvider {
  constructor(config) {
    super('webhook', config);
    this.url = config.url || process.env.SIEM_WEBHOOK_URL;
    this.timeoutMs = config.timeoutMs || 5000;
    this.headers = config.headers || parseHeaders(process.env.SIEM_WEBHOOK_HEADERS);
  }

  isConfigured() {
    return this.enabled && Boolean(this.url);
  }

  async send(canonicalEvent) {
    if (!this.isConfigured()) {
      return { ok: false, provider: this.name, error: 'not configured' };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.headers
        },
        body: JSON.stringify(canonicalEvent),
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!res.ok) {
        return { ok: false, provider: this.name, error: `HTTP ${res.status}` };
      }
      return { ok: true, provider: this.name };
    } catch (err) {
      clearTimeout(timer);
      return { ok: false, provider: this.name, error: err.message };
    }
  }
}

function parseHeaders(raw) {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

module.exports = HttpWebhookProvider;
