const {
  normalizeTspCloudProviders,
  primaryTspCloudProvider,
  VALID_TSP_CLOUD_PROVIDERS,
} = require('../../utils/tspCloudProviders');

describe('TSP cloud provider rules', () => {
  it('accepts a single valid provider', () => {
    const result = normalizeTspCloudProviders(['Azure']);
    expect(result.ok).toBe(true);
    expect(result.value).toEqual(['Azure']);
  });

  it('rejects multiple providers', () => {
    const result = normalizeTspCloudProviders(['Azure', 'AWS']);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/one and only one/i);
  });

  it('rejects invalid provider names', () => {
    const result = normalizeTspCloudProviders(['DigitalOcean']);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Invalid cloud providers/);
  });

  it('returns primary provider from array', () => {
    expect(primaryTspCloudProvider(['OCI'])).toBe('OCI');
    expect(primaryTspCloudProvider([])).toBeNull();
  });

  it('lists supported providers', () => {
    expect(VALID_TSP_CLOUD_PROVIDERS).toContain('Local');
    expect(VALID_TSP_CLOUD_PROVIDERS).toHaveLength(5);
  });
});
