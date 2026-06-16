const { buildCanonicalEvent, sanitize } = require('../../services/siem/canonicalEvent');
const { SiemIntegrationService } = require('../../services/siem/siemIntegrationService');

describe('SIEM canonicalEvent', () => {
  test('buildCanonicalEvent redacts sensitive fields', () => {
    const event = buildCanonicalEvent({
      eventType: 'AUTH_LOGIN',
      eventData: { success: true, password: 'secret123', token: 'abc' },
      userId: 1,
      ipAddress: '10.0.0.1'
    });

    expect(event.event.action).toBe('AUTH_LOGIN');
    expect(event.details.password).toBe('***REDACTED***');
    expect(event.details.token).toBe('***REDACTED***');
    expect(event.user.id).toBe('1');
    expect(event.can.project).toBe('ConfidentialAINetwork');
  });

  test('sanitize handles nested objects', () => {
    const out = sanitize({ client_secret: 'x', nested: { api_key: 'y' } });
    expect(out.client_secret).toBe('***REDACTED***');
    expect(out.nested.api_key).toBe('***REDACTED***');
  });
});

describe('SiemIntegrationService', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  test('disabled when SIEM_ENABLED is false', () => {
    process.env = { ...originalEnv, SIEM_ENABLED: 'false' };
    const svc = new SiemIntegrationService();
    expect(svc.isEnabled()).toBe(false);
  });

  test('status reports provider configuration', () => {
    process.env = {
      ...originalEnv,
      SIEM_ENABLED: 'true',
      SIEM_PROVIDERS: 'webhook,splunk',
      SIEM_WEBHOOK_URL: 'https://example.com/hook'
    };
    const svc = new SiemIntegrationService();
    const status = svc.status();
    expect(status.enabled).toBe(true);
    expect(status.providers.find((p) => p.name === 'webhook').configured).toBe(true);
    expect(status.providers.find((p) => p.name === 'splunk').configured).toBe(false);
  });
});
