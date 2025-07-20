const { test, expect } = require('@playwright/test');

test.describe('Contract Management E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /login/i }).click();
    
    // Wait for dashboard to load
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should navigate to contracts page', async ({ page }) => {
    // Click on contracts navigation
    await page.getByRole('link', { name: /contracts/i }).click();
    
    // Should be on contracts page
    await expect(page).toHaveURL(/.*contracts/);
    await expect(page.getByRole('heading', { name: /contracts/i })).toBeVisible();
  });

  test('should create a new contract', async ({ page }) => {
    // Navigate to contracts page
    await page.getByRole('link', { name: /contracts/i }).click();
    
    // Click create contract button
    await page.getByRole('button', { name: /create contract/i }).click();
    
    // Should be on contract creation page
    await expect(page).toHaveURL(/.*create.*contract/);
    await expect(page.getByRole('heading', { name: /create contract/i })).toBeVisible();
    
    // Fill contract form
    await page.getByLabel(/contract name/i).fill('Test Contract');
    await page.getByLabel(/description/i).fill('Test contract description');
    await page.getByLabel(/duration/i).fill('30');
    await page.getByLabel(/price/i).fill('1000');
    
    // Select dataset
    await page.getByLabel(/dataset/i).click();
    await page.getByRole('option', { name: /test dataset/i }).click();
    
    // Fill training parameters
    await page.getByLabel(/max privacy loss/i).fill('0.1');
    await page.getByLabel(/min accuracy/i).fill('0.85');
    await page.getByLabel(/max training runs/i).fill('5');
    
    // Fill environment specs
    await page.getByLabel(/compute type/i).fill('confidential-vm');
    await page.getByLabel(/memory gb/i).fill('32');
    await page.getByLabel(/cpu cores/i).fill('8');
    
    // Submit contract
    await page.getByRole('button', { name: /create contract/i }).click();
    
    // Should show success message
    await expect(page.getByText(/contract created successfully/i)).toBeVisible();
  });

  test('should view contract details', async ({ page }) => {
    // Navigate to contracts page
    await page.getByRole('link', { name: /contracts/i }).click();
    
    // Click on a contract to view details
    await page.getByRole('link', { name: /test contract/i }).click();
    
    // Should show contract details
    await expect(page.getByText(/contract details/i)).toBeVisible();
    await expect(page.getByText(/test contract/i)).toBeVisible();
    await expect(page.getByText(/test contract description/i)).toBeVisible();
  });

  test('should edit contract', async ({ page }) => {
    // Navigate to contract details
    await page.getByRole('link', { name: /contracts/i }).click();
    await page.getByRole('link', { name: /test contract/i }).click();
    
    // Click edit button
    await page.getByRole('button', { name: /edit/i }).click();
    
    // Should be in edit mode
    await expect(page.getByLabel(/contract name/i)).toBeVisible();
    
    // Update contract name
    await page.getByLabel(/contract name/i).clear();
    await page.getByLabel(/contract name/i).fill('Updated Test Contract');
    
    // Save changes
    await page.getByRole('button', { name: /save/i }).click();
    
    // Should show success message
    await expect(page.getByText(/contract updated successfully/i)).toBeVisible();
  });

  test('should filter contracts', async ({ page }) => {
    // Navigate to contracts page
    await page.getByRole('link', { name: /contracts/i }).click();
    
    // Use search filter
    await page.getByPlaceholder(/search contracts/i).fill('test');
    
    // Should show filtered results
    await expect(page.getByText(/test contract/i)).toBeVisible();
  });

  test('should sign contract', async ({ page }) => {
    // Navigate to contract details
    await page.getByRole('link', { name: /contracts/i }).click();
    await page.getByRole('link', { name: /test contract/i }).click();
    
    // Click sign button
    await page.getByRole('button', { name: /sign contract/i }).click();
    
    // Should show signing modal
    await expect(page.getByText(/sign contract/i)).toBeVisible();
    
    // Fill signing form
    await page.getByLabel(/wallet address/i).fill('0x1234567890123456789012345678901234567890');
    await page.getByLabel(/signature/i).fill('test-signature');
    
    // Submit signature
    await page.getByRole('button', { name: /confirm signature/i }).click();
    
    // Should show success message
    await expect(page.getByText(/contract signed successfully/i)).toBeVisible();
  });

  test('should view contract status', async ({ page }) => {
    // Navigate to contract details
    await page.getByRole('link', { name: /contracts/i }).click();
    await page.getByRole('link', { name: /test contract/i }).click();
    
    // Should show contract status
    await expect(page.getByText(/status/i)).toBeVisible();
    await expect(page.getByText(/pending/i)).toBeVisible();
  });

  test('should handle contract deletion', async ({ page }) => {
    // Navigate to contract details
    await page.getByRole('link', { name: /contracts/i }).click();
    await page.getByRole('link', { name: /test contract/i }).click();
    
    // Click delete button
    await page.getByRole('button', { name: /delete/i }).click();
    
    // Should show confirmation dialog
    await expect(page.getByText(/are you sure/i)).toBeVisible();
    
    // Confirm deletion
    await page.getByRole('button', { name: /confirm/i }).click();
    
    // Should show success message
    await expect(page.getByText(/contract deleted successfully/i)).toBeVisible();
  });
}); 