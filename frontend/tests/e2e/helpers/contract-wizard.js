const { expect } = require('@playwright/test');

/**
 * Fill KMS fields on the Create Contract environment step.
 * UI label is "Key ID / OCID / ARN". Close the MUI listbox before typing.
 */
async function fillKmsFields(page) {
  const heading = page.getByRole('heading', { name: /Key Management Service/i });
  await expect(heading).toBeVisible({ timeout: 20_000 });
  await heading.scrollIntoViewIfNeeded();

  const provider = page.getByTestId('kms-provider').or(page.getByRole('combobox', { name: /KMS Provider/i }));
  await expect(provider).toBeVisible({ timeout: 15_000 });
  await provider.click();

  const vault = page.getByRole('option', { name: /HashiCorp Vault/i });
  await expect(vault).toBeVisible({ timeout: 10_000 });
  await vault.click();

  await expect(page.getByRole('listbox')).toHaveCount(0, { timeout: 10_000 });
  await page.keyboard.press('Escape').catch(() => {});
  await expect(page.locator('.MuiModal-root')).toHaveCount(0, { timeout: 5_000 }).catch(() => {});

  const keyId = page.getByTestId('kms-key-id').or(page.getByLabel(/Key ID/i));
  await expect(keyId).toBeVisible({ timeout: 10_000 });
  await keyId.fill('e2e-local-key');
  await page.getByLabel('Encryption Algorithm').fill('AES-256-GCM');
  await page.getByLabel('Key Rotation Period (days)').fill('90');
}

module.exports = { fillKmsFields };
