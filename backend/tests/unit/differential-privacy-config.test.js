const { normalizeDifferentialPrivacy, mergeDifferentialPrivacy } = require('../../services/differentialPrivacyConfig');

describe('differential privacy budget', () => {
  test('accepts epsilon inside the saved cap', () => {
    expect(normalizeDifferentialPrivacy({
      enabled: true,
      epsilon: 0.5,
      delta: 1e-5,
      budgetCap: 1,
    })).toMatchObject({ enabled: true, epsilon: 0.5, budgetCap: 1 });
  });

  test('rejects epsilon above the saved cap', () => {
    expect(() => normalizeDifferentialPrivacy({
      enabled: true,
      epsilon: 2,
      delta: 1e-5,
      budgetCap: 1,
    })).toThrow(/budgetCap/);
  });

  test('merges a scenario update onto an existing contract budget', () => {
    const next = mergeDifferentialPrivacy(
      { enabled: false, mechanism: 'dp-sgd' },
      { epsilon: 0.4, delta: 1e-5, budgetCap: 1 }
    );
    expect(next.enabled).toBe(true);
    expect(next.epsilon).toBe(0.4);
    expect(next.budgetCap).toBe(1);
    expect(next.mechanism).toBe('dp-sgd');
  });
});
