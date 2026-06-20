/**
 * E2E API tests — role-based read surfaces and TDP dataset CRUD against live backend.
 */
const { test, expect } = require('@playwright/test');
const {
  loginRole,
  apiRequest,
  buildDatasetPayload,
  E2E_ROLE_USERS,
} = require('./helpers/role-crud-api');

test.describe('Role CRUD API (live backend)', () => {
  test.describe.configure({ mode: 'serial' });

  const sessions = {};

  test.beforeAll(async () => {
    for (const role of Object.keys(E2E_ROLE_USERS)) {
      sessions[role] = await loginRole(role);
    }
  });

  test('TDP dashboard and dataset endpoints respond', async () => {
    const { user } = sessions.TDP;

    const dash = await apiRequest(sessions.TDP, 'GET', `/api/tdp/dashboard/${user.id}`);
    expect(dash.status).toBe(200);

    const datasets = await apiRequest(sessions.TDP, 'GET', `/api/tdp/datasets/${user.id}`);
    expect(datasets.status).toBe(200);

    const contracts = await apiRequest(sessions.TDP, 'GET', `/api/contracts/user/${user.id}`);
    expect(contracts.status).toBe(200);
    expect(contracts.data).toHaveProperty('contracts');
  });

  test('TDC dashboard and training endpoints respond', async () => {
    const { user } = sessions.TDC;

    const dash = await apiRequest(sessions.TDC, 'GET', `/api/tdc/dashboard/${user.id}`);
    expect(dash.status).toBe(200);

    const training = await apiRequest(sessions.TDC, 'GET', `/api/tdc/training/${user.id}`);
    expect(training.status).toBe(200);

    const publicDs = await apiRequest(sessions.TDC, 'GET', '/api/datasets/public');
    expect(publicDs.status).toBe(200);
  });

  test('TSP dashboard and cloud provider endpoints respond', async () => {
    const { user } = sessions.TSP;

    const dash = await apiRequest(sessions.TSP, 'GET', `/api/tsp/dashboard/${user.id}`);
    expect(dash.status).toBe(200);

    const providers = await apiRequest(sessions.TSP, 'GET', `/api/tsp/cloud-providers/${user.id}`);
    expect(providers.status).toBe(200);
    expect(providers.data).toHaveProperty('cloudProviders');
  });

  test('AppAdmin admin surfaces respond', async () => {
    const dash = await apiRequest(sessions.AppAdmin, 'GET', '/api/admin/dashboard');
    expect(dash.status).toBe(200);

    const users = await apiRequest(sessions.AppAdmin, 'GET', '/api/admin/users');
    expect(users.status).toBe(200);
    expect(users.data.users?.length).toBeGreaterThan(0);

    const contracts = await apiRequest(sessions.AppAdmin, 'GET', '/api/admin/contracts');
    expect(contracts.status).toBe(200);
  });

  test('non-admin cannot access admin dashboard', async () => {
    const res = await apiRequest(sessions.TDP, 'GET', '/api/admin/dashboard');
    expect(res.status).toBe(403);
  });

  test('TDP dataset CRUD lifecycle', async () => {
    const { user } = sessions.TDP;
    const payload = buildDatasetPayload(user.id);

    const create = await apiRequest(sessions.TDP, 'POST', '/api/datasets', payload);
    expect(create.status).toBe(201);
    expect(create.data.dataset.datasetId).toBe(payload.datasetId);

    const read = await apiRequest(sessions.TDP, 'GET', `/api/datasets/${payload.datasetId}`);
    expect(read.status).toBe(200);

    const update = await apiRequest(sessions.TDP, 'PUT', `/api/datasets/${payload.datasetId}`, {
      description: 'Updated by E2E role CRUD suite',
      price: 20,
    });
    expect(update.status).toBe(200);

    const del = await apiRequest(sessions.TDP, 'DELETE', `/api/datasets/${payload.datasetId}`);
    expect(del.status).toBe(200);
    expect(del.data.success).toBe(true);
  });

  test('TSP enforces single cloud provider', async () => {
    const { user } = sessions.TSP;

    const ok = await apiRequest(sessions.TSP, 'PUT', `/api/tsp/cloud-providers/${user.id}`, {
      cloudProviders: ['Local'],
    });
    expect(ok.status).toBe(200);

    const bad = await apiRequest(sessions.TSP, 'PUT', `/api/tsp/cloud-providers/${user.id}`, {
      cloudProviders: ['Local', 'Azure'],
    });
    expect(bad.status).toBe(400);
  });
});
