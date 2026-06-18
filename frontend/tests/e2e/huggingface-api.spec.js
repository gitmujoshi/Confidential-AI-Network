const { test, expect } = require('@playwright/test');
const { getBackendURL } = require('../../load-config');

test.describe('Hugging Face dev API (E2E)', () => {
  test('debug env exposes huggingface configuration', async ({ request }) => {
    const backendURL = getBackendURL();
    const res = await request.get(`${backendURL}/api/debug/env`);
    expect(res.ok(), `debug/env failed: ${res.status()}`).toBeTruthy();
    const body = await res.json();
    expect(body.huggingface).toBeDefined();
    expect(typeof body.huggingface.integrationEnabled).toBe('boolean');
    expect(typeof body.huggingface.tokenConfigured).toBe('boolean');
    expect(body.huggingface).toHaveProperty('sovereigntyMode');
  });

  test('dev API status matches integrationEnabled flag', async ({ request }) => {
    const backendURL = getBackendURL();
    const envRes = await request.get(`${backendURL}/api/debug/env`);
    expect(envRes.ok()).toBeTruthy();
    const enabled = (await envRes.json()).huggingface?.integrationEnabled === true;

    const statusRes = await request.get(`${backendURL}/api/dev/huggingface/status`);
    if (enabled) {
      expect(statusRes.status()).toBe(200);
      const body = await statusRes.json();
      expect(body.success).toBe(true);
      expect(body.enabled).toBe(true);
      expect(body.hubBaseUrl).toBeTruthy();
    } else {
      expect(statusRes.status()).toBe(403);
      const body = await statusRes.json();
      expect(body.error).toMatch(/disabled/i);
    }
  });

  test('validate rejects invalid model repo when integration enabled', async ({ request }) => {
    const backendURL = getBackendURL();
    const envRes = await request.get(`${backendURL}/api/debug/env`);
    const enabled = (await envRes.json()).huggingface?.integrationEnabled === true;
    test.skip(!enabled, 'Set HUGGINGFACE_INTEGRATION_ENABLED=true on backend (NODE_ENV=test|development)');

    const res = await request.post(`${backendURL}/api/dev/huggingface/validate`, {
      data: { repoType: 'model', repoId: 'invalid-repo-id' },
    });
    expect(res.status()).toBe(400);
  });

  test('validate accepts ag_news dataset id when integration enabled', async ({ request }) => {
    const backendURL = getBackendURL();
    const envRes = await request.get(`${backendURL}/api/debug/env`);
    const enabled = (await envRes.json()).huggingface?.integrationEnabled === true;
    test.skip(!enabled, 'Set HUGGINGFACE_INTEGRATION_ENABLED=true on backend (NODE_ENV=test|development)');

    const res = await request.post(`${backendURL}/api/dev/huggingface/validate`, {
      data: { repoType: 'dataset', repoId: 'ag_news' },
    });
    // Offline CI may get 502 from Hub; online dev gets 200
    expect([200, 502]).toContain(res.status());
    const body = await res.json();
    expect(body.normalized?.repoId).toBe('ag_news');
  });
});
