const crypto = require('crypto');
const BaseSiemProvider = require('./baseProvider');

/**
 * Microsoft Sentinel / Log Analytics Data Collector API.
 * @see https://learn.microsoft.com/azure/azure-monitor/logs/data-collector-api
 */
class AzureSentinelProvider extends BaseSiemProvider {
  constructor(config) {
    super('sentinel', config);
    this.workspaceId = config.workspaceId || process.env.SIEM_SENTINEL_WORKSPACE_ID;
    this.sharedKey = config.sharedKey || process.env.SIEM_SENTINEL_SHARED_KEY;
    this.logType = config.logType || process.env.SIEM_SENTINEL_LOG_TYPE || 'CANAudit';
  }

  isConfigured() {
    return this.enabled && Boolean(this.workspaceId && this.sharedKey);
  }

  async send(canonicalEvent) {
    if (!this.isConfigured()) {
      return { ok: false, provider: this.name, error: 'not configured' };
    }

    const body = JSON.stringify([canonicalEvent]);
    const date = new Date().toUTCString();
    const contentLength = Buffer.byteLength(body, 'utf8');
    const signature = this.buildSignature(date, contentLength);
    const url = `https://${this.workspaceId}.ods.opinsights.azure.com/api/logs?api-version=2016-04-01`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Log-Type': this.logType,
          'x-ms-date': date,
          Authorization: signature,
          'Content-Length': String(contentLength)
        },
        body
      });
      if (!res.ok) {
        return { ok: false, provider: this.name, error: `HTTP ${res.status}` };
      }
      return { ok: true, provider: this.name };
    } catch (err) {
      return { ok: false, provider: this.name, error: err.message };
    }
  }

  buildSignature(date, contentLength) {
    const stringToSign = `POST\n${contentLength}\napplication/json\nx-ms-date:${date}\n/api/logs`;
    const keyBuffer = Buffer.from(this.sharedKey, 'base64');
    const hmac = crypto.createHmac('sha256', keyBuffer);
    hmac.update(stringToSign, 'utf8');
    return `SharedKey ${this.workspaceId}:${hmac.digest('base64')}`;
  }
}

module.exports = AzureSentinelProvider;
