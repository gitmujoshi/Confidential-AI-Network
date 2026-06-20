/**
 * Role-based CRUD integration tests — all enterprise roles (TDP, TDC, TSP, AppAdmin).
 * Uses JWT auth (KEYCLOAK_ENABLED=false via role-crud.setup.js).
 */

const RoleCrudHarness = require('../helpers/role-crud-harness');
const {
  ROLES,
  ROLE_READ_ENDPOINTS,
  ADMIN_ONLY_PATHS,
} = require('../shared/role-crud-catalog');

const app = require('../test-server');

describe('Role CRUD Integration Suite', () => {
  let harness;

  beforeAll(async () => {
    harness = new RoleCrudHarness(app);
    await harness.createAllRoles();
  });

  afterAll(async () => {
    if (harness) {
      await harness.cleanup();
    }
  });

  describe('Role dashboard and read endpoints', () => {
    ROLES.forEach((role) => {
      describe(`${role} read surface`, () => {
        it('all catalogued read endpoints succeed', async () => {
          const user = harness.users[role];
          const userId = user.id;
          const endpoints =
            role === 'AppAdmin'
              ? ROLE_READ_ENDPOINTS.AppAdmin()
              : ROLE_READ_ENDPOINTS[role](userId);

          for (const { method, path, expectStatus } of endpoints) {
            const res = await harness.req(method, path, user);
            expect(res.status).toBe(expectStatus);
          }
        });
      });
    });
  });

  describe('Authorization boundaries', () => {
    it('denies non-admin roles from admin dashboard', async () => {
      for (const role of ['TDP', 'TDC', 'TSP']) {
        const res = await harness.req('GET', '/api/admin/dashboard', harness.users[role]);
        expect(res.status).toBe(403);
      }
    });

    it('denies cross-user TDP dashboard access', async () => {
      const tdc = harness.users.TDC;
      const tdpId = harness.users.TDP.id;
      const res = await harness.req('GET', `/api/tdp/dashboard/${tdpId}`, tdc);
      expect(res.status).toBe(403);
    });

    it('denies TDP from TSP dashboard', async () => {
      const tdp = harness.users.TDP;
      const tspId = harness.users.TSP.id;
      const res = await harness.req('GET', `/api/tsp/dashboard/${tspId}`, tdp);
      expect(res.status).toBe(403);
    });

    ADMIN_ONLY_PATHS.forEach(({ method, path }) => {
      it(`${method} ${path} requires AppAdmin`, async () => {
        const res = await harness.req(method, path, harness.users.TDC);
        expect([401, 403]).toContain(res.status);
      });
    });
  });

  describe('TDP dataset CRUD', () => {
    it('creates, reads, updates, and deletes a dataset', async () => {
      const { createRes, readRes, updateRes, deleteRes, datasetId } =
        await harness.datasetCrudForTdp();

      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
      expect(createRes.body.dataset.datasetId).toBe(datasetId);

      expect(readRes.status).toBe(200);
      expect(readRes.body.datasetId).toBe(datasetId);

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.dataset?.description || updateRes.body.description).toContain('Updated');

      expect(deleteRes.status).toBe(200);
    });
  });

  describe('Contract visibility by role', () => {
    beforeAll(async () => {
      await harness.createContractLinkingParties();
    });

    it('TDP sees contract via /api/contracts/user/:id', async () => {
      const res = await harness.req(
        'GET',
        `/api/contracts/user/${harness.users.TDP.id}`,
        harness.users.TDP
      );
      expect(res.status).toBe(200);
      expect(res.body.total).toBeGreaterThanOrEqual(1);
    });

    it('TDC sees contract via /api/contracts/user/:id', async () => {
      const res = await harness.req(
        'GET',
        `/api/contracts/user/${harness.users.TDC.id}`,
        harness.users.TDC
      );
      expect(res.status).toBe(200);
      expect(res.body.total).toBeGreaterThanOrEqual(1);
    });

    it('TSP sees contract via /api/contracts/user/:id', async () => {
      const res = await harness.req(
        'GET',
        `/api/contracts/user/${harness.users.TSP.id}`,
        harness.users.TSP
      );
      expect(res.status).toBe(200);
      expect(res.body.total).toBeGreaterThanOrEqual(1);
    });

    it('AppAdmin sees all contracts on admin endpoint', async () => {
      const res = await harness.req('GET', '/api/admin/contracts', harness.users.AppAdmin);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.contracts || res.body)).toBe(true);
    });
  });

  describe('TSP cloud provider update', () => {
    it('TSP can set exactly one cloud provider', async () => {
      const tsp = harness.users.TSP;
      const res = await harness.req('PUT', `/api/tsp/cloud-providers/${tsp.id}`, tsp, {
        cloudProviders: ['Azure'],
      });
      expect(res.status).toBe(200);
      expect(res.body.cloudProviders).toEqual(['Azure']);
    });

    it('rejects multiple cloud providers for TSP', async () => {
      const tsp = harness.users.TSP;
      const res = await harness.req('PUT', `/api/tsp/cloud-providers/${tsp.id}`, tsp, {
        cloudProviders: ['Azure', 'OCI'],
      });
      expect(res.status).toBe(400);
    });
  });

  describe('AppAdmin user management read', () => {
    it('lists users including seeded role-crud users', async () => {
      const res = await harness.req('GET', '/api/users', harness.users.AppAdmin);
      expect(res.status).toBe(200);
      const emails = (res.body.users || res.body).map((u) => u.email);
      expect(emails).toEqual(expect.arrayContaining([harness.users.TDP.email]));
    });
  });
});
