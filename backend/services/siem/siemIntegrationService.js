const { buildCanonicalEvent } = require('./canonicalEvent');
const HttpWebhookProvider = require('./providers/httpWebhookProvider');
const SplunkHecProvider = require('./providers/splunkHecProvider');
const AzureSentinelProvider = require('./providers/azureSentinelProvider');
const OciLoggingProvider = require('./providers/ociLoggingProvider');

const PROVIDER_REGISTRY = {
  webhook: HttpWebhookProvider,
  splunk: SplunkHecProvider,
  sentinel: AzureSentinelProvider,
  oci: OciLoggingProvider
};

/**
 * Multi-provider SIEM export framework.
 * Forwards canonical security events to Splunk, Sentinel, OCI, or generic webhooks.
 */
class SiemIntegrationService {
  constructor(options = {}) {
    this.enabled = options.enabled ?? envBool('SIEM_ENABLED', false);
    this.environment = options.environment || process.env.SIEM_ENVIRONMENT || process.env.NODE_ENV || 'development';
    this.failSilently = options.failSilently !== false;
    this.providers = options.providers || this.loadProvidersFromEnv();
  }

  loadProvidersFromEnv() {
    const names = (process.env.SIEM_PROVIDERS || 'webhook')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    return names
      .map((name) => {
        const ProviderClass = PROVIDER_REGISTRY[name];
        if (!ProviderClass) {
          console.warn(`[SIEM] Unknown provider: ${name}`);
          return null;
        }
        return new ProviderClass({});
      })
      .filter(Boolean);
  }

  isEnabled() {
    return this.enabled && this.providers.some((p) => p.isConfigured());
  }

  /**
   * Forward an audit log record to all configured SIEM providers.
   * Non-blocking when called without await from auditService.
   */
  async forwardAuditLog(auditLog) {
    if (!this.enabled) return { skipped: true, reason: 'disabled' };

    const canonical = buildCanonicalEvent({
      eventType: auditLog.eventType,
      eventData: auditLog.eventData,
      userId: auditLog.userId,
      ipAddress: auditLog.ipAddress,
      userAgent: auditLog.userAgent,
      eventId: auditLog.id ? String(auditLog.id) : undefined,
      timestamp: auditLog.timestamp,
      environment: this.environment
    });

    return this.forwardEvent(canonical);
  }

  async forwardEvent(canonicalEvent) {
    if (!this.enabled) return { skipped: true, reason: 'disabled' };

    const active = this.providers.filter((p) => p.isConfigured());
    if (active.length === 0) {
      return { skipped: true, reason: 'no configured providers' };
    }

    const results = await Promise.all(
      active.map(async (provider) => {
        try {
          return await provider.send(canonicalEvent);
        } catch (err) {
          return { ok: false, provider: provider.name, error: err.message };
        }
      })
    );

    const failures = results.filter((r) => !r.ok);
    if (failures.length > 0 && !this.failSilently) {
      console.warn('[SIEM] Export failures:', failures);
    }

    return {
      forwarded: results.filter((r) => r.ok).map((r) => r.provider),
      failures
    };
  }

  /** Health check for ops / status endpoint */
  status() {
    return {
      enabled: this.enabled,
      environment: this.environment,
      providers: this.providers.map((p) => ({
        name: p.name,
        configured: p.isConfigured()
      }))
    };
  }
}

function envBool(key, defaultValue) {
  const v = process.env[key];
  if (v === undefined) return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
}

// Singleton for app-wide use
let instance = null;

function getSiemIntegrationService() {
  if (!instance) {
    instance = new SiemIntegrationService();
  }
  return instance;
}

module.exports = {
  SiemIntegrationService,
  getSiemIntegrationService,
  PROVIDER_REGISTRY
};
