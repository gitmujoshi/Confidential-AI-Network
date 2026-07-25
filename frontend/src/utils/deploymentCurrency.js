/**
 * Format amounts using deployment currency from DEPA config (`DEPLOYMENT_CURRENCY`).
 * No FX conversion — values are displayed in the deployment's configured currency code.
 */

const LOCALE_BY_CURRENCY = {
  USD: 'en-US',
  INR: 'en-IN',
  EUR: 'en-IE',
  GBP: 'en-GB',
};

export function localeForCurrency(currencyCode) {
  const code = String(currencyCode || 'USD').toUpperCase();
  return LOCALE_BY_CURRENCY[code] || 'en-US';
}

export function formatDeploymentCurrency(amount, currencyCode = 'USD') {
  const currency = String(currencyCode || 'USD').toUpperCase();
  const value = Number(amount);
  const safe = Number.isFinite(value) ? value : 0;
  try {
    return new Intl.NumberFormat(localeForCurrency(currency), {
      style: 'currency',
      currency,
    }).format(safe);
  } catch (_) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(safe);
  }
}
