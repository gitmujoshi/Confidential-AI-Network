/**
 * Canonical role-based API surface for CRUD / read smoke tests.
 * Used by unit, integration, and E2E API suites.
 */

const ROLES = ['TDP', 'TDC', 'TSP', 'AppAdmin'];

const ROLE_DASHBOARD_PATHS = {
  TDP: (userId) => `/api/tdp/dashboard/${userId}`,
  TDC: (userId) => `/api/tdc/dashboard/${userId}`,
  TSP: (userId) => `/api/tsp/dashboard/${userId}`,
  AppAdmin: () => '/api/admin/dashboard',
};

const ROLE_READ_ENDPOINTS = {
  TDP: (userId) => [
    { method: 'GET', path: `/api/tdp/dashboard/${userId}`, expectStatus: 200 },
    { method: 'GET', path: `/api/tdp/datasets/${userId}`, expectStatus: 200 },
    { method: 'GET', path: `/api/tdp/contracts/${userId}`, expectStatus: 200 },
    { method: 'GET', path: `/api/contracts/user/${userId}`, expectStatus: 200 },
    { method: 'GET', path: `/api/datasets/owner/${userId}`, expectStatus: 200 },
  ],
  TDC: (userId) => [
    { method: 'GET', path: `/api/tdc/dashboard/${userId}`, expectStatus: 200 },
    { method: 'GET', path: `/api/tdc/contracts/${userId}`, expectStatus: 200 },
    { method: 'GET', path: `/api/tdc/training/${userId}`, expectStatus: 200 },
    { method: 'GET', path: `/api/contracts/user/${userId}`, expectStatus: 200 },
    { method: 'GET', path: '/api/datasets/public', expectStatus: 200 },
  ],
  TSP: (userId) => [
    { method: 'GET', path: `/api/tsp/dashboard/${userId}`, expectStatus: 200 },
    { method: 'GET', path: `/api/tsp/contracts/${userId}`, expectStatus: 200 },
    { method: 'GET', path: `/api/tsp/cloud-providers/${userId}`, expectStatus: 200 },
    { method: 'GET', path: `/api/tsp/environments/${userId}`, expectStatus: 200 },
    { method: 'GET', path: `/api/contracts/user/${userId}`, expectStatus: 200 },
  ],
  AppAdmin: () => [
    { method: 'GET', path: '/api/admin/dashboard', expectStatus: 200 },
    { method: 'GET', path: '/api/admin/users', expectStatus: 200 },
    { method: 'GET', path: '/api/admin/contracts', expectStatus: 200 },
    { method: 'GET', path: '/api/admin/datasets', expectStatus: 200 },
    { method: 'GET', path: '/api/users/tsp', expectStatus: 200 },
  ],
};

/** Cross-role paths that must be forbidden (403/401) for non-admin roles. */
const ADMIN_ONLY_PATHS = [
  { method: 'GET', path: '/api/admin/dashboard' },
  { method: 'GET', path: '/api/admin/users' },
];

function buildDatasetPayload(ownerId, suffix = Date.now()) {
  return {
    datasetId: `ROLE-CRUD-DS-${suffix}`,
    name: `Role CRUD Dataset ${suffix}`,
    description: 'Dataset created by role CRUD test suite',
    category: 'Tabular',
    size: 100,
    recordCount: 1000,
    price: 25.0,
    license: 'MIT',
    ownerId,
    isPublic: true,
    metadata: { seededBy: 'role-crud-suite' },
  };
}

function buildDatasetUpdatePayload() {
  return {
    description: 'Updated by role CRUD test suite',
    price: 30.0,
  };
}

module.exports = {
  ROLES,
  ROLE_DASHBOARD_PATHS,
  ROLE_READ_ENDPOINTS,
  ADMIN_ONLY_PATHS,
  buildDatasetPayload,
  buildDatasetUpdatePayload,
};
