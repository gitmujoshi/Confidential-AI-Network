/**
 * Hugging Face dev API integration (test-server, no Hub network calls).
 */

const request = require('supertest');

describe('Hugging Face dev API (integration)', () => {
  let app;

  beforeAll(() => {
    process.env.HUGGINGFACE_INTEGRATION_ENABLED = 'true';
    process.env.NODE_ENV = 'test';
    jest.resetModules();
    app = require('../test-server');
  });

  test('GET /api/dev/huggingface/status returns enabled config', async () => {
    const res = await request(app).get('/api/dev/huggingface/status');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.enabled).toBe(true);
    expect(res.body).toHaveProperty('hubBaseUrl');
    expect(res.body).toHaveProperty('sovereigntyMode');
  });

  test('POST /api/dev/huggingface/validate rejects invalid model repoId', async () => {
    const res = await request(app)
      .post('/api/dev/huggingface/validate')
      .send({ repoType: 'model', repoId: 'not-a-valid-repo' });
    expect(res.status).toBe(400);
  });

  test('POST /api/dev/huggingface/validate accepts dataset id without org prefix', async () => {
    const res = await request(app)
      .post('/api/dev/huggingface/validate')
      .send({ repoType: 'dataset', repoId: 'ag_news' });
    // Hub fetch may fail offline (502) or succeed online (200); shape must be valid when not 400
    expect([200, 502]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body.normalized.repoId).toBe('ag_news');
    } else {
      expect(res.body.normalized.repoId).toBe('ag_news');
    }
  });

  test('GET /api/debug/env includes huggingface block', async () => {
    const res = await request(app).get('/api/debug/env');
    expect(res.status).toBe(200);
    expect(res.body.huggingface).toBeDefined();
    expect(typeof res.body.huggingface.integrationEnabled).toBe('boolean');
    expect(typeof res.body.huggingface.tokenConfigured).toBe('boolean');
  });

  test('returns 403 when integration disabled', async () => {
    const prev = process.env.HUGGINGFACE_INTEGRATION_ENABLED;
    process.env.HUGGINGFACE_INTEGRATION_ENABLED = 'false';
    jest.resetModules();
    const disabledApp = require('../test-server');
    const res = await request(disabledApp).get('/api/dev/huggingface/status');
    expect(res.status).toBe(403);
    process.env.HUGGINGFACE_INTEGRATION_ENABLED = prev;
  });
});
