function isDifferentialPrivacyEnabled(dp) {
  return (
    dp === true ||
    (dp &&
      typeof dp === 'object' &&
      (dp.enabled === true || dp.enabled === 'true' || dp.enabled === 1 || dp.enabled === '1'))
  );
}

function fail(message, code) {
  const err = new Error(message);
  err.statusCode = 400;
  if (code) err.code = code;
  return err;
}

/**
 * Validate a differential-privacy budget.
 * Returns null when DP is off. Throws when it is on and epsilon, delta, or budgetCap is unusable.
 */
function normalizeDifferentialPrivacy(input) {
  if (!isDifferentialPrivacyEnabled(input)) return null;
  const epsilon = input && typeof input === 'object' ? Number(input.epsilon) : NaN;
  const delta = input && typeof input === 'object' ? Number(input.delta) : NaN;
  const hasCap = input && typeof input === 'object' && input.budgetCap != null && input.budgetCap !== '';
  const budgetCap = hasCap ? Number(input.budgetCap) : null;

  if (!Number.isFinite(epsilon) || epsilon <= 0) {
    throw fail(
      'Differential privacy is enabled but epsilon is missing/invalid (trainingParams.differentialPrivacy.epsilon)'
    );
  }
  if (!Number.isFinite(delta) || delta <= 0 || delta >= 1) {
    throw fail(
      'Differential privacy is enabled but delta is missing/invalid (trainingParams.differentialPrivacy.delta)'
    );
  }
  if (hasCap && (!Number.isFinite(budgetCap) || budgetCap <= 0)) {
    throw fail('Differential privacy budgetCap must be a number greater than 0', 'DP_BUDGET_INVALID');
  }
  if (budgetCap != null && epsilon > budgetCap) {
    throw fail('Differential privacy epsilon exceeds the saved budgetCap', 'DP_BUDGET_EXCEEDED');
  }

  return {
    enabled: true,
    epsilon,
    delta,
    ...(budgetCap != null ? { budgetCap } : {}),
  };
}

function mergeDifferentialPrivacy(existing, patch) {
  const prior = existing && typeof existing === 'object' ? existing : {};
  const next = normalizeDifferentialPrivacy({
    enabled: true,
    epsilon: patch.epsilon,
    delta: patch.delta,
    budgetCap: patch.budgetCap != null ? patch.budgetCap : prior.budgetCap,
    mechanism: patch.mechanism || prior.mechanism,
    clipNorm: patch.clipNorm != null ? patch.clipNorm : prior.clipNorm,
  });
  return {
    ...prior,
    ...next,
    ...(prior.mechanism && !patch.mechanism ? { mechanism: prior.mechanism } : {}),
    ...(prior.clipNorm != null && patch.clipNorm == null ? { clipNorm: prior.clipNorm } : {}),
  };
}

module.exports = {
  isDifferentialPrivacyEnabled,
  normalizeDifferentialPrivacy,
  mergeDifferentialPrivacy,
};
