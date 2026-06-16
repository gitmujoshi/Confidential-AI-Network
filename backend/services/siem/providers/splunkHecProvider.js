const BaseSiemProvider = require('./baseProvider');

/**
 * Splunk HTTP Event Collector (HEC).
 * @see https://docs.splunk.com/Documentation/Splunk/latest/Data/UsetheHTTPEventCollector
 */
class SplunkHecProvider extends BaseSiemProvider {
  constructor(config) {
    super('splunk', config);
    this.url = config.url || process.env.SIEM_SPLUNK_HEC_URL;
    this.token = config.token || process.env.SIEM_SPLUNK_HEC_TOKEN;
    this.index = config.index || process.env.SIEM_SPLUNK_INDEX || 'can_security';
    this.sourcetype = config.sourcetype || process.env.SIEM_SPLUNK_SOURCETYPE || 'can:audit';
  }

  isConfigured() {
    return this.enabled && Boolean(this.url && this.token);
  }

  async send(canonicalEvent) {
    if (!this.isConfigured()) {
      return { ok: false, provider: this.name, error: 'not configured' };
    }

    const endpoint = this.url.endsWith('/services/collector/event')
      ? this.url
      : `${this.url.replace(/\/$/, '')}/services/collector/event`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Splunk ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          time: Math.floor(new Date(canonicalEvent['@timestamp']).getTime() / 1000),
          index: this.index,
          sourcetype: this.sourcetype,
          source: canonicalEvent.can?.source || 'audit-service',
          event: canonicalEvent
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

module.exports = SplunkHecProvider;
