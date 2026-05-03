const crypto = require('crypto');
const axios = require('axios');

function getWebhookTargets() {
  // Comma-separated list of URLs (MVP)
  const raw = process.env.CAN_WEBHOOK_URLS || '';
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function signBody({ secret, timestamp, body }) {
  const base = `${timestamp}.${body}`;
  return crypto.createHmac('sha256', secret).update(base).digest('hex');
}

class CANWebhookDispatcher {
  constructor({
    secret = process.env.CAN_WEBHOOK_SECRET || 'dev-can-webhook-secret',
    timeoutMs = parseInt(process.env.CAN_WEBHOOK_TIMEOUT_MS || '5000', 10),
    maxAttempts = parseInt(process.env.CAN_WEBHOOK_MAX_ATTEMPTS || '3', 10)
  } = {}) {
    this.secret = secret;
    this.timeoutMs = timeoutMs;
    this.maxAttempts = maxAttempts;
  }

  async dispatch(event) {
    const targets = getWebhookTargets();
    if (targets.length === 0) return { delivered: 0, targets: 0 };

    const timestamp = new Date().toISOString();
    const body = JSON.stringify(event);
    const signature = signBody({ secret: this.secret, timestamp, body });

    let delivered = 0;
    await Promise.all(
      targets.map(async (url) => {
        const ok = await this._postWithRetry(url, body, { timestamp, signature });
        if (ok) delivered += 1;
      })
    );

    return { delivered, targets: targets.length };
  }

  async _postWithRetry(url, body, { timestamp, signature }) {
    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      try {
        const res = await axios.post(url, body, {
          timeout: this.timeoutMs,
          headers: {
            'Content-Type': 'application/json',
            'X-CAN-Timestamp': timestamp,
            'X-CAN-Signature': signature,
            'X-CAN-Signature-Version': 'v1'
          },
          validateStatus: () => true
        });
        if (res.status >= 200 && res.status < 300) return true;
      } catch (e) {
        // ignore and retry
      }
    }
    return false;
  }
}

module.exports = {
  CANWebhookDispatcher
};

