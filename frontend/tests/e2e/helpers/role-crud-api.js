const axios = require('axios');
const { getBackendURL } = require('../../../load-config');

const PASSWORD = process.env.E2E_PASSWORD || 'TestNewPassword123!';

const E2E_ROLE_USERS = {
  TDP: { email: 'tdp.e2e@test.com', partyType: 'TDP' },
  TDC: { email: 'tdc.healthcare.2025-09-05t20-39-55@test.com', partyType: 'TDC' },
  TSP: { email: 'ccrp.e2e@test.com', partyType: 'TSP' },
  AppAdmin: { email: 'appadmin.e2e@test.com', partyType: 'AppAdmin' },
};

async function loginRole(role) {
  const backendURL = getBackendURL();
  const { email } = E2E_ROLE_USERS[role];
  const res = await axios.post(`${backendURL}/api/auth/login`, { email, password: PASSWORD });
  if (res.status !== 200 || !res.data?.accessToken || !res.data?.user) {
    throw new Error(`Login failed for ${role} (${email})`);
  }
  return {
    role,
    email,
    token: res.data.accessToken,
    user: res.data.user,
  };
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

async function apiRequest(roleSession, method, path, data) {
  const backendURL = getBackendURL();
  const config = {
    method,
    url: `${backendURL}${path}`,
    headers: authHeaders(roleSession.token),
    validateStatus: () => true,
  };
  if (data !== undefined) {
    config.data = data;
  }
  return axios(config);
}

function buildDatasetPayload(ownerId, suffix = Date.now()) {
  return {
    datasetId: `E2E-ROLE-CRUD-${suffix}`,
    name: `E2E Role CRUD Dataset ${suffix}`,
    description: 'Dataset created by Playwright role CRUD API suite',
    category: 'Tabular',
    size: 50,
    recordCount: 500,
    price: 15,
    license: 'MIT',
    ownerId,
    isPublic: true,
    metadata: { seededBy: 'role-crud-e2e' },
  };
}

module.exports = {
  PASSWORD,
  E2E_ROLE_USERS,
  loginRole,
  apiRequest,
  buildDatasetPayload,
};
