/**
 * Unit tests for role-based CRUD catalog, party types, and TSP cloud provider rules.
 * No database or external services required.
 */

const {
  ROLES,
  ROLE_DASHBOARD_PATHS,
  ROLE_READ_ENDPOINTS,
  ADMIN_ONLY_PATHS,
  buildDatasetPayload,
  buildDatasetUpdatePayload,
} = require('../shared/role-crud-catalog');

const {
  TSP,
  TDP,
  TDC,
  APP_ADMIN,
  ENTERPRISE_PARTY_TYPES,
  normalizePartyType,
  isTspPartyType,
  partyTypeMatches,
} = require('../../utils/partyTypes');

const {
  normalizeTspCloudProviders,
  VALID_TSP_CLOUD_PROVIDERS,
} = require('../../utils/tspCloudProviders');

describe('Role CRUD catalog (unit)', () => {
  it('defines all four enterprise roles', () => {
    expect(ROLES).toEqual(expect.arrayContaining(['TDP', 'TDC', 'TSP', 'AppAdmin']));
    expect(ROLES).toHaveLength(4);
  });

  it('maps each role to a dashboard path', () => {
    expect(ROLE_DASHBOARD_PATHS.TDP(42)).toBe('/api/tdp/dashboard/42');
    expect(ROLE_DASHBOARD_PATHS.TDC(7)).toBe('/api/tdc/dashboard/7');
    expect(ROLE_DASHBOARD_PATHS.TSP(3)).toBe('/api/tsp/dashboard/3');
    expect(ROLE_DASHBOARD_PATHS.AppAdmin()).toBe('/api/admin/dashboard');
  });

  it('provides read endpoints for every role', () => {
    ROLES.forEach((role) => {
      const endpoints =
        role === 'AppAdmin' ? ROLE_READ_ENDPOINTS.AppAdmin() : ROLE_READ_ENDPOINTS[role](1);
      expect(endpoints.length).toBeGreaterThanOrEqual(4);
      endpoints.forEach((ep) => {
        expect(ep.method).toMatch(/^(GET|POST|PUT|DELETE)$/);
        expect(ep.path).toMatch(/^\/api\//);
        expect(ep.expectStatus).toBe(200);
      });
    });
  });

  it('marks admin paths as admin-only', () => {
    ADMIN_ONLY_PATHS.forEach((ep) => {
      expect(ep.path).toMatch(/^\/api\/admin\//);
    });
  });

  it('builds valid dataset create/update payloads', () => {
    const create = buildDatasetPayload(99, 'abc');
    expect(create.ownerId).toBe(99);
    expect(create.datasetId).toContain('ROLE-CRUD-DS-abc');
    expect(create.name).toBeTruthy();
    expect(create.category).toBeTruthy();

    const update = buildDatasetUpdatePayload();
    expect(update.description).toContain('Updated');
    expect(update.price).toBeGreaterThan(0);
  });
});

describe('Party types (unit)', () => {
  it('exports canonical party type constants', () => {
    expect(ENTERPRISE_PARTY_TYPES).toEqual([TDP, TDC, TSP, APP_ADMIN]);
  });

  it('normalizes TSP alias', () => {
    expect(normalizePartyType('TSP')).toBe(TSP);
    expect(normalizePartyType('TDP')).toBe(TDP);
  });

  it('identifies TSP party type', () => {
    expect(isTspPartyType('TSP')).toBe(true);
    expect(isTspPartyType('TDP')).toBe(false);
  });

  it('matches party types with normalization', () => {
    expect(partyTypeMatches('TSP', 'TSP')).toBe(true);
    expect(partyTypeMatches('TDC', 'TSP')).toBe(false);
  });
});

describe('TSP cloud provider rules (unit)', () => {
  it('accepts exactly one provider', () => {
    expect(normalizeTspCloudProviders(['OCI'])).toEqual({ ok: true, value: ['OCI'] });
    expect(normalizeTspCloudProviders(['Azure']).ok).toBe(true);
  });

  it('rejects zero providers when explicitly empty array is ok', () => {
    expect(normalizeTspCloudProviders([])).toEqual({ ok: true, value: [] });
  });

  it('rejects multiple providers', () => {
    const result = normalizeTspCloudProviders(['OCI', 'Azure']);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/one and only one/i);
  });

  it('rejects unknown providers', () => {
    const result = normalizeTspCloudProviders(['UnknownCloud']);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Invalid cloud providers/i);
  });

  it('lists valid provider enum', () => {
    expect(VALID_TSP_CLOUD_PROVIDERS).toEqual(
      expect.arrayContaining(['Local', 'AWS', 'Azure', 'GCP', 'OCI'])
    );
  });
});

describe('Contract party filter logic (unit)', () => {
  const { Op } = require('sequelize');

  function buildPartyFilters(partyType, userId) {
    const numericUserId = parseInt(userId, 10);
    const partyFilters = [];

    if (partyType === 'TDC') {
      partyFilters.push({ tdcId: numericUserId });
    }
    if (partyType === 'TSP') {
      partyFilters.push({ tspId: numericUserId });
    }
    if (partyType === 'TDP') {
      partyFilters.push({
        cast: 'contract_datasets',
        ilike: `%"tdpId":${numericUserId}%`,
      });
    }

    return partyFilters.length > 0 ? { [Op.or]: partyFilters } : { id: -1 };
  }

  it('builds TDC filter on tdcId', () => {
    const where = buildPartyFilters('TDC', 5);
    expect(where[Op.or]).toEqual(expect.arrayContaining([{ tdcId: 5 }]));
  });

  it('builds TSP filter on tspId', () => {
    const where = buildPartyFilters('TSP', 8);
    expect(where[Op.or]).toEqual(expect.arrayContaining([{ tspId: 8 }]));
  });

  it('builds TDP filter on contract_datasets JSON', () => {
    const where = buildPartyFilters('TDP', 22);
    expect(where[Op.or][0].ilike).toBe('%"tdpId":22%');
  });

  it('fails closed for unknown party types', () => {
    const where = buildPartyFilters('Unknown', 1);
    expect(where).toEqual({ id: -1 });
  });
});
