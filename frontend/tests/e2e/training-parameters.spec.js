const { test, expect } = require('@playwright/test');

test.describe('Training Parameters E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /login/i }).click();
    
    // Wait for dashboard to load
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should display max training runs field in contract creation', async ({ page }) => {
    // Navigate to contract creation
    await page.getByRole('link', { name: /contracts/i }).click();
    await page.getByRole('button', { name: /create contract/i }).click();
    
    // Should show training parameters section
    await expect(page.getByText(/training parameters/i)).toBeVisible();
    
    // Should show max training runs field
    await expect(page.getByLabel(/max training runs/i)).toBeVisible();
    
    // Should have default value
    await expect(page.getByLabel(/max training runs/i)).toHaveValue('5');
  });

  test('should allow editing max training runs value', async ({ page }) => {
    // Navigate to contract creation
    await page.getByRole('link', { name: /contracts/i }).click();
    await page.getByRole('button', { name: /create contract/i }).click();
    
    // Find and edit max training runs field
    const maxTrainingRunsField = page.getByLabel(/max training runs/i);
    await maxTrainingRunsField.clear();
    await maxTrainingRunsField.fill('10');
    
    // Should have updated value
    await expect(maxTrainingRunsField).toHaveValue('10');
  });

  test('should validate max training runs input', async ({ page }) => {
    // Navigate to contract creation
    await page.getByRole('link', { name: /contracts/i }).click();
    await page.getByRole('button', { name: /create contract/i }).click();
    
    // Try to enter invalid value
    const maxTrainingRunsField = page.getByLabel(/max training runs/i);
    await maxTrainingRunsField.clear();
    await maxTrainingRunsField.fill('-1');
    
    // Should show validation error
    await expect(page.getByText(/must be a positive number/i)).toBeVisible();
    
    // Try to enter zero
    await maxTrainingRunsField.clear();
    await maxTrainingRunsField.fill('0');
    
    // Should show validation error
    await expect(page.getByText(/must be greater than 0/i)).toBeVisible();
  });

  test('should save max training runs in contract', async ({ page }) => {
    // Navigate to contract creation
    await page.getByRole('link', { name: /contracts/i }).click();
    await page.getByRole('button', { name: /create contract/i }).click();
    
    // Fill basic contract information
    await page.getByLabel(/contract name/i).fill('Test Training Contract');
    await page.getByLabel(/description/i).fill('Test contract with max training runs');
    await page.getByLabel(/duration/i).fill('30');
    await page.getByLabel(/price/i).fill('1000');
    
    // Set max training runs
    await page.getByLabel(/max training runs/i).clear();
    await page.getByLabel(/max training runs/i).fill('15');
    
    // Fill other training parameters
    await page.getByLabel(/max privacy loss/i).fill('0.1');
    await page.getByLabel(/min accuracy/i).fill('0.85');
    
    // Submit contract
    await page.getByRole('button', { name: /create contract/i }).click();
    
    // Should show success message
    await expect(page.getByText(/contract created successfully/i)).toBeVisible();
  });

  test('should display max training runs in contract details', async ({ page }) => {
    // First create a contract with max training runs
    await page.getByRole('link', { name: /contracts/i }).click();
    await page.getByRole('button', { name: /create contract/i }).click();
    
    // Fill contract form
    await page.getByLabel(/contract name/i).fill('Test Contract for Display');
    await page.getByLabel(/description/i).fill('Test contract');
    await page.getByLabel(/duration/i).fill('30');
    await page.getByLabel(/price/i).fill('1000');
    await page.getByLabel(/max training runs/i).clear();
    await page.getByLabel(/max training runs/i).fill('8');
    await page.getByLabel(/max privacy loss/i).fill('0.1');
    await page.getByLabel(/min accuracy/i).fill('0.85');
    
    await page.getByRole('button', { name: /create contract/i }).click();
    await expect(page.getByText(/contract created successfully/i)).toBeVisible();
    
    // Navigate to contract details
    await page.getByRole('link', { name: /test contract for display/i }).click();
    
    // Should show max training runs in contract details
    await expect(page.getByText(/max training runs/i)).toBeVisible();
    await expect(page.getByText(/8/i)).toBeVisible();
  });

  test('should allow editing max training runs in contract details', async ({ page }) => {
    // Navigate to contract details
    await page.getByRole('link', { name: /contracts/i }).click();
    await page.getByRole('link', { name: /test contract/i }).click();
    
    // Click edit button
    await page.getByRole('button', { name: /edit/i }).click();
    
    // Should be able to edit max training runs
    const maxTrainingRunsField = page.getByLabel(/max training runs/i);
    await expect(maxTrainingRunsField).toBeVisible();
    
    // Update the value
    await maxTrainingRunsField.clear();
    await maxTrainingRunsField.fill('12');
    
    // Save changes
    await page.getByRole('button', { name: /save/i }).click();
    
    // Should show success message
    await expect(page.getByText(/contract updated successfully/i)).toBeVisible();
    
    // Should show updated value
    await expect(page.getByText(/12/i)).toBeVisible();
  });

  test('should display training parameters in JSON format', async ({ page }) => {
    // Navigate to contract details
    await page.getByRole('link', { name: /contracts/i }).click();
    await page.getByRole('link', { name: /test contract/i }).click();
    
    // Should show training parameters section
    await expect(page.getByText(/training parameters/i)).toBeVisible();
    
    // Should show JSON view of training parameters
    await expect(page.getByText(/"maxTrainingRuns"/)).toBeVisible();
    await expect(page.getByText(/"maxPrivacyLoss"/)).toBeVisible();
    await expect(page.getByText(/"minAccuracy"/)).toBeVisible();
  });

  test('should handle training parameters form validation', async ({ page }) => {
    // Navigate to contract creation
    await page.getByRole('link', { name: /contracts/i }).click();
    await page.getByRole('button', { name: /create contract/i }).click();
    
    // Try to submit without required fields
    await page.getByRole('button', { name: /create contract/i }).click();
    
    // Should show validation errors
    await expect(page.getByText(/contract name is required/i)).toBeVisible();
    await expect(page.getByText(/description is required/i)).toBeVisible();
    
    // Fill required fields but leave max training runs empty
    await page.getByLabel(/contract name/i).fill('Test Contract');
    await page.getByLabel(/description/i).fill('Test description');
    await page.getByLabel(/duration/i).fill('30');
    await page.getByLabel(/price/i).fill('1000');
    
    // Clear max training runs
    await page.getByLabel(/max training runs/i).clear();
    
    // Should use default value or show validation
    await expect(page.getByLabel(/max training runs/i)).toHaveValue('5');
  });

  test('should handle training parameters in different contract types', async ({ page }) => {
    // Navigate to contract creation
    await page.getByRole('link', { name: /contracts/i }).click();
    await page.getByRole('button', { name: /create contract/i }).click();
    
    // Should show max training runs for all contract types
    await expect(page.getByLabel(/max training runs/i)).toBeVisible();
    
    // Change contract type if available
    const contractTypeSelect = page.getByLabel(/contract type/i);
    if (await contractTypeSelect.isVisible()) {
      await contractTypeSelect.selectOption('AI_TRAINING');
      
      // Should still show max training runs
      await expect(page.getByLabel(/max training runs/i)).toBeVisible();
    }
  });

  test('should export training parameters with contract', async ({ page }) => {
    // Navigate to contract details
    await page.getByRole('link', { name: /contracts/i }).click();
    await page.getByRole('link', { name: /test contract/i }).click();
    
    // Click export button
    await page.getByRole('button', { name: /export/i }).click();
    
    // Should download contract with training parameters
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /download json/i }).click();
    const download = await downloadPromise;
    
    // Should have meaningful filename
    expect(download.suggestedFilename()).toContain('contract');
    expect(download.suggestedFilename()).toContain('.json');
  });
}); 