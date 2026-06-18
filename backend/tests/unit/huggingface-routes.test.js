const express = require('express');
const request = require('supertest');

describe('huggingface routes', () => {
  let app;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, NODE_ENV: 'test' };
    app = express();
    app.use(express.json());
    // Fresh router load picks up env per test
    const hfRouter = require('../../routes/huggingface');
    app.use('/api/dev/huggingface', hfRouter);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns 403 when integration disabled', async () => {
    delete process.env.HUGGINGFACE_INTEGRATION_ENABLED;
    const res = await request(app).get('/api/dev/huggingface/status');
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/disabled/i);
  });

  it('returns status when enabled in test env', async () => {
    process.env.HUGGINGFACE_INTEGRATION_ENABLED = 'true';
    jest.resetModules();
    const hfRouter = require('../../routes/huggingface');
    const testApp = express();
    testApp.use('/api/dev/huggingface', hfRouter);

    const res = await request(testApp).get('/api/dev/huggingface/status');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.enabled).toBe(true);
  });

  it('rejects invalid repoId on validate', async () => {
    process.env.HUGGINGFACE_INTEGRATION_ENABLED = 'true';
    jest.resetModules();
    const hfRouter = require('../../routes/huggingface');
    const testApp = express();
    testApp.use(express.json());
    testApp.use('/api/dev/huggingface', hfRouter);

    const res = await request(testApp)
      .post('/api/dev/huggingface/validate')
      .send({ repoType: 'model', repoId: 'not-valid' });
    expect(res.status).toBe(400);
  });
});
